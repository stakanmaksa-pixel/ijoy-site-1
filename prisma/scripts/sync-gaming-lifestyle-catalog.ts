// Целевая синхронизация игровой и lifestyle-витрины. Скрипт можно безопасно
// запускать повторно: его варианты обновляются по исходной строке прайса, а
// снятые с продажи варианты не удаляются, а переносятся в скрытый архив.
import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import {
  GAMING_LIFESTYLE_CATALOG,
  GAMING_LIFESTYLE_PHOTO_PATHS,
  GAMING_LIFESTYLE_PRODUCT_SLUGS,
  planGamingLifestyleVariants,
  type GamingLifestyleCategory,
  type GamingLifestyleProduct,
  type ExistingGamingLifestyleVariant,
} from "../data/gaming-lifestyle-catalog";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const dryRun = process.argv.includes("--dry-run");

type Transaction = Prisma.TransactionClient;

const CATEGORY_CONFIG: Record<GamingLifestyleCategory, {
  name: string;
  sortOrder: number;
  attributes: string[];
}> = {
  "igrovye-pristavki": {
    name: "Игровые приставки",
    sortOrder: 40,
    attributes: ["Версия / комплект", "Цвет / издание", "Тип / совместимость"],
  },
  "portativnye-konsoli": {
    name: "Портативные консоли",
    sortOrder: 41,
    attributes: ["Память / версия", "Цвет / издание", "Платформа"],
  },
  "vr-garnitury": {
    name: "VR-гарнитуры",
    sortOrder: 42,
    attributes: ["Память / комплект", "Цвет", "Платформа"],
  },
  "igrovye-aksessuary": {
    name: "Аксессуары для игр",
    sortOrder: 43,
    attributes: ["Версия / комплект", "Цвет / издание", "Совместимость"],
  },
  naushniki: {
    name: "Наушники",
    sortOrder: 35,
    attributes: ["Версия", "Цвет", "Подключение"],
  },
  "fitnes-braslety": {
    name: "Фитнес-браслеты",
    sortOrder: 46,
    attributes: ["Тариф / издание", "Цвет", "Комплект"],
  },
  "portativnaya-akustika": {
    name: "Портативная акустика",
    sortOrder: 47,
    attributes: ["Версия", "Цвет", "Подключение"],
  },
};

async function syncProduct(
  tx: Transaction,
  item: GamingLifestyleProduct,
  categoryIds: Record<GamingLifestyleCategory, string>,
) {
  const existing = await tx.product.findUnique({
    where: { slug: item.slug },
    include: { variants: { orderBy: { updatedAt: "desc" } } },
  });
  const plan = planGamingLifestyleVariants(
    (existing?.variants ?? []) as ExistingGamingLifestyleVariant[],
    item.variants,
  );
  const variantWord = item.variants.length === 1 ? "вариант" : "вариантов";
  const summary = `${item.name}: ${item.variants.length} ${variantWord}`;
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
  // Падение до записи в базу лучше карточек с пустыми серыми плашками, если
  // кто-то забыл добавить фото в коммит или Docker-образ.
  await Promise.all([...new Set(GAMING_LIFESTYLE_PHOTO_PATHS)].map((photo) =>
    access(path.join(process.cwd(), "public", photo.slice(1))),
  ));

  const messages = await prisma.$transaction(async (tx) => {
    const log = [
      `${dryRun ? "PLAN" : "OK"} Игровой и lifestyle-каталог: ${GAMING_LIFESTYLE_CATALOG.length} моделей, ${GAMING_LIFESTYLE_CATALOG.flatMap((item) => item.variants).length} вариантов`,
    ];

    if (dryRun) {
      const dryCategoryIds = Object.fromEntries(
        Object.keys(CATEGORY_CONFIG).map((slug) => [slug, "dry-run"]),
      ) as Record<GamingLifestyleCategory, string>;
      for (const item of GAMING_LIFESTYLE_CATALOG) {
        log.push(...await syncProduct(tx, item, dryCategoryIds));
      }
      return log;
    }

    const categoryIds = {} as Record<GamingLifestyleCategory, string>;
    for (const [slug, config] of Object.entries(CATEGORY_CONFIG) as [GamingLifestyleCategory, typeof CATEGORY_CONFIG[GamingLifestyleCategory]][]) {
      const category = await tx.category.upsert({
        where: { slug },
        create: { slug, ...config },
        update: config,
      });
      categoryIds[slug] = category.id;
    }

    for (const item of GAMING_LIFESTYLE_CATALOG) {
      log.push(...await syncProduct(tx, item, categoryIds));
    }

    const savedProducts = await tx.product.findMany({
      where: { slug: { in: GAMING_LIFESTYLE_PRODUCT_SLUGS } },
      include: { variants: true },
    });
    if (savedProducts.length !== GAMING_LIFESTYLE_CATALOG.length) {
      throw new Error("Проверка каталога не пройдена: создана не каждая карточка. Транзакция отменена.");
    }
    for (const item of GAMING_LIFESTYLE_CATALOG) {
      const saved = savedProducts.find((product) => product.slug === item.slug);
      if (!saved || saved.status !== "PUBLISHED" || saved.variants.length !== item.variants.length) {
        throw new Error(`Проверка ${item.name} не пройдена. Транзакция отменена.`);
      }
    }
    return log;
  }, { timeout: 60000, isolationLevel: "Serializable" });

  for (const message of messages) console.log(message);
  console.log(dryRun
    ? "DRY RUN: база не изменялась."
    : "Готово: игровые, VR, портативные и lifestyle-карточки синхронизированы.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
