import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { approvedSecondSupplierProducts } from "../data/approved-second-supplier";
import {
  appleWatchModel,
  buildAcceptedSupplierMappings,
  buildAcceptedIphoneMappings,
  describeMacBookConfiguration,
  inactivePreferenceKey,
  isPriceOnRequest,
  matchAirPodsMaxVariant,
  matchAppleTv2022Variant,
  matchAppleWatchVariant,
  matchCanonG7Variant,
  matchCirqaBlackVariant,
  matchMacBookVariant,
  matchIPadVariant,
  matchSamsungVariant,
  iphoneOfferMatchKey,
  normalizedMemory,
  normalizedIphoneSim,
  parsePriceLine,
  parsePriceListText,
  supplierIdentityKey,
  uniqueUnspecifiedIphoneVariantId,
} from "../../src/lib/priceImport";

test("the entire second supplier feed is parsed without leaking iPhone headers into other categories", () => {
  const root = path.join(process.cwd(), "prisma", "tests", "fixtures");
  const main = parsePriceListText(readFileSync(path.join(root, "second-supplier-2026-10-02.txt"), "utf8"));
  const dyson = parsePriceListText(readFileSync(path.join(root, "second-supplier-dyson-2026-10-02.txt"), "utf8"));
  assert.equal(main.length, 511);
  assert.equal(dyson.length, 81);
  assert.equal(main.filter((line) => line.phoneModel).length, 219);
  assert.equal(dyson.filter((line) => line.phoneModel).length, 0);
  assert.equal(main.filter((line) => line.parsedPrice === null && !isPriceOnRequest(line.rawLine)).length, 0);
  assert.equal(main.filter((line) => /^(?:от\s*\d+\s*шт|микс\s+от)/iu.test(line.rawLine)).length, 0);

  const delivery = main.find((line) => line.rawLine === "17 Air 256GB Black 🇯🇵 73800 🚚");
  assert.equal(delivery?.parsedPrice, 73800);
  assert.equal(delivery?.phoneModel, "iPhone Air");
  const mac = main.find((line) => line.rawLine.startsWith("MacBook MDHE4 Air 13"));
  assert.equal(mac?.phoneModel, null);
  assert.equal(mac?.parsedMemory, "512GB");
  const request = main.find((line) => line.rawLine.includes("Google Fitbit Air Berry"));
  assert.equal(request?.parsedModel, "Google Fitbit Air Berry");
  assert.equal(request?.parsedPrice, null);
  assert.equal(isPriceOnRequest(request?.rawLine ?? ""), true);
  assert.equal(isPriceOnRequest("Fenix 9 Pro 51mm Black inReach — 0"), true);
  assert.equal(dyson.find((line) => line.rawLine.includes("Dyson V8 Absolute SV25 (Silver Yellow) -25.500"))?.parsedPrice, 25500);
});

test("old iPhone SIM rules do not bleed into generation 18, and Chinese 16e follows owner confirmation", () => {
  assert.equal(parsePriceLine("15 128GB Black 🇮🇳 53800").parsedRegion, "SIM+eSIM");
  assert.equal(parsePriceLine("16e 256GB Black 🇨🇳 44500").parsedRegion, "2 SIM");
  assert.equal(parsePriceLine("18 Pro 256 Black 🇮🇳 120000").parsedRegion, null);
  assert.equal(parsePriceLine("18 Pro 256 Black 🇦🇪 eSim - 120000").parsedRegion, "eSIM");
});

