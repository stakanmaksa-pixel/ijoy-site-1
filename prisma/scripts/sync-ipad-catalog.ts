// Нормализует актуальную линейку iPad Pro M5 и добавляет Apple Pencil.
// Неизвестные цены iPad остаются null — на витрине это «Уточняйте у менеджера».
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-ipad-catalog.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type IpadOption = {
  memory: "256GB" | "512GB" | "1TB" | "2TB";
  color: "Space Black" | "Silver";
  connectivity: "Wi‑Fi" | "Wi‑Fi + Cellular";
  glass: "Стандартное стекло" | "Нанотекстурное стекло";
};

const memories = ["256GB", "512GB", "1TB", "2TB"] as const;
const colors = ["Space Black", "Silver"] as const;
const connectivity = ["Wi‑Fi", "Wi‑Fi + Cellular"] as const;

const options: IpadOption[] = memories.flatMap((memory) =>
  colors.flatMap((color) =>
    connectivity.flatMap((connection) =>
      (memory === "1TB" || memory === "2TB" ? ["Стандартное стекло", "Нанотекстурное стекло"] as const : ["Стандартное стекло"] as const)
        .map((glass) => ({ memory, color, connectivity: connection, glass })),
    ),
  ),
);

const sharedHighlights = [
  "Ultra Retina XDR с двухслойной OLED‑панелью и ProMotion 10–120 Гц",
  "Чип Apple M5, аппаратное ускорение трассировки лучей и 16‑ядерный Neural Engine",
  "Apple Pencil Pro: наведение, сжатие, вращение пера, тактильный отклик и «Локатор»",
  "Thunderbolt / USB 4 до 40 Гбит/с, Wi‑Fi 7 и Bluetooth 6",
  "До 10 часов работы и быстрая зарядка до 50% примерно за 30 минут",
];

