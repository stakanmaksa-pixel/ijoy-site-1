import type { RefreshProduct } from "./catalog-refresh-types";
import gallery from "./samsung-tablet-gallery.json";

const photo = (model: string, color: string) => `/catalog/product-photos/samsung-tablets/${model}-${color.toLowerCase().replaceAll(" ", "-")}.png`;
type Tablet = {
  key: string; label: string; sizes: string[]; ram: string; colors: string[]; screen: string; resolution: string;
  chip: string; battery: string; charge: string; cameras: string; front: string; connection: string;
  dimensions: string; weight: string; source: string; pen?: string; keyboard?: string; protection?: string;
};
const tablets: Tablet[] = [
  { key: "s11-ultra", label: "S11 Ultra", sizes: ["256GB", "512GB", "1TB"], ram: "12 ГБ (256/512 ГБ), 16 ГБ (1 ТБ)", colors: ["Gray", "Silver"], screen: "14,6″ Dynamic AMOLED 2X, 120 Гц", resolution: "2960 × 1848", chip: "MediaTek Dimensity 9400+", battery: "11 600 мА·ч", charge: "45 Вт", cameras: "13 + 8 Мп", front: "12 Мп, сверхширокоугольная", connection: "Wi‑Fi 7, Bluetooth 5.4", dimensions: "326,3 × 208,5 × 5,1 мм", weight: "692 г (Wi‑Fi), 695 г (5G)", pen: "samsung-s-pen-s11", keyboard: "samsung-book-cover-keyboard-s11-ultra", protection: "IP68", source: "https://www.samsung.com/uk/tablets/galaxy-tab-s/galaxy-tab-s11-ultra-grey-256gb-wi-fi-sm-x930nzareub/" },
  { key: "s11", label: "S11", sizes: ["128GB", "256GB", "512GB"], ram: "12 ГБ", colors: ["Gray", "Silver"], screen: "11″ Dynamic AMOLED 2X, 120 Гц", resolution: "2560 × 1600", chip: "MediaTek Dimensity 9400+", battery: "8400 мА·ч", charge: "45 Вт", cameras: "13 Мп", front: "12 Мп, сверхширокоугольная", connection: "Wi‑Fi 6E, Bluetooth 5.4", dimensions: "253,8 × 165,3 × 5,5 мм", weight: "469 г (Wi‑Fi)", pen: "samsung-s-pen-s11", keyboard: "samsung-book-cover-keyboard-s11", protection: "IP68", source: "https://www.samsung.com/uk/tablets/galaxy-tab-s/galaxy-tab-s11-grey-128gb-wi-fi-sm-x730nzareub/buy/" },
  { key: "s10-plus", label: "S10+", sizes: ["256GB", "512GB"], ram: "12 ГБ", colors: ["Moonstone Gray", "Platinum Silver"], screen: "12,4″ Dynamic AMOLED 2X, 120 Гц", resolution: "2800 × 1752", chip: "MediaTek Dimensity 9300+", battery: "10 090 мА·ч", charge: "45 Вт", cameras: "13 + 8 Мп", front: "12 Мп, сверхширокоугольная", connection: "Wi‑Fi 6E, Bluetooth 5.3", dimensions: "285,4 × 185,4 × 5,6 мм", weight: "571 г (Wi‑Fi), 576 г (5G)", pen: "samsung-s-pen-s10", keyboard: "samsung-book-cover-keyboard-s10-plus", protection: "IP68", source: "https://news.samsung.com/global/galaxy-tab-s10-series-is-samsungs-ai-ready-tablet" },
  { key: "s10-lite", label: "S10 Lite", sizes: ["128GB", "256GB"], ram: "6 ГБ (128 ГБ), 8 ГБ (256 ГБ)", colors: ["Gray", "Silver", "Coral Red"], screen: "10,9″ TFT, 90 Гц", resolution: "2112 × 1320", chip: "Samsung Exynos 1380", battery: "8000 мА·ч", charge: "25 Вт", cameras: "8 Мп", front: "5 Мп", connection: "Wi‑Fi 6, Bluetooth 5.3", dimensions: "254,3 × 165,8 × 6,6 мм", weight: "524 г", pen: "samsung-s-pen-s10-lite", keyboard: "samsung-book-cover-keyboard-s10-fe", source: "https://www.samsung.com/uk/tablets/galaxy-tab-s/galaxy-tab-s10-lite-silver-128gb-wi-fi-sm-x400nzsreub/" },
  { key: "s10-fe", label: "S10 FE", sizes: ["128GB", "256GB"], ram: "8 ГБ (128 ГБ), 12 ГБ (256 ГБ)", colors: ["Gray", "Silver", "Blue"], screen: "10,9″ TFT, 90 Гц", resolution: "2304 × 1440", chip: "Samsung Exynos 1580", battery: "8000 мА·ч", charge: "45 Вт", cameras: "13 Мп", front: "12 Мп, сверхширокоугольная", connection: "Wi‑Fi 6, Bluetooth 5.3", dimensions: "254,3 × 165,8 × 6 мм", weight: "497 г (Wi‑Fi), 500 г (5G)", pen: "samsung-s-pen-s10", keyboard: "samsung-book-cover-keyboard-s10-fe", protection: "IP68", source: "https://news.samsung.com/global/galaxy-tab-s10-fe-series-brings-intelligent-experiences-to-the-forefront-with-premium-versatile-design" },
  { key: "s10-fe-plus", label: "S10 FE+", sizes: ["128GB", "256GB"], ram: "8 ГБ (128 ГБ), 12 ГБ (256 ГБ)", colors: ["Gray", "Silver", "Blue"], screen: "13,1″ TFT, 90 Гц", resolution: "2880 × 1800", chip: "Samsung Exynos 1580", battery: "10 090 мА·ч", charge: "45 Вт", cameras: "13 Мп", front: "12 Мп, сверхширокоугольная", connection: "Wi‑Fi 6, Bluetooth 5.3", dimensions: "300,6 × 194,7 × 6 мм", weight: "664 г (Wi‑Fi), 668 г (5G)", pen: "samsung-s-pen-s10", keyboard: "samsung-book-cover-keyboard-s10-fe-plus", protection: "IP68", source: "https://www.samsung.com/uk/tablets/galaxy-tab-s10-fe/buy/" },
  { key: "a11", label: "A11", sizes: ["64GB", "128GB"], ram: "4 ГБ (64 ГБ), 8 ГБ (128 ГБ)", colors: ["Gray", "Silver"], screen: "8,7″ TFT, 90 Гц", resolution: "1340 × 800", chip: "MediaTek Helio G99", battery: "5100 мА·ч", charge: "15 Вт", cameras: "8 Мп", front: "5 Мп", connection: "Wi‑Fi 5, Bluetooth 5.3", dimensions: "211 × 124,7 × 8 мм", weight: "335 г (Wi‑Fi)", source: "https://www.samsung.com/uk/tablets/galaxy-tab-a/galaxy-tab-a11-grey-64gb-wi-fi-sm-x130nzaaeub/" },
  { key: "a11-plus", label: "A11+", sizes: ["128GB", "256GB"], ram: "6 ГБ (128 ГБ), 8 ГБ (256 ГБ)", colors: ["Gray", "Silver"], screen: "11″ TFT, 90 Гц", resolution: "1920 × 1200", chip: "MediaTek Dimensity 7300", battery: "7040 мА·ч", charge: "25 Вт", cameras: "8 Мп", front: "5 Мп", connection: "Wi‑Fi 5, Bluetooth 5.3", dimensions: "257,1 × 168,7 × 6,9 мм", weight: "480 г (Wi‑Fi)", source: "https://www.samsung.com/uk/tablets/galaxy-tab-a/galaxy-tab-a11-plus-silver-128gb-wi-fi-sm-x230nzsreub/buy/" },
];