test("Samsung matching keeps model, capacity, finish and country distinct", () => {
  const line = parsePriceLine("S26 Ultra 12/512Gb (SM-S948B) Cobalt Violet 🇵🇦 - 91400₽");
  const candidates = [
    { id: "right", productName: "Samsung Galaxy S26 Ultra", memory: "12/512GB", color: "Cobalt Violet", region: "PA", rawLabel: null },
    { id: "wrong-country", productName: "Samsung Galaxy S26 Ultra", memory: "12/512GB", color: "Cobalt Violet", region: "RU", rawLabel: null },
    { id: "wrong-color", productName: "Samsung Galaxy S26 Ultra", memory: "12/512GB", color: "Black", region: "PA", rawLabel: null },
    { id: "wrong-model", productName: "Samsung Galaxy S26", memory: "12/512GB", color: "Cobalt Violet", region: "PA", rawLabel: null },
  ];
  assert.equal(matchSamsungVariant(line, candidates), "right");
  assert.equal(matchSamsungVariant(line, [{ ...candidates[0]!, id: "a" }, { ...candidates[0]!, id: "b" }]), null);
  assert.equal(parsePriceLine("S25 FE 5G 8/128Gb (SM-S731B) JetBlack 🇮🇳 - 37400₽").parsedColor, "Jet Black");
});

test("Canon Graphite is the existing Black variant, not a new finish", () => {
  const line = parsePriceLine("Canon PowerShot G7 X Mark III (Graphite) -120.500");
  const candidates = [
    { id: "black", productName: "Canon PowerShot G7 X Mark III", memory: null, color: "Black", region: "Стандартная версия", rawLabel: null },
    { id: "silver", productName: "Canon PowerShot G7 X Mark III", memory: null, color: "Silver", region: "Русский язык", rawLabel: null },
  ];
  assert.equal(matchCanonG7Variant(line, candidates), "black");
  assert.equal(matchCanonG7Variant(line, [candidates[0]!, { ...candidates[0]!, id: "other-black" }]), null);
});

test("Series 12 case color is not replaced by its differently colored band", () => {
  const line = parsePriceLine("Apple Watch S12 46 Space Gray AC Navy Blue Sport Band S/M MJEH4 44000");
  assert.equal(line.parsedColor, "Space Gray");
  const candidates = [
    { id: "right", productName: "Apple Watch Series 12", memory: "46 мм", color: "Space Gray", region: "Sport Band S/M", rawLabel: null },
    { id: "wrong-size", productName: "Apple Watch Series 12", memory: "46 мм", color: "Space Gray", region: "Sport Band M/L", rawLabel: null },
    { id: "wrong-finish", productName: "Apple Watch Series 12", memory: "46 мм", color: "Black", region: "Sport Band S/M", rawLabel: null },
  ];
  assert.equal(matchAppleWatchVariant(line, candidates), "right");
});

test("Space Gray remains distinct from plain Gray in tablet offers", () => {
  assert.equal(parsePriceLine("iPad Air 8 11 128GB Space Gray Wi-Fi MH304 60000").parsedColor, "Space Gray");
});

test("approved product additions exclude Fold 7 and unresolved CIRQA colors", () => {
  const root = path.join(process.cwd(), "prisma", "tests", "fixtures");
  const products = approvedSecondSupplierProducts(
    readFileSync(path.join(root, "second-supplier-2026-10-02.txt"), "utf8"),
    readFileSync(path.join(root, "second-supplier-dyson-2026-10-02.txt"), "utf8"),
  );
  assert.equal(products.some((product) => /fold\s*7/i.test(product.name)), false);
  const macbook = products.find((product) => product.slug === "macbook-pro-16-m5");
  assert.equal(macbook?.name, "MacBook Pro 16-inch (M5)");
  assert.equal(macbook?.variants[0]?.memory, "36GB / 2TB SSD");
  const cirqa = products.find((product) => product.name === "Garmin CIRQA Smart Band");
  assert.deepEqual(cirqa?.variants.map((variant) => variant.region).sort(), ["L/XL", "S/M"]);
  assert.deepEqual(cirqa?.variants.map((variant) => variant.color), ["Black", "Black"]);
  const series12 = products.find((product) => product.slug === "apple-watch-series-12");
  assert.equal(series12?.variants.length, 4);
  assert(series12?.variants.some((variant) =>
    variant.memory === "46 мм" && variant.color === "Space Gray" &&
    variant.region === "Navy Blue Sport Band S/M",
  ));
  const aura = products.find((product) => product.name === "Harman Kardon Aura Studio 5");
  assert.equal(aura?.variants.some((variant) => variant.color === "White"), true);
});

