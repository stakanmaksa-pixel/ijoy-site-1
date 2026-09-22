import { variantImageKey } from "../../src/lib/pickCoverImage";

export const ULTRA4_SOURCES = [
  "https://www.apple.com/newsroom/2026/09/apple-unveils-apple-watch-ultra-4/",
  "https://www.apple.com/shop/buy-watch/apple-watch-ultra",
];

export const APPLE_WATCH_ULTRA4 = {
  slug: "apple-watch-ultra-4",
  name: "Apple Watch Ultra 4",
  brand: "Apple",
  description: "Apple Watch Ultra 4 — часы в титановом корпусе 49 мм с чипом S11 и системой датчиков Health Sensing System. Доступны корпуса Natural Titanium и Black Titanium с ремешками Ocean Band, Alpine Loop, Trail Loop и Titanium Milanese Loop. Цену и наличие уточняйте у менеджера.",
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
    "Комплектация": "Часы, ремешок выбранной версии, магнитный кабель USB‑C 1 м",
    "Важно": "Функции здоровья, спутниковая связь и eSIM зависят от страны и оператора. Время работы зависит от использования.",
  },
};

const finishes = [
  {
    color: "Natural Titanium",
    variants: [
      ["Milanese Loop", "natural-titanium-milanese-loop", "4f227796e5938e46f16a2802a0a9c190419ca3e9eed2ff627ab2ecac3b275adb"],
      ["Ocean Band (Translucent Gray)", "natural-titanium-ocean-band-translucent-gray", "f140101917c788d4decfaf489a54c95ef4316a24384fc68029dd764471481cba"],
      ["Ocean Band (Translucent Kelp)", "natural-titanium-ocean-band-translucent-kelp", "866d7dde51bc8fe749418c9ae3e9f28ef6469a79335088f43af814a91dac7ddc"],
      ["Ocean Band (Translucent Black)", "natural-titanium-ocean-band-translucent-black", "a0afbd4388531e425e374465782489eeb7e3309feb4d21dbe90bae6e4693a78b"],
      ["Alpine Loop (Desert)", "natural-titanium-alpine-loop-desert", "45b9c71a8c208ce8ef9424654d532cfc375a75a0498c26e23fcaae82919f3298"],
      ["Alpine Loop (Burgundy)", "natural-titanium-alpine-loop-burgundy", "f752397c8839b646e8a433bfdb2394f90e6d200a1a6279fd4a5ee934374ad160"],
      ["Alpine Loop (Dark Olive)", "natural-titanium-alpine-loop-dark-olive", "d50b301beb6c1757e0fa1777c2ea8e516a20983d91cfbd2cc4aa7e03b4160c65"],
      ["Trail Loop (Sand)", "natural-titanium-trail-loop-sand", "4ac3705dc818828928b9145a2cda54f549860821a57690df5b91b7d37c700b55"],
      ["Trail Loop (Burgundy)", "natural-titanium-trail-loop-burgundy", "a5e4a40569639270b668c02c80786f0f6978ff64c2ee1d49b9635d326fc6ef75"],
      ["Trail Loop (Dark Umber)", "natural-titanium-trail-loop-dark-umber", "bf6fd1b6245b188a8758838d927d488fc608b181175bf4457672d476a31171c2"],
    ],
  },
  {
    color: "Black Titanium",
    variants: [
      ["Milanese Loop", "black-titanium-milanese-loop", "0a327fbc4cb00593b18cc9e72b245c66eadce354144c761711a39a785fe98922"],
      ["Ocean Band (Translucent Gray)", "black-titanium-ocean-band-translucent-gray", "aed39cdfdce008cecc6767691d454760999a6df9c34b479632ed70e493075b54"],
      ["Ocean Band (Translucent Kelp)", "black-titanium-ocean-band-translucent-kelp", "09cdccdf97aed6f43c1a92b573df56bb0937e3cf154b2c74ec4d21fb1779389c"],
      ["Ocean Band (Translucent Black)", "black-titanium-ocean-band-translucent-black", "85cb016693bab1ff0eb0db5602146ce14256f8b490ba4dd29e9d4851b4a9e9c4"],
      ["Alpine Loop (Desert)", "black-titanium-alpine-loop-desert", "5ba9c5342e99a6f90f1a39730ff9aa6ebc9ce533a23ad7e2ba0401ec7588d7fe"],
      ["Alpine Loop (Burgundy)", "black-titanium-alpine-loop-burgundy", "8c2d0a2213be43da7d21f6d7e0d8fc410acb1d8233ad58b1bfe2a9eb6cb977ee"],
      ["Alpine Loop (Dark Olive)", "black-titanium-alpine-loop-dark-olive", "9b23fdccba0ba31d2141cd37b84e9d5471a65809c45189a122bb054b4d18ed32"],
      ["Trail Loop (Sand)", "black-titanium-trail-loop-sand", "70746afc66bddd54d1f87d27fe7905840ffb568ce555f191ff42bbf5a8855e6e"],
      ["Trail Loop (Burgundy)", "black-titanium-trail-loop-burgundy", "1c24df733a84d461cf2aaf6e220b230562dd28b27d962a6ef6e3e3f4c943b47e"],
      ["Trail Loop (Dark Umber)", "black-titanium-trail-loop-dark-umber", "f167c35f458dde99bbd1601d44b1c2dc7a3e48292e5387f4a0e2c9e6332f5a89"],
    ],
  },
] as const;

