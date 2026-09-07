// Целевая синхронизация умных очков и фото-/видеотехники.
// Она намеренно не удаляет товары: лишние варианты уходят в скрытый архив,
// а неактуальные GoPro становятся HIDDEN. Так не ломаются история заказов,
// избранное и ссылки, которые могли остаться у покупателей.
import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import {
  KEPT_GOPRO_SLUGS,
  META_PHOTO_CATALOG,
  META_PHOTO_PATHS,
  META_PHOTO_PRODUCT_SLUGS,
  planCatalogVariants,
  shouldHideGoPro,
  type ExistingCatalogVariant,
  type MetaPhotoCatalogProduct,
} from "../data/meta-photo-catalog";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const dryRun = process.argv.includes("--dry-run");

type Transaction = Prisma.TransactionClient;

async function syncProduct(
  tx: Transaction,
  item: MetaPhotoCatalogProduct,
  categoryIds: Record<MetaPhotoCatalogProduct["category"], string>,
) {
  const existing = await tx.product.findUnique({
    where: { slug: item.slug },
    include: { variants: { orderBy: { updatedAt: "desc" } } },
  });
  const existingVariants = (existing?.variants ?? []) as ExistingCatalogVariant[];
  const plan = planCatalogVariants(existingVariants, item.variants);
  const summary = `${item.name}: ${item.variants.length} ${item.variants.length === 1 ? "вариант" : "вариантов"}`;
  if (dryRun) {
    return [
      `PLAN ${summary}`,
      ...plan.remaining.map((variant) => `PLAN ARCHIVE ${item.name}: ${variant.rawLabel ?? variant.id}`),
    ];
  }

  const content = {
    name: item.name,
    brand: item.brand,
    description: item.description,
    images: item.images,
    colorImages: item.colorImages,
    highlights: item.highlights,
    specs: item.specs,
    status: "PUBLISHED" as const,
    categoryId: categoryIds[item.category],
  };
  const primary = existing
    ? await tx.product.update({ where: { id: existing.id }, data: content })
    : await tx.product.create({ data: { slug: item.slug, ...content } });

  if (plan.remaining.length) {
    const archive = await tx.product.upsert({
      where: { slug: `${item.slug}-archive-variants` },
      create: {
        slug: `${item.slug}-archive-variants`,
        name: `${item.name} — архив вариантов`,
        brand: item.brand,
        categoryId: categoryIds[item.category],
        status: "HIDDEN",
      },
      update: { status: "HIDDEN", categoryId: categoryIds[item.category] },
    });
    await tx.productVariant.updateMany({
      where: { id: { in: plan.remaining.map((variant) => variant.id) } },
      data: { productId: archive.id },
    });
  }

  for (const { option, existing: existingVariant } of plan.options) {
    const data = {
      productId: primary.id,
      memory: option.memory ?? null,
      color: option.color ?? null,
      region: option.region ?? null,
      rawLabel: option.rawLabel,
      price: option.price,
      inStock: true,
    };
    if (existingVariant) {
      await tx.productVariant.update({ where: { id: existingVariant.id }, data });
    } else {
      await tx.productVariant.create({ data });
    }
  }

  const saved = await tx.productVariant.findMany({ where: { productId: primary.id } });
  const wantedLabels = new Set(item.variants.map((variant) => variant.rawLabel));
  if (saved.length !== item.variants.length || saved.some((variant) => !variant.rawLabel || !wantedLabels.has(variant.rawLabel))) {
    throw new Error(`Проверка ${item.name} не пройдена: ожидались ровно заданные варианты. Транзакция отменена.`);
  }
  return [`OK ${summary}`, ...plan.remaining.map((variant) => `ARCHIVE ${item.name}: ${variant.rawLabel ?? variant.id}`)];
}

async function main() {
  // Фото поставляются вместе с Docker-образом. Проверяем их до обращения к
  // базе: если файл случайно не попал в коммит, не создаём карточки с
  // пустыми местами вместо изображения.
  await Promise.all([...new Set(META_PHOTO_PATHS)].map((photo) =>
    access(path.join(process.cwd(), "public", photo.slice(1))),
  ));

  const messages = await prisma.$transaction(async (tx) => {
    const goPros = await tx.product.findMany({
      where: { category: { slug: "ekshn-kamery" } },
      include: { category: { select: { slug: true } } },
    });
    const outdatedGoPros = goPros.filter(shouldHideGoPro);
    const log = [
      `${dryRun ? "PLAN" : "OK"} Категория «Умные очки»: ${META_PHOTO_CATALOG.filter((item) => item.category === "smart-ochki").length} моделей`,
      ...outdatedGoPros.map((product) => `${dryRun ? "PLAN HIDDEN" : "HIDDEN"} ${product.name} (${product.slug})`),
    ];

    if (dryRun) {
      const categoryIds = { "smart-ochki": "dry-run", "ekshn-kamery": "dry-run" } as const;
      for (const item of META_PHOTO_CATALOG) log.push(...await syncProduct(tx, item, categoryIds));
      return log;
    }

    const smartGlasses = await tx.category.upsert({
      where: { slug: "smart-ochki" },
      create: {
        slug: "smart-ochki",
        name: "Умные очки",
        attributes: ["Размер", "Оправа", "Линзы"],
        sortOrder: 55,
      },
      update: {
        name: "Умные очки",
        attributes: ["Размер", "Оправа", "Линзы"],
        sortOrder: 55,
      },
    });
    const cameras = await tx.category.upsert({
      where: { slug: "ekshn-kamery" },
      create: {
        slug: "ekshn-kamery",
        name: "Экшн-камеры",
        attributes: ["Память", "Цвет", "Комплектация"],
        sortOrder: 50,
      },
      update: {},
    });
    const categoryIds = { "smart-ochki": smartGlasses.id, "ekshn-kamery": cameras.id } as const;

    for (const item of META_PHOTO_CATALOG) log.push(...await syncProduct(tx, item, categoryIds));
    if (outdatedGoPros.length) {
      await tx.product.updateMany({
        where: { id: { in: outdatedGoPros.map((product) => product.id) } },
        data: { status: "HIDDEN" },
      });
    }

    const products = await tx.product.findMany({
      where: { slug: { in: META_PHOTO_PRODUCT_SLUGS } },
      include: { variants: true },
    });
    if (products.length !== META_PHOTO_CATALOG.length) {
      throw new Error("Проверка каталога не пройдена: создана не каждая карточка. Транзакция отменена.");
    }
    for (const item of META_PHOTO_CATALOG) {
      const saved = products.find((product) => product.slug === item.slug);
      if (!saved || saved.variants.length !== item.variants.length || saved.status !== "PUBLISHED") {
        throw new Error(`Проверка ${item.name} не пройдена. Транзакция отменена.`);
      }
    }
    const visibleUnexpectedGoPro = await tx.product.count({
      where: {
        category: { slug: "ekshn-kamery" },
        brand: { equals: "GoPro", mode: "insensitive" },
        status: "PUBLISHED",
        slug: { notIn: [...KEPT_GOPRO_SLUGS] },
      },
    });
    if (visibleUnexpectedGoPro) {
      throw new Error("Проверка GoPro не пройдена: в витрине осталась лишняя модель. Транзакция отменена.");
    }
    return log;
  }, { timeout: 60000, isolationLevel: "Serializable" });

  for (const message of messages) console.log(message);
  console.log(dryRun
    ? "DRY RUN: база не изменялась."
    : "Готово: карточки созданы, старые GoPro скрыты, лишние варианты сохранены в скрытом архиве.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
