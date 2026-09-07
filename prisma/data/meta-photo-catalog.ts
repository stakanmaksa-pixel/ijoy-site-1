import { variantImageKey } from "../../src/lib/pickCoverImage";

export type CatalogVariantDraft = {
  memory?: string | null;
  color?: string | null;
  region?: string | null;
  price: number;
  rawLabel: string;
};

export type MetaPhotoCatalogProduct = {
  slug: string;
  name: string;
  category: "smart-ochki" | "ekshn-kamery";
  brand: string;
  description: string;
  images: string[];
  colorImages: Record<string, string[]>;
  highlights: string[];
  specs: Record<string, string>;
  variants: CatalogVariantDraft[];
};

const asset = (file: string) => `/catalog/product-photos/meta-photo/${file}`;

export const META_PHOTO_ASSETS = {
  starfire: asset("rayban-starfire-kylie.webp"),
  display: asset("rayban-display.jpg"),
  wayfarer: asset("rayban-wayfarer-gen2.png"),
  skylerGen1: asset("rayban-skyler-gen1.png"),
  headliner: asset("rayban-headliner-gen2.png"),
  skylerGen2: asset("rayban-skyler-gen2.png"),
  goUltra: asset("insta360-go-ultra.png"),
  go3s: asset("insta360-go-3s.png"),
  x3: asset("insta360-x3.png"),
  x5: asset("insta360-x5.jpg"),
  djiOsmo360: asset("dji-osmo-360.png"),
  djiMobile7p: asset("dji-osmo-mobile-7p.png"),
  hero12: asset("gopro-hero12.jpg"),
  hero13: asset("gopro-hero13.png"),
  instaxPink: asset("instax-mini13-candy-pink.png"),
  instaxWhite: asset("instax-mini13-clay-white.png"),
  instaxPurple: asset("instax-mini13-dreamy-purple.png"),
  canonBlack: asset("canon-g7x-mark-iii-black.jpg"),
} as const;

export const META_PHOTO_PATHS = Object.values(META_PHOTO_ASSETS);

type PhotoSource = string | Record<string, string>;

function imageFor(variant: CatalogVariantDraft, photos: PhotoSource): string {
  if (typeof photos === "string") return photos;
  return photos[variant.color ?? ""] ?? Object.values(photos)[0]!;
}

function product(config: Omit<MetaPhotoCatalogProduct, "images" | "colorImages"> & { photos: PhotoSource }): MetaPhotoCatalogProduct {
  const { photos, ...content } = config;
  const variantImages: Array<[string, string[]]> = content.variants.map((variant) => [
    variantImageKey(variant),
    [imageFor(variant, photos)],
  ]);
  const colorImages: Array<[string, string[]]> = [];
  for (const variant of content.variants) {
    if (variant.color) colorImages.push([variant.color, [imageFor(variant, photos)]]);
  }
  return {
    ...content,
    images: [...new Set(content.variants.map((variant) => imageFor(variant, photos)))],
    colorImages: Object.fromEntries([...variantImages, ...colorImages]),
  };
}

const v = (
  rawLabel: string,
  price: number,
  memory: string | null = null,
  color: string | null = null,
  region: string | null = null,
): CatalogVariantDraft => ({ rawLabel, price, memory, color, region });

const SMART_GEN_1_SPECS = {
  "Поколение": "Gen 1",
  "Камера": "Встроенная сверхширокоугольная камера 12 Мп",
  "Звук": "Открытые динамики и массив микрофонов",
  "Управление": "Кнопка съёмки, сенсорная панель и голосовое управление",
  "Подключение": "Bluetooth и Wi‑Fi через приложение Meta AI",
};

const SMART_GEN_2_SPECS = {
  "Поколение": "Gen 2",
  "Камера": "Фото 3024 × 4032; видео до 3K",
  "Память": "32 ГБ — более 500 фотографий или свыше 100 роликов по 30 секунд",
  "Звук": "Открытые динамики и пять микрофонов",
  "Подключение": "Wi‑Fi 6E и Bluetooth 5.3 через приложение Meta AI",
  "Автономность": "До 8 часов от очков; зарядный футляр продлевает работу",
};

