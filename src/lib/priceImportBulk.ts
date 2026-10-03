import { isPriceOnRequest } from "./priceImport";

type MatchedLine = {
  id: string;
  matchedVariantId: string | null;
  parsedPrice: { toString(): string } | null;
  parsedModel: string | null;
  rawLine: string;
};

export type VariantPriceUpdate = {
  id: string;
  price: number | null;
  inStock: boolean;
  rawLabel: string;
};

/** One price per variant; duplicate supplier offers use the lowest one-piece price. */
export function planMatchedPriceUpdates(lines: MatchedLine[]) {
  const lineIds: string[] = [];
  const byVariant = new Map<string, VariantPriceUpdate>();

  for (const line of lines) {
    if (!line.matchedVariantId) continue;
    const onRequest = isPriceOnRequest(line.rawLine);
    if (!onRequest && line.parsedPrice === null) continue;
    const price = onRequest ? null : Number(line.parsedPrice);
    if (price !== null && !Number.isFinite(price)) continue;

    lineIds.push(line.id);
    const existing = byVariant.get(line.matchedVariantId);
    if (existing && (price === null || (existing.price !== null && existing.price <= price))) continue;
    byVariant.set(line.matchedVariantId, {
      id: line.matchedVariantId,
      price,
      inStock: price !== null,
      rawLabel: line.parsedModel ?? line.rawLine,
    });
  }

  return { lineIds, variants: [...byVariant.values()] };
}
