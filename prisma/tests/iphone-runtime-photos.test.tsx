import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import { GET } from "../../src/app/api/catalog/iphone-2026/[file]/route";
import { isIphone2026PhotoFile, iphone2026RuntimePhoto } from "../../src/lib/iphone2026Photos";
import { sortIphoneVariants, rankCatalogModel } from "../../src/lib/iphoneVariantOrder";
import { pickVariantImages } from "../../src/lib/pickCoverImage";
import { IPHONE_2026_CATALOG, planIphone2026Addition } from "../data/iphone-2026-catalog";

test("all ten colour assets resolve through runtime delivery, custom uploads stay untouched", () => {
  for (const p of IPHONE_2026_CATALOG) {
    const plan = planIphone2026Addition(p);
    for (const v of plan.variantsToCreate) assert(pickVariantImages(plan.images, plan.colorImages, v)[0].startsWith("/api/catalog/iphone-2026/"));
  }
  assert.equal(iphone2026RuntimePhoto("/uploads/custom.png"), "/uploads/custom.png");
});
test("runtime photo endpoint rejects traversal and arbitrary file reads", async () => {
  for (const file of ["../.env", "..%2f.env", "iphone-18-pro-black.png/../../.env", "unknown.png", "iphone-duo-black.png"]) {
    assert(!isIphone2026PhotoFile(file));
    assert.equal((await GET(new Request("http://localhost"), {params:Promise.resolve({file})})).status,404);
  }
});
test("runtime serves a newly available photo and does not cache missing files", async t => {
  let available = false;
  t.mock.method(fs, "readFile", async (file: string) => {
    assert(String(file).endsWith("iphone-18-pro-black.png"));
    if (!available) throw Object.assign(new Error("missing"), {code:"ENOENT"});
    return Buffer.from([137,80,78,71]);
  });
  const args = {params:Promise.resolve({file:"iphone-18-pro-black.png"})};
  const missing = await GET(new Request("http://localhost"), args);
  assert.equal(missing.status,404); assert.equal(missing.headers.get("cache-control"),"no-store");
  available = true;
  const result = await GET(new Request("http://localhost"), args);
  assert.equal(result.status,200); assert.equal(result.headers.get("content-type"),"image/png");
  assert.equal((await result.arrayBuffer()).byteLength,4);
});
test("iPhone memory sorts numerically without changing prices, IDs, or other categories", () => {
  const offers = ["512GB","1TB","2TB","256GB"].map((memory,i)=>({memory,id:String(i),price:100+i}));
  const before = structuredClone(offers);
  assert.deepEqual(sortIphoneVariants("iphone-18-pro-max", offers).map(v=>v.memory),["256GB","512GB","1TB","2TB"]);
  assert.deepEqual(offers,before);
  assert.equal(sortIphoneVariants("ipad-pro", offers),offers);
});
test("new iPhones rank before older generations including Apple-prefixed names", () => {
  const order = ["iPhone 18 Pro Max","iPhone 18 Pro","iPhone Duo","iPhone 17 Pro Max","iPhone 17 Pro","iPhone 16"];
  const names = ["iPhone 16","Apple iPhone 18 Pro Max","iPhone 17 Pro","iPhone Duo","iPhone 18 Pro","iPhone 17 Pro Max"];
  assert.deepEqual(names.sort((a,b)=>rankCatalogModel(order,a)-rankCatalogModel(order,b)),["Apple iPhone 18 Pro Max",...order.slice(1)]);
});
