// Photo-only update. Does not import prices, stock, categories or variants.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-catalog-photos.ts
import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveCatalogPhoto } from "../../src/lib/catalogPhotos";

type PhotoJob = { slug: string; colors: Record<string, string[]> };
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const dryRun = process.argv.includes("--dry-run");
const seedRoot = path.resolve("prisma/seed-photos");
const uploadRoot = path.resolve("public/uploads");

function seedFile(relative: string) {
  const file = path.resolve(seedRoot, relative);
  if (!file.startsWith(seedRoot + path.sep)) throw new Error(`Invalid photo path: ${relative}`);
  return file;
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(seedRoot, "manifest.json"), "utf8")) as { version: number; jobs: PhotoJob[] };
  if (manifest.version !== 1 || !Array.isArray(manifest.jobs)) throw new Error("Invalid photo manifest");
  const samsung = new Map(manifest.jobs.filter(job => job.slug.startsWith("samsung-")).map(job => [job.slug, job]));
  const products = await prisma.product.findMany({ select: { id: true, slug: true, images: true, colorImages: true } });
  const changes: Array<{ id: string; slug: string; images: string[]; colorImages: Record<string, string[]> }> = [];
  const copies: Array<{ from: string; to: string }> = [];
  for (const product of products) {
    const current = (product.colorImages as Record<string, string[]> | null) ?? {};
    const colorImages = Object.fromEntries(Object.entries(current).map(([key, urls]) => [key, urls.map(url => resolveCatalogPhoto(url, product.slug, key.startsWith("variant:") ? key.split("::")[2] : null))]));
    const images = product.images.map(url => resolveCatalogPhoto(url, product.slug));
    const job = samsung.get(product.slug);
    if (job) for (const [color, files] of Object.entries(job.colors)) {
      const existing = current[color] ?? [];
      // Preserve photographs uploaded by an editor; replace only known imports.
      if (existing.some(url => !/^\/uploads\/products\/samsung-[^/]+\/(?:restore|official)-[a-z0-9-]+\.webp$/.test(url))) continue;
      colorImages[color] = files.map(relative => {
        const from = seedFile(relative);
        const to = path.join(uploadRoot, "products", job.slug, path.basename(relative));
        copies.push({ from, to });
        return `/uploads/products/${job.slug}/${path.basename(relative)}`;
      });
    }
    if (JSON.stringify(colorImages) !== JSON.stringify(current) || JSON.stringify(images) !== JSON.stringify(product.images)) {
      changes.push({ id: product.id, slug: product.slug, images, colorImages });
    }
  }
  // Validate every source before making any changes.
  for (const { from } of copies) await access(from);
  for (const change of changes) for (const url of [...change.images, ...Object.values(change.colorImages).flat()]) {
    if (url.startsWith("/catalog/product-photos/")) await access(path.resolve("public", `.${url}`));
  }
  console.log(`${dryRun ? "DRY RUN: " : ""}${changes.length} photo records; ${copies.length} Samsung image files.`);
  if (dryRun) return;
  if (changes.length) {
    const backupDir = path.join(uploadRoot, "photo-sync-backups");
    await mkdir(backupDir, { recursive: true });
    const backup = path.join(backupDir, `catalog-${new Date().toISOString().replaceAll(":", "-")}.json`);
    const ids = new Set(changes.map(change => change.id));
    await writeFile(backup, JSON.stringify(products.filter(product => ids.has(product.id)), null, 2), { flag: "wx" });
    console.log(`Previous photo links saved: ${backup}`);
  }
  for (const { from, to } of copies) {
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
  }
  if (changes.length) await prisma.$transaction(changes.map(({ id, images, colorImages }) => prisma.product.update({ where: { id }, data: { images, colorImages } })));
  console.log("Done. Prices, stock, product IDs and variants were not changed.");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
