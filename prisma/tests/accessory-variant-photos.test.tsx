import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { ACCESSORY_PHOTOS, accessoryVariantPhoto } from "../data/accessory-variant-photos";
import { GAMING_LIFESTYLE_CATALOG } from "../data/gaming-lifestyle-catalog";
import { pickVariantImages, variantImageKey } from "../../src/lib/pickCoverImage";
import { VariantCard } from "../../src/components/VariantCard";
import { catalogPhotoBounds } from "../../src/lib/catalogPhotos";

test("all 29 accessory variants use distinct local original photographs", async () => {
  let count = 0;
  for (const slug of Object.keys(ACCESSORY_PHOTOS)) {
    const product = GAMING_LIFESTYLE_CATALOG.find(p => p.slug === slug)!;
    const hashes = new Set<string>();
    for (const variant of product.variants) {
      const photo = accessoryVariantPhoto(slug, variant)!;
      assert.equal(pickVariantImages(product.images, product.colorImages, variant)[0], photo);
      assert.equal(product.colorImages[variantImageKey(variant)][0], photo);
      const file = await readFile(new URL(`../../public${photo}`, import.meta.url));
      const hash = createHash("sha256").update(file).digest("hex");
      assert(!hashes.has(hash), `${slug}: repeated content for ${variant.rawLabel}`);
      hashes.add(hash);
      const bounds = catalogPhotoBounds(photo)!;
      assert(bounds && bounds.w > 0 && bounds.h > 0);
      assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.w <= bounds.width && bounds.y + bounds.h <= bounds.height);
      const html = renderToStaticMarkup(<VariantCard slug={slug} variant={{...variant,id:`id-${count}`,inStock:true,memory:variant.memory??null,color:variant.color??null,region:variant.region??null}} imageUrl={photo}/>);
      assert(html.includes(photo));
      count++;
    }
  }
  assert.equal(count, 29);
});

test("limited editions sharing a color never fall back to Marathon", () => {
  const product = GAMING_LIFESTYLE_CATALOG.find(p => p.slug === "dualsense-limited-editions")!;
  assert(!product.colorImages["Limited Edition"]);
  for (const variant of product.variants) {
    const photo = pickVariantImages(product.images, product.colorImages, variant)[0];
    if (variant.memory !== "Marathon") assert(!photo.includes("/marathon."));
  }
  assert.throws(() => accessoryVariantPhoto(product.slug, {memory:"Unknown",color:"Limited Edition"}));
});

test("Fitbit Curry keeps its edition photo for both legacy Blue and corrected Rye", () => {
  assert.equal(accessoryVariantPhoto("google-fitbit-air",{memory:"Stephen Curry Edition",color:"Blue"}),
    accessoryVariantPhoto("google-fitbit-air",{memory:"Stephen Curry Edition",color:"Rye"}));
  const curry = GAMING_LIFESTYLE_CATALOG.find(p => p.slug === "google-fitbit-air")!.variants.find(v => v.memory === "Stephen Curry Edition")!;
  assert.equal(curry.color,"Rye");
  assert.equal(curry.price,16000);
});

test("photo sync backs up before writes, never changes price, stock or deletes variants", async () => {
  const source = await readFile(new URL("../scripts/sync-accessory-variant-photos.ts",import.meta.url),"utf8");
  assert(source.indexOf('writeFile(backup') < source.indexOf('tx.product.update('));
  assert(source.indexOf('--dry-run') < source.indexOf('writeFile(backup'));
  assert(!/\.(?:delete|deleteMany)\(/.test(source));
  assert(!/data:\s*\{[^}]*\b(?:price|inStock|status)\s*:/.test(source));
});
