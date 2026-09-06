// Загружает официальные фото Apple для актуальных iPad и Apple Pencil.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-ipad-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { variantImageKey } from "../../src/lib/pickCoverImage";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const sources: Record<string, Record<string, string>> = {
  "ipad-pro-11-m5": {
    "Space Black": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-11-select-wifi-spaceblack-202405?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Silver: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-11-select-wifi-silver-202405?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "ipad-pro-13-m5": {
    "Space Black": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-13-select-wifi-spaceblack-202405?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Silver: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-13-select-wifi-silver-202405?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "ipad-air-11-m4": {
    "Space Gray": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-11inch-space-gray-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Blue: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-11inch-blue-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Purple: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-11inch-purple-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Starlight: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-11inch-starlight-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "ipad-air-13-m4": {
    "Space Gray": "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-13inch-space-gray-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Blue: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-13inch-blue-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Purple: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-13inch-purple-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Starlight: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-13inch-starlight-wifi?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "ipad-a16": {
    Blue: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-2022-hero-blue-wifi-select?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Pink: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-2022-hero-pink-wifi-select?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Yellow: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-2022-hero-yellow-wifi-select?wid=1200&hei=1200&fmt=jpeg&qlt=95",
    Silver: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-2022-hero-silver-wifi-select?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "apple-pencil-2": {
    White: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MU8F2?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "apple-pencil-usb-c": {
    White: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MUWA3?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
  "apple-pencil-pro": {
    White: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MX2D3?wid=1200&hei=1200&fmt=jpeg&qlt=95",
  },
};

function safe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function download(url: string, label: string) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 iJoy catalog sync" } });
  if (!response.ok) throw new Error(`${label}: Apple вернула HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  const body = Buffer.from(await response.arrayBuffer());
  if (!type.startsWith("image/") || body.length < 10_000) throw new Error(`${label}: получен некачественный файл (${type}, ${body.length} байт)`);
  return body;
}

async function main() {
  for (const [slug, colors] of Object.entries(sources)) {
    const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
    if (!product) throw new Error(`${slug}: сначала запустите sync-ipad-catalog.ts`);
    const directory = path.join(process.cwd(), "public", "uploads", "products", slug);
    await mkdir(directory, { recursive: true });
    const colorImages: Record<string, string[]> = {};
    for (const [color, url] of Object.entries(colors)) {
      const image = await download(url, `${product.name}, ${color}`);
      const fileName = `official-v1-${safe(color)}.jpg`;
      await writeFile(path.join(directory, fileName), image);
      const publicPath = `/uploads/products/${slug}/${fileName}`;
      colorImages[color] = [publicPath];
      for (const variant of product.variants.filter((item) => item.color === color)) {
        colorImages[variantImageKey(variant)] = [publicPath];
      }
    }
    const fallback = Object.values(colorImages)[0]?.[0];
    await prisma.product.update({ where: { id: product.id }, data: { images: fallback ? [fallback] : [], colorImages } });
    console.log(`OK   ${product.name}: ${Object.keys(colors).length} официальных фото`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
