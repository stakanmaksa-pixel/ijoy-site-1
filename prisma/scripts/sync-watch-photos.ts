// Сохраняет официальные фото актуальных Apple Watch в общий uploads volume.
// Ultra 3 получает фото каждой точной конфигурации (корпус + ремешок),
// Series 11 и SE 3 — отдельное фото для каждого цвета корпуса.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-watch-photos.ts

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { variantImageKey } from "../../src/lib/pickCoverImage";

type ImageSource = {
  sourcePage: string;
  expectedTokens: string[];
  directImage?: boolean;
};

type WatchVariant = {
  memory: string | null;
  color: string | null;
  region: string | null;
};

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function appleProductPage(line: "apple-watch" | "apple-watch-se" | "apple-watch-ultra", code: string) {
  return `https://www.apple.com/shop/buy-watch/${line}?product=${encodeURIComponent(code)}&step=select`;
}

function productCodeSource(
  line: "apple-watch" | "apple-watch-se" | "apple-watch-ultra",
  code: string,
  ...expectedTokens: string[]
): ImageSource {
  return { sourcePage: appleProductPage(line, code), expectedTokens };
}

function directAppleImage(imageUrl: string, ...expectedTokens: string[]): ImageSource {
  return { sourcePage: imageUrl, expectedTokens, directImage: true };
}

function exactKey(color: string, band: string) {
  return `${color}::${band}`;
}

