const PHOTO_ROOT = "/catalog/product-photos/september-2026";
const photo = (file: string) => `${PHOTO_ROOT}/${file}`;

export const SEPTEMBER_2026_SOURCES = [
  "https://www.dyson.com/discover/news/latest/introducing-camerajet",
  "https://www.dyson.com/oral-care/electric-toothbrush/camerajet/ceramic-ultra-blue",
  "https://news.samsung.com/global/samsung-galaxy-s26-fe-delivering-the-latest-flagship-experience-focused-on-what-matters-most",
  "https://www.apple.com/apple-watch-series-12/specs/",
  "https://www.apple.com/airpods-5/specs/",
  "https://www.garmin.com/en-US/newsroom/press-release/wearables-health/meet-cirqa-smart-band-the-screen-free-health-and-fitness-tracker-from-garmin/",
  "https://www.garmin.com/en-US/p/1989182/",
  "https://consumer.huawei.com/cn/headphones/freeclip2/specs/",
] as const;

export const SEPTEMBER_2026_PHOTO_FILES = [
  "airpods-5.jpg",
  "apple-watch-series-12-black.jpg",
  "apple-watch-series-12-dark-bronze.jpg",
  "apple-watch-series-12-light-gold.jpg",
  "apple-watch-series-12-natural-titanium.jpg",
  "apple-watch-series-12-night-blue.jpg",
  "apple-watch-series-12-pearl-white.jpg",
  "apple-watch-series-12-radiant-gold.jpg",
  "apple-watch-series-12-space-gray.jpg",
  "apple-watch-ultra-4-all-colors.jpg",
  "dyson-camerajet-ceramic-pink.jpg",
  "dyson-camerajet-ceramic-ultra-blue.jpg",
  "dyson-camerajet-two-colors.jpg",
  "garmin-cirqa-black.jpg",
  "garmin-cirqa-captain-blue.jpg",
  "garmin-cirqa-french-gray.jpg",
  "garmin-cirqa-mauve.jpg",
  "huawei-freeclip-2-denim-blue.jpg",
  "huawei-freeclip-2-feather-sand-white.jpg",
  "huawei-freeclip-2-ice-berry-purple.jpg",
  "huawei-freeclip-2-modern-black.jpg",
  "huawei-freeclip-2-rose-gold.jpg",
  "iphone-18-pro-all-colors.jpg",
  "iphone-18-pro-black.jpg",
  "iphone-18-pro-burgundy.jpg",
  "iphone-18-pro-glacier.jpg",
  "iphone-18-pro-silver.jpg",
  "iphone-duo-all-colors.jpg",
  "iphone-duo-night-sky.jpg",
  "iphone-duo-star-white.jpg",
  "samsung-galaxy-s26-fe-blueberry.jpg",
  "samsung-galaxy-s26-fe-graphite.jpg",
  "samsung-galaxy-s26-fe-pistachio.jpg",
] as const;

export type SeptemberVariant = {
  memory: string | null;
  color: string | null;
  region: string | null;
  price: null;
  inStock: false;
};

export type SeptemberProduct = {
  category: "telefony" | "chasy" | "naushniki" | "fitnes-braslety" | "daisony";
  slug: string;
  name: string;
  brand: string;
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  images: string[];
  colorImages: Record<string, string[]>;
  variants: SeptemberVariant[];
  sources: readonly string[];
  forceGeneralImage?: boolean;
};

const unpriced = (memory: string | null, color: string | null, region: string | null = null): SeptemberVariant => ({
  memory,
  color,
  region,
  price: null,
  inStock: false,
});

