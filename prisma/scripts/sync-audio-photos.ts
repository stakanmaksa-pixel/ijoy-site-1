// Синхронизация фотографий наушников. Источники — карточки конкретных моделей
// у российского авторизованного реселлера и Apple Newsroom для AirPods Pro/Max.
// Скрипт находит товары по названию, поэтому не создаёт дублей и не меняет
// прайс, остатки или варианты.
//
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-audio-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

type AudioJob = {
  label: string;
  match: string;
  sourcePage: string;
  fallbackImage?: string;
};

const jobs: AudioJob[] = [
  {
    label: "AirPods Pro 3",
    match: "AirPods Pro 3",
    sourcePage: "https://re-store.ru/catalog/MFHP4_BLK/",
    fallbackImage: "https://www.apple.com/newsroom/images/2025/09/introducing-airpods-pro-3-the-ultimate-audio-experience/article/Apple-AirPods-Pro-3-hero-250909_inline.jpg.large.jpg",
  },
  { label: "AirPods 4", match: "AirPods 4", sourcePage: "https://re-store.ru/catalog/MXP63/" },
  {
    label: "AirPods Max 2",
    match: "AirPods Max 2",
    sourcePage: "https://www.apple.com/airpods-max/",
    fallbackImage: "https://www.apple.com/newsroom/images/2026/03/apple-introduces-airpods-max-2/article/Apple-AirPods-Max-2-color-lineup_big.jpg.large.jpg",
  },
  { label: "Galaxy Buds4 Pro", match: "Galaxy Buds4 Pro", sourcePage: "https://re-store.ru/catalog/SM-R640NWHT1S/" },
  { label: "Galaxy Buds4", match: "Galaxy Buds4", sourcePage: "https://re-store.ru/catalog/SM-R540NBLK1S/" },
  { label: "Galaxy Buds3 Pro", match: "Galaxy Buds3 Pro", sourcePage: "https://re-store.ru/catalog/SM-R630NZWHT1S/" },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function extractImageUrl(html: string): string | null {
  const meta = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  if (meta?.[1]?.startsWith("https://")) return meta[1].replaceAll("&amp;", "&");

  return null;
}

async function resolveImage(job: AudioJob): Promise<string> {
  try {
    const page = await fetch(job.sourcePage, { headers: { "User-Agent": "iJoy catalog photo sync" } });
    if (page.ok) {
      const image = extractImageUrl(await page.text());
      if (image) return image;
    }
  } catch {
    // Ниже используется подтверждённый резервный источник, если он есть.
  }
  if (job.fallbackImage) return job.fallbackImage;
  throw new Error(`${job.label}: не удалось получить фото из карточки источника`);
}

async function main() {
  let updated = 0;

  for (const job of jobs) {
    const products = await prisma.product.findMany({ where: { name: { contains: job.match, mode: "insensitive" } } });
    if (!products.length) {
      console.log(`SKIP ${job.label}: товара нет в базе`);
      continue;
    }

    const imageUrl = await resolveImage(job);
    for (const product of products) {
      const destinationDir = path.join(process.cwd(), "public", "uploads", "products", product.slug);
      await mkdir(destinationDir, { recursive: true });
      const response = await fetch(imageUrl, { headers: { "User-Agent": "iJoy catalog photo sync" } });
      if (!response.ok) throw new Error(`${job.label}: фото недоступно, HTTP ${response.status}`);

      const fileName = "cover.jpg";
      await writeFile(path.join(destinationDir, fileName), Buffer.from(await response.arrayBuffer()));
      const publicPath = `/uploads/products/${product.slug}/${fileName}`;
      await prisma.product.update({
        where: { id: product.id },
        data: { images: Array.from(new Set([...product.images, publicPath])) },
      });
      updated += 1;
      console.log(`OK   ${product.name}`);
    }
  }

  console.log(`\nГотово: ${updated} товаров с фотографиями.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
