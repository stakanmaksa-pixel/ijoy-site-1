import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parsePriceLine, parsePriceListText } from "../../src/lib/priceImport";
import { ownerPriceCategory, planOwnerPriceUpdate, type CatalogPriceCandidate } from "../../src/lib/ownerPriceUpdate";

const fixture = readFileSync(path.resolve("prisma/data/owner-price-2026-10-04.txt"), "utf8");
const sample: CatalogPriceCandidate[] = [
  { id: "phone17-esim", productName: "iPhone 17 Pro Max", productSlug: "iphone-17-pro-max", memory: "512GB", color: "Orange", region: "eSIM", sku: null, rawLabel: null, price: 120000 },
  { id: "phone17-physical", productName: "iPhone 17 Pro Max", productSlug: "iphone-17-pro-max", memory: "512GB", color: "Orange", region: "1 SIM + eSIM", sku: null, rawLabel: null, price: 130000 },
  { id: "phone16-china", productName: "iPhone 16e", productSlug: "iphone-16e", memory: "256GB", color: "White", region: "2 SIM", sku: null, rawLabel: null, price: 50000 },
  { id: "tablet", productName: "iPad Air 8 11 M4", productSlug: "ipad-air-8-11-m4", memory: "128GB", color: "Blue", region: "Wi-Fi", sku: null, rawLabel: null, price: 60000 },
  { id: "tablet-m3", productName: "iPad Air 11-inch (M3)", productSlug: "ipad-air-11-m3", memory: "512GB", color: "Purple", region: "Wi-Fi", sku: null, rawLabel: null, price: 82000 },
  { id: "watch", productName: "Apple Watch Series 12", productSlug: "apple-watch-series-12", memory: "42 мм", color: "Bronze", region: "Sport Band S/M", sku: null, rawLabel: null, price: 40000 },
  { id: "max2", productName: "AirPods Max 2", productSlug: "airpods-max-2", memory: null, color: "Purple", region: "USB-C", sku: null, rawLabel: null, price: 45000 },
  { id: "max-old", productName: "AirPods Max", productSlug: "airpods-max", memory: null, color: "Purple", region: "USB-C", sku: null, rawLabel: null, price: 42000 },
  { id: "earpods", productName: "Apple EarPods USB-C", productSlug: "apple-earpods-usb-c", memory: null, color: "White", region: null, sku: "MYQY3AM/A", rawLabel: null, price: 3000 },
  { id: "wireless", productName: "AirPods 5 Wireless", productSlug: "airpods-5-wireless", memory: null, color: null, region: null, sku: null, rawLabel: null, price: 16000 },
  { id: "standard", productName: "AirPods 5", productSlug: "airpods-5", memory: null, color: null, region: null, sku: null, rawLabel: null, price: 13000 },
];

test("only approved families and markups are in the 4 October price request", () => {
  const counts = new Map<string, number>();
  for (const line of parsePriceListText(fixture)) {
    const scope = ownerPriceCategory(line);
    if (scope) counts.set(scope.category, (counts.get(scope.category) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(counts), {
    iPhone: 106,
    "Аксессуары и наушники": 11,
    "AirPods Max 2": 3,
    "Apple Watch": 20,
    iPad: 14,
  });
  assert.equal(ownerPriceCategory(parsePriceLine("Apple Watch S10 42 Black S/M - 26000₽")), null);
  assert.equal(ownerPriceCategory(parsePriceLine("AirPods Max Purple 2024 USB-C - 38000₽")), null);
  assert.equal(ownerPriceCategory(parsePriceLine("Dyson HS05 Black - 30000₽")), null);
  assert.equal(ownerPriceCategory(parsePriceLine("Часы Garmin Venu X1 Black - 55000₽")), null);
});

test("exact SIM, generation, shade and headset edition receive the requested markup", () => {
  const lines = parsePriceListText([
    "iPhone 17 Pro Max 512 Orange 🇰🇼 eSim - 112.600₽",
    "iPhone 17 Pro Max 512 Orange 🇯🇵 eSim - 111.600₽",
    "iPhone 17 Pro Max 512 Orange 🇭🇰 1 Sim + eSim - 122.600₽",
    "iPhone 16e 256 White 🇨🇳 2 Sim - 45.700₽",
    "iPad Air 8 11 M4 128 Blue Wi-Fi MH314 🇺🇸 - 59.500₽",
    "iPad Air 7 11 M3 512 Purple Wi-Fi MCAE4 🇨🇳 - 79.400₽",
    "Apple Watch S12 42 Bronze S/M MJEF4 🇦🇺 - 38.700₽",
    "AirPods Max 2 Purple - 38.200₽",
    "EarPods USB-C White MYQY3 - 2.500₽",
    "AirPods 5 Wireless - 14.800₽",
  ].join("\n"));
  const plan = planOwnerPriceUpdate(lines, sample);
  assert.equal(plan.decisions.filter((row) => !row.variantId).length, 0);
  assert.deepEqual(Object.fromEntries(plan.changes.map((change) => [change.variant.id, change.newPrice])), {
    "phone17-esim": 115600,
    "phone17-physical": 126600,
    "phone16-china": 49700,
    tablet: 63500,
    "tablet-m3": 83400,
    watch: 41700,
    max2: 41200,
    earpods: 4000,
    wireless: 16300,
  });
  assert.equal(plan.changes.find((change) => change.variant.id === "phone17-esim")?.sources.length, 2);
  assert.equal(plan.changes.some((change) => change.variant.id === "max-old" || change.variant.id === "standard"), false);
});

test("ambiguous or absent configurations never get a price", () => {
  const line = parsePriceLine("iPhone 17 Pro Max 512 Orange 🇭🇰 1 Sim + eSim - 122.600₽");
  assert.equal(planOwnerPriceUpdate([line], [sample[0]!]).decisions[0]?.variantId, null);
  assert.equal(planOwnerPriceUpdate([line], [sample[1]!, { ...sample[1]!, id: "duplicate" }]).decisions[0]?.variantId, null);
});
