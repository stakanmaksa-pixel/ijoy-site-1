import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { pickVariantImages, variantImageKey } from "../../src/lib/pickCoverImage";
import {
  KEPT_GOPRO_SLUGS,
  META_PHOTO_CATALOG,
  META_PHOTO_PATHS,
  planCatalogVariants,
  shouldHideGoPro,
  type ExistingCatalogVariant,
} from "../data/meta-photo-catalog";

const stored = (id: string, overrides: Partial<ExistingCatalogVariant> = {}): ExistingCatalogVariant => ({
  id,
  productId: "product",
  memory: null,
  color: null,
  region: null,
  rawLabel: null,
  price: null,
  inStock: true,
  updatedAt: new Date("2026-09-07T00:00:00Z"),
  ...overrides,
});

test("all requested cards, variants, exact prices and bundled original photos are present", async () => {
  assert.equal(META_PHOTO_CATALOG.length, 19);
  const smartGlasses = META_PHOTO_CATALOG.filter((product) => product.category === "smart-ochki");
  const cameras = META_PHOTO_CATALOG.filter((product) => product.category === "ekshn-kamery");
  assert.equal(smartGlasses.length, 9);
  assert.equal(cameras.length, 10);
  assert.equal(META_PHOTO_CATALOG.flatMap((product) => product.variants).length, 46);

  const labels = META_PHOTO_CATALOG.flatMap((product) => product.variants.map((variant) => variant.rawLabel));
  assert.equal(new Set(labels).size, labels.length);
  assert.equal(META_PHOTO_CATALOG.find((product) => product.slug === "ray-ban-meta-wayfarer-rw4012-gen2")?.variants.length, 11);
  assert.equal(META_PHOTO_CATALOG.find((product) => product.slug === "insta360-x5")?.variants.every((variant) => variant.price === 36600), true);
  assert.deepEqual([...KEPT_GOPRO_SLUGS].sort(), ["gopro-hero12-black", "gopro-hero13-black"]);

  for (const photo of META_PHOTO_PATHS) {
    await access(fileURLToPath(new URL(`../../public${photo}`, import.meta.url)));
  }
});

test("every exact variant resolves to its product photo", () => {
  for (const product of META_PHOTO_CATALOG) {
    for (const variant of product.variants) {
      const image = pickVariantImages(product.images, product.colorImages, variant)[0];
      assert(image, `${product.name}: ${variant.rawLabel}`);
      assert(product.images.includes(image!), `${product.name}: ${variant.rawLabel}`);
      assert.deepEqual(product.colorImages[variantImageKey(variant)], [image]);
    }
  }
});

test("rerun keeps existing variant IDs and sends only unwanted variants to archive", () => {
  const product = META_PHOTO_CATALOG.find((item) => item.slug === "insta360-go-ultra")!;
  const retained = stored("keep", {
    rawLabel: product.variants[0]!.rawLabel,
    price: "27900",
    color: "Legacy Black", // rawLabel has priority and will be normalized on update
  });
  const extra = stored("archive", { rawLabel: "Old Creator Bundle" });
  const plan = planCatalogVariants([extra, retained], product.variants);
  assert.equal(plan.options[0]!.existing?.id, "keep");
  assert.deepEqual(plan.remaining.map((variant) => variant.id), ["archive"]);
  assert.equal(plan.options.filter((option) => !option.existing).length, 1);
});

test("only non-listed GoPro cards in the photo category are hidden", () => {
  const camera = (slug: string, brand = "GoPro", category = "ekshn-kamery") => ({ slug, brand, category: { slug: category } });
  assert.equal(shouldHideGoPro(camera("gopro-max2")), true);
  assert.equal(shouldHideGoPro(camera("gopro-hero12-black")), false);
  assert.equal(shouldHideGoPro(camera("gopro-hero13-black")), false);
  assert.equal(shouldHideGoPro(camera("insta360-x5", "Insta360")), false);
  assert.equal(shouldHideGoPro(camera("gopro-max2", "GoPro", "naushniki")), false);
});