const products = [
  {
    size: "11",
    slug: "ipad-pro-11-m5",
    name: "Apple iPad Pro 11″ M5 (2025)",
    description: "Apple iPad Pro 11″ M5 (2025) — компактный профессиональный планшет с двухслойным OLED‑дисплеем Ultra Retina XDR, мощным чипом M5 и поддержкой Apple Pencil Pro. Выберите память, цвет, тип подключения и вариант стекла.",
    specs: {
      "Модельный год": "2025",
      "Дисплей": "11,1″ Ultra Retina XDR, Tandem OLED, ProMotion 10–120 Гц, True Tone, P3",
      "Разрешение": "2420 × 1668 пикселей, 264 ppi",
      "Яркость": "1000 нит на всей площади, до 1600 нит в HDR, минимальная яркость 1 нит",
      "Стекло": "Стандартное; нанотекстурное — опция для 1 ТБ и 2 ТБ",
      "Процессор": "Apple M5: 9‑ядерный CPU у 256/512 ГБ, 10‑ядерный CPU у 1/2 ТБ; 10‑ядерный GPU",
      "Оперативная память": "12 ГБ у 256/512 ГБ; 16 ГБ у 1/2 ТБ",
      "Накопитель": "256 ГБ, 512 ГБ, 1 ТБ или 2 ТБ",
      "Основная камера": "12 Мп Wide, ƒ/1.8, Smart HDR 4, сканер LiDAR",
      "Фронтальная камера": "12 Мп Center Stage в альбомной ориентации, ƒ/2.0",
      "Видеосъёмка": "4K до 60 кадр/с, ProRes до 4K/30 кадр/с",
      "Звук": "Четыре динамика и четыре студийных микрофона",
      "Беспроводная связь": "Wi‑Fi 7, Bluetooth 6; в Cellular‑версиях 5G/LTE и eSIM",
      "Разъём и передача данных": "Thunderbolt / USB 4, до 40 Гбит/с",
      "Безопасность": "Face ID",
      "Аккумулятор": "31,29 Вт·ч; до 10 часов по Wi‑Fi или видео, до 9 часов по сотовой сети",
      "Быстрая зарядка": "До 50% примерно за 30 минут с адаптером мощностью 60 Вт или выше",
      "Материал корпуса": "Алюминий; цвета Space Black и Silver",
      "Размеры": "249,7 × 177,5 × 5,3 мм",
      "Вес": "444 г (Wi‑Fi) / 446 г (Wi‑Fi + Cellular)",
      "Совместимость": "Apple Pencil Pro, Apple Pencil (USB‑C), Magic Keyboard для iPad Pro 11″",
      "Комплектация": "iPad Pro, кабель USB‑C; комплект поставки адаптера зависит от региона",
    },
  },
  {
    size: "13",
    slug: "ipad-pro-13-m5",
    name: "Apple iPad Pro 13″ M5 (2025)",
    description: "Apple iPad Pro 13″ M5 (2025) — большой профессиональный планшет с двухслойным OLED‑дисплеем Ultra Retina XDR, мощным чипом M5 и поддержкой Apple Pencil Pro. Выберите память, цвет, тип подключения и вариант стекла.",
    specs: {
      "Модельный год": "2025",
      "Дисплей": "13″ Ultra Retina XDR, Tandem OLED, ProMotion 10–120 Гц, True Tone, P3",
      "Разрешение": "2752 × 2064 пикселя, 264 ppi",
      "Яркость": "1000 нит на всей площади, до 1600 нит в HDR, минимальная яркость 1 нит",
      "Стекло": "Стандартное; нанотекстурное — опция для 1 ТБ и 2 ТБ",
      "Процессор": "Apple M5: 9‑ядерный CPU у 256/512 ГБ, 10‑ядерный CPU у 1/2 ТБ; 10‑ядерный GPU",
      "Оперативная память": "12 ГБ у 256/512 ГБ; 16 ГБ у 1/2 ТБ",
      "Накопитель": "256 ГБ, 512 ГБ, 1 ТБ или 2 ТБ",
      "Основная камера": "12 Мп Wide, ƒ/1.8, Smart HDR 4, сканер LiDAR",
      "Фронтальная камера": "12 Мп Center Stage в альбомной ориентации, ƒ/2.0",
      "Видеосъёмка": "4K до 60 кадр/с, ProRes до 4K/30 кадр/с",
      "Звук": "Четыре динамика и четыре студийных микрофона",
      "Беспроводная связь": "Wi‑Fi 7, Bluetooth 6; в Cellular‑версиях 5G/LTE и eSIM",
      "Разъём и передача данных": "Thunderbolt / USB 4, до 40 Гбит/с",
      "Безопасность": "Face ID",
      "Аккумулятор": "38,99 Вт·ч; до 10 часов по Wi‑Fi или видео, до 9 часов по сотовой сети",
      "Быстрая зарядка": "До 50% примерно за 30 минут с адаптером мощностью 60 Вт или выше",
      "Материал корпуса": "Алюминий; цвета Space Black и Silver",
      "Размеры": "281,6 × 215,5 × 5,1 мм",
      "Вес": "579 г (Wi‑Fi) / 582 г (Wi‑Fi + Cellular)",
      "Совместимость": "Apple Pencil Pro, Apple Pencil (USB‑C), Magic Keyboard для iPad Pro 13″",
      "Комплектация": "iPad Pro, кабель USB‑C; комплект поставки адаптера зависит от региона",
    },
  },
] as const;

