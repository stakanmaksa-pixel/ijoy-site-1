import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { pickVariantImages } from "../../src/lib/pickCoverImage";
import { resolveCatalogPhoto } from "../../src/lib/catalogPhotos";
import { getCompatibleAccessoryBundle } from "../../src/lib/compatibleAccessories";
import {
  GAMING_LIFESTYLE_CATALOG,
  GAMING_LIFESTYLE_PHOTO_PATHS,
  planGamingLifestyleVariants,
  type ExistingGamingLifestyleVariant,
} from "../data/gaming-lifestyle-catalog";

const stored = (id: string, overrides: Partial<ExistingGamingLifestyleVariant> = {}): ExistingGamingLifestyleVariant => ({
  id,
  productId: "primary",
  memory: null,
  color: null,
  region: null,
  rawLabel: null,
  price: null,
  inStock: true,
  updatedAt: new Date("2026-09-07T00:00:00Z"),
  ...overrides,
});

function priceOf(rawLabel: string) {
  const variant = GAMING_LIFESTYLE_CATALOG.flatMap((product) => product.variants)
    .find((item) => item.rawLabel === rawLabel);
  assert(variant, `missing variant: ${rawLabel}`);
  return variant.price;
}

test("all requested gaming and lifestyle cards, variants, prices and local photos are present", async () => {
  assert.equal(GAMING_LIFESTYLE_CATALOG.length, 36);
  assert.equal(GAMING_LIFESTYLE_CATALOG.flatMap((product) => product.variants).length, 88);
  assert.equal(new Set(GAMING_LIFESTYLE_CATALOG.map((product) => product.slug)).size, 36);
  const labels = GAMING_LIFESTYLE_CATALOG.flatMap((product) => product.variants.map((variant) => variant.rawLabel));
  assert.equal(new Set(labels).size, labels.length);

  assert.equal(priceOf("PS5 Pro"), 107500);
  assert.equal(priceOf("PS5 Slim Disk 2 рев"), 69500);
  assert.equal(priceOf("PS5 Portal 30th Edition"), 39000);
  assert.equal(priceOf("DualSense PS5 Pink"), 6300);
  assert.equal(priceOf("Dualsense Edge black"), 16400);
  assert.equal(priceOf("NSW 2 с игрой"), 48000);
  assert.equal(priceOf("Meta quest 3 512GB"), 49000);
  assert.equal(priceOf("Valve Steam Machine 512GB + Steam Controller"), 138000);
  assert.equal(priceOf("WHOOP Life"), 30000);
  assert.equal(priceOf("Marshall Major V Pitch Black"), 5500);

  for (const photo of GAMING_LIFESTYLE_PHOTO_PATHS) {
    await access(fileURLToPath(new URL(`../../public${photo}`, import.meta.url)));
  }
});

test("every exact variant has a stable visible product photo", () => {
  for (const product of GAMING_LIFESTYLE_CATALOG) {
    for (const variant of product.variants) {
      const image = pickVariantImages(product.images, product.colorImages, variant)[0];
      assert(image, `${product.name}: ${variant.rawLabel}`);
      assert(product.images.map(url => resolveCatalogPhoto(url, undefined, variant.region)).includes(image!), `${product.name}: ${variant.rawLabel}`);
    }
  }
});

test("repeated sync preserves matching variants and archives only old offers", () => {
  const product = GAMING_LIFESTYLE_CATALOG.find((item) => item.slug === "dualsense-ps5")!;
  const keep = stored("keep", { rawLabel: "DualSense PS5 White", price: "5700" });
  const old = stored("archive", { rawLabel: "DualSense PS4 Green" });
  const plan = planGamingLifestyleVariants([old, keep], product.variants);
  assert.equal(plan.options[0]?.existing?.id, "keep");
  assert.deepEqual(plan.remaining.map((variant) => variant.id), ["archive"]);
  assert.equal(plan.options.filter((option) => !option.existing).length, product.variants.length - 1);
});

test("PS5 and portable-device compatibility bundles point to the right accessories", () => {
  const ps5Digital = getCompatibleAccessoryBundle("playstation-5-slim-digital-rev2");
  assert(ps5Digital);
  assert(ps5Digital.slugs.includes("ps5-disc-drive"));
  assert(ps5Digital.slugs.includes("playstation-vr2"));
  assert(ps5Digital.slugs.includes("dualsense-ps5"));

  const portal = getCompatibleAccessoryBundle("playstation-portal-remote-player");
  assert(portal);
  assert(portal.slugs.includes("playstation-5-pro"));
  assert(portal.slugs.includes("sony-pulse-elite"));

  const deck = getCompatibleAccessoryBundle("steam-deck-oled");
  assert.deepEqual(deck?.slugs, ["steam-deck-docking-station"]);
});
