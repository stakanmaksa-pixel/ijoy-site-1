import { matchMacBookVariant, matchSamsungVariant, normalizeForMatch, type ParsedPriceLine } from "./priceImport";
import { ownerPriceCategory, planOwnerPriceUpdate, type CatalogPriceCandidate, type OwnerPriceRules, type PriceCategory, type PriceScope } from "./ownerPriceUpdate";

export const OCTOBER27_MARKUPS = {
  MacBook: 6000, "Mac mini": 6000, Samsung: 5000, Garmin: 7000, Fitbit: 1500,
  DJI: 1500, PlayStation: 4000, "Контроллеры": 1000, "Яндекс": 2000,
} as const;

export function october27Category(line: ParsedPriceLine): PriceScope | null {
  const apple = ownerPriceCategory(line);
  if (apple) return apple;
  const source = line.parsedModel ?? "";
  const category: keyof typeof OCTOBER27_MARKUPS | null = /\bMacBook\b/i.test(source) ? "MacBook"
    : /\bMac\s+Mini\b/i.test(source) ? "Mac mini"
    : /^Samsung Galaxy\b/i.test(source) ? "Samsung"
    : /^Часы Garmin Venu X1\b/i.test(source) ? "Garmin"
    : /^Google Fitbit Air\b/i.test(source) ? "Fitbit"
    : /^DJI Osmo Action 6\b/i.test(source) ? "DJI"
    : /^Sony DualSense Edge\b/i.test(source) ? "Контроллеры"
    : /^PlayStation 5 Slim Disc\b/i.test(source) ? "PlayStation"
    : /^Яндекс Станция Макс(?:\s|$)/iu.test(source) ? "Яндекс" : null;
  return category ? { category, markup: OCTOBER27_MARKUPS[category] } : null;
}

const norm = (text: string | null | undefined) => normalizeForMatch(text ?? "");
function only(candidates: CatalogPriceCandidate[], predicate: (candidate: CatalogPriceCandidate) => boolean) {
  const matches = candidates.filter(predicate);
  return matches.length === 1 ? matches[0].id : null;
}

function october27Match(line: ParsedPriceLine, candidates: CatalogPriceCandidate[], category: PriceCategory): string | null | undefined {
  if (category === "MacBook") {
    const chip = /\b(M\d(?:\s*(?:Pro|Max|Ultra))?|A\d+(?:\s*Pro)?)\b/i.exec(line.parsedModel ?? "")?.[1];
    return matchMacBookVariant(line, candidates.filter(candidate => {
      if (candidate.chip && norm(candidate.chip).replace(/^apple /, "") !== norm(chip)) return false;
      if (!/\bMacBook Neo\b/i.test(line.parsedModel ?? "")) return true;
      const recorded = candidate.chip ?? /\bA\d+(?:\s*Pro)?\b/i.exec([candidate.region, candidate.rawLabel, candidate.productName].join(" "))?.[0];
      if (recorded) return norm(recorded).replace(/^apple /, "") === norm(chip);
      return Boolean(line.parsedSku && candidate.sku?.toUpperCase().startsWith(line.parsedSku));
    }));
  }
  if (category === "Samsung") {
    // Owner confirmed only this S25 supplier shorthand; do not alias Silver on other generations.
    const silver = /^Samsung Galaxy S25\s+12\/256\b/i.test(line.parsedModel ?? "") && /\bS931B\b/i.test(line.parsedModel ?? "") && line.parsedColor === "Silver";
    const fold = /^Samsung Galaxy Z Fold\s*8\s+512\b/i.test(line.parsedModel ?? "");
    return matchSamsungVariant({ ...line, parsedColor: silver ? "Silver Shadow" : line.parsedColor,
      parsedModel: fold ? line.parsedModel!.replace(/\b512\b/, "12/512GB") : line.parsedModel }, candidates);
  }
  if (category === "Mac mini") {
    if (!/\bMac Mini 2026 M6 16 256 Silver\b/i.test(line.parsedModel ?? "")) return null;
    return only(candidates, candidate =>
    (!candidate.chip || norm(candidate.chip).replace(/^apple /, "") === "m6") &&
    /^(?:apple )?mac mini\b/.test(norm(candidate.productName)) &&
    /\bm6\b/.test(norm([candidate.productName, candidate.region, candidate.rawLabel].join(" "))) &&
    /^16\s*(?:gb|гб)\s*[/,]\s*256\s*(?:gb|гб)(?:\s+ssd)?$/i.test(candidate.memory ?? "") && norm(candidate.color) === "silver");
  }
  if (category === "Garmin") {
    if (line.parsedColor !== "Black" || !/\b010-02980-02\b/.test(line.parsedModel ?? "")) return null;
    return only(candidates, candidate =>
    norm(candidate.productName) === "garmin venu x1" && norm(candidate.color) === "black" &&
    (!candidate.sku || candidate.sku === "010-02980-02"));
  }
  if (category === "Fitbit") return line.parsedColor === "Lavender" ? only(candidates, candidate =>
    candidate.productSlug === "google-fitbit-air" && norm(candidate.color) === "lavender" &&
    norm(candidate.region) === "стандартная версия") : null;
  if (category === "DJI") {
    if (!/\bstandar[dt] combo\b/.test(norm(line.parsedModel))) return null;
    return only(candidates, candidate =>
    /\bdji osmo action 6\b/.test(norm(candidate.productName)) &&
    /\bstandard combo\b/.test(norm([candidate.productName, candidate.region, candidate.rawLabel].join(" ")).replace(/\bstandart\b/g, "standard")) &&
    !/\badventure\b/.test(norm([candidate.productName, candidate.region, candidate.rawLabel].join(" "))));
  }
  if (category === "Контроллеры") return line.parsedColor ? only(candidates, candidate => candidate.productSlug === "dualsense-edge" && norm(candidate.color) === norm(line.parsedColor)) : null;
  if (category === "Яндекс") return /(?:зеленая|зелёная|green)/iu.test(line.parsedModel ?? "") ? only(candidates, candidate =>
    ["яндекс станция макс", "яндекс станция макс с zigbee"].includes(norm(candidate.productName)) &&
    ["green", "зелёный", "зеленый", "зелёная", "зеленая"].includes(norm(candidate.color))) : null;
  // No condition-marked PlayStation offers survive parsePriceListText in this feed.
  if (category === "PlayStation") return null;
  return undefined;
}

export const OCTOBER27_RULES: OwnerPriceRules = { category: october27Category, match: october27Match };
export function planOctober27Prices(lines: ParsedPriceLine[], candidates: CatalogPriceCandidate[]) {
  return planOwnerPriceUpdate(lines, candidates, OCTOBER27_RULES);
}
