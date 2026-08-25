import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SeedVariant = {
  memory?: string;
  color?: string;
  region?: string;
  // null — комбинации память/цвет/тип SIM, которой нет ни в одной строке
  // прайса (см. buildLiveIphoneProducts): на сайте вместо цены показывается
  // "Уточняйте у менеджера".
  price: number | null;
  inStock?: boolean;
  rawLabel?: string;
};

type SeedProduct = {
  name: string;
  slug: string;
  brand: string;
  description: string;
  variants: SeedVariant[];
  // Ниже — необязательные поля для карточки товара (характеристики,
  // особенности, сравнение с предыдущим поколением). Пока заполняются
  // точечно (пилот — iPhone 17 Pro Max, см. IPHONE_CONTENT_OVERRIDES),
  // у остальных товаров просто отсутствуют.
  specs?: Record<string, string>;
  highlights?: string[];
  previousGenLabel?: string;
  previousGenHighlights?: string[];
};

type SeedCategory = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  products: SeedProduct[];
};

// ---------------------------------------------------------------------
// Реальный каталог (перенесён из вашего собственного сайта, папка Osnova,
// файл data/catalog.json — скопирован в prisma/data/osnova-catalog.json).
// Сейчас из него берутся только Samsung Galaxy и Apple TV — данные по
// iPhone/AirPods/Watch/iPad/MacBook заменены на более полный и точный
// живой прайс (см. ниже), присланный боту 20.08.2026.
// ---------------------------------------------------------------------

type OsnovaPriceLeaf = number | string;
type OsnovaProductRaw = {
  name: string;
  price?: number;
  hasMemory?: boolean;
  description?: string;
  prices?: Record<string, Record<string, OsnovaPriceLeaf> | Record<string, Record<string, OsnovaPriceLeaf>>>;
};

const osnovaCatalog: any = JSON.parse(
  readFileSync(path.join(__dirname, "data", "osnova-catalog.json"), "utf-8"),
);

const AXIS_VALUE_RENAMES: Record<string, string> = {
  ESIM: "eSIM",
  SIM_ESIM: "SIM+eSIM",
};

function renderAxisValue(raw: string): string {
  return AXIS_VALUE_RENAMES[raw] ?? raw;
}

function slugifyPart(input: string): string {
  return input
    .replace(/\+/g, "-plus")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildRawLabel(parts: (string | null | undefined)[], price: number): string {
  return [...parts.filter(Boolean), String(price)].join(" ");
}

// Нормализация "сырых" названий цветов из каталога Osnova — они часто
// приходят с кодом модели в скобках, кириллицей или сокращениями. Сводим
// к одному человекочитаемому варианту, чтобы в фильтре у покупателя не
// было дублей вроде "Синий" / "Blue" / "Navi Blue (SM-S9420)" для одного
// и того же цвета.
const COLOR_NAME_OVERRIDES: Record<string, string> = {
  Icyblue: "Icy Blue",
  Iceblue: "Icy Blue",
  Navi: "Navy",
  Lavander: "Lavender",
};

function normalizeColorName(raw: string): string {
  let name = raw.trim();

  // Код модели в скобках, напр. "Icyblue (SM-S9420)" → "Icyblue".
  name = name.replace(/\s*\([^)]*\)\s*$/, "").trim();

  // "A." в начале строки — сокращение от "Awesome" в некоторых прайсах.
  name = name.replace(/^A\.\s*/i, "Awesome ");

  const RU_TO_EN: Record<string, string> = {
    белый: "White",
    черный: "Black",
    чёрный: "Black",
    голубой: "Light Blue",
    синий: "Blue",
    фиолетовый: "Violet",
    зеленый: "Green",
    зелёный: "Green",
    серый: "Gray",
    серебристый: "Silver",
    золотой: "Gold",
    красный: "Red",
    розовый: "Pink",
    желтый: "Yellow",
    жёлтый: "Yellow",
    бежевый: "Beige",
    мятный: "Mint",
    персиковый: "Peach",
    лавандовый: "Lavender",
  };
  const lower = name.toLowerCase();
  if (RU_TO_EN[lower]) {
    name = RU_TO_EN[lower];
  }

  const overrideKey = Object.keys(COLOR_NAME_OVERRIDES).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  if (overrideKey) {
    name = COLOR_NAME_OVERRIDES[overrideKey];
  }

  return name;
}