const appleWatchFinishes = [
  ["Night Blue", "Navy Blue Sport Band", "apple-watch-series-12-night-blue.jpg"],
  ["Pearl White", "Sand Sport Band", "apple-watch-series-12-pearl-white.jpg"],
  ["Dark Bronze", "Olive Sport Band", "apple-watch-series-12-dark-bronze.jpg"],
  ["Light Gold", "Burgundy Sport Band", "apple-watch-series-12-light-gold.jpg"],
  ["Black", "Black Sport Band", "apple-watch-series-12-black.jpg"],
  ["Space Gray", "Navy Blue Sport Band", "apple-watch-series-12-space-gray.jpg"],
  ["Radiant Gold", "Radiant Gold Milanese Loop", "apple-watch-series-12-radiant-gold.jpg"],
  ["Natural Titanium", "Natural Milanese Loop", "apple-watch-series-12-natural-titanium.jpg"],
] as const;

const airPodsSpecs = (wireless: boolean): Record<string, string> => ({
  "Тип": "Беспроводные вкладыши открытого типа",
  "Процессор": "Apple H2",
  "Связь": "Bluetooth 5.3",
  "Звук": "Активное шумоподавление, адаптивное аудио, прозрачный режим, пространственное аудио",
  "Управление": wireless ? "Датчик нажатия и свайп для регулировки громкости" : "Датчик нажатия",
  "Защита": "IP57 у наушников и зарядного футляра",
  "Автономность": wireless ? "До 5 часов с ANC; до 22 часов с футляром" : "До 4 часов с ANC; до 20 часов с футляром",
  "Зарядка": wireless ? "USB-C, зарядное устройство Apple Watch или Qi" : "USB-C",
  "Комплектация": wireless ? "AirPods 5 и беспроводной зарядный футляр с динамиком" : "AirPods 5 и зарядный футляр USB-C",
  "Важно": "Доступность функций зависит от устройства, версии ПО и региона; кабель USB-C приобретается отдельно.",
});

