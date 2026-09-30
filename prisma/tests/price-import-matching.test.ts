import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAcceptedSupplierMappings,
  buildAcceptedIphoneMappings,
  inactivePreferenceKey,
  iphoneOfferMatchKey,
  normalizedMemory,
  normalizedIphoneSim,
  parsePriceLine,
  parsePriceListText,
  supplierIdentityKey,
  uniqueUnspecifiedIphoneVariantId,
} from "../../src/lib/priceImport";

test("supplier country is used to infer SIM but does not distinguish the site variant", () => {
  const japan = parsePriceLine("iPhone 17 Pro Max 1TB Blue JP eSIM - 134.200₽");
  const kuwait = parsePriceLine("iPhone 17 Pro Max 1TB Blue KW eSIM - 134.100₽");

  assert.equal(japan.parsedMemory, "1TB");
  assert.equal(japan.parsedColor, "Blue");
  assert.equal(japan.parsedRegion, "eSIM");
  assert.equal(normalizedIphoneSim(japan.parsedRegion, japan.phoneModel), "eSIM");
  assert.equal(normalizedIphoneSim(kuwait.parsedRegion, kuwait.phoneModel), "eSIM");
});

test("iPhone 18 Pro 512 Black AE eSIM row is parsed into the expected exact configuration", () => {
  const row = parsePriceLine("iPhone 18 Pro 512 Black AE eSim - 152.200₽");
  assert.equal(row.phoneModel, "iPhone 18 Pro");
  assert.equal(row.parsedMemory, "512GB");
  assert.equal(row.parsedColor, "Black");
  assert.equal(row.parsedRegion, "eSIM");
  assert.equal(row.parsedPrice, 152200);
});

test("explicit SIM types remain distinct across markets", () => {
  const esim = parsePriceLine("iPhone 17 Pro Max 1TB Blue JP eSIM - 134.200₽");
  const physicalAndEsim = parsePriceLine("iPhone 17 Pro Max 1TB Blue KR 1 SIM + eSIM - 159.200₽");

  assert.equal(normalizedIphoneSim(esim.parsedRegion, esim.phoneModel), "eSIM");
  assert.equal(normalizedIphoneSim(physicalAndEsim.parsedRegion, physicalAndEsim.phoneModel), "SIM+eSIM");
  assert.equal(physicalAndEsim.parsedRegion, "SIM+eSIM");
  assert.equal(normalizedIphoneSim("SIM_ESIM", physicalAndEsim.phoneModel), "SIM+eSIM");
});

test("memory values saved with or without the unit share a canonical key", () => {
  assert.equal(normalizedMemory("256"), normalizedMemory("256GB"));
  assert.equal(normalizedMemory("1 TB"), normalizedMemory("1TB"));
});

test("collector source boundary prevents a header from another channel leaking into this price row", () => {
  const rows = parsePriceListText(
    "iPhone 17\n256 Blue - 77.200₽\n[[PRICE_SOURCE_BOUNDARY]]\n256 Blue - 78.100₽",
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[0].phoneModel, "iPhone 17");
  assert.equal(rows[1].phoneModel, null);
});

test("Cartel-style section headings preserve eSIM while condition-marked offers are skipped", () => {
  const rows = parsePriceListText([
    "📲 iPhone 18 Pro (eSim)",
    "🇦🇪 18 Pro 256 Silver (eSim) - 124.000 (НЕАКТИВ)",
    "18 Pro 512 Black (eSim) - 153.000 (НЕАКТИВ)",
    "18 Pro 256 Black (eSim) - 125.000 (предактив, запак)",
    "iPhone 18 Pro",
    "18 Pro 256 Black - 124.000 (предактив, запак)",
    "18 Pro 256 Black - 155.000 (НЕАКТИВ)",
  ].join("\n"));

  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.parsedPrice), [124000, 153000, 155000]);
  assert.deepEqual(rows.map((row) => row.parsedRegion), ["eSIM", "eSIM", null]);
  assert.deepEqual(rows.map((row) => row.nonActive), [true, true, true]);
  assert.deepEqual(rows.map((row) => row.phoneModel), ["iPhone 18 Pro", "iPhone 18 Pro", "iPhone 18 Pro"]);
});

test("supplier country and a section heading do not replace an explicit SIM configuration", () => {
  const rows = parsePriceListText([
    "iPhone 18 Pro Max (eSim)",
    "18 Pro Max 256 Silver 🇯🇵 eSim - 151.000 (НЕАКТИВ)",
    "18 Pro Max 256 Burgundy 🇮🇳 1 Sim + eSim - 168.000 (НЕАКТИВ)",
  ].join("\n"));
  assert.deepEqual(rows.map((row) => row.parsedRegion), ["eSIM", "SIM+eSIM"]);
});

test("legacy raw-label variants still expose model dimensions when columns are blank", () => {
  const legacyVariant = parsePriceLine("iPhone 17 256GB Blue ESIM");
  assert.equal(normalizedMemory(legacyVariant.parsedMemory), normalizedMemory("256"));
  assert.equal(legacyVariant.parsedColor, "Blue");
  assert.equal(normalizedIphoneSim(legacyVariant.parsedRegion, legacyVariant.phoneModel), "eSIM");
});

