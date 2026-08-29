// Синхронизация фотографий смартфонов из репозитория в постоянный Docker-volume.
//
// Источники и точное соответствие цветов находятся в
// prisma/seed-photos/manifest.json. Скрипт копирует файлы в
// public/uploads/products/<slug>/ и обновляет только Product.colorImages —
// цены, остатки и варианты товара он не затрагивает.
//
// Запуск после развёртывания обновлённого кода:
//   docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-iphone-photos.ts

import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type PhotoManifest = {
  version: number;
  jobs: Array<{
    slug: string;
    colors: Record<string, string[]>;
  }>;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function readManifest(seedRoot: string): Promise<PhotoManifest> {
  const raw = await readFile(path.join(seedRoot, "manifest.json"), "utf8");
  const manifest = JSON.parse(raw) as PhotoManifest;

  if (manifest.version !== 1 || !Array.isArray(manifest.jobs)) {
    throw new Error("Неподдерживаемый формат prisma/seed-photos/manifest.json");
  }

  return manifest;
}

function resolveSeedFile(seedRoot: string, relativeFile: string): string {
  const resolved = path.resolve(seedRoot, relativeFile);
  const allowedPrefix = `${path.resolve(seedRoot)}${path.sep}`;
  if (!resolved.startsWith(allowedPrefix)) {
    throw new Error(`Путь выходит за пределы seed-photos: ${relativeFile}`);
  }
  return resolved;
}

async function main() {
  const seedRoot = path.join(__dirname, "..", "seed-photos");
  const manifest = await readManifest(seedRoot);

  let updatedProducts = 0;
  let copiedFiles = 0;

  for (const job of manifest.jobs) {
    const product = await prisma.product.findUnique({ where: { slug: job.slug } });
    if (!product) {
      console.log(`SKIP ${job.slug}: товара нет в базе`);
      continue;
    }

    const destinationDir = path.join(process.cwd(), "public", "uploads", "products", job.slug);
    await mkdir(destinationDir, { recursive: true });

    const current = (product.colorImages as Record<string, string[]> | null) ?? {};
    const next: Record<string, string[]> = { ...current };

    for (const [color, relativeFiles] of Object.entries(job.colors)) {
      const publicPaths: string[] = [];

      for (const relativeFile of relativeFiles) {
        const fileName = path.basename(relativeFile);
        const source = resolveSeedFile(seedRoot, relativeFile);
        const destination = path.join(destinationDir, fileName);
        await copyFile(source, destination);
        publicPaths.push(`/uploads/products/${job.slug}/${fileName}`);
        copiedFiles += 1;
      }

      // Манифест является источником истины для цвета: повторный запуск не
      // создаёт дублей и заменяет устаревший набор фотографий этого цвета.
      next[color] = publicPaths;
      console.log(`OK   ${job.slug} · ${color}: ${publicPaths.length} фото`);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { colorImages: next },
    });
    updatedProducts += 1;
  }

  console.log(`\nГотово: ${updatedProducts} товаров, ${copiedFiles} файлов.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
