import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { ACCESSORY_PHOTOS, accessoryVariantPhoto } from "../data/accessory-variant-photos";
import { variantImageKey } from "../../src/lib/pickCoverImage";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  await prisma.$transaction(async tx => {
    const products = await tx.product.findMany({ where: { slug: { in: Object.keys(ACCESSORY_PHOTOS) } }, include: { variants: true } });
    if (products.length !== Object.keys(ACCESSORY_PHOTOS).length) throw Error("Не все целевые товары найдены: база не изменена");
    const updates = products.map(product => {
      if (!product.variants.length) throw Error(`Нет вариантов: ${product.slug}`);
      const colorImages: Record<string, string[]> = {};
      for (const variant of product.variants) {
        const photo = accessoryVariantPhoto(product.slug, variant)!;
        colorImages[variantImageKey(variant)] = [photo];
        if (variant.color && variant.color !== "Limited Edition") colorImages[variant.color] = [photo];
        if (product.slug === "google-fitbit-air" && variant.memory === "Stephen Curry Edition") {
          colorImages[variantImageKey({ ...variant, color: "Rye" })] = [photo];
          colorImages.Rye = [photo];
        }
      }
      return { product, colorImages, images: [accessoryVariantPhoto(product.slug, product.variants[0])!] };
    });
    for (const update of updates) {
      for (const photos of Object.values(update.colorImages)) await access(path.resolve(`public${photos[0]}`));
      console.log(`PHOTOS ${update.product.slug}: ${update.product.variants.length} вариантов`);
    }
    if (process.argv.includes("--dry-run")) { console.log("DRY RUN: база не изменялась"); return; }
    await mkdir("backups/accessory-variant-photos", { recursive: true });
    const backup = `backups/accessory-variant-photos/before-${Date.now()}.json`;
    await writeFile(backup, JSON.stringify(products, null, 2), { flag: "wx" });
    console.log(`Backup: ${backup}`);
    for (const { product, images, colorImages } of updates) {
      await tx.product.update({ where: { id: product.id }, data: { images, colorImages } });
      if (product.slug === "google-fitbit-air") await tx.productVariant.updateMany({
        where: { productId: product.id, memory: "Stephen Curry Edition", color: "Blue" }, data: { color: "Rye" },
      });
    }
    console.log("Готово: фото вариантов обновлены. Цены, наличие и ID сохранены.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000 });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
