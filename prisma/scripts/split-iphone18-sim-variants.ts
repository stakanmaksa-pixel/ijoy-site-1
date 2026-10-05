/** Split existing unpriced iPhone 18 options by SIM, only for offers in the owner's price list. */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import {
  normalizeForMatch, normalizedIphoneSim, normalizedMemory, parsePriceListText,
} from "../../src/lib/priceImport";

const sourcePath = path.resolve("prisma/data/owner-price-2026-10-04.txt");
const input = readFileSync(sourcePath, "utf8");
const apply = process.argv.includes("--apply");
const approvedHash = process.argv.find((arg) => arg.startsWith("--approve="))?.slice(10);
const models = ["iPhone 18 Pro", "iPhone 18 Pro Max"];
type Sim = "eSIM" | "SIM+eSIM";

function sourceGroups() {
  const groups = new Map<string, { model: string; memory: string; color: string; sims: Set<Sim> }>();
  for (const line of parsePriceListText(input)) {
    const model = line.phoneModel;
    if (!model || !models.includes(model) || !line.parsedPrice || line.parsedPrice <= 0) continue;
    const memory = normalizedMemory(line.parsedMemory);
    const color = normalizeForMatch(line.parsedColor ?? "");
    const sim = normalizedIphoneSim(line.parsedRegion, model);
    if (!memory || !color || (sim !== "eSIM" && sim !== "SIM+eSIM")) {
      throw new Error(`Неоднозначная строка iPhone 18: ${line.rawLine}`);
    }
    const key = [model, memory, color].join("|");
    const group = groups.get(key) ?? { model, memory, color, sims: new Set<Sim>() };
    group.sims.add(sim);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) =>
    [a.model, a.memory, a.color].join("|").localeCompare([b.model, b.memory, b.color].join("|")));
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL отсутствует; база не изменена");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const products = await prisma.product.findMany({
      where: { name: { in: models } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, variants: { select: {
        id: true, memory: true, color: true, region: true, sku: true, price: true,
        inStock: true, rawLabel: true, _count: { select: { orderItems: true } },
      }, orderBy: { id: "asc" } } },
    });
    if (products.length !== 2 || models.some((model) => products.filter((product) => product.name === model).length !== 1)) {
      throw new Error("Не найдены обе единственные карточки iPhone 18 Pro/Pro Max; база не изменена");
    }
    const referenced = new Set((await prisma.priceImportLine.findMany({
      where: { matchedVariantId: { in: products.flatMap((product) => product.variants.map((variant) => variant.id)) } },
      select: { matchedVariantId: true },
    })).map((line) => line.matchedVariantId));
    const actions: Array<{
      productId: string; productName: string; memory: string; color: string;
      sim: Sim; kind: "reuse" | "create" | "exists"; variantId: string | null;
    }> = [];
    const errors: string[] = [];
    for (const group of sourceGroups()) {
      const product = products.find((item) => item.name === group.model)!;
      const same = product.variants.filter((variant) =>
        normalizedMemory(variant.memory) === group.memory &&
        normalizeForMatch(variant.color ?? "") === group.color);
      const generic = same.filter((variant) => !normalizedIphoneSim(variant.region, group.model));
      const sims = [...group.sims].sort((a, b) => a === "eSIM" ? -1 : b === "eSIM" ? 1 : 0);
      const missing = sims.filter((sim) => !same.some((variant) => normalizedIphoneSim(variant.region, group.model) === sim));
      const present = sims.filter((sim) => same.some((variant) => normalizedIphoneSim(variant.region, group.model) === sim));
      for (const sim of present) {
        const existing = same.filter((variant) => normalizedIphoneSim(variant.region, group.model) === sim);
        if (existing.length !== 1) errors.push(`${group.model} ${group.memory} ${group.color} ${sim}: несколько существующих вариантов`);
        else actions.push({ productId: product.id, productName: group.model, memory: existing[0].memory!, color: existing[0].color!, sim, kind: "exists", variantId: existing[0].id });
      }
      if (!missing.length) continue;
      if (generic.length !== 1) {
        errors.push(`${group.model} ${group.memory} ${group.color}: ожидается один общий вариант, найдено ${generic.length}`);
        continue;
      }
      const base = generic[0];
      if (base.price !== null || base.inStock || base.sku || base._count.orderItems !== 0 || base.rawLabel || referenced.has(base.id)) {
        errors.push(`${group.model} ${group.memory} ${group.color}: общий вариант уже использован/оценён, автоматическое разделение запрещено`);
        continue;
      }
      actions.push({ productId: product.id, productName: group.model, memory: base.memory!, color: base.color!, sim: missing[0], kind: "reuse", variantId: base.id });
      for (const sim of missing.slice(1)) actions.push({ productId: product.id, productName: group.model, memory: base.memory!, color: base.color!, sim, kind: "create", variantId: null });
    }
    console.log(`iPhone 18: ${sourceGroups().length} конфигураций памяти/цвета, ${actions.length} вариантов SIM по прайсу.`);
    for (const action of actions) console.log(`${action.kind.toUpperCase()}: ${action.productName} ${action.memory} ${action.color} ${action.sim}`);
    for (const error of errors) console.log(`СТОП: ${error}`);
    const fingerprint = actions.map((action) => [action.kind, action.variantId, action.productId, action.memory, action.color, action.sim]);
    const hash = createHash("sha256").update(JSON.stringify({ input, products, fingerprint, errors })).digest("hex").slice(0, 16);
    console.log(`Контрольный код разделения: ${hash}`);
    if (!apply) { console.log("ПРОВЕРКА: база не изменена."); return; }
    if (errors.length) throw new Error("Нельзя применять неполное или неоднозначное разделение");
    if (approvedHash !== hash) throw new Error("Контрольный код не совпал; база не изменена");
    const mutating = actions.filter((action) => action.kind !== "exists");
    if (!mutating.length) { console.log("Все модификации уже разделены; изменений нет."); return; }
    const backupDir = path.resolve("backups/owner-price-2026-10-04");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `iphone18-before-${new Date().toISOString().replace(/[:.]/g, "-")}-${hash}.json`);
    await writeFile(backupPath, JSON.stringify({ products, actions, hash, createdAt: new Date().toISOString() }, null, 2), { flag: "wx" });
    console.log(`Резервная копия: ${backupPath}`);
    await prisma.$transaction(async (tx) => {
      for (const action of mutating) {
        if (action.kind === "reuse") {
          const updated = await tx.productVariant.updateMany({
            where: { id: action.variantId!, region: null, sku: null, rawLabel: null, price: null, inStock: false, orderItems: { none: {} } },
            data: { region: action.sim },
          });
          if (updated.count !== 1) throw new Error(`Изменён общий вариант ${action.variantId}; вся операция отменена`);
        } else {
          await tx.productVariant.create({ data: {
            productId: action.productId, memory: action.memory, color: action.color,
            region: action.sim, price: null, inStock: false,
          } });
        }
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
    console.log(`РАЗДЕЛЕНО: ${mutating.length} модификаций. Цены ещё не применены.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
