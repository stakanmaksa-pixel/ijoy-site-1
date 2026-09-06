import assert from "node:assert/strict";
import { test } from "node:test";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { variantImageKey, pickVariantImages } from "../../src/lib/pickCoverImage";
import {
  MINI_SLUG, MINI_OPTIONS, MINI_COLORS, MINI_CONTENT, MINI_IMAGES, MINI_COLOR_IMAGES, TV_PHOTO,
  planMiniVariants, normalizeMiniVariant, shouldArchiveTablet, isMiniProduct, type MiniVariant,
} from "../data/ipad-mini-catalog";

const product = (name: string, slug = "legacy-product", category = "planshety", brand = "Apple") =>
  ({ name, slug, brand, category: { slug: category } });
const variant = (id: string, overrides: Partial<MiniVariant> = {}): MiniVariant => ({
  id, productId: "primary", memory: "128GB", color: "Blue", region: null, rawLabel: null,
  price: null, updatedAt: new Date("2026-09-01"), ...overrides,
});

test("24 exact combinations, stable memory/connectivity order and 8 distinct photo files", async () => {
  assert.equal(MINI_OPTIONS.length, 24);
  assert.equal(new Set(MINI_OPTIONS.map(variantImageKey)).size, 24);
  assert.deepEqual(MINI_OPTIONS.slice(0, 2).map(option => option.region), ["Wi‑Fi", "Wi‑Fi + Cellular"]);
  const photos = new Set(Object.values(MINI_COLOR_IMAGES).flat());
  assert.equal(photos.size, 8);
  const hashes = new Set<string>();
  for (const photo of [...photos, TV_PHOTO]) {
    const file = fileURLToPath(new URL(`../../public${photo}`, import.meta.url));
    await access(file);
    hashes.add(createHash("sha256").update(await readFile(file)).digest("hex"));
  }
  assert.equal(hashes.size, 9);
  for (const option of MINI_OPTIONS) {
    const images = pickVariantImages(MINI_IMAGES, MINI_COLOR_IMAGES, option);
    assert.equal(images.length, 1);
    assert(images[0].includes(option.region.includes("Cellular") ? "/cell-" : "/wifi-"));
    assert(images[0].includes(option.color.toLowerCase().replaceAll(" ", "-")));
  }
});

test("only old screenshot models and HONOR/OnePlus tablets are archived", () => {
  for (const name of ["iPad Air 13 (2025, M3)", "iPad Air 11 (2025, M3)", "iPad 11 (2025)",
    "iPad Air 8 11", "iPad Air 11-inch (M3)", "iPad Air 13-inch (M3)", "iPad Pro 13", "HONOR Pad V9", "OnePlus Pad 3"]) {
    assert(shouldArchiveTablet(product(name)), name);
  }
  for (const [name, slug] of [["Apple iPad Pro 13″ M5 (2025)", "ipad-pro-13-m5"],
    ["Apple iPad Air 11″ M4 (2026)", "ipad-air-11-m4"], ["iPad 11 (2025)", "ipad-a16"],
    ["Apple Pencil Pro", "apple-pencil-pro"], ["iPad mini (A17 Pro)", MINI_SLUG], ["Samsung Galaxy Tab S11", "samsung-galaxy-tab-s11"]]) {
    assert.equal(shouldArchiveTablet(product(name, slug)), false, name);
  }
  assert.equal(shouldArchiveTablet(product("HONOR Pad", "honor", "telefony", "HONOR")), false);
  assert.equal(shouldArchiveTablet(product("OnePlus 15", "oneplus", "telefony", "OnePlus")), false);
});

test("mini alias matching excludes other generations and archived variant bucket", () => {
  for (const name of ["iPad Mini 7", "iPad mini (A17 Pro)", "Apple iPad mini (A17 Pro)"]) assert(isMiniProduct(product(name)));
  for (const name of ["iPad mini 6", "iPad mini 5", "Apple iPad mini (A17 Pro) — архив вариантов"]) assert.equal(isMiniProduct(product(name)), false);
});

test("legacy prices/IDs survive; blank imported offers cannot displace priced offers", () => {
  const priced = variant("priced", { productId: "mini7", price: "43400", rawLabel: "iPad Mini 7 128GB Blue Wi-Fi" });
  const plan = planMiniVariants([variant("blank"), priced], "primary");
  assert.equal(plan.options[0].existing?.id, "priced");
  assert.equal(plan.options[0].existing?.price, "43400");
  assert.equal(plan.options.filter(item => !item.existing).length, 23);
  assert.deepEqual(plan.remaining.map(item => item.id), ["blank"]);
});

test("canonical priced variant wins duplicate; no input data are changed", () => {
  const canonical = variant("keep", { price: "44000" });
  const duplicate = variant("archive", { productId: "other", price: "43500", updatedAt: new Date("2026-09-07") });
  const originals = structuredClone([canonical, duplicate]);
  const plan = planMiniVariants([duplicate, canonical], "primary");
  assert.equal(plan.options[0].existing?.id, "keep");
  assert.equal(plan.remaining[0].id, "archive");
  assert.deepEqual([canonical, duplicate], originals);
});

test("Cellular is separate, absent old connectivity defaults to Wi-Fi; unknown memory/color stay archived", () => {
  assert.equal(normalizeMiniVariant(variant("cell", { region: "Wi-Fi + Cellular eSIM" }))?.region, "Wi‑Fi + Cellular");
  assert.equal(normalizeMiniVariant(variant("wifi"))?.region, "Wi‑Fi");
  assert.equal(normalizeMiniVariant(variant("ru", { memory: "256 ГБ", color: "Серый космос" }))?.color, "Space Gray");
  assert.equal(normalizeMiniVariant(variant("invalid", { memory: "64GB" })), null);
  assert.equal(normalizeMiniVariant(variant("invalid", { color: "Pink" })), null);
});

test("repeat run reuses exactly the same 24 IDs and does not create duplicates", () => {
  const first = planMiniVariants([variant("known", { price: "43400" })], "primary");
  const after = first.options.map(({ option, existing }, index) =>
    variant(existing?.id ?? `new-${index}`, { ...existing, ...option, productId: "primary" }));
  const second = planMiniVariants(after, "primary");
  assert.equal(second.remaining.length, 0);
  assert(second.options.every(item => item.existing));
  assert.deepEqual(second.options.map(item => item.existing!.id), after.map(item => item.id));
  assert.equal(second.options[0].existing?.price, "43400");
});

test("mini has comparable specs and explicit Pencil/eSIM compatibility", () => {
  assert.equal(MINI_COLORS.length, 4);
  for (const key of ["Дисплей", "Процессор", "Накопитель", "Беспроводная связь", "SIM", "Вес", "Совместимость"]) assert(key in MINI_CONTENT.specs);
  assert(MINI_CONTENT.highlights.length >= 5);
  assert(MINI_CONTENT.specs.SIM.includes("eSIM"));
  assert(MINI_CONTENT.specs.Совместимость.includes("Apple Pencil Pro"));
});