export const SAMSUNG_TABLETS: RefreshProduct[] = tablets.map(t => ({
  slug: `samsung-galaxy-tab-${t.key}`, name: `Samsung Galaxy Tab ${t.label}`, brand: "Samsung", category: "planshety",
  aliases: [`galaxy-tab-${t.key}`, `samsung-tab-${t.key}`],
  description: `Samsung Galaxy Tab ${t.label} — планшет с экраном ${t.screen} и процессором ${t.chip}. Выберите память, цвет и подключение. ${t.pen ? "S Pen входит в комплект. Совместимая клавиатура приобретается отдельно." : "S Pen не поддерживается; для ввода текста можно использовать Bluetooth-клавиатуру."}`,
  highlights: [t.screen, `${t.chip}; ${t.ram} оперативной памяти`, `Аккумулятор ${t.battery}, зарядка до ${t.charge}`, t.pen ? "S Pen в комплекте для заметок и рисования" : "Расширение памяти microSD до 2 ТБ", `Wi‑Fi или Wi‑Fi + ${t.key === "a11" ? "LTE" : "5G"}`],
  specs: { "Дисплей": t.screen, "Разрешение": t.resolution, "Процессор": t.chip, "Оперативная память": t.ram, "Накопитель": t.sizes.join(" / "), "Карта памяти": `microSD до ${t.key === "s10-plus" ? "1,5" : "2"} ТБ, отдельно`, "Основная камера": t.cameras, "Фронтальная камера": t.front, "Аккумулятор": t.battery, "Зарядка": `USB‑C, до ${t.charge}; адаптер приобретается отдельно`, "Беспроводная связь": `${t.connection}; сотовая связь только в версии ${t.key === "a11" ? "LTE" : "5G"}`, "SIM": `Wi‑Fi: без сотового модема. У версии ${t.key === "a11" ? "LTE" : "5G"} формат SIM и поддерживаемые частоты зависят от поставки — уточните перед покупкой`, "Размеры": t.dimensions, "Вес": t.weight, "Цвета": t.colors.join(", "), ...(t.protection ? { "Защита": t.protection } : {}), "Стилус": t.pen ? "S Pen входит в комплект; отдельный стилус предлагается как замена" : "S Pen не поддерживается", "Клавиатура": t.keyboard ? "Совместимая Book Cover Keyboard указана ниже; версии другой диагонали не взаимозаменяемы" : "Внешняя Bluetooth-клавиатура; фирменная Book Cover Keyboard для Tab S не подходит", "Комплектация": `Планшет, USB‑C кабель, документация${t.pen ? ", S Pen" : ""}. Состав поставки уточняйте у менеджера` },
  sources: [t.source],
  variants: t.sizes.flatMap(memory => t.colors.flatMap(color => ["Wi‑Fi", `Wi‑Fi + ${t.key === "a11" ? "LTE" : "5G"}`].map(region => ({ memory, color, region, image: photo(t.key, color), images: (gallery as Record<string,string[]>)[photo(t.key,color)] ?? [] })))),
}));

