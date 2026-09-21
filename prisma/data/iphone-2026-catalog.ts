// Verified 2026-09-15 against Apple's technical specifications and announcements.
export const IPHONE_2026_SOURCES = [
  "https://www.apple.com/iphone-18-pro/specs/",
  "https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/",
  "https://www.apple.com/iphone-duo/specs/",
  "https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/",
];
const memories = ["256GB", "512GB", "1TB", "2TB"];
const proColors = ["Black", "Silver", "Glacier", "Burgundy"];
const sharedSpecs = {
  "Модельный год": "2026",
  "Память": "256 ГБ, 512 ГБ, 1 ТБ, 2 ТБ",
  "Процессор": "Apple A20 Pro",
  "Яркость": "До 3000 нит на улице",
  "Беспроводная связь": "5G, Wi-Fi 7, Bluetooth 6, NFC",
  "Разъём и передача данных": "USB-C, DisplayPort, USB 3 до 10 Гбит/с",
  "Беспроводная зарядка": "MagSafe и Qi2 — до 25 Вт",
  "SIM": "Dual eSIM в версии для США. Регион поставки и поддержку оператора уточняйте у менеджера",
  "Комплектация": "Смартфон и кабель USB-C; адаптер питания приобретается отдельно",
};
function proModel(max: boolean) {
  const name = max ? "iPhone 18 Pro Max" : "iPhone 18 Pro";
  const screen = max ? "6,9″" : "6,3″";
  return {
    slug: max ? "iphone-18-pro-max" : "iphone-18-pro", name, brand: "Apple", colors: proColors,
    description: `${name} — смартфон Apple с экраном ${screen}, чипом A20 Pro и переменной диафрагмой основной камеры. Выберите память и цвет. Объявленный Apple старт продаж — 18 сентября 2026 года; цену и доступность в нашем магазине уточняйте у менеджера.`,
    highlights: ["OLED с ProMotion до 120 Гц", "Три камеры Fusion по 48 Мп", "Face ID и уменьшенный Dynamic Island"],
    specs: {
      ...sharedSpecs,
      "Цвета": "Чёрный, серебристый, ледниковый, бордовый",
      "Дисплей": `${screen} Super Retina XDR OLED, Always-On, ProMotion до 120 Гц`,
      "Разрешение": max ? "2868 × 1320, 460 ppi" : "2622 × 1206, 460 ppi",
      "Основная камера": "48 Мп основная с переменной диафрагмой + 48 Мп сверхширокоугольная + 48 Мп телефото",
      "Телефото": "4x; 8x оптического качества",
      "Фронтальная камера": "18 Мп Center Stage, автофокус",
      "Видеосъёмка": "4K Dolby Vision, ProRes, ProRes RAW",
      "Автономность": `До ${max ? "45" : "36"} часов видео (версия eSIM); зависит от использования`,
      "Быстрая зарядка": "До 50% примерно за 15 минут: совместимый адаптер от 60 Вт с AVS и кабель USB-C",
      "Корпус": "Алюминий; Ceramic Shield 2 спереди",
      "Размеры": max ? "163,4 × 78 × 8,75 мм" : "150 × 71,9 × 8,75 мм",
      "Вес": max ? "249 г (версия США)" : "211 г (версия США)",
      "Защита": "IP68; до 6 м на 30 минут в лабораторных условиях",
      "Безопасность": "Face ID",
    },
  };
}
export const IPHONE_2026_CATALOG = [
  proModel(true), proModel(false),
  {
    slug: "iphone-duo", name: "iPhone Duo", brand: "Apple", colors: ["Night Sky", "Star White"],
    description: "iPhone Duo — первый складной iPhone: раскрывается как книга, с внутренним экраном 7,6″ и внешним 5,4″. Оснащён A20 Pro и Touch ID в боковой кнопке. Объявленный Apple старт продаж — 23 октября 2026 года. Цену и доступность в нашем магазине уточняйте у менеджера.",
    highlights: ["Два OLED-экрана с ProMotion до 120 Гц", "Титановый корпус со складной конструкцией", "Две камеры Fusion по 48 Мп"],
    specs: {
      ...sharedSpecs,
      "Цвета": "Ночное небо (Night Sky), звёздный белый (Star White)",
      "Дисплей": "Внутренний OLED 7,6″ с нанотекстурой; внешний OLED 5,4″; Always-On и ProMotion до 120 Гц",
      "Разрешение": "Внутренний: 1878 × 2670; внешний: 1398 × 2034",
      "Основная камера": "48 Мп основная + 48 Мп сверхширокоугольная",
      "Телефото": "2x оптического качества; без отдельного телефотомодуля",
      "Фронтальная камера": "Внешняя 12 Мп Center Stage; внутренняя камера FaceTime под дисплеем",
      "Видеосъёмка": "4K Dolby Vision",
      "Автономность": "Видео: до 44 часов на внешнем экране или до 31 часа на внутреннем; зависит от использования",
      "Корпус": "Титан; складывание в формате книги",
      "Размеры": "Раскрыт: 164,6 × 117,8 × 5,2 мм; сложен: 84,1 × 117,8 × 11,3 мм",
      "Вес": "254 г",
      "Безопасность": "Touch ID в боковой кнопке",
      "Совместимость": "Поддержка Apple Pencil USB-C заявлена Apple на более поздний срок 2026 года; стилус приобретается отдельно",
    },
  },
];
export type Iphone2026Product = (typeof IPHONE_2026_CATALOG)[number];
const customerPhotoRoot = "/catalog/product-photos/september-2026";
const proPhotos: Record<string, string> = {
  Black: `${customerPhotoRoot}/iphone-18-pro-black.jpg`,
  Silver: `${customerPhotoRoot}/iphone-18-pro-silver.jpg`,
  Glacier: `${customerPhotoRoot}/iphone-18-pro-glacier.jpg`,
  Burgundy: `${customerPhotoRoot}/iphone-18-pro-burgundy.jpg`,
};
const duoPhotos: Record<string, string> = {
  "Night Sky": `${customerPhotoRoot}/iphone-duo-night-sky.jpg`,
  "Star White": `${customerPhotoRoot}/iphone-duo-star-white.jpg`,
};
export function iphone2026Photo(slug: string, color: string) {
  const image = slug === "iphone-duo" ? duoPhotos[color] : proPhotos[color];
  if (!image) throw new Error(`Нет фотографии ${slug}, ${color}`);
  return image;
}
export function iphone2026GeneralPhoto(slug: string) {
  return slug === "iphone-duo"
    ? `${customerPhotoRoot}/iphone-duo-all-colors.jpg`
    : `${customerPhotoRoot}/iphone-18-pro-all-colors.jpg`;
}
export function iphone2026Variants(product: Iphone2026Product) {
  return memories.flatMap(memory => product.colors.map(color => ({ memory, color, region: null, price: null, inStock: false })));
}
type ExistingVariant = { memory: string | null; color: string | null; region: string | null };
type ExistingProduct = { images: string[]; colorImages: unknown; variants: ExistingVariant[] };
const normalized = (value: string | null) => (value ?? "").toLowerCase().replace(/\s+/g, "").replace(/гб/g, "gb").replace(/тб/g, "tb");
const sameConfiguration = (a: ExistingVariant, b: ExistingVariant) => normalized(a.memory) === normalized(b.memory) && normalized(a.color) === normalized(b.color);
const generatedIphonePhoto = (value: string) =>
  /^\/(?:uploads\/products\/iphone-2026|api\/catalog\/iphone-2026)\//.test(value);
