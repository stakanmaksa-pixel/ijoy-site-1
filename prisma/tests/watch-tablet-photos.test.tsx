import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { WATCH_TABLET_PHOTOS, planWatchTabletPhotos } from "../data/watch-tablet-photo-policy";
import { OFFICIAL_CATALOG_ENTRIES, officialVariants } from "../official-catalog";
import { SAMSUNG_WATCH_CATALOG } from "../data/samsung-watch-catalog";
import { pickVariantImages, variantImageKey } from "../../src/lib/pickCoverImage";
import { catalogPhotoBounds } from "../../src/lib/catalogPhotos";
import { ProductCard } from "../../src/components/ProductCard";

test("13 target models have 39 verified, colour-specific original photos with safe bounds", async () => {
  assert.equal(WATCH_TABLET_PHOTOS.length, 13);
  const photos = WATCH_TABLET_PHOTOS.flatMap(p => p.photos);
  assert.equal(photos.length, 39);
  assert.equal(new Set(photos.map(p => p.file)).size, photos.length);
  for (const photo of photos) {
    assert(["www.samsung.com", "consumer.huawei.com", "www.mi.com"].includes(new URL(photo.source).hostname));
    const src = `/catalog/product-photos/${photo.file}`;
    const bytes = await readFile(new URL("../../public" + src, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), photo.sha256);
    const bounds = catalogPhotoBounds(src)!;
    // Portrait originals can be narrower than 600px (e.g. 580×800) without being low-res.
    assert(bounds && Math.min(bounds.width, bounds.height) >= 500 && Math.max(bounds.width, bounds.height) >= 800, src);
    assert(bounds.w > 0 && bounds.h > 0 && bounds.x >= 0 && bounds.y >= 0);
    assert(bounds.x + bounds.w <= bounds.width && bounds.y + bounds.h <= bounds.height);
  }
});

test("photo-only plans cover imported colours without changing offers or other product fields", () => {
  for (const product of WATCH_TABLET_PHOTOS) {
    const official = OFFICIAL_CATALOG_ENTRIES.find(p => p.slug === product.slug);
    const refresh = SAMSUNG_WATCH_CATALOG.find(p => p.slug === product.slug);
    const variants = official ? officialVariants(official) : refresh!.variants.map(v => ({ ...v, region: v.region ?? null }));
    const current = { images: [], colorImages: null, variants };
    const before = structuredClone(current);
    const plan = planWatchTabletPhotos(current, product);
    assert.deepEqual(current, before);
    assert.deepEqual(Object.keys(plan).sort(), ["colorImages", "images"]);
    for (const v of variants) {
      const selected = pickVariantImages(plan.images, plan.colorImages, v);
      assert(selected.length > 0);
      if (v.color) assert(plan.colorImages[variantImageKey(v)]?.length);
    }
    assert.deepEqual(planWatchTabletPhotos({ ...current, ...plan }, product), plan);
  }
});

test("Watch9 exact size selection replaces dial-only legacy images and preserves prices and stock", () => {
  const product = WATCH_TABLET_PHOTOS.find(p => p.slug === "samsung-galaxy-watch-9")!;
  const variants = ["40mm", "44mm"].map((memory, i) => ({ id: String(i), memory, color: "Graphite", region: "LTE", price: 19500, inStock: true }));
  const current = { images: ["old-dial.png"], colorImages: Object.fromEntries(variants.map(v => [variantImageKey(v), ["old-dial.png"]])), variants };
  const before = structuredClone(current);
  const plan = planWatchTabletPhotos(current, product);
  for (const v of variants) assert(pickVariantImages(plan.images, plan.colorImages, v)[0].endsWith(`graphite-${v.memory}.png`));
  assert.deepEqual(current, before);
});

test("unknown colour or size without an existing photo aborts instead of showing another device", () => {
  const product = WATCH_TABLET_PHOTOS.find(p => p.slug === "samsung-galaxy-watch-9")!;
  for (const variant of [{ memory: "40mm", color: "Red", region: null }, { memory: "99mm", color: "Graphite", region: null }]) {
    assert.throws(() => planWatchTabletPhotos({ images: [], colorImages: null, variants: [variant] }, product), /no confirmed photo/);
    const colorImages = { [variantImageKey(variant)]: ["/uploads/manual-photo.png"] };
    const plan = planWatchTabletPhotos({ images: [], colorImages, variants: [variant] }, product);
    assert.deepEqual(plan.colorImages[variantImageKey(variant)], colorImages[variantImageKey(variant)]);
  }
});

test("localised colour labels and grey spelling map to the corresponding photo", () => {
  const product = WATCH_TABLET_PHOTOS.find(p => p.slug === "xiaomi-pad-7")!;
  const variant = { memory: "8/128GB", color: "Серый (Grey)", region: null };
  const plan = planWatchTabletPhotos({ images: [], colorImages: {}, variants: [variant] }, product);
  assert(pickVariantImages(plan.images, plan.colorImages, variant)[0].endsWith("xiaomi-pad-7-gray.png"));
});

test("cards render original photos in the shared whole-device layout", () => {
  for (const p of WATCH_TABLET_PHOTOS) {
    const src = `/catalog/product-photos/${p.photos[0].file}`;
    const html = renderToStaticMarkup(<ProductCard name={p.slug} slug={p.slug} coverImage={src} minPrice={null} hasStock={false} defaultVariantId={null} />);
    assert(html.includes(`data-product-photo="${src}"`));
    assert(html.includes("76%"));
    assert(!html.includes("Фото скоро"));
    assert(html.includes("Уточняйте у менеджера"));
  }
});

test("sync has private backup, dry run and no mutations of variants, prices or visibility", async () => {
  const source = await readFile(new URL("../scripts/sync-watch-tablet-photos.ts", import.meta.url), "utf8");
  assert(source.includes('backups/watch-tablet-photos'));
  assert(source.includes('status: "PUBLISHED"'));
  assert(source.includes("if (dryRun)"));
  assert(source.indexOf("await writeFile(backup") < source.indexOf("await tx.product.update"));
  for (const forbidden of [".delete", "productVariant.update", "productVariant.create", "price:", "inStock:", 'status: "HIDDEN"']) assert(!source.includes(forbidden), forbidden);
});