function extractVariants(
  op: OsnovaProductRaw,
  modelName: string,
  colorOverrides?: Record<string, string>,
): SeedVariant[] {
  const variants: SeedVariant[] = [];

  if (typeof op.price === "number") {
    variants.push({ price: op.price, rawLabel: buildRawLabel([modelName], op.price) });
    return variants;
  }

  if (!op.prices) return variants;

  if (op.hasMemory === true) {
    for (const [memory, byColor] of Object.entries(op.prices)) {
      for (const [colorRaw, byAxis] of Object.entries(byColor as Record<string, unknown>)) {
        const color = normalizeColorName(colorOverrides?.[colorRaw] ?? colorRaw);
        for (const [axisRaw, priceRaw] of Object.entries(byAxis as Record<string, OsnovaPriceLeaf>)) {
          if (typeof priceRaw !== "number") continue; // напр. "Уточняйте у менеджера"
          const region = renderAxisValue(axisRaw);
          variants.push({
            memory,
            color,
            region,
            price: priceRaw,
            rawLabel: buildRawLabel([modelName, memory, color, region], priceRaw),
          });
        }
      }
    }
  } else {
    for (const [colorRaw, byAxis] of Object.entries(op.prices)) {
      const color = normalizeColorName(colorOverrides?.[colorRaw] ?? colorRaw);
      for (const [axisRaw, priceRaw] of Object.entries(byAxis as Record<string, OsnovaPriceLeaf>)) {
        if (typeof priceRaw !== "number") continue;
        const region = renderAxisValue(axisRaw);
        variants.push({
          color,
          region,
          price: priceRaw,
          rawLabel: buildRawLabel([modelName, color, region], priceRaw),
        });
      }
    }
  }

  return variants;
}

function buildSamsungProducts(): SeedProduct[] {
  const products: SeedProduct[] = [];
  const galaxySubs: Record<string, { products: OsnovaProductRaw[] }> = osnovaCatalog.samsung.subcategories;
  for (const sub of Object.values(galaxySubs)) {
    for (const p of sub.products) {
      const variants = extractVariants(p, p.name);
      if (variants.length === 0) continue;
      products.push({
        name: `Samsung Galaxy ${p.name}`,
        slug: `samsung-galaxy-${slugifyPart(p.name)}`,
        brand: "Samsung",
        description: p.description ?? `Samsung Galaxy ${p.name}.`,
        variants,
      });
    }
  }
  return products;
}

function buildAppleTvProducts(): SeedProduct[] {
  const products: SeedProduct[] = [];
  const appleTv: OsnovaProductRaw[] = osnovaCatalog.apple.subcategories["apple-tv"].products;
  for (const p of appleTv) {
    const variants = extractVariants(p, p.name);
    if (variants.length === 0) continue;
    products.push({
      name: p.name,
      slug: `appletv-${slugifyPart(p.name)}`,
      brand: "Apple",
      description: p.description ?? `${p.name}.`,
      variants,
    });
  }
  return products;
}

// ---------------------------------------------------------------------
// Живой прайс (prisma/data/live-pricelist-2026-08-20.txt) — реальный
// актуальный прайс, присланный в бота 20.08.2026. Заменяет данные по
// iPhone/AirPods из Osnova (устаревшие/неполные) и добавляет три новые
// категории: Часы, Планшеты (заменяют заглушки), Ноутбуки (новая).
//
// У iPhone ось цены — "тип SIM" (как договорились с владельцем), но
// реальный прайс размечен по региону/стране, а не по типу SIM напрямую.
// Соответствие регион → тип SIM (правило владельца бизнеса, 20.08.2026):
//   🇮🇳 Индия  → SIM+eSIM      🇺🇸 США    → eSIM
//   🇯🇵 Япония → eSIM           🇭🇰 Гонконг → SIM+eSIM
//   🇨🇳 Китай  → 2 SIM (physical, без eSIM)
//   🇦🇪 ОАЭ    → SIM+eSIM для моделей до 16 Pro Max включительно,
//               eSIM — начиная с 17-й линейки
// Это устойчивое правило, а не разовое совпадение: при разборе всего
// прайса (146 строк) оно не даёт ни одной коллизии цены.
// ---------------------------------------------------------------------

