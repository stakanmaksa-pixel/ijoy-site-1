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
  const appleTv = await prisma.product.updateMany({ where: { name: { contains: "Apple TV", mode: "insensitive" } }, data: { categoryId: tv.id } });

  const series11 = await prisma.product.findFirst({ where: { name: "Apple Watch Series 11" } });
  const shortS11 = await prisma.product.findMany({ where: { name: { contains: "Watch S11", mode: "insensitive" } } });
  if (series11) for (const duplicate of shortS11) if (duplicate.id !== series11.id) await moveVariantsAndRemove(duplicate.id, series11.id);

  const neo = await prisma.product.findFirst({ where: { slug: "macbook-neo-13" } });
  if (neo) await prisma.product.update({ where: { id: neo.id }, data: { name: "MacBook Neo", description: "MacBook Neo с чипом A18 Pro. Выберите память и цвет. Цену и доступность подтвердит менеджер." } });
  console.log(`Перенесено: наушники ${audio.count}, ТВ-приставки ${appleTv.count}, объединено Watch S11: ${shortS11.length}.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
