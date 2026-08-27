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
