// Add exactly three new iPhones. No reseed and no edits to existing offers/visibility.
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { IPHONE_2026_CATALOG, IPHONE_2026_SOURCES, iphone2026GeneralPhoto, iphone2026Photo, planIphone2026Addition } from "../data/iphone-2026-catalog";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  const category = await prisma.category.findUnique({ where: { slug: "telefony" } });
  if (!category) throw Error("Категория «Телефоны» не найдена. База не изменена.");
  // The supplied photographs are bundled with the deployment, so a catalogue
  // sync no longer depends on a writable runtime upload volume or Apple CDN.
  const photos = [...new Set(IPHONE_2026_CATALOG.flatMap(product => [
    iphone2026GeneralPhoto(product.slug),
    ...product.colors.map(color => iphone2026Photo(product.slug, color)),
  ]))];
  for (const photo of photos) {
    const bytes = await readFile(path.join(process.cwd(), "public", photo.replace(/^\//, "")));
    if (bytes.length < 10_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw Error(`Некорректное фото: ${photo}`);
  }
  await prisma.$transaction(async tx => {
    const existing = await tx.product.findMany({ where: { slug: { in: IPHONE_2026_CATALOG.map(p => p.slug) } }, include: { variants: true } });
    const plans = IPHONE_2026_CATALOG.map(product => {
      const old = existing.find(p => p.slug === product.slug);
      if (old && old.categoryId !== category.id) throw Error(`${product.slug}: другая категория, требуется проверка.`);
      const plan = planIphone2026Addition(product, old, { replaceExistingPhotos: true });
      console.log(`${old ? "EXISTS" : "CREATE"} ${product.name}: новых вариантов ${plan.variantsToCreate.length}; без цены и подтверждённого наличия.`);
      return { product, old, plan };
    });
    if (dryRun) { console.log("DRY RUN: база и файлы не изменялись. Комплектные фотографии проверены."); return; }
    const folder = path.resolve("backups/iphone-2026");
    await mkdir(folder, { recursive: true });
    const backup = path.join(folder, `before-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify({ before: existing, targets: IPHONE_2026_CATALOG.map(p => p.slug), sources: IPHONE_2026_SOURCES, photos }, null, 2), { flag: "wx" });
    console.log(`Backup: ${backup}`);
    for (const {product, old, plan} of plans) {
      const {variantsToCreate, ...photoPatch} = plan;
      if (!old) {
        const {colors: _colors, ...content} = product;
        await tx.product.create({ data: { ...content, ...photoPatch, status: "PUBLISHED", categoryId: category.id, variants: { create: variantsToCreate } } });
      } else {
        await tx.product.update({ where: { id: old.id }, data: {
          ...photoPatch,
          ...(!old.description ? { description: product.description } : {}),
          ...(!old.specs || !Object.keys(old.specs).length ? { specs: product.specs } : {}),
          ...(!old.highlights.length ? { highlights: product.highlights } : {}),
          variants: { create: variantsToCreate },
        } });
      }
    }
    console.log("Готово: iPhone 18 Pro Max, iPhone 18 Pro, iPhone Duo. Существующие цены, остатки и товары сохранены.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000 });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