// Одна карточка = одна модель, а не один прайсовый ряд. На странице модели
// покупатель получает все названные поставщиком исполнения, фильтры и
// сравнение по размеру, оправе и линзам.
export const META_PHOTO_CATALOG: MetaPhotoCatalogProduct[] = [
  product({
    slug: "ray-ban-meta-starfire-kylie-edition",
    name: "Ray-Ban Meta Starfire Kylie Edition",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Лимитированная коллекция умных очков Starfire Kylie Edition в овальной оправе. Выберите исполнение оправы и линз.",
    highlights: [
      "Лимитированная серия Starfire Kylie Edition",
      "Встроенная камера, открытые динамики и микрофоны",
      "До 8 часов работы очков от одного заряда",
    ],
    specs: {
      "Серия": "Starfire Kylie Edition",
      "Форм-фактор": "Умные очки в тонкой овальной оправе",
      "Управление": "Кнопка съёмки, сенсорная панель и голосовое управление",
      "Комплект": "Очки и зарядный футляр; состав поставки уточняйте у менеджера",
    },
    photos: META_PHOTO_ASSETS.starfire,
    variants: [
      v("Ray-Ban Meta Starfire Kylie Edition (Classic Black/Black)", 47500, null, "Classic Black", "Black"),
      v("Ray-Ban Meta Starfire Kylie Edition (Classic Black/Clear Grey Transitions)", 60500, null, "Classic Black", "Clear Grey Transitions"),
      v("Ray-Ban Meta Starfire Kylie Edition (Dark Tortoise/Chocolate)", 65500, null, "Dark Tortoise", "Chocolate"),
    ],
  }),
  product({
    slug: "meta-ray-ban-display",
    name: "Meta Ray-Ban Display",
    category: "smart-ochki",
    brand: "Meta Ray-Ban",
    description: "Умные очки Meta Ray-Ban Display в чёрной оправе. Выберите подходящий размер.",
    highlights: [
      "Монокулярный дисплей 600 × 600 в правой линзе",
      "Управление жестами через Meta Neural Band",
      "Встроенные камера, динамики и микрофоны",
    ],
    specs: {
      "Дисплей": "Монокулярный 600 × 600 в правой линзе",
      "Управление": "Голос, сенсорная панель и жесты Meta Neural Band",
      "Оправа": "Shiny Black",
      "Комплект": "Очки; комплектацию уточняйте у менеджера",
    },
    photos: META_PHOTO_ASSETS.display,
    variants: [
      v("Meta Ray-Ban DISPLAY SHINY BLACK SIZE 2 (M)", 108500, "M", "Shiny Black"),
      v("Meta Ray-Ban DISPLAY SHINY BLACK SIZE 3 (L)", 110500, "L", "Shiny Black"),
    ],
  }),
  product({
    slug: "ray-ban-meta-wayfarer-rw4006-gen1",
    name: "Ray-Ban Meta Wayfarer RW4006 (Gen 1)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Умные очки Ray-Ban Meta первого поколения в оправе Wayfarer. Выберите линзы и размер.",
    highlights: ["Камера 12 Мп для фото и коротких видео", "Открытые динамики и микрофоны", "Классическая оправа Wayfarer"],
    specs: SMART_GEN_1_SPECS,
    photos: META_PHOTO_ASSETS.wayfarer,
    variants: [
      v("Ray-Ban Meta Wayfarer RW4006 Matte Black / Polar Gradient Graphite · Размер M", 26500, "M", "Matte Black", "Polar Gradient Graphite"),
      v("Ray-Ban Meta Wayfarer RW4006 Matte Black / Transitions Graphite Green · Размер M", 28500, "M", "Matte Black", "Transitions Graphite Green"),
    ],
  }),
  product({
    slug: "ray-ban-meta-wayfarer-rw4008-gen1",
    name: "Ray-Ban Meta Wayfarer RW4008 (Gen 1)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Умные очки Ray-Ban Meta первого поколения в оправе Wayfarer. Выберите линзы и размер.",
    highlights: ["Камера 12 Мп для фото и коротких видео", "Открытые динамики и микрофоны", "Классическая оправа Wayfarer"],
    specs: SMART_GEN_1_SPECS,
    photos: META_PHOTO_ASSETS.wayfarer,
    variants: [
      v("Ray-Ban Meta Wayfarer RW4008 Matte Black / Polar Gradient Graphite · Размер M", 27500, "M", "Matte Black", "Polar Gradient Graphite"),
      v("Ray-Ban Meta Wayfarer RW4008 Matte Black / Transitions Graphite Green · Размер L", 28500, "L", "Matte Black", "Transitions Graphite Green"),
    ],
  }),
  product({
    slug: "ray-ban-meta-skyler-rw4010-gen1",
    name: "Ray-Ban Meta Skyler RW4010 (Gen 1)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Умные очки Ray-Ban Meta первого поколения в оправе Skyler. Все варианты представлены в размере M.",
    highlights: ["Камера 12 Мп для фото и коротких видео", "Открытые динамики и микрофоны", "Более мягкая форма оправы Skyler"],
    specs: SMART_GEN_1_SPECS,
    photos: META_PHOTO_ASSETS.skylerGen1,
    variants: [
      v("Ray-Ban Meta Skyler RW4010 Shiny Black / G15 Green · Размер M", 21500, "M", "Shiny Black", "G15 Green"),
      v("Ray-Ban Meta Skyler RW4010 Shiny Black / Transitions Amethyst · Размер M", 22200, "M", "Shiny Black", "Transitions Amethyst"),
      v("Ray-Ban Meta Skyler RW4010 Shiny Black / Transitions Cerulean Blue · Размер M", 22900, "M", "Shiny Black", "Transitions Cerulean Blue"),
    ],
  }),
  product({
    slug: "ray-ban-meta-wayfarer-rw4012-gen2",
    name: "Ray-Ban Meta Wayfarer RW4012 (Gen 2)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Ray-Ban Meta второго поколения в оправе Wayfarer. Выберите размер, материал оправы и тип линз.",
    highlights: ["Видео до 3K и камера 12 Мп", "До 8 часов работы очков", "32 ГБ встроенной памяти"],
    specs: SMART_GEN_2_SPECS,
    photos: META_PHOTO_ASSETS.wayfarer,
    variants: [
      v("Ray-Ban Meta Wayfarer RW4012 Matte Black / Clear · Размер M", 35000, "M", "Matte Black", "Clear"),
      v("Ray-Ban Meta Wayfarer RW4012 Matte Black / Clear · Размер L", 34500, "L", "Matte Black", "Clear"),
      v("Ray-Ban Meta Wayfarer RW4012 Matte Black / Transitions Gray · Размер L", 37500, "L", "Matte Black", "Transitions Gray"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Black / Transitions Graphite Green · Размер M", 36500, "M", "Shiny Black", "Transitions Graphite Green"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Black / Transitions Graphite Green · Размер L", 37500, "L", "Shiny Black", "Transitions Graphite Green"),
      v("Ray-Ban Meta Wayfarer RW4012 Matte Black / Polar Gradient Graphite · Размер M", 35500, "M", "Matte Black", "Polar Gradient Graphite"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Black / G15 Green · Размер M", 31000, "M", "Shiny Black", "G15 Green"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Black / G15 Green · Размер L", 31000, "L", "Shiny Black", "G15 Green"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Cosmic Blue / Transitions Sapphire · Размер M", 36500, "M", "Shiny Cosmic Blue", "Transitions Sapphire"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Cosmic Blue / Transitions Sapphire · Размер L", 36500, "L", "Shiny Cosmic Blue", "Transitions Sapphire"),
      v("Ray-Ban Meta Wayfarer RW4012 Shiny Transparent Grey / Transitions Sapphire · Размер L", 36500, "L", "Shiny Transparent Grey", "Transitions Sapphire"),
    ],
  }),
  product({
    slug: "ray-ban-meta-blayzer-optics-gen2",
    name: "Ray-Ban Meta Blayzer Optics (Gen 2)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Умные очки Ray-Ban Meta Blayzer Optics второго поколения — тонкая оправа, рассчитанная на установку рецептурных линз.",
    highlights: ["Оправа для рецептурных линз", "Гибкие носоупоры и дужки с дополнительным ходом", "Камера, открытые динамики и микрофоны"],
    specs: {
      ...SMART_GEN_2_SPECS,
      "Оправа": "Blayzer Optics, адаптирована для рецептурных линз",
      "Размер": "M (50–19)",
    },
    // Для этой партии доступна одна матовая чёрная версия; используется
    // официальное предметное фото линейки Meta в аналогичной чёрной оправе.
    photos: META_PHOTO_ASSETS.wayfarer,
    variants: [
      v("Ray-Ban Meta Blayzer Optics Gen 2 Matte Black · Размер M", 38500, "M", "Matte Black"),
    ],
  }),
  product({
    slug: "ray-ban-meta-headliner-rw4013-gen2",
    name: "Ray-Ban Meta Headliner RW4013 (Gen 2)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Ray-Ban Meta второго поколения в оправе Headliner. Все варианты представлены в размере M.",
    highlights: ["Видео до 3K и камера 12 Мп", "До 8 часов работы очков", "32 ГБ встроенной памяти"],
    specs: SMART_GEN_2_SPECS,
    photos: META_PHOTO_ASSETS.headliner,
    variants: [
      v("Ray-Ban Meta Headliner RW4013 Matte Black / Polar Gradient Graphite · Размер M", 36500, "M", "Matte Black", "Polar Gradient Graphite"),
      v("Ray-Ban Meta Headliner RW4013 Shiny Asteroid Grey / Transitions Emerald · Размер M", 37300, "M", "Shiny Asteroid Grey", "Transitions Emerald"),
    ],
  }),
  product({
    slug: "ray-ban-meta-skyler-rw4014-gen2",
    name: "Ray-Ban Meta Skyler RW4014 (Gen 2)",
    category: "smart-ochki",
    brand: "Ray-Ban Meta",
    description: "Ray-Ban Meta второго поколения в оправе Skyler. Все варианты представлены в размере S52 (M/L).",
    highlights: ["Видео до 3K и камера 12 Мп", "До 8 часов работы очков", "32 ГБ встроенной памяти"],
    specs: SMART_GEN_2_SPECS,
    photos: META_PHOTO_ASSETS.skylerGen2,
    variants: [
      v("Ray-Ban Meta Skyler RW4014 Shiny Black / Clear · Размер S52 (M/L)", 35500, "S52 (M/L)", "Shiny Black", "Clear"),
      v("Ray-Ban Meta Skyler RW4014 Shiny Black / Polar Gradient Graphite · Размер S52 (M/L)", 36500, "S52 (M/L)", "Shiny Black", "Polar Gradient Graphite"),
      v("Ray-Ban Meta Skyler RW4014 Shiny Black / G15 Green · Размер S52 (M/L)", 36000, "S52 (M/L)", "Shiny Black", "G15 Green"),
      v("Ray-Ban Meta Skyler RW4014 Shiny Black / Transitions Graph Green · Размер S52 (M/L)", 38500, "S52 (M/L)", "Shiny Black", "Transitions Graph Green"),
      v("Ray-Ban Meta Skyler RW4014 Shiny Black / Transitions Amethyst · Размер S52 (M/L)", 38500, "S52 (M/L)", "Shiny Black", "Transitions Amethyst"),
    ],
  }),
  product({
    slug: "insta360-go-ultra",
    name: "Insta360 GO Ultra",
    category: "ekshn-kamery",
    brand: "Insta360",
    description: "Компактная камера Insta360 GO Ultra для съёмки от первого лица. Доступны стандартная чёрная версия и Creator Bundle в белом исполнении.",
    highlights: ["Съёмка без рук и компактный корпус", "Видео Ultra HD для дневных и ночных сцен", "Расширяемое хранилище на карте microSD"],
    specs: {
      "Тип": "Компактная камера для съёмки без рук",
      "Видео": "Ultra HD; точные режимы зависят от версии прошивки",
      "Память": "Карта microSD приобретается отдельно",
      "Комплектация": "Standard или Creator Bundle — выберите вариант ниже",
    },
    photos: META_PHOTO_ASSETS.goUltra,
    variants: [
      v("Insta 360 GO Ultra (Black)", 27900, null, "Black", "Standard"),
      v("Insta 360 GO Ultra Creator Bundle (White)", 32200, null, "White", "Creator Bundle"),
    ],
  }),
  product({
    slug: "insta360-go-3s",
    name: "Insta360 GO 3S",
    category: "ekshn-kamery",
    brand: "Insta360",
    description: "Миниатюрная камера Insta360 GO 3S для повседневной съёмки и видео от первого лица.",
    highlights: ["Видео 4K", "Магнитные крепления для съёмки без рук", "Стабилизация FlowState"],
    specs: { "Видео": "До 4K", "Память": "128 ГБ", "Цвет": "Black", "Стабилизация": "FlowState" },
    photos: META_PHOTO_ASSETS.go3s,
    variants: [v("Insta 360 Go3S Standard 128 GB (Black)", 22500, "128GB", "Black")],
  }),
  product({
    slug: "insta360-x3",
    name: "Insta360 X3",
    category: "ekshn-kamery",
    brand: "Insta360",
    description: "360°-камера Insta360 X3 с большим сенсорным экраном и режимами для экшн- и повседневной съёмки.",
    highlights: ["Панорамная съёмка 360°", "Фото до 72 Мп", "Стабилизация FlowState и Horizon Lock"],
    specs: { "Тип": "360°-камера", "Фото": "До 72 Мп", "Стабилизация": "FlowState и Horizon Lock", "Экран": "Сенсорный экран" },
    photos: META_PHOTO_ASSETS.x3,
    variants: [v("Insta 360 X3", 20500, null, "Black")],
  }),
  product({
    slug: "insta360-x5",
    name: "Insta360 X5",
    category: "ekshn-kamery",
    brand: "Insta360",
    description: "Панорамная камера Insta360 X5 для записи 8K 360° видео, съёмки при слабом освещении и динамичных сцен.",
    highlights: ["8K 360° видео", "Сменные защитные линзы", "Стабилизация FlowState и Horizon Lock"],
    specs: { "Видео": "До 8K 360°", "Сенсоры": "Два сенсора 1/1,28″", "Защита": "Водозащита до 15 м", "Стабилизация": "FlowState и Horizon Lock" },
    photos: META_PHOTO_ASSETS.x5,
    variants: [
      v("Insta 360 X5 (Black)", 36600, null, "Black"),
      v("Insta 360 X5 (White)", 36600, null, "White"),
    ],
  }),
  product({
    slug: "gopro-hero12-black",
    name: "GoPro HERO 12 (Black)",
    category: "ekshn-kamery",
    brand: "GoPro",
    description: "Экшн-камера GoPro HERO 12 Black для съёмки путешествий, спорта и видео от первого лица.",
    highlights: ["Видео до 5,3K", "Стабилизация HyperSmooth 6.0", "Фото до 27 Мп и HDR"],
    specs: { "Видео": "До 5,3K", "Фото": "До 27 Мп", "Стабилизация": "HyperSmooth 6.0", "Защита": "Водозащита без бокса" },
    photos: META_PHOTO_ASSETS.hero12,
    variants: [v("GoPro HERO 12 (Black)", 23800, null, "Black")],
  }),
  product({
    slug: "gopro-hero13-black",
    name: "GoPro HERO 13 (Black)",
    category: "ekshn-kamery",
    brand: "GoPro",
    description: "Экшн-камера GoPro HERO 13 Black с поддержкой объективов HB‑Series и встроенным GPS.",
    highlights: ["Видео до 5,3K и фото до 27 Мп", "Поддержка объективов HB‑Series", "Стабилизация HyperSmooth и встроенный GPS"],
    specs: { "Видео": "До 5,3K", "Фото": "До 27 Мп", "Объективы": "Поддержка HB‑Series", "Навигация": "Встроенный GPS" },
    photos: META_PHOTO_ASSETS.hero13,
    variants: [v("GoPro HERO 13 (Black)", 26700, null, "Black")],
  }),
  product({
    slug: "dji-osmo-360-standard-combo",
    name: "DJI Osmo 360 Standard Combo",
    category: "ekshn-kamery",
    brand: "DJI",
    description: "Панорамная камера DJI Osmo 360 Standard Combo для 360°-видео и высокодетальных фотографий.",
    highlights: ["8K 360° видео", "Фото до 120 Мп", "Компактный корпус с защитой от воды и пыли"],
    specs: { "Видео": "До 8K 360°", "Фото": "До 120 Мп", "Комплект": "Standard Combo", "Цвет": "Black" },
    photos: META_PHOTO_ASSETS.djiOsmo360,
    variants: [v("DJI Osmo 360 Standard Combo (Black)", 25500, null, "Black")],
  }),
  product({
    slug: "dji-osmo-mobile-7p",
    name: "DJI Osmo Mobile 7P",
    category: "ekshn-kamery",
    brand: "DJI",
    description: "Трёхосевой стабилизатор DJI Osmo Mobile 7P для смартфона с удлинителем и штативом в корпусе.",
    highlights: ["Трёхосевая стабилизация", "Встроенные удлинитель и штатив", "До 10 часов работы"],
    specs: { "Тип": "Трёхосевой стабилизатор для смартфона", "Автономность": "До 10 часов", "Конструкция": "Встроенные удлинитель и штатив", "Приложение": "DJI Mimo" },
    photos: META_PHOTO_ASSETS.djiMobile7p,
    variants: [v("DJI Osmo Mobile 7P", 8200)],
  }),
  product({
    slug: "canon-powershot-g7-x-mark-iii",
    name: "Canon PowerShot G7 X Mark III",
    category: "ekshn-kamery",
    brand: "Canon",
    description: "Компактная камера Canon PowerShot G7 X Mark III с 1-дюймовым сенсором, светосильным зум-объективом и 4K-видео.",
    highlights: ["1-дюймовый многослойный сенсор 20,1 Мп", "Светосильный объектив f/1.8–2.8", "4K-видео и поворотный экран"],
    specs: { "Сенсор": "1″ CMOS, 20,1 Мп", "Объектив": "24–100 мм экв., f/1.8–2.8", "Видео": "4K до 29,97 кадр/с", "Экран": "Поворотный 3″, около 1,04 млн точек" },
    photos: META_PHOTO_ASSETS.canonBlack,
    variants: [
      v("Canon PowerShot G7 X Mark III (Black)", 100000, null, "Black", "Стандартная версия"),
      v("Canon PowerShot G7 X Mark III (Silver) c рус яз", 99600, null, "Silver", "Русский язык"),
    ],
  }),
  product({
    slug: "fujifilm-instax-mini-13",
    name: "Fujifilm Instax Mini 13",
    category: "ekshn-kamery",
    brand: "Fujifilm",
    description: "Моментальная камера Fujifilm Instax Mini 13 для фотографий на плёнку Instax mini.",
    highlights: ["Автоматическая настройка экспозиции", "Таймер на 2 или 10 секунд", "Режим крупного плана от 30 см"],
    specs: { "Плёнка": "Fujifilm instax mini (продаётся отдельно)", "Размер снимка": "62 × 46 мм", "Дистанция": "От 0,3 м; крупный план 0,3–0,5 м", "Питание": "Две батарейки AA" },
    photos: {
      "Candy Pink": META_PHOTO_ASSETS.instaxPink,
      "Clay White": META_PHOTO_ASSETS.instaxWhite,
      "Dreamy Purple": META_PHOTO_ASSETS.instaxPurple,
    },
    variants: [
      v("Fujifilm Instax Mini 13 (Candy Pink)", 9000, null, "Candy Pink"),
      v("Fujifilm Instax Mini 13 (Clay White)", 9000, null, "Clay White"),
      v("Fujifilm Instax Mini 13 (Dreamy Purple)", 9000, null, "Dreamy Purple"),
    ],
  }),
];

