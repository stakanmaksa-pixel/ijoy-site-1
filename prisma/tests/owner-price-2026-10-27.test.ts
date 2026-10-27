import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { parsePriceLine, parsePriceListText } from "../../src/lib/priceImport";
import { planOctober27Prices, october27Category } from "../../src/lib/ownerPriceOctober27";
import { planApprovedPriceCatalog, type PriceCatalogProduct, type PriceCatalogVariant } from "../../src/lib/approvedPriceCatalog";
import { october27ApprovedProducts, type ApprovedPriceProduct } from "../data/owner-price-october27-additions";
import type { CatalogPriceCandidate } from "../../src/lib/ownerPriceUpdate";
import photoSources from "../data/owner-price-october27-photo-sources.json";

const input = readFileSync("prisma/data/owner-price-2026-10-27.txt", "utf8");
const lines = parsePriceListText(input);
const option = (patch: Partial<PriceCatalogVariant> = {}): PriceCatalogVariant => ({ id: "v", memory: null, color: null, region: null, sku: null, rawLabel: null, price: null, inStock: false, orderCount: 0, ...patch });
const product = (patch: Partial<PriceCatalogProduct> = {}): PriceCatalogProduct => ({ id: "p", slug: "iphone-18-pro", name: "iPhone 18 Pro", brand: "Apple", category: "telefony", variants: [], ...patch });
const candidate = (patch: Partial<CatalogPriceCandidate>): CatalogPriceCandidate => ({ id: "v", productName: "", productSlug: "", memory: null, color: null, region: null, sku: null, rawLabel: null, price: null, ...patch });
const requirement: ApprovedPriceProduct = { slug: "iphone-18-pro", name: "iPhone 18 Pro", brand: "Apple", category: "telefony", categoryName: "Телефоны", variants: [{ memory: "512GB", color: "Silver", region: "eSIM" }] };

test("the reviewed source and scope remain exact, with all agreed markups", () => {
  assert.equal(createHash("sha256").update(input.replace(/\r\n/g, "\n")).digest("hex"), "6dc9fb52d1130367c982d4e0c51cd2782819868ec1678b52f4044bd0843d36b0");
  assert.equal(input.split(/\r?\n/).filter(row => row.trim()).length, 249);
  assert.equal(lines.length, 225);
  assert.equal(lines.filter(line => october27Category(line)).length, 205);
  for (const [prefix, markup] of [["MHFA4", 6000], ["MHQK4", 6000], ["Samsung Galaxy S25", 5000], ["Часы Garmin", 7000], ["Google Fitbit", 1500], ["DJI Osmo", 1500], ["Sony DualSense", 1000], ["Яндекс", 2000]] as const) {
    assert.equal(october27Category(lines.find(line => line.rawLine.startsWith(prefix))!)?.markup, markup);
  }
  assert.equal(october27Category(parsePriceLine("PlayStation 5 Slim Disc 1tb - 65.200₽"))?.markup, 4000);
  assert(lines.every(line => line.parsedPrice !== null && line.parsedPrice > 0));
});

test("condition offers and old refusals cannot silently become ordinary stock", () => {
  assert(!lines.some(line => /Предактив|Актив|мятая|порвано/i.test(line.rawLine)));
  for (const prefix of ["Apple Watch S10", "AirPods Max Silver 2020", "AirPods Max Purple 2024", "iPhone 13 256 Red", "iPhone 15 128 Green", "iPhone 16e 512", "iPad Air 8 13", "iPad Air 7 11", "iPad 11 A16 2025 256 Yellow"]) {
    const line = lines.find(item => item.rawLine.startsWith(prefix));
    assert(line, prefix); assert.equal(october27Category(line), null, prefix);
  }
});