/** Add missing configurations only; supplier prices, regions, stock, IDs and custom photos stay intact. */
export function planIphone2026Addition(product: Iphone2026Product, existing?: ExistingProduct | null) {
  const colorImages: Record<string, string[]> = {};
  if (existing?.colorImages && typeof existing.colorImages === "object" && !Array.isArray(existing.colorImages)) {
    for (const [key, value] of Object.entries(existing.colorImages)) {
      if (!Array.isArray(value) || !value.every(v => typeof v === "string")) throw Error(`Invalid photos for ${product.slug}: ${key}`);
      colorImages[key] = [...value];
    }
  }
  for (const color of product.colors) {
    const existingKey = Object.keys(colorImages).find(key =>
      normalized(key) === normalized(color) && colorImages[key].some(image => !generatedIphonePhoto(image)),
    );
    colorImages[color] = existingKey ? [...colorImages[existingKey]] : [iphone2026Photo(product.slug, color)];
    for (const old of existing?.variants ?? []) {
      if (old.color && normalized(old.color) === normalized(color) && !colorImages[old.color]?.some(image => !generatedIphonePhoto(image))) {
        colorImages[old.color] = [...colorImages[color]];
      }
    }
  }
  const customImages = existing?.images.filter(image => !generatedIphonePhoto(image)) ?? [];
  return {
    images: customImages.length ? customImages : [iphone2026GeneralPhoto(product.slug)],
    colorImages,
    variantsToCreate: iphone2026Variants(product).filter(v => !existing?.variants.some(old => sameConfiguration(old, v))),
  };
}
