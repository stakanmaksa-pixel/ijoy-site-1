import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductDetail } from "../../src/components/ProductDetail";
import { groupProductSpecs } from "../../src/lib/productSpecs";
import { IPHONE_CONTENT_OVERRIDES } from "../iphone-content";

const specs = IPHONE_CONTENT_OVERRIDES["17 Pro Max"].specs;
function render(slug: string, values: Record<string, string> = specs) {
  return renderToStaticMarkup(<ProductDetail productSlug={slug} productName={slug} variants={[]} specs={values} />);
}

test("iPhone 17 Pro Max specs use one initially open section and retain every value", () => {
  const html = render("iphone-17-pro-max");
  assert.equal((html.match(/<details /g) ?? []).length, groupProductSpecs(specs).length);
  assert.equal((html.match(/<details[^>]* open=""/g) ?? []).length, 1);
  assert.match(html, /<details open=""[^>]*><summary[^>]*>Основное/);
  for (const [label, value] of Object.entries(specs)) {
    assert(html.includes(renderToStaticMarkup(<dt>{label}</dt>).replace(/^<dt>|<\/dt>$/g, "")), label);
    assert(html.includes(renderToStaticMarkup(<dd>{value}</dd>).replace(/^<dd>|<\/dd>$/g, "")), label);
  }
});

test("other models retain their existing specification layout", () => {
  for (const slug of ["iphone-17-pro", "iphone-16-pro-max", "ipad-pro-11-m5"]) {
    const html = render(slug);
    assert(!html.includes("<details"));
    assert(html.includes("md:grid-cols-2"));
    assert(html.includes("Основное"));
  }
});

test("empty specs are hidden and unknown keys remain accessible", () => {
  assert(!render("iphone-17-pro-max", {}).includes("Характеристики"));
  const html = render("iphone-17-pro-max", { "Особый параметр": "Полное значение" });
  assert(html.includes("Дополнительно"));
  assert(html.includes("Полное значение"));
  assert.match(html, /<details open=""/);
});
