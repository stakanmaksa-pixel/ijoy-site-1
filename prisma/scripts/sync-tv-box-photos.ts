// Синхронизация официальных фотографий Apple TV 4K.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-tv-box-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const photos = [
  {
    file: "apple-tv-4k.jpg",
    url: "https://www.apple.com/newsroom/images/product/tv/standard/Apple-TV-4K-top-down-221018_big.jpg.large.jpg",
  },
  {
    file: "apple-tv-4k-remote.jpg",
    url: "https://www.apple.com/newsroom/images/product/tv/standard/Apple-TV-4K-Siri-Remote-221018_big.jpg.large.jpg",
  },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({ where: { name: { contains: "Apple TV", mode: "insensitive" } } });
  if (!products.length) {
    console.log("SKIP: товаров Apple TV в базе нет");
    return;
  }

  for (const product of products) {
    const destinationDir = path.join(process.cwd(), "public", "uploads", "products", product.slug);
    await mkdir(destinationDir, { recursive: true });
    const paths: string[] = [];

    for (const photo of photos) {
      const response = await fetch(photo.url, { headers: { "User-Agent": "iJoy catalog photo sync" } });
      if (!response.ok) throw new Error(`${photo.file}: HTTP ${response.status}`);
      await writeFile(path.join(destinationDir, photo.file), Buffer.from(await response.arrayBuffer()));
      paths.push(`/uploads/products/${product.slug}/${photo.file}`);
    }

    await prisma.product.update({
      where: { id: product.id },
      // Заменяем старые пути, чтобы сломанная ссылка из прошлой попытки не
      // оставалась первой картинкой карточки.
      data: { images: paths },
    });
    console.log(`OK   ${product.name}: ${paths.length} фото`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
