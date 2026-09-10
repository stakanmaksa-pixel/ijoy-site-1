import assert from "node:assert/strict";
import { test } from "node:test";
import { access } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCard } from "../../src/components/ProductCard";
import { VariantCard } from "../../src/components/VariantCard";
import { ProductPhoto } from "../../src/components/ProductPhoto";
import { catalogPhotoBounds, resolveCatalogPhoto } from "../../src/lib/catalogPhotos";
import bounds from "../../src/lib/catalogPhotoBounds.json";
import { GAMING_LIFESTYLE_CATALOG } from "../data/gaming-lifestyle-catalog";
import { pickVariantImages } from "../../src/lib/pickCoverImage";

test("all model cards use the same favorite, centered price and bottom cart", () => {
  for (const slug of ["ipad-pro-11-m5", "samsung-galaxy-s26", "magic-keyboard-ipad-pro-11-m5", "airpods-pro-3", "apple-watch-series-11", "playstation-5-pro", "meta-quest-3", "google-fitbit-air"]) {
    const html = renderToStaticMarkup(<ProductCard slug={slug} name={slug} minPrice={10000} hasStock defaultVariantId="chosen-id" coverImage="/test.jpg" />);
    assert.equal((html.match(/<button/g) ?? []).length, 2, slug);
    assert(html.includes('aria-label="Добавить в избранное"'), slug);
    assert(html.includes("absolute right-3 top-3"), slug);
    assert(html.indexOf("В корзину") > html.indexOf("text-center"), slug);
    assert(!html.includes("Сравнить"), slug);
  }
});

test("variant identity, label, nullable price and stock survive the layout change", () => {
  const variant = { id: "variant-silver-512", memory: "512GB", color: "Silver", region: "Wi-Fi", price: 96500, inStock: true };
  const priced = renderToStaticMarkup(<VariantCard slug="ipad-pro-11-m5" variant={variant} />);
  assert(priced.includes("?variant=variant-silver-512"));
  assert(priced.includes("512GB"));
  assert(priced.includes("В корзину"));
  for (const unavailable of [{ ...variant, price: null }, { ...variant, inStock: false }]) {
    const html = renderToStaticMarkup(<VariantCard slug="ipad-pro-11-m5" variant={unavailable} />);
    assert(!html.includes("В корзину"));
    assert(html.includes("Добавить в избранное"));
    assert.equal((html.match(/Уточняйте у менеджера/g) ?? []).length, 1);
    assert(!html.includes("Под заказ"));
  }
});

test("photo viewports are positive, within the original canvas, and backed by files", async () => {
  for (const [url, box] of Object.entries(bounds)) {
    assert(box.w > 0 && box.h > 0 && box.x >= 0 && box.y >= 0, url);
    assert(box.x + box.w <= box.width && box.y + box.h <= box.height, url);
    const file = url.startsWith("/uploads/products/") ? `../seed-photos/${url.slice("/uploads/products/".length)}` : `../../public${url}`;
    await access(new URL(file, import.meta.url));
  }
});

test("known gaming sources resolve to local whole-device photos; custom photos remain untouched", async () => {
  for (const product of GAMING_LIFESTYLE_CATALOG) for (const image of product.images) {
    const photo = resolveCatalogPhoto(image, product.slug);
    await access(new URL(`../../public${photo}`, import.meta.url));
    assert(catalogPhotoBounds(photo), photo);
  }
  const root = "/catalog/product-photos/gaming-lifestyle/";
  assert.notEqual(resolveCatalogPhoto(root + "ps5-slim.png", "playstation-5-slim-disc-rev2"), resolveCatalogPhoto(root + "ps5-slim.png", "playstation-5-slim-digital-rev2"));
  assert.notEqual(resolveCatalogPhoto(root + "steam-deck-dock.jpg"), resolveCatalogPhoto(root + "steam-deck-oled.jpg"));
  assert.equal(pickVariantImages([root + "valve-steam-machine.jpg"], null, {region: "С Steam Controller"})[0], root + "valve-steam-machine-v2.jpg");
  assert.notEqual(pickVariantImages([root + "valve-steam-machine.jpg"], null, {region: "Без контроллера"})[0], root + "valve-steam-machine-v2.jpg");
  const custom = "/uploads/products/playstation-5-pro/my-photo.jpg";
  assert.equal(resolveCatalogPhoto(custom, "playstation-5-pro"), custom);
  assert.equal(catalogPhotoBounds(custom), null);
});

test("approved iPad framing stays contain; normalized objects are never stretched", () => {
  const ipad = renderToStaticMarkup(<ProductPhoto src="/uploads/products/ipad-pro-11-m5/cover.jpg" alt="iPad" />);
  assert(ipad.includes("object-contain p-3"));
  assert(!ipad.includes("scale-"));
  const keyboard = Object.keys(bounds).find(url => url.includes("/apple-keyboards/"))!;
  const html = renderToStaticMarkup(<ProductPhoto src={keyboard} alt="Magic Keyboard" />);
  assert(html.includes('aspect-ratio:'));
  assert(html.includes('loading="lazy"'));
  assert(html.includes('alt="Magic Keyboard"'));
});
