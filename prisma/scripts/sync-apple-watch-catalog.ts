// Добавляет выбор размера корпуса, цвета и ремешка для актуальных Apple Watch.
// Неизвестные цены намеренно остаются null: на витрине это «Уточняйте у менеджера».
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-apple-watch-catalog.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

type WatchOption = { size: string; caseColor: string; band: string };
const option = (size: string, caseColor: string, band: string): WatchOption => ({ size, caseColor, band });

const series11: WatchOption[] = [
  ...["Space Gray", "Rose Gold", "Jet Black", "Silver"].flatMap((caseColor) => ["S/M", "M/L"].map((fit) => option("42 мм", caseColor, `Sport Band (${caseColor === "Rose Gold" ? "Light Blush" : caseColor === "Silver" ? "Purple Fog" : "Black"}) ${fit}`))),
  ...["Space Gray", "Rose Gold", "Jet Black", "Silver"].flatMap((caseColor) => ["S/M", "M/L"].map((fit) => option("46 мм", caseColor, `Sport Band (${caseColor === "Rose Gold" ? "Light Blush" : caseColor === "Silver" ? "Purple Fog" : "Black"}) ${fit}`))),
  option("42 мм", "Gold Titanium", "Milanese Loop (Gold)"),
  option("42 мм", "Natural Titanium", "Milanese Loop (Natural)"),
  option("42 мм", "Slate Titanium", "Milanese Loop (Slate)"),
  option("46 мм", "Gold Titanium", "Milanese Loop (Gold) S/M"),
  option("46 мм", "Gold Titanium", "Milanese Loop (Gold) M/L"),
  option("46 мм", "Natural Titanium", "Milanese Loop (Natural) S/M"),
  option("46 мм", "Natural Titanium", "Milanese Loop (Natural) M/L"),
  option("46 мм", "Slate Titanium", "Milanese Loop (Slate) S/M"),
  option("46 мм", "Slate Titanium", "Milanese Loop (Slate) M/L"),
];

const ultra3: WatchOption[] = [
  option("49 мм", "Black Titanium", "Trail Loop (Black/Charcoal) S/M"), option("49 мм", "Black Titanium", "Trail Loop (Black/Charcoal) M/L"),
  option("49 мм", "Black Titanium", "Alpine Loop (Black) S"), option("49 мм", "Black Titanium", "Alpine Loop (Black) M"), option("49 мм", "Black Titanium", "Alpine Loop (Black) L"),
  option("49 мм", "Black Titanium", "Alpine Loop (Light Blue) M"), option("49 мм", "Black Titanium", "Ocean Band (Black)"), option("49 мм", "Black Titanium", "Ocean Band (Neon Green)"),
  option("49 мм", "Black Titanium", "Milanese Loop (Black Titanium) S"), option("49 мм", "Black Titanium", "Milanese Loop (Black Titanium) M"), option("49 мм", "Black Titanium", "Milanese Loop (Black Titanium) L"),
  option("49 мм", "Natural Titanium", "Trail Loop (Blue/Bright Blue) S/M"), option("49 мм", "Natural Titanium", "Trail Loop (Blue/Bright Blue) M/L"),
  option("49 мм", "Natural Titanium", "Alpine Loop (Black) L"), option("49 мм", "Natural Titanium", "Alpine Loop (Light Blue) M"), option("49 мм", "Natural Titanium", "Ocean Band (Anchor Blue)"),
  option("49 мм", "Natural Titanium", "Milanese Loop (Natural Titanium) S"), option("49 мм", "Natural Titanium", "Milanese Loop (Natural Titanium) M"), option("49 мм", "Natural Titanium", "Milanese Loop (Natural Titanium) L"),
];

const se3: WatchOption[] = [
  ...["Starlight", "Midnight"].flatMap((caseColor) => ["Sport Band", "Sport Loop"].flatMap((band) => ["S/M", "M/L"].map((fit) => option("40 мм", caseColor, `${band} ${fit}`)))),
  ...["Starlight", "Midnight"].flatMap((caseColor) => ["Sport Band", "Sport Loop"].flatMap((band) => ["S/M", "M/L"].map((fit) => option("44 мм", caseColor, `${band} ${fit}`)))),
];

