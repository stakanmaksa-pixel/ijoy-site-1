import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import sources from "../data/apple-watch-photo-sources.json";
import replacements from "../../src/lib/appleWatchPhotoReplacements.json";
import { APPLE_WATCH_ULTRA4, ULTRA4_VARIANTS, planUltra4Addition } from "../data/apple-watch-ultra4-catalog";
import { resolveCatalogPhoto, catalogPhotoBounds } from "../../src/lib/catalogPhotos";
import { ProductCard } from "../../src/components/ProductCard";
import { pickVariantImages, variantImageKey } from "../../src/lib/pickCoverImage";

test("24 original Apple Watch assets have verified files and whole-watch bounds", async () => {
  assert.equal(sources.entries.length, 24);
  assert.equal(new Set(sources.entries.map(p => p.file)).size, 24);
  for (const p of sources.entries) {
    assert.equal(new URL(p.url).hostname, "store.storeimages.cdn-apple.com");
    const src = `/catalog/product-photos/${p.file}`;
    const bytes = await readFile(new URL(`../../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), p.sha256);
    const b = catalogPhotoBounds(src)!;
    assert(b && b.width >= 1000 && b.height >= 1000, p.file);
    assert(b.w > 0 && b.h > b.w && b.x >= 0 && b.y >= 0, p.file);
    assert(b.x + b.w <= b.width && b.y + b.h <= b.height, p.file);
  }
});

test("30 exact legacy uploads resolve to the matching case/band photos; manual uploads are untouched", () => {
  assert.equal(Object.keys(replacements).length, 30);
  for (const p of sources.entries) for (const legacy of p.legacy) {
    const src = `/catalog/product-photos/${p.file}`;
    assert.equal(resolveCatalogPhoto(legacy), src);
    assert.equal(resolveCatalogPhoto(src), src);
    assert.deepEqual(pickVariantImages([legacy], null), [src]);
  }
  for (const url of ["/uploads/products/apple-watch-ultra-3/manual.png", "/uploads/products/apple-watch-ultra-4/my-photo.jpg", "https://example.com/watch.jpg"]) assert.equal(resolveCatalogPhoto(url), url);
});

test("all Apple Watch photos render at the same 76% height without cover-cropping", () => {
  for (const p of sources.entries) {
    const src = p.legacy[0] ?? `/catalog/product-photos/${p.file}`;
    const html = renderToStaticMarkup(<ProductCard name={p.slug} slug={p.slug} coverImage={src} minPrice={null} hasStock={false} defaultVariantId={null} />);
    assert(html.includes("height:76%"), p.file);
    assert(html.includes(`data-product-photo="/catalog/product-photos/${p.file}"`));
    assert(!html.includes("object-cover"));
    assert(!html.includes("Фото скоро"));
  }
});

test("Ultra4 adds two exact colours with no invented price or stock", () => {
  assert.equal(ULTRA4_VARIANTS.length, 2);
  const plan = planUltra4Addition();
  assert.equal(plan.variantsToCreate.length, 2);
  assert.deepEqual(ULTRA4_VARIANTS.map(v => v.color), ["Black Titanium", "Natural Titanium"]);
  for (const v of ULTRA4_VARIANTS) {
    assert.equal(v.memory, "49 мм");
    assert.equal(v.price, null);
    assert.equal(v.inStock, false);
    assert.deepEqual(pickVariantImages(plan.images, plan.colorImages, v), [v.image]);
    const source = sources.entries.find(p => `/catalog/product-photos/${p.file}` === v.image)!;
    assert(source.url.includes("ultra4") && source.sourcePage?.includes("ocean-band"));
  }
  assert(!JSON.stringify(APPLE_WATCH_ULTRA4).includes("Под заказ"));
  assert(APPLE_WATCH_ULTRA4.specs["Совместимость"].includes("iOS 27"));
});

test("Ultra4 rerun preserves real offers, IDs, prices, stock, custom photos and is idempotent", () => {
  const first = planUltra4Addition();
  const variants = first.variantsToCreate.map((v, i) => ({ ...v, memory: "49mm", id: `existing-${i}`, price: 90000 + i, inStock: true }));
  const custom = "/uploads/products/apple-watch-ultra-4/custom.png";
  const old = { variants, images: [custom], colorImages: { [variantImageKey(variants[0])]: [custom] } };
  const before = structuredClone(old);
  const plan = planUltra4Addition(old);
  assert.equal(plan.variantsToCreate.length, 0);
  assert.deepEqual(old, before);
  assert.deepEqual(plan.images, [custom]);
  assert.deepEqual(plan.colorImages[variantImageKey(variants[0])], [custom]);
  assert.deepEqual(planUltra4Addition({ ...old, ...plan }), plan);
  assert.equal(planUltra4Addition({ ...old, variants: variants.slice(0, 1) }).variantsToCreate.length, 1);
});

test("Ultra4 sync backs up privately before changes and never resets offers or visibility", async () => {
  const script = await readFile(new URL("../scripts/sync-apple-watch-ultra4.ts", import.meta.url), "utf8");
  assert(script.includes("backups/apple-watch-ultra4"));
  assert(script.indexOf("if (dryRun)") < script.indexOf("await writeFile(backup"));
  assert(script.indexOf("await writeFile(backup") < script.indexOf("await tx.product.create"));
  for (const forbidden of ["deleteMany", "productVariant.update", "productVariant.upsert"]) assert(!script.includes(forbidden));
  const update = script.slice(script.indexOf("await tx.product.update"));
  assert(!update.includes("status:") && !update.includes("price:") && !update.includes("inStock:"));
});

test("model menu remains a direct product link and unselected multi-variant products retain the palette", async () => {
  const menu = await readFile(new URL("../../src/lib/catalog.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../../src/app/product/[slug]/page.tsx", import.meta.url), "utf8");
  assert(menu.includes('href: `/product/${product.slug}`'));
  assert(page.includes("const showVariantGrid = product.variants.length > 1 && !selectedVariant;"));
});
