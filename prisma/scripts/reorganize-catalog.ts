import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function moveVariantsAndRemove(sourceId: string, targetId: string) {
  await prisma.productVariant.updateMany({ where: { productId: sourceId }, data: { productId: targetId } });
  await prisma.product.delete({ where: { id: sourceId } });
}

async function main() {
  const headphones = await prisma.category.upsert({ where: { slug: "naushniki" }, update: { name: "Наушники", sortOrder: 35 }, create: { slug: "naushniki", name: "Наушники", sortOrder: 35 } });
  const tv = await prisma.category.upsert({ where: { slug: "tv-pristavki" }, update: { name: "ТВ-приставки", sortOrder: 45 }, create: { slug: "tv-pristavki", name: "ТВ-приставки", sortOrder: 45 } });

  const audio = await prisma.product.updateMany({ where: { OR: [{ name: { contains: "AirPods", mode: "insensitive" } }, { name: { contains: "Galaxy Buds", mode: "insensitive" } }] }, data: { categoryId: headphones.id } });
  // В витрине остаётся актуальный AirPods Max 2. Старую модель скрываем,
  // сохраняя её записи и историю цен в базе на случай возврата.
  const retiredAirPodsMax = await prisma.product.updateMany({
    where: { name: { equals: "AirPods Max", mode: "insensitive" } },
    data: { status: "DRAFT" },
  });
  const appleTv = await prisma.product.updateMany({ where: { name: { contains: "Apple TV", mode: "insensitive" } }, data: { categoryId: tv.id } });

  // Apple TV 4K на 64 и 128 ГБ — это одна модель с разной памятью, а не
  // две независимые карточки. Оставляем URL 128-ГБ версии как основной,
  // переносим в него варианты и даём покупателю переключатель памяти.
  const appleTvProducts = await prisma.product.findMany({
    where: { name: { contains: "Apple TV", mode: "insensitive" } },
    include: { variants: true },
    orderBy: { createdAt: "asc" },
  });
  const appleTvPrimary = appleTvProducts.find((product) => /128\s*(?:гб|gb)/i.test(product.name)) ?? appleTvProducts[0];
  if (appleTvPrimary) {
    const images = [...new Set(appleTvProducts.flatMap((product) => product.images))];
    for (const product of appleTvProducts) {
      const memory = /64\s*(?:гб|gb)/i.test(product.name) ? "64GB" : /128\s*(?:гб|gb)/i.test(product.name) ? "128GB" : null;
      if (memory) await prisma.productVariant.updateMany({ where: { productId: product.id }, data: { memory } });
      if (product.id !== appleTvPrimary.id) await moveVariantsAndRemove(product.id, appleTvPrimary.id);
    }
    await prisma.product.update({
      where: { id: appleTvPrimary.id },
      data: {
        name: "Apple TV 4K (3-го поколения)",
        description: "Apple TV 4K (3-го поколения). Выберите объём памяти 64 или 128 ГБ.",
        images,
      },
    });
    const memoryVariants = await prisma.productVariant.findMany({ where: { productId: appleTvPrimary.id }, select: { memory: true } });
    if (!memoryVariants.some((variant) => variant.memory === "64GB")) {
      await prisma.productVariant.create({ data: { productId: appleTvPrimary.id, memory: "64GB", price: null, inStock: true, rawLabel: "Apple TV 4K 64GB — уточнить у менеджера" } });
    }
    if (!memoryVariants.some((variant) => variant.memory === "128GB")) {
      await prisma.productVariant.create({ data: { productId: appleTvPrimary.id, memory: "128GB", price: null, inStock: true, rawLabel: "Apple TV 4K 128GB — уточнить у менеджера" } });
    }
  }

  const series11 = await prisma.product.findFirst({ where: { name: "Apple Watch Series 11" } });
  const shortS11 = await prisma.product.findMany({ where: { name: { contains: "Watch S11", mode: "insensitive" } } });
  if (series11) for (const duplicate of shortS11) if (duplicate.id !== series11.id) await moveVariantsAndRemove(duplicate.id, series11.id);

  const neoCandidates = await prisma.product.findMany({
    where: { OR: [{ slug: "macbook-neo-13" }, { slug: "macbook-neo" }, { name: { equals: "MacBook Neo", mode: "insensitive" } }] },
    orderBy: { createdAt: "asc" },
  });
  const neo = neoCandidates.find((product) => product.slug === "macbook-neo-13") ?? neoCandidates[0];
  if (neo) {
    for (const duplicate of neoCandidates) {
      if (duplicate.id === neo.id) continue;
      await moveVariantsAndRemove(duplicate.id, neo.id);
    }
    await prisma.product.update({ where: { id: neo.id }, data: { name: "MacBook Neo", description: "MacBook Neo с чипом A18 Pro. Выберите память и цвет. Цену и доступность подтвердит менеджер." } });
  }
  console.log(`Перенесено: наушники ${audio.count}, скрыто старых AirPods Max: ${retiredAirPodsMax.count}, ТВ-приставки ${appleTv.count}, объединено Watch S11: ${shortS11.length}, Apple TV: ${appleTvProducts.length}.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
