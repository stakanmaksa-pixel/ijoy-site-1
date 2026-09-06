export const PRODUCT_SPEC_GROUPS = [
  { title: "Основное", keys: ["Модельный год", "Поколение", "Размер корпуса", "Цвета", "Память", "Накопитель"] },
  { title: "Экран", keys: ["Дисплей", "Разрешение", "Яркость", "Стекло"] },
  { title: "Камеры", keys: ["Основная камера", "Телефото", "Фронтальная камера", "Видеосъёмка"] },
  { title: "Здоровье и датчики", keys: ["Датчики", "Здоровье"] },
  { title: "Мультимедиа", keys: ["Видео", "Звук"] },
  { title: "Производительность", keys: ["Процессор", "Оперативная память"] },
  { title: "Связь", keys: ["SIM", "Связь", "Беспроводная связь", "Разъём и передача данных", "Разъёмы", "Навигация", "Умный дом"] },
  { title: "Питание", keys: ["Автономность", "Аккумулятор", "Быстрая зарядка", "Беспроводная зарядка"] },
  { title: "Корпус и защита", keys: ["Материал корпуса", "Корпус", "Размеры", "Вес", "Обхват запястья", "Защита", "Защита от воды и пыли", "Безопасность"] },
  { title: "Комплектация и аксессуары", keys: ["Пульт", "Совместимость", "Комплектация", "Комплект", "Подключение", "Зарядка", "Управление"] },
] as const;

export const PRODUCT_SPEC_ORDER = PRODUCT_SPEC_GROUPS.flatMap((group) => [...group.keys]);

export function groupSpecKeys(keys: string[]) {
  const remaining = new Set(keys);
  const groups: Array<{ title: string; keys: string[] }> = PRODUCT_SPEC_GROUPS.map((group) => {
    const matching = group.keys.filter((key) => remaining.delete(key));
    return { title: group.title, keys: [...matching] };
  }).filter((group) => group.keys.length > 0);

  if (remaining.size > 0) groups.push({ title: "Дополнительно", keys: [...remaining] });
  return groups;
}

export function groupProductSpecs(specs: Record<string, string> | null | undefined) {
  if (!specs) return [];
  return groupSpecKeys(Object.keys(specs)).map((group) => ({
    title: group.title,
    entries: group.keys.map((key) => [key, specs[key]] as const),
  }));
}
