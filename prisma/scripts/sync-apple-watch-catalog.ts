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
  ...["Starlight", "Midnight"].flatMap((caseColor) => ["S/M", "M/L"].map((fit) => option("40 мм", caseColor, `Sport Band (${caseColor}) ${fit}`))),
  ...["Starlight", "Midnight"].flatMap((caseColor) => ["S/M", "M/L"].map((fit) => option("44 мм", caseColor, `Sport Band (${caseColor}) ${fit}`))),
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

const series11Content = {
  description: "Apple Watch Series 11 — универсальные умные часы Apple в корпусе 42 или 46 мм. Always-On Retina дисплей, чип S10, расширенные функции здоровья и автономность до 24 часов подходят для повседневного использования, спорта и контроля показателей организма.",
  highlights: [
    "Always-On Retina дисплей яркостью до 2000 нит",
    "До 24 часов работы и до 38 часов в режиме энергосбережения",
    "ЭКГ, контроль пульса, температуры, сна и показателей здоровья",
    "Защита от воды 50 м и глубиномер до 6 м",
    "Быстрая зарядка до 80% примерно за 30 минут",
  ],
  specs: {
    "Модельный год": "2025",
    "Размер корпуса": "42 мм или 46 мм",
    "Цвета": "Алюминий: розовое золото, серебристый, серый космос, глянцевый чёрный. Титан: золотой, натуральный, графитовый",
    "Память": "64 ГБ",
    "Дисплей": "Always-On Retina, широкоугольный OLED LTPO3, 326 ppi",
    "Разрешение": "42 мм — 374 × 446 пикселей; 46 мм — 416 × 496 пикселей",
    "Яркость": "От 1 до 2000 нит",
    "Стекло": "Ion-X с повышенной стойкостью к царапинам у алюминиевых моделей; сапфировое у титановых",
    "Процессор": "Apple S10, 64-битный двухъядерный процессор, 4-ядерный Neural Engine",
    "Датчики": "Электрический и оптический датчики сердца, температура, компас, высотомер, глубина и температура воды",
    "Здоровье": "ЭКГ, пульс, уведомления о нерегулярном ритме, сон, оценка сна, температура и отслеживание цикла",
    "Навигация": "GPS L1, ГЛОНАСС, Galileo, QZSS и BeiDou",
    "Связь": "Wi-Fi 2,4/5 ГГц, Bluetooth 5.3; Cellular-модели поддерживают 5G RedCap и LTE — зависит от региона",
    "Аккумулятор": "До 24 часов обычного использования; до 38 часов в режиме энергосбережения",
    "Быстрая зарядка": "До 80% примерно за 30 минут; 15 минут зарядки дают до 8 часов работы",
    "Материал корпуса": "Алюминий или титан",
    "Размеры": "42 мм — 42 × 36 × 9,7 мм; 46 мм — 46 × 39 × 9,7 мм",
    "Вес": "От 29,7 до 43,1 г — зависит от размера, материала и версии связи",
    "Обхват запястья": "42 мм — 130–200 мм; 46 мм — 140–245 мм",
    "Защита": "Водостойкость 50 м, защита от пыли IP6X, глубиномер до 6 м",
    "Совместимость": "iPhone 11 или новее с iOS 26 или новее",
    "Комплектация": "Apple Watch Series 11, ремешок, магнитный кабель быстрой зарядки USB-C длиной 1 м",
  },
  previousGenLabel: "Apple Watch Series 10",
  previousGenHighlights: [
    "До 24 часов обычной работы вместо 18 часов",
    "Стекло Ion-X у алюминиевых моделей вдвое устойчивее к царапинам",
    "Cellular-модели получили поддержку 5G RedCap",
  ],
};