export const ULTRA4_PHOTO_ENTRIES = finishes.flatMap(({ color, variants }) => variants.map(([band, stem, sha256]) => ({
  slug: "apple-watch-ultra-4",
  color,
  band,
  memory: "49 мм",
  file: `apple-watches/apple-watch-ultra-4-${stem}.jpg`,
  sha256,
})));

export const ULTRA4_GENERAL_PHOTO = "/catalog/product-photos/apple-watches/apple-watch-ultra-4-natural-titanium-ocean-band-translucent-gray.jpg";

export const ULTRA4_VARIANTS = ULTRA4_PHOTO_ENTRIES.map((photo) => ({
  memory: photo.memory,
  color: photo.color,
  region: photo.band,
  price: null,
  inStock: false,
  image: `/catalog/product-photos/${photo.file}`,
}));

type ExistingVariant = { memory: string | null; color: string | null; region: string | null };
type ExistingProduct = { images: string[]; colorImages: unknown; variants: ExistingVariant[] };
const key = (v: ExistingVariant) => [v.memory, v.color, v.region].map(s => (s ?? "").toLowerCase().replace(/\s+/g, "").replace("mm", "мм")).join("::");
const imageKey = (v: ExistingVariant) => variantImageKey(v);
const isManagedUltra4Photo = (url: string) => url.includes("/apple-watch-ultra-4-") || url.endsWith("/apple-watch-ultra-4-all-colors.jpg");

/** Adds missing options and replaces bundled Ultra 4 photos while preserving custom uploads and real offers. */
export function planUltra4Addition(existing?: ExistingProduct | null) {
  const colorImages: Record<string, string[]> = {};
  if (existing?.colorImages && typeof existing.colorImages === "object" && !Array.isArray(existing.colorImages)) {
    for (const [color, images] of Object.entries(existing.colorImages)) {
      if (Array.isArray(images) && images.every(image => typeof image === "string")) {
        const custom = images.filter(image => !isManagedUltra4Photo(image));
        if (custom.length) colorImages[color] = custom;
      }
    }
  }
  const variantsToCreate = ULTRA4_VARIANTS.filter(v => !existing?.variants.some(old => key(old) === key(v)))
    .map(({ image: _image, ...offer }) => offer);
  for (const v of ULTRA4_VARIANTS) {
    const old = existing?.variants.find(old => key(old) === key(v));
    const variantKey = imageKey(old ?? v);
    const exact = existing?.colorImages && typeof existing.colorImages === "object" && !Array.isArray(existing.colorImages)
      ? (existing.colorImages as Record<string, unknown>)[variantKey]
      : null;
    const customExact = Array.isArray(exact) && exact.every(image => typeof image === "string")
      ? exact.filter(image => !isManagedUltra4Photo(image)) as string[]
      : [];
    colorImages[variantKey] = customExact.length ? customExact : [v.image];
    if (!colorImages[v.color]?.length) colorImages[v.color] = [v.image];
  }
  const customGallery = (existing?.images ?? []).filter(image => !isManagedUltra4Photo(image));
  return {
    images: customGallery.length ? customGallery : [ULTRA4_GENERAL_PHOTO],
    colorImages,
    variantsToCreate,
  };
}
