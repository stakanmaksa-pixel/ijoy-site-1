import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inactivePreferenceKey,
  normalizedMemory,
  normalizedIphoneSim,
  parsePriceLine,
} from "../../src/lib/priceImport";

test("supplier country is used to infer SIM but does not distinguish the site variant", () => {
  const japan = parsePriceLine("iPhone 17 Pro Max 1TB Blue JP eSIM - 134.200₽");
  const kuwait = parsePriceLine("iPhone 17 Pro Max 1TB Blue KW eSIM - 134.100₽");

  assert.equal(japan.parsedMemory, "1TB");
  assert.equal(japan.parsedColor, "Blue");
  assert.equal(normalizedIphoneSim(japan.parsedRegion, japan.phoneModel), "eSIM");
  assert.equal(normalizedIphoneSim(kuwait.parsedRegion, kuwait.phoneModel), "eSIM");
});

test("explicit SIM types remain distinct across markets", () => {
  const esim = parsePriceLine("iPhone 17 Pro Max 1TB Blue JP eSIM - 134.200₽");
  const physicalAndEsim = parsePriceLine("iPhone 17 Pro Max 1TB Blue KR 1 SIM + eSIM - 159.200₽");

  assert.equal(normalizedIphoneSim(esim.parsedRegion, esim.phoneModel), "eSIM");
  assert.equal(normalizedIphoneSim(physicalAndEsim.parsedRegion, physicalAndEsim.phoneModel), "SIM+eSIM");
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