const se3Content = {
  description: "Apple Watch SE 3 — доступные умные часы Apple в алюминиевом корпусе 40 или 44 мм. Always-On Retina дисплей, чип S10, контроль сна и показателей здоровья, защита от воды 50 м и быстрая зарядка подходят для повседневного использования и спорта.",
  highlights: [
    "Always-On Retina дисплей яркостью до 1000 нит",
    "До 18 часов работы и до 32 часов в режиме энергосбережения",
    "Чип S10, жесты двойного касания и взмаха запястьем",
    "Контроль пульса, температуры, сна и уведомления об апноэ",
    "Водостойкость 50 м и быстрая зарядка до 80% примерно за 45 минут",
  ],
  specs: {
    "Модельный год": "2025",
    "Размер корпуса": "40 мм или 44 мм",
    "Цвета": "Алюминий: сияющая звезда (Starlight) или тёмная ночь (Midnight)",
    "Память": "64 ГБ",
    "Дисплей": "Always-On Retina, OLED LTPO, 326 ppi",
    "Разрешение": "40 мм — 324 × 394 пикселя; 44 мм — 368 × 448 пикселей",
    "Яркость": "От 2 до 1000 нит",
    "Стекло": "Ion-X с повышенной стойкостью к трещинам",
    "Процессор": "Apple S10, 64-битный двухъядерный процессор, 4-ядерный Neural Engine",
    "Датчики": "Оптический датчик сердца 2-го поколения, температура, компас, высотомер, акселерометр и гироскоп",
    "Здоровье": "Пульс, уведомления о нерегулярном ритме, сон, оценка сна, уведомления об апноэ, температура и отслеживание цикла",
    "Навигация": "GPS L1, ГЛОНАСС, Galileo, QZSS и BeiDou",
    "Связь": "Wi-Fi 2,4 ГГц, Bluetooth 5.3; Cellular-модели поддерживают 5G RedCap и LTE — зависит от региона",
    "Аккумулятор": "До 18 часов обычного использования; до 32 часов в режиме энергосбережения",
    "Быстрая зарядка": "До 80% примерно за 45 минут; 15 минут зарядки дают до 8 часов работы",
    "Материал корпуса": "Алюминий",
    "Размеры": "40 мм — 40 × 34 × 10,7 мм; 44 мм — 44 × 38 × 10,7 мм",
    "Вес": "40 мм — 26,3 г (GPS) или 26,4 г (Cellular); 44 мм — 32,9 г (GPS) или 33 г (Cellular)",
    "Обхват запястья": "40 мм — 130–200 мм; 44 мм — 140–245 мм",
    "Защита": "Водостойкость 50 м, подходит для плавания",
    "Безопасность": "Экстренный вызов SOS, обнаружение падения и распознавание аварий",
    "Совместимость": "iPhone 11 или новее с iOS 26 или новее",
    "Комплектация": "Apple Watch SE 3, ремешок Sport Band, магнитный кабель быстрой зарядки USB-C длиной 1 м",
  },
  previousGenLabel: "Apple Watch SE (2-го поколения)",
  previousGenHighlights: [
    "Always-On дисплей вместо экрана, выключавшегося в покое",
    "Чип S10 и новые жесты управления",
    "Датчик температуры и уведомления об апноэ сна",
    "Поддержка быстрой зарядки",
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
  if (/sport loop/i.test(value)) return "sport-loop";
  if (/sport band/i.test(value)) return "sport";
  return "";
}

function sourceBandType(value: string) {
  if (/milanese/.test(value)) return "milanese";
  if (/ocean/.test(value)) return "ocean";
  if (/alpine|\balp\b|light blue loop/.test(value)) return "alpine";
  if (/trail|charcoal|bright blue loop/.test(value)) return "trail";
  if (/sport loop|\bsl\b/.test(value)) return "sport-loop";
  if (/sport band|\bsb\b/.test(value)) return "sport";
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

function sourceSeriesColor(source: string) {
  if (/jet black/.test(source)) return "Jet Black";
  if (/rose gold/.test(source)) return "Rose Gold";
  if (/space gr(?:a|e)y/.test(source)) return "Space Gray";
  if (/silver/.test(source)) return "Silver";
  if (/natural titanium|titanium natural/.test(source)) return "Natural Titanium";
  if (/slate titanium|titanium slate/.test(source)) return "Slate Titanium";
  if (/gold titanium|titanium gold/.test(source)) return "Gold Titanium";
  return null;
}

function matchesSeriesBase(source: string, item: WatchOption) {
  const sourceSize = source.match(/\b(42|46)\b/)?.[1];
  if (`${sourceSize ?? ""} мм` !== item.size || sourceSeriesColor(source) !== item.caseColor) return false;
  const wantedType = optionBandType(item.band);
  const foundType = sourceBandType(source) || (wantedType === "sport" ? "sport" : "");
  if (wantedType !== foundType) return false;
  const wantedSize = optionBandSize(item.band);
  const foundSize = sourceBandSize(source);
  return !wantedSize || !foundSize || wantedSize === foundSize;
}

async function syncSeries11(
  product: Awaited<ReturnType<typeof prisma.product.findUniqueOrThrow>> & { variants: Array<{ id: string; memory: string | null; color: string | null; region: string | null; price: unknown; inStock: boolean; rawLabel: string | null; sku: string | null }> },
  options: WatchOption[],
) {
  const priced = product.variants.filter((variant) => variant.price !== null);
  const matches = new Map<number, (typeof priced)[number]>();
  const usedOptions = new Set<number>();
  const unmatched: typeof priced = [];

  for (const variant of priced) {
    const source = normalized([variant.memory, variant.color, variant.region, variant.rawLabel].filter(Boolean).join(" "));
    const selected = options
      .map((item, index) => ({ item, index }))
      .find(({ item, index }) => !usedOptions.has(index) && matchesSeriesBase(source, item));
    if (!selected) {
      unmatched.push(variant);
      continue;
    }
    usedOptions.add(selected.index);
    matches.set(selected.index, variant);
  }

  // В старых импортах к Series 11 могли ошибочно попасть варианты других
  // поколений (например Midnight от SE). В официальной линейке Series 11
  // таких цветов нет, поэтому не переносим их в новый канонический набор.
  if (unmatched.length) {
    await prisma.productVariant.deleteMany({ where: { id: { in: unmatched.map((variant) => variant.id) } } });
    console.log(`CLEAN ${product.name}: удалены устаревшие варианты — ${unmatched.map((variant) => variant.rawLabel ?? variant.id).join("; ")}`);
  }

  await prisma.productVariant.deleteMany({ where: { productId: product.id, price: null } });
  for (const [index, item] of options.entries()) {
    const existing = matches.get(index);
    if (existing) {
      await prisma.productVariant.update({ where: { id: existing.id }, data: { memory: item.size, color: item.caseColor, region: item.band } });
    } else {
      await prisma.productVariant.create({
        data: { productId: product.id, memory: item.size, color: item.caseColor, region: item.band, price: null, inStock: true, rawLabel: `${product.name} ${item.size}, ${item.caseColor}, ${item.band} — уточнить у менеджера` },
      });
    }
  }
}

function matchesSe3Base(source: string, item: WatchOption) {
  const sourceSize = source.match(/\b(40|44)\b/)?.[1];
  if (`${sourceSize ?? ""} мм` !== item.size) return false;
  const sourceColor = /midnight/.test(source) ? "Midnight" : /starlight/.test(source) ? "Starlight" : null;
  if (sourceColor !== item.caseColor) return false;

  const wantedType = optionBandType(item.band);
  const foundType = sourceBandType(source);
  // В прайсе поставщика тип ремешка у SE 3 часто не указан. Такие строки
  // относятся к базовому Sport Band; Sport Loop принимаем только явно.
  if ((foundType || "sport") !== wantedType) return false;
  const wantedSize = optionBandSize(item.band);
  const foundSize = sourceBandSize(source);
  return !wantedSize || !foundSize || wantedSize === foundSize;
}

async function syncSe3(
  product: Awaited<ReturnType<typeof prisma.product.findUniqueOrThrow>> & { variants: Array<{ id: string; memory: string | null; color: string | null; region: string | null; price: unknown; inStock: boolean; rawLabel: string | null; sku: string | null }> },
  options: WatchOption[],
) {
  const priced = product.variants.filter((variant) => variant.price !== null);
  const matches = new Map<number, (typeof priced)[number]>();
  const usedOptions = new Set<number>();
  const unmatched: typeof priced = [];

  for (const variant of priced) {
    const source = normalized([variant.memory, variant.color, variant.region, variant.rawLabel].filter(Boolean).join(" "));
    const selected = options
      .map((item, index) => ({ item, index }))
      .find(({ item, index }) => !usedOptions.has(index) && matchesSe3Base(source, item));
    if (!selected) {
      unmatched.push(variant);
      continue;
    }
    usedOptions.add(selected.index);
    matches.set(selected.index, variant);
  }

  if (unmatched.length) {
    await prisma.productVariant.deleteMany({ where: { id: { in: unmatched.map((variant) => variant.id) } } });
    console.log(`CLEAN ${product.name}: удалены устаревшие варианты — ${unmatched.map((variant) => variant.rawLabel ?? variant.id).join("; ")}`);
  }

  await prisma.productVariant.deleteMany({ where: { productId: product.id, price: null } });
  for (const [index, item] of options.entries()) {
    const existing = matches.get(index);
    if (existing) {
      await prisma.productVariant.update({ where: { id: existing.id }, data: { memory: item.size, color: item.caseColor, region: item.band } });
    } else {
      await prisma.productVariant.create({
        data: { productId: product.id, memory: item.size, color: item.caseColor, region: item.band, price: null, inStock: true, rawLabel: `${product.name} ${item.size}, ${item.caseColor}, ${item.band} — уточнить у менеджера` },
      });
    }
  }
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
  const legacySe = await prisma.product.findMany({
    where: {
      AND: [
        { name: { contains: "Apple Watch SE", mode: "insensitive" } },
        { NOT: { name: { contains: "Apple Watch SE 3", mode: "insensitive" } } },
      ],
    },
    select: { id: true, name: true },
  });
  if (legacySe.length) {
    await prisma.product.updateMany({
      where: { id: { in: legacySe.map((product) => product.id) } },
      data: { status: "HIDDEN" },
    });
    console.log(`CLEAN Старые Apple Watch SE скрыты: ${legacySe.map((product) => product.name).join(", ")}`);
  }

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
    if (entry.slug === "apple-watch-series-11") {
      await syncSeries11(product, entry.options);
      await prisma.product.update({ where: { id: product.id }, data: series11Content });
      console.log(`OK   ${product.name}: ${entry.options.length} вариантов без дублей`);
      continue;
    }
    if (entry.slug === "apple-watch-se-3") {
      await syncSe3(product, entry.options);
      await prisma.product.update({ where: { id: product.id }, data: se3Content });
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
