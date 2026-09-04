// Сохраняет официальные фото актуальных Apple Watch в общий uploads volume.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-watch-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const sources = [
  { slug: "apple-watch-ultra-3", page: "https://www.apple.com/newsroom/2025/09/introducing-apple-watch-ultra-3/" },
  { slug: "apple-watch-series-11", page: "https://www.apple.com/newsroom/2025/09/apple-debuts-apple-watch-series-11-featuring-groundbreaking-health-insights/" },
  { slug: "apple-watch-se-3", page: "https://www.apple.com/newsroom/2025/09/apple-introduces-apple-watch-se-3/" },
];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function ogImage(html: string) {
  return html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1]
    ?? null;
}

async function main() {
  for (const source of sources) {
    const product = await prisma.product.findUnique({ where: { slug: source.slug }, include: { variants: { select: { color: true } } } });
    if (!product) continue;
    try {
      const page = await fetch(source.page, { headers: { "User-Agent": "iJoy catalog photo sync" } });
      const imageUrl = page.ok ? ogImage(await page.text()) : null;
      if (!imageUrl) throw new Error("официальная страница не отдала фото");
      const image = await fetch(imageUrl.replaceAll("&amp;", "&"), { headers: { "User-Agent": "iJoy catalog photo sync" } });
      if (!image.ok) throw new Error(`фото недоступно, HTTP ${image.status}`);
      const directory = path.join(process.cwd(), "public", "uploads", "products", product.slug);
      await mkdir(directory, { recursive: true });
      const publicPath = `/uploads/products/${product.slug}/cover.jpg`;
      await writeFile(path.join(directory, "cover.jpg"), Buffer.from(await image.arrayBuffer()));
      const colors = [...new Set(product.variants.map((variant) => variant.color).filter((color): color is string => Boolean(color)))];
      await prisma.product.update({ where: { id: product.id }, data: { images: [publicPath], colorImages: Object.fromEntries(colors.map((color) => [color, [publicPath]])) } });
      console.log(`OK   ${product.name}`);
    } catch (error) {
      console.error(`SKIP ${product.name}: ${error instanceof Error ? error.message : error}`);
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
