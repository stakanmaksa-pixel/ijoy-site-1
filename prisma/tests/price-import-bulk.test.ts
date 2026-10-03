import assert from "node:assert/strict";
import { test } from "node:test";
import { planMatchedPriceUpdates } from "../../src/lib/priceImportBulk";

test("bulk price plan chooses the minimum and keeps all accepted supplier rows", () => {
  const plan = planMatchedPriceUpdates([
    { id: "a", matchedVariantId: "phone", parsedPrice: { toString: () => "54000" }, parsedModel: "iPhone 15 Blue", rawLine: "iPhone 15 Blue - 54000" },
    { id: "b", matchedVariantId: "phone", parsedPrice: { toString: () => "48800" }, parsedModel: "iPhone 15 Blue", rawLine: "iPhone 15 Blue - 48800" },
    { id: "c", matchedVariantId: "phone", parsedPrice: { toString: () => "52000" }, parsedModel: "iPhone 15 Blue", rawLine: "iPhone 15 Blue - 52000" },
  ]);
  assert.deepEqual(plan.lineIds, ["a", "b", "c"]);
  assert.deepEqual(plan.variants, [{ id: "phone", price: 48800, inStock: true, rawLabel: "iPhone 15 Blue" }]);
});

test("bulk plan handles manager-price and ignores invalid unmatched rows", () => {
  const plan = planMatchedPriceUpdates([
    { id: "a", matchedVariantId: "watch", parsedPrice: null, parsedModel: "Apple Watch", rawLine: "Apple Watch - по запросу" },
    { id: "b", matchedVariantId: "watch", parsedPrice: { toString: () => "30000" }, parsedModel: "Apple Watch", rawLine: "Apple Watch - 30000" },
    { id: "c", matchedVariantId: "other", parsedPrice: null, parsedModel: "Other", rawLine: "Other - unknown" },
    { id: "d", matchedVariantId: null, parsedPrice: { toString: () => "1000" }, parsedModel: "Cable", rawLine: "Cable - 1000" },
  ]);
  assert.deepEqual(plan.lineIds, ["a", "b"]);
  assert.deepEqual(plan.variants, [{ id: "watch", price: 30000, inStock: true, rawLabel: "Apple Watch" }]);
});
