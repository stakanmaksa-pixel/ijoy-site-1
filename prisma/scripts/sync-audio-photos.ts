// Синхронизация фотографий актуальных наушников.
// Для AirPods Max 2 у каждого цвета своя фотография из официальной
// страницы Apple: общая картинка линейки не используется.
//
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-audio-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

type ImageSource = {
  sourcePage: string;
  directImage?: string;
};

type AudioJob = ImageSource & {
  label: string;
  matches: string[];
  exclude?: RegExp;
  required?: boolean;
};

const jobs: AudioJob[] = [
  {
    label: "AirPods Pro 3",
    matches: ["AirPods Pro 3", "AirPods Pro (3"],
    sourcePage: "https://www.apple.com/airpods-pro/",
    directImage: "https://www.apple.com/v/airpods-pro/s/images/meta/og__c0ceegchesom_overview.png?202608111253",
    required: true,
  },
  {
    label: "AirPods 4 ANC",
    matches: ["AirPods 4 ANC"],
    sourcePage: "https://www.apple.com/shop/buy-airpods/airpods-4/with-active-noise-cancellation",
    required: true,
  },
  {
    label: "AirPods 4",
    matches: ["AirPods 4", "AirPods (4"],
    exclude: /anc/i,
    sourcePage: "https://www.apple.com/shop/buy-airpods/airpods-4",
    required: true,
  },
  {
    label: "AirPods Pro 2",
    matches: ["AirPods Pro 2", "AirPods Pro (2"],
    sourcePage: "https://www.apple.com/newsroom/2023/09/apple-upgrades-airpods-pro-2nd-generation-with-usb-c-charging/",
    directImage: "https://www.apple.com/newsroom/images/2023/09/apple-introduces-new-airpods-pro-2nd-generation/article/Apple-AirPods-Pro-2nd-generation-USB-C-connection-230912_inline.jpg.large.jpg",
    required: true,
  },
];

const max2ColorSources = {
  Midnight: "https://www.apple.com/shop/buy-airpods/airpods-max-2/midnight",
  Starlight: "https://www.apple.com/shop/buy-airpods/airpods-max-2/starlight",
  Blue: "https://www.apple.com/shop/buy-airpods/airpods-max-2/blue",
  Purple: "https://www.apple.com/shop/buy-airpods/airpods-max-2/purple",
  Orange: "https://www.apple.com/shop/buy-airpods/airpods-max-2/orange",
} as const;

type Max2Color = keyof typeof max2ColorSources;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function extractImageUrl(html: string): string | null {
  const meta = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  return meta?.[1]?.startsWith("https://") ? meta[1].replaceAll("&amp;", "&") : null;
}

async function resolveImageCandidates(source: ImageSource): Promise<string[]> {
  const candidates = source.directImage ? [source.directImage] : [];
  try {
    const page = await fetch(source.sourcePage, { headers: { "User-Agent": "Mozilla/5.0 iJoy catalog photo sync" } });
    if (page.ok) {
      const image = extractImageUrl(await page.text());
      if (image) candidates.push(image);
    }
  } catch {
    // Следующая проверенная ссылка остаётся резервной.
  }
  if (!candidates.length) throw new Error("не удалось найти og:image на странице источника");
  return [...new Set(candidates)];
}

async function downloadImage(candidates: string[], label: string): Promise<Buffer> {
  for (const url of candidates) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 iJoy catalog photo sync" } });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.startsWith("image/")) {
        console.warn(`WARN ${label}: HTTP ${response.status} или не изображение для ${url}`);
        continue;
      }
      const image = Buffer.from(await response.arrayBuffer());
      if (image.byteLength < 4_096) {
        console.warn(`WARN ${label}: слишком маленький файл для ${url}`);
        continue;
      }
      return image;
    } catch {
      console.warn(`WARN ${label}: не удалось скачать ${url}`);
    }
  }
  throw new Error(`${label}: фото недоступно по всем проверенным ссылкам`);
}

function resolveMax2Color(color: string | null): Max2Color | null {
  const value = color?.toLowerCase() ?? "";
  if (value.includes("midnight") || value.includes("тёмная ночь") || value.includes("темная ночь")) return "Midnight";
  if (value.includes("starlight") || value.includes("сияющая звезда")) return "Starlight";
  if (value.includes("blue") || value.includes("синий")) return "Blue";
  if (value.includes("purple") || value.includes("фиолет")) return "Purple";
  if (value.includes("orange") || value.includes("оранж")) return "Orange";
  return null;
}

async function writeProductImage(slug: string, fileName: string, image: Buffer) {
  const destinationDir = path.join(process.cwd(), "public", "uploads", "products", slug);
  await mkdir(destinationDir, { recursive: true });
  await writeFile(path.join(destinationDir, fileName), image);
  return `/uploads/products/${slug}/${fileName}`;
}

async function syncAirPodsMax2(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { name: { contains: "AirPods Max 2", mode: "insensitive" } },
    include: { variants: true },
  });
  if (!products.length) return [];

  const officialImages = new Map<Max2Color, Buffer>();
  for (const [color, sourcePage] of Object.entries(max2ColorSources) as [Max2Color, string][]) {
    officialImages.set(color, await downloadImage(await resolveImageCandidates({ sourcePage }), `AirPods Max 2 ${color}`));
  }

  const failures: string[] = [];
  for (const product of products) {
    const colorImages: Record<string, string[]> = {};
    for (const variant of product.variants) {
      const officialColor = resolveMax2Color(variant.color);
      if (!variant.color || !officialColor) {
        failures.push(`${product.name}: неизвестный цвет «${variant.color ?? "не указан"}»`);
        continue;
      }
      const image = officialImages.get(officialColor)!;
      const file = `max2-${officialColor.toLowerCase()}.jpg`;
      colorImages[variant.color] = [await writeProductImage(product.slug, file, image)];
    }
    if (failures.length) continue;

    const fallback = colorImages[product.variants[0]?.color ?? ""]?.[0];
    await prisma.product.update({
      where: { id: product.id },
      data: { images: fallback ? [fallback] : [], colorImages },
    });
    console.log(`OK   ${product.name}: отдельные фото для ${Object.keys(colorImages).length} цветов`);
  }
  if (failures.length) throw new Error(failures.join("; "));
  return products.map((product) => product.name);
}

async function main() {
  let updated = 0;
  const requiredFailures: string[] = [];

  for (const job of jobs) {
    const matchingProducts = await prisma.product.findMany({
      where: { OR: job.matches.map((match) => ({ name: { contains: match, mode: "insensitive" } })) },
    });
    const products = job.exclude ? matchingProducts.filter((product) => !job.exclude?.test(product.name)) : matchingProducts;
    if (!products.length) {
      console.log(`SKIP ${job.label}: товара нет в базе`);
      continue;
    }

    try {
      const image = await downloadImage(await resolveImageCandidates(job), job.label);
      for (const product of products) {
        const publicPath = await writeProductImage(product.slug, "cover.jpg", image);
        await prisma.product.update({ where: { id: product.id }, data: { images: [publicPath] } });
        updated += 1;
        console.log(`OK   ${product.name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${job.label}: ${message}`);
      if (job.required) requiredFailures.push(message);
    }
  }

  await syncAirPodsMax2();
  if (requiredFailures.length) throw new Error(`Не загружены обязательные фото: ${requiredFailures.join("; ")}`);
  console.log(`\nГотово: ${updated} товаров с общими фото и точные фото цветов AirPods Max 2.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