test("only the approved black CIRQA strap sizes match automatically", () => {
  const candidates = [
    { id: "sm", productName: "Garmin CIRQA Smart Band", memory: null, color: "Black", region: "S/M", rawLabel: null },
    { id: "lxl", productName: "Garmin CIRQA Smart Band", memory: null, color: "Black", region: "L/XL", rawLabel: null },
    { id: "old", productName: "Garmin CIRQA Smart Band", memory: null, color: "Black", region: null, rawLabel: null },
  ];
  assert.equal(matchCirqaBlackVariant(parsePriceLine("Cirqa Black S-M — 27 500"), candidates), "sm");
  assert.equal(matchCirqaBlackVariant(parsePriceLine("Cirqa Black L-XL — 29 000"), candidates), "lxl");
  assert.equal(matchCirqaBlackVariant(parsePriceLine("Cirqa Gray S-M — 27 500"), candidates), null);
  assert.equal(matchCirqaBlackVariant(parsePriceLine("Cirqa Mauve (RED) L-XL — 23 700"), candidates), null);
});

test("MacBook matching checks chip, RAM, SSD, display size and color", () => {
  const source = parsePriceLine("MacBook MDHE4 Air 13 Midnight (M5, 16GB, 512GB) 2026 115500 🚚");
  const candidates = [
    { id: "right", productName: "MacBook Air 13-inch (M5)", memory: "16GB / 512GB SSD", color: "Midnight", region: null, rawLabel: null },
    { id: "wrong-chip", productName: "MacBook Air 13-inch (M4)", memory: "16GB / 512GB SSD", color: "Midnight", region: null, rawLabel: null },
    { id: "wrong-size", productName: "MacBook Air 15-inch (M5)", memory: "16GB / 512GB SSD", color: "Midnight", region: null, rawLabel: null },
    { id: "wrong-ram", productName: "MacBook Air 13-inch (M5)", memory: "24GB / 512GB SSD", color: "Midnight", region: null, rawLabel: null },
    { id: "wrong-ssd", productName: "MacBook Air 13-inch (M5)", memory: "16GB / 1TB SSD", color: "Midnight", region: null, rawLabel: null },
  ];
  assert.equal(source.parsedMemory, "512GB");
  assert.equal(matchMacBookVariant(source, candidates), "right");
  const max = parsePriceLine("MacBook MGED4 Pro 16 Space Black (M5 Max,36GB,2TB)2026 324000");
  assert.equal(matchMacBookVariant(max, [{
    id: "max", productName: "MacBook Pro 16-inch (M5)", memory: "36GB / 2TB SSD",
    color: "Space Black", region: "M5 Max · 2026", rawLabel: null,
  }]), "max");
  const neo = parsePriceLine("MacBook MHFE4 Neo Citrus (A18, 8GB, 512GB) 2026 68500 🚚");
  assert.equal(matchMacBookVariant(neo, [{
    id: "neo", productName: "MacBook Neo", memory: "8GB / 512GB SSD",
    color: "Citrus", region: null, rawLabel: null,
  }]), "neo");
});

