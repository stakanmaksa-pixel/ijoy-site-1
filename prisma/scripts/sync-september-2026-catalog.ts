// Targeted September 2026 catalogue update. It never changes an existing
// offer's price, stock, SKU or id and never reseeds unrelated products.
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { createHash } from "node:crypto";
import { ANDROID_PHONE_CATALOG } from "../data/android-phone-catalog";
import { APPLE_WATCH_ULTRA4, planUltra4Addition, ULTRA4_PHOTO_ENTRIES } from "../data/apple-watch-ultra4-catalog";
import { IPHONE_2026_CATALOG, planIphone2026Addition } from "../data/iphone-2026-catalog";
import {
  SEPTEMBER_2026_PHOTO_FILES,
  SEPTEMBER_2026_PRODUCTS,
  SEPTEMBER_2026_SOURCES,
  planSeptemberProduct,
} from "../data/september-2026-catalog";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const pura = ANDROID_PHONE_CATALOG.find((product) => product.slug === "huawei-pura-90s-pro") ?? (() => {
  throw new Error("HUAWEI Pura 90s Pro отсутствует в проверенном каталоге");
})();

const normalized = (value: string | null) => (value ?? "").toLowerCase().replace(/[\s‑–—_-]+/g, "");

function jsonColorImages(value: unknown): Record<string, string[]> {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Некорректный формат colorImages");
  const result: Record<string, string[]> = {};
  for (const [key, images] of Object.entries(value)) {
    if (!Array.isArray(images) || !images.every((image) => typeof image === "string")) throw new Error(`Некорректные фото цвета: ${key}`);
    result[key] = [...images];
  }
  return result;
}

function planPura(existing?: {
  images: string[];
  colorImages: unknown;
  variants: Array<{ memory: string | null; color: string | null; region: string | null }>;
} | null) {
  const colorImages = jsonColorImages(existing?.colorImages);
  for (const variant of pura!.variants) {
    if (!variant.color) throw new Error("HUAWEI Pura 90s Pro: вариант без цвета");
    if (!colorImages[variant.color]?.length) colorImages[variant.color] = [variant.image, ...(variant.images ?? [])];
  }
  const variantsToCreate = pura!.variants
    .filter((variant) => !existing?.variants.some((old) =>
      normalized(old.memory) === normalized(variant.memory) &&
      normalized(old.color) === normalized(variant.color) &&
      normalized(old.region) === normalized(variant.region),
    ))
    .map((variant) => ({ memory: variant.memory, color: variant.color, region: variant.region, price: null, inStock: false }));
  return {
    images: existing?.images.length ? [...existing.images] : [pura!.variants[0].image],
    colorImages,
    variantsToCreate,
  };
}

