import type { RefreshProduct, RefreshVariant } from "./catalog-refresh-types";

export const identity = (value: string) => value.toLowerCase().replace(/\+/g, "plus").replace(/[^a-zа-я0-9]/g, "");
type ExistingOption = { id: string; memory: string | null; color: string | null; region: string | null; price: unknown; inStock: boolean; rawLabel?: string | null };
function colorIdentity(value: string | null) {
  return identity((value ?? "").replace(/grey/ig, "gray").replace(/ч[её]рный/ig, "black").replace(/белый/ig, "white").replace(/серый/ig, "gray").replace(/серебристый/ig, "silver"));
}
function memoryIdentity(value: string | null) {
  const text = (value ?? "").replace(/гб/ig, "GB").replace(/тб/ig, "TB").replace(/\s/g, "");
  const match = text.match(/^(?:(\d+)(?:GB)?\/)?(\d+(?:\.\d+)?)(GB|TB)?$/i);
  return match ? `${match[1] ? match[1] + "/" : ""}${Number(match[2]) * (match[3]?.toUpperCase() === "TB" ? 1024 : 1)}` : identity(text);
}
function storageIdentity(value: string | null) { return memoryIdentity((value ?? "").split(/[\/]/).at(-1) ?? null); }
function connectionIdentity(value: string | null) {
  if (/5g/i.test(value ?? "")) return "wifi5g";
  if (/lte|4g/i.test(value ?? "")) return "wifilte";
  if (/wi.?fi/i.test(value ?? "")) return "wifi";
  return identity(value ?? "");
}
export function sameRefreshOption(a: ExistingOption, b: RefreshVariant, category: RefreshProduct["category"]) {
  return memoryIdentity(a.memory) === memoryIdentity(b.memory) && colorIdentity(a.color) === colorIdentity(b.color) &&
    (category === "telefony" || connectionIdentity(a.region) === connectionIdentity(b.region));
}
export function planRefreshVariants(existing: ExistingOption[], product: RefreshProduct) {
  const remaining = [...existing];
  const options = product.variants.map(option => {
    let candidates = remaining.filter(v => sameRefreshOption(v, option, product.category));
    // Old price lists sometimes specify storage only. Infer RAM only when
    // this storage/color has exactly one valid new configuration.
    if (!candidates.length && product.category === "telefony") {
      const sameStorageColor = (v: {memory:string|null;color:string|null}) => storageIdentity(v.memory) === storageIdentity(option.memory) && colorIdentity(v.color) === colorIdentity(option.color);
      const uniqueConfiguration = product.variants.filter(sameStorageColor).length === 1;
      if (uniqueConfiguration) candidates = remaining.filter(v => !v.memory?.includes("/") && sameStorageColor(v));
    }
    candidates.sort((a, b) => Number(b.inStock && b.price != null) - Number(a.inStock && a.price != null) || Number(a.price ?? Infinity) - Number(b.price ?? Infinity) || a.id.localeCompare(b.id));
    const chosen = candidates[0] ?? null;
    if (chosen) remaining.splice(remaining.indexOf(chosen), 1);
    return { option, existing: chosen };
  });
  // Do not guess between two RAM sizes and silently hide a priced offer.
  for (const offer of remaining) {
    if (offer.price == null || product.category !== "telefony" || offer.memory?.includes("/")) continue;
    const possible = product.variants.filter(v => storageIdentity(v.memory) === storageIdentity(offer.memory) && colorIdentity(v.color) === colorIdentity(offer.color));
    if (possible.length > 1 && !possible.some(v => sameRefreshOption(offer, v, product.category))) {
      throw new Error(`Ambiguous RAM in existing priced offer ${offer.id} (${product.slug}, ${offer.memory}, ${offer.color}). Specify its RAM before refreshing.`);
    }
  }
  return { options, remaining };
}
export function shouldHideForRefresh(product: {slug: string; name: string; brand: string | null; category: {slug: string}}, allowedTablets: Set<string>) {
  if (product.slug.endsWith("-archive-variants")) return false;
  if (product.category.slug === "chasy") return product.brand?.toLowerCase() === "oneplus" || /galaxy\s*watch\s*7\b/i.test(product.name);
  if (product.category.slug === "telefony" && product.brand === "Sony") return !/xperia\s*1\s*(?:vii|7)(?:\s|$)/i.test(product.name);
  if (product.category.slug === "planshety" && product.brand === "Samsung" && /^(?:Samsung\s+)?Galaxy\s+Tab\b/i.test(product.name)) return !allowedTablets.has(product.slug);
  return false;
}