export const SEPTEMBER_2026_PRODUCTS: SeptemberProduct[] = [
  {
    category: "daisony",
    slug: "dyson-camerajet",
    name: "Dyson CameraJet",
    brand: "Dyson",
    description: "Dyson CameraJet — электрическая зубная щётка со встроенной камерой и системой точечной подачи жидкости между зубами. Камера помогает видеть пропущенные зоны в приложении MyDyson, а док-станция хранит, заряжает и заполняет резервуар щётки.",
    highlights: ["Камера с анализом 28 кадров в секунду", "Точечная струя для межзубных промежутков", "До 10 дней работы от аккумулятора"],
    specs: {
      "Тип": "Электрическая зубная щётка с системой точечной ирригации",
      "Камера": "Макрокамера 100 тыс. пикселей; анализ 28 кадров в секунду",
      "Подключение": "Wi‑Fi 2,4 ГГц и Bluetooth; приложение MyDyson",
      "Режимы": "Автоматическая или ручная подача струи; регулировка интенсивности чистки",
      "Автономность": "До 10 дней",
      "Зарядка": "USB-C — магнитный разъём pogo-pin",
      "Защита": "IPX7",
      "Резервуар щётки": "0,67 fl oz (около 19,8 мл)",
      "Цвета": "Ceramic Ultra Blue, Ceramic Pink",
      "Комплектация": "Щётка, док-станция, насадки, дорожный футляр, кабель; состав поставки может отличаться по региону",
    },
    images: [photo("dyson-camerajet-two-colors.jpg")],
    colorImages: {
      "Ceramic Ultra Blue": [photo("dyson-camerajet-ceramic-ultra-blue.jpg")],
      "Ceramic Pink": [photo("dyson-camerajet-ceramic-pink.jpg")],
    },
    variants: [unpriced(null, "Ceramic Ultra Blue"), unpriced(null, "Ceramic Pink")],
    sources: SEPTEMBER_2026_SOURCES.slice(0, 2),
    forceGeneralImage: true,
  },
  {
    category: "telefony",
    slug: "samsung-galaxy-s26-fe",
    name: "Samsung Galaxy S26 FE",
    brand: "Samsung",
    description: "Samsung Galaxy S26 FE — смартфон с 6,7-дюймовым Dynamic AMOLED 2X, чипом Exynos 2500 и тройной камерой с трёхкратным оптическим зумом. Представлен в цветах Graphite, Pistachio и Blueberry.",
    highlights: ["Dynamic AMOLED 2X, 120 Гц и до 1900 нит", "Exynos 2500 и One UI 9", "50 Мп основная камера и 3x оптический зум"],
    specs: {
      "Дисплей": "6,7″ FHD+ Dynamic AMOLED 2X, 60/120 Гц, до 1900 нит",
      "Процессор": "Samsung Exynos 2500, 3 нм",
      "Память": "8/128 ГБ или 8/256 ГБ",
      "Основная камера": "50 Мп основная + 12 Мп сверхширокоугольная + 8 Мп телефото",
      "Зум": "3x оптический, до 30x цифровой",
      "Фронтальная камера": "12 Мп",
      "Система": "Android 17, One UI 9",
      "Связь": "5G, Wi‑Fi 6E, Bluetooth 5.4",
      "Защита": "IP68; Gorilla Glass Victus+ и алюминиевая рамка",
      "Размеры и вес": "161,6 × 76,9 × 7,4 мм; 193 г",
      "Цвета": "Blueberry, Graphite, Pistachio",
      "Важно": "Набор цветов, функций и диапазонов связи зависит от региона поставки.",
    },
    images: [photo("samsung-galaxy-s26-fe-graphite.jpg")],
    colorImages: {
      Graphite: [photo("samsung-galaxy-s26-fe-graphite.jpg")],
      Pistachio: [photo("samsung-galaxy-s26-fe-pistachio.jpg")],
      Blueberry: [photo("samsung-galaxy-s26-fe-blueberry.jpg")],
    },
    variants: ["8/128GB", "8/256GB"].flatMap((memory) => ["Graphite", "Pistachio", "Blueberry"].map((color) => unpriced(memory, color))),
    sources: [SEPTEMBER_2026_SOURCES[2]],
  },
  {
    category: "chasy",
    slug: "apple-watch-series-12",
    name: "Apple Watch Series 12",
    brand: "Apple",
    description: "Apple Watch Series 12 — часы Apple с чипом S11 и системой датчиков Health Sensing System. Доступны алюминиевые, титановые и керамические корпуса; среди новых исполнений — Night Blue Ceramic с синим ремешком.",
    highlights: ["Керамические версии Pearl White и Night Blue", "Чип S11 и Health Sensing System", "Корпуса 42 и 46 мм"],
    specs: {
      "Размеры корпуса": "42 и 46 мм; керамические корпуса — 43 и 47 мм по высоте",
      "Материалы": "Алюминий, титан или керамика",
      "Процессор": "Apple S11",
      "Дисплей": "Always-On Retina OLED",
      "Управление": "Digital Crown, боковая кнопка, жесты одинарного и двойного касания",
      "Датчики": "Health Sensing System, датчики активности и окружающего освещения",
      "Связь": "Wi‑Fi, Bluetooth; GPS или GPS + Cellular в зависимости от версии",
      "Алюминиевые цвета": "Dark Bronze, Light Gold, Black, Space Gray",
      "Титановые цвета": "Radiant Gold, Natural Titanium",
      "Керамические цвета": "Pearl White, Night Blue",
      "Совместимость": "Требования к iPhone и версии iOS зависят от региона и выпуска watchOS",
      "Важно": "Функции здоровья и сотовая связь зависят от страны и оператора.",
    },
    images: [photo("apple-watch-series-12-night-blue.jpg")],
    colorImages: Object.fromEntries(appleWatchFinishes.map(([finish, , file]) => [finish, [photo(file)]])),
    variants: appleWatchFinishes.flatMap(([finish, band]) => [
      unpriced("42 мм", finish, `${band} S/M`),
      unpriced("46 мм", finish, `${band} M/L`),
    ]),
    sources: [SEPTEMBER_2026_SOURCES[3]],
  },
  {
    category: "naushniki",
    slug: "airpods-5",
    name: "AirPods 5",
    brand: "Apple",
    description: "AirPods 5 — беспроводные вкладыши открытого типа с чипом H2, активным шумоподавлением, адаптивным аудио и зарядным футляром USB-C.",
    highlights: ["Открытая посадка с активным шумоподавлением", "Чип H2 и адаптивное аудио", "До 20 часов с зарядным футляром"],
    specs: airPodsSpecs(false),
    images: [photo("airpods-5.jpg")],
    colorImages: {},
    variants: [unpriced(null, null, "USB‑C Charging Case")],
    sources: [SEPTEMBER_2026_SOURCES[4]],
  },
  {
    category: "naushniki",
    slug: "airpods-5-wireless",
    name: "AirPods 5 Wireless",
    brand: "Apple",
    description: "AirPods 5 Wireless — версия AirPods 5 с беспроводным зарядным футляром, динамиком для приложения «Локатор» и свайпом по ножке для регулировки громкости.",
    highlights: ["Беспроводная зарядка Qi и зарядником Apple Watch", "Свайп для регулировки громкости", "До 22 часов с зарядным футляром"],
    specs: airPodsSpecs(true),
    images: [photo("airpods-5.jpg")],
    colorImages: {},
    variants: [unpriced(null, null, "Wireless Charging Case")],
    sources: [SEPTEMBER_2026_SOURCES[4]],
  },
  {
    category: "fitnes-braslety",
    slug: "garmin-cirqa-smart-band",
    name: "Garmin CIRQA Smart Band",
    brand: "Garmin",
    description: "Garmin CIRQA Smart Band — фитнес-браслет без экрана для круглосуточного мониторинга здоровья, сна и тренировок. Данные доступны в Garmin Connect; обязательная подписка для основных функций не требуется.",
    highlights: ["До 10 дней автономной работы", "Мониторинг сна, пульса, SpO₂ и температуры кожи", "Более 80 типов активности и Connected GPS"],
    specs: {
      "Тип": "Фитнес-браслет без экрана",
      "Размер модуля": "27 × 47 × 9 мм",
      "Вес": "Модуль 14,8 г; с ремешком от 20,7 г",
      "Ремешок": "Тканевый ComfortFit; размеры S/M и L/XL",
      "Автономность": "До 10 дней",
      "Защита": "5 ATM",
      "Память": "128 МБ",
      "Датчики": "Пульс, Pulse Ox, акселерометр, температура кожи",
      "Тренировки": "Более 80 профилей; VO₂ max, Training Readiness, Training Status и Recovery Time",
      "Навигация": "Connected GPS через совместимый смартфон",
      "Связь": "Bluetooth, ANT+; приложение Garmin Connect",
      "Важно": "Часть тренировок Garmin Coach требует Garmin Connect+; функции здоровья не являются медицинской диагностикой.",
    },
    images: [photo("garmin-cirqa-french-gray.jpg")],
    colorImages: {
      "French Gray": [photo("garmin-cirqa-french-gray.jpg")],
      Black: [photo("garmin-cirqa-black.jpg")],
      "Captain Blue": [photo("garmin-cirqa-captain-blue.jpg")],
      Mauve: [photo("garmin-cirqa-mauve.jpg")],
    },
    variants: ["French Gray", "Black", "Captain Blue", "Mauve"].map((color) => unpriced(null, color)),
    sources: SEPTEMBER_2026_SOURCES.slice(5, 7),
  },
  {
    category: "naushniki",
    slug: "huawei-freeclip-2",
    name: "HUAWEI FreeClip 2",
    brand: "HUAWEI",
    description: "HUAWEI FreeClip 2 — открытые наушники-клипсы с гибкой C-образной перемычкой, сенсорным управлением и адаптивной громкостью. Каждый наушник весит около 5,1 г.",
    highlights: ["Открытая посадка и вес 5,1 г", "До 9 часов без футляра и до 38 часов суммарно", "IP57 и беспроводная зарядка футляра"],
    specs: {
      "Тип": "Открытые TWS-наушники-клипсы",
      "Размер наушника": "25,4 × 26,7 × 18,8 мм",
      "Вес": "Около 5,1 г каждый; футляр около 37,8 г",
      "Управление": "Двойное и тройное касание; свайп для регулировки громкости",
      "Звук": "Адаптивная громкость, пользовательский EQ, шумоподавление во время звонков",
      "Датчики": "ИК, Холла, гироскоп/акселерометр, костной проводимости, касания",
      "Автономность": "До 9 часов; до 38 часов с футляром",
      "Быстрая зарядка": "10 минут зарядки — до 3 часов прослушивания",
      "Зарядка": "USB-C; беспроводная до 3 Вт",
      "Защита": "IP57 у наушников; футляр не защищён по IP57",
      "Подключение": "Bluetooth; управление через HUAWEI AI Life / HUAWEI Audio Connect",
      "Важно": "Некоторые функции экосистемы доступны только на совместимых устройствах HUAWEI.",
    },
    images: [photo("huawei-freeclip-2-denim-blue.jpg")],
    colorImages: {
      "Denim Blue": [photo("huawei-freeclip-2-denim-blue.jpg")],
      "Modern Black": [photo("huawei-freeclip-2-modern-black.jpg")],
      "Feather Sand White": [photo("huawei-freeclip-2-feather-sand-white.jpg")],
      "Rose Gold": [photo("huawei-freeclip-2-rose-gold.jpg")],
      "Ice Berry Purple": [photo("huawei-freeclip-2-ice-berry-purple.jpg")],
    },
    variants: ["Denim Blue", "Modern Black", "Feather Sand White", "Rose Gold", "Ice Berry Purple"].map((color) => unpriced(null, color)),
    sources: [SEPTEMBER_2026_SOURCES[7]],
  },
];

