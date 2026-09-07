import assert from "node:assert/strict";
import { test } from "node:test";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolveHeadphonePhoto, headphonePhotoPadding } from "../../src/lib/headphonePhotos";
import { pickCoverImage, pickVariantImages, variantImageKey } from "../../src/lib/pickCoverImage";

const pairs = [
  ["airpods-pro-3", "airpods-pro-3"], ["airpods-pro-2-type-c", "airpods-pro-2"],
  ["apple-airpods-pro-2", "airpods-pro-2"], ["airpods-4", "airpods-4"],
  ["airpods-4-anc", "airpods-4-anc"], ["apple-earpods-usb-c", "earpods-usb-c"],
] as const;
test("known banner imports resolve to bundled product photos on every surface", () => {
  for (const [slug, file] of pairs) {
    const old = `/uploads/products/${slug}/cover.jpg`;
    const expected = `/catalog/product-photos/audio/${file}.jpg`;
    const variant = {color: "White", memory: null, region: "US"};
    assert.equal(pickCoverImage([old], null), expected);
    assert.equal(pickCoverImage([], {White: [old]}, "White"), expected);
    assert.deepEqual(pickVariantImages([old], null, variant), [expected]);
    assert.deepEqual(pickVariantImages([], {[variantImageKey(variant)]: [old]}, variant), [expected]);
    assert.equal(resolveHeadphonePhoto(expected), expected);
  }
});
test("all five AirPods Max colors stay distinct", () => {
  const mapped = new Set<string>();
  for (const color of ["midnight", "starlight", "blue", "purple", "orange"]) {
    const url = `/uploads/products/airpods-max-2/max2-${color}.jpg`;
    const expected = `/catalog/product-photos/audio/max2-${color}.jpg`;
    assert.equal(resolveHeadphonePhoto(url), expected);
    mapped.add(expected);
  }
  assert.equal(mapped.size, 5);
});
test("editor photos, other generations, other categories and external URLs are untouched", () => {
  for (const url of ["/uploads/products/airpods-pro-3/custom.jpg", "/uploads/products/airpods-max/max2-purple.jpg",
    "/uploads/products/airpods-pro-20/cover.jpg", "/uploads/products/ipad-a16/cover.jpg",
    "/uploads/products/galaxy-buds-3/cover.jpg", "https://example.com/airpods-pro-3/cover.jpg"]) {
    assert.equal(resolveHeadphonePhoto(url), url);
  }
});
test("ten original photos exist and have different contents", async () => {
  const files = [...new Set(pairs.map(([,file]) => file)), ...["midnight", "starlight", "blue", "purple", "orange"].map(color => `max2-${color}`)];
  const hashes = new Set<string>();
  for (const file of files) {
    const location = fileURLToPath(new URL(`../../public/catalog/product-photos/audio/${file}.jpg`, import.meta.url));
    await access(location);
    hashes.add(createHash("sha256").update(await readFile(location)).digest("hex"));
  }
  assert.equal(hashes.size, 10);
});
test("image alignment uses only positive insets, never a zoom or negative overflow", () => {
  for (const file of ["airpods-pro-3", "airpods-pro-2", "airpods-4", "earpods-usb-c", "max2-blue"]) {
    const padding = parseFloat(headphonePhotoPadding(`/catalog/product-photos/audio/${file}.jpg`));
    assert(padding >= 0 && padding < 20);
  }
  assert.equal(headphonePhotoPadding("/uploads/products/airpods-pro-3/custom.jpg"), "5%");
});
