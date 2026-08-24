import Link from "next/link";

export function CategoryCard({
  name,
  slug,
  productCount,
}: {
  name: string;
  slug: string;
  productCount: number;
}) {
  return (
    <Link
      href={`/catalog?category=${slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-accent"
    >
      <div className="font-display text-lg font-medium text-foreground">
        {name}
      </div>
      <div className="mt-6 text-sm text-zinc-500">{productCount} товаров</div>
    </Link>
  );
}
