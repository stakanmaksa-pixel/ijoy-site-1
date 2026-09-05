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
};

type WatchVariant = {
  memory: string | null;
  color: string | null;
  region: string | null;
};

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function directAppleImage(imageUrl: string, ...expectedTokens: string[]): ImageSource {
  return { sourcePage: imageUrl, expectedTokens };
}

function ultraAppleImage(asset: string, ...expectedTokens: string[]): ImageSource {
  return directAppleImage(
    `https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/${asset}?wid=1600&hei=1025&bgc=fafafa&trim=1&fmt=p-jpg&qlt=90`,
    ...expectedTokens,
  );
}

function exactKey(color: string, band: string) {
  return `${color}::${band}`;
}

// Используем главное фото выбранной комплектации, а не og:image страницы:
// og:image имеет другой кроп и для части ремешков визуально подменяет товар.
// Все изображения запрашиваются в одном соотношении сторон, поэтому часы в
// карточках имеют одинаковый масштаб и не обрезаются.
const ultra3Sources = new Map<string, ImageSource>([
  [exactKey("Black Titanium", "Trail Loop (Black/Charcoal) S/M"), ultraAppleImage("MG9T4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-trail-ultra3_VW_34FR_GEO_US", "titanium-black", "trail")],
  [exactKey("Black Titanium", "Trail Loop (Black/Charcoal) M/L"), ultraAppleImage("MG9T4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-trail-ultra3_VW_34FR_GEO_US", "titanium-black", "trail")],
  [exactKey("Black Titanium", "Alpine Loop (Black) S"), ultraAppleImage("MG9G4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_US", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Alpine Loop (Black) M"), ultraAppleImage("MG9G4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_US", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Alpine Loop (Black) L"), ultraAppleImage("MG9G4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_US", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Alpine Loop (Light Blue) M"), ultraAppleImage("MG9K4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_MY", "titanium-black", "alpine")],
  [exactKey("Black Titanium", "Ocean Band (Black)"), ultraAppleImage("MYPD3ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-ocean-ultra3_VW_34FR_GEO_US", "titanium-black", "ocean")],
  [exactKey("Black Titanium", "Ocean Band (Neon Green)"), ultraAppleImage("MGCL4_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-ocean-ultra3_VW_34FR_GEO_NZ", "titanium-black", "ocean")],
  [exactKey("Black Titanium", "Milanese Loop (Black Titanium) S"), ultraAppleImage("MGHR4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-milanese-ultra3_VW_34FR_GEO_US", "titanium-black", "milanese")],
  [exactKey("Black Titanium", "Milanese Loop (Black Titanium) M"), ultraAppleImage("MGHR4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-milanese-ultra3_VW_34FR_GEO_US", "titanium-black", "milanese")],
  [exactKey("Black Titanium", "Milanese Loop (Black Titanium) L"), ultraAppleImage("MGHR4ref_VW_34FR+watch-case-49-titanium-black-ultra3_VW_34FR+watch-face-49-milanese-ultra3_VW_34FR_GEO_US", "titanium-black", "milanese")],
  [exactKey("Natural Titanium", "Trail Loop (Blue/Bright Blue) S/M"), ultraAppleImage("MFT64ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-trail-ultra3_VW_34FR_GEO_US", "titanium-natural", "trail")],
  [exactKey("Natural Titanium", "Trail Loop (Blue/Bright Blue) M/L"), ultraAppleImage("MFT64ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-trail-ultra3_VW_34FR_GEO_US", "titanium-natural", "trail")],
  [exactKey("Natural Titanium", "Alpine Loop (Black) L"), ultraAppleImage("MFTE4ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_US", "titanium-natural", "alpine")],
  [exactKey("Natural Titanium", "Alpine Loop (Light Blue) M"), ultraAppleImage("MFTH4ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-alpine-ultra3_VW_34FR_GEO_US", "titanium-natural", "alpine")],
  [exactKey("Natural Titanium", "Ocean Band (Anchor Blue)"), ultraAppleImage("MGCC4_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-ocean-ultra3_VW_34FR_GEO_US", "titanium-natural", "ocean")],
  [exactKey("Natural Titanium", "Milanese Loop (Natural Titanium) S"), ultraAppleImage("MGHN4ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-milanese-ultra3_VW_34FR_GEO_US", "titanium-natural", "milanese")],
  [exactKey("Natural Titanium", "Milanese Loop (Natural Titanium) M"), ultraAppleImage("MGHN4ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-milanese-ultra3_VW_34FR_GEO_US", "titanium-natural", "milanese")],
  [exactKey("Natural Titanium", "Milanese Loop (Natural Titanium) L"), ultraAppleImage("MGHN4ref_VW_34FR+watch-case-49-titanium-natural-ultra3_VW_34FR+watch-face-49-milanese-ultra3_VW_34FR_GEO_US", "titanium-natural", "milanese")],
]);

const colorSources: Record<string, Record<string, ImageSource>> = {
  "apple-watch-series-11": {
    "Space Gray": directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/42-nc-aluminum-spacegray-sport-band-black-s11?wid=1000&hei=1000&fmt=jpeg&qlt=95", "spacegray"),
    "Rose Gold": directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/42-nc-aluminum-rosegold-sport-band-lightblush-s11?wid=1000&hei=1000&fmt=jpeg&qlt=95", "rosegold"),
    "Jet Black": directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/42-nc-aluminum-jetblack-sport-band-black-s11?wid=1000&hei=1000&fmt=jpeg&qlt=95", "jetblack"),
    Silver: directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/refurb-46-s11-alum-silver-sport-band-fog?wid=1000&hei=1000&fmt=jpeg&qlt=95", "silver"),
    "Gold Titanium": directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/42-cell-titanium-gold-milanese-gold-s11?wid=1000&hei=1000&fmt=jpeg&qlt=95", "titanium-gold"),
    "Natural Titanium": directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/42-cell-titanium-natural-milanese-natural-s11?wid=1000&hei=1000&fmt=jpeg&qlt=95", "titanium-natural"),
    "Slate Titanium": directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/42-cell-titanium-slate-milanese-slate-s11?wid=1000&hei=1000&fmt=jpeg&qlt=95", "titanium-slate"),
  },
  "apple-watch-se-3": {
    Starlight: directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/40-nc-aluminum-starlight-sport-band-starlight-se?wid=1000&hei=1000&fmt=jpeg&qlt=95", "starlight"),
    Midnight: directAppleImage("https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/40-nc-aluminum-midnight-sport-band-midnight-se?wid=1000&hei=1000&fmt=jpeg&qlt=95", "midnight"),
  },
};

async function downloadOfficialImage(source: ImageSource, label: string): Promise<Buffer> {
  const imageUrl = source.sourcePage;
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

      const fileName = slug === "apple-watch-ultra-3"
        // Имя зависит только от самой комплектации, а не от порядка строк в
        // базе. Повторная синхронизация перезапишет тот же файл и не создаст
        // новые URL, которые запущенный Next.js ещё не успел увидеть.
        ? `variant-${safeFileName(`${variant.color}-${variant.region ?? "watch"}`)}.jpg`
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