// Артикулы Apple дают устойчивую страницу именно выбранной комплектации,
// а не общую рекламную картинку линейки. Три нестандартных сочетания из
// витрины Store77 берём с региональных официальных страниц Apple.
const ultra3Sources = new Map<string, ImageSource>([
  [exactKey("Black Titanium", "Trail Loop (Black/Charcoal) S/M"), productCodeSource("apple-watch-ultra", "MF1D4LW/A", "titanium-black", "trail")],
  [exactKey("Black Titanium", "Trail Loop (Black/Charcoal) M/L"), productCodeSource("apple-watch-ultra", "MF1H4LW/A", "titanium-black", "trail")],
  [exactKey("Black Titanium", "Alpine Loop (Black) S"), productCodeSource("apple-watch-ultra", "MF0Q4LW/A", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Alpine Loop (Black) M"), productCodeSource("apple-watch-ultra", "MF0V4LW/A", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Alpine Loop (Black) L"), productCodeSource("apple-watch-ultra", "MF0X4LW/A", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Alpine Loop (Light Blue) M"), directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MG9K4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_MY?wid=1000&hei=1000&fmt=jpeg&qlt=95", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Ocean Band (Black)"), productCodeSource("apple-watch-ultra", "MF0J4LW/A", "titanium-black", "ocean")],
  [exactKey("Black Titanium", "Ocean Band (Neon Green)"), directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MGCL4_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-ocean-ultra3_VW_34FR_GEO_NZ?wid=1000&hei=1000&fmt=jpeg&qlt=95", "titanium-black", "ocean")],
  [exactKey("Black Titanium", "Milanese Loop (Black Titanium) S"), productCodeSource("apple-watch-ultra", "MF1N4LW/A", "titanium-black", "milanese")],
  [exactKey("Black Titanium", "Milanese Loop (Black Titanium) M"), productCodeSource("apple-watch-ultra", "MF1Q4LW/A", "titanium-black", "milanese")],
  [exactKey("Black Titanium", "Milanese Loop (Black Titanium) L"), productCodeSource("apple-watch-ultra", "MF1T4LW/A", "titanium-black", "milanese")],
  [exactKey("Natural Titanium", "Trail Loop (Blue/Bright Blue) S/M"), productCodeSource("apple-watch-ultra", "MEWR4LW/A", "titanium-natural", "trail")],
  [exactKey("Natural Titanium", "Trail Loop (Blue/Bright Blue) M/L"), productCodeSource("apple-watch-ultra", "MEWU4LW/A", "titanium-natural", "trail")],
  [exactKey("Natural Titanium", "Alpine Loop (Black) L"), directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MFTE4ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_US?wid=1000&hei=1000&fmt=jpeg&qlt=95", "titanium-natural", "alpine")],
  [exactKey("Natural Titanium", "Alpine Loop (Light Blue) M"), productCodeSource("apple-watch-ultra", "MEWM4LW/A", "titanium-natural", "alpine")],
  [exactKey("Natural Titanium", "Ocean Band (Anchor Blue)"), productCodeSource("apple-watch-ultra", "MEWH4LW/A", "titanium-natural", "ocean")],
  [exactKey("Natural Titanium", "Milanese Loop (Natural Titanium) S"), productCodeSource("apple-watch-ultra", "MEWW4LW/A", "titanium-natural", "milanese")],
  [exactKey("Natural Titanium", "Milanese Loop (Natural Titanium) M"), productCodeSource("apple-watch-ultra", "MEWY4LW/A", "titanium-natural", "milanese")],
  [exactKey("Natural Titanium", "Milanese Loop (Natural Titanium) L"), productCodeSource("apple-watch-ultra", "MF0E4LW/A", "titanium-natural", "milanese")],
]);

const colorSources: Record<string, Record<string, ImageSource>> = {
  "apple-watch-series-11": {
    "Space Gray": productCodeSource("apple-watch", "MEQW4LW/A", "spacegray"),
    "Rose Gold": productCodeSource("apple-watch", "MEU04LW/A", "rosegold"),
    "Jet Black": productCodeSource("apple-watch", "MEQT4LW/A", "jetblack"),
    Silver: {
      sourcePage: "https://www.apple.com/shop/product/feva4lw/a/refurbished-apple-watch-series-11-gps-46mm-silver-aluminum-case-with-m-l-purple-fog-sport-band",
      expectedTokens: ["silver"],
    },
    "Gold Titanium": productCodeSource("apple-watch", "MF8Y4LW/A", "titanium-gold"),
    "Natural Titanium": productCodeSource("apple-watch", "MF8P4LW/A", "titanium-natural"),
    "Slate Titanium": productCodeSource("apple-watch", "MF8U4LW/A", "titanium-slate"),
  },
  "apple-watch-se-3": {
    Starlight: productCodeSource("apple-watch-se", "MEH34LW/A", "starlight"),
    Midnight: productCodeSource("apple-watch-se", "MEH94LW/A", "midnight"),
  },
};

function extractImageUrl(html: string): string | null {
  const meta = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  return meta?.[1]?.startsWith("https://") ? meta[1].replaceAll("&amp;", "&") : null;
}

async function downloadOfficialImage(source: ImageSource, label: string): Promise<Buffer> {
  let imageUrl = source.sourcePage;
  if (!source.directImage) {
    const page = await fetch(source.sourcePage, { headers: { "User-Agent": "Mozilla/5.0 iJoy catalog photo sync" } });
    if (!page.ok) throw new Error(`${label}: страница Apple вернула HTTP ${page.status}`);
    const pageImageUrl = extractImageUrl(await page.text());
    if (!pageImageUrl) throw new Error(`${label}: Apple не отдала og:image`);
    imageUrl = pageImageUrl;
  }
  const normalizedUrl = imageUrl.toLowerCase().replaceAll("-", "");
  if (source.expectedTokens.some((token) => !normalizedUrl.includes(token.toLowerCase().replaceAll("-", "")))) {
    throw new Error(`${label}: Apple вернула общую картинку вместо нужной конфигурации`);
  }

  const response = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0 iJoy catalog photo sync" } });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.startsWith("image/")) {
    throw new Error(`${label}: фото недоступно, HTTP ${response.status}`);
  }
  const image = Buffer.from(await response.arrayBuffer());
  if (image.byteLength < 4_096) throw new Error(`${label}: получен слишком маленький файл`);
  return image;
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function writeImage(slug: string, fileName: string, image: Buffer) {
  const directory = path.join(process.cwd(), "public", "uploads", "products", slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), image);
  return `/uploads/products/${slug}/${fileName}`;
}

function fallbackUltraSource(variant: WatchVariant): ImageSource | null {
  const isNatural = /natural/i.test(variant.color ?? "");
  return ultra3Sources.get(exactKey(
    isNatural ? "Natural Titanium" : "Black Titanium",
    isNatural ? "Trail Loop (Blue/Bright Blue) S/M" : "Trail Loop (Black/Charcoal) S/M",
  )) ?? null;
}

async function main() {
  const slugs = ["apple-watch-ultra-3", "apple-watch-series-11", "apple-watch-se-3"];
  for (const slug of slugs) {
    const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
    if (!product) {
      console.log(`SKIP ${slug}: товара нет в базе`);
      continue;
    }

    const colorImages: Record<string, string[]> = {};
    const downloaded = new Map<string, Buffer>();
    let number = 0;

    for (const variant of product.variants) {
      if (!variant.color) throw new Error(`${product.name}: у варианта не указан цвет корпуса`);
      const source = slug === "apple-watch-ultra-3"
        ? ultra3Sources.get(exactKey(variant.color, variant.region ?? "")) ?? fallbackUltraSource(variant)
        : colorSources[slug]?.[variant.color];
      if (!source) throw new Error(`${product.name}: нет источника фото для «${variant.color}, ${variant.region ?? "без ремешка"}»`);

      let image = downloaded.get(source.sourcePage);
      if (!image) {
        image = await downloadOfficialImage(source, `${product.name}, ${variant.color}, ${variant.region ?? "без ремешка"}`);
        downloaded.set(source.sourcePage, image);
      }

      number += 1;
      const fileName = slug === "apple-watch-ultra-3"
        ? `variant-${number}-${safeFileName(`${variant.color}-${variant.region ?? "watch"}`)}.jpg`
        : `color-${safeFileName(variant.color)}.jpg`;
      const publicPath = await writeImage(slug, fileName, image);
      colorImages[variantImageKey(variant)] = [publicPath];
      colorImages[variant.color] ??= [publicPath];
    }

    const fallback = Object.values(colorImages)[0]?.[0];
    await prisma.product.update({
      where: { id: product.id },
      data: { images: fallback ? [fallback] : [], colorImages },
    });
    console.log(`OK   ${product.name}: ${product.variants.length} вариантов, ${downloaded.size} официальных фото`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
