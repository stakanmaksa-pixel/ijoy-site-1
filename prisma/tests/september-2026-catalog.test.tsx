import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductDetail } from "../../src/components/ProductDetail";
import { usesGeneralProductGallery } from "../../src/lib/generalProductGallery";
import { pickVariantImages } from "../../src/lib/pickCoverImage";
import { IPHONE_2026_CATALOG, planIphone2026Addition } from "../data/iphone-2026-catalog";
import {
  SEPTEMBER_2026_PHOTO_FILES,
  SEPTEMBER_2026_PRODUCTS,
  ULTRA4_GENERAL_PHOTO,
  planSeptemberProduct,
} from "../data/september-2026-catalog";

test("requested September products have exact supplied colour photos and unpriced offers", async () => {
  assert.deepEqual(SEPTEMBER_2026_PRODUCTS.map((product) => product.slug), [
    "dyson-camerajet",
    "samsung-galaxy-s26-fe",
    "apple-watch-series-12",
    "airpods-5",
    "airpods-5-wireless",
    "garmin-cirqa-smart-band",
    "huawei-freeclip-2",
  ]);
  for (const file of SEPTEMBER_2026_PHOTO_FILES) {
    const bytes = await readFile(new URL(`../../public/catalog/product-photos/september-2026/${file}`, import.meta.url));
    assert(bytes.length > 10_000, file);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], file);
  }
  for (const product of SEPTEMBER_2026_PRODUCTS) {
    const plan = planSeptemberProduct(product);
    assert.equal(plan.variantsToCreate.length, product.variants.length);
    assert(product.description.length > 100);
    assert(Object.keys(product.specs).length >= 9);
    for (const variant of plan.variantsToCreate) {
      assert.equal(variant.price, null);
      assert.equal(variant.inStock, false);
      assert(pickVariantImages(plan.images, plan.colorImages, variant)[0]?.startsWith("/catalog/product-photos/september-2026/"));
    }
  }
});

test("official names map the supplied S26 FE, CIRQA, Series 12 and FreeClip colours", () => {
  const bySlug = new Map(SEPTEMBER_2026_PRODUCTS.map((product) => [product.slug, product]));
  assert.deepEqual(Object.keys(bySlug.get("samsung-galaxy-s26-fe")!.colorImages), ["Graphite", "Pistachio", "Blueberry"]);
  assert(bySlug.get("garmin-cirqa-smart-band")!.colorImages["French Gray"][0].includes("french-gray"));
  assert(bySlug.get("apple-watch-series-12")!.colorImages["Night Blue"][0].includes("night-blue"));
  assert(bySlug.get("huawei-freeclip-2")!.colorImages["Denim Blue"][0].includes("denim-blue"));
  assert.equal(bySlug.get("apple-watch-series-12")!.variants.length, 16);
});

test("repeat planning preserves commerce data and good existing images", () => {
  const product = SEPTEMBER_2026_PRODUCTS.find((item) => item.slug === "samsung-galaxy-s26-fe")!;
  const old = {
    images: ["/uploads/custom/s26-fe.jpg"],
    colorImages: { Graphite: ["/uploads/custom/graphite.jpg"] },
    variants: [{ id: "keep", memory: "8 / 128 GB", color: "Graphite", region: null, price: 99999, inStock: true }],
  };
  const before = structuredClone(old);
  const plan = planSeptemberProduct(product, old);
  assert.deepEqual(old, before);
  assert.deepEqual(plan.images, old.images);
  assert.deepEqual(plan.colorImages.Graphite, old.colorImages.Graphite);
  assert.equal(plan.variantsToCreate.length, 5);
});

test("Series 12 photo refresh replaces old collage galleries with the supplied single-view photos", () => {
  const product = SEPTEMBER_2026_PRODUCTS.find((item) => item.slug === "apple-watch-series-12")!;
  const old = {
    images: ["/uploads/old-three-panel-collage.jpg"],
    colorImages: Object.fromEntries(Object.keys(product.colorImages).map((color) => [color, [`/uploads/${color}-collage.jpg`]])),
    variants: product.variants,
  };

  const plan = planSeptemberProduct(product, old, { replaceExistingPhotos: true });

  assert.deepEqual(plan.images, product.images);
  assert.deepEqual(plan.colorImages, product.colorImages);
  assert.equal(plan.variantsToCreate.length, 0);
});