test("MacBook preview names the chip and RAM instead of showing only 13 and 512GB", () => {
  const line = parsePriceLine("MDHE4 MacBook Air 13 2026 M5 16 512 Midnight HK - 114.300₽");
  const source = describeMacBookConfiguration(line.parsedModel, line.parsedMemory, line.parsedColor);
  assert.equal(source?.label, "MacBook Air 13″ · M5 · 16 ГБ ОЗУ · 512GB SSD · Midnight");
  const catalog = describeMacBookConfiguration("MacBook Air 13", "512GB", "Midnight");
  assert.match(catalog?.label ?? "", /чип не указан · ОЗУ не указано/);
  const fullCatalog = describeMacBookConfiguration("MacBook Air 13-inch (M5)", "16GB \/ 512GB SSD", "Midnight");
  assert.match(fullCatalog?.label ?? "", /M5 · 16 ГБ ОЗУ · 512GB SSD/);
});

test("iPad matching respects chip generation, size, finish and Wi-Fi versus LTE", () => {
  const source = parsePriceLine("iPad Air 8 11 128GB Space Gray Wi-Fi MH304 60000");
  const candidates = [
    { id: "right", productName: "iPad Air 11-inch (M4)", memory: "128GB", color: "Space Gray", region: null, rawLabel: null },
    { id: "wrong-chip", productName: "iPad Air 11-inch (M3)", memory: "128GB", color: "Space Gray", region: null, rawLabel: null },
    { id: "wrong-size", productName: "iPad Air 13-inch (M4)", memory: "128GB", color: "Space Gray", region: null, rawLabel: null },
    { id: "wrong-storage", productName: "iPad Air 11-inch (M4)", memory: "256GB", color: "Space Gray", region: null, rawLabel: null },
    { id: "wrong-color", productName: "iPad Air 11-inch (M4)", memory: "128GB", color: "Blue", region: null, rawLabel: null },
    { id: "wrong-radio", productName: "iPad Air 11-inch (M4)", memory: "128GB", color: "Space Gray", region: "LTE", rawLabel: null },
  ];
  assert.equal(matchIPadVariant(source, candidates), "right");
  assert.equal(matchIPadVariant(parsePriceLine("iPad Air 8 11 128GB Space Gray LTE MH304 60000"), [candidates[0]!]), null);
  const base = parsePriceLine("iPad 11 128GB Silver Wi-Fi (2025) 40500");
  assert.equal(matchIPadVariant(base, [{
    id: "base", productName: "iPad (A16)", memory: "128GB", color: "Silver", region: null, rawLabel: null,
  }]), "base");
});

test("Apple TV 4K 64 GB from 2022 maps to the existing third generation", () => {
  const line = parsePriceLine("Apple TV 4K 64Gb (MN873) 2022 -19.200");
  const candidates = [
    { id: "64", productName: "Apple TV 4K (3-го поколения)", memory: "64GB", color: null, region: null, rawLabel: null },
    { id: "128", productName: "Apple TV 4K (3-го поколения)", memory: "128GB", color: null, region: null, rawLabel: null },
  ];
  assert.equal(matchAppleTv2022Variant(line, candidates), "64");
  assert.equal(matchAppleTv2022Variant(parsePriceLine("Apple TV 4K 64Gb 2021 -19.200"), candidates), null);
});

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

test("Apple Watch offers match on generation, case, finish and strap instead of requiring SKU equality", () => {
  const line = parsePriceLine("Apple Watch S10 42 Jet Black S/M MWWF3 🇺🇸 - 26.200₽");
  assert.equal(line.parsedMemory, "42 мм");
  assert.equal(line.parsedColor, "Jet Black");
  assert.equal(line.parsedRegion, "S/M");
  assert.equal(line.parsedSku, "MWWF3");
  assert.equal(appleWatchModel("Apple Watch Series 10"), "Apple Watch Series 10");

  const candidates = [
    { id: "right", productName: "Apple Watch Series 10", memory: "42 мм", color: "Jet Black", region: "Sport Band (Black) S/M", rawLabel: null },
    { id: "wrong-fit", productName: "Apple Watch Series 10", memory: "42 мм", color: "Jet Black", region: "Sport Band (Black) M/L", rawLabel: null },
    { id: "wrong-model", productName: "Apple Watch Series 11", memory: "42 мм", color: "Jet Black", region: "Sport Band (Black) S/M", rawLabel: null },
  ];
  assert.equal(matchAppleWatchVariant(line, candidates), "right");
});

