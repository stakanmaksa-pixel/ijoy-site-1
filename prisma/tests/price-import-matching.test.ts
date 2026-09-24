import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inactivePreferenceKey,
  normalizedMemory,
  normalizedIphoneSim,
  parsePriceLine,
  supplierIdentityKey,
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

test("legacy raw-label variants still expose model dimensions when columns are blank", () => {
  const legacyVariant = parsePriceLine("iPhone 17 256GB Blue ESIM");
  assert.equal(normalizedMemory(legacyVariant.parsedMemory), normalizedMemory("256"));
  assert.equal(legacyVariant.parsedColor, "Blue");
  assert.equal(normalizedIphoneSim(legacyVariant.parsedRegion, legacyVariant.phoneModel), "eSIM");
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
