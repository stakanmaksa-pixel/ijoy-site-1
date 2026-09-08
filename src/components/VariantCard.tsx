import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CatalogCardFooter } from "@/components/CatalogCardFooter";
import { ProductPhoto } from "@/components/ProductPhoto";
import { colorLabel } from "@/lib/colorSwatch";
import { isSmartGlassesSlug, smartGlassesVariantLabel } from "@/lib/smartGlasses";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  price: number | null;
  inStock: boolean;
};

export function VariantCard({ slug, variant, imageUrl }: {
  slug: string;
  variant: Variant;
  imageUrl?: string | null;
}) {
  const label = isSmartGlassesSlug(slug) ? smartGlassesVariantLabel(variant) :
    [variant.memory, colorLabel(variant.color), variant.region].filter(Boolean).join(" · ") || "Стандарт";
  return <Link href={`/product/${slug}?variant=${variant.id}`}
    className="@container group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent">
    <div className="relative aspect-square shrink-0 overflow-hidden bg-white">
      {imageUrl ? <ProductPhoto src={imageUrl} alt={label} slug={slug} region={variant.region} /> :
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-sm text-zinc-400">Фото скоро появится</div>}
      <FavoriteButton variantId={variant.id} overlay className="absolute right-3 top-3" />
    </div>
    <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
      <div className="text-sm text-zinc-500">{label}</div>
      <CatalogCardFooter priceLabel={variant.price != null ? formatPrice(variant.price) : "Уточняйте у менеджера"}
        variantId={variant.id} canBuy={variant.price != null && variant.inStock} inStock={variant.inStock} />
    </div>
  </Link>;
}