const liveRaw = readFileSync(
  path.join(__dirname, "data", "live-pricelist-2026-08-20.txt"),
  "utf-8",
);
const liveLines = liveRaw.split("\n").map((l) => l.trim()).filter(Boolean);

function sectionLines(startMarker: string, endMarker: string): string[] {
  const startIdx = liveLines.findIndex((l) => l === startMarker);
  const endIdx = liveLines.findIndex((l) => l === endMarker);
  return liveLines.slice(startIdx + 1, endIdx);
}

// ---- iPhone -----------------------------------------------------------

const IPHONE_PREFIXES = [
  "17 Pro Max", "17 Pro", "17 Air", "17e", "17",
  "16 Pro Max", "16 Pro", "16 Plus", "16e", "16",
  "15 Pro Max", "15 Pro", "15 Plus", "15",
  "14", "13",
];

// Официальные названия цветов Apple (уточнено веб-поиском) — в прайсе
// встречаются сокращённые рабочие названия ("Blue", "Desert", "Natural").
const IPHONE_COLOR_OVERRIDES: Record<string, Record<string, string>> = {
  "17 Pro Max": { Blue: "Deep Blue", Orange: "Cosmic Orange" },
  "17 Pro": { Blue: "Deep Blue", Orange: "Cosmic Orange" },
  "17": { Blue: "Mist Blue" },
  "16 Pro Max": { Desert: "Desert Titanium", Natural: "Natural Titanium", White: "White Titanium", Black: "Black Titanium" },
  "16 Pro": { Desert: "Desert Titanium", Natural: "Natural Titanium", White: "White Titanium", Black: "Black Titanium" },
  "15 Pro": { Blue: "Blue Titanium", Natural: "Natural Titanium" },
  // В прайсе один и тот же розовый iPhone 17e встречается под двумя разными
  // подписями в зависимости от региона поставки ("Pink" — Индия, "Soft Pink"
  // — Япония) — это один и тот же цвет, сводим к одному названию "Pink".
  "17e": { "Soft Pink": "Pink" },
};

// Модели, у которых в этом прайсе название отличается от того, как товар
// уже называется на сайте (унаследовано из Osnova) — чтобы seed обновлял
// существующий товар, а не создавал дубликат с другим слагом.
const IPHONE_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "17 Air": "Air",
};

// Пилот: описание, характеристики, особенности и сравнение с предыдущим
// поколением — сначала только для iPhone 17 Pro Max (по договорённости с
// владельцем — тестируем на одной модели, потом расширяем на остальные).
// Все данные — из официальной страницы характеристик Apple
// (support.apple.com/en-us/125091) и сравнительной статьи М.Видео
// (iPhone 17 Pro Max vs iPhone 16 Pro Max), ничего не придумано.
const IPHONE_CONTENT_OVERRIDES: Record<
  string,
  {
    description: string;
    specs: Record<string, string>;
    highlights: string[];
    previousGenLabel: string;
    previousGenHighlights: string[];
  }
