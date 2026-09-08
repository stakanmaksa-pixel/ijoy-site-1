import { CartButton } from "@/components/CartButton";

/** Общая нижняя часть карточки модели и конкретной модификации. */
export function CatalogCardFooter({ priceLabel, variantId, canBuy, inStock }: {
  priceLabel: string;
  variantId: string | null;
  canBuy: boolean;
  inStock: boolean;
}) {
  return <div className="mt-auto pt-3">
    <div className="flex min-h-8 flex-col items-center justify-center gap-1 text-center">
      <span className="text-base font-semibold text-foreground">{priceLabel}</span>
      {!inStock && <span className="text-xs text-zinc-400">Под заказ</span>}
    </div>
    {variantId && canBuy && <CartButton variantId={variantId} compact className="mt-3 min-h-10 w-full" />}
  </div>;
}