const pencils = [
  {
    slug: "apple-pencil-2",
    name: "Apple Pencil (2‑го поколения)",
    price: 8000,
    description: "Apple Pencil 2‑го поколения для совместимых моделей iPad. Магнитное крепление, беспроводная зарядка и переключение инструмента двойным касанием.",
    highlights: ["Пиксельная точность и низкая задержка", "Чувствительность к наклону и силе нажатия", "Магнитное крепление, сопряжение и зарядка", "Двойное касание для смены инструмента"],
    specs: {
      "Подключение": "Bluetooth",
      "Зарядка": "Беспроводная при магнитном креплении к совместимому iPad",
      "Управление": "Двойное касание, чувствительность к наклону и силе нажатия",
      "Совместимость": "Не совместим с iPad Pro M5. Подходит к iPad Pro 11″ 1–4‑го поколений, iPad Pro 12,9″ 3–6‑го поколений и другим совместимым моделям",
      "Комплектация": "Apple Pencil (2‑го поколения)",
    },
  },
  {
    slug: "apple-pencil-usb-c",
    name: "Apple Pencil (USB‑C)",
    price: 8100,
    description: "Apple Pencil с USB‑C — точный стилус для заметок, разметки документов и рисования. Поддерживает наведение на iPad Pro M5 и заряжается через USB‑C.",
    highlights: ["Совместим с iPad Pro M5", "Пиксельная точность и низкая задержка", "Наведение Apple Pencil", "Магнитное крепление и зарядка по USB‑C"],
    specs: {
      "Подключение": "Bluetooth и USB‑C",
      "Зарядка": "Через разъём USB‑C под сдвижной крышкой",
      "Управление": "Чувствительность к наклону; без чувствительности к силе нажатия",
      "Совместимость": "iPad Pro 11″ и 13″ M5, а также другие iPad с USB‑C",
      "Комплектация": "Apple Pencil (USB‑C); кабель USB‑C продаётся отдельно",
    },
  },
  {
    slug: "apple-pencil-pro",
    name: "Apple Pencil Pro",
    price: 11000,
    description: "Apple Pencil Pro — профессиональный стилус для iPad Pro M5. Сжатие открывает палитру инструментов, вращение пера управляет формой штриха, а тактильный отклик подтверждает действие.",
    highlights: ["Полная совместимость с iPad Pro 11″ и 13″ M5", "Сжатие, вращение пера и тактильный отклик", "Наведение и двойное касание", "Магнитное крепление, зарядка и поддержка «Локатора»"],
    specs: {
      "Подключение": "Bluetooth",
      "Зарядка": "Беспроводная при магнитном креплении к iPad",
      "Управление": "Сжатие, вращение пера, тактильный отклик, наведение, двойное касание, чувствительность к наклону и силе нажатия",
      "Размеры": "166 × 8,9 мм",
      "Вес": "19,15 г",
      "Совместимость": "iPad Pro 11″ и 13″ с M4 или M5; совместимые iPad Air и iPad mini",
      "Комплектация": "Apple Pencil Pro",
    },
  },
] as const;

function normalized(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[‐‑–—]/g, "-").replace(/\s+/g, " ").trim();
}

function sourceMemory(text: string) {
  if (/\b2\s*tb\b/.test(text)) return "2TB";
  if (/\b1\s*tb\b/.test(text)) return "1TB";
  if (/\b512\s*(gb)?\b/.test(text)) return "512GB";
  if (/\b256\s*(gb)?\b/.test(text)) return "256GB";
  return null;
}

function sourceColor(text: string) {
  if (/space\s*black|черн/.test(text)) return "Space Black";
  if (/silver|серебр/.test(text)) return "Silver";
  return null;
}

function sourceConnectivity(text: string) {
  return /cellular|5g|lte|сотов/.test(text) ? "Wi‑Fi + Cellular" : "Wi‑Fi";
}

function sourceGlass(text: string) {
  return /nano|нанотекстур/.test(text) ? "Нанотекстурное стекло" : "Стандартное стекло";
}

function optionKey(option: IpadOption) {
  return `${option.memory}|${option.color}|${option.connectivity}|${option.glass}`;
}

