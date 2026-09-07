import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { getCompatibleAccessoryBundle } from "../../src/lib/compatibleAccessories";
import {
  getSamsungPhoneMenuGroup,
  isAllowedSamsungPhone,
  SAMSUNG_PHONE_MENU_GROUPS,
} from "../../src/lib/samsungPhones";
import {
  APPLE_KEYBOARD_ASSETS,
  APPLE_KEYBOARD_CATALOG,
} from "../data/apple-keyboard-catalog";

test("five current iPad keyboards, nine variants, Store77 prices and official local photos are present", async () => {
  assert.equal(APPLE_KEYBOARD_CATALOG.length, 5);
  const variants = APPLE_KEYBOARD_CATALOG.flatMap((product) => product.variants);
  assert.equal(variants.length, 9);
  assert.equal(new Set(APPLE_KEYBOARD_CATALOG.map((product) => product.slug)).size, 5);
  assert.equal(new Set(variants.map((variant) => variant.rawLabel)).size, 9);

  const priceByLabel = new Map(variants.map((variant) => [variant.rawLabel, variant.price]));
  assert.equal(priceByLabel.get("Magic Keyboard для iPad Pro 11″ M5 (Белая)"), 38710);
  assert.equal(priceByLabel.get("Magic Keyboard для iPad Pro 13″ M5 (Чёрная)"), 40500);
  assert.equal(priceByLabel.get("Magic Keyboard для iPad Air 11″ M4 (Чёрная)"), 40010);
  assert.equal(priceByLabel.get("Magic Keyboard Folio для iPad A16 (Белая)"), 36000);

  for (const photo of Object.values(APPLE_KEYBOARD_ASSETS)) {
    await access(fileURLToPath(new URL(`../../public${photo}`, import.meta.url)));
  }
});

test("each current iPad recommends only its matching Pencil and keyboard", () => {
  assert.deepEqual(getCompatibleAccessoryBundle("ipad-pro-11-m5")?.slugs, [
    "apple-pencil-pro",
    "magic-keyboard-ipad-pro-11-m5",
  ]);
  assert.deepEqual(getCompatibleAccessoryBundle("ipad-pro-13-m5")?.slugs, [
    "apple-pencil-pro",
    "magic-keyboard-ipad-pro-13-m5",
  ]);
  assert.deepEqual(getCompatibleAccessoryBundle("ipad-air-11-m4")?.slugs, [
    "apple-pencil-pro",
    "magic-keyboard-ipad-air-11-m4",
  ]);
  assert.deepEqual(getCompatibleAccessoryBundle("ipad-air-13-m4")?.slugs, [
    "apple-pencil-pro",
    "magic-keyboard-ipad-air-13-m4",
  ]);
  assert.deepEqual(getCompatibleAccessoryBundle("ipad-a16")?.slugs, [
    "apple-pencil-usb-c",
    "magic-keyboard-folio-ipad-a16",
  ]);

  const mini = getCompatibleAccessoryBundle("ipad-mini-a17-pro");
  assert.deepEqual(mini?.slugs, ["apple-pencil-pro"]);
  assert(mini?.description.includes("Magic Keyboard"));
});

test("Samsung menu has exactly the agreed 17 groups and never folds special models into generic S lines", () => {
  assert.deepEqual(
    SAMSUNG_PHONE_MENU_GROUPS.map((group) => group.label),
    [
      "Samsung Galaxy S26 Ultra",
      "Samsung Galaxy S26/S26+",
      "Samsung Galaxy S26 FE",
      "Samsung Galaxy S25 Ultra",
      "Samsung Galaxy S25 Edge",
      "Samsung Galaxy S25/S25+",
      "Samsung Galaxy S25 FE",
      "Samsung Galaxy Z Fold8 Ultra",
      "Samsung Galaxy Z Fold8",
      "Samsung Galaxy Z Flip8",
      "Samsung Galaxy Fold7/Flip7",
      "Samsung Galaxy Z Flip7 FE",
      "Samsung Galaxy A57",
      "Samsung Galaxy A56",
      "Samsung Galaxy A27/A37",
      "Samsung Galaxy A26/A36",
      "Samsung Galaxy A07/A17",
    ],
  );

  const cases: Array<[string, string, string | null]> = [
    ["Samsung Galaxy S26 Ultra", "samsung-galaxy-s26-ultra", "Samsung Galaxy S26 Ultra"],
    ["Samsung Galaxy S26+", "samsung-galaxy-s26-plus", "Samsung Galaxy S26/S26+"],
    ["Samsung Galaxy S26 FE", "samsung-galaxy-s26-fe", "Samsung Galaxy S26 FE"],
    ["Samsung Galaxy S25 Edge", "samsung-galaxy-s25-edge", "Samsung Galaxy S25 Edge"],
    ["Samsung Galaxy S25 FE 5G", "samsung-galaxy-s25-fe", "Samsung Galaxy S25 FE"],
    ["Samsung Galaxy Z Fold8 Ultra", "samsung-galaxy-z-fold8-ultra", "Samsung Galaxy Z Fold8 Ultra"],
    ["Samsung Galaxy Z Flip7 FE", "samsung-galaxy-z-flip7-fe", "Samsung Galaxy Z Flip7 FE"],
    ["Samsung Galaxy A17 4G", "samsung-galaxy-a17-4g", "Samsung Galaxy A07/A17"],
    ["Samsung Galaxy S23 Ultra", "samsung-galaxy-s23-ultra", null],
  ];
  for (const [name, slug, expected] of cases) {
    assert.equal(getSamsungPhoneMenuGroup(name, slug)?.label ?? null, expected, name);
    assert.equal(isAllowedSamsungPhone(name, slug), expected !== null, name);
  }
});
