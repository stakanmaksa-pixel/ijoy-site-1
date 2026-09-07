export type CatalogAxis = "memory" | "color" | "region";
export type GamingLifestyleCatalogCategory =
  | "igrovye-pristavki"
  | "portativnye-konsoli"
  | "vr-garnitury"
  | "igrovye-aksessuary"
  | "fitnes-braslety"
  | "portativnaya-akustika"
  | "naushniki";

const GAMING_LIFESTYLE_CATEGORIES = new Set([
  "igrovye-pristavki",
  "portativnye-konsoli",
  "vr-garnitury",
  "igrovye-aksessuary",
  "fitnes-braslety",
  "portativnaya-akustika",
  "naushniki",
]);

const GAMING_LIFESTYLE_SLUG = /^(?:playstation-|ps5-|dualsense|victrix|logitech-|nintendo-|meta-quest|xbox-|lenovo-|rog-|valve-|steam-|google-fitbit-air|whoop$|marshall-|sony-pulse-)/i;

export function isGamingLifestyleCategory(categorySlug: string | null | undefined) {
  return Boolean(categorySlug && GAMING_LIFESTYLE_CATEGORIES.has(categorySlug));
}

export function isGamingLifestyleProduct(slug: string) {
  return gamingLifestyleCategoryForProduct(slug) != null;
}

export function gamingLifestyleCategoryForProduct(slug: string): GamingLifestyleCatalogCategory | null {
  if (!GAMING_LIFESTYLE_SLUG.test(slug)) return null;
  if (/^(?:google-fitbit-air|whoop)$/i.test(slug)) return "fitnes-braslety";
  if (/^marshall-major-v$/i.test(slug) || /^sony-pulse-/i.test(slug)) return "naushniki";
  if (/^marshall-/i.test(slug)) return "portativnaya-akustika";
  if (/^(?:playstation-vr2|meta-quest)/i.test(slug)) return "vr-garnitury";
  if (/^(?:playstation-portal|nintendo-switch-lite|lenovo-|rog-|steam-deck)/i.test(slug)) return "portativnye-konsoli";
  if (/^(?:playstation-5|nintendo-switch-(?:2|oled)|xbox-series-x|valve-steam-machine)/i.test(slug)) return "igrovye-pristavki";
  return "igrovye-aksessuary";
}

export function gamingLifestyleAxisLabel(
  axis: CatalogAxis,
  values: string[] = [],
  categorySlug?: string | null,
) {
  if (categorySlug === "fitnes-braslety") {
    if (axis === "memory") return "Тариф / издание";
    if (axis === "color") return "Цвет";
    return "Комплект";
  }
  if (categorySlug === "portativnaya-akustika") {
    if (axis === "memory") return "Версия";
    if (axis === "color") return "Цвет";
    return "Подключение";
  }
  if (categorySlug === "naushniki") {
    if (axis === "memory") return "Версия";
    if (axis === "color") return "Цвет";
    return "Подключение";
  }
  if (axis === "memory") {
    return values.length > 0 && values.every((value) => /^(?:от\s+)?\d+\+?\s*шт$/i.test(value))
      ? "Количество"
      : "Версия / комплект";
  }
  if (axis === "color") return "Цвет / издание";
  return "Совместимость";
}
