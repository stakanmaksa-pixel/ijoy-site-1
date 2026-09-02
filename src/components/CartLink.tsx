"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const count = useCart().reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Link href="/cart" className="relative whitespace-nowrap rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-accent hover:text-accent" aria-label={`Корзина${count ? `, ${count} шт.` : ""}`}>
      Корзина
      {count > 0 && <span className="ml-1.5 inline-flex min-w-5 justify-center rounded-full bg-brand px-1 text-xs font-semibold leading-5 text-white">{count}</span>}
    </Link>
  );
}
