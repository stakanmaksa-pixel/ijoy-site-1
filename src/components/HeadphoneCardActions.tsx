import { CartButton } from "./CartButton";
import { CompareButton } from "./CompareButton";
import { FavoriteButton } from "./FavoriteButton";

// The enclosing product link handles "Подробнее". Buttons stop link navigation themselves.
export function HeadphoneCardActions({ slug, variantId, canBuy }: {
  slug: string; variantId: string | null; canBuy: boolean;
}) {
  return <div className="mt-3 grid grid-cols-[minmax(0,1fr)_2.25rem_2.25rem] items-center gap-1.5" data-card-actions>
    <div className="col-span-3 @[210px]:col-span-1">
      {variantId && canBuy
        ? <CartButton variantId={variantId} compact className="min-h-9 w-full whitespace-nowrap" />
        : <span className="flex min-h-9 items-center justify-center rounded-full border border-brand px-2 text-xs font-semibold text-brand">Подробнее</span>}
    </div>
    <div className="col-start-2 @[210px]:col-start-auto"><CompareButton slug={slug} subtle /></div>
    {variantId && <FavoriteButton variantId={variantId} compact />}
  </div>;
}
