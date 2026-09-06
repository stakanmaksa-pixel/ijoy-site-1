import { variantImageKey } from "../../src/lib/pickCoverImage";

// Official specifications and original Apple Store photos; see product-photo-sources.md.
export const MINI_SLUG = "ipad-mini-a17-pro";
export const MINI_NAME = "Apple iPad mini (A17 Pro)";
export const MINI_MEMORIES = ["128GB", "256GB", "512GB"] as const;
export const MINI_COLORS = ["Blue", "Purple", "Starlight", "Space Gray"] as const;
export const MINI_CONNECTIONS = ["Wi‑Fi", "Wi‑Fi + Cellular"] as const;
export const MINI_OPTIONS = MINI_MEMORIES.flatMap(memory => MINI_COLORS.flatMap(color =>
  MINI_CONNECTIONS.map(region => ({ memory, color, region })),
));
export const TV_PHOTO = "/catalog/product-photos/apple-tv-4k/with-remote.jpg";
export function miniPhoto(color: string, cellular = false) {
  return `/catalog/product-photos/${MINI_SLUG}/${cellular ? "cell" : "wifi"}-${color.toLowerCase().replaceAll(" ", "-")}.jpg`;
}
export const MINI_IMAGES = MINI_COLORS.map(color => miniPhoto(color));
export const MINI_COLOR_IMAGES: Record<string, string[]> = Object.fromEntries([
  ...MINI_COLORS.map(color => [color, [miniPhoto(color)]]),
  ...MINI_OPTIONS.map(option => [variantImageKey(option), [miniPhoto(option.color, option.region === MINI_CONNECTIONS[1])]]),
]);
export const MINI_CONTENT = {
  name: MINI_NAME,
  brand: "Apple",
  description: "Apple iPad mini (A17 Pro) — компактный планшет с экраном 8,3″ для чтения, заметок и работы в дороге. Выберите память, цвет и подключение. Версия Cellular использует eSIM, без лотка для физической SIM-карты.",
  highlights: [
    "Экран Liquid Retina 8,3″ с True Tone и широким цветовым охватом P3",
    "Чип A17 Pro и накопитель до 512 ГБ",
    "Поддержка Apple Pencil Pro и Apple Pencil (USB‑C), включая наведение",
    "Wi‑Fi 6E; у Cellular — 5G/LTE и eSIM",
    "Touch ID и до 10 часов работы по Wi‑Fi",
  ],
  specs: {
    "Модельный год": "2024",
    "Дисплей": "8,3″ Liquid Retina, IPS, P3, True Tone, полная ламинация",
    "Разрешение": "2266 × 1488 пикселей, 326 ppi",
    "Яркость": "500 нит",
    "Стекло": "Антибликовое и олеофобное покрытия",
    "Процессор": "Apple A17 Pro: CPU 6 ядер, GPU 5 ядер, Neural Engine 16 ядер",
    "Накопитель": "128, 256 или 512 ГБ",
    "Основная камера": "12 Мп, ƒ/1.8, Smart HDR 4",
    "Фронтальная камера": "12 Мп Center Stage, ƒ/2.4",
    "Видеосъёмка": "4K до 60 кадр/с",
    "Звук": "Стереодинамики, два микрофона",
    "Беспроводная связь": "Wi‑Fi 6E, Bluetooth 5.3; Cellular: 5G/LTE",
    "SIM": "Wi‑Fi: без SIM; Cellular: eSIM, физическая SIM не поддерживается. Доступность подключения зависит от региона и оператора",
    "Навигация": "GPS/GNSS — только у Cellular",
    "Разъём и передача данных": "USB‑C, USB 3 до 10 Гбит/с; внешний дисплей до 4K/60 Гц",
    "Аккумулятор": "19,3 Вт·ч",
    "Автономность": "До 10 часов по Wi‑Fi/видео; до 9 часов по сотовой сети",
    "Материал корпуса": "Алюминий",
    "Цвета": "Blue, Purple, Starlight, Space Gray",
    "Размеры": "195,4 × 134,8 × 6,3 мм",
    "Вес": "293 г (Wi‑Fi) / 297 г (Cellular)",
    "Безопасность": "Touch ID в верхней кнопке",
    "Совместимость": "Apple Pencil Pro и Apple Pencil (USB‑C). Apple Pencil 2-го поколения не подходит",
    "Комплектация": "iPad mini, кабель USB‑C; наличие адаптера уточняйте для выбранного региона. Стилус приобретается отдельно",
  },
};

