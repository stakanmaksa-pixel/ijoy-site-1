import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { PageHero } from "@/components/PageHero";
import { CallbackForm } from "@/components/CallbackForm";
import {
  getCategoriesWithCounts,
  getDistinctBrands,
  getPublishedProducts,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Каталог",
};

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const categorySlug = toSingle(params.category);
  const brand = toSingle(params.brand);
  const minPrice = toSingle(params.minPrice);
  const maxPrice = toSingle(params.maxPrice);

  const [categories, brands, products] = await Promise.all([
    getCategoriesWithCounts(),
    getDistinctBrands(),
    getPublishedProducts({
      categorySlug: categorySlug || undefined,
      brand: brand || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
  ]);

  return (
    <div>
      <PageHero title="Каталог Гаджетов iJoy Gadget Store" highlight="Гаджетов" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[240px_1fr]">
          <aside>
            <form method="get" className="flex flex-col gap-7">
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
                  <label className="mb-3 block text-sm font-medium text-foreground">
                    Бренд
                  </label>
                  <select
                    name="brand"
                    defaultValue={brand || ""}
                    className="w-full rounded-full border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 focus:border-accent focus:outline-none"
                  >
                    <option value="">Все бренды</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
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

              <button
                type="submit"
                className="rounded-full bg-brand px-4 py-2.5 font-display text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Применить
              </button>
            </form>
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
