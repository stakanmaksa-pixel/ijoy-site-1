import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { HEADPHONE_CONTENT, headphoneContentPatch, planStationRetail } from "../data/headphone-content";
import { GAMING_LIFESTYLE_CATALOG } from "../data/gaming-lifestyle-catalog";
import { ProductDetail } from "../../src/components/ProductDetail";

test("charging station catalogue retains only the 3000 RUB retail offer", () => {
  const station = GAMING_LIFESTYLE_CATALOG.find(p => p.slug === "dualsense-charging-station")!;
  assert.equal(station.variants.length, 1);
  assert.equal(station.variants[0].price, 3000);
  assert.equal(station.variants[0].memory, "1 шт");
  assert(!station.description.includes("количества в заказе"));
  assert(!station.specs["Цена"].includes("партии"));
});

test("retail plan archives only three wholesale offers and preserves all IDs and prices", () => {
  const variants = ["1 шт", "от 10 шт", "от 20 шт", "от 100 шт"].map((memory, i) => ({ id: `v${i}`, memory, price: [3000,2950,2900,2750][i], inStock: true }));
  const before = structuredClone(variants);
  const plan = planStationRetail(variants);
  assert.equal(plan.retail.id, "v0");
  assert.deepEqual(plan.wholesale.map(v => v.id), ["v1", "v2", "v3"]);
  assert.deepEqual(variants, before);
  assert.deepEqual(planStationRetail([plan.retail]), { retail: plan.retail, wholesale: [] });
  assert.throws(() => planStationRetail(variants.slice(1)), /Неоднозначные/);
  assert.throws(() => planStationRetail([...variants, { id: "unknown", memory: "от 5 шт", price: 1, inStock: true }]), /Неоднозначные/);
});

test("all nine headphones render descriptions, features, compatibility and specifications", () => {
  assert.equal(HEADPHONE_CONTENT.length, 9);
  assert.equal(new Set(HEADPHONE_CONTENT.map(p => p.slug)).size, 9);
  for (const p of HEADPHONE_CONTENT) {
    assert(p.description.length > 140 && p.highlights.length >= 3);
    assert(Object.keys(p.specs).length >= 5 && p.specs["Совместимость"]);
    assert(["www.apple.com", "support.apple.com", "www.playstation.com", "www.marshall.com"].includes(new URL(p.source).hostname));
    const patch = headphoneContentPatch(p);
    assert.deepEqual(Object.keys(patch).sort(), ["description", "highlights", "specs"]);
    const html = renderToStaticMarkup(<ProductDetail productName={p.slug} productSlug={p.slug} {...patch} variants={[{ id: p.slug, memory: null, color: "White", region: null, price: null, inStock: false }]} images={[]} colorImages={null} />);
    assert(html.includes(p.description));
    assert(html.includes("Совместимость"));
    assert(html.includes("Уточняйте у менеджера"));
  }
});

test("AirPods 4 versions and different gaming connections are not conflated", () => {
  const basic = HEADPHONE_CONTENT.find(p => p.slug === "airpods-4")!;
  const anc = HEADPHONE_CONTENT.find(p => p.slug === "airpods-4-anc")!;
  assert.equal(basic.specs["Шумоподавление"], "Без ANC");
  assert(anc.highlights.some(t => t.includes("20 часов")));
  assert(HEADPHONE_CONTENT.find(p => p.slug === "sony-pulse-3d")!.specs["Важно"].includes("Не подключается"));
});

test("sync backs up before writes and never deletes or overwrites prices, photos or stock", async () => {
  const script = await readFile(new URL("../scripts/sync-retail-headphones.ts", import.meta.url), "utf8");
  assert(script.indexOf("if (dryRun)") < script.indexOf("await writeFile(backup"));
  assert(script.indexOf("await writeFile(backup") < script.indexOf("await tx.product.update"));
  assert(script.includes("backups/retail-headphones"));
  for (const forbidden of [".delete", "price:", "inStock:", "images:", "colorImages:"]) assert(!script.includes(forbidden), forbidden);
});
