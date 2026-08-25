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
}: {
  productName: string;
  brand?: string | null;
  description?: string | null;
  variants: Variant[];
  initialVariantId?: string;
}) {
  const initial =
    (initialVariantId && variants.find((v) => v.id === initialVariantId)) ||
    variants.find((v) => v.inStock) ||
    variants[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(initial?.id);

  return (
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
  );
}
