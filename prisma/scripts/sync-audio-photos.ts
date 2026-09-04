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
  matches: string[];
  sourcePage: string;
  fallbackImage?: string;
  exclude?: RegExp;
};

const jobs: AudioJob[] = [
  {
    label: "AirPods Pro 3",
    matches: ["AirPods Pro 3", "AirPods Pro (3"],
    sourcePage: "https://re-store.ru/catalog/MFHP4_BLK/",
    fallbackImage: "https://www.apple.com/newsroom/images/2025/09/introducing-airpods-pro-3-the-ultimate-audio-experience/article/Apple-AirPods-Pro-3-hero-250909_inline.jpg.large.jpg",
  },
  { label: "AirPods 4", matches: ["AirPods 4", "AirPods (4"], sourcePage: "https://www.apple.com/newsroom/2024/09/apple-introduces-airpods-4-and-a-hearing-health-experience-with-airpods-pro-2/" },
  {
    label: "AirPods Max 2",
    matches: ["AirPods Max 2"],
    sourcePage: "https://www.apple.com/newsroom/2026/03/apple-introduces-airpods-max-2-powered-by-h2/",
    fallbackImage: "https://www.apple.com/v/airpods-max/k/images/overview/welcome/max-loop_startframe__c0vn1ukmh7ma_xlarge.jpg",
  },
  { label: "AirPods Pro 2", matches: ["AirPods Pro 2", "AirPods Pro (2"], sourcePage: "https://www.apple.com/newsroom/2023/09/apple-upgrades-airpods-pro-2nd-generation-with-usb-c-charging/" },
  { label: "Galaxy Buds4 Pro", matches: ["Galaxy Buds4 Pro"], sourcePage: "https://re-store.ru/catalog/SM-R640NWHT1S/" },
  { label: "Galaxy Buds4", matches: ["Galaxy Buds4"], sourcePage: "https://re-store.ru/catalog/SM-R540NBLK1S/" },
  { label: "Galaxy Buds3 Pro", matches: ["Galaxy Buds3 Pro"], sourcePage: "https://re-store.ru/catalog/SM-R630NZWHT1S/" },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function extractImageUrl(html: string): string | null {
  const meta = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  if (meta?.[1]?.startsWith("https://")) return meta[1].replaceAll("&amp;", "&");

  return null;
}

async function resolveImageCandidates(job: AudioJob): Promise<string[]> {
  const candidates: string[] = [];
  try {
    const page = await fetch(job.sourcePage, { headers: { "User-Agent": "iJoy catalog photo sync" } });
    if (page.ok) {
      const image = extractImageUrl(await page.text());
      if (image) candidates.push(image);
    }
  } catch {
    // Ниже используется резервный источник, если он есть.
  }
  if (job.fallbackImage) candidates.push(job.fallbackImage);
  if (candidates.length) return [...new Set(candidates)];
  throw new Error(`${job.label}: не удалось получить фото из карточки источника`);
}

async function main() {
  let updated = 0;

  for (const job of jobs) {
    const matchingProducts = await prisma.product.findMany({
      where: { OR: job.matches.map((match) => ({ name: { contains: match, mode: "insensitive" } })) },
    });
    const products = job.exclude ? matchingProducts.filter((product) => !job.exclude?.test(product.name)) : matchingProducts;
    if (!products.length) {
      console.log(`SKIP ${job.label}: товара нет в базе`);
      continue;
    }

    let imageUrls: string[];
    try {
      imageUrls = await resolveImageCandidates(job);
    } catch (error) {
      console.error(`SKIP ${job.label}: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    for (const product of products) {
      let image: Buffer | null = null;
      for (const imageUrl of imageUrls) {
        try {
          const response = await fetch(imageUrl, { headers: { "User-Agent": "iJoy catalog photo sync" } });
          if (response.ok) {
            image = Buffer.from(await response.arrayBuffer());
            break;
          }
          console.warn(`WARN ${job.label}: HTTP ${response.status} для ${imageUrl}`);
        } catch {
          console.warn(`WARN ${job.label}: не удалось скачать ${imageUrl}`);
        }
      }
      if (!image) {
        console.error(`SKIP ${product.name}: фото недоступно`);
        continue;
      }
      const destinationDir = path.join(process.cwd(), "public", "uploads", "products", product.slug);
      await mkdir(destinationDir, { recursive: true });

      const fileName = "cover.jpg";
      await writeFile(path.join(destinationDir, fileName), image);
      const publicPath = `/uploads/products/${product.slug}/${fileName}`;
      await prisma.product.update({
        where: { id: product.id },
        // Оставляем только проверенную обложку: старая общая картинка
        // линейки не должна оставаться первой в карточке конкретной модели.
        data: { images: [publicPath] },
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