export const SAMSUNG_TABLET_COMPATIBILITY = Object.fromEntries(tablets.map(t => [`samsung-galaxy-tab-${t.key}`, { pen: t.pen, keyboard: t.keyboard }]));

const keyboardRows = [
  ["s11", "S11", "EF-DX730", "https://www.samsung.com/uk/support/model/EF-DX730BBEGGB/"],
  ["s11-ultra", "S11 Ultra", "EF-DX930", "https://www.samsung.com/uk/mobile-accessories/galaxy-tab-s11-ultra-book-cover-keyboard-slim-black-ef-dx930bbeggb/"],
  ["s10-plus", "S10+ / S9+ / S9 FE+", "EF-DX820", "https://www.samsung.com/uk/mobile-accessories/galaxy-tab-s10-plus-book-cover-keyboard-slim-ai-key-black-ef-dx820bbeggb/"],
  ["s10-fe", "S10 FE / S10 Lite / S9 / S9 FE", "EF-DX720", "https://www.samsung.com/uk/mobile-accessories/galaxy-tab-s9-book-cover-keyboard-slim-ai-key-black-ef-dx720bbeggb/"],
  ["s10-fe-plus", "S10 FE+", "EF-DX620", "https://www.samsung.com/uk/mobile-accessories/galaxy-tab-s10-fe-plus-book-cover-keyboard-slim-ai-key-black-ef-dx620bbeggb/"],
];
const penRows = [
  ["s11", "S11 / S11 Ultra", "EJ-PX730", "White", "https://www.samsung.com/uk/business/mobile-accessories/galaxy-tab-s11-series-s-pen-white-ej-px730bwegeu/"],
  ["s10", "S10+ / S10 Ultra / S10 FE / S10 FE+ / S9 / S9+ / S9 Ultra / S9 FE / S9 FE+", "EJ-PX710", "Blue", "https://www.samsung.com/us/business/mobile-accessories/galaxy-tab-s10-ultra-s10-plus-s10-plus-5g-s10-fe-plus-s10-fe-s10-fe-5g-s9-ultra-s9-plus-s9-plus-5g-s9-fe-plus-s9-s9-fe-s9-fe-5g-s-pen-blue-sku-ej-px710bleguj/"],
  ["s10-lite", "S10 Lite", "EJ-PP610", "White", "https://www.samsung.com/uk/mobile-accessories/galaxy-tab-s10-lite-s-pen-white-ej-pp610bwegeu/"],
];
export const SAMSUNG_TABLET_ACCESSORIES: RefreshProduct[] = [
  ...keyboardRows.map(([key, compatible, model, source]): RefreshProduct => ({
    slug: `samsung-book-cover-keyboard-${key}`, name: `Samsung Book Cover Keyboard Slim для Tab ${compatible.split(" / ")[0]}`, brand: "Samsung", category: "planshety",
    description: `Фирменная клавиатура-чехол ${model} для Galaxy Tab ${compatible}. Защищает планшет при переноске и помогает работать с документами. Планшет в комплект не входит.`,
    highlights: ["Клавиатура и защитная обложка", "Подключение через контакты POGO", `Для Galaxy Tab ${compatible}`],
    specs: { "Модель": model, "Совместимость": `Samsung Galaxy Tab ${compatible}`, "Подключение": "POGO", "Цвет": "Чёрный", "Раскладка": "Зависит от поставки; наличие русских букв уточняйте до покупки", "Комплектация": "Клавиатура-чехол. Планшет и стилус не входят", "Важно": "Не подходит к другим диагоналям и моделям, не указанным в совместимости" },
    sources: [source], variants: [{ memory: null, color: "Black", region: null, image: `/catalog/product-photos/samsung-tablets/keyboard-${key}.png` }],
  })),
  ...penRows.map(([key, compatible, model, color, source]): RefreshProduct => ({
    slug: `samsung-s-pen-${key}`, name: `Samsung S Pen для Tab ${key === "s10" ? "S10 / S9" : compatible}`, brand: "Samsung", category: "planshety",
    description: `Оригинальный сменный S Pen ${model} для заметок и рисования на совместимых Galaxy Tab. У планшетов Tab S стилус уже входит в комплект; этот аксессуар можно купить взамен потерянного.`,
    highlights: ["Чувствительность к нажатию", `Для Galaxy Tab ${compatible}`, "Отдельный сменный стилус"],
    specs: { "Модель": model, "Совместимость": `Samsung Galaxy Tab ${compatible}`, "Важно": "Galaxy Tab A11 и A11+ не поддерживают S Pen. Функции пера зависят от планшета; Bluetooth-жесты доступны не на всех моделях", "Комплектация": "Стилус S Pen; планшет не входит" },
    sources: [source], variants: [{ memory: null, color, region: null, image: `/catalog/product-photos/samsung-tablets/pen-${key}.png` }],
  })),
];
