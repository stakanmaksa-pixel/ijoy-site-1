import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { PageHero } from "@/components/PageHero";
import { CallbackForm } from "@/components/CallbackForm";
import { CatalogAutoForm } from "@/components/CatalogAutoForm";
import { colorLabel } from "@/lib/colorSwatch";
import {
  getCategoriesWithCounts,
  getCatalogFilterOptions,
  getDistinctBrands,
  getPublishedProducts,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Каталог",
};

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function toList(value: string | string[] | undefined) { return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean); }

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const categorySlug = toSingle(params.category);
  const brand = toList(params.brand);
  const productSlug = toList(params.product);
  const memory = toList(params.memory);
  const color = toList(params.color);
  const onlyInStock = toSingle(params.inStock) === "1";
  const minPrice = toSingle(params.minPrice);
  const maxPrice = toSingle(params.maxPrice);
  const search = toSingle(params.q);

  const [categories, brands, products, modelOptions, attributeOptions] = await Promise.all([
    getCategoriesWithCounts(),
    getDistinctBrands(categorySlug || undefined),
    getPublishedProducts({
      categorySlug: categorySlug || undefined,
      brand: brand.length ? brand : undefined,
      productSlug: productSlug.length ? productSlug : undefined,
      memory: memory.length ? memory : undefined,
      color: color.length ? color : undefined,
      onlyInStock,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search: search || undefined,
    }),
    getCatalogFilterOptions({
      categorySlug: categorySlug || undefined,
      brand: brand.length ? brand : undefined,
    }),
    getCatalogFilterOptions({
      categorySlug: categorySlug || undefined,
      brand: brand.length ? brand : undefined,
      productSlug: productSlug.length ? productSlug : undefined,
    }),
  ]);

  return (
    <div>
      <PageHero title="Каталог Гаджетов iJoy Gadget Store" highlight="Гаджетов" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {search && (
          <p className="mb-6 text-sm text-zinc-500">
            Результаты поиска по запросу «{search}» — {products.length}{" "}
            {products.length === 1 ? "товар" : "товаров"}.{" "}
            <a href="/catalog" className="text-accent hover:underline">
              Сбросить
            </a>
          </p>
        )}

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[240px_1fr]">
          <aside>
            <CatalogAutoForm>
              {search && <input type="hidden" name="q" value={search} />}
              <div>
                <div className="mb-3 text-sm font-medium text-foreground">
                  Категория
                </div>
                <div className="flex flex-col gap-1.5 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 rounded-full px-1 py-1 text-zinc-600 has-[:checked]:text-accent">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      defaultChecked={!categorySlug}
                      className="accent-accent"
                    />
                    Все категории
                  </label>
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-full px-1 py-1 text-zinc-600 has-[:checked]:text-accent"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={c.slug}
                        defaultChecked={categorySlug === c.slug}
                        className="accent-accent"
                      />
                      {c.name} ({c.productCount})
                    </label>
                  ))}
                </div>
              </div>

              {brands.length > 0 && (
                <div>
                  <div className="mb-3 text-sm font-medium text-foreground">Бренд</div>
                  <div className="space-y-2">{brands.map((b) => <label key={b} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"><input type="checkbox" name="brand" value={b} defaultChecked={brand.includes(b)} className="h-4 w-4 accent-accent" />{b}</label>)}</div>
                </div>
              )}

              {modelOptions.products.length > 1 && (
                <div>
                  <div className="mb-3 text-sm font-medium text-foreground">Модель</div>
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">{modelOptions.products.map((product) => <label key={product.slug} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"><input type="checkbox" name="product" value={product.slug} defaultChecked={productSlug.includes(product.slug)} className="h-4 w-4 accent-accent" />{product.name}</label>)}</div>
                </div>
              )}

              {attributeOptions.memory.length > 0 && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-foreground">Память</label>
                  <div className="space-y-2">{attributeOptions.memory.map((value) => <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"><input type="checkbox" name="memory" value={value} defaultChecked={memory.includes(value)} className="h-4 w-4 accent-accent" />{value}</label>)}</div>
                </div>
              )}

              {attributeOptions.colors.length > 0 && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-foreground">Цвет</label>
                  <div className="space-y-2">{attributeOptions.colors.map((value) => <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"><input type="checkbox" name="color" value={value} defaultChecked={color.includes(value)} className="h-4 w-4 accent-accent" />{colorLabel(value)}</label>)}</div>
                </div>
              )}

              <div>
                <div className="mb-3 text-sm font-medium text-foreground">
                  Цена, ₽
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="от"
                    defaultValue={minPrice || ""}
                    className="w-full rounded-full border border-zinc-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="до"
                    defaultValue={maxPrice || ""}
                    className="w-full rounded-full border border-zinc-300 px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="inStock" value="1" defaultChecked={onlyInStock} className="h-4 w-4 accent-accent" />
                Только в наличии
              </label>

              <a href="/catalog" className="text-center text-sm text-zinc-500 hover:text-accent">Сбросить фильтры</a>
            </CatalogAutoForm>
          </aside>

          <section>
            {products.length === 0 ? (
              <p className="text-sm text-zinc-500">
                По вашему запросу ничего не найдено.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    slug={p.slug}
                    brand={p.brand}
                    minPrice={p.minPrice}
                    hasStock={p.hasStock}
                    defaultVariantId={p.defaultVariantId}
                    coverImage={p.coverImage}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-20">
          <CallbackForm title="Не нашли нужный гаджет?" source="Не нашли нужный гаджет" />
        </div>
      </div>
    </div>
  );
}
