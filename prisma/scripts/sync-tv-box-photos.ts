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

function appleTvMemory(variant: { memory: string | null; rawLabel: string | null; price: { toString(): string } | null }) {
  const price = variant.price == null ? null : Number(variant.price.toString());
  // Цена имеет приоритет: именно из-за старой ошибочной подписи вариант
  // за 15 900 ₽ раньше превращался во второй 128GB.
  if (price === 15900) return "64GB" as const;
  if (price === 19900) return "128GB" as const;
  const source = `${variant.memory ?? ""} ${variant.rawLabel ?? ""}`;
  if (/64\s*(?:гб|gb)/i.test(source)) return "64GB" as const;
  if (/128\s*(?:гб|gb)/i.test(source)) return "128GB" as const;
  return null;
}

function betterVariant<T extends { price: { toString(): string } | null }>(memory: "64GB" | "128GB", current: T | undefined, candidate: T) {
  if (!current) return candidate;
  const expectedPrice = memory === "64GB" ? 15900 : 19900;
  const currentPrice = current.price == null ? null : Number(current.price.toString());
  const candidatePrice = candidate.price == null ? null : Number(candidate.price.toString());
  if (candidatePrice === expectedPrice && currentPrice !== expectedPrice) return candidate;
  if (currentPrice == null && candidatePrice != null) return candidate;
  return current;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { name: { contains: "Apple TV", mode: "insensitive" } },
    include: { variants: true },
    orderBy: { createdAt: "asc" },
  });
  if (!products.length) {
    console.log("SKIP: товаров Apple TV в базе нет");
    return;
  }

  // 64 и 128 ГБ — две модификации одного Apple TV 4K. Сначала собираем их
  // в одну карточку, затем жёстко оставляем только два канонических варианта.
  const primary = products.find((product) => product.name === "Apple TV 4K (3-го поколения)")
    ?? products.find((product) => /128\s*(?:гб|gb)/i.test(product.name))
    ?? products[0];
  for (const product of products) {
    if (product.id !== primary.id) {
      await prisma.productVariant.updateMany({ where: { productId: product.id }, data: { productId: primary.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  }

  const variants = await prisma.productVariant.findMany({ where: { productId: primary.id }, orderBy: { createdAt: "asc" } });
  const selected = new Map<"64GB" | "128GB", (typeof variants)[number]>();
  for (const variant of variants) {
    const memory = appleTvMemory(variant);
    if (memory) selected.set(memory, betterVariant(memory, selected.get(memory), variant));
  }

  for (const memory of ["64GB", "128GB"] as const) {
    if (!selected.has(memory)) {
      const created = await prisma.productVariant.create({
        data: { productId: primary.id, memory, price: memory === "64GB" ? 15900 : 19900, inStock: true, rawLabel: `Apple TV 4K ${memory}` },
      });
      selected.set(memory, created);
    }
  }
  const keepIds = [...selected.values()].map((variant) => variant.id);
  await prisma.productVariant.deleteMany({ where: { productId: primary.id, id: { notIn: keepIds } } });
  for (const [memory, variant] of selected) {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { memory, price: memory === "64GB" ? 15900 : 19900, inStock: true, rawLabel: `Apple TV 4K ${memory}` },
    });
  }

  const destinationDir = path.join(process.cwd(), "public", "uploads", "products", primary.slug);
  await mkdir(destinationDir, { recursive: true });
  const paths: string[] = [];
  for (const photo of photos) {
    const response = await fetch(photo.url, { headers: { "User-Agent": "iJoy catalog photo sync" } });
    if (!response.ok) throw new Error(`${photo.file}: HTTP ${response.status}`);
    await writeFile(path.join(destinationDir, photo.file), Buffer.from(await response.arrayBuffer()));
    paths.push(`/uploads/products/${primary.slug}/${photo.file}`);
  }

  await prisma.product.update({
    where: { id: primary.id },
    data: {
      name: "Apple TV 4K (3-го поколения)",
      description: "Apple TV 4K (3-го поколения). Выберите объём памяти 64 или 128 ГБ.",
      images: paths,
    },
  });
  console.log(`OK   Apple TV 4K: ровно 64GB — 15 900 ₽ и 128GB — 19 900 ₽; ${paths.length} фото`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
