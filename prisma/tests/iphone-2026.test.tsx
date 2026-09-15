import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { IPHONE_2026_CATALOG, iphone2026Variants, planIphone2026Addition } from "../data/iphone-2026-catalog";
import { downloadIphone2026Photos, officialIphonePhotoUrl, validateIphonePng } from "../scripts/download-iphone-2026-photos";
import { ProductDetail } from "../../src/components/ProductDetail";
import { VariantGrid } from "../../src/components/VariantGrid";
import { pickVariantImages } from "../../src/lib/pickCoverImage";
import { catalogMenuLabel } from "../../src/lib/catalogLabels";
import { directModelLink } from "../../src/lib/catalogPresentation";
import { colorLabel, colorToHex } from "../../src/lib/colorSwatch";

test("exactly three announced iPhones have 40 unpriced memory/colour configurations", () => {
  assert.deepEqual(IPHONE_2026_CATALOG.map(p => p.slug), ["iphone-18-pro-max", "iphone-18-pro", "iphone-duo"]);
  assert.deepEqual(IPHONE_2026_CATALOG.map(p => iphone2026Variants(p).length), [16,16,8]);
  const photos = new Set<string>();
  for (const p of IPHONE_2026_CATALOG) {
    const plan = planIphone2026Addition(p);
    assert(p.description.length > 100 && Object.keys(p.specs).length >= 15);
    for (const v of plan.variantsToCreate) {
      assert.equal(v.price, null); assert.equal(v.inStock, false); assert.equal(v.region, null);
      const photo = pickVariantImages(plan.images, plan.colorImages, v)[0];
      assert(photo.includes(v.color.toLowerCase().replaceAll(" ", "-")));
      photos.add(photo);
      assert.notEqual(colorLabel(v.color), v.color);
    }
  }
  assert.equal(photos.size, 10);
  assert.notEqual(colorToHex("Burgundy"), colorToHex("Glacier"));
});

test("repeat sync retains existing offers, localized memory, IDs, regions, prices, stock and custom photos", () => {
  const p = IPHONE_2026_CATALOG[0];
  const old = {
    status: "HIDDEN", images: ["/uploads/custom-cover.png"], colorImages: { burgundy: ["/uploads/custom-burgundy.png"] },
    variants: [{ id: "keep", memory: "256 ГБ", color: "burgundy", region: "Japan", price: 180000, inStock: true }],
  };
  const before = structuredClone(old);
  const plan = planIphone2026Addition(p, old);
  assert.equal(plan.variantsToCreate.length, 15);
  assert.deepEqual(old, before);
  assert.deepEqual(plan.images, old.images);
  assert.deepEqual(plan.colorImages.Burgundy, old.colorImages.burgundy);
  const rerun = planIphone2026Addition(p, {...old, ...plan, variants: [...old.variants, ...plan.variantsToCreate]});
  assert.equal(rerun.variantsToCreate.length, 0);
  assert.deepEqual(rerun.colorImages, plan.colorImages);
});

test("menu leaves link directly to the full grid and new models have readable specs", async () => {
  for (const p of IPHONE_2026_CATALOG) {
    const link = directModelLink(p);
    assert.equal(link.href, `/product/${p.slug}`);
    assert.equal(catalogMenuLabel(p.name, ["Apple iPhone"]), p.name.replace("iPhone ", ""));
    const plan = planIphone2026Addition(p);
    const variants = plan.variantsToCreate.map((v,i) => ({ ...v, id: `${p.slug}-${i}` }));
    const html = renderToStaticMarkup(<VariantGrid slug={p.slug} variants={variants} imageByVariant={Object.fromEntries(variants.map(v => [v.id, pickVariantImages(plan.images, plan.colorImages, v)[0]]))} />);
    assert.equal((html.match(/aria-label="Добавить в избранное"/g) ?? []).length, variants.length);
    assert(html.includes("Уточняйте у менеджера"));
    assert(!html.includes("Под заказ"));
    const detail = renderToStaticMarkup(<ProductDetail productSlug={p.slug} productName={p.name} specs={p.specs} variants={variants} images={plan.images} colorImages={plan.colorImages} />);
    assert(detail.includes("<details open="));
    assert(detail.includes("A20 Pro"));
  }
  const catalogue = await readFile(new URL("../../src/lib/catalog.ts", import.meta.url), "utf8");
  assert(catalogue.indexOf('"iPhone 18 Pro Max"') < catalogue.indexOf('"iPhone 17 Pro Max"'));
  assert(catalogue.indexOf('"iPhone Duo"') < catalogue.indexOf('"iPhone 17 Pro Max"'));
});

test("photo resolver picks the exact colour, rejects absent assets and non-image responses", () => {
  const id = "iphone-18-pro-finish-select-burgundy-202609";
  const url = `https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/${id}?wid=100&amp;hei=100&amp;fmt=jpeg`;
  const actual = new URL(officialIphonePhotoUrl(`<img src="${url}">`, id));
  assert.equal(actual.searchParams.get("fmt"), "png-alpha");
  assert.equal(actual.searchParams.get("wid"), "940");
  assert.throws(() => officialIphonePhotoUrl(`<img src="${url}">`, "iphone-duo-finish-select-star-white-202609"));
  assert.throws(() => validateIphonePng(Buffer.from("<html>Access denied</html>")));
  const header = Buffer.alloc(24);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(header); header.writeUInt32BE(940,16); header.writeUInt32BE(1112,20);
  assert.deepEqual(validateIphonePng(header), {width:940,height:1112});
  header.writeUInt32BE(20,16); assert.throws(() => validateIphonePng(header));
});

test("deployment is targeted, backs up before publishing, and preserves existing commerce data", async () => {
  const script = await readFile(new URL("../scripts/sync-iphone-2026-catalog.ts", import.meta.url), "utf8");
  assert(script.includes("dryRun ? [] : await downloadIphone2026Photos()"));
  assert(script.indexOf("await writeFile(backup") < script.indexOf("await tx.product.create"));
  assert(script.includes("backups/iphone-2026"));
  const update = script.slice(script.indexOf("await tx.product.update"));
  for (const forbidden of ["deleteMany", "productVariant.update", "price:", "inStock:"]) assert(!script.includes(forbidden));
  assert(!update.includes("status:"));
});

test("downloader stops on generic duplicate photos before saving files (mocked network)", async t => {
  const header = Buffer.alloc(24);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(header); header.writeUInt32BE(940,16); header.writeUInt32BE(1112,20);
  const html = IPHONE_2026_CATALOG.flatMap(p => p.colors.map(c => `<img src="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/${p.slug}-finish-select-${c.toLowerCase().replaceAll(" ", "-")}-202609?fmt=png-alpha">`)).join("");
  t.mock.method(globalThis, "fetch", async (input: string | URL) => String(input).includes("/shop/buy-iphone/")
    ? new Response(html) : new Response(header, {headers:{"content-type":"image/png"}}));
  await assert.rejects(downloadIphone2026Photos(), /Duplicate colour images/);
});