const data = [
  { slug: "apple-watch-ultra-3", description: "Apple Watch Ultra 3 — прочные спортивные часы в титановом корпусе 49 мм с ярким Always-On Retina дисплеем, точным двухчастотным GPS и автономностью до 42 часов. Выберите цвет корпуса и подходящий ремешок.", options: ultra3 },
  { slug: "apple-watch-series-11", description: "Apple Watch Series 11. Выберите размер корпуса, цвет и ремешок. Цену и доступность подтвердит менеджер.", options: series11 },
  { slug: "apple-watch-se-3", description: "Apple Watch SE 3. Выберите размер корпуса, цвет и ремешок. Цену и доступность подтвердит менеджер.", options: se3 },
];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const ultra3Content = {
  description: "Apple Watch Ultra 3 — прочные спортивные часы в титановом корпусе 49 мм с ярким Always-On Retina дисплеем, точным двухчастотным GPS и автономностью до 42 часов. Выберите цвет корпуса и подходящий ремешок.",
  highlights: [
    "Титановый корпус Grade 5 и сапфировое стекло",
    "До 42 часов работы и до 72 часов в режиме энергосбережения",
    "Водонепроницаемость 100 м и погружения с аквалангом до 40 м",
    "Точный двухчастотный GPS L1 + L5",
  ],
  specs: {
    "Корпус": "49 мм, титан Grade 5 — натуральный или чёрный",
    "Размеры": "49 × 44 × 12 мм",
    "Вес": "61,6 г (натуральный титан) / 61,8 г (чёрный титан)",
    "Обхват запястья": "130–210 мм",
    "Дисплей": "Always-On Retina, широкоугольный OLED LTPO3, сапфировое стекло",
    "Разрешение": "422 × 514 пикселей, 326 пикселей на дюйм",
    "Яркость": "До 3000 нит, минимальная яркость 1 нит",
    "Процессор": "Apple S10, 64-битный двухъядерный процессор, 4-ядерный Neural Engine",
    "Память": "64 ГБ",
    "Навигация": "Двухчастотный GPS L1 + L5, ГЛОНАСС, Galileo, QZSS и BeiDou",
    "Датчики": "Электрический и оптический датчики сердца, температура, глубина и температура воды, компас, высотомер",
    "Защита": "Водонепроницаемость 100 м, IP6X, погружения до 40 м, испытания MIL-STD 810H",
    "Связь": "Wi-Fi 2,4/5 ГГц, Bluetooth 5.3, сотовая и спутниковая связь (зависит от региона)",
    "Аккумулятор": "До 42 часов; до 72 часов в режиме энергосбережения",
    "Быстрая зарядка": "До 80% примерно за 45 минут",
    "Совместимость": "iPhone 11 или новее с iOS 26 или новее",
  },
  previousGenLabel: "Apple Watch Ultra 2",
  previousGenHighlights: [
    "До 42 часов обычной работы вместо 36 часов",
    "Широкоугольный OLED LTPO3 дисплей с частотой обновления от 1 Гц",
    "Поддержка спутниковой связи для экстренных функций, сообщений и Локатора",
  ],
};

function normalized(value: string) {
  return value.toLowerCase().replace(/[(),-]/g, " ").replace(/\s+/g, " ").trim();
}

function optionBandType(value: string) {
  if (/trail/i.test(value)) return "trail";
  if (/alpine/i.test(value)) return "alpine";
  if (/ocean/i.test(value)) return "ocean";
  if (/milanese/i.test(value)) return "milanese";
  return "";
}

function sourceBandType(value: string) {
  if (/milanese/.test(value)) return "milanese";
  if (/ocean/.test(value)) return "ocean";
  if (/alpine|\balp\b|light blue loop/.test(value)) return "alpine";
  if (/trail|charcoal|bright blue loop/.test(value)) return "trail";
  return "";
}

function sourceBandSize(value: string) {
  const mixed = value.match(/\b(s\/m|m\/l)\b/i)?.[1];
  if (mixed) return mixed.toUpperCase();
  return value.match(/\b([sml])\b(?=\s+[a-z0-9]{4,}\b)/i)?.[1]?.toUpperCase() ?? null;
}

