/** Adds only the six owner-approved Series 12 Gold/Bronze bundles; dry-run by default. */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { matchAppleWatchVariant, parsePriceListText } from "../../src/lib/priceImport";
import { SEPTEMBER_2026_PRODUCTS } from "../data/september-2026-catalog";

const slug = "apple-watch-series-12";
const partNumbers = ["MJED4", "MJEF4", "MJEN4", "MJEP4", "MJEQ4", "MJEU4"] as const;
const input = readFileSync(path.resolve("prisma/data/owner-price-2026-10-04.txt"), "utf8");
const apply = process.argv.includes("--apply");
const approvedHash = process.argv.find((arg) => arg.startsWith("--approve="))?.slice(10);
const normalize = (value: string | null) => (value ?? "").toLowerCase().replace(/[\s‑–—_-]+/g, "");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL не задан");
  const template = SEPTEMBER_2026_PRODUCTS.find((product) => product.slug === slug);
  if (!template) throw new Error("Карточка Apple Watch Series 12 отсутствует в шаблоне каталога");
  const offers = parsePriceListText(input);
  const expected = partNumbers.map((sku) => {
    const rows = offers.filter((line) => line.parsedSku === sku);
    if (rows.length !== 1 || !rows[0].parsedPrice || rows[0].parsedPrice <= 0)
      throw new Error(`Артикул ${sku} отсутствует или неоднозначен в прайсе`);
    const candidates = template.variants.map((variant, index) => ({
      id: String(index), productName: template.name, memory: variant.memory,
      color: variant.color, region: variant.region, rawLabel: null,
    }));
    const id = matchAppleWatchVariant(rows[0], candidates);
    if (id === null) throw new Error(`Комплектация ${sku} не имеет одного точного варианта в шаблоне`);
    const variant = template.variants[Number(id)];
    if (!variant) throw new Error(`Не удалось получить вариант ${sku}`);
    return { sku, sourceLine: rows[0].rawLine, variant };
  });

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
    if (!product) throw new Error(`Товар ${slug} не найден; ничего не изменено`);
    const actions = expected.map(({ sku, sourceLine, variant }) => {
      const matches = product.variants.filter((candidate) =>
        normalize(candidate.memory) === normalize(variant.memory) &&
        normalize(candidate.color) === normalize(variant.color) &&
        normalize(candidate.region) === normalize(variant.region));
      if (matches.length > 1) throw new Error(`${sku}: дублирующиеся точные варианты; нужна ручная проверка`);
      if (matches[0]?.sku && matches[0].sku !== sku) throw new Error(`${sku}: точный вариант имеет другой артикул`);
      return { sku, sourceLine, variant, existingId: matches[0]?.id ?? null, currentSku: matches[0]?.sku ?? null };
    });
    for (const action of actions) {
      const holder = await prisma.productVariant.findUnique({ where: { sku: action.sku } });
      if (holder && holder.id !== action.existingId) throw new Error(`${action.sku}: артикул занят другим вариантом`);
    }
    const pending = actions.filter((action) => !action.existingId || action.currentSku !== action.sku);
    if (!pending.length) {
      console.log("Все шесть точных вариантов уже есть с правильными артикулами. База не изменена.");
      return;
    }
    const hash = createHash("sha256")
      .update(JSON.stringify({ input, productId: product.id, actions, current: product.variants }))
      .digest("hex").slice(0, 16);
    for (const action of pending) console.log(`${action.existingId ? "SKU" : "ADD"} ${action.sku}: ${action.variant.memory} / ${action.variant.color} / ${action.variant.region}`);
    console.log(`Контрольный код: ${hash}`);
    if (!apply) {
      console.log("ПРОВЕРКА: база не изменена. Для добавления нужен --apply --approve=<контрольный код>.");
      return;
    }
    if (approvedHash !== hash) throw new Error("Контрольный код не совпал; база не изменена");

    const backupDir = path.resolve("backups/apple-watch-series12-approved-bundles");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-${Date.now()}-${hash}.json`);
    await writeFile(backupPath, JSON.stringify({ hash, slug, pending, before: product }, null, 2), { flag: "wx" });

    await prisma.$transaction(async (tx) => {
      for (const action of pending) {
        const current = await tx.product.findUnique({ where: { slug }, include: { variants: true } });
        if (!current || current.id !== product.id) throw new Error("Товар изменился после проверки");
        const exact = current.variants.filter((candidate) =>
          normalize(candidate.memory) === normalize(action.variant.memory) &&
          normalize(candidate.color) === normalize(action.variant.color) &&
          normalize(candidate.region) === normalize(action.variant.region));
        if (exact.length !== (action.existingId ? 1 : 0) || exact[0]?.id !== action.existingId ||
          (exact[0]?.sku ?? null) !== action.currentSku) throw new Error(`${action.sku}: модификация изменилась после проверки`);
        if (await tx.productVariant.findUnique({ where: { sku: action.sku } })) throw new Error(`${action.sku}: артикул занят`);
        if (action.existingId) {
          await tx.productVariant.update({ where: { id: action.existingId }, data: { sku: action.sku } });
        } else {
          await tx.productVariant.create({ data: {
            productId: current.id, sku: action.sku,
            memory: action.variant.memory, color: action.variant.color, region: action.variant.region,
            price: null, inStock: false,
          } });
        }
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log(`Подготовлено ${pending.length} комплектаций без изменения цен и наличия. Резервная копия: ${backupPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
