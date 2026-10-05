/** One-off, owner-approved repricing. Dry-run by default; never creates catalog entries. */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import {
  appleWatchModel,
  canonicalIphoneModel,
  normalizeForMatch,
  normalizedIphoneSim,
  normalizedMemory,
  parsePriceLine,
  parsePriceListText,
  type ParsedPriceLine,
} from "../../src/lib/priceImport";
import { planOwnerPriceUpdate, type CatalogPriceCandidate } from "../../src/lib/ownerPriceUpdate";

const sourcePath = path.resolve("prisma/data/owner-price-2026-10-04.txt");
const input = readFileSync(sourcePath, "utf8");
const apply = process.argv.includes("--apply");
const diagnose = process.argv.includes("--diagnose");
const allowPartial = process.argv.includes("--allow-partial");
const approvedHash = process.argv.find((arg) => arg.startsWith("--approve="))?.slice("--approve=".length);

function stockApproval(candidate: CatalogPriceCandidate): boolean {
  if (candidate.productName === "AirPods 5 Wireless") return true;
  if (candidate.productName === "Apple Watch Series 12" &&
    candidate.color === "Black" && ["42 мм", "46 мм"].includes(candidate.memory ?? "")) return true;
  if (candidate.productName === "Apple Watch Series 12" &&
    candidate.memory === "42 мм" && candidate.color === "Space Gray" &&
    candidate.region === "Navy Blue Sport Band M/L") return true;
  if (candidate.productName === "Apple Watch Series 12" && [
    "MJED4", "MJEF4", "MJEN4", "MJEP4", "MJEQ4", "MJEU4",
  ].includes(candidate.sku ?? "")) return true;
  if (candidate.productName === "Apple Watch Ultra 4" && candidate.memory === "49 мм" &&
    ((candidate.color === "Black Titanium" && candidate.region === "Ocean Band (Translucent Black)") ||
      (candidate.color === "Natural Titanium" && candidate.region === "Trail Loop (Sand)"))) return true;
  if (["iPhone 18 Pro", "iPhone 18 Pro Max"].includes(candidate.productName) &&
    ["eSIM", "SIM+eSIM"].includes(candidate.region ?? "")) return true;
  return false;
}

function describeUnmatched(line: ParsedPriceLine, candidates: CatalogPriceCandidate[]): string {
  const sku = normalizeForMatch(line.parsedSku ?? "");
  const skuMatches = sku ? candidates.filter((candidate) =>
    [candidate.sku, candidate.rawLabel].some((value) => normalizeForMatch(value ?? "").includes(sku))) : [];
  const skuNote = sku ? `; артикул ${line.parsedSku}: ${skuMatches.length} совпадений` : "";
  if (line.phoneModel) {
    const model = canonicalIphoneModel(line.phoneModel);
    const sourceStorage = normalizedMemory(line.parsedMemory);
    const sourceColor = normalizeForMatch(line.parsedColor ?? "");
    const sourceSim = normalizedIphoneSim(line.parsedRegion, model);
    const byModel = candidates.filter((candidate) => canonicalIphoneModel(candidate.productName) === model);
    const byMemory = byModel.filter((candidate) => {
      const stored = candidate.rawLabel ? parsePriceLine(candidate.rawLabel) : null;
      return normalizedMemory(candidate.memory ?? stored?.parsedMemory ?? null) === sourceStorage;
    });
    const byColor = byMemory.filter((candidate) => {
      const stored = candidate.rawLabel ? parsePriceLine(candidate.rawLabel) : null;
      return normalizeForMatch(candidate.color ?? stored?.parsedColor ?? "") === sourceColor;
    });
    const regionOptions = [...new Set(byColor.map((candidate) =>
      `${candidate.region ?? "∅"}${candidate.rawLabel ? ` (${candidate.rawLabel})` : ""}`))].slice(0, 8);
    const exactSim = byColor.filter((candidate) =>
      (normalizedIphoneSim(candidate.region, model) ?? normalizedIphoneSim(candidate.rawLabel, model)) === sourceSim);
    return `модель=${byModel.length}, память=${byMemory.length}, цвет=${byColor.length}, SIM=${exactSim.length} (нужна ${sourceSim ?? "не распознана"}); варианты региона: ${regionOptions.join("; ") || "нет"}${skuNote}`;
  }
  if (/^Apple Watch\b/i.test(line.parsedModel ?? "")) {
    const model = appleWatchModel(line.parsedModel);
    const byModel = candidates.filter((candidate) => appleWatchModel(candidate.productName) === model);
    const size = /\b(40|42|44|46|49)\b/.exec(line.parsedMemory ?? "")?.[1];
    const bySize = byModel.filter((candidate) => !size || candidate.memory?.includes(size));
    const byColor = bySize.filter((candidate) => normalizeForMatch(candidate.color ?? "") === normalizeForMatch(line.parsedColor ?? ""));
    return `модель=${byModel.length}, корпус=${bySize.length}, цвет=${byColor.length}; ремешки: ${byColor.map((candidate) => candidate.region ?? "∅").slice(0, 10).join("; ") || "нет"}${skuNote}`;
  }
  if (/^iPad\b/i.test(line.parsedModel ?? "")) {
    const bySku = skuMatches.map((candidate) => `${candidate.productName} / ${candidate.memory ?? "∅"} / ${candidate.color ?? "∅"} / ${candidate.region ?? "∅"}`);
    const productNames = [...new Set(candidates.filter((candidate) => /^iPad\b/i.test(candidate.productName)).map((candidate) => candidate.productName))];
    return `артикул: ${bySku.join("; ") || "не найден"}; карточки iPad: ${productNames.join("; ") || "нет"}`;
  }
  return `нет точной модификации${skuNote}`;
}

