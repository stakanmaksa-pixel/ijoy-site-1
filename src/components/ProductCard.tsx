import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CatalogCardFooter } from "@/components/CatalogCardFooter";
import { ProductPhoto } from "@/components/ProductPhoto";

export function ProductCard({ name, slug, brand, minPrice, hasStock, defaultVariantId, coverImage }: {
  name: string;
  slug: string;
  brand?: string | null;
  minPrice: number | null;
  hasStock: boolean;
  // The cover, favorite and cart all refer to the same default modification.
  defaultVariantId: string | null;
  coverImage?: string | null;
}) {
  return <Link href={`/product/${slug}`}
    className="@container group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent">
    <div className="relative aspect-square shrink-0 overflow-hidden bg-white">
      {coverImage ? <ProductPhoto src={coverImage} alt={name} slug={slug} /> :
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 p-5 text-center text-sm text-zinc-400">Фото скоро появится</div>}
      {defaultVariantId && <FavoriteButton variantId={defaultVariantId} overlay className="absolute right-3 top-3" />}
    </div>
    <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
      {brand && <div className="text-xs uppercase tracking-wide text-zinc-400">{brand}</div>}
      <div className="font-medium leading-6 text-foreground">{name}</div>
      <CatalogCardFooter priceLabel={minPrice != null ? `от ${formatPrice(minPrice)}` : "Уточняйте цену"}
        variantId={defaultVariantId} canBuy={minPrice != null && hasStock} inStock={hasStock} />
    </div>
  </Link>;
}
