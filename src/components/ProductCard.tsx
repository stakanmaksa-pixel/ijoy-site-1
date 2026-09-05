import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CompareButton } from "@/components/CompareButton";
import { CartButton } from "@/components/CartButton";

const BRAND_CARD_THEMES: Record<string, string> = {
  Apple: "from-zinc-950 via-zinc-800 to-zinc-600",
  Samsung: "from-blue-950 via-blue-700 to-cyan-500",
  Xiaomi: "from-orange-700 via-orange-500 to-amber-300",
  POCO: "from-yellow-400 via-yellow-300 to-amber-100",
  HUAWEI: "from-red-950 via-red-700 to-red-400",
  HONOR: "from-sky-950 via-sky-700 to-cyan-400",
  OnePlus: "from-red-950 via-red-700 to-rose-400",
  Sony: "from-slate-950 via-slate-700 to-slate-400",
  GoPro: "from-slate-950 via-slate-700 to-cyan-500",
};

export function ProductCard({
  name,
  slug,
  brand,
  minPrice,
  hasStock,
  defaultVariantId,
  coverImage,
}: {
  name: string;
  slug: string;
  brand?: string | null;
  minPrice: number | null;
  hasStock: boolean;
  // Модификация, к которой привязано сердечко избранного на этой карточке
  // (самая дешёвая из товара — см. toProductSummary в catalog.ts). На самой
  // карточке нет выбора конкретной памяти/цвета, поэтому это разумное
  // значение по умолчанию; на странице товара избранное уже привязывается
  // к реально выбранной модификации.
  defaultVariantId: string | null;
  coverImage?: string | null;
}) {
  const fallbackTheme = BRAND_CARD_THEMES[brand ?? ""] ?? "from-brand-dark via-brand to-accent";

  return (
    <Link
      href={`/product/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
    >
      <div className="relative flex aspect-square items-center justify-center bg-zinc-50 text-zinc-300">
        {coverImage ? (
          // Все исходники имеют разное количество белого поля. Единая
          // внутренняя рамка не даёт одним товарам визуально занимать всю
          // карточку, а другим выглядеть заметно меньше.
          <img src={coverImage} alt={name} loading="lazy" decoding="async" className="h-full w-full object-contain p-5 sm:p-6" />
        ) : (
          <div className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-br p-5 text-white ${fallbackTheme}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/15 font-display text-xl font-semibold shadow-lg backdrop-blur-sm">
              {(brand ?? name).slice(0, 1)}
            </div>
            <div>
              {brand && (
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                  {brand}
                </div>
              )}
              <div className="mt-2 font-display text-lg font-medium leading-tight text-white">
                {name}
              </div>
              <div className="mt-3 text-xs text-white/70">Новая модель</div>
            </div>
          </div>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          <CompareButton slug={slug} />
          {defaultVariantId && <FavoriteButton variantId={defaultVariantId} />}
        </div>
        {defaultVariantId && minPrice != null && hasStock && <CartButton variantId={defaultVariantId} compact className="absolute left-3 top-3" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {brand ? (
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            {brand}
          </div>
        ) : null}
        <div className="font-medium text-foreground">{name}</div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            {minPrice != null ? `от ${formatPrice(minPrice)}` : "Уточняйте цену"}
          </span>
          {!hasStock && (
            <span className="text-xs text-zinc-400">Под заказ</span>
          )}
        </div>
      </div>
    </Link>
  );
}
