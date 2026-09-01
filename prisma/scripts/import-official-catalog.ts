import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  OFFICIAL_CATALOG_CATEGORIES,
  OFFICIAL_CATALOG_ENTRIES,
  officialVariants,
} from "../official-catalog";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  let created = 0;
  let skipped = 0;

  // Новые разделы витрины создаются вместе с каталогом. update: {} важен:
  // последующие импорты не перетирают правки названий и порядка из админки.
  for (const category of OFFICIAL_CATALOG_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  for (const entry of OFFICIAL_CATALOG_ENTRIES) {
    // Не обновляем существующие товары: в них могут быть реальные цены,
    // остатки и варианты, синхронизированные из прайса поставщика.
    if (await prisma.product.findUnique({ where: { slug: entry.slug }, select: { id: true } })) {
      skipped += 1;
      continue;
    }

    const category = await prisma.category.findUnique({ where: { slug: entry.category } });
    if (!category) throw new Error(`Не найдена категория ${entry.category}`);

    await prisma.product.create({
      data: {
        name: entry.name,
        slug: entry.slug,
        brand: entry.brand,
        description: entry.description,
        status: "PUBLISHED",
        categoryId: category.id,
        variants: { create: officialVariants(entry) },
      },
    });
    created += 1;
  }

  console.log(`Официальный каталог: создано ${created}, уже было ${skipped}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
