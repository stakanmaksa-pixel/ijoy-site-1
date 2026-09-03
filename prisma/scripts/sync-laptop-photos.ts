// Синхронизация официальных фотографий MacBook в постоянный Docker-volume.
//
// Скрипт намеренно хранит файлы на сервере, а не ссылается на Apple CDN в
// интерфейсе: карточки загружаются быстрее и не зависят от внешнего сайта.
// Запуск после развёртывания:
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-laptop-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

type RemotePhoto = { file: string; url: string };
type Job = { slug: string; images?: RemotePhoto[]; colors?: Record<string, RemotePhoto[]> };

const APPLE_NEWSROOM = "https://www.apple.com/newsroom/images";

const jobs: Job[] = [
  {
    slug: "macbook-neo-13",
    colors: {
      Blush: [{ file: "neo-blush.jpg", url: `${APPLE_NEWSROOM}/2026/03/say-hello-to-macbook-neo/article/Apple-MacBook-Neo-blush-260304_big.jpg.large.jpg` }],
      Indigo: [{ file: "neo-indigo.jpg", url: `${APPLE_NEWSROOM}/2026/03/say-hello-to-macbook-neo/article/Apple-MacBook-Neo-indigo-260304_big.jpg.large.jpg` }],
      Silver: [{ file: "neo-silver.jpg", url: `${APPLE_NEWSROOM}/2026/03/say-hello-to-macbook-neo/article/Apple-MacBook-Neo-silver-260304_big.jpg.large.jpg` }],
      Citrus: [{ file: "neo-citrus.jpg", url: `${APPLE_NEWSROOM}/2026/03/say-hello-to-macbook-neo/article/Apple-MacBook-Neo-citrus-260304_big.jpg.large.jpg` }],
    },
  },
  {
    slug: "macbook-air-13-m4",
    images: [
      { file: "air-hero.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-hero-260303_big.jpg.large.jpg` },
      { file: "air-sizes.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-13-inch-and-15-inch-260303_big.jpg.large.jpg` },
    ],
  },
  {
    slug: "macbook-air-15-m4",
    images: [
      { file: "air-hero.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-hero-260303_big.jpg.large.jpg` },
      { file: "air-sizes.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-13-inch-and-15-inch-260303_big.jpg.large.jpg` },
    ],
  },
  {
    slug: "macbook-air-13-m5",
    images: [
      { file: "air-hero.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-hero-260303_big.jpg.large.jpg` },
      { file: "air-sizes.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-13-inch-and-15-inch-260303_big.jpg.large.jpg` },
    ],
  },
  {
    slug: "macbook-air-15-m5",
    images: [
      { file: "air-hero.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-hero-260303_big.jpg.large.jpg` },
      { file: "air-sizes.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-13-inch-and-15-inch-260303_big.jpg.large.jpg` },
    ],
  },
  {
    slug: "macbook-pro-14-m5",
    images: [{ file: "pro-hero.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-macbook-pro-with-all-new-m5-pro-and-m5-max/article/Apple-MacBook-Pro-M5-Pro-and-M5-Max-Capture-One-260303_big.jpg.large.jpg` }],
  },
  {
    slug: "macbook-pro-16-m5",
    images: [{ file: "pro-hero.jpg", url: `${APPLE_NEWSROOM}/2026/03/apple-introduces-macbook-pro-with-all-new-m5-pro-and-m5-max/article/Apple-MacBook-Pro-M5-Pro-and-M5-Max-Capture-One-260303_big.jpg.large.jpg` }],
  },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function download(photo: RemotePhoto, destinationDir: string, slug: string): Promise<string> {
  const response = await fetch(photo.url, { headers: { "User-Agent": "iJoy catalog photo sync" } });
  if (!response.ok) throw new Error(`${slug}/${photo.file}: HTTP ${response.status}`);

  await writeFile(path.join(destinationDir, photo.file), Buffer.from(await response.arrayBuffer()));
  return `/uploads/products/${slug}/${photo.file}`;
}

async function main() {
  let updated = 0;
  let copied = 0;

  for (const job of jobs) {
    const product = await prisma.product.findUnique({ where: { slug: job.slug } });
    if (!product) {
      console.log(`SKIP ${job.slug}: товара нет в базе`);
      continue;
    }

    const destinationDir = path.join(process.cwd(), "public", "uploads", "products", job.slug);
    await mkdir(destinationDir, { recursive: true });
    const nextColorImages = { ...((product.colorImages as Record<string, string[]> | null) ?? {}) };
    const downloadedImages: string[] = [];

    for (const photo of job.images ?? []) {
      downloadedImages.push(await download(photo, destinationDir, job.slug));
      copied += 1;
    }

    for (const [color, photos] of Object.entries(job.colors ?? {})) {
      const paths: string[] = [];
      for (const photo of photos) {
        paths.push(await download(photo, destinationDir, job.slug));
        copied += 1;
      }
      nextColorImages[color] = paths;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        images: downloadedImages.length ? Array.from(new Set([...product.images, ...downloadedImages])) : undefined,
        colorImages: Object.keys(nextColorImages).length ? nextColorImages : undefined,
      },
    });
    updated += 1;
    console.log(`OK   ${job.slug}`);
  }

  console.log(`\nГотово: ${updated} товаров, ${copied} фото.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
