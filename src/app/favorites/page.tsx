"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatPrice } from "@/lib/format";
import { useFavoriteVariantIds } from "@/lib/favorites";
import { MAX_COMPARISON_ITEMS } from "@/lib/comparison";

type FavoriteItem = {
  variantId: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  price: number | null;
  inStock: boolean;
  productSlug: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
};

function variantLabel(item: FavoriteItem) {
  return (
    [item.memory, item.color, item.region].filter(Boolean).join(" · ") || "Стандарт"
  );
}

// Список избранного — сам список id модификаций хранится в localStorage
// браузера (favorites.ts, ключ по id ProductVariant — конкретная память +
// цвет + регион, а не товар целиком), а данные по этим id подгружаются с
// сервера через /api/favorites. Поэтому страница целиком клиентская.
export default function FavoritesPage() {
  const ids = useFavoriteVariantIds();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const idsKey = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/favorites?ids=${encodeURIComponent(idsKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const selectedSlugs = [...new Set(
    selectedVariantIds
      .map((id) => items.find((item) => item.variantId === id)?.productSlug)
      .filter((slug): slug is string => Boolean(slug)),
  )];

  function toggleForComparison(item: FavoriteItem) {
    setSelectedVariantIds((current) => {
      if (current.includes(item.variantId)) return current.filter((id) => id !== item.variantId);
      const currentSlugs = new Set(
        current.map((id) => items.find((entry) => entry.variantId === id)?.productSlug).filter(Boolean),
      );
      if (!currentSlugs.has(item.productSlug) && currentSlugs.size >= MAX_COMPARISON_ITEMS) return current;
      return [...current, item.variantId];
    });
  }

  return (
    <div>
      <PageHero title="Избранное iJoy Gadget Store" highlight="Избранное" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Пока пусто — добавляйте товары в избранное сердечком на карточке.
          </p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3">
              <div>
                <div className="font-medium text-foreground">Сравнить выбранные</div>
                <div className="text-sm text-zinc-500">Отметьте от 2 до 3 разных моделей.</div>
              </div>
              {selectedSlugs.length >= 2 ? (
                <Link
                  href={`/compare?models=${encodeURIComponent(selectedSlugs.join(","))}`}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  Сравнить ({selectedSlugs.length})
                </Link>
              ) : (
                <span className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500">Выберите 2 модели</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.variantId}
                href={`/product/${item.productSlug}?variant=${item.variantId}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
              >
                <div className="relative flex aspect-square items-center justify-center bg-zinc-50 text-zinc-300">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm">Фото</span>
                  )}
                  <FavoriteButton
                    variantId={item.variantId}
                    className="absolute right-3 top-3"
                  />
                  <label
                    className="absolute left-3 top-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm ring-1 ring-black/5"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleForComparison(item);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVariantIds.includes(item.variantId)}
                      onChange={() => toggleForComparison(item)}
                      onClick={(event) => event.stopPropagation()}
                      className="accent-accent"
                    />
                    Сравнить
                  </label>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  {item.brand ? (
                    <div className="text-xs uppercase tracking-wide text-zinc-400">
                      {item.brand}
                    </div>
                  ) : null}
                  <div className="font-medium text-foreground">{item.productName}</div>
                  <div className="text-sm text-zinc-500">{variantLabel(item)}</div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-base font-semibold text-foreground">
                      {item.price != null ? formatPrice(item.price) : "Уточняйте у менеджера"}
                    </span>
                    {!item.inStock && (
                      <span className="text-xs text-zinc-400">Под заказ</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
