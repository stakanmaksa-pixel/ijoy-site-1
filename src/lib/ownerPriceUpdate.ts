import {
  canonicalIphoneModel,
  matchAppleWatchVariant,
  matchIPadVariant,
  normalizeForMatch,
  normalizedIphoneSim,
  normalizedMemory,
  parsePriceLine,
  type ParsedPriceLine,
  type SupplierVariantCandidate,
} from "./priceImport";

export type PriceCategory = "iPhone" | "iPad" | "Apple Watch" | "AirPods Max 2" | "Аксессуары и наушники";
export type CatalogPriceCandidate = SupplierVariantCandidate & {
  productSlug: string;
  sku: string | null;
  price: number | null;
};
export type PriceDecision = {
  line: ParsedPriceLine;
  category: PriceCategory;
  markup: number;
  variantId: string | null;
  reason: string | null;
};
export type PriceChange = {
  variant: CatalogPriceCandidate;
  category: PriceCategory;
  supplierPrice: number;
  newPrice: number;
  sources: string[];
};

const ACCESSORY_SLUGS: Array<[RegExp, string]> = [
  [/^Apple USB-C - Lightning 1M\b/i, "apple-usb-c-lightning-cable-1m"],
  [/^Apple 60W USB-C Cable 1M\b/i, "apple-60w-usb-c-cable-1m"],
  [/^Apple 240W USB-C Cable 2M\b/i, "apple-240w-usb-c-cable-2m"],
  [/^Apple 20W Adapter Copy\b/i, "apple-20w-adapter-copy"],
  [/^Apple 25W MagSafe Charger 2M\b/i, "apple-25w-magsafe-charger-qi22"],
  [/^Apple 40-60W Dynamic Power USB-C\b/i, "apple-dynamic-power-usb-c-40-60w"],
  [/^Apple Magic Keyboard White USB-C\b/i, "apple-magic-keyboard-usb-c"],
];
const HEADPHONE_NAMES: Array<[RegExp, string]> = [
  [/^EarPods USB-C White\b/i, "Apple EarPods USB-C"],
  [/^AirPods 4 ANC\b/i, "AirPods 4 ANC"],
  [/^AirPods 5 Wireless\b/i, "AirPods 5 Wireless"],
  [/^AirPods Pro 3\b/i, "AirPods Pro 3"],
];

/** Only explicitly priced families from this owner request; everything else stays untouched. */
export function ownerPriceCategory(line: ParsedPriceLine): { category: PriceCategory; markup: number } | null {
  const model = line.parsedModel ?? "";
  if (line.phoneModel) return { category: "iPhone", markup: 4000 };
  if (/^iPad\b/i.test(model)) return { category: "iPad", markup: 4000 };
  if (/^Apple Watch\b/i.test(model) && !/^Apple Watch\s+(?:S\s*10|Series\s*10|Ultra\s*2)\b/i.test(model)) {
    return { category: "Apple Watch", markup: 3000 };
  }
  if (/^AirPods Max 2\b/i.test(model)) return { category: "AirPods Max 2", markup: 3000 };
  if (ACCESSORY_SLUGS.some(([re]) => re.test(model)) || HEADPHONE_NAMES.some(([re]) => re.test(model))) {
    return { category: "Аксессуары и наушники", markup: 1500 };
  }
  return null;
}

function exactIphoneMatch(line: ParsedPriceLine, candidates: CatalogPriceCandidate[]): string | null {
  const model = canonicalIphoneModel(line.phoneModel ?? "");
  const memory = normalizedMemory(line.parsedMemory);
  const color = normalizeForMatch(line.parsedColor ?? "");
  const sim = normalizedIphoneSim(line.parsedRegion, model);
  // Do not infer an absent SIM from a generation-independent country guess.
  if (!model || !memory || !color || !sim) return null;
  const matches = candidates.filter((candidate) => {
    const stored = candidate.rawLabel ? parsePriceLine(candidate.rawLabel) : null;
    if (canonicalIphoneModel(candidate.productName) !== model) return false;
    if (normalizedMemory(candidate.memory ?? stored?.parsedMemory ?? null) !== memory) return false;
    if (normalizeForMatch(candidate.color ?? stored?.parsedColor ?? "") !== color) return false;
    const candidateSim = normalizedIphoneSim(candidate.region, model)
      ?? normalizedIphoneSim(candidate.rawLabel, model);
    return candidateSim === sim;
  });
  return matches.length === 1 ? matches[0].id : null;
}

