import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { WATCH_TABLET_PHOTOS, WATCH9_ALIASES, planWatchTabletPhotos } from "../data/watch-tablet-photo-policy";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  for (const product of WATCH_TABLET_PHOTOS) for (const photo of product.photos) {
    if (!/^watches-tablets\/[a-z0-9-]+\.png$/.test(photo.file)) throw Error(`Invalid photo path: ${photo.file}`);
    const bytes = await readFile(path.join(process.cwd(), "public/catalog/product-photos", photo.file));
    if (createHash("sha256").update(bytes).digest("hex") !== photo.sha256) throw Error(`Photo checksum mismatch: ${photo.file}`);
  }
  await prisma.$transaction(async tx => {
    const current = await tx.product.findMany({
      where: { status: "PUBLISHED", slug: { in: [...WATCH_TABLET_PHOTOS.map(p => p.slug), ...WATCH9_ALIASES] } },
      include: { variants: true, category: true },
    });
    // Validate every plan before writing any product. Missing or hidden products stay untouched.
    const work = WATCH_TABLET_PHOTOS.flatMap(product => {
      const targets = current.filter(p => (p.slug === product.slug || (product.slug === "samsung-galaxy-watch-9" && WATCH9_ALIASES.includes(p.slug))) && p.category.slug === product.category);
      if (!targets.length) console.log(`SKIP ${product.slug}: missing or hidden`);
      return targets.map(old => ({ old, plan: planWatchTabletPhotos(old, product) }));
    });
    if (!work.length) throw Error("No published target watches or tablets found.");
    for (const { old } of work) console.log(`PHOTO ${old.name}: ${old.variants.length} existing offers retained`);
    if (dryRun) { console.log("DRY RUN: база не изменялась."); return; }
    const folder = path.resolve("backups/watch-tablet-photos");
    await mkdir(folder, { recursive: true });
    const backup = path.join(folder, `photos-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify(work.map(w => w.old), null, 2), { flag: "wx" });
    console.log(`Backup: ${backup}`);
    for (const { old, plan } of work) await tx.product.update({ where: { id: old.id }, data: plan });
    console.log(`Готово: фотографии обновлены у ${work.length} моделей. Цены, наличие и варианты не изменялись.`);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000 });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
