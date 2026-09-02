import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CartButton } from "@/components/CartButton";
import { colorLabel } from "@/lib/colorSwatch";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  // null — этой комбинации нет в прайсе, цену нужно уточнять у менеджера.
  price: number | null;
  inStock: boolean;
};

function variantLabel(v: Variant) {
  return [v.memory, colorLabel(v.color), v.region].filter(Boolean).join(" · ") || "Стандарт";
}

// Карточка одной конкретной модификации товара (память + цвет + регион) —
// показывается в сетке, когда у модели несколько модификаций и ни одна ещё
// не выбрана. Клик ведёт на страницу этой же модели с already выбранной
// модификацией (?variant=<id>).
//
// Сердечко избранного здесь привязано к id именно этой модификации (variant),
// а не к товару целиком — поэтому у разных карточек в этой сетке (один и тот
// же телефон, но разная память/цвет) сердечки независимы и не "загораются"
// все разом.
export function VariantCard({
  slug,
  variant,
  imageUrl,
}: {
  slug: string;
  variant: Variant;
  // Фото именно этого цвета (или общее фото товара, если по цвету пока
  // нет) — см. pickCoverImage в catalog.ts.
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={`/product/${slug}?variant=${variant.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
    >
      <div className="relative flex aspect-square items-center justify-center bg-zinc-50 text-zinc-300">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm">Фото</span>
        )}
        <FavoriteButton variantId={variant.id} className="absolute right-3 top-3" />
        {variant.price != null && variant.inStock && <CartButton variantId={variant.id} compact className="absolute left-3 top-3" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="text-sm text-zinc-500">{variantLabel(variant)}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-semibold text-foreground">
            {variant.price != null ? formatPrice(variant.price) : "Уточняйте у менеджера"}
          </span>
          {!variant.inStock && (
            <span className="text-xs text-zinc-400">Под заказ</span>
          )}
        </div>
      </div>
    </Link>
  );
}