function optionBandSize(value: string) {
  return value.match(/(?:^|\s)(S\/M|M\/L|S|M|L)$/)?.[1] ?? null;
}

function matchesUltraBase(source: string, item: WatchOption) {
  const caseMatches = item.caseColor === "Natural Titanium" ? /natural/.test(source) : /black/.test(source) && !/natural/.test(source);
  if (!caseMatches || sourceBandType(source) !== optionBandType(item.band)) return false;
  if (/black\/charcoal/i.test(item.band) && !/charcoal/.test(source)) return false;
  if (/blue\/bright blue/i.test(item.band) && !/bright blue/.test(source)) return false;
  if (/light blue/i.test(item.band) && !/light blue/.test(source)) return false;
  if (/neon green/i.test(item.band) && !/neon green/.test(source)) return false;
  if (/anchor blue/i.test(item.band) && !/anchor blue/.test(source)) return false;
  return true;
}

async function syncUltra3(
  product: Awaited<ReturnType<typeof prisma.product.findUniqueOrThrow>> & { variants: Array<{ id: string; memory: string | null; color: string | null; region: string | null; price: unknown; inStock: boolean; rawLabel: string | null; sku: string | null }> },
  description: string,
  options: WatchOption[],
) {
  const priced = product.variants.filter((variant) => variant.price !== null);
  const matches = new Map<number, (typeof priced)[number]>();
  const usedOptions = new Set<number>();
  const unmatched: string[] = [];

  for (const variant of priced) {
    const source = normalized([variant.memory, variant.color, variant.region, variant.rawLabel].filter(Boolean).join(" "));
    const candidates = options
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => !usedOptions.has(index) && matchesUltraBase(source, item));
    const size = sourceBandSize(source);
    const selected = candidates.find(({ item }) => optionBandSize(item.band) === size) ?? candidates[0];
    if (!selected) {
      unmatched.push(variant.rawLabel ?? variant.id);
      continue;
    }
    usedOptions.add(selected.index);
    matches.set(selected.index, variant);
  }

  if (unmatched.length) {
    throw new Error(`Apple Watch Ultra 3: не удалось сопоставить строки прайса: ${unmatched.join("; ")}`);
  }

  await prisma.productVariant.deleteMany({ where: { productId: product.id, price: null } });
  for (const [index, item] of options.entries()) {
    const existing = matches.get(index);
    if (existing) {
      await prisma.productVariant.update({
        where: { id: existing.id },
        data: { memory: item.size, color: item.caseColor, region: item.band },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          memory: item.size,
          color: item.caseColor,
          region: item.band,
          price: null,
          inStock: true,
          rawLabel: `${product.name} ${item.size}, ${item.caseColor}, ${item.band} — уточнить у менеджера`,
        },
      });
    }
  }
  await prisma.product.update({ where: { id: product.id }, data: { description } });
}

async function main() {
  for (const entry of data) {
    const product = await prisma.product.findUnique({ where: { slug: entry.slug }, include: { variants: true } });
    if (!product) {
      console.log(`SKIP ${entry.slug}: товара нет в базе`);
      continue;
    }
    if (entry.slug === "apple-watch-ultra-3") {
      await syncUltra3(product, entry.description, entry.options);
      await prisma.product.update({ where: { id: product.id }, data: ultra3Content });
      console.log(`OK   ${product.name}: ${entry.options.length} вариантов без дублей`);
      continue;
    }
    // Заменяем только сгенерированные варианты без прайсовой цены. Реальные
    // строки поставщика не трогаем.
    await prisma.productVariant.deleteMany({ where: { productId: product.id, price: null } });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        description: entry.description,
        variants: { create: entry.options.map((item) => ({ memory: item.size, color: item.caseColor, region: item.band, price: null, inStock: true, rawLabel: `${product.name} ${item.size}, ${item.caseColor}, ${item.band} — уточнить у менеджера` })) },
      },
    });
    console.log(`OK   ${product.name}: ${entry.options.length} вариантов`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
