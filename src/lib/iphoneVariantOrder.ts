export function rankCatalogModel(list: readonly string[] | undefined, name: string): number {
  const normalize = (value: string) => value.trim().replace(/^Apple\s+(?=iPhone\b)/i, "").replace(/\s+/g, " ").toLowerCase();
  const index = list?.findIndex(item => normalize(item) === normalize(name)) ?? -1;
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}

export function sortIphoneVariants<T extends { memory: string | null }>(slug: string, variants: T[]): T[] {
  if (!slug.startsWith("iphone-")) return variants;
  const size = (value: string | null) => {
    const match = value?.trim().match(/^(\d+)\s*(GB|TB|ГБ|ТБ)$/i);
    return match ? Number(match[1]) * (/TB|ТБ/i.test(match[2]) ? 1024 : 1) : Number.MAX_SAFE_INTEGER;
  };
  return [...variants].sort((a, b) => size(a.memory) - size(b.memory));
}
