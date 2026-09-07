import { variantImageKey } from "../../src/lib/pickCoverImage";

export type GamingLifestyleCategory =
  | "igrovye-pristavki"
  | "portativnye-konsoli"
  | "vr-garnitury"
  | "igrovye-aksessuary"
  | "naushniki"
  | "fitnes-braslety"
  | "portativnaya-akustika";

export type GamingLifestyleVariant = {
  memory?: string | null;
  color?: string | null;
  region?: string | null;
  price: number;
  rawLabel: string;
};

export type GamingLifestyleProduct = {
  slug: string;
  name: string;
  category: GamingLifestyleCategory;
  brand: string;
  description: string;
  images: string[];
  colorImages: Record<string, string[]>;
  highlights: string[];
  specs: Record<string, string>;
  variants: GamingLifestyleVariant[];
};

const asset = (file: string) => `/catalog/product-photos/gaming-lifestyle/${file}`;

// Карточки используют локальные оригинальные предметные фото. Это важно для
// стабильной витрины: страница не зависит от CDN бренда или магазина.
export const GAMING_LIFESTYLE_ASSETS = {
  ps5Pro: asset("ps5-pro.png"),
  ps5Slim: asset("ps5-slim.png"),
  psPortal: asset("ps-portal.png"),
  psVr2: asset("ps-vr2.png"),
  g923: asset("logitech-g923.jpg"),
  g29: asset("logitech-g29.jpg"),
  shifter: asset("logitech-driving-force-shifter.jpg"),
  dualsense: asset("dualsense.png"),
  victrix: asset("victrix-pro-bfg.png"),
  dualsenseEditions: asset("dualsense-special-editions.png"),
  dualsenseEdge: asset("dualsense-edge.jpg"),
  ps5Stand: asset("ps5-vertical-stand.png"),
  dualsenseCharge: asset("dualsense-charging-station.png"),
  ps5DiscDrive: asset("ps5-disc-drive.png"),
  pulseElite: asset("pulse-elite.png"),
  pulse3d: asset("pulse-3d.png"),
  switch2: asset("nintendo-switch-2.webp"),
  switchOled: asset("nintendo-switch-oled.png"),
  switchLite: asset("nintendo-switch-lite.jpg"),
  quest3s: asset("meta-quest-3s.webp"),
  quest3: asset("meta-quest-3.webp"),
  xboxSeriesX: asset("xbox-series-x.png"),
  legionGoS: asset("lenovo-legion-go-s.jpg"),
  rogAlly: asset("rog-xbox-ally.jpg"),
  steamMachine: asset("valve-steam-machine.jpg"),
  steamDeck: asset("steam-deck-oled.jpg"),
  steamDock: asset("steam-deck-dock.jpg"),
  fitbitAir: asset("google-fitbit-air.png"),
  whoop: asset("whoop.jpg"),
  kilburn: asset("marshall-kilburn-iii.png"),
  emberton: asset("marshall-emberton-iii.jpg"),
  middleton: asset("marshall-middleton.jpg"),
  stanmore: asset("marshall-stanmore-iii.webp"),
  woburn: asset("marshall-woburn-iii.jpg"),
  major: asset("marshall-major-v.jpg"),
} as const;

export const GAMING_LIFESTYLE_PHOTO_PATHS = Object.values(GAMING_LIFESTYLE_ASSETS);

function product(
  content: Omit<GamingLifestyleProduct, "images" | "colorImages"> & { photo: string },
): GamingLifestyleProduct {
  const { photo, ...item } = content;
  const variantImages: Array<[string, string[]]> = item.variants.map((variant) => [variantImageKey(variant), [photo]]);
  const colorImages: Array<[string, string[]]> = item.variants
    .filter((variant) => variant.color)
    .map((variant) => [variant.color!, [photo]]);
  return {
    ...item,
    images: [photo],
    colorImages: Object.fromEntries([...variantImages, ...colorImages]),
  };
}

const v = (
  rawLabel: string,
  price: number,
  memory: string | null = null,
  color: string | null = null,
  region: string | null = null,
): GamingLifestyleVariant => ({ rawLabel, price, memory, color, region });

const PS5_COMPATIBILITY = "Для PlayStation 5";
const DUALSENSE_COMPATIBILITY = "PS5 · PC · Mac · Mobile";

