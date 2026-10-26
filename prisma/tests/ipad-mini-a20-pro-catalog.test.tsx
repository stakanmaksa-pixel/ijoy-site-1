import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { MINI_A20_SLUG, MINI_A20_CONTENT, MINI_A20_VARIANTS, MINI_A20_IMAGES, MINI_A20_COLOR_IMAGES, MINI_A20_PHOTO_ASSETS, isRetiredMiniA17Product, miniA20Photo, miniA20OptionKey, planMiniA20Addition } from "../data/ipad-mini-a20-pro-catalog";
import { MINI_SLUG, MINI_OPTIONS } from "../data/ipad-mini-catalog";
import { validateMiniA20Photo } from "../scripts/download-ipad-mini-a20-pro-photos";
import { VariantGrid } from "../../src/components/VariantGrid";
import { ProductDetail } from "../../src/components/ProductDetail";
import { pickVariantImages } from "../../src/lib/pickCoverImage";
import { getCompatibleAccessoryBundle } from "../../src/lib/compatibleAccessories";

test("exactly 20 official combinations, never 128GB nano; no invented price or stock", () => {
  assert.equal(MINI_A20_VARIANTS.length, 20);
  assert.equal(new Set(MINI_A20_VARIANTS.map(miniA20OptionKey)).size, 20);
  assert.equal(MINI_A20_VARIANTS.filter(v => v.memory === "128GB").length, 4);
  assert.equal(MINI_A20_VARIANTS.filter(v => v.memory === "256GB").length, 8);
  assert.equal(MINI_A20_VARIANTS.filter(v => v.region.includes("Нанотекстурное")).length, 8);
  assert(MINI_A20_VARIANTS.every(v => v.price === null && v.inStock === false));
  assert.equal(MINI_SLUG, "ipad-mini-a17-pro");
  assert.equal(MINI_OPTIONS.length, 24);
});

test("repeat sync preserves offers and creates no duplicates, including legacy standard-glass notation", () => {
  const existing = MINI_A20_VARIANTS.map((v, i) => ({ ...v, id: `keep-${i}`, price: i ? null : "72000", inStock: !i, region: v.region.replace(" · Стандартное стекло", "").replaceAll("‑", "-") }));
  const before = structuredClone(existing);
  assert.deepEqual(planMiniA20Addition(existing), []);
  assert.deepEqual(existing, before);
  assert.equal(planMiniA20Addition(existing.slice(0, 3)).length, 17);
});

test("unknown or duplicate configurations stop instead of being deleted or guessed", () => {
  const first = { ...MINI_A20_VARIANTS[0], id: "first" };
  assert.throws(() => planMiniA20Addition([first, { ...first, id: "duplicate" }]), /Дублирующаяся/);
  assert.throws(() => planMiniA20Addition([{ ...first, color: "Purple" }]), /Неизвестная/);
  assert.throws(() => planMiniA20Addition([{ ...first, region: "Wi-Fi · Нанотекстурное стекло" }]), /Неизвестная/);
  assert.throws(() => planMiniA20Addition([{ ...first, region: "US" }]), /Неизвестная/);
  assert.throws(() => miniA20Photo("Purple"), /Unknown/);
});

