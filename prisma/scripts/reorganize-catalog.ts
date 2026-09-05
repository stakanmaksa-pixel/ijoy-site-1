import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function moveVariantsAndRemove(sourceId: string, targetId: string) {
  await prisma.productVariant.updateMany({ where: { productId: sourceId }, data: { productId: targetId } });
  await prisma.product.delete({ where: { id: sourceId } });
}

function memoryForAppleTvVariant(variant: { memory: string | null; rawLabel: string | null; price: { toString(): string } | null }) {
  // В исходном прайсе зафиксированы именно две позиции: 64 ГБ за 15 900 ₽
  // и 128 ГБ за 19 900 ₽. Сначала используем цену: она лечит старую ошибку,
  // при которой вариант 64 ГБ получил метку 128 ГБ. Для будущих обновлений
  // прайса остаётся запасной разбор исходной строки.
  const price = variant.price == null ? null : Number(variant.price.toString());
  if (price === 15900) return "64GB";
  if (price === 19900) return "128GB";

  const source = `${variant.rawLabel ?? ""} ${variant.memory ?? ""}`;
  if (/64\s*(?:гб|gb)/i.test(source)) return "64GB";
  if (/128\s*(?:гб|gb)/i.test(source)) return "128GB";
  return null;
}

function preferAppleTvVariant<T extends { price: { toString(): string } | null; rawLabel: string | null }>(current: T | undefined, candidate: T) {
  if (!current) return candidate;
  // Настоящая строка прайса всегда ценнее технического варианта с null-ценой.
  if (current.price == null && candidate.price != null) return candidate;
  if (current.price != null && candidate.price == null) return current;
  // При одинаковом статусе цены выбираем строку, в которой объём явно указан
  // в исходном прайсе: так повторный запуск остаётся предсказуемым.
  const hasMemory = (value: T) => /(?:64|128)\s*(?:гб|gb)/i.test(value.rawLabel ?? "");
  return !hasMemory(current) && hasMemory(candidate) ? candidate : current;
}

async function main() {
  const headphones = await prisma.category.upsert({ where: { slug: "naushniki" }, update: { name: "Наушники", sortOrder: 35 }, create: { slug: "naushniki", name: "Наушники", sortOrder: 35 } });
  const tv = await prisma.category.upsert({ where: { slug: "tv-pristavki" }, update: { name: "ТВ-приставки", sortOrder: 45 }, create: { slug: "tv-pristavki", name: "ТВ-приставки", sortOrder: 45 } });

  const audio = await prisma.product.updateMany({ where: { OR: [{ name: { contains: "AirPods", mode: "insensitive" } }, { name: { contains: "Galaxy Buds", mode: "insensitive" } }] }, data: { categoryId: headphones.id } });
  // В витрине остаётся актуальный AirPods Max 2. Старую модель скрываем,
  // сохраняя её записи и историю цен в базе на случай возврата.
  const retiredAirPodsMax = await prisma.product.updateMany({
    // Max 2 остаётся в продаже; любые более старые позиции Max скрываем даже
    // если в прайсе к названию добавили цвет, память или другой суффикс.
    where: {
      AND: [
        { name: { contains: "AirPods Max", mode: "insensitive" } },
        { NOT: { name: { contains: "AirPods Max 2", mode: "insensitive" } } },
      ],
    },
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
    // В прежней версии скрипта при повторном запуске мог появиться второй
    // "128GB" и пустой "64GB". Нормализуем итог прямо здесь: только две
    // реальные позиции из прайса и без догадок о цене.
    const appleTvVariants = await prisma.productVariant.findMany({
      where: { productId: appleTvPrimary.id },
      orderBy: { createdAt: "asc" },
    });
    const selected = new Map<string, (typeof appleTvVariants)[number]>();
    for (const variant of appleTvVariants) {
      const memory = memoryForAppleTvVariant(variant);
      if (!memory) continue;
      selected.set(memory, preferAppleTvVariant(selected.get(memory), variant));
    }

    for (const [memory, variant] of selected) {
      if (variant.memory !== memory) {
        await prisma.productVariant.update({ where: { id: variant.id }, data: { memory } });
      }
    }

    const keepIds = [...selected.values()].map((variant) => variant.id);
    if (keepIds.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: appleTvPrimary.id, id: { notIn: keepIds } } });
    }
    for (const memory of ["64GB", "128GB"] as const) {
      if (!selected.has(memory)) {
        await prisma.productVariant.create({
          data: {
            productId: appleTvPrimary.id,
            memory,
            price: null,
            inStock: true,
            rawLabel: `Apple TV 4K ${memory} — уточнить у менеджера`,
          },
        });
      }
    }

    const finalAppleTvVariants = await prisma.productVariant.findMany({
      where: { productId: appleTvPrimary.id },
      select: { memory: true, price: true },
      orderBy: { memory: "asc" },
    });
    console.log(`Apple TV варианты: ${finalAppleTvVariants.map((variant) => `${variant.memory} — ${variant.price?.toString() ?? "уточнить"}`).join(", ")}.`);
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
