import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";

export function ProductCard({
  name,
  slug,
  brand,
  minPrice,
  hasStock,
}: {
  name: string;
  slug: string;
  brand?: string | null;
  minPrice: number | null;
  hasStock: boolean;
}) {
  return (
    <Link
      href={`/product/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
    >
      <div className="relative flex aspect-square items-center justify-center bg-zinc-50 text-zinc-300">
        <span className="text-sm">Фото</span>
        <FavoriteButton slug={slug} className="absolute right-3 top-3" />
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
            {minPrice != null ? `от ${formatPrice(minPrice)}` : "Цена по запросу"}
          </span>
          {!hasStock && (
            <span className="text-xs text-zinc-400">Под заказ</span>
          )}
        </div>
      </div>
    </Link>
  );
}