test("bundled new-generation Apple photographs are valid, distinct and mapped to the actual finish", async () => {
  const hashes = new Set<string>();
  for (const photo of MINI_A20_PHOTO_ASSETS) {
    assert(photo.source.startsWith("https://www.apple.com/newsroom/images/2026/10/"));
    const bytes = await readFile(path.join(process.cwd(), "public", photo.file.slice(1)));
    validateMiniA20Photo(bytes);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(hashes.size, 3);
  assert.throws(() => validateMiniA20Photo(Buffer.from("<html>not a photo</html>")));
  for (const option of MINI_A20_VARIANTS) assert.deepEqual(pickVariantImages(MINI_A20_IMAGES, MINI_A20_COLOR_IMAGES, option), [miniA20Photo(option.color)]);
});

test("information distinguishes processors by storage, launch from local stock, and supported Pencil models", () => {
  assert(MINI_A20_CONTENT.specs.Процессор.includes("128/256"));
  assert(MINI_A20_CONTENT.specs.Процессор.includes("CPU 5"));
  assert(MINI_A20_CONTENT.specs.Процессор.includes("CPU 6"));
  assert(MINI_A20_CONTENT.specs.SIM.includes("только eSIM"));
  assert(MINI_A20_CONTENT.description.includes("6 ноября 2026"));
  assert(!MINI_A20_CONTENT.specs.Дисплей.includes("120 Гц"));
  assert(getCompatibleAccessoryBundle(MINI_A20_SLUG)?.slugs.includes("apple-pencil-pro"));
  assert(!getCompatibleAccessoryBundle(MINI_A20_SLUG)?.slugs.some(slug => slug.includes("keyboard")));
});

test("only the new mini remains in navigation; A17 Pro records and variants remain available for history", async () => {
  const source = await readFile(path.join(process.cwd(), "src/lib/catalog.ts"), "utf8");
  const newer = source.indexOf('"Apple iPad mini (A20 Pro, 2026)"');
  const older = source.indexOf('"Apple iPad mini (A17 Pro)"');
  assert(newer >= 0 && older === -1);
  assert(!source.includes('"iPad Mini 7"'));
  assert.equal(MINI_SLUG, "ipad-mini-a17-pro");
  assert.equal(MINI_OPTIONS.length, 24);
});

test("retirement targets only Apple mini A17 Pro and known Mini 7 aliases, never A20 or other models", () => {
  const tablet = (name: string, slug = "legacy-mini", brand: string | null = "Apple", category = "planshety") => ({ name, slug, brand, category: { slug: category } });
  for (const model of [tablet("Apple iPad mini (A17 Pro)"), tablet("iPad Mini 7"), tablet("iPad mini (A17 Pro, 2024)"), tablet("iPad mini", "ipad-mini-a17-pro")]) assert(isRetiredMiniA17Product(model), model.name);
  for (const model of [tablet(MINI_A20_CONTENT.name, MINI_A20_SLUG), tablet("iPad mini (A20 Pro)", "ipad-mini-a17-pro"), tablet("iPad mini 6"), tablet("iPad Pro 11 M5"), tablet("iPad Mini 7", "other", "Samsung"), tablet("iPad Mini 7", "other", "Apple", "aksessuary"), tablet("iPad mini (A17 Pro)", MINI_A20_SLUG)]) assert.equal(isRetiredMiniA17Product(model), false, model.name);
});

test("generic imports and legacy maintenance cannot reintroduce the retired A17 Pro", async () => {
  const official = await readFile(path.join(process.cwd(), "prisma/official-catalog.ts"), "utf8");
  assert(!official.includes('slug: "ipad-mini-a17-pro"'));
  const legacy = await readFile(path.join(process.cwd(), "prisma/scripts/sync-ipad-mini-catalog.ts"), "utf8");
  assert(legacy.includes('...MINI_CONTENT, status: "HIDDEN"'));
});

test("storefront renders all 20 options, glass/connectivity filters, specs and request price", () => {
  const variants = MINI_A20_VARIANTS.map((v, i) => ({ ...v, id: `new-mini-${i}` }));
  const grid = renderToStaticMarkup(<VariantGrid slug={MINI_A20_SLUG} variants={variants} imageByVariant={{}} />);
  assert(grid.includes("Показано вариантов: 20"));
  assert(grid.includes("Стекло дисплея"));
  assert(grid.includes("Подключение"));
  assert(!grid.includes("Регион / SIM"));
  assert.equal((grid.match(/aria-label="Добавить в избранное"/g) ?? []).length, 20);
  const nano = variants.find(v => v.memory === "256GB" && v.color === "Midnight" && v.region.includes("Нанотекстурное"))!;
  const html = renderToStaticMarkup(<ProductDetail productName={MINI_A20_CONTENT.name} productSlug={MINI_A20_SLUG} description={MINI_A20_CONTENT.description} specs={MINI_A20_CONTENT.specs} highlights={MINI_A20_CONTENT.highlights} variants={variants} initialVariantId={nano.id} images={MINI_A20_IMAGES} colorImages={MINI_A20_COLOR_IMAGES} />);
  assert(html.includes("Уточняйте у менеджера"));
  assert(html.includes("A20 Pro"));
  assert(html.includes("Нанотекстурное стекло"));
  assert(html.includes(miniA20Photo("Midnight")));
});