test("Apple Watch matching preserves Denim and Loop strap distinctions and refuses ambiguity", () => {
  const denim = parsePriceLine("Apple Watch S10 42 Silver Denim M/L MWWC3 🇺🇸 - 26.200₽");
  const loop = parsePriceLine("Apple Watch S10 42 Silver Loop MWWD3 🇺🇸 - 26.200₽");
  const candidates = [
    { id: "denim", productName: "Apple Watch Series 10", memory: "42 мм", color: "Silver", region: "Silver Denim M/L", rawLabel: null },
    { id: "loop", productName: "Apple Watch Series 10", memory: "42 мм", color: "Silver", region: "Milanese Loop", rawLabel: null },
  ];
  assert.equal(matchAppleWatchVariant(denim, candidates), "denim");
  assert.equal(matchAppleWatchVariant(loop, candidates), "loop");
  assert.equal(matchAppleWatchVariant(loop, [candidates[1]!, { ...candidates[1]!, id: "loop-duplicate" }]), null);
});

test("Apple Watch Ultra rows match the exact titanium finish and band descriptor", () => {
  const line = parsePriceLine("Apple Watch Ultra 4 49 Black Ocean Band Translucent Black MJAY4 🇦🇺 - 77.700₽");
  const candidates = [
    { id: "black-band", productName: "Apple Watch Ultra 4", memory: "49 мм", color: "Black Titanium", region: "Ocean Band (Translucent Black)", rawLabel: null },
    { id: "black-gray-band", productName: "Apple Watch Ultra 4", memory: "49 мм", color: "Black Titanium", region: "Ocean Band (Translucent Gray)", rawLabel: null },
    { id: "natural-band", productName: "Apple Watch Ultra 4", memory: "49 мм", color: "Natural Titanium", region: "Ocean Band (Translucent Black)", rawLabel: null },
  ];
  assert.equal(matchAppleWatchVariant(line, candidates), "black-band");
});

test("watch matching does not ignore an unavailable strap fit or case-size mismatch", () => {
  const line = parsePriceLine("Apple Watch S12 42 Space Gray M/L MJE94 🇮🇳 - 43.200₽");
  const currentOptions = [
    { id: "42-sm", productName: "Apple Watch Series 12", memory: "42 мм", color: "Space Gray", region: "Navy Blue Sport Band S/M", rawLabel: null },
    { id: "46-ml", productName: "Apple Watch Series 12", memory: "46 мм", color: "Space Gray", region: "Navy Blue Sport Band M/L", rawLabel: null },
  ];
  assert.equal(matchAppleWatchVariant(line, currentOptions), null);
});

test("AirPods Max matching keeps 2020 Lightning, 2024 USB-C and Max 2 as separate editions", () => {
  const starlight = parsePriceLine("AirPods Max Starlight 2024 USB-C - 38.200₽");
  const purple = parsePriceLine("AirPods Max Purple 2024 USB-C - 38.200₽");
  const candidates = [
    { id: "starlight-2020", productName: "AirPods Max", memory: null, color: "Starlight", region: "Lightning", rawLabel: null },
    { id: "starlight-2024", productName: "AirPods Max", memory: null, color: "Starlight", region: "USB-C", rawLabel: null },
    { id: "purple-2024", productName: "AirPods Max", memory: null, color: "Purple", region: "USB-C", rawLabel: null },
    { id: "purple-max-2", productName: "AirPods Max 2", memory: null, color: "Purple", region: "USB-C", rawLabel: null },
  ];
  assert.equal(matchAirPodsMaxVariant(starlight, candidates), "starlight-2024");
  assert.equal(matchAirPodsMaxVariant(purple, candidates), "purple-2024");
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
