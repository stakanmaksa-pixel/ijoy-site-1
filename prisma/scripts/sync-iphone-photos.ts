// Точечная загрузка фото товара на боевой сайт без похода в админку.
//
// Исходники фото лежат прямо в репозитории (prisma/seed-photos/<slug>/) —
// они попадают в образ через обычный `COPY . .` в Dockerfile (стейдж
// builder, тот же, что использует сервис `migrate`). Этот скрипт копирует
// их оттуда в постоянное хранилище (volume uploads_data, примонтирован и у
// migrate, и у app — см. docker-compose.yml) и прописывает пути в
// Product.colorImages. ProductVariant (цены/остатки) не трогает вообще —
// как и sync-iphone-specs.ts, безопасно для боевых цен.
//
// Запуск (после деплоя обновлённого кода):
//   docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-iphone-photos.ts
//
// Идемпотентен — повторный запуск не создаст дублей в colorImages.

import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { mkdir, copyFile } from "fs/promises";
import path from "node:path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Добавляя фото для новой модели — просто новый элемент сюда, файлы в
// prisma/seed-photos/<slug>/, ничего больше менять не нужно.
const JOBS: { slug: string; photos: { color: string; file: string }[] }[] = [
  {
    slug: "iphone-17-pro-max",
    photos: [
      { color: "Orange", file: "orange.jpg" },
      { color: "Blue", file: "blue.jpg" },
      { color: "Silver", file: "silver.jpg" },
    ],
  },
];

async function main() {
  for (const job of JOBS) {
    const product = await prisma.product.findUnique({ where: { slug: job.slug } });
    if (!product) {
      console.log(`--   ${job.slug}: товара нет в базе (нет в текущем прайсе), пропущено`);
      continue;
    }

    const sourceDir = path.join(__dirname, "..", "seed-photos", job.slug);
    const destDir = path.join(process.cwd(), "public", "uploads", "products", job.slug);
    await mkdir(destDir, { recursive: true });

    const current = (product.colorImages as Record<string, string[]> | null) ?? {};
    const next: Record<string, string[]> = { ...current };

    for (const { color, file } of job.photos) {
      await copyFile(path.join(sourceDir, file), path.join(destDir, file));
      const publicPath = `/uploads/products/${job.slug}/${file}`;
      const existing = next[color] ?? [];
      next[color] = existing.includes(publicPath) ? existing : [...existing, publicPath];
      console.log(`OK   ${job.slug} · ${color} -> ${publicPath}`);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { colorImages: next },
    });
  }

  console.log("\nГотово.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