// Одна карточка — одна модель. Цвета, издания, память и комплектации живут
// внутри неё как варианты: в каталоге не возникает 92 почти одинаковых плитки.
export const GAMING_LIFESTYLE_CATALOG: GamingLifestyleProduct[] = [
  product({
    slug: "playstation-5-pro",
    name: "PlayStation 5 Pro",
    category: "igrovye-pristavki",
    brand: "Sony PlayStation",
    description: "Флагманская игровая консоль PlayStation 5 Pro для игр в 4K. Подберите совместимые контроллеры, гарнитуру и VR2 отдельно.",
    highlights: ["2 ТБ SSD в встроенной конфигурации", "Поддержка PS5 Pro Enhanced игр", "Совместима с аксессуарами и играми PS5"],
    specs: {
      "Платформа": "PlayStation 5 Pro",
      "Накопитель": "2 ТБ SSD",
      "Видео": "До 4K, HDR; поддержка 120 Гц в совместимых играх и на совместимом дисплее",
      "Беспроводная связь": "Wi‑Fi 7, Wi‑Fi 6 и Wi‑Fi 5; зависит от совместимого роутера",
      "Совместимые аксессуары": "DualSense, DualSense Edge, PS VR2, PlayStation Portal, PULSE Elite, дисковод для совместимых версий",
      "Комплектация": "Консоль; состав поставки и наличие привода уточняйте для конкретной поставки",
    },
    photo: GAMING_LIFESTYLE_ASSETS.ps5Pro,
    variants: [v("PS5 Pro", 107500, "2TB", "White", "Цифровая консоль")],
  }),
  product({
    slug: "playstation-5-slim-disc-rev2",
    name: "PlayStation 5 Slim с дисководом (ревизия 2)",
    category: "igrovye-pristavki",
    brand: "Sony PlayStation",
    description: "Компактная PlayStation 5 Slim с дисководом. Подходит для цифровых и дисковых игр PS5 и поддерживает официальные аксессуары PlayStation.",
    highlights: ["Встроенный дисковод", "Игры PS5 и обратная совместимость с большинством игр PS4", "Поддержка PS VR2 и контроллеров DualSense"],
    specs: {
      "Платформа": "PlayStation 5 Slim",
      "Привод": "Встроенный дисковод",
      "Совместимые аксессуары": "DualSense, DualSense Edge, PS VR2, PlayStation Portal, PULSE Elite и PULSE 3D",
      "Комплектация": "Консоль и комплектные аксессуары поставки; детали уточняйте у менеджера",
    },
    photo: GAMING_LIFESTYLE_ASSETS.ps5Slim,
    variants: [v("PS5 Slim Disk 2 рев", 69500, "Ревизия 2", "White", "С дисководом")],
  }),
  product({
    slug: "playstation-5-slim-digital-rev2",
    name: "PlayStation 5 Slim Digital (ревизия 2)",
    category: "igrovye-pristavki",
    brand: "Sony PlayStation",
    description: "Цифровая PlayStation 5 Slim для игр из PlayStation Store. Для совместимых версий отдельно доступен фирменный дисковод.",
    highlights: ["Цифровая версия без встроенного дисковода", "Поддержка PS VR2 и аксессуаров PS5", "Совместима с PlayStation Portal через Remote Play"],
    specs: {
      "Платформа": "PlayStation 5 Slim Digital",
      "Привод": "Без встроенного дисковода",
      "Совместимые аксессуары": "DualSense, DualSense Edge, PS VR2, PlayStation Portal, PULSE Elite, совместимый дисковод",
      "Комплектация": "Консоль и комплектные аксессуары поставки; детали уточняйте у менеджера",
    },
    photo: GAMING_LIFESTYLE_ASSETS.ps5Slim,
    variants: [v("PS5 Slim Digital 2 рев", 58000, "Ревизия 2", "White", "Цифровая версия")],
  }),
  product({
    slug: "playstation-portal-remote-player",
    name: "PlayStation Portal Remote Player",
    category: "portativnye-konsoli",
    brand: "Sony PlayStation",
    description: "Портативное устройство Remote Play для доступа к совместимым играм, установленным на вашей PlayStation 5, по Wi‑Fi.",
    highlights: ["8-дюймовый LCD-дисплей 1080p", "Remote Play для совместимых игр PS5 и PS4", "Гибридные органы управления с возможностями DualSense"],
    specs: {
      "Тип": "Remote Play-плеер для PlayStation 5",
      "Экран": "8″ LCD, до 1080p / 60 Гц",
      "Совместимость": "Требуются PS5, учётная запись и широкополосное Wi‑Fi-подключение",
      "Аудио": "Проводные наушники 3,5 мм или совместимые устройства PlayStation Link",
      "Важно": "Игры, которым нужны PS VR/PS VR2 или специальные периферийные устройства, на Portal не поддерживаются",
    },
    photo: GAMING_LIFESTYLE_ASSETS.psPortal,
    variants: [
      v("PS5 Portal White", 21500, null, "White", PS5_COMPATIBILITY),
      v("PS5 Portal Black", 21500, null, "Black", PS5_COMPATIBILITY),
      v("PS5 Portal 30th Edition", 39000, "30th Edition", "Gray", PS5_COMPATIBILITY),
    ],
  }),
  product({
    slug: "playstation-vr2",
    name: "PlayStation VR2",
    category: "vr-garnitury",
    brand: "Sony PlayStation",
    description: "VR-гарнитура PlayStation VR2 для совместимых игр на PlayStation 5. Выберите стандартный комплект или набор с Horizon Call of the Mountain.",
    highlights: ["OLED-дисплей, отслеживание взгляда и адаптивные триггеры Sense", "Подключение к PS5 одним кабелем USB‑C", "Два контроллера PS VR2 Sense в комплекте"],
    specs: {
      "Совместимость": "Только с PlayStation 5; не работает с PlayStation 4",
      "Дисплей": "OLED, 2000 × 2040 на глаз, до 120 Гц",
      "Контроллеры": "Два PS VR2 Sense в комплекте",
      "Подключение": "USB‑C к PlayStation 5",
      "Комплектация": "VR-гарнитура, контроллеры Sense; игра Horizon — только в соответствующем наборе",
    },
    photo: GAMING_LIFESTYLE_ASSETS.psVr2,
    variants: [
      v("VR2 с игрой Horizon", 32000, "С игрой Horizon", "White", PS5_COMPATIBILITY),
      v("VR2 без игры", 32000, "Стандартный комплект", "White", PS5_COMPATIBILITY),
    ],
  }),
  product({
    slug: "logitech-g923-racing-wheel",
    name: "Руль Logitech G923",
    category: "igrovye-aksessuary",
    brand: "Logitech G",
    description: "Игровой руль Logitech G923 для автосимуляторов. Коробка передач Driving Force приобретается отдельно.",
    highlights: ["Система обратной связи TRUEFORCE", "Педали в комплекте", "Совместим с коробкой передач Driving Force"],
    specs: {
      "Тип": "Руль и педали для автосимуляторов",
      "Совместимость": "Версию и совместимую платформу конкретной поставки уточняйте перед покупкой",
      "Дополнение": "Поддерживает Logitech Driving Force Shifter",
      "Комплектация": "Руль, педали, кабели; детали зависят от версии",
    },
    photo: GAMING_LIFESTYLE_ASSETS.g923,
    variants: [v("Руль Logitech G923", 28800, "G923", "Black", "PlayStation / PC")],
  }),
  product({
    slug: "logitech-g29-racing-wheel",
    name: "Руль Logitech G29",
    category: "igrovye-aksessuary",
    brand: "Logitech G",
    description: "Игровой руль Logitech G29 с педалями для автосимуляторов. Для более реалистичного управления можно добавить коробку передач Driving Force.",
    highlights: ["Руль и педали для гоночных игр", "Поворот до 900°", "Совместим с коробкой передач Driving Force"],
    specs: {
      "Тип": "Руль и педали для автосимуляторов",
      "Совместимость": "PlayStation и PC для версии G29",
      "Дополнение": "Поддерживает Logitech Driving Force Shifter",
      "Комплектация": "Руль, педали, кабели; детали уточняйте у менеджера",
    },
    photo: GAMING_LIFESTYLE_ASSETS.g29,
    variants: [v("Руль Logitech G29", 24500, "G29", "Black", "PlayStation / PC")],
  }),
  product({
    slug: "logitech-driving-force-shifter",
    name: "Коробка передач Logitech Driving Force",
    category: "igrovye-aksessuary",
    brand: "Logitech G",
    description: "Шестиступенчатая коробка передач Logitech Driving Force для совместимых рулей G923, G29 и G920.",
    highlights: ["Шестиступенчатая H-образная схема", "Кожаная ручка и чехол", "Крепление к столу или гоночному кокпиту"],
    specs: {
      "Тип": "Коробка передач для гоночного руля",
      "Совместимость": "Logitech G923, G29 и G920 с соответствующей платформой",
      "Передачи": "6 вперёд + задняя с нажатием вниз",
      "Крепление": "Встроенные зажимы для стола или кокпита",
    },
    photo: GAMING_LIFESTYLE_ASSETS.shifter,
    variants: [v("Коробка передач", 6500, null, "Black", "G923 / G29 / G920")],
  }),
  product({
    slug: "dualsense-ps5",
    name: "DualSense для PS5",
    category: "igrovye-aksessuary",
    brand: "Sony PlayStation",
    description: "Оригинальный беспроводной контроллер DualSense для PlayStation 5. Выберите цвет корпуса.",
    highlights: ["Тактильная отдача и адаптивные триггеры в поддерживаемых играх", "Встроенный микрофон и разъём 3,5 мм", "Работает с PS5, совместимыми PC, Mac и мобильными устройствами"],
    specs: {
      "Тип": "Беспроводной контроллер DualSense",
      "Совместимость": DUALSENSE_COMPATIBILITY,
      "Подключение": "Bluetooth и USB‑C",
      "Особенности": "Адаптивные триггеры и тактильная отдача поддерживаются в совместимых играх",
    },
    photo: GAMING_LIFESTYLE_ASSETS.dualsense,
    variants: [
      v("DualSense PS5 White", 5700, null, "White", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Black", 5700, null, "Black", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Chroma Indigo", 5900, null, "Chroma Indigo", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Volcanic Red", 5700, null, "Volcanic Red", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Cobalt Blue", 5700, null, "Cobalt Blue", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Blue", 5700, null, "Blue", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Red", 5700, null, "Red", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Purple", 5700, null, "Purple", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Camo", 5700, null, "Camo", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Pink", 6300, null, "Pink", DUALSENSE_COMPATIBILITY),
      v("DualSense PS5 Sterling Silver", 5700, null, "Sterling Silver", DUALSENSE_COMPATIBILITY),
    ],
  }),
  product({
    slug: "victrix-pro-bfg",
    name: "Victrix Pro BFG",
    category: "igrovye-aksessuary",
    brand: "Victrix",
    description: "Модульный контроллер Victrix Pro BFG для соревновательной игры. Выберите цвет корпуса.",
    highlights: ["Модульная компоновка органов управления", "Проводной и беспроводной режимы", "Выбор цвета White или Black"],
    specs: {
      "Тип": "Профессиональный модульный контроллер",
      "Совместимость": "Платформу конкретной ревизии уточняйте у менеджера",
      "Подключение": "Проводное / беспроводное в зависимости от ревизии",
      "Комплектация": "Контроллер и аксессуары поставки; набор может отличаться",
    },
    photo: GAMING_LIFESTYLE_ASSETS.victrix,
    variants: [
      v("Victrix Pro White", 12500, null, "White", "PS5 / PC"),
      v("Victrix Pro Black", 12500, null, "Black", "PS5 / PC"),
    ],
  }),
  product({
    slug: "dualsense-limited-editions",
    name: "DualSense — лимитированные издания",
    category: "igrovye-aksessuary",
    brand: "Sony PlayStation",
    description: "Лимитированные и тематические исполнения оригинального контроллера DualSense для PS5. Выберите нужное издание.",
    highlights: ["Оригинальный формат DualSense", "Тематические и лимитированные исполнения", "Совместим с PS5 и совместимыми PC, Mac, Mobile"],
    specs: {
      "Тип": "Беспроводной контроллер DualSense",
      "Совместимость": DUALSENSE_COMPATIBILITY,
      "Подключение": "Bluetooth и USB‑C",
      "Важно": "Доступность конкретного лимитированного издания уточняйте до оформления",
    },
    photo: GAMING_LIFESTYLE_ASSETS.dualsenseEditions,
    variants: [
      v("Dualsense Marathon", 8500, "Marathon", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Icon Blue Edition", 9100, "Icon Blue", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Remix Green", 6700, "Remix Green", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Techno Red", 6700, "Techno Red", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Rhythm Blue", 6700, "Rhythm Blue", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense 30th Limited", 10600, "30th Anniversary", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Genshin Impact", 10300, "Genshin Impact", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Fortnite", 7800, "Fortnite", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("DualSense God of War 20th Anniversary", 9500, "God of War 20th Anniversary", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("DualSense Ghost of Yotei Black", 9100, "Ghost of Yotei", "Black", DUALSENSE_COMPATIBILITY),
      v("DualSense Last of Us Edition", 10700, "The Last of Us", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense James Bond 007", 10200, "James Bond 007", "Limited Edition", DUALSENSE_COMPATIBILITY),
      v("Dualsense Monster Hunter", 9200, "Monster Hunter", "Limited Edition", DUALSENSE_COMPATIBILITY),
    ],
  }),
  product({
    slug: "dualsense-edge",
    name: "DualSense Edge",
    category: "igrovye-aksessuary",
    brand: "Sony PlayStation",
    description: "Профессиональный настраиваемый контроллер DualSense Edge для PlayStation 5.",
    highlights: ["Настраиваемые профили и переназначение кнопок", "Сменные колпачки стиков и задние кнопки", "Кейс и кабель в комплекте поставки"],
    specs: {
      "Тип": "Профессиональный контроллер DualSense Edge",
      "Совместимость": "PlayStation 5; поддержка PC зависит от игры и системного ПО",
      "Особенности": "Настройка управления, сменные колпачки стиков и задние кнопки",
      "Подключение": "USB‑C и беспроводное подключение к PS5",
    },
    photo: GAMING_LIFESTYLE_ASSETS.dualsenseEdge,
    variants: [
      v("Dualsense Edge white", 16400, null, "White", PS5_COMPATIBILITY),
      v("Dualsense Edge black", 16400, null, "Black", PS5_COMPATIBILITY),
    ],
  }),
  product({
    slug: "ps5-vertical-stand",
    name: "Вертикальная подставка для PS5",
    category: "igrovye-aksessuary",
    brand: "Sony PlayStation",
    description: "Оригинальная вертикальная подставка для совместимых консолей PS5.",
    highlights: ["Оригинальный аксессуар", "Устойчивая вертикальная установка", "Проверьте совместимость с ревизией консоли"],
    specs: {
      "Тип": "Вертикальная подставка",
      "Совместимость": "Для совместимых моделей PS5; уточняйте ревизию консоли перед покупкой",
      "Комплектация": "Подставка и крепёж согласно поставке",
    },
    photo: GAMING_LIFESTYLE_ASSETS.ps5Stand,
    variants: [v("Вертикальная подставка для PS5 (Оригинал)", 2800, null, "Black", PS5_COMPATIBILITY)],
  }),
  product({
    slug: "dualsense-charging-station",
    name: "Зарядная станция для DualSense",
    category: "igrovye-aksessuary",
    brand: "Sony PlayStation",
    description: "Оригинальная зарядная станция для двух контроллеров DualSense. Цена зависит от количества в заказе.",
    highlights: ["Одновременная зарядка двух DualSense", "Контроллеры подключаются защёлкиванием", "Оригинальный аксессуар PlayStation"],
    specs: {
      "Тип": "Зарядная станция для контроллеров",
      "Совместимость": "DualSense для PlayStation 5",
      "Ёмкость": "До двух контроллеров одновременно",
      "Цена": "Указана для выбранной минимальной партии",
    },
    photo: GAMING_LIFESTYLE_ASSETS.dualsenseCharge,
    variants: [
      v("Зарядная станция (Оригинал) — 1 шт", 3000, "1 шт", "White", "Для DualSense"),
      v("Зарядная станция (Оригинал) — от 10 шт", 2950, "от 10 шт", "White", "Для DualSense"),
      v("Зарядная станция (Оригинал) — от 20 шт", 2900, "от 20 шт", "White", "Для DualSense"),
      v("Зарядная станция (Оригинал) — от 100 шт", 2750, "от 100 шт", "White", "Для DualSense"),
    ],
  }),
  product({
    slug: "ps5-disc-drive",
    name: "Дисковод для PS5",
    category: "igrovye-aksessuary",
    brand: "Sony PlayStation",
    description: "Съёмный дисковод для совместимых цифровых версий PS5 Slim и PS5 Pro. Перед покупкой сверяйте ревизию консоли.",
    highlights: ["Оригинальный дисковод PlayStation", "Для совместимых цифровых версий PS5", "Есть новый и уценённый вариант"],
    specs: {
      "Тип": "Съёмный дисковод",
      "Совместимость": "Только с совместимыми PS5 Slim Digital и PS5 Pro; уточняйте ревизию",
      "Состояние": "Новый или уценённый вариант",
      "Важно": "Не нужен для PS5 Slim с уже встроенным дисководом",
    },
    photo: GAMING_LIFESTYLE_ASSETS.ps5DiscDrive,
    variants: [
      v("Дисковод для ps5 slim disk/pro", 8500, "Новый", "White", "PS5 Slim Digital / PS5 Pro"),
      v("Дисковод для ps5 slim disk/pro — уценка", 7600, "Уценка", "White", "PS5 Slim Digital / PS5 Pro"),
    ],
  }),
  product({
    slug: "sony-pulse-elite",
    name: "Sony PULSE Elite",
    category: "naushniki",
    brand: "Sony PlayStation",
    description: "Беспроводная игровая гарнитура PULSE Elite для PS5 и PlayStation Portal с PlayStation Link.",
    highlights: ["Беспроводной звук PlayStation Link", "Выдвижной микрофон с шумоподавлением", "Поддержка PS5, PS Portal, PC и Mac через совместимое подключение"],
    specs: {
      "Тип": "Беспроводная игровая гарнитура",
      "Подключение": "PlayStation Link через USB-адаптер; поддерживаемые Bluetooth-сценарии зависят от устройства",
      "Совместимость": "PS5, PlayStation Portal, PC и Mac с совместимым адаптером / подключением",
      "Особенности": "Выдвижной микрофон и зарядный кронштейн в комплекте поставки",
    },
    photo: GAMING_LIFESTYLE_ASSETS.pulseElite,
    variants: [
      v("Sony Pulse Elite White", 12000, null, "White", "PS5 / PS Portal / PC / Mac"),
      v("Sony Pulse Elite Black", 12500, null, "Black", "PS5 / PS Portal / PC / Mac"),
    ],
  }),
  product({
    slug: "sony-pulse-3d",
    name: "Sony PULSE 3D",
    category: "naushniki",
    brand: "Sony PlayStation",
    description: "Беспроводная гарнитура PULSE 3D для игрового звука на PlayStation 5.",
    highlights: ["Игровая гарнитура для PS5", "Встроенные микрофоны", "Выберите чёрное или камуфляжное исполнение"],
    specs: {
      "Тип": "Беспроводная игровая гарнитура",
      "Совместимость": "PlayStation 5 и совместимые устройства через комплектный адаптер",
      "Подключение": "Беспроводной USB-адаптер; проводной разъём 3,5 мм в зависимости от сценария",
      "Комплектация": "Гарнитура и адаптер согласно поставке",
    },
    photo: GAMING_LIFESTYLE_ASSETS.pulse3d,
    variants: [
      v("Sony Pulse 3D Black", 9500, null, "Black", PS5_COMPATIBILITY),
      v("Sony Pulse 3D Camo", 9500, null, "Camo", PS5_COMPATIBILITY),
    ],
  }),
  product({
    slug: "nintendo-switch-2",
    name: "Nintendo Switch 2",
    category: "igrovye-pristavki",
    brand: "Nintendo",
    description: "Гибридная игровая консоль Nintendo Switch 2. Выберите комплектацию с игрой или без неё.",
    highlights: ["Портативный и домашний режимы", "Отсоединяемые контроллеры", "Комплектацию с игрой уточняйте до оформления"],
    specs: {
      "Тип": "Гибридная игровая консоль",
      "Режимы": "Портативный, настольный и ТВ-режим",
      "Комплект": "С игрой или без игры — зависит от выбранного варианта",
      "Совместимость": "Совместимые игры и аксессуары Nintendo Switch 2",
    },
    photo: GAMING_LIFESTYLE_ASSETS.switch2,
    variants: [
      v("NSW 2 с игрой", 48000, "С игрой", "Black", "Nintendo Switch 2"),
      v("NSW 2 (без игры)", 45500, "Без игры", "Black", "Nintendo Switch 2"),
    ],
  }),
  product({
    slug: "nintendo-switch-oled",
    name: "Nintendo Switch OLED",
    category: "igrovye-pristavki",
    brand: "Nintendo",
    description: "Nintendo Switch OLED с ярким OLED-экраном, док-станцией и гибридным форматом игры.",
    highlights: ["7-дюймовый OLED-экран", "Портативный, настольный и ТВ-режим", "64 ГБ встроенной памяти"],
    specs: {
      "Тип": "Гибридная игровая консоль",
      "Экран": "7″ OLED",
      "Память": "64 ГБ встроенной памяти; поддержка microSD",
      "Комплектация": "Консоль, Joy-Con, док-станция и аксессуары согласно поставке",
    },
    photo: GAMING_LIFESTYLE_ASSETS.switchOled,
    variants: [
      v("NSW OLED White", 27500, "OLED", "White", "Nintendo Switch"),
      v("NSW OLED Neon", 27500, "OLED", "Neon", "Nintendo Switch"),
    ],
  }),
  product({
    slug: "nintendo-switch-lite",
    name: "Nintendo Switch Lite",
    category: "portativnye-konsoli",
    brand: "Nintendo",
    description: "Компактная портативная Nintendo Switch Lite для игр в ручном режиме.",
    highlights: ["Лёгкий портативный формат", "Встроенные органы управления", "Совместимые игры Nintendo Switch с поддержкой портативного режима"],
    specs: {
      "Тип": "Портативная игровая консоль",
      "Экран": "5,5″ LCD",
      "Режим": "Только портативный",
      "Совместимость": "Игры Nintendo Switch с поддержкой портативного режима",
    },
    photo: GAMING_LIFESTYLE_ASSETS.switchLite,
    variants: [
      v("Switch Lite Gray", 17000, "Lite", "Gray", "Портативный режим"),
      v("Switch Lite Turquise", 17000, "Lite", "Turquoise", "Портативный режим"),
      v("Switch Lite Coral", 17000, "Lite", "Coral", "Портативный режим"),
    ],
  }),
  product({
    slug: "meta-quest-3s",
    name: "Meta Quest 3S",
    category: "vr-garnitury",
    brand: "Meta",
    description: "Автономная смешанная реальность Meta Quest 3S. Выберите объём памяти для игр и приложений.",
    highlights: ["Автономная VR/MR-гарнитура", "Цветная смешанная реальность", "В комплекте два контроллера Touch Plus"],
    specs: {
      "Тип": "Автономная VR/MR-гарнитура",
      "Память": "128 или 256 ГБ",
      "Контроллеры": "Два Meta Quest Touch Plus",
      "Подключение": "Wi‑Fi и Bluetooth; для некоторых сценариев может требоваться учётная запись Meta",
    },
    photo: GAMING_LIFESTYLE_ASSETS.quest3s,
    variants: [
      v("Meta quest 3S 128GB", 34000, "128GB", "White", "Автономная VR/MR"),
      v("Meta quest 3S 256GB", 37000, "256GB", "White", "Автономная VR/MR"),
    ],
  }),
  product({
    slug: "meta-quest-3",
    name: "Meta Quest 3",
    category: "vr-garnitury",
    brand: "Meta",
    description: "Автономная VR/MR-гарнитура Meta Quest 3 с объёмом памяти 512 ГБ.",
    highlights: ["Автономная VR/MR-гарнитура", "Цветная смешанная реальность", "512 ГБ памяти для приложений и игр"],
    specs: {
      "Тип": "Автономная VR/MR-гарнитура",
      "Память": "512 ГБ",
      "Контроллеры": "Два Meta Quest Touch Plus",
      "Подключение": "Wi‑Fi и Bluetooth; для некоторых сценариев может требоваться учётная запись Meta",
    },
    photo: GAMING_LIFESTYLE_ASSETS.quest3,
    variants: [v("Meta quest 3 512GB", 49000, "512GB", "White", "Автономная VR/MR")],
  }),
  product({
    slug: "xbox-series-x",
    name: "Xbox Series X",
    category: "igrovye-pristavki",
    brand: "Xbox",
    description: "Игровая консоль Xbox Series X. Выберите версию с дисководом или цифровую версию.",
    highlights: ["1 ТБ SSD", "До 4K в совместимых играх", "Совместимость с экосистемой Xbox"],
    specs: {
      "Платформа": "Xbox Series X",
      "Память": "1 ТБ SSD",
      "Видео": "До 4K в совместимых играх",
      "Версия": "Дисковая Black или цифровая White — по выбранному варианту",
    },
    photo: GAMING_LIFESTYLE_ASSETS.xboxSeriesX,
    variants: [
      v("Xbox X 1TB Disk (Black)", 68000, "1TB", "Black", "С дисководом"),
      v("Xbox X 1TB Digital (White)", 63000, "1TB", "White", "Цифровая версия"),
    ],
  }),
  product({
    slug: "lenovo-legion-go-s-steamos",
    name: "Lenovo Legion Go S SteamOS",
    category: "portativnye-konsoli",
    brand: "Lenovo",
    description: "Портативная игровая консоль Lenovo Legion Go S на SteamOS в конфигурации 32 ГБ RAM и 1 ТБ SSD.",
    highlights: ["SteamOS", "32 ГБ оперативной памяти и 1 ТБ SSD", "Портативный формат для библиотеки Steam"],
    specs: {
      "ОС": "SteamOS",
      "Оперативная память": "32 ГБ",
      "Накопитель": "1 ТБ SSD",
      "Форм-фактор": "Портативная игровая консоль",
    },
    photo: GAMING_LIFESTYLE_ASSETS.legionGoS,
    variants: [v("Lenovo Legion Go S 32/1TB Steam OS Edition", 88000, "32GB / 1TB", "White", "SteamOS")],
  }),
  product({
    slug: "rog-xbox-ally",
    name: "ASUS ROG Xbox Ally",
    category: "portativnye-konsoli",
    brand: "ASUS ROG",
    description: "Портативная игровая система ROG Xbox Ally. Выберите конфигурацию памяти и цвет корпуса.",
    highlights: ["Портативная игровая система Xbox / Windows", "Варианты 512 ГБ и 1 ТБ", "Компактный формат с игровыми органами управления"],
    specs: {
      "Тип": "Портативная игровая система",
      "ОС": "Windows; игровой интерфейс Xbox зависит от версии и обновлений",
      "Накопитель": "512 ГБ или 1 ТБ по выбранной конфигурации",
      "Комплектация": "Уточняйте ревизию и комплект поставки у менеджера",
    },
    photo: GAMING_LIFESTYLE_ASSETS.rogAlly,
    variants: [
      v("ASUS ROG ALLY XBOX 1TB BLACK", 97500, "1TB", "Black", "Xbox / Windows"),
      v("ASUS ROG ALLY XBOX 512GB WHITE", 51500, "512GB", "White", "Xbox / Windows"),
    ],
  }),
  product({
    slug: "valve-steam-machine",
    name: "Valve Steam Machine",
    category: "igrovye-pristavki",
    brand: "Valve",
    description: "Стационарная игровая система Valve Steam Machine с SSD 512 ГБ. Выберите комплект с контроллером или без него.",
    highlights: ["Стационарная игровая система", "512 ГБ в указанной конфигурации", "Вариант с Steam Controller или без него"],
    specs: {
      "Тип": "Стационарная игровая система",
      "Накопитель": "512 ГБ",
      "Комплект": "С Steam Controller или без контроллера",
      "Важно": "Характеристики конкретной ревизии и срок поставки уточняйте перед заказом",
    },
    photo: GAMING_LIFESTYLE_ASSETS.steamMachine,
    variants: [
      v("Valve Steam Machine 512GB + Steam Controller", 138000, "512GB", "Black", "С Steam Controller"),
      v("Valve Steam Machine 512GB", 125000, "512GB", "Black", "Без контроллера"),
    ],
  }),
  product({
    slug: "steam-deck-oled",
    name: "Steam Deck OLED",
    category: "portativnye-konsoli",
    brand: "Valve",
    description: "Портативная игровая система Steam Deck OLED. Выберите объём SSD 512 ГБ или 1 ТБ.",
    highlights: ["OLED-дисплей", "SteamOS и библиотека Steam", "512 ГБ или 1 ТБ SSD"],
    specs: {
      "Тип": "Портативная игровая система",
      "Экран": "OLED",
      "ОС": "SteamOS",
      "Накопитель": "512 ГБ или 1 ТБ по выбранной конфигурации",
    },
    photo: GAMING_LIFESTYLE_ASSETS.steamDeck,
    variants: [
      v("Steam Deck 512 OLED", 75000, "512GB", "Black", "SteamOS"),
      v("Steam Deck 1TB OLED", 95000, "1TB", "Black", "SteamOS"),
    ],
  }),
  product({
    slug: "steam-deck-docking-station",
    name: "Док-станция для Steam Deck",
    category: "igrovye-aksessuary",
    brand: "Valve",
    description: "Док-станция для подключения Steam Deck к внешнему дисплею, сети и периферии.",
    highlights: ["Подключение внешнего дисплея", "Проводная сеть и USB-периферия", "Аксессуар для Steam Deck"],
    specs: {
      "Тип": "Док-станция",
      "Совместимость": "Steam Deck",
      "Назначение": "Экран, сеть и периферийные устройства",
      "Комплектация": "Уточняйте кабели и блок питания для конкретной поставки",
    },
    photo: GAMING_LIFESTYLE_ASSETS.steamDock,
    variants: [v("Док станция для Steam Deck", 9500, null, "Black", "Steam Deck")],
  }),
  product({
    slug: "google-fitbit-air",
    name: "Google Fitbit Air",
    category: "fitnes-braslety",
    brand: "Google Fitbit",
    description: "Лёгкий фитнес-браслет Google Fitbit Air для ежедневного отслеживания активности и сна. Выберите цвет или специальное издание.",
    highlights: ["Тонкий фитнес-браслет", "Отслеживание активности и сна", "До 7 дней работы по данным производителя"],
    specs: {
      "Тип": "Фитнес-браслет",
      "Автономность": "До 7 дней — зависит от сценария использования",
      "Функции": "Активность, сон и показатели здоровья в приложении Fitbit",
      "Комплект": "Браслет и зарядное устройство; наполнение комплекта уточняйте у менеджера",
    },
    photo: GAMING_LIFESTYLE_ASSETS.fitbitAir,
    variants: [
      v("Google Fitbit Air Lavanda", 11500, null, "Lavender", "Стандартная версия"),
      v("Google Fitbit Air Berry", 10500, null, "Berry", "Стандартная версия"),
      v("Google Fitbit Air Obsidian", 10500, null, "Obsidian", "Стандартная версия"),
      v("Google Fitbit Air Fog", 14500, null, "Fog", "Стандартная версия"),
      v("Google Fitbit Stephen Curry", 16000, "Stephen Curry Edition", "Blue", "Лимитированное издание"),
    ],
  }),
  product({
    slug: "whoop",
    name: "WHOOP",
    category: "fitnes-braslety",
    brand: "WHOOP",
    description: "Фитнес-браслет WHOOP с выбранным уровнем членства. Функции и комплектность зависят от тарифа One, Peak или Life.",
    highlights: ["Круглосуточное отслеживание восстановления, нагрузки и сна", "Без дисплея: данные в приложении WHOOP", "Уровни One, Peak и Life"],
    specs: {
      "Тип": "Фитнес-браслет с членством WHOOP",
      "Тарифы": "One, Peak или Life — по выбранному варианту",
      "Данные": "Сон, восстановление, нагрузка и показатели здоровья в приложении",
      "Важно": "Условия членства, региональная доступность функций и комплектацию подтверждает менеджер",
    },
    photo: GAMING_LIFESTYLE_ASSETS.whoop,
    variants: [
      v("WHOOP Life", 30000, "Life", "Black", "Членство WHOOP"),
      v("WHOOP Peak", 20500, "Peak", "Black", "Членство WHOOP"),
      v("WHOOP One", 15500, "One", "Black", "Членство WHOOP"),
    ],
  }),
  product({
    slug: "marshall-kilburn-iii",
    name: "Marshall Kilburn III",
    category: "portativnaya-akustika",
    brand: "Marshall",
    description: "Портативная акустика Marshall Kilburn III в чёрном исполнении.",
    highlights: ["Портативный формат", "Фирменный звук Marshall", "Выразительный дизайн в чёрном цвете"],
    specs: { "Тип": "Портативная Bluetooth-акустика", "Цвет": "Black", "Подключение": "Bluetooth", "Комплектация": "Уточняйте комплектацию поставки" },
    photo: GAMING_LIFESTYLE_ASSETS.kilburn,
    variants: [v("Marshall Kilburn III Black", 34500, null, "Black", "Bluetooth")],
  }),
  product({
    slug: "marshall-emberton-iii",
    name: "Marshall Emberton III",
    category: "portativnaya-akustika",
    brand: "Marshall",
    description: "Компактная портативная акустика Marshall Emberton III. Выберите цвет корпуса.",
    highlights: ["Компактный портативный формат", "Bluetooth-подключение", "Выбор четырёх цветовых исполнений"],
    specs: { "Тип": "Портативная Bluetooth-акустика", "Подключение": "Bluetooth", "Исполнение": "Black, Cream, Blue или Sage", "Комплектация": "Уточняйте комплектацию поставки" },
    photo: GAMING_LIFESTYLE_ASSETS.emberton,
    variants: [
      v("Marshall Emberton III Black", 10500, null, "Black", "Bluetooth"),
      v("Marshall Emberton III Cream", 10500, null, "Cream", "Bluetooth"),
      v("Marshall Emberton III Blue", 13500, null, "Blue", "Bluetooth"),
      v("Marshall Emberton III Sage", 14000, null, "Sage", "Bluetooth"),
    ],
  }),
  product({
    slug: "marshall-middleton",
    name: "Marshall Middleton",
    category: "portativnaya-akustika",
    brand: "Marshall",
    description: "Портативная акустика Marshall Middleton в кремовом исполнении.",
    highlights: ["Портативная акустика", "Bluetooth-подключение", "Кремовое исполнение"],
    specs: { "Тип": "Портативная Bluetooth-акустика", "Цвет": "Cream", "Подключение": "Bluetooth", "Комплектация": "Уточняйте комплектацию поставки" },
    photo: GAMING_LIFESTYLE_ASSETS.middleton,
    variants: [v("Marshall Middleton Cream", 27500, null, "Cream", "Bluetooth")],
  }),
  product({
    slug: "marshall-stanmore-iii",
    name: "Marshall Stanmore III",
    category: "portativnaya-akustika",
    brand: "Marshall",
    description: "Домашняя акустика Marshall Stanmore III. Выберите цвет корпуса.",
    highlights: ["Домашняя акустика Marshall", "Bluetooth-подключение", "Классический дизайн в трёх цветах"],
    specs: { "Тип": "Домашняя Bluetooth-акустика", "Подключение": "Bluetooth", "Исполнение": "Black, Cream или Brown", "Комплектация": "Уточняйте комплектацию поставки" },
    photo: GAMING_LIFESTYLE_ASSETS.stanmore,
    variants: [
      v("Marshall Stanmore III Black", 19000, null, "Black", "Bluetooth"),
      v("Marshall Stanmore III Cream", 19000, null, "Cream", "Bluetooth"),
      v("Marshall Stanmore III Brown", 19000, null, "Brown", "Bluetooth"),
    ],
  }),
  product({
    slug: "marshall-woburn-iii",
    name: "Marshall Woburn III",
    category: "portativnaya-akustika",
    brand: "Marshall",
    description: "Крупная домашняя акустика Marshall Woburn III. Выберите цвет корпуса.",
    highlights: ["Крупный формат для дома", "Bluetooth-подключение", "Black, Cream или Brown"],
    specs: { "Тип": "Домашняя Bluetooth-акустика", "Подключение": "Bluetooth", "Исполнение": "Black, Cream или Brown", "Комплектация": "Уточняйте комплектацию поставки" },
    photo: GAMING_LIFESTYLE_ASSETS.woburn,
    variants: [
      v("Marshall Woburn III Black", 29000, null, "Black", "Bluetooth"),
      v("Marshall Woburn III Cream", 29000, null, "Cream", "Bluetooth"),
      v("Marshall Woburn III Brown", 29000, null, "Brown", "Bluetooth"),
    ],
  }),
  product({
    slug: "marshall-major-v",
    name: "Marshall Major V",
    category: "naushniki",
    brand: "Marshall",
    description: "Накладные беспроводные наушники Marshall Major V в цвете Pitch Black.",
    highlights: ["Беспроводные накладные наушники", "Bluetooth-подключение", "Складная конструкция"],
    specs: {
      "Тип": "Накладные беспроводные наушники",
      "Подключение": "Bluetooth",
      "Цвет": "Pitch Black",
      "Автономность": "До 100 часов по данным производителя; зависит от сценария использования",
    },
    photo: GAMING_LIFESTYLE_ASSETS.major,
    variants: [v("Marshall Major V Pitch Black", 5500, null, "Pitch Black", "Bluetooth")],
  }),
];

export const GAMING_LIFESTYLE_PRODUCT_SLUGS = GAMING_LIFESTYLE_CATALOG.map((item) => item.slug);

export type ExistingGamingLifestyleVariant = {
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

// При повторном запуске скрипт сначала сохраняет id варианта с такой же
// исходной строкой из прайса, потом пытается сопоставить комбинацию осей.
// Остаток не удаляется, а уезжает в скрытый архив — избранное и заказы не
// потеряют ссылку на старую позицию.
export function planGamingLifestyleVariants<T extends ExistingGamingLifestyleVariant>(
  existing: T[],
  desired: GamingLifestyleVariant[],
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
