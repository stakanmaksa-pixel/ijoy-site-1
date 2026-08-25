"use client";

import { useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductOrder } from "@/components/ProductOrder";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  price: number | null;
  inStock: boolean;
};

// Правая колонка (ProductOrder) сама переключает память/цвет/регион у себя
// внутри — фото с сердечком избранного лежит в левой колонке, отдельным
// компонентом. Чтобы сердечко всегда относилось к реально выбранной сейчас
// модификации (а не просто к товару), оба блока живут в одном клиентском
// компоненте: ProductOrder сообщает сюда id выбранной модификации через
// onSelectedVariantChange, а он идёт в FavoriteButton.
export function ProductDetail({
  productName,
  brand,
  description,
  variants,
  initialVariantId,
  specs,
  highlights,
  previousGenLabel,
  previousGenHighlights,
}: {
  productName: string;
  brand?: string | null;
  description?: string | null;
  variants: Variant[];
  initialVariantId?: string;
  specs?: Record<string, string> | null;
  highlights?: string[] | null;
  previousGenLabel?: string | null;
  previousGenHighlights?: string[] | null;
}) {
  const initial =
    (initialVariantId && variants.find((v) => v.id === initialVariantId)) ||
    variants.find((v) => v.inStock) ||
    variants[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(initial?.id);

  const specEntries = specs ? Object.entries(specs) : [];
  const hasHighlights = Boolean(highlights && highlights.length > 0);
  const hasComparison = Boolean(previousGenLabel && previousGenHighlights && previousGenHighlights.length > 0);

  return (
    <div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-50 to-accent/5 text-zinc-300">
          Фото
          {selectedId && (
            <FavoriteButton variantId={selectedId} className="absolute right-4 top-4" />
          )}
        </div>

        <div>
          {brand && (
            <div className="text-sm font-medium uppercase tracking-wide text-accent">
              {brand}
            </div>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-foreground">
            {productName}
          </h1>

          {description && (
            <p className="mt-4 text-sm leading-6 text-zinc-600">{description}</p>
          )}

          {hasHighlights && (
            <ul className="mt-5 space-y-2">
              {highlights!.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <ProductOrder
              productName={productName}
              variants={variants}
              initialVariantId={initialVariantId}
              onSelectedVariantChange={setSelectedId}
            />
          </div>
        </div>
      </div>

      {/* Характеристики и сравнение с предыдущим поколением — под основным
          блоком, во всю ширину. Пока заполнено точечно (пилот iPhone 17 Pro
          Max, см. prisma/seed.ts), поэтому блоки просто не рендерятся, если
          данных нет — старые товары выглядят как раньше. */}
      {(specEntries.length > 0 || hasComparison) && (
        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
          {specEntries.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Характеристики
              </h2>
              <dl className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
                {specEntries.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="text-right font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {hasComparison && (
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Чем лучше {previousGenLabel}
              </h2>
              <ul className="mt-4 space-y-3 rounded-2xl border border-zinc-100 p-4">
                {previousGenHighlights!.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