> = {
  "17 Pro Max": {
    description:
      "iPhone 17 Pro Max — флагман Apple с экраном ProMotion 6.9\", чипом A19 Pro и тройной 48-мегапиксельной камерой. Корпус из алюминия со стеклом Ceramic Shield 2 и защитой IP68.",
    specs: {
      "Дисплей": "6.9\" OLED, ProMotion до 120 Гц, до 3000 нит на солнце",
      "Процессор": "Apple A19 Pro (6-ядерный CPU, 6-ядерный GPU, 16-ядерный Neural Engine)",
      "Основная камера": "48 + 48 + 48 Мп (широкий, сверхширокий, телефото 4x), зум-диапазон эквивалентен 16x",
      "Фронтальная камера": "18 Мп Center Stage, автофокус, видео 4K Dolby Vision",
      "Автономность": "до 39 часов видео",
      "Память": "256 ГБ / 512 ГБ / 1 ТБ / 2 ТБ",
      "Защита": "IP68 (до 6 м, 30 минут), стекло Ceramic Shield 2",
      "Корпус": "алюминий, 30% переработанных материалов",
    },
    highlights: [
      "Экран ProMotion яркостью до 3000 нит — виден даже под ярким солнцем",
      "Чип A19 Pro — запас производительности на годы вперёд",
      "Тройная камера 48 Мп с оптическим экв. зумом до 16x",
      "До 39 часов видео без подзарядки",
      "Защита IP68 и стекло Ceramic Shield 2",
    ],
    previousGenLabel: "iPhone 16 Pro Max",
    previousGenHighlights: [
      "Чип A19 Pro быстрее A18 Pro на 10–15%, оперативной памяти больше (12 ГБ против 8 ГБ)",
      "Впервые появилась камера-испаритель (vapor chamber) — меньше нагрева в играх и тяжёлых приложениях",
      "Телефото-камера выросла до 48 Мп (было 12 Мп)",
      "Фронтальная камера 18 Мп вместо 12 Мп, с оптической стабилизацией",
      "Батарея ёмче (5088 мАч против 4685 мАч у версии с eSIM), заряжается быстрее: 40 Вт против 30 Вт по проводу, 25 Вт против 15 Вт беспроводная",
      "Экран ярче — до 3000 нит против 2000 нит, новое стекло Ceramic Shield 2",
    ],
  },
};

const FLAG_RE = /\p{Regional_Indicator}{2}/gu;
function extractFlagCodes(s: string): string[] {
  const REGIONAL_A = 0x1f1e6;
  const matches = [...s.matchAll(FLAG_RE)].map((m) => m[0]);
  return matches.map((flag) =>
    [...flag].map((c) => String.fromCharCode(65 + (c.codePointAt(0)! - REGIONAL_A))).join(""),
  );
}

function deriveSimType(codes: string[], modelPrefix: string): string | null {
  const isNewGen = /^17/.test(modelPrefix);
  if (codes.includes("CN")) return "2 SIM";
  if (codes.includes("US")) return "eSIM";
  if (codes.includes("JP")) return "eSIM";
  if (codes.includes("HK")) return "SIM+eSIM";
  if (codes.includes("IN")) return "SIM+eSIM";
  if (codes.includes("AE")) return isNewGen ? "eSIM" : "SIM+eSIM";
  return null;
}

type LiveIphoneLine = { model: string; memory: string; color: string; simType: string; price: number; rawLine: string };

function parseLiveIphoneLines(): LiveIphoneLine[] {
  const lines: LiveIphoneLine[] = [];
  let inIphoneSection = false;

  for (const line of liveLines) {
    if (/^(AirPods|Apple Watch|iPad|MacBook):?$/.test(line)) { inIphoneSection = false; continue; }
    if (/^\d+(e)?(\s(Plus|Pro|Pro Max|Air))?:$/i.test(line) || /^16E\/16:$/i.test(line)) {
      inIphoneSection = true;
      continue;
    }
    if (!inIphoneSection) continue;

    const flagMatches = [...line.matchAll(FLAG_RE)];
    if (flagMatches.length === 0) continue;

    const prefix = IPHONE_PREFIXES.find((p) => line.startsWith(p + " "));
    if (!prefix) continue;

    const rest = line.slice(prefix.length).trim();
    const m = rest.match(/^(\d+(?:GB|TB))\s+(.+?)\s+(?:2Sim|eSim)?\s*((?:\p{Regional_Indicator}{2})+)\s+(\d+)\s*$/u);
    if (!m) continue;

    const [, memory, colorRaw, flagStr, priceStr] = m;
    const codes = extractFlagCodes(flagStr);
    const simType = deriveSimType(codes, prefix);
    if (!simType) continue;

    const color = IPHONE_COLOR_OVERRIDES[prefix]?.[colorRaw.trim()] ?? colorRaw.trim();

    lines.push({ model: prefix, memory, color, simType, price: Number(priceStr), rawLine: line });
  }

  return lines;
}

