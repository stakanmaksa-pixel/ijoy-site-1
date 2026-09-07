export type SmartGlassesVariant = {
  memory: string | null;
  color: string | null;
  region: string | null;
};

// Модели умных очков хранят варианты в тех же трёх полях, что и остальной
// каталог, но их смысл другой: memory = размер, color = оправа,
// region = линзы. Выносим распознавание в один модуль, чтобы карточка,
// фильтры и оформление заказа показывали одинаковые понятные подписи.
export function isSmartGlassesSlug(slug: string): boolean {
  return /^(?:ray-ban-meta-|meta-ray-ban-display)/i.test(slug);
}

export function isSmartGlassesProductName(name: string): boolean {
  return /(?:ray[\s-]?ban\s+meta|meta\s+ray[\s-]?ban|meta\s+glasses)/i.test(name);
}

export function smartGlassesVariantLabel(variant: SmartGlassesVariant): string {
  return [
    variant.memory && `Размер ${variant.memory}`,
    variant.color && `Оправа: ${variant.color}`,
    variant.region && `Линзы: ${variant.region}`,
  ].filter(Boolean).join(" · ") || "Стандарт";
}