async function syncIpad(productData: (typeof products)[number], categoryId: string) {
  const candidates = await prisma.product.findMany({
    where: {
      brand: "Apple",
      categoryId,
      name: { contains: "iPad Pro", mode: "insensitive" },
      AND: [
        { name: { contains: "M5", mode: "insensitive" } },
        { name: { contains: productData.size, mode: "insensitive" } },
      ],
    },
    include: { variants: { include: { _count: { select: { orderItems: true } } } } },
  });

  const canonical = await prisma.product.upsert({
    where: { slug: productData.slug },
    create: {
      slug: productData.slug,
      name: productData.name,
      brand: "Apple",
      categoryId,
      status: "PUBLISHED",
      description: productData.description,
      specs: productData.specs,
      highlights: sharedHighlights,
    },
    update: {
      name: productData.name,
      brand: "Apple",
      categoryId,
      status: "PUBLISHED",
      description: productData.description,
      specs: productData.specs,
      highlights: sharedHighlights,
    },
  });

  if (!candidates.some((item) => item.id === canonical.id)) {
    candidates.push({ ...canonical, variants: [] } as (typeof candidates)[number]);
  }

  const priced = candidates.flatMap((item) => item.variants)
    .filter((variant) => variant.price !== null)
    .map((variant) => {
      const text = normalized([variant.memory, variant.color, variant.region, variant.rawLabel].filter(Boolean).join(" "));
      return { variant, key: `${sourceMemory(text)}|${sourceColor(text)}|${sourceConnectivity(text)}|${sourceGlass(text)}` };
    });

  const archive = await prisma.product.upsert({
    where: { slug: `legacy-ipad-pro-${productData.size}-m5-hidden` },
    create: { slug: `legacy-ipad-pro-${productData.size}-m5-hidden`, name: `Legacy iPad Pro ${productData.size} M5`, brand: "Apple", categoryId, status: "DRAFT" },
    update: { status: "DRAFT", categoryId },
  });

  const used = new Set<string>();
  for (const item of options) {
    const region = `${item.connectivity} · ${item.glass}`;
    const match = priced.find(({ variant, key }) => !used.has(variant.id) && key === optionKey(item));
    if (match) {
      used.add(match.variant.id);
      await prisma.productVariant.update({
        where: { id: match.variant.id },
        data: { productId: canonical.id, memory: item.memory, color: item.color, region, inStock: true },
      });
    } else {
      const existing = candidates.flatMap((candidate) => candidate.variants).find((variant) => {
        if (used.has(variant.id) || variant.price !== null) return false;
        return variant.memory === item.memory && variant.color === item.color && normalized(variant.region) === normalized(region);
      });
      if (existing) {
        used.add(existing.id);
        await prisma.productVariant.update({ where: { id: existing.id }, data: { productId: canonical.id, memory: item.memory, color: item.color, region, inStock: true } });
      } else {
        const created = await prisma.productVariant.create({
          data: { productId: canonical.id, memory: item.memory, color: item.color, region, price: null, inStock: true, rawLabel: `${productData.name} ${item.memory} ${item.color} ${item.connectivity} ${item.glass}` },
        });
        used.add(created.id);
      }
    }
  }

  const stale = await prisma.productVariant.findMany({ where: { productId: canonical.id, id: { notIn: [...used] } }, include: { _count: { select: { orderItems: true } } } });
  for (const variant of stale) {
    if (variant._count.orderItems > 0 || variant.price !== null) {
      await prisma.productVariant.update({ where: { id: variant.id }, data: { productId: archive.id } });
    } else {
      await prisma.productVariant.delete({ where: { id: variant.id } });
    }
  }

  await prisma.product.updateMany({
    where: { id: { in: candidates.map((item) => item.id).filter((id) => id !== canonical.id) } },
    data: { status: "DRAFT" },
  });

  console.log(`OK   ${productData.name}: ${options.length} вариантов без дублей`);
}

async function syncPencils(categoryId: string) {
  for (const pencil of pencils) {
    const product = await prisma.product.upsert({
      where: { slug: pencil.slug },
      create: { slug: pencil.slug, name: pencil.name, brand: "Apple", categoryId, status: "PUBLISHED", description: pencil.description, highlights: [...pencil.highlights], specs: pencil.specs },
      update: { name: pencil.name, brand: "Apple", categoryId, status: "PUBLISHED", description: pencil.description, highlights: [...pencil.highlights], specs: pencil.specs },
    });
    const variants = await prisma.productVariant.findMany({ where: { productId: product.id }, orderBy: { createdAt: "asc" } });
    const primary = variants[0];
    const variant = primary
      ? await prisma.productVariant.update({ where: { id: primary.id }, data: { memory: null, color: "White", region: null, price: pencil.price, inStock: true, rawLabel: pencil.name } })
      : await prisma.productVariant.create({ data: { productId: product.id, memory: null, color: "White", region: null, price: pencil.price, inStock: true, rawLabel: pencil.name } });
    for (const extra of variants.slice(1)) {
      const ordered = await prisma.orderItem.count({ where: { variantId: extra.id } });
      if (ordered) continue;
      await prisma.productVariant.delete({ where: { id: extra.id } });
    }
    console.log(`OK   ${pencil.name}: ${pencil.price} ₽ (${variant.id})`);
  }
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: "planshety" } });
  if (!category) throw new Error("Категория planshety не найдена");
  await syncPencils(category.id);
  for (const product of products) await syncIpad(product, category.id);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
