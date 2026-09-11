/** Presentation only: never delete regional offers or change their database IDs. */
export function isSamsungPhone(slug: string): boolean {
  return /^samsung-(?:galaxy-)?/i.test(slug) && !/\b(?:tab|watch|buds|keyboard|s-pen)\b/i.test(slug);
}

export function isIpadKeyboard(slug: string): boolean {
  return /^magic-keyboard-(?:ipad-|folio-ipad-)/.test(slug);
}

export const directModelLink = (product: {name:string;slug:string}) => ({label:product.name,href:`/product/${product.slug}`});

/** A single model opens its variant grid; only real multi-model lines need children. */
export function modelLineMenuNode(
  label: string,
  items: { label: string; href: string }[],
  groupHref?: string,
): { label: string; href?: string; children?: { label: string; href: string }[] } | null {
  if (!items.length) return null;
  return items.length === 1
    ? { ...items[0], label }
    : { label, href: groupHref, children: items };
}

type Offer = { id: string; memory: string | null; color: string | null; region: string | null; price: number | null; inStock: boolean };
const key = (v: Offer) => JSON.stringify([v.memory, v.color]);
const memorySize = (value: string | null) => {
  const match = value?.match(/(\d+)\s*(TB|GB|ГБ|ТБ)?$/i);
  return match ? Number(match[1]) * (/TB|ТБ/i.test(match[2] ?? "") ? 1024 : 1) : 0;
};

export function samsungMemoryColorGrid<T extends Offer>(offers: T[]): { variants: T[]; aliases: Record<string, string> } {
  const groups = new Map<string, T[]>();
  for (const offer of offers) groups.set(key(offer), [...(groups.get(key(offer)) ?? []), offer]);
  const aliases: Record<string, string> = {};
  const variants = [...groups.values()].map(group => {
    const best = [...group].sort((a, b) =>
      Number(b.inStock && b.price != null) - Number(a.inStock && a.price != null) ||
      (a.price ?? Infinity) - (b.price ?? Infinity) || a.id.localeCompare(b.id))[0];
    for (const offer of group) aliases[offer.id] = best.id;
    return { ...best, region: null };
  }).sort((a, b) => memorySize(a.memory) - memorySize(b.memory) || (a.color ?? "").localeCompare(b.color ?? "", "ru") || a.id.localeCompare(b.id));
  return { variants, aliases };
}
