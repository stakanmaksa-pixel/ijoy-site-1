"use client";

import Link from "next/link";
import { useFavoriteVariantIds } from "@/lib/favorites";
import { useComparisonSlugs } from "@/lib/comparison";

function QuickLink({ href, label, count, symbol }: { href: string; label: string; count: number; symbol: string }) {
  return <Link href={href} aria-label={label} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-lg text-zinc-600 transition-colors hover:border-accent hover:text-accent" title={label}><span aria-hidden="true">{symbol}</span>{count > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 justify-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-5 text-white">{count}</span>}</Link>;
}

export function HeaderQuickLinks({ className = "hidden items-center gap-2 xl:flex" }: { className?: string }) {
  const favoriteCount = useFavoriteVariantIds().length;
  const compareCount = useComparisonSlugs().length;
  return <div className={className}><QuickLink href="/favorites" label="Избранное" count={favoriteCount} symbol="♡" /><QuickLink href="/compare" label="Сравнение" count={compareCount} symbol="⇄" /></div>;
}
