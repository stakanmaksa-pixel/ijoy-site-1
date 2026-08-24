"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { ProductCard } from "@/components/ProductCard";
import { useFavoriteSlugs } from "@/lib/favorites";

type FavoriteProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  minPrice: number | null;
  hasStock: boolean;
};

// Список избранного — сам список слагов хранится в localStorage браузера
// (favorites.ts), а карточки товаров по этим слагам подгружаются с сервера
// через /api/favorites. Поэтому страница целиком клиентская.
export default function FavoritesPage() {
  const slugs = useFavoriteSlugs();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const slugsKey = slugs.join(",");

  useEffect(() => {
    let cancelled = false;
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/favorites?slugs=${encodeURIComponent(slugsKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsKey]);

  return (
    <div>
      <PageHero title="Избранное iJoy Gadget Store" highlight="Избранное" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Пока пусто — добавляйте товары в избранное сердечком на карточке.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                brand={p.brand}
                minPrice={p.minPrice}
                hasStock={p.hasStock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
