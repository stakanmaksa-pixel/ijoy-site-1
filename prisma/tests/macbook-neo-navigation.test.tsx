import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { directModelLink, modelLineMenuNode } from "../../src/lib/catalogPresentation";
import { OFFICIAL_CATALOG_ENTRIES, officialVariants } from "../official-catalog";
import { VariantGrid } from "../../src/components/VariantGrid";

test("Neo menu is a leaf linking to the actual model slug, without search or a selected variant", () => {
  for (const slug of ["macbook-neo-13", "macbook-neo"]) {
    const item = directModelLink({ name: "MacBook Neo", slug });
    const node = modelLineMenuNode("Apple MacBook Neo", [item], "/catalog?category=noutbuki&q=MacBook%20Neo");
    assert(!node?.children?.length); // Both desktop and touch menus render this as a link.
    assert.deepEqual(node, { label: "Apple MacBook Neo", href: `/product/${slug}` });
    assert(!node?.href?.includes("?")); // No memory, colour or variant preselection.
  }
});

test("Neo landing grid includes every existing memory/colour combination without mutating offers", () => {
  const model = OFFICIAL_CATALOG_ENTRIES.find(p => p.slug === "macbook-neo-13")!;
  const variants = officialVariants(model).map((v, i) => ({ ...v, id: `neo-${i}`, price: i % 2 ? 48000 : null, inStock: i % 3 !== 0 }));
  const before = structuredClone(variants);
  const html = renderToStaticMarkup(<VariantGrid slug={model.slug} variants={variants} imageByVariant={{}} />);
  assert.equal(variants.length, 8);
  assert(html.includes("Память") && html.includes("Цвет"));
  assert.equal((html.match(/aria-label="Добавить в избранное"/g) ?? []).length, 8);
  for (const v of variants) assert(html.includes(`/product/${model.slug}?variant=${v.id}`));
  assert.deepEqual(variants, before);
});

test("real multi-model laptop lines retain their submenu; empty lines are not emitted", () => {
  const items = ["macbook-pro-14-m5", "macbook-pro-16-m5"].map(slug => directModelLink({ name: slug, slug }));
  assert.deepEqual(modelLineMenuNode("Apple MacBook Pro M5", items, "/catalog?category=noutbuki&q=MacBook%20Pro%20M5"), {
    label: "Apple MacBook Pro M5", href: "/catalog?category=noutbuki&q=MacBook%20Pro%20M5", children: items,
  });
  assert.equal(modelLineMenuNode("Empty", []), null);
});

test("catalog menu uses the tested single-model resolver and no longer forces Neo into search", async () => {
  const source = await readFile(new URL("../../src/lib/catalog.ts", import.meta.url), "utf8");
  const neo = source.split("\n").find(line => line.includes('label: "Apple MacBook Neo"'))!;
  assert(neo && !neo.includes("directListing") && !neo.includes("buildChildren"));
  assert(!source.includes("alwaysUseGroupHref"));
  assert(source.includes("modelLineMenuNode(matcher.label, items, matcher.groupHref)"));
});
