import { variantImageKey } from "../../src/lib/pickCoverImage";

// Verified against Apple on 2026-10-27. This is a separate generation, not a rename of A17 Pro.
export const MINI_A20_SOURCES = [
  "https://www.apple.com/newsroom/2026/10/apple-gives-ipad-mini-its-biggest-update-ever/",
  "https://www.apple.com/ipad-mini/specs/",
  "https://www.apple.com/shop/buy-ipad/ipad-mini",
] as const;
export const MINI_A20_SLUG = "ipad-mini-a20-pro";
export const MINI_A20_NAME = "Apple iPad mini (A20 Pro, 2026)";
export const MINI_A20_MEMORIES = ["128GB", "256GB", "512GB"] as const;
export const MINI_A20_COLORS = ["Midnight", "Starlight"] as const;
export const MINI_A20_CONNECTIONS = ["Wi‑Fi", "Wi‑Fi + Cellular"] as const;
export const MINI_A20_GLASSES = ["Стандартное стекло", "Нанотекстурное стекло"] as const;

export const MINI_A20_VARIANTS = MINI_A20_MEMORIES.flatMap(memory =>
  MINI_A20_COLORS.flatMap(color => MINI_A20_CONNECTIONS.flatMap(connection =>
    (memory === "128GB" ? [MINI_A20_GLASSES[0]] : MINI_A20_GLASSES).map(glass => ({
      memory, color, region: `${connection} · ${glass}`,
      price: null, inStock: false,
      rawLabel: `${MINI_A20_NAME} ${memory} ${color} ${connection} · ${glass} — цену и поставку уточняет менеджер`,
    })),
  )),
);

export function miniA20Photo(color: string) {
  if (!(MINI_A20_COLORS as readonly string[]).includes(color)) throw Error(`Unknown iPad mini A20 Pro colour: ${color}`);
  return `/catalog/product-photos/ipad-mini-a20-pro/${color.toLowerCase()}.jpg`;
}
// Store's new 202610 CDN assets returned 404 on 2026-10-27. These three
// working Newsroom photographs show the announced generation and finishes.
// Finish photographs are shared by connectivity/glass options, not claimed to show a specific modem.
const newsroomPhotoRoot = "https://www.apple.com/newsroom/images/2026/10/apple-gives-ipad-mini-its-biggest-update-ever/article";
export const MINI_A20_PHOTO_ASSETS = [
  ...MINI_A20_COLORS.map(color => ({ file: miniA20Photo(color), source: `${newsroomPhotoRoot}/Apple-iPad-mini-${color.toLowerCase()}-261026_big.jpg.large.jpg` })),
  { file: "/catalog/product-photos/ipad-mini-a20-pro/hero.jpg", source: `${newsroomPhotoRoot}/Apple-iPad-mini-hero-261026_big.jpg.large.jpg` },
];
export const MINI_A20_IMAGES = [MINI_A20_PHOTO_ASSETS[2].file, ...MINI_A20_COLORS.map(color => miniA20Photo(color))];
export const MINI_A20_COLOR_IMAGES: Record<string, string[]> = Object.fromEntries([
  ...MINI_A20_COLORS.map(color => [color, [miniA20Photo(color)]]),
  ...MINI_A20_VARIANTS.map(option => [variantImageKey(option), [miniA20Photo(option.color)]]),
]);

