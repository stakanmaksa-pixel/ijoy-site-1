export const PRODUCT_SPEC_GROUPS = [
  { title: "Основное", keys: ["Модельный год", "Цвета", "Память"] },
  { title: "Экран", keys: ["Дисплей", "Разрешение", "Яркость"] },
  { title: "Камеры", keys: ["Основная камера", "Телефото", "Фронтальная камера", "Видеосъёмка"] },
  { title: "Производительность", keys: ["Процессор"] },
  { title: "Связь и SIM", keys: ["SIM", "Беспроводная связь", "Разъём и передача данных", "Навигация"] },
  { title: "Питание", keys: ["Автономность", "Быстрая зарядка", "Беспроводная зарядка"] },
  { title: "Корпус и защита", keys: ["Корпус", "Размеры", "Вес", "Защита от воды и пыли", "Безопасность"] },
  { title: "Комплектация", keys: ["Комплектация"] },
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