test("new compact supplier formats preserve storage, RAM, finish and explicit SIM", () => {
  for (const prefix of ["MHFG4", "MDHH4", "MDVU4", "MHQK4", "Samsung Galaxy S25", "Samsung Galaxy S26 Ultra 12/512"]) {
    const line = lines.find(item => item.rawLine.startsWith(prefix))!;
    assert.ok(line.parsedMemory, prefix); assert.ok(line.parsedColor, prefix);
  }
  assert.equal(lines.find(line => line.rawLine.startsWith("MHFG4"))?.parsedColor, "Indigo");
  assert.equal(lines.find(line => line.rawLine.startsWith("MDVU4"))?.parsedMemory, "1TB");
  assert.equal(lines.find(line => line.rawLine.startsWith("Samsung Galaxy S25"))?.parsedMemory, "256GB");
  assert.equal(lines.find(line => line.rawLine.startsWith("MHQK4"))?.parsedSku, "MHQK4");
  assert.equal(lines.find(line => line.rawLine.startsWith("iPhone Air 256 Blue 🇨🇳"))?.parsedRegion, "eSIM");
  assert.equal(lines.find(line => line.rawLine.startsWith("iPhone 16e 256 White"))?.parsedRegion, "2 SIM");
});

test("new normal AirPods editions and 1m MagSafe never reprice other editions or 2m", () => {
  const rows = lines.filter(line => /^AirPods (?:4 USB-C|5 -)|^Apple 25W MagSafe/.test(line.rawLine));
  const offers = [
    candidate({ id: "4", productName: "AirPods 4" }),
    candidate({ id: "5", productName: "AirPods 5" }),
    candidate({ id: "wireless", productName: "AirPods 5 Wireless" }),
    candidate({ id: "1m", productSlug: "apple-25w-magsafe-charger-1m-qi22", productName: "Apple 25W MagSafe Charger 1 м (Qi2.2)" }),
    candidate({ id: "2m", productSlug: "apple-25w-magsafe-charger-qi22", productName: "Apple 25W MagSafe Charger 2 м (Qi2.2)" }),
  ];
  assert.deepEqual(Object.fromEntries(planOctober27Prices(rows, offers).changes.map(change => [change.variant.id, change.newPrice])), { "4": 10100, "5": 12700, "1m": 5200 });
});

test("MacBook prices keep CPU, RAM and SSD, including Indigo and duplicate Sky Blue offers", () => {
  const offers = [
    candidate({ id: "m5", productName: "MacBook Air 13-inch (M5)", memory: "16GB / 512GB SSD", color: "Midnight" }),
    candidate({ id: "m4", productName: "MacBook Air 13-inch (M4)", memory: "16GB / 512GB SSD", color: "Midnight" }),
    candidate({ id: "wrong-metadata", productName: "MacBook Air 13-inch (M5)", chip: "M4", memory: "16GB / 512GB SSD", color: "Midnight" }),
    candidate({ id: "ram", productName: "MacBook Air 13-inch (M5)", memory: "24GB / 1TB SSD", color: "Midnight" }),
    candidate({ id: "sky", productName: "MacBook Air 13-inch (M5)", memory: "16GB / 1TB SSD", color: "Sky Blue" }),
    candidate({ id: "neo", productName: "MacBook Neo", memory: "8GB / 512GB SSD", color: "Indigo", region: "A18 Pro · 2026" }),
  ];
  assert.deepEqual(Object.fromEntries(planOctober27Prices(lines, offers).changes.map(change => [change.variant.id, change.newPrice])), { m5: 107700, ram: 147200, sky: 131200, neo: 76200 });
});

test("Neo requires recorded A18 Pro or the exact supplier part number, never an unspecified or A18-only chip", () => {
  const source = lines.find(line => line.rawLine.startsWith("MHFG4"))!;
  const base = candidate({ productName: "MacBook Neo", memory: "8GB / 512GB SSD", color: "Indigo" });
  assert.equal(planOctober27Prices([source], [base]).changes.length, 0);
  assert.equal(planOctober27Prices([source], [{ ...base, chip: "A18" }]).changes.length, 0);
  assert.equal(planOctober27Prices([source], [{ ...base, chip: "A18 Pro" }]).changes[0]?.newPrice, 76200);
  assert.equal(planOctober27Prices([source], [{ ...base, sku: "MHFG4LL/A" }]).changes[0]?.newPrice, 76200);
});