export const META_PHOTO_PRODUCT_SLUGS = META_PHOTO_CATALOG.map((item) => item.slug);
export const SMART_GLASSES_SLUGS = META_PHOTO_CATALOG
  .filter((item) => item.category === "smart-ochki")
  .map((item) => item.slug);
export const KEPT_GOPRO_SLUGS = new Set(["gopro-hero12-black", "gopro-hero13-black"]);

export type ExistingCatalogVariant = {
  id: string;
  productId: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  rawLabel: string | null;
  price: unknown | null;
  inStock: boolean;
  updatedAt: Date;
};

// План не меняет входные данные. Сначала сохраняем строку с тем же
// исходным названием, затем — совпадение по трём параметрам. Так повторный
// запуск не плодит варианты и не теряет id, которые уже могли попасть в
// избранное или заказ.
export function planCatalogVariants<T extends ExistingCatalogVariant>(
  existing: T[],
  desired: CatalogVariantDraft[],
) {
  const used = new Set<string>();
  const take = (predicate: (variant: T) => boolean) => {
    const found = existing.find((variant) => !used.has(variant.id) && predicate(variant));
    if (found) used.add(found.id);
    return found;
  };
  const options = desired.map((option) => {
    const exactLabel = take((variant) => variant.rawLabel === option.rawLabel);
    const existingVariant = exactLabel ?? take((variant) => variantImageKey(variant) === variantImageKey(option));
    return { option, existing: existingVariant };
  });
  return { options, remaining: existing.filter((variant) => !used.has(variant.id)) };
}

export function shouldHideGoPro(product: { slug: string; brand: string | null; category: { slug: string } }) {
  return product.category.slug === "ekshn-kamery" &&
    product.brand?.toLowerCase() === "gopro" &&
    !KEPT_GOPRO_SLUGS.has(product.slug);
}
