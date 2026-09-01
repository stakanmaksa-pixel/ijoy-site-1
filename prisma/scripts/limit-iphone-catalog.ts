import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// До 16-й линейки на витрине остаются только эти обычные iPhone и объёмы.
// Новые модели (16 и новее) скрипт вообще не трогает.
const MEMORY_TO_KEEP: Record<string, string[]> = {
  "iphone-13": ["128GB"],
  "iphone-14": ["128GB", "512GB"],
  "iphone-15": ["128GB", "256GB", "512GB"],
};

const PRODUCTS_TO_REMOVE = [
  "iphone-13-mini",
  "iphone-13-pro",
  "iphone-13-pro-max",
  "iphone-14-plus",
  "iphone-14-pro",
  "iphone-14-pro-max",
  "iphone-15-plus",
  "iphone-15-pro",
  "iphone-15-pro-max",
];

async function limitMemories(slug: string, allowedMemories: string[]) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) return { removed: 0, preservedForOrders: 0 };

  // Удаляем только варианты без истории заказов. Варианты из уже
  // оформленных заказов должны оставаться в БД, иначе будет нарушена
  // история продаж и внешние ключи.
  const removable = {
    productId: product.id,
    memory: { notIn: allowedMemories },
    orderItems: { none: {} },
  };
  const result = await prisma.productVariant.deleteMany({ where: removable });
  const preservedForOrders = await prisma.productVariant.count({
    where: {
      productId: product.id,
      memory: { notIn: allowedMemories },
      orderItems: { some: {} },
    },
  });
  return { removed: result.count, preservedForOrders };
}

async function removeProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: { select: { id: true, orderItems: { select: { id: true }, take: 1 } } } },
  });
  if (!product) return "not-found";

  const hasOrders = product.variants.some((variant) => variant.orderItems.length > 0);
  if (hasOrders) {
    await prisma.product.update({ where: { id: product.id }, data: { status: "HIDDEN" } });
    return "hidden";
  }

  await prisma.product.delete({ where: { id: product.id } });
  return "deleted";
}

async function main() {
  for (const [slug, memories] of Object.entries(MEMORY_TO_KEEP)) {
    const result = await limitMemories(slug, memories);
    console.log(`${slug}: удалено вариантов ${result.removed}, сохранено для истории заказов ${result.preservedForOrders}`);
  }

  let deleted = 0;
  let hidden = 0;
  for (const slug of PRODUCTS_TO_REMOVE) {
    const result = await removeProduct(slug);
    if (result === "deleted") deleted += 1;
    if (result === "hidden") hidden += 1;
    console.log(`${slug}: ${result}`);
  }

  console.log(`iPhone-каталог обновлён: удалено моделей ${deleted}, скрыто с историей заказов ${hidden}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