test("general model-line photos remain covers until a concrete variant link is opened", () => {
  for (const slug of ["apple-watch-ultra-4", "dyson-camerajet", "iphone-18-pro", "iphone-18-pro-max", "iphone-duo"]) {
    assert(usesGeneralProductGallery(slug));
  }
  const variants = [
    { id: "black", memory: "49 мм", color: "Black Titanium", region: "Ocean Band (Black) M/L", price: null, inStock: false },
  ];
  const colourPhoto = "/catalog/product-photos/apple-watches/apple-watch-ultra-4-black-titanium-ocean-band-black.png";
  const common = renderToStaticMarkup(<ProductDetail productName="Apple Watch Ultra 4" productSlug="apple-watch-ultra-4" variants={variants} images={[ULTRA4_GENERAL_PHOTO]} colorImages={{ "Black Titanium": [colourPhoto] }} />);
  assert(common.includes(ULTRA4_GENERAL_PHOTO));
  assert(!common.includes(colourPhoto));
  const exact = renderToStaticMarkup(<ProductDetail productName="Apple Watch Ultra 4" productSlug="apple-watch-ultra-4" variants={variants} initialVariantId="black" images={[ULTRA4_GENERAL_PHOTO]} colorImages={{ "Black Titanium": [colourPhoto] }} />);
  assert(exact.includes(colourPhoto));
});

test("iPhone 18 and Duo use supplied static photos while keeping the full offer matrix", () => {
  const unique = new Set<string>();
  for (const product of IPHONE_2026_CATALOG) {
    const plan = planIphone2026Addition(product);
    assert(usesGeneralProductGallery(product.slug));
    assert(plan.images[0].includes("all-colors"));
    for (const variant of plan.variantsToCreate) unique.add(pickVariantImages(plan.images, plan.colorImages, variant)[0]);
  }
  assert.equal(unique.size, 6);
});

test("September sync can replace broken or invented iPhone 18 galleries with supplied photos", () => {
  const product = IPHONE_2026_CATALOG.find((item) => item.slug === "iphone-duo")!;
  const plan = planIphone2026Addition(product, {
    images: ["/uploads/old-generated-gallery.jpg", "/uploads/another-random-photo.jpg"],
    colorImages: {
      "Night Sky": ["/uploads/broken-night-sky.jpg", "/uploads/old-detail.jpg"],
      "Star White": ["/uploads/old-star-white.jpg"],
    },
    variants: [],
  }, { replaceExistingPhotos: true });
  assert.deepEqual(plan.images, ["/catalog/product-photos/september-2026/iphone-duo-all-colors.jpg"]);
  assert.deepEqual(plan.colorImages, {
    "Night Sky": ["/catalog/product-photos/september-2026/iphone-duo-night-sky.jpg"],
    "Star White": ["/catalog/product-photos/september-2026/iphone-duo-star-white.jpg"],
  });
});

test("deployment script is backed up, transactional and never rewrites prices or stock", async () => {
  const script = await readFile(new URL("../scripts/sync-september-2026-catalog.ts", import.meta.url), "utf8");
  assert(script.includes("Prisma.TransactionIsolationLevel.Serializable"));
  assert(script.indexOf("await writeFile(backup") < script.indexOf("await tx.product.create"));
  assert(!script.includes("deleteMany"));
  assert(!script.includes("productVariant.update"));
  assert(script.includes("price: null, inStock: false"));
  const catalogue = await readFile(new URL("../../src/lib/catalog.ts", import.meta.url), "utf8");
  assert(catalogue.indexOf('"Apple Watch Series 12"') < catalogue.indexOf('"Apple Watch Ultra 3"'));
  assert(catalogue.indexOf('"AirPods 5 Wireless"') < catalogue.indexOf('"AirPods Pro 3"'));
  assert(catalogue.indexOf('"Garmin CIRQA Smart Band"') < catalogue.indexOf('"Google Fitbit Air"'));
});
