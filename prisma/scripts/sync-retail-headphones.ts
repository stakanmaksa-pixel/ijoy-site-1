import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { HEADPHONE_CONTENT, headphoneContentPatch, planStationRetail } from "../data/headphone-content";
import { GAMING_LIFESTYLE_CATALOG } from "../data/gaming-lifestyle-catalog";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const dryRun = process.argv.includes("--dry-run");
const stationSlug = "dualsense-charging-station";
async function main() {
  await prisma.$transaction(async tx => {
    const products = await tx.product.findMany({
      where: { status: "PUBLISHED", OR: [{ category: { slug: "naushniki" } }, { slug: stationSlug }] },
      include: { variants: true, category: true },
    });
    const work = HEADPHONE_CONTENT.flatMap(content => {
      const old = products.find(p => p.slug === content.slug && p.category.slug === "naushniki");
      if (!old) { console.log(`SKIP ${content.slug}: отсутствует или скрыт`); return []; }
      return [{ old, content }];
    });
    for (const product of products.filter(p => p.category.slug === "naushniki" && !HEADPHONE_CONTENT.some(c => c.slug === p.slug))) {
      console.log(`REVIEW ${product.slug}: нет проверенного описания; без изменений`);
    }
    const station = products.find(p => p.slug === stationSlug);
    if (station && station.category.slug !== "igrovye-aksessuary") throw Error("Зарядная станция находится в другой категории");
    const plan = station ? planStationRetail(station.variants) : null;
    if (plan) console.log(`RETAIL ${station!.name}: 1 шт, цена ${plan.retail.price ?? "уточнить"}; в архив: ${plan.wholesale.length}`);
    else console.log("SKIP зарядная станция: отсутствует или скрыта");
    for (const { old } of work) console.log(`CONTENT ${old.name}: описание, особенности, характеристики`);
    if (!station && !work.length) throw Error("Целевые товары не найдены; база не изменена");
    if (dryRun) { console.log("DRY RUN: база не изменялась"); return; }
    const archiveSlug = `${stationSlug}-archive-variants`;
    const oldArchive = await tx.product.findUnique({ where: { slug: archiveSlug }, include: { variants: true } });
    const folder = path.resolve("backups/retail-headphones");
    await mkdir(folder, { recursive: true });
    const backup = path.join(folder, `before-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify({ products, archive: oldArchive }, null, 2), { flag: "wx" });
    console.log(`Backup: ${backup}`);
    for (const { old, content } of work) {
      const priorSpecs = old.specs && typeof old.specs === "object" && !Array.isArray(old.specs) ? old.specs : {};
      const patch = headphoneContentPatch(content);
      await tx.product.update({ where: { id: old.id }, data: { ...patch, specs: { ...priorSpecs, ...patch.specs } } });
    }
    if (station && plan) {
      if (plan.wholesale.length) {
        const archive = await tx.product.upsert({ where: { slug: archiveSlug },
          create: { slug: archiveSlug, name: `${station.name} — архив вариантов`, brand: station.brand, categoryId: station.categoryId, status: "HIDDEN" },
          update: { status: "HIDDEN" },
        });
        // Keep IDs and order history. No price or stock edits, no deletion.
        await tx.productVariant.updateMany({ where: { productId: station.id, id: { in: plan.wholesale.map(v => v.id) } }, data: { productId: archive.id } });
      }
      const source = GAMING_LIFESTYLE_CATALOG.find(p => p.slug === stationSlug)!;
      await tx.product.update({ where: { id: station.id }, data: { description: source.description, specs: source.specs } });
      if (await tx.productVariant.count({ where: { productId: station.id } }) !== 1) throw Error("Проверка розничного варианта не пройдена");
    }
    console.log(`Готово: описания ${work.length} моделей наушников; оптовые варианты станции скрыты. Цены, фото и наличие сохранены.`);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000 });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
