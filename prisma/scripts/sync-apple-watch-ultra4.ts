// Adds Ultra 4 only. Existing watch offers, prices, stock and visibility are never reset.
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { APPLE_WATCH_ULTRA4, planUltra4Addition, ULTRA4_PHOTO_ENTRIES } from "../data/apple-watch-ultra4-catalog";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  for (const photo of ULTRA4_PHOTO_ENTRIES) {
    if (!/^apple-watches\/[a-z0-9-]+\.jpg$/.test(photo.file)) throw Error(`Invalid photo: ${photo.file}`);
    const bytes = await readFile(path.join(process.cwd(), "public/catalog/product-photos", photo.file));
    if (createHash("sha256").update(bytes).digest("hex") !== photo.sha256) throw Error(`Photo checksum mismatch: ${photo.file}`);
  }
  await prisma.$transaction(async tx => {
    const category = await tx.category.findUnique({ where: { slug: "chasy" } });
    if (!category) throw Error("Категория «Часы» не найдена. База не изменена.");
    const old = await tx.product.findUnique({ where: { slug: APPLE_WATCH_ULTRA4.slug }, include: { variants: true } });
    if (old && old.categoryId !== category.id) throw Error("Ultra 4 находится в другой категории: требуется проверка.");
    const plan = planUltra4Addition(old);
    console.log(`${old ? "UPDATE" : "CREATE"} ${APPLE_WATCH_ULTRA4.name}; фото: ${ULTRA4_PHOTO_ENTRIES.length}; новых вариантов: ${plan.variantsToCreate.length}; существующие цены и наличие сохраняются.`);
    if (dryRun) { console.log("DRY RUN: база не изменялась."); return; }
    const folder = path.resolve("backups/apple-watch-ultra4");
    await mkdir(folder, { recursive: true });
    const backup = path.join(folder, `before-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify({ slug: APPLE_WATCH_ULTRA4.slug, before: old }, null, 2), { flag: "wx" });
    console.log(`Backup: ${backup}`);
    const { variantsToCreate, ...photos } = plan;
    if (!old) {
      await tx.product.create({ data: {
        ...APPLE_WATCH_ULTRA4, ...photos, categoryId: category.id, status: "PUBLISHED",
        variants: { create: variantsToCreate },
      } });
    } else {
      await tx.product.update({ where: { id: old.id }, data: {
        ...photos,
        status: "PUBLISHED",
        // Fill absent content; retain edits and all existing offers.
        ...(!old.description ? { description: APPLE_WATCH_ULTRA4.description } : {}),
        ...(!old.specs ? { specs: APPLE_WATCH_ULTRA4.specs } : {}),
        ...(!old.highlights.length ? { highlights: APPLE_WATCH_ULTRA4.highlights } : {}),
        variants: { create: variantsToCreate },
      } });
    }
    console.log("Готово. Ultra 4: 20 сочетаний корпуса и ремешка с оригинальными фото. Новые варианты — без цены и подтверждённого наличия.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000 });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
