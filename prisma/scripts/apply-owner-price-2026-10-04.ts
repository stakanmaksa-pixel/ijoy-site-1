/** One-off, owner-approved repricing. Dry-run by default; never creates catalog entries. */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { parsePriceListText } from "../../src/lib/priceImport";
import { planOwnerPriceUpdate, type CatalogPriceCandidate } from "../../src/lib/ownerPriceUpdate";

const sourcePath = path.resolve("prisma/data/owner-price-2026-10-04.txt");
const input = readFileSync(sourcePath, "utf8");
const apply = process.argv.includes("--apply");
const allowPartial = process.argv.includes("--allow-partial");
const approvedHash = process.argv.find((arg) => arg.startsWith("--approve="))?.slice("--approve=".length);

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
    console.log("Источник: 04.10.2026. Только существующие модификации, только цены; новые товары и остатки не затрагиваются.");
    for (const [category, count] of counts) console.log(`${category}: ${count.matched}/${count.source} строк сопоставлено`);
    console.log(`Уникальных модификаций: ${changes.length}; без совпадения: ${unmatched.length}`);
    const unavailable = changes.filter((change) => !stockById.get(change.variant.id));
    if (unavailable.length) console.log(`ВНИМАНИЕ: ${unavailable.length} найденных модификаций сейчас помечены «нет в наличии». Скрипт меняет только цену, не наличие.`);
    for (const decision of unmatched) console.log(`НЕТ СОВПАДЕНИЯ: ${decision.line.rawLine} — ${decision.reason}`);
    for (const change of changes) {
      console.log(`ЦЕНА: ${change.variant.productName} | ${change.variant.memory ?? ""} | ${change.variant.color ?? ""} | ${change.variant.region ?? ""} | ${change.variant.id} | ${change.variant.price ?? "—"} → ${change.newPrice} ₽ | поставщик ${change.supplierPrice} ₽ | ${change.sources.length} предложений`);
    }
    const plan = changes.map((change) => ({ id: change.variant.id, oldPrice: change.variant.price, newPrice: change.newPrice }));
    const planHash = createHash("sha256").update(JSON.stringify({ input, plan })).digest("hex").slice(0, 16);
    console.log(`Контрольный код плана: ${planHash}`);
    if (!apply) {
      console.log("ПРОВЕРКА: база не изменена. Сначала проверьте строки без совпадения и итоговые цены.");
      return;
    }
    if (approvedHash !== planHash) throw new Error("План изменился или не указан --approve=<контрольный код>; база не изменена");
    if (unmatched.length && !allowPartial) throw new Error("Есть строки без совпадения; нужна отдельная проверка и явный --allow-partial");
    if (!changes.length) throw new Error("Нет совпавших модификаций; записывать нечего");

    // The migrate service mounts /app/backups on a durable Docker volume.
    const backupDir = path.resolve("backups/owner-price-2026-10-04");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-${new Date().toISOString().replace(/[:.]/g, "-")}-${planHash}.json`);
    await writeFile(backupPath, JSON.stringify({ sourcePath, planHash, createdAt: new Date().toISOString(), changes }, null, 2), { flag: "wx" });
    console.log(`Резервная копия текущих цен: ${backupPath}`);

    await prisma.$transaction(async (tx) => {
      for (const change of changes) {
        const updated = await tx.productVariant.updateMany({
          where: { id: change.variant.id, price: change.variant.price },
          data: { price: new Prisma.Decimal(change.newPrice) },
        });
        if (updated.count !== 1) throw new Error(`Цена модификации ${change.variant.id} изменилась после проверки; вся запись отменена`);
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
    console.log(`ПРИМЕНЕНО: ${changes.length} цен. Остальные товары не изменены.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
