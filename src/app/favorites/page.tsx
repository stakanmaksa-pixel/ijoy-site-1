"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatPrice } from "@/lib/format";
import { useFavoriteVariantIds } from "@/lib/favorites";

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.variantId}
                href={`/product/${item.productSlug}?variant=${item.variantId}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
              >
                <div className="relative flex aspect-square items-center justify-center bg-zinc-50 text-zinc-300">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm">Фото</span>
                  )}
                  <FavoriteButton
                    variantId={item.variantId}
                    className="absolute right-3 top-3"
                  />
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
        )}
      </div>
    </div>
  );
}