function exactAccessoryMatch(line: ParsedPriceLine, candidates: CatalogPriceCandidate[]): string | null {
  const source = line.parsedModel ?? "";
  const slug = ACCESSORY_SLUGS.find(([re]) => re.test(source))?.[1];
  const productName = HEADPHONE_NAMES.find(([re]) => re.test(source))?.[1];
  if (!slug && !productName) return null;
  const sourceColor = normalizeForMatch(line.parsedColor ?? "");
  const matches = candidates.filter((candidate) => {
    if (slug ? candidate.productSlug !== slug : candidate.productName !== productName) return false;
    if (line.parsedSku && ![candidate.sku, candidate.rawLabel]
      .some((value) => normalizeForMatch(value ?? "").includes(normalizeForMatch(line.parsedSku ?? "")))) return false;
    if (sourceColor && normalizeForMatch(candidate.color ?? "") !== sourceColor) return false;
    return true;
  });
  return matches.length === 1 ? matches[0].id : null;
}

function exactMax2Match(line: ParsedPriceLine, candidates: CatalogPriceCandidate[]): string | null {
  const color = normalizeForMatch(line.parsedColor ?? "");
  if (!color) return null;
  const matches = candidates.filter((candidate) =>
    normalizeForMatch(candidate.productName) === "airpods max 2" &&
    normalizeForMatch(candidate.color ?? "") === color,
  );
  return matches.length === 1 ? matches[0].id : null;
}

export function planOwnerPriceUpdate(lines: ParsedPriceLine[], candidates: CatalogPriceCandidate[]) {
  const variantById = new Map(candidates.map((variant) => [variant.id, variant]));
  const decisions: PriceDecision[] = [];
  const changesById = new Map<string, PriceChange>();
  for (const line of lines) {
    const scope = ownerPriceCategory(line);
    if (!scope) continue;
    let variantId: string | null = null;
    if (line.parsedPrice !== null && line.parsedPrice > 0) {
      if (scope.category === "iPhone") variantId = exactIphoneMatch(line, candidates);
      else if (scope.category === "iPad") variantId = matchIPadVariant(line, candidates);
      else if (scope.category === "Apple Watch") variantId = matchAppleWatchVariant(line, candidates);
      else if (scope.category === "AirPods Max 2") variantId = exactMax2Match(line, candidates);
      else variantId = exactAccessoryMatch(line, candidates);
    }
    const reason = line.parsedPrice === null || line.parsedPrice <= 0
      ? "Нет положительной числовой цены"
      : !variantId ? "Нет единственной точной модификации в каталоге" : null;
    decisions.push({ line, ...scope, variantId, reason });
    if (!variantId || line.parsedPrice === null) continue;
    const variant = variantById.get(variantId);
    if (!variant) throw new Error(`Исчезла модификация ${variantId}`);
    const old = changesById.get(variantId);
    if (old && old.category !== scope.category) throw new Error(`Конфликт категорий для ${variantId}`);
    if (!old || line.parsedPrice < old.supplierPrice) {
      changesById.set(variantId, {
        variant, category: scope.category, supplierPrice: line.parsedPrice,
        newPrice: line.parsedPrice + scope.markup,
        sources: old ? [...old.sources, line.rawLine] : [line.rawLine],
      });
    } else old.sources.push(line.rawLine);
  }
  return { decisions, changes: [...changesById.values()].sort((a, b) => a.variant.productName.localeCompare(b.variant.productName)) };
}