test("latest duplicate offers use the minimum within the same SIM and exclude damaged packaging", () => {
  const offers = [
    candidate({ id: "ipad", productName: "Apple iPad A16 (2025)", productSlug: "ipad-a16", memory: "128GB", color: "Blue", region: "Wi-Fi" }),
    candidate({ id: "esim", productName: "iPhone 18 Pro", memory: "512GB", color: "Black", region: "eSIM" }),
    candidate({ id: "physical", productName: "iPhone 18 Pro", memory: "512GB", color: "Black", region: "SIM+eSIM" }),
    candidate({ id: "ultra", productName: "Apple Watch Ultra 4", memory: "49 мм", color: "Black Titanium", region: "Ocean Band (Translucent Black)" }),
    candidate({ id: "max", productName: "AirPods Max 2", color: "Blue" }),
  ];
  const actual = planOctober27Prices(lines, offers).changes;
  assert.deepEqual(Object.fromEntries(actual.map(change => [change.variant.id, change.newPrice])), { esim: 124900, physical: 134100, ipad: 40600, ultra: 67000, max: 44200 });
});

test("Samsung Silver alias is scoped to the owner-confirmed S25; Fold8 RAM and country stay distinct", () => {
  const rows = lines.filter(line => /^Samsung Galaxy (S25.*Silver|Z Fold)/.test(line.rawLine));
  const offers = [
    candidate({ id: "s25", productName: "Samsung Galaxy S25", memory: "12/256GB", color: "Silver Shadow", region: "IN" }),
    candidate({ id: "fold", productName: "Samsung Galaxy Z Fold8", memory: "12/512GB", color: "Lavender", region: "KR" }),
    candidate({ id: "wrong-ram", productName: "Samsung Galaxy Z Fold8", memory: "16/512GB", color: "Lavender", region: "KR" }),
    candidate({ id: "wrong-edition", productName: "Samsung Galaxy Z Fold8 Ultra", memory: "12/512GB", color: "Lavender", region: "KR" }),
  ];
  assert.deepEqual(Object.fromEntries(planOctober27Prices(rows, offers).changes.map(change => [change.variant.id, change.newPrice])), { s25: 55900, fold: 123200 });
});

test("DJI Standard does not match Adventure; exact other-family markups remain separate", () => {
  const offers = [
    candidate({ id: "standard", productName: "DJI Osmo Action 6", region: "Standard Combo" }),
    candidate({ id: "adventure", productName: "DJI Osmo Action 6", region: "Adventure Combo" }),
    candidate({ id: "garmin", productName: "Garmin Venu X1", color: "Black", sku: "010-02980-02" }),
    candidate({ id: "fitbit", productSlug: "google-fitbit-air", productName: "Google Fitbit Air", color: "Lavender", region: "Стандартная версия" }),
    candidate({ id: "pad", productSlug: "dualsense-edge", productName: "DualSense Edge", color: "White" }),
    candidate({ id: "yandex", productName: "Яндекс Станция Макс", color: "Green" }),
    candidate({ id: "mini", productName: "Mac mini (M6, 2026)", memory: "16GB / 256GB SSD", color: "Silver", region: "M6 · 2026" }),
  ];
  assert.deepEqual(Object.fromEntries(planOctober27Prices(lines, offers).changes.map(change => [change.variant.id, change.newPrice])), { standard: 32700, garmin: 62200, fitbit: 11700, pad: 18500, yandex: 31200, mini: 82700 });
  assert.equal(planOctober27Prices([parsePriceLine("DJI Osmo Action 6 Adventure Combo - 31.200₽")], offers).decisions[0]?.variantId, null);
  for (const raw of ["Часы Garmin Venu X1 Green 010-02980-03 - 55.200₽", "Google Fitbit Air Berry - 10.200₽", "Яндекс Станция Макс Черная - 29.200₽", "Mac Mini 2024 M4 16 256 Silver - 76.700₽"]) {
    assert.equal(planOctober27Prices([parsePriceLine(raw)], offers).changes.length, 0, raw);
  }
});

