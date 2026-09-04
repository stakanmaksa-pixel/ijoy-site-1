// Проверяет все пути фото из базы: есть ли соответствующие файлы в общем
// uploads volume. Ничего не меняет.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/verify-product-photos.ts

import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function allImagePaths(images: string[], colorImages: unknown): string[] {
  const byColor = colorImages && typeof colorImages === "object"
    ? Object.values(colorImages as Record<string, unknown>).flatMap((value) => Array.isArray(value) ? value : [])
    : [];
  return [...new Set([...images, ...byColor].filter((value): value is string => typeof value === "string" && value.startsWith("/uploads/")))];
}

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { name: true, slug: true, images: true, colorImages: true },
    orderBy: { name: "asc" },
  });
  let checked = 0;
  let missing = 0;
  let withoutPhoto = 0;

  for (const product of products) {
    const paths = allImagePaths(product.images, product.colorImages);
    if (paths.length === 0) {
      withoutPhoto += 1;
      console.log(`NO PHOTO  ${product.name} (${product.slug})`);
      continue;
    }
    for (const publicPath of paths) {
      checked += 1;
      const diskPath = path.join(process.cwd(), "public", publicPath.slice(1));
      try {
        await access(diskPath);
      } catch {
        missing += 1;
        console.log(`MISSING   ${product.name}: ${publicPath}`);
      }
    }
  }
  console.log(`\nПроверено файлов: ${checked}. Нет файлов: ${missing}. Товаров без фото: ${withoutPhoto}.`);
  process.exitCode = missing > 0 ? 2 : 0;
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