async function main() {
  const lines = parsePriceListText(input);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL отсутствует: без базы нельзя сверить модификации или изменить цены");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const stored = await prisma.productVariant.findMany({
      select: {
        id: true, memory: true, color: true, region: true, sku: true,
        rawLabel: true, price: true, inStock: true, product: { select: { name: true, slug: true } },
      },
    });
    const candidates: CatalogPriceCandidate[] = stored.map((variant) => ({
      id: variant.id, productName: variant.product.name, productSlug: variant.product.slug,
      memory: variant.memory, color: variant.color, region: variant.region,
      rawLabel: variant.rawLabel, sku: variant.sku,
      price: variant.price ? Number(variant.price) : null,
    }));
    const { decisions, changes } = planOwnerPriceUpdate(lines, candidates);
    const stockById = new Map(stored.map((variant) => [variant.id, variant.inStock]));
    const unmatched = decisions.filter((decision) => !decision.variantId);
    const counts = new Map<string, { source: number; matched: number }>();
    for (const decision of decisions) {
      const count = counts.get(decision.category) ?? { source: 0, matched: 0 };
      count.source += 1;
      if (decision.variantId) count.matched += 1;
      counts.set(decision.category, count);
    }
    console.log("Источник: 04.10.2026. Только существующие модификации; новые товары не создаются, отсутствие строк не обнуляет цены.");
    for (const [category, count] of counts) console.log(`${category}: ${count.matched}/${count.source} строк сопоставлено`);
    console.log(`Уникальных модификаций: ${changes.length}; без совпадения: ${unmatched.length}`);
    const unavailable = changes.filter((change) => !stockById.get(change.variant.id));
    const unapprovedAvailability = unavailable.filter((change) => !stockApproval(change.variant));
    if (unavailable.length) console.log(`ДОСТУПНОСТЬ: ${unavailable.length} найденных модификаций сейчас помечены «нет в наличии»; ${unapprovedAvailability.length} не разрешено включать автоматически.`);
    if (diagnose) for (const change of unavailable) console.log(`НЕТ В НАЛИЧИИ: ${change.variant.productName} | ${change.variant.memory ?? ""} | ${change.variant.color ?? ""} | ${change.variant.region ?? ""} | ${change.variant.id}`);
    for (const decision of unmatched) console.log(`НЕТ СОВПАДЕНИЯ: ${decision.line.rawLine} — ${decision.reason}`);
    if (diagnose) for (const decision of unmatched) console.log(`ДИАГНОЗ: ${decision.line.rawLine} — ${describeUnmatched(decision.line, candidates)}`);
    for (const change of changes) {
      console.log(`ЦЕНА: ${change.variant.productName} | ${change.variant.memory ?? ""} | ${change.variant.color ?? ""} | ${change.variant.region ?? ""} | ${change.variant.id} | ${change.variant.price ?? "—"} → ${change.newPrice} ₽ | поставщик ${change.supplierPrice} ₽ | ${change.sources.length} предложений${stockById.get(change.variant.id) ? "" : " | сейчас нет в наличии"}`);
    }
    const plan = changes.map((change) => ({ id: change.variant.id, oldPrice: change.variant.price, newPrice: change.newPrice, oldStock: stockById.get(change.variant.id), newStock: true }));
    const planHash = createHash("sha256").update(JSON.stringify({ input, plan })).digest("hex").slice(0, 16);
    console.log(`Контрольный код плана: ${planHash}`);
    if (!apply) {
      console.log("ПРОВЕРКА: база не изменена. Сначала проверьте строки без совпадения и итоговые цены.");
      return;
    }
    if (approvedHash !== planHash) throw new Error("План изменился или не указан --approve=<контрольный код>; база не изменена");
    if (unmatched.length && !allowPartial) throw new Error("Есть строки без совпадения; нужна отдельная проверка и явный --allow-partial");
    if (unapprovedAvailability.length) throw new Error("Найдены не согласованные с владельцем изменения наличия; база не изменена");
    if (!changes.length) throw new Error("Нет совпавших модификаций; записывать нечего");

    // The migrate service mounts /app/backups on a durable Docker volume.
    const backupDir = path.resolve("backups/owner-price-2026-10-04");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-${new Date().toISOString().replace(/[:.]/g, "-")}-${planHash}.json`);
    await writeFile(backupPath, JSON.stringify({ sourcePath, planHash, createdAt: new Date().toISOString(), plan, changes }, null, 2), { flag: "wx" });
    console.log(`Резервная копия текущих цен: ${backupPath}`);

    await prisma.$transaction(async (tx) => {
      for (const change of changes) {
        const updated = await tx.productVariant.updateMany({
          where: { id: change.variant.id, price: change.variant.price, inStock: stockById.get(change.variant.id) },
          data: { price: new Prisma.Decimal(change.newPrice), inStock: true },
        });
        if (updated.count !== 1) throw new Error(`Цена модификации ${change.variant.id} изменилась после проверки; вся запись отменена`);
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
    console.log(`ПРИМЕНЕНО: ${changes.length} цен, разрешённые позиции отмечены в наличии. Остальные товары не изменены.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