test("all approved source additions are finite and have official local assets", () => {
  const products = october27ApprovedProducts(input);
  assert.equal(products.length, 11);
  assert.equal(products.find(item => item.slug === "apple-watch-series-12")?.variants.length, 10);
  assert.equal(products.filter(item => /^macbook-air/.test(item.slug)).reduce((sum, item) => sum + item.variants.length, 0), 6);
  for (const source of photoSources) {
    const bytes = readFileSync("public" + source.file);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256);
    assert.ok(bytes.length >= 1000);
  }
});

test("all 44 approved options receive a price and repeat preparation creates no duplicates", () => {
  const requirements = october27ApprovedProducts(input);
  const parents = requirements.filter(item => !item.create).map((item, i) => product({ id: `parent-${i}`, slug: item.slug, name: item.name, brand: item.brand, category: item.category }));
  const prepared = planApprovedPriceCatalog(parents, requirements);
  assert.equal(prepared.operations.filter(operation => operation.kind === "product").length, 6);
  assert.equal(prepared.products.flatMap(item => item.variants).length, 44);
  const offers = prepared.products.flatMap(item => item.variants.map(variant => ({ ...variant, productName: item.name, productSlug: item.slug })));
  assert.equal(planOctober27Prices(lines, offers).changes.length, 44);
  assert.equal(planApprovedPriceCatalog(prepared.products, requirements).operations.length, 0);
});

test("SIM preparation preserves IDs, refuses used generic stock and is idempotent", () => {
  const before = [product({ variants: [option({ memory: "512GB", color: "Silver" })] })];
  const snapshot = structuredClone(before);
  const plan = planApprovedPriceCatalog(before, [requirement]);
  assert.deepEqual(before, snapshot);
  assert.deepEqual(plan.operations, [{ kind: "sim", id: "v", region: "eSIM" }]);
  assert.equal(planApprovedPriceCatalog(plan.products, [requirement]).operations.length, 0);
  for (const patch of [{ price: 100000 }, { inStock: true }, { rawLabel: "supplier" }, { sku: "SKU" }, { orderCount: 1 }]) {
    assert.throws(() => planApprovedPriceCatalog([product({ variants: [option({ memory: "512GB", color: "Silver", ...patch })] })], [requirement]), /использован/);
  }
  assert.throws(() => planApprovedPriceCatalog(before, [requirement], new Set(["v"])), /использован/);
});

test("an additional approved SIM never overwrites the priced other SIM", () => {
  const before = [product({ variants: [option({ memory: "512GB", color: "Silver", region: "SIM+eSIM", price: 148200, inStock: true })] })];
  const plan = planApprovedPriceCatalog(before, [requirement]);
  assert.equal(plan.operations[0].kind, "variant");
  assert.equal(plan.products[0].variants[0].price, 148200);
  assert.equal(plan.products[0].variants[0].region, "SIM+eSIM");
  assert.equal(planApprovedPriceCatalog(plan.products, [requirement]).operations.length, 0);
});

test("duplicate models, duplicate options and occupied SKUs stop the entire preparation", () => {
  assert.throws(() => planApprovedPriceCatalog([product(), product({ id: "duplicate" })], [requirement]), /несколько карточек/);
  assert.throws(() => planApprovedPriceCatalog([product({ variants: [option({ memory: "512GB", color: "Silver", region: "eSIM" }), option({ id: "dup", memory: "512GB", color: "Silver", region: "eSIM" })] })], [requirement]), /дублирующиеся/);
  const skuRequirement = { ...requirement, variants: [{ ...requirement.variants[0], sku: "OTHER" }] };
  assert.throws(() => planApprovedPriceCatalog([product({ variants: [option({ memory: "256GB", color: "Black", sku: "OTHER" })] })], [skuRequirement]), /артикул/);
  assert.throws(() => planApprovedPriceCatalog([], [requirement]), /не найдена/);
});