// Полная сетка модификаций iPhone: у покупателя должны быть видны ВСЕ
// цвета этой модели в КАЖДОМ объёме памяти и КАЖДОМ типе SIM, даже если
// именно такого сочетания нет ни в одной строке прайса (например, у
// какой-то модели прайс покрывает 256GB только с SIM+eSIM, а eSIM есть
// только у 512GB) — вместо того чтобы прятать цвет или выдумывать цену,
// недостающая комбинация показывается с price: null ("Уточняйте у
// менеджера" на сайте, см. ProductOrder.tsx), чтобы покупатель не решил,
// что этого цвета вообще не существует, и не ушёл в другой магазин.
function buildLiveIphoneProducts(): SeedProduct[] {
  const lines = parseLiveIphoneLines();
  const byModel = new Map<string, LiveIphoneLine[]>();
  for (const l of lines) {
    if (!byModel.has(l.model)) byModel.set(l.model, []);
    byModel.get(l.model)!.push(l);
  }

  const products: SeedProduct[] = [];
  for (const [model, modelLines] of byModel) {
    const displayModel = IPHONE_DISPLAY_NAME_OVERRIDES[model] ?? model;

    const memories = [...new Set(modelLines.map((l) => l.memory))];
    const colors = [...new Set(modelLines.map((l) => l.color))];
    const simTypes = [...new Set(modelLines.map((l) => l.simType))];

    const byCombo = new Map<string, LiveIphoneLine>();
    for (const l of modelLines) {
      byCombo.set(`${l.memory} ${l.color} ${l.simType}`, l);
    }

    const variants: SeedVariant[] = [];
    for (const memory of memories) {
      for (const color of colors) {
        for (const simType of simTypes) {
          const real = byCombo.get(`${memory} ${color} ${simType}`);
          if (real) {
            variants.push({
              memory,
              color,
              region: simType,
              price: real.price,
              rawLabel: real.rawLine,
            });
          } else {
            variants.push({
              memory,
              color,
              region: simType,
              price: null,
              rawLabel: `iPhone ${displayModel} ${memory} ${color} ${simType} — нет в прайсе, уточнить у менеджера`,
            });
          }
        }
      }
    }

    const content = IPHONE_CONTENT_OVERRIDES[model];

    products.push({
      name: `iPhone ${displayModel}`,
      slug: `iphone-${slugifyPart(displayModel)}`,
      brand: "Apple",
      description: content?.description ?? `iPhone ${displayModel}.`,
      variants,
      ...(content && {
        specs: content.specs,
        highlights: content.highlights,
        previousGenLabel: content.previousGenLabel,
        previousGenHighlights: content.previousGenHighlights,
      }),
    });
  }
  return products;
}

// ---- AirPods ------------------------------------------------------------

const AIRPODS_PRODUCT_MAP: { match: RegExp; name: string; slug: string }[] = [
  { match: /^AirPods 4 ANC\b/i, name: "AirPods 4 ANC", slug: "airpods-4-anc" },
  { match: /^AirPods 4\b/i, name: "AirPods 4", slug: "airpods-4" },
  { match: /^AirPods Pro 2-USB\b/i, name: "AirPods Pro 2 Type-C", slug: "airpods-pro-2-type-c" },
  { match: /^AirPods Pro 3\b/i, name: "AirPods Pro 3", slug: "airpods-pro-3" },
  { match: /^Airpods Max 2\b/i, name: "AirPods Max 2", slug: "airpods-max-2-2026" },
  { match: /^Airpods Max\b/i, name: "AirPods Max", slug: "airpods-max" }, // после "Max 2"
];

