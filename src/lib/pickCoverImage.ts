// Вынесено из catalog.ts в отдельный модуль без серверных зависимостей
// (никакого prisma/pg) — эта функция чисто вычислительная, поэтому её можно
// безопасно импортировать и в клиентские компоненты (например CompareTable),
// не затягивая за собой драйвер БД в бандл для браузера.

// Фото "по умолчанию" для карточки без выбора конкретного цвета: фото цвета
// приоритетного варианта (обычно самого дешёвого — с ним же связано
// сердечко избранного на карточке), иначе первое общее фото, иначе первое
// фото хоть какого-то цвета — лучше показать реальное фото не того цвета,
// чем пустую заглушку.
export function pickCoverImage(
  images: string[],
  colorImages: Record<string, string[]> | null,
  preferredColor?: string | null,
): string | null {
  if (preferredColor && colorImages?.[preferredColor]?.length) {
    return colorImages[preferredColor][0];
  }
  if (images.length > 0) return images[0];
  if (colorImages) {
    for (const list of Object.values(colorImages)) {
      if (list?.length) return list[0];
    }
  }
  return null;
}

export type VariantImageSelector = {
  memory?: string | null;
  color?: string | null;
  region?: string | null;
};

// colorImages исторически хранит изображения по цвету. Для часов одного
// цвета этого недостаточно: в рамках одного корпуса есть разные ремешки и
// размеры. Точный составной ключ позволяет привязать фото к модификации,
// не меняя схему БД и сохраняя совместимость со старыми товарами.
export function variantImageKey(variant: VariantImageSelector): string {
  return `variant:${variant.memory ?? ""}::${variant.color ?? ""}::${variant.region ?? ""}`;
}

export function pickVariantImages(
  images: string[],
  colorImages: Record<string, string[]> | null,
  variant?: VariantImageSelector | null,
): string[] {
  if (variant) {
    const exact = colorImages?.[variantImageKey(variant)];
    if (exact?.length) return exact;
    if (variant.color && colorImages?.[variant.color]?.length) {
      return colorImages[variant.color];
    }
  }
  if (images.length) return images;
  if (colorImages) {
    for (const list of Object.values(colorImages)) {
      if (list?.length) return list;
    }
  }
  return [];
}
