import { matchAppleWatchVariant, normalizeForMatch, normalizedIphoneSim, normalizedMemory, parsePriceListText } from "../../src/lib/priceImport";
import { SEPTEMBER_2026_PRODUCTS } from "./september-2026-catalog";

export type ApprovedOption = { memory: string | null; color: string | null; region: string | null; sku?: string; rawLabel?: string; image?: string };
export type ApprovedPriceProduct = {
  slug: string; aliases?: string[]; name: string; brand: string; category: string; categoryName: string;
  create?: { description: string; highlights: string[]; specs: Record<string, string>; images: string[] };
  variants: ApprovedOption[];
};
const photo = (file: string) => `/catalog/product-photos/owner-price-2026-10-27/${file}`;
export const OCTOBER27_PRODUCT_SOURCES = {
  watchBlack: "https://www.apple.com/ae/shop/buy-watch/apple-watch",
  watchBronze: "https://www.apple.com/ae/shop/buy-watch/apple-watch/42mm-gps-dark-bronze-aluminium-olive-sport-band",
  magsafe: "https://www.apple.com/shop/product/mgd74ll/a/magsafe-charger-1-m",
  macMini: "https://support.apple.com/en-gb/128108",
  garmin: "https://www.garmin.com/pl-PL/p/1510465/",
  dji: "https://store.dji.com/uk/product/osmo-action-6?set_region=GB&site=brandsite&vid=207351",
  yandex: "https://alice.yandex.ru/support/ru/station/meet/characteristics-max",
  fold8: "https://www.samsung.com/latin/smartphones/galaxy-z-fold8/specs/",
};