export const MINI_A20_CONTENT = {
  name: MINI_A20_NAME,
  brand: "Apple",
  description: "iPad mini с A20 Pro — компактный планшет Apple 2026 года с OLED-экраном 8,5″. Анонсирован 26 октября; старт продаж Apple — 6 ноября 2026 года. Выберите память, цвет, подключение и стекло. Цена и сроки поставки в наш магазин пока уточняются; анонс Apple не означает наличие у нас.",
  highlights: [
    "8,5″ Super Retina XDR OLED: до 1200 нит пиковой яркости HDR",
    "Apple A20 Pro; 128, 256 или 512 ГБ",
    "Корпус толщиной 5,4 мм; защита IP67 в лабораторных условиях",
    "Wi‑Fi 7 и Bluetooth 6; Cellular — 5G/LTE и eSIM",
    "Нанотекстурное стекло доступно для 256 и 512 ГБ",
    "Совместим с Apple Pencil Pro и Apple Pencil (USB‑C)",
  ],
  previousGenLabel: "iPad mini (A17 Pro)",
  previousGenHighlights: ["OLED 8,5″ вместо Liquid Retina 8,3″", "A20 Pro вместо A17 Pro", "Тоньше и легче; появилась защита IP67", "Wi‑Fi 7, Bluetooth 6 и быстрая зарядка"],
  specs: {
    "Модельный год": "2026",
    "Дата анонса": "26 октября 2026 года",
    "Старт продаж Apple": "6 ноября 2026 года; наличие и сроки поставки в наш магазин уточняются отдельно",
    "Дисплей": "8,5″ Super Retina XDR, OLED, P3, True Tone",
    "Разрешение": "2316 × 1512 пикселей, 326 ppi",
    "Яркость": "До 600 нит на всей площади, до 1200 нит пиковой яркости HDR; минимум 1 нит",
    "Стекло": "Стандартное; нанотекстурное — дополнительный вариант только для 256 и 512 ГБ",
    "Процессор": "Apple A20 Pro: у 128/256 ГБ — CPU 5 ядер и Neural Engine 16 ядер; у 512 ГБ — CPU 6 ядер и Dual 16-core Neural Engine; GPU 7 ядер у всех версий",
    "Накопитель": "128, 256 или 512 ГБ",
    "Основная камера": "12 Мп Wide, ƒ/1.8, Smart HDR 4, Adaptive True Tone flash",
    "Фронтальная камера": "12 Мп Center Stage на длинной стороне корпуса, ƒ/2.0",
    "Видеосъёмка": "4K до 60 кадр/с",
    "Звук": "Стереозвук Acoustic Display, два микрофона",
    "Беспроводная связь": "Apple N1: Wi‑Fi 7, Bluetooth 6, Thread; у Cellular — модем Apple C2, 5G/LTE",
    "SIM": "Wi‑Fi: без SIM; Wi‑Fi + Cellular: только eSIM, без физической SIM. Доступность зависит от региона поставки и оператора",
    "Навигация": "GPS/GNSS — только у Cellular",
    "Разъём и передача данных": "USB‑C, USB 3 до 10 Гбит/с, DisplayPort; внешний дисплей до 4K/60 Гц",
    "Аккумулятор": "18,9 Вт·ч",
    "Автономность": "До 10 часов по Wi‑Fi/видео; до 9 часов по сотовой сети",
    "Быстрая зарядка": "До 50% примерно за 30 минут с совместимым USB‑C адаптером от 35 Вт; такой адаптер приобретается отдельно",
    "Материал корпуса": "Алюминий",
    "Цвета": "Midnight, Starlight",
    "Размеры": "195,3 × 132,6 × 5,4 мм",
    "Вес": "255 г (Wi‑Fi) / 263 г (Wi‑Fi + Cellular)",
    "Защита": "IP67: до 1 м на 30 минут в лабораторных условиях. Защита не постоянная; повреждения жидкостью не покрываются гарантией Apple",
    "Безопасность": "Touch ID в верхней кнопке",
    "Совместимость": "Apple Pencil Pro и Apple Pencil (USB‑C), включая наведение. Apple Pencil 2-го поколения не подходит. Аксессуары приобретаются отдельно",
    "Комплектация": "iPad mini и кабель USB‑C; адаптер зависит от региона поставки. Для нанотекстурного стекла Apple указывает полировочную салфетку",
    "Важно": "Функции Apple Intelligence и Siri AI зависят от языка, региона и версии ПО; поддержка русского языка не заявляется",
  },
};

type ExistingMiniOption = { id: string; memory: string | null; color: string | null; region: string | null };
export function miniA20OptionKey(option: Omit<ExistingMiniOption, "id">): string | null {
  const storage = option.memory?.trim().match(/^(128|256|512)\s*(?:GB|ГБ)$/i)?.[1];
  const color = option.color?.trim().toLowerCase();
  if (!storage || !color || !MINI_A20_COLORS.some(item => item.toLowerCase() === color)) return null;
  const [connection, glass, ...extra] = (option.region ?? "").replace(/[‐‑‒–—−]/g, "-").split("·").map(item => item.trim());
  if (extra.length || !/^wi[\s-]?fi(?:\s*\+\s*cellular)?$/i.test(connection)) return null;
  const nano = glass && /^(?:нанотекстурное стекло|nano-texture(?: glass)?)$/i.test(glass);
  if (glass && !nano && !/^(?:стандартное стекло|standard(?: glass)?)$/i.test(glass)) return null;
  if (nano && storage === "128") return null;
  return [storage, color, /cellular/i.test(connection) ? "cellular" : "wifi", nano ? "nano" : "standard"].join("|");
}

export const RETIRED_MINI_A17_SLUGS = ["ipad-mini-a17-pro", "ipad-mini-7", "ipad-mini7"] as const;
const retiredMiniNames = new Set(["ipadminia17pro", "ipadminia17pro2024", "ipadmini7", "ipadmini72024"]);
/** Owner retired A17 Pro from the storefront; preserve records and order references. */
export function isRetiredMiniA17Product(product: { slug: string; name: string; brand: string | null; category: { slug: string } }) {
  if (product.slug === MINI_A20_SLUG || product.category.slug !== "planshety" || product.brand?.trim().toLowerCase() !== "apple") return false;
  const name = product.name.toLowerCase().replace(/^apple\s+/, "").replace(/[^a-zа-яё0-9]/g, "");
  if (name.includes("a20")) return false;
  return (RETIRED_MINI_A17_SLUGS as readonly string[]).includes(product.slug) || retiredMiniNames.has(name);
}

/** Add missing A20 configurations only; retirement changes product visibility, never offer data. */
export function planMiniA20Addition(existing: ExistingMiniOption[]) {
  const seen = new Set<string>();
  for (const option of existing) {
    const key = miniA20OptionKey(option);
    if (!key) throw Error(`Неизвестная конфигурация нового iPad mini: ${option.id}. Сначала проверьте её вручную.`);
    if (seen.has(key)) throw Error(`Дублирующаяся конфигурация iPad mini A20 Pro: ${option.id}. Автоматическое объединение запрещено.`);
    seen.add(key);
  }
  return MINI_A20_VARIANTS.filter(option => !seen.has(miniA20OptionKey(option)!)).map(option => ({ ...option }));
}