type ExistingVariant = { memory: string | null; color: string | null; region: string | null };
type ExistingProduct = { images: string[]; colorImages: unknown; variants: ExistingVariant[] };

const normalized = (value: string | null) => (value ?? "").toLowerCase().replace(/[\s‑–—_-]+/g, "");
const sameVariant = (left: ExistingVariant, right: ExistingVariant) =>
  normalized(left.memory) === normalized(right.memory) &&
  normalized(left.color) === normalized(right.color) &&
  normalized(left.region) === normalized(right.region);

function existingColorImages(value: unknown): Record<string, string[]> {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Некорректный формат colorImages");
  const result: Record<string, string[]> = {};
  for (const [key, images] of Object.entries(value)) {
    if (!Array.isArray(images) || !images.every((image) => typeof image === "string")) throw new Error(`Некорректные фото цвета: ${key}`);
    result[key] = [...images];
  }
  return result;
}

/** Adds missing variants and photographs without touching prices, stock or IDs. */
export function planSeptemberProduct(
  product: SeptemberProduct,
  existing?: ExistingProduct | null,
  options: { replaceExistingPhotos?: boolean } = {},
) {
  const colorImages = options.replaceExistingPhotos ? {} : existingColorImages(existing?.colorImages);
  for (const [color, supplied] of Object.entries(product.colorImages)) {
    const currentKey = Object.keys(colorImages).find((key) => normalized(key) === normalized(color) && colorImages[key].length);
    if (!currentKey) colorImages[color] = [...supplied];
    for (const variant of existing?.variants ?? []) {
      if (variant.color && normalized(variant.color) === normalized(color) && !colorImages[variant.color]?.length) {
        colorImages[variant.color] = [...(currentKey ? colorImages[currentKey] : supplied)];
      }
    }
  }
  const images = options.replaceExistingPhotos || product.forceGeneralImage
    ? [...product.images]
    : existing?.images.length
      ? [...existing.images]
      : [...product.images];
  return {
    images,
    colorImages,
    variantsToCreate: product.variants.filter((variant) => !existing?.variants.some((old) => sameVariant(old, variant))),
  };
}

export const ULTRA4_GENERAL_PHOTO = photo("apple-watch-ultra-4-all-colors.jpg");
export const VERIFIED_EXISTING_PRODUCTS = [
  { slug: "huawei-pura-90s-pro", requiredColor: "Coconut White" },
] as const;