function buildLiveAirpodsProducts(): SeedProduct[] {
  const lines = sectionLines("AirPods:", "Apple Watch:");
  const byProduct = new Map<string, { name: string; variants: SeedVariant[] }>();

  for (const line of lines) {
    const prod = AIRPODS_PRODUCT_MAP.find((p) => p.match.test(line));
    if (!prod) continue;
    const prefixLen = line.match(prod.match)![0].length;
    let rest = line.slice(prefixLen).trim();
    rest = rest.replace(/usb-?c/gi, " ").replace(/\s+/g, " ").trim();
    const tokens = rest.split(/\s+/);
    const price = Number(tokens.pop());
    while (
      tokens.length &&
      (/^(?=.*\d)[A-Z0-9]{4,6}$/.test(tokens[tokens.length - 1]) ||
        /^\d{4}$/.test(tokens[tokens.length - 1]))
    ) {
      tokens.pop();
    }
    const color = tokens.join(" ").trim() || undefined;
    if (Number.isNaN(price)) continue;

    if (!byProduct.has(prod.slug)) byProduct.set(prod.slug, { name: prod.name, variants: [] });
    byProduct.get(prod.slug)!.variants.push({
      color,
      price,
      rawLabel: line,
    });
  }

  const products: SeedProduct[] = [];
  for (const [slug, { name, variants }] of byProduct) {
    products.push({ name, slug, brand: "Apple", description: `${name}.`, variants });
  }
  return products;
}

// ---- Apple Watch ----------------------------------------------------------

const WATCH_FAMILIES = ["SE 3", "SE", "S11", "Ultra 3"];

function buildLiveWatchProducts(): SeedProduct[] {
  const lines = sectionLines("Apple Watch:", "iPad:");
  const byFamily = new Map<string, SeedVariant[]>();

  for (const line of lines) {
    if (!line.startsWith("Apple Watch ")) continue;
    const rest0 = line.slice("Apple Watch ".length).trim();
    const family = WATCH_FAMILIES.find((f) => rest0.startsWith(f + " "));
    if (!family) continue;
    const rest1 = rest0.slice(family.length).trim();
    const tokens = rest1.split(/\s+/);
    if (!/^\d{2}$/.test(tokens[0] ?? "")) continue;
    const size = tokens.shift()!;
    const price = Number(tokens.pop());
    const descriptor = tokens.join(" ").trim();
    if (!descriptor || Number.isNaN(price)) continue;

    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family)!.push({
      memory: `${size}mm`,
      color: descriptor,
      price,
      rawLabel: line,
    });
  }

  const products: SeedProduct[] = [];
  for (const [family, variants] of byFamily) {
    const name = `Apple Watch ${family}`;
    products.push({
      name,
      slug: `apple-watch-${slugifyPart(family)}`,
      brand: "Apple",
      description: `${name}.`,
      variants,
    });
  }
  return products;
}

// ---- iPad -----------------------------------------------------------------

const IPAD_PREFIXES = [
  "iPad Air 11 2025 M3 Wi-Fi",
  "iPad Air 11",
  "iPad Air 13",
  "iPad Air 8 11",
  "iPad Pro 11",
  "iPad Mini 7",
  "iPad 11",
];

// Разные написания в прайсе одной и той же линейки сводим к одному товару.
const IPAD_CANONICAL_NAME: Record<string, string> = {
  "iPad Air 11 2025 M3 Wi-Fi": "iPad Air 11 (2025, M3)",
  "iPad Air 11": "iPad Air 11 (2025, M3)",
  "iPad Air 13": "iPad Air 13 (2025, M3)",
  "iPad 11": "iPad 11 (2025)",
  "iPad Pro 11": "iPad Pro 11 (2025, M5)",
  "iPad Mini 7": "iPad Mini 7",
  "iPad Air 8 11": "iPad Air 8 11",
};

function stripToken(tokens: string[], re: RegExp): string | null {
  const idx = tokens.findIndex((t) => re.test(t));
  if (idx === -1) return null;
  return tokens.splice(idx, 1)[0];
}

