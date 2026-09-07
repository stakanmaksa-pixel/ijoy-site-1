import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CartButton } from "@/components/CartButton";
import { colorLabel } from "@/lib/colorSwatch";
import { HeadphoneCardActions } from "@/components/HeadphoneCardActions";
import { headphonePhotoPadding, isHeadphoneProduct, resolveHeadphonePhoto } from "@/lib/headphonePhotos";
import { isSmartGlassesSlug, smartGlassesVariantLabel } from "@/lib/smartGlasses";
import { isGamingLifestyleProduct } from "@/lib/catalogAxes";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  // null — этой комбинации нет в прайсе, цену нужно уточнять у менеджера.
  price: number | null;
  inStock: boolean;
};

type VariantComparison = {
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
};

function variantLabel(v: Variant, isSmartGlasses = false) {
  return isSmartGlasses
    ? smartGlassesVariantLabel(v)
    : [v.memory, colorLabel(v.color), v.region].filter(Boolean).join(" · ") || "Стандарт";
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
  comparison,
}: {
  slug: string;
  variant: Variant;
  // Фото именно этого цвета (или общее фото товара, если по цвету пока
  // нет) — см. pickCoverImage в catalog.ts.
  imageUrl?: string | null;
  comparison?: VariantComparison;
}) {
  const isWatch = /watch/i.test(slug);
  const isSeries11 = slug === "apple-watch-series-11";
  const isSe3 = slug === "apple-watch-se-3";
  const isHeadphones = isHeadphoneProduct(slug);
  const photo = imageUrl ? resolveHeadphonePhoto(imageUrl) : imageUrl;
  const isIpad = /^ipad-/i.test(slug);
  const isSmartGlasses = isSmartGlassesSlug(slug);
  const isGamingLifestyle = isGamingLifestyleProduct(slug);
  const isAppleTvPhoto = imageUrl?.startsWith("/catalog/product-photos/apple-tv-4k/");
  const isMetaPhotoLifestyle = /\/meta-photo\/(?:insta360-x5|gopro-hero12)\.jpg$/.test(imageUrl ?? "");
  const isDjiMobilePhoto = imageUrl?.endsWith("/meta-photo/dji-osmo-mobile-7p.png");

  const imageClassName = isMetaPhotoLifestyle
    ? "absolute inset-0 h-full w-full object-cover"
    : isDjiMobilePhoto
      ? "h-full w-full scale-[3.1] object-contain"
      : isSeries11 || isSe3
    ? "h-full w-full scale-[1.08] object-contain"
    : isWatch
      ? "h-full w-full scale-[1.2] object-contain"
      : isHeadphones
        ? "absolute inset-0 h-full w-full object-contain"
        : isSmartGlasses
          ? "h-full w-full object-contain p-4 sm:p-5"
        : isGamingLifestyle
          ? "absolute inset-0 h-full w-full object-contain p-4 sm:p-5"
        : isIpad || isAppleTvPhoto
          ? "absolute inset-0 h-full w-full object-contain p-3"
        : "h-full w-full object-contain p-5 sm:p-6";

  return (
    <Link
      href={`/product/${slug}?variant=${variant.id}`}
      className="@container group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
    >
      <div className={`relative flex aspect-square shrink-0 items-center justify-center overflow-hidden text-zinc-300 ${isHeadphones || isIpad || isSmartGlasses || isAppleTvPhoto || isGamingLifestyle ? "bg-white" : isMetaPhotoLifestyle ? "bg-black" : "bg-zinc-50"}`}>
        {photo ? (
          <img
            src={photo}
            alt={variantLabel(variant, isSmartGlasses)}
            loading="lazy"
            decoding="async"
            className={imageClassName}
            style={isHeadphones ? { padding: headphonePhotoPadding(photo) } : undefined}
          />
        ) : (
          <span className="text-sm">Фото</span>
        )}
        {!isIpad && !isHeadphones && <FavoriteButton variantId={variant.id} className="absolute right-3 top-3" />}
        {!isIpad && !isHeadphones && variant.price != null && variant.inStock && <CartButton variantId={variant.id} compact className="absolute left-3 top-3" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className={`text-sm text-zinc-500 ${isHeadphones ? "min-h-12" : ""}`}>{variantLabel(variant, isSmartGlasses)}</div>
        <div className={`mt-auto flex items-center justify-between pt-2 ${isIpad ? "flex-wrap gap-2" : ""}`}>
          <span className="text-base font-semibold text-foreground">
            {variant.price != null ? formatPrice(variant.price) : "Уточняйте у менеджера"}
          </span>
          {!variant.inStock && (
            <span className="text-xs text-zinc-400">Под заказ</span>
          )}
          {isIpad && <div className="ml-auto flex shrink-0 items-center gap-2">
            {comparison && <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                comparison.onToggle();
              }}
              disabled={comparison.disabled}
              aria-pressed={comparison.selected}
              aria-label={comparison.selected ? "Убрать вариант из сравнения" : "Добавить вариант к сравнению"}
              title={comparison.disabled ? "В сравнении может быть до 3 вариантов" : comparison.selected ? "Убрать из сравнения" : "Сравнить варианты"}
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 transition-all duration-150 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-45 ${comparison.selected ? "bg-accent text-white" : "bg-white/95 text-zinc-500 hover:bg-white hover:text-accent"}`}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16" />
                <path d="M5 7h14" />
                <path d="m5 7-3 6h6L5 7Z" />
                <path d="m19 7-3 6h6l-3-6Z" />
                <path d="M8 20h8" />
              </svg>
            </button>}
            <FavoriteButton variantId={variant.id} />
          </div>}
        </div>
        {isIpad && variant.price != null && variant.inStock && (
          <CartButton variantId={variant.id} compact className="mt-3 w-full" />
        )}
        {isHeadphones && <HeadphoneCardActions slug={slug} variantId={variant.id} canBuy={variant.price != null && variant.inStock} />}
      </div>
    </Link>
  );
}