type ProductIdentity = { slug: string; name: string; brand?: string | null; category: { slug: string } };
const compact = (value: string) => value.toLowerCase().replace(/^apple\s+/, "").replace(/[^a-zа-яё0-9]/g, "");
const oldNames = new Set([
  "iPad Air 13 (2025, M3)", "iPad Air 11 (2025, M3)", "iPad 11 (2025)",
  "iPad Air 8 11", "iPad Air 11-inch (M3)", "iPad Air 13-inch (M3)", "iPad Pro 13",
].map(compact));
const oldSlugs = new Set(["ipad-air-11-m3", "ipad-air-13-m3", "ipad-11-2025", "ipad-air-8-11", "ipad-pro-13"]);
const protectedSlugs = new Set([MINI_SLUG, "ipad-pro-11-m5", "ipad-pro-13-m5", "ipad-air-11-m4", "ipad-air-13-m4", "ipad-a16"]);
export function isMiniProduct(product: ProductIdentity) {
  return product.category.slug === "planshety" && (product.slug === MINI_SLUG ||
    ["ipadmini7", "ipadminia17pro"].includes(compact(product.name)));
}
export function shouldArchiveTablet(product: ProductIdentity) {
  if (product.category.slug !== "planshety" || protectedSlugs.has(product.slug)) return false;
  if (/\b(?:M4|M5|A16)\b/i.test(product.name)) return false;
  if (/^(honor|oneplus)$/i.test(product.brand ?? "") || /^(honor|oneplus)\s+pad\b/i.test(product.name)) return true;
  return oldSlugs.has(product.slug) || oldNames.has(compact(product.name));
}

export type MiniVariant = {
  id: string; productId: string; memory: string | null; color: string | null; region: string | null;
  rawLabel: string | null; price: unknown | null; updatedAt: Date;
};
export function normalizeMiniVariant(variant: MiniVariant) {
  const memorySource = `${variant.memory ?? ""} ${variant.rawLabel ?? ""}`;
  const memory = memorySource.match(/\b(128|256|512)\s*(?:gb|гб)(?=$|\s|[.,;)])/i)?.[1];
  const colorSource = `${variant.color ?? ""} ${variant.rawLabel ?? ""}`;
  const color = /space\s*gr[ae]y|серый\s*космос/i.test(colorSource) ? "Space Gray"
    : /starlight|сияющая\s*звезда/i.test(colorSource) ? "Starlight"
    : /purple|фиолетов/i.test(colorSource) ? "Purple" : /blue|синий|голубой/i.test(colorSource) ? "Blue" : null;
  const connectionSource = `${variant.region ?? ""} ${variant.rawLabel ?? ""} ${variant.color ?? ""}`;
  // The old official catalogue omitted connectivity; these were Wi-Fi offers.
  // Explicit cellular markers always take precedence over the Wi-Fi part of "Wi-Fi + Cellular".
  const region = /cellular|e\s*sim|\b(?:5g|4g|lte)\b|сотов/i.test(connectionSource) ? MINI_CONNECTIONS[1] : MINI_CONNECTIONS[0];
  return memory && color ? { memory: `${memory}GB`, color, region } : null;
}

// Pure plan: keep existing IDs, prices and stock. Unselected variants are archived, never deleted.
export function planMiniVariants<T extends MiniVariant>(variants: T[], primaryId?: string) {
  const ranked = [...variants].sort((a, b) =>
    Number(b.price != null) - Number(a.price != null) ||
    Number(b.productId === primaryId) - Number(a.productId === primaryId) ||
    b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id),
  );
  const selected = new Set<string>();
  const options = MINI_OPTIONS.map(option => {
    const existing = ranked.find(variant => {
      const normalized = normalizeMiniVariant(variant);
      return normalized && variantImageKey(normalized) === variantImageKey(option);
    });
    if (existing) selected.add(existing.id);
    return { option, existing };
  });
  return { options, remaining: variants.filter(variant => !selected.has(variant.id)) };
}