function buildLiveIpadProducts(): SeedProduct[] {
  const lines = sectionLines("iPad:", "MacBook:");
  const byName = new Map<string, SeedVariant[]>();

  for (const line of lines) {
    const prefix = IPAD_PREFIXES.find((p) => line.startsWith(p + " "));
    if (!prefix) continue;
    let rest = line.slice(prefix.length).trim();
    rest = rest.replace(/\)(?=\S)/g, ") ");
    const tokens = rest.split(/\s+/);

    const price = Number(tokens.pop());
    const memory = tokens.shift();
    if (!memory) continue;

    const wifiIdx = tokens.findIndex((t) => /^wi-?fi$/i.test(t));
    if (wifiIdx !== -1) tokens.splice(wifiIdx, 1);

    stripToken(tokens, /^M\d$/i); // chip — уже отражён в названии товара
    stripToken(tokens, /^\(\d{4}\)$/); // год — уже отражён в названии товара
    stripToken(tokens, /^(?=.*\d)[A-Z0-9]{4,6}$/); // SKU — не используем

    const color = tokens.join(" ").trim();
    if (!color || Number.isNaN(price)) continue;

    const name = IPAD_CANONICAL_NAME[prefix] ?? prefix;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push({ memory, color, price, rawLabel: line });
  }

  const products: SeedProduct[] = [];
  for (const [name, variants] of byName) {
    products.push({
      name,
      slug: slugifyPart(name),
      brand: "Apple",
      description: `${name}.`,
      variants,
    });
  }
  return products;
}

// ---- MacBook --------------------------------------------------------------

const MACBOOK_CANONICAL_NAME: Record<string, string> = {
  "Air 13": "MacBook Air 13",
  "Air 15": "MacBook Air 15",
  "Air 15 (2025, M4)": "MacBook Air 15 (2025, M4)",
  "Pro 14": "MacBook Pro 14",
  Neo: "MacBook Neo",
};

function buildLiveMacbookProducts(): SeedProduct[] {
  const lines = sectionLines("MacBook:", "13:");
  const byName = new Map<string, SeedVariant[]>();

  for (const line of lines) {
    if (!line.startsWith("MacBook ")) continue;
    let rest = line.slice("MacBook ".length).trim();

    const parenMatch = rest.match(/\(([^)]*)\)/);
    if (!parenMatch) continue;
    const specParts = parenMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    if (specParts.length < 3) continue;
    const storage = specParts.pop()!;
    const ramPart = specParts.pop()!;
    const chip = specParts.join(", ");
    const ram = ramPart.replace(/gb/i, "GB");

    rest = rest.replace(/\([^)]*\)/, " ").replace(/\s+/g, " ").trim();
    const tokens = rest.split(" ");

    const price = Number(tokens.pop());
    const year = stripToken(tokens, /^\d{4}$/);

    tokens.shift(); // SKU — не используем
    const lineName = stripToken(tokens, /^(Air|Pro|Neo)$/i);
    const size = stripToken(tokens, /^\d{2}$/); // размер экрана (13/14/15), отсутствует у Neo
    const color = tokens.join(" ").trim();

    if (!lineName || !color || Number.isNaN(price)) continue;

    let groupKey = lineName.toLowerCase() === "neo" ? "Neo" : `${lineName} ${size ?? ""}`.trim();

    // В этом прайсе под одним и тем же "Air 15" вперемешку идёт старая
    // модель 2025 года (чип M4) и новая 2026 года (M5) — раньше они жили
    // в одном товаре и различались только текстом в третьей оси, что
    // сбивало с толку покупателя. Разносим по разным товарам: M4/2025 —
    // отдельно, M5/2026 остаётся под обычным именем "MacBook Air 15".
    if (groupKey === "Air 15" && /^M4\b/.test(chip)) {
      groupKey = "Air 15 (2025, M4)";
    }

    const name = MACBOOK_CANONICAL_NAME[groupKey] ?? `MacBook ${groupKey}`;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push({
      memory: storage,
      color,
      region: `${chip}, ${ram}${year ? `, ${year}` : ""}`,
      price,
      rawLabel: line,
    });
  }

  const products: SeedProduct[] = [];
  for (const [name, variants] of byName) {
    products.push({
      name,
      slug: slugifyPart(name),
      brand: "Apple",
      description: `${name}.`,
      variants,
    });
  }
  return products;
}

// ---------------------------------------------------------------------

function buildPhoneProducts(): SeedProduct[] {
  return [...buildLiveIphoneProducts(), ...buildSamsungProducts()];
}

function buildAccessoryProducts(): SeedProduct[] {
  return [...buildLiveAirpodsProducts(), ...buildAppleTvProducts()];
}