test("explicit SIM maps to a sole legacy variant with unspecified SIM, but never guesses across variants", () => {
  assert.equal(uniqueUnspecifiedIphoneVariantId(
    [{ id: "legacy", region: null, rawLabel: null }],
    "iPhone 18 Pro",
  ), "legacy");
  assert.equal(uniqueUnspecifiedIphoneVariantId(
    [{ id: "esim", region: "eSIM", rawLabel: null }],
    "iPhone 18 Pro",
  ), null);
  assert.equal(uniqueUnspecifiedIphoneVariantId(
    [
      { id: "legacy", region: null, rawLabel: null },
      { id: "esim", region: "eSIM", rawLabel: null },
    ],
    "iPhone 18 Pro",
  ), null);
});

test("the remaining iPhone 18 Pro Max Glacier and Black offers map only to a sole SIM-unspecified variant", () => {
  const glacier = parsePriceLine("iPhone 18 Pro Max 1Tb Glacier 1 Sim + eSim - 222.200₽");
  const black = parsePriceLine("iPhone 18 Pro Max 2Tb Black AE eSim - 280.200₽");

  assert.equal(glacier.phoneModel, "iPhone 18 Pro Max");
  assert.equal(glacier.parsedMemory, "1TB");
  assert.equal(glacier.parsedColor, "Glacier");
  assert.equal(glacier.parsedRegion, "SIM+eSIM");
  assert.equal(glacier.parsedPrice, 222200);
  assert.equal(uniqueUnspecifiedIphoneVariantId(
    [{ id: "glacier-1tb", region: null, rawLabel: null }], glacier.phoneModel!,
  ), "glacier-1tb");

  assert.equal(black.phoneModel, "iPhone 18 Pro Max");
  assert.equal(black.parsedMemory, "2TB");
  assert.equal(black.parsedColor, "Black");
  assert.equal(black.parsedRegion, "eSIM");
  assert.equal(black.parsedPrice, 280200);
  assert.equal(uniqueUnspecifiedIphoneVariantId(
    [{ id: "black-2tb", region: null, rawLabel: null }], black.phoneModel!,
  ), "black-2tb");
});

test("inactive-price preference groups equivalent SIM offers independently of country", () => {
  const inactiveJapan = parsePriceLine("iPhone 17 Pro Max 1TB Blue JP eSIM (НЕАКТИВ) - 134.200₽");
  const activeKuwait = parsePriceLine("iPhone 17 Pro Max 1TB Blue KW eSIM - 134.100₽");

  assert.equal(inactivePreferenceKey(inactiveJapan), inactivePreferenceKey(activeKuwait));
});

test("supplier identity ignores country and Apple part-number changes, but keeps watch configuration axes", () => {
  const watchUs = "Apple Watch S11 42 Jet Black S/M MEQT4 🇺🇸";
  const watchEu = "Apple Watch Series 11 42 Jet Black S/M MEQW4 🇪🇺";
  const watchDifferentBand = "Apple Watch Series 11 42 Jet Black M/L MEQU4 🇺🇸";
  assert.equal(supplierIdentityKey(watchUs), supplierIdentityKey(watchEu));
  assert.notEqual(supplierIdentityKey(watchUs), supplierIdentityKey(watchDifferentBand));
});

test("supplier identity ignores accessory country while retaining product qualifiers", () => {
  const singapore = "Apple 40-60W Dynamic Power USB-C 🇸🇬";
  const europe = "Apple 40-60W Dynamic Power USB-C 🇪🇺";
  assert.equal(supplierIdentityKey(singapore), supplierIdentityKey(europe));
  assert.notEqual(
    supplierIdentityKey("Apple 20W Adapter Copy"),
    supplierIdentityKey("Apple 20W Adapter"),
  );
});

test("supplier identity handles country-specific Apple part numbers in tablets and MacBooks", () => {
  const ipadUs = "iPad 11 A16 2025 256 Blue Wi-Fi MD4H4 🇺🇸";
  const ipadHk = "iPad 11 A16 2025 256 Blue Wi-Fi MD4K4 🇭🇰";
  const macThailand = "MHFH4 MacBook Neo 13 2026 A18 Pro 8 256 Blush 🇹🇭";
  const macIndia = "MHFJ4 MacBook Neo 13 2026 A18 Pro 8 256 Blush 🇮🇳";
  assert.equal(supplierIdentityKey(ipadUs), supplierIdentityKey(ipadHk));
  assert.equal(supplierIdentityKey(macThailand), supplierIdentityKey(macIndia));
});

