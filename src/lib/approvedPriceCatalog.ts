import { normalizeForMatch, normalizedIphoneSim, normalizedMemory, parsePriceLine } from "./priceImport";
import type { ApprovedOption, ApprovedPriceProduct } from "../../prisma/data/owner-price-october27-additions";

export type PriceCatalogVariant = {
  id: string; memory: string | null; color: string | null; region: string | null;
  sku: string | null; rawLabel: string | null; price: number | null; inStock: boolean; orderCount: number;
};
export type PriceCatalogProduct = {
  id: string; slug: string; name: string; brand: string | null; category: string;
  chip?: string | null;
  variants: PriceCatalogVariant[];
};
export type ApprovedCatalogOperation =
  | { kind: "product"; id: string; product: ApprovedPriceProduct }
  | { kind: "variant"; productId: string; id: string; variant: ApprovedOption }
  | { kind: "sim"; id: string; region: string }
  | { kind: "sku"; id: string; sku: string };

const norm = (value: string | null | undefined) => normalizeForMatch(value ?? "");
const storage = (value: string | null) => normalizedMemory(value?.split("/").at(-1)?.trim() ?? null);
function sameDimensions(product: ApprovedPriceProduct, variant: PriceCatalogVariant, option: ApprovedOption, region = true) {
  const phone = /^iPhone/.test(product.name);
  const computer = /^(?:MacBook|Mac mini)/.test(product.name);
  const samsung = product.brand === "Samsung";
  if (product.brand === "DJI") {
    const label = norm([variant.region, variant.rawLabel].filter(Boolean).join(" ")).replace(/\bstandart\b/g, "standard");
    return /\bstandard combo\b/.test(label) && !/\badventure\b/.test(label);
  }
  const color = (value: string | null) => product.brand === "Яндекс" && ["зелёный", "зеленый", "зелёная", "зеленая"].includes(norm(value)) ? "green" : norm(value);
  const memory = phone ? normalizedMemory(variant.memory) === normalizedMemory(option.memory)
    : samsung ? storage(variant.memory) === storage(option.memory) : norm(variant.memory) === norm(option.memory);
  if (samsung) {
    const suppliedRam = /^(\d+)\//.exec(option.memory ?? "")?.[1];
    const storedRam = /^(\d+)\//.exec(variant.memory ?? "")?.[1];
    if (suppliedRam && storedRam && suppliedRam !== storedRam) return false;
  }
  if (!memory || color(variant.color) !== color(option.color)) return false;
  if (!region || computer || product.brand === "Яндекс") return true;
  if (product.brand === "Garmin" && variant.sku === option.sku && variant.region === null) return true;
  if (phone) return normalizedIphoneSim(variant.region, product.name) === option.region;
  if (samsung) {
    const market = variant.region ?? (variant.rawLabel ? parsePriceLine(variant.rawLabel).parsedRegion : null);
    return !market || norm(market) === norm(option.region);
  }
  return norm(variant.region) === norm(option.region);
}

/** Plan only explicitly authorized additions; no deletes, arbitrary cross-generation merges, or price writes. */
export function planApprovedPriceCatalog(
  current: PriceCatalogProduct[], requirements: ApprovedPriceProduct[], referenced = new Set<string>(),
) {
  const products = current.map(product => ({ ...product, variants: product.variants.map(variant => ({ ...variant })) }));
  const operations: ApprovedCatalogOperation[] = [];
  const approvedStockIds = new Set<string>();
  const photos: Array<{ productId: string; memory: string | null; color: string | null; region: string | null; image: string }> = [];
  let next = 0;
  for (const requirement of requirements) {
    const names = [requirement.name, ...(requirement.aliases ?? [])].map(norm);
    const matches = products.filter(product => product.slug === requirement.slug || names.includes(norm(product.name)));
    if (matches.length > 1) throw Error(`${requirement.name}: несколько карточек, автоматическое объединение запрещено`);
    let product = matches[0];
    if (!product) {
      if (!requirement.create) throw Error(`${requirement.name}: существующая карточка не найдена`);
      product = { id: `$new-product-${++next}`, slug: requirement.slug, name: requirement.name, brand: requirement.brand, category: requirement.category, variants: [] };
      products.push(product);
      operations.push({ kind: "product", id: product.id, product: requirement });
    }
    const brand = (value: string | null) => norm(value) === "yandex" ? "яндекс" : norm(value);
    if (brand(product.brand) !== brand(requirement.brand)) throw Error(`${requirement.name}: другая марка у найденной карточки`);
    for (const option of requirement.variants) {
      const exact = product.variants.filter(variant => sameDimensions(requirement, variant, option));
      if (exact.length > 1) throw Error(`${requirement.name}: дублирующиеся точные модификации`);
      let variant = exact[0];
      if (!variant && /^iPhone 18 Pro/.test(requirement.name)) {
        const generic = product.variants.filter(item => sameDimensions(requirement, item, option, false) && !normalizedIphoneSim(item.region, requirement.name));
        if (generic.length > 1) throw Error(`${requirement.name}: несколько общих вариантов без SIM`);
        const base = generic[0];
        if (base) {
          if (base.region !== null || base.price !== null || base.inStock || base.sku || base.rawLabel || base.orderCount || referenced.has(base.id)) throw Error(`${requirement.name}: общий вариант ${base.id} уже использован/оценён; разделение остановлено`);
          variant = base;
          variant.region = option.region;
          operations.push({ kind: "sim", id: variant.id, region: option.region! });
        }
      }
      if (!variant) {
        variant = { id: `$new-variant-${++next}`, memory: option.memory, color: option.color, region: option.region,
          sku: option.sku ?? null, rawLabel: option.rawLabel ?? null, price: null, inStock: false, orderCount: 0 };
        product.variants.push(variant);
        operations.push({ kind: "variant", productId: product.id, id: variant.id, variant: option });
      }
      if (option.sku) {
        const holders = products.flatMap(item => item.variants).filter(item => item.sku === option.sku && item.id !== variant!.id);
        if (holders.length || (variant.sku && variant.sku !== option.sku)) throw Error(`${option.sku}: артикул закреплён за другим вариантом`);
        if (!variant.sku) {
          variant.sku = option.sku;
          operations.push({ kind: "sku", id: variant.id, sku: option.sku });
        }
      }
      approvedStockIds.add(variant.id);
      if (option.image) photos.push({ productId: product.id, memory: variant.memory, color: variant.color, region: variant.region, image: option.image });
    }
  }
  return { products, operations, approvedStockIds, photos };
}