export function october27ApprovedProducts(input: string): ApprovedPriceProduct[] {
  const lines = parsePriceListText(input);
  const watch = SEPTEMBER_2026_PRODUCTS.find(product => product.slug === "apple-watch-series-12")!;
  const watchOptions = lines.filter(line => /^Apple Watch S12\b/i.test(line.parsedModel ?? "")).map(line => {
    const candidates = watch.variants.map((variant, i) => ({ ...variant, id: String(i), productName: watch.name, rawLabel: null }));
    const index = matchAppleWatchVariant(line, candidates);
    if (index === null || !line.parsedSku) throw Error(`Нет проверенной комплектации S12: ${line.rawLine}`);
    const variant = watch.variants[Number(index)];
    return { memory: variant.memory, color: variant.color, region: variant.region, sku: line.parsedSku };
  });
  const products: ApprovedPriceProduct[] = [{
    slug: watch.slug, name: watch.name, brand: "Apple", category: "chasy", categoryName: "Часы", variants: watchOptions,
  }];
  // The owner explicitly approved the six additional SIM options and already approved the other feed configurations.
  for (const model of ["iPhone 18 Pro", "iPhone 18 Pro Max"]) {
    const variants = new Map<string, ApprovedOption>();
    for (const line of lines.filter(line => line.phoneModel === model)) {
      const memory = normalizedMemory(line.parsedMemory)?.toUpperCase();
      const region = normalizedIphoneSim(line.parsedRegion, model);
      if (!memory || !line.parsedColor || !["eSIM", "SIM+eSIM"].includes(region ?? "")) throw Error(`Неоднозначный SIM: ${line.rawLine}`);
      const variant = { memory, color: line.parsedColor, region };
      variants.set([memory, variant.color, region].join("|"), variant);
    }
    products.push({ slug: model === "iPhone 18 Pro" ? "iphone-18-pro" : "iphone-18-pro-max", name: model, brand: "Apple", category: "telefony", categoryName: "Телефоны", variants: [...variants.values()] });
  }
  for (const [inches, colors] of [[13, ["Midnight", "Starlight", "Sky Blue"]], [15, ["Silver", "Starlight", "Sky Blue"]]] as const) {
    const variants = colors.map(color => {
      const row = lines.find(line => new RegExp(`MacBook Air ${inches} 2026 M5 24 1Tb ${color}`, "i").test(line.parsedModel ?? ""));
      if (!row) throw Error(`Нет согласованной строки MacBook Air ${inches} 24/1TB ${color}`);
      return { memory: "24GB / 1TB SSD", color, region: "M5 · 2026", rawLabel: row.parsedModel! };
    });
    products.push({ slug: `macbook-air-${inches}-m5`, name: `MacBook Air ${inches}-inch (M5)`, brand: "Apple", category: "noutbuki", categoryName: "Ноутбуки", variants });
  }
  products.push(
    {
      slug: "apple-25w-magsafe-charger-1m-qi22", name: "Apple 25W MagSafe Charger 1 м (Qi2.2)", brand: "Apple", category: "aksessuary", categoryName: "Аксессуары",
      create: { description: "Зарядное устройство Apple MagSafe с плетёным кабелем USB-C длиной 1 м и поддержкой Qi2.2. Мощность до 25 Вт зависит от модели iPhone и адаптера питания; адаптер приобретается отдельно.", highlights: ["Кабель 1 м", "Qi2.2 и MagSafe", "До 25 Вт с совместимыми iPhone и адаптером"], specs: { "Длина кабеля": "1 м", "Подключение": "USB-C", "Стандарт": "Qi2.2 / MagSafe", "Максимальная мощность": "До 25 Вт в зависимости от устройства и адаптера" }, images: [photo("magsafe-1m.jpg")] },
      variants: [{ memory: null, color: null, region: null, rawLabel: "Apple 25W MagSafe Charger 1M (Qi2.2)", image: photo("magsafe-1m.jpg") }],
    },
    {
      slug: "mac-mini-m6", aliases: ["Mac mini M6", "Apple Mac mini M6", "Mac mini (M6)"], name: "Mac mini (M6, 2026)", brand: "Apple", category: "nastolnye-kompyutery", categoryName: "Настольные компьютеры",
      create: { description: "Компактный настольный компьютер Mac mini 2026 года с чипом Apple M6. Предложение из прайса: 16 ГБ объединённой памяти, SSD 256 ГБ, серебристый корпус.", highlights: ["Apple M6", "16 ГБ памяти и SSD 256 ГБ", "Компактный серебристый корпус"], specs: { "Процессор": "Apple M6", "Оперативная память": "16 ГБ", "Накопитель": "SSD 256 ГБ", "Год": "2026", "Цвет": "Silver" }, images: [photo("mac-mini-m6.jpg")] },
      variants: [{ memory: "16GB / 256GB SSD", color: "Silver", region: "M6 · 2026", sku: "MHQK4", image: photo("mac-mini-m6.jpg") }],
    },
    {
      slug: "garmin-venu-x1", name: "Garmin Venu X1", brand: "Garmin", category: "chasy", categoryName: "Часы",
      create: { description: "Garmin Venu X1 в чёрном корпусе с титановой задней крышкой Slate и чёрным нейлоновым ремешком ComfortFit. Версия 010-02980-02: AMOLED-дисплей 2 дюйма, сапфировое стекло, встроенная LED-подсветка и карты.", highlights: ["AMOLED 2″ и сапфировое стекло", "Чёрный ремешок ComfortFit", "Карты и LED-фонарик"], specs: { "Артикул": "010-02980-02", "Дисплей": "AMOLED 2″", "Стекло": "Сапфировое", "Задняя крышка": "Slate Titanium", "Ремешок": "Black ComfortFit Nylon", "Автономность": "До 8 дней в режиме смарт-часов; зависит от настроек" }, images: [photo("garmin-venu-x1-black.jpg")] },
      variants: [{ memory: null, color: "Black", region: "Black ComfortFit Nylon Band", sku: "010-02980-02", image: photo("garmin-venu-x1-black.jpg") }],
    },
    {
      slug: "dji-osmo-action-6", aliases: ["DJI Osmo Action 6 Standard Combo"], name: "DJI Osmo Action 6", brand: "DJI", category: "ekshn-kamery", categoryName: "Экшн-камеры",
      create: { description: "Экшн-камера DJI Osmo Action 6. Комплектация Standard Combo включает камеру, аккумулятор Extreme Battery Plus, крепление и кабель USB-C. Она отличается от Adventure Combo составом аксессуаров.", highlights: ["Комплектация Standard Combo", "Матрица 1/1,1″", "Переменная диафрагма f/2.0–f/4.0"], specs: { "Модель": "Osmo Action 6", "Комплектация": "Standard Combo", "Матрица": "1/1,1″", "Диафрагма": "f/2.0–f/4.0" }, images: [photo("dji-osmo-action-6-standard.png")] },
      variants: [{ memory: null, color: null, region: "Standard Combo", rawLabel: "DJI Osmo Action 6 Standard Combo", image: photo("dji-osmo-action-6-standard.png") }],
    },
    {
      slug: "samsung-galaxy-z-fold8", aliases: ["Samsung Galaxy Z Fold 8"], name: "Samsung Galaxy Z Fold8", brand: "Samsung", category: "telefony", categoryName: "Телефоны",
      create: { description: "Складной смартфон Samsung Galaxy Z Fold8 в цвете Lavender. В этом предложении — 512 ГБ встроенной памяти, поставка для рынка Южной Кореи.", highlights: ["Складной Galaxy Z Fold8", "512 ГБ памяти", "Цвет Lavender"], specs: { "Модель": "Galaxy Z Fold8", "Оперативная память": "12 ГБ", "Накопитель": "512 ГБ", "Цвет": "Lavender", "Рынок поставки": "Южная Корея" }, images: [photo("fold8-lavender.jpg")] },
      variants: [{ memory: "12/512GB", color: "Lavender", region: "KR", image: photo("fold8-lavender.jpg") }],
    },
    {
      slug: "yandex-station-max", aliases: ["Яндекс Станция Макс с Zigbee"], name: "Яндекс Станция Макс", brand: "Яндекс", category: "umnye-kolonki", categoryName: "Умные колонки",
      create: { description: "Зелёная Яндекс Станция Макс с Алисой и хабом Zigbee. Колонка воспроизводит музыку, отвечает на вопросы и управляет совместимыми устройствами умного дома. Для музыкальных сервисов может потребоваться подписка.", highlights: ["Алиса и Zigbee", "Звук мощностью 65 Вт", "Зелёный корпус"], specs: { "Мощность": "65 Вт", "Голосовой помощник": "Алиса", "Умный дом": "Zigbee", "Цвет": "Зелёный" }, images: [photo("yandex-max-green.png")] },
      variants: [{ memory: null, color: "Green", region: null, rawLabel: "Яндекс Станция Макс Зеленая", image: photo("yandex-max-green.png") }],
    },
  );
  // Guard the reviewed source against an accidentally broadened S12 preparation.
  const approvedWatchSkus = new Set(["MJEC4", "MJE94", "MJEF4", "MJEG4", "MJEK4", "MJEL4", "MJEH4", "MJEN4", "MJEQ4", "MJEU4"]);
  if (watchOptions.length !== 10 || watchOptions.some(option => !approvedWatchSkus.has(option.sku))) throw Error("Изменился набор согласованных S12");
  if (products.some(product => !normalizeForMatch(product.name))) throw Error("Карточка без названия");
  return products;
}