test("admin-confirmed non-iPhone supplier identities are learned without country, SKU or condition notes", () => {
  const learned = buildAcceptedSupplierMappings([
    { sourceLabel: "Apple Watch S11 42 Space Gray M/L MEQX4 🇺🇸", variantId: "watch" },
    { sourceLabel: "Apple Watch S11 42 Space Gray M/L MEQX4 🇦🇺", variantId: "watch" },
    { sourceLabel: "AirPods Pro 3", variantId: "pods" },
    { sourceLabel: "iPhone 17 256 Black JP eSIM", variantId: "iphone" },
  ]);

  assert.equal(learned.get(supplierIdentityKey("Apple Watch Series 11 42 Space Gray M/L 🇪🇺 (Порвано ушко)")!), "watch");
  assert.equal(learned.get(supplierIdentityKey("AirPods Pro 3 🇺🇸")!), "pods");
  assert.equal(learned.has(supplierIdentityKey("iPhone 17 256 Black JP eSIM")!), false);
  assert.notEqual(supplierIdentityKey("AirPods 5"), supplierIdentityKey("AirPods 5 Wireless"));
});

test("conflicting confirmed supplier mappings remain unresolved", () => {
  const learned = buildAcceptedSupplierMappings([
    { sourceLabel: "Apple 40-60W Dynamic Power USB-C 🇸🇬", variantId: "one" },
    { sourceLabel: "Apple 40-60W Dynamic Power USB-C 🇪🇺", variantId: "two" },
  ]);

  assert.equal(learned.has(supplierIdentityKey("Apple 40-60W Dynamic Power USB-C 🇰🇷")!), false);
});

test("requested product families remain importable and condition-marked offers are excluded", () => {
  const rows = parsePriceListText([
    "Apple Watch S10 42 Jet Black S/M MWW3 🇺🇸 - 26.200₽",
    "Mac Studio 2025 M4 Max 36 512 Silver 🇺🇸 - 270.200₽",
    "Часы Garmin Venu X1 Black 010-02980-02 - 55.200₽",
    "Яндекс Алиса Дуо Макс Черная - 44.200₽",
    "AirPods 5 - 12.400₽",
    "AirPods 5 Wireless - 15.500₽",
  ].join("\n"));

  assert.equal(rows.length, 6);
  assert.deepEqual(rows.map((row) => row.parsedPrice), [26200, 270200, 55200, 44200, 12400, 15500]);
  assert.notEqual(supplierIdentityKey(rows[4].parsedModel), supplierIdentityKey(rows[5].parsedModel));

  const conditionRows = parsePriceListText([
    "iPhone 16 128 Black 🇮🇳 (Актив, новый, запечатанный) - 59.900₽",
    "Apple Watch SE3 40 Starlight 2025 S/M MEH34 🇺🇸 (мятое ушко) - 19.900₽",
    "iPad Air 8 11 M4 256 Purple Wi-Fi MH394 🇭🇰 (Чуть мятая коробка) - 71.200₽",
    "iPhone 16 Pro 256 White 🇺🇸 (Demo, перепрошитая, новая) - 84.700₽",
  ].join("\n"));
  assert.equal(conditionRows.length, 0);
});

test("an admin-confirmed iPhone mapping is reused across supplier countries but not across SIM types", () => {
  const learned = buildAcceptedIphoneMappings([
    { model: "iPhone 17 Pro Max", memory: "1TB", color: "Blue", region: "JP · eSIM", variantId: "esim-variant" },
    { model: "iPhone 17 Pro Max", memory: "1 TB", color: "Blue", region: "KW · eSIM", variantId: "esim-variant" },
    { model: "iPhone 17 Pro Max", memory: "1TB", color: "Blue", region: "SIM+eSIM", variantId: "physical-esim-variant" },
  ]);
  assert.equal(learned.get(iphoneOfferMatchKey("iPhone 17 Pro Max", "1TB", "Blue", "eSIM")!), "esim-variant");
  assert.equal(learned.get(iphoneOfferMatchKey("iPhone 17 Pro Max", "1TB", "Blue", "SIM+eSIM")!), "physical-esim-variant");
});

test("conflicting admin-confirmed mappings are not auto-learned", () => {
  const learned = buildAcceptedIphoneMappings([
    { model: "iPhone 17", memory: "256GB", color: "Blue", region: "eSIM", variantId: "variant-a" },
    { model: "iPhone 17", memory: "256GB", color: "Blue", region: "eSIM", variantId: "variant-b" },
  ]);
  assert.equal(learned.get(iphoneOfferMatchKey("iPhone 17", "256", "Blue", "eSIM")!), undefined);
});

test("learned mappings keep inactive offers separate from regular offers", () => {
  const learned = buildAcceptedIphoneMappings([
    { model: "iPhone 17", memory: "256GB", color: "Blue", region: "eSIM", variantId: "regular" },
    { model: "iPhone 17", memory: "256GB", color: "Blue", region: "eSIM", nonActive: true, variantId: "inactive" },
  ]);
  assert.equal(learned.get(iphoneOfferMatchKey("iPhone 17", "256GB", "Blue", "eSIM")!), "regular");
  assert.equal(learned.get(iphoneOfferMatchKey("iPhone 17", "256GB", "Blue", "eSIM", true)!), "inactive");
});