const categories: SeedCategory[] = [
  {
    name: "Телефоны",
    slug: "telefony",
    icon: "phone",
    sortOrder: 1,
    products: buildPhoneProducts(),
  },
  {
    name: "Аксессуары",
    slug: "aksessuary",
    icon: "headphones",
    sortOrder: 5,
    products: buildAccessoryProducts(),
  },
  {
    name: "Часы",
    slug: "chasy",
    icon: "watch",
    sortOrder: 2,
    products: buildLiveWatchProducts(),
  },
  {
    name: "Планшеты",
    slug: "planshety",
    icon: "tablet",
    sortOrder: 3,
    products: buildLiveIpadProducts(),
  },
  {
    name: "Ноутбуки",
    slug: "noutbuki",
    icon: "laptop",
    sortOrder: 6,
    products: buildLiveMacbookProducts(),
  },
  {
    name: "Дайсоны",
    slug: "daisony",
    icon: "vacuum",
    sortOrder: 4,
    products: [
      {
        name: "Dyson V15 Detect",
        slug: "dyson-v15-detect",
        brand: "Dyson",
        description: "Беспроводной пылесос с лазерной подсветкой пыли.",
        variants: [
          { region: "🇬🇧 UK", price: 54900 },
        ],
      },
    ],
  },
];

// Разовая починка битой метки у унаследованного от Osnova товара
// (iPhone 15 Pro Max, единственная модификация) — раньше показывала
// покупателю техническую строку "CN_SIM_SIM" вместо нормального "2 SIM".
// Цена не трогается (она реальная, из старого прайса), правим только
// формат метки под текущее правило (Китай → "2 SIM"). Безопасно запускать
// повторно — после первого раза просто не находит подходящих строк.
async function fixLegacyLabels() {
  await prisma.productVariant.updateMany({
    where: { region: "CN_SIM_SIM" },
    data: { region: "2 SIM" },
  });
}

async function main() {
  await fixLegacyLabels();

  for (const category of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
      create: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
    });

    for (const product of category.products) {
      const prod = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          brand: product.brand,
          description: product.description,
          specs: product.specs ?? undefined,
          highlights: product.highlights ?? [],
          previousGenLabel: product.previousGenLabel ?? null,
          previousGenHighlights: product.previousGenHighlights ?? [],
          status: "PUBLISHED",
          categoryId: cat.id,
        },
        create: {
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          description: product.description,
          specs: product.specs ?? undefined,
          highlights: product.highlights ?? [],
          previousGenLabel: product.previousGenLabel ?? null,
          previousGenHighlights: product.previousGenHighlights ?? [],
          status: "PUBLISHED",
          categoryId: cat.id,
        },
      });

      // Пересоздаём варианты, чтобы seed можно было безопасно перезапускать.
      // Модификации, на которые уже оформлены реальные заказы, не трогаем —
      // их нельзя удалить (внешний ключ у OrderItem) и не нужно, это не тестовые данные.
      const variantsWithOrders = await prisma.productVariant.findMany({
        where: { productId: prod.id, orderItems: { some: {} } },
        select: { id: true },
      });
      await prisma.productVariant.deleteMany({
        where: { productId: prod.id, id: { notIn: variantsWithOrders.map((v) => v.id) } },
      });
      await prisma.productVariant.createMany({
        data: product.variants.map((v) => ({
          productId: prod.id,
          memory: v.memory,
          color: v.color,
          region: v.region,
          price: v.price,
          inStock: v.inStock ?? true,
          rawLabel: v.rawLabel,
        })),
      });
    }
  }

  const passwordHash = await bcrypt.hash("change-me-now", 10);
  await prisma.adminUser.upsert({
    where: { login: "admin" },
    update: {},
    create: {
      login: "admin",
      passwordHash,
      role: "OWNER",
    },
  });

  await prisma.article.upsert({
    where: { slug: "dobro-pozhalovat" },
    update: {},
    create: {
      title: "Добро пожаловать в новый блог iJoy",
      slug: "dobro-pozhalovat",
      excerpt: "Мы запустили собственный сайт и блог — рассказываем, что изменилось.",
      content:
        "<p>Мы переехали с конструктора на собственный сайт: теперь каталог обновляется быстрее, а цены синхронизируются напрямую с прайсом.</p>",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  console.log("Seed завершён.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