async function validateBundledPhotos() {
  for (const file of SEPTEMBER_2026_PHOTO_FILES) {
    if (!/^[a-z0-9-]+\.jpg$/.test(file)) throw new Error(`Недопустимое имя фото: ${file}`);
    const bytes = await readFile(path.join(process.cwd(), "public", "catalog", "product-photos", "september-2026", file));
    if (bytes.length < 10_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error(`Некорректный JPEG: ${file}`);
  }
  const puraWhite = path.join(process.cwd(), "public", "catalog", "product-photos", "phones", "huawei-pura-90s-pro-coconut-white.png");
  const bytes = await readFile(puraWhite);
  if (bytes.length < 10_000 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("Существующее фото HUAWEI Pura 90s Pro Coconut White повреждено");
  }
  for (const photo of ULTRA4_PHOTO_ENTRIES) {
    const photoBytes = await readFile(path.join(process.cwd(), "public", "catalog", "product-photos", photo.file));
    if (createHash("sha256").update(photoBytes).digest("hex") !== photo.sha256) throw new Error(`Фото Ultra 4 повреждено: ${photo.file}`);
  }
}

async function main() {
  await validateBundledPhotos();
  const targetSlugs = [
    ...SEPTEMBER_2026_PRODUCTS.map((product) => product.slug),
    ...IPHONE_2026_CATALOG.map((product) => product.slug),
    APPLE_WATCH_ULTRA4.slug,
    pura.slug,
  ];
  await prisma.$transaction(async (tx) => {
    const categorySlugs = [...new Set(SEPTEMBER_2026_PRODUCTS.map((product) => product.category))];
    const categories = await tx.category.findMany({ where: { slug: { in: categorySlugs } } });
    const missingCategories = categorySlugs.filter((slug) => !categories.some((category) => category.slug === slug));
    if (missingCategories.length) throw new Error(`Не найдены категории: ${missingCategories.join(", ")}. База не изменена.`);
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
    const existing = await tx.product.findMany({
      where: { slug: { in: targetSlugs } },
      include: { variants: true, category: true },
    });
    const oldBySlug = new Map(existing.map((product) => [product.slug, product]));

    const productPlans = SEPTEMBER_2026_PRODUCTS.map((product) => {
      const old = oldBySlug.get(product.slug);
      if (old && old.category.slug !== product.category) throw new Error(`${product.slug}: товар находится в другой категории`);
      const plan = planSeptemberProduct(product, old, {
        replaceExistingPhotos: product.slug === "apple-watch-series-12" || product.slug === "dyson-camerajet",
      });
      console.log(`${old ? "UPDATE" : "CREATE"} ${product.name}: новых вариантов ${plan.variantsToCreate.length}`);
      return { product, old, plan };
    });

    const iphonePlans = IPHONE_2026_CATALOG.map((product) => {
      const old = oldBySlug.get(product.slug);
      if (old && old.category.slug !== "telefony") throw new Error(`${product.slug}: товар находится в другой категории`);
      const plan = planIphone2026Addition(product, old, { replaceExistingPhotos: true });
      console.log(`${old ? "PHOTO" : "CREATE"} ${product.name}: новых вариантов ${plan.variantsToCreate.length}`);
      return { product, old, plan };
    });

    const ultraOld = oldBySlug.get(APPLE_WATCH_ULTRA4.slug);
    if (ultraOld && ultraOld.category.slug !== "chasy") throw new Error("Apple Watch Ultra 4 находится в другой категории");
    const ultraPlan = planUltra4Addition(ultraOld);
    console.log(`${ultraOld ? "PHOTOS" : "CREATE"} ${APPLE_WATCH_ULTRA4.name}: ${ULTRA4_PHOTO_ENTRIES.length} фото + ${ultraPlan.variantsToCreate.length} новых вариантов`);

    const puraOld = oldBySlug.get(pura.slug);
    if (puraOld && puraOld.category.slug !== "telefony") throw new Error("HUAWEI Pura 90s Pro находится в другой категории");
    const puraPlan = planPura(puraOld);
    console.log(`${puraOld ? "KEEP" : "CREATE"} ${pura.name}: Coconut White уже в комплекте; новых вариантов ${puraPlan.variantsToCreate.length}`);

    if (dryRun) {
      console.log("DRY RUN: фото и планы проверены, база не изменялась.");
      return;
    }

    const backupDir = path.resolve("backups/september-2026-catalog");
    await mkdir(backupDir, { recursive: true });
    const backup = path.join(backupDir, `before-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify({ targets: targetSlugs, sources: SEPTEMBER_2026_SOURCES, before: existing }, null, 2), { flag: "wx" });
    console.log(`Backup: ${backup}`);

    for (const { product, old, plan } of productPlans) {
      const category = categoryBySlug.get(product.category)!;
      const { variantsToCreate, ...photos } = plan;
      const content = {
        name: product.name,
        brand: product.brand,
        description: product.description,
        highlights: product.highlights,
        specs: product.specs,
        ...photos,
        status: "PUBLISHED" as const,
      };
      if (!old) {
        await tx.product.create({ data: { ...content, slug: product.slug, categoryId: category.id, variants: { create: variantsToCreate } } });
      } else {
        await tx.product.update({ where: { id: old.id }, data: { ...content, variants: { create: variantsToCreate } } });
      }
    }

    for (const { product, old, plan } of iphonePlans) {
      const category = categoryBySlug.get("telefony")!;
      const { variantsToCreate, ...photos } = plan;
      if (!old) {
        const { colors: _colors, ...content } = product;
        await tx.product.create({ data: { ...content, ...photos, status: "PUBLISHED", categoryId: category.id, variants: { create: variantsToCreate } } });
      } else {
        await tx.product.update({ where: { id: old.id }, data: { ...photos, status: "PUBLISHED", variants: { create: variantsToCreate } } });
      }
    }

    const watchCategory = categoryBySlug.get("chasy")!;
    const { variantsToCreate: ultraVariants, ...ultraPhotos } = ultraPlan;
    if (!ultraOld) {
      await tx.product.create({ data: {
        ...APPLE_WATCH_ULTRA4,
        ...ultraPhotos,
        status: "PUBLISHED",
        categoryId: watchCategory.id,
        variants: { create: ultraVariants },
      } });
    } else {
      await tx.product.update({ where: { id: ultraOld.id }, data: {
        ...ultraPhotos,
        status: "PUBLISHED",
        variants: { create: ultraVariants },
      } });
    }

    const phoneCategory = categoryBySlug.get("telefony")!;
    const { variantsToCreate: puraVariants, ...puraPhotos } = puraPlan;
    if (!puraOld) {
      await tx.product.create({ data: {
        slug: pura.slug,
        name: pura.name,
        brand: pura.brand,
        description: pura.description,
        highlights: pura.highlights,
        specs: pura.specs,
        ...puraPhotos,
        status: "PUBLISHED",
        categoryId: phoneCategory.id,
        variants: { create: puraVariants },
      } });
    } else {
      await tx.product.update({ where: { id: puraOld.id }, data: {
        ...puraPhotos,
        status: "PUBLISHED",
        ...(!puraOld.description ? { description: pura.description } : {}),
        ...(!puraOld.specs ? { specs: pura.specs } : {}),
        ...(!puraOld.highlights.length ? { highlights: pura.highlights } : {}),
        variants: { create: puraVariants },
      } });
    }
    console.log("Готово: целевые позиции опубликованы; существующие цены, остатки, SKU и id сохранены.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
