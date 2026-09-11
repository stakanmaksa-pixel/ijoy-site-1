import sources from "./apple-watch-photo-sources.json";
import { variantImageKey } from "../../src/lib/pickCoverImage";

export const ULTRA4_SOURCES = [
  "https://www.apple.com/newsroom/2026/09/apple-unveils-apple-watch-ultra-4/",
  "https://www.apple.com/apple-watch-ultra-4/specs/",
];

export const APPLE_WATCH_ULTRA4 = {
  slug: "apple-watch-ultra-4",
  name: "Apple Watch Ultra 4",
  brand: "Apple",
  description: "Apple Watch Ultra 4 — часы в титановом корпусе 49 мм с чипом S11 и новой системой датчиков Health Sensing System. Представлены 9 сентября 2026 года; объявленное Apple начало продаж — 18 сентября. Выберите чёрный или натуральный титан с ремешком Ocean Band. Цену и доступность в нашем магазине уточняйте у менеджера.",
  highlights: ["Always-On Retina OLED до 3000 нит", "До 50 часов работы; до 84 часов в энергосберегающем режиме", "Двухчастотный GPS и настраиваемая кнопка действия"],
  specs: {
    "Корпус": "Титан Grade 5; 49 × 44 × 12 мм",
    "Вес без ремешка": "63 г (натуральный титан); 63,1 г (чёрный титан)",
    "Дисплей": "LTPO3 OLED, 422 × 514 пикселей, сапфировое стекло",
    "Процессор": "Apple S11",
    "Накопитель": "64 ГБ",
    "Связь": "5G RedCap/LTE, Wi-Fi 2,4/5 ГГц, Bluetooth 5.3, UWB",
    "Датчики": "Пульс, ЭКГ, кислород крови, температура, глубина, высотомер, компас",
    "Защита": "WR100, IP6X; любительский дайвинг до 40 м по инструкции Apple",
    "Зарядка": "До 80% примерно за 45 минут",
    "Система": "watchOS 27",
    "Совместимость": "iPhone 11 или новее, включая iPhone SE 2 и новее, с iOS 27 или новее",
    "Комплектация": "Часы, Ocean Band выбранного цвета, магнитный кабель USB-C 1 м",
    "Важно": "Функции здоровья, спутниковая связь и eSIM зависят от страны и оператора. Время работы зависит от использования.",
  },
};

export const ULTRA4_VARIANTS = sources.entries.filter(p => p.slug === APPLE_WATCH_ULTRA4.slug).map(p => ({
  memory: "49 мм", color: p.color, region: p.band!,
  price: null, inStock: false,
  image: `/catalog/product-photos/${p.file}`,
}));

type ExistingVariant = { memory: string | null; color: string | null; region: string | null };
type ExistingProduct = { images: string[]; colorImages: unknown; variants: ExistingVariant[] };
const key = (v: ExistingVariant) => [v.memory, v.color, v.region].map(s => (s ?? "").toLowerCase().replace(/\s+/g, "").replace("mm", "мм")).join("::");

/** Add only missing offers and photos. Never changes prices, stock, IDs or visibility. */
export function planUltra4Addition(existing?: ExistingProduct | null) {
  const colorImages: Record<string, string[]> = {};
  if (existing?.colorImages && typeof existing.colorImages === "object" && !Array.isArray(existing.colorImages)) {
    for (const [color, images] of Object.entries(existing.colorImages)) {
      if (Array.isArray(images) && images.every(image => typeof image === "string")) colorImages[color] = [...images];
    }
  }
  const variantsToCreate = ULTRA4_VARIANTS.filter(v => !existing?.variants.some(old => key(old) === key(v)))
    .map(({ image: _image, ...offer }) => offer);
  for (const v of ULTRA4_VARIANTS) {
    const old = existing?.variants.find(old => key(old) === key(v));
    for (const photoKey of [v.color, variantImageKey(old ?? v)]) {
      if (!colorImages[photoKey]?.length) colorImages[photoKey] = [v.image];
    }
  }
  return {
    images: existing?.images.length ? [...existing.images] : [ULTRA4_VARIANTS[0].image],
    colorImages,
    variantsToCreate,
  };
}
