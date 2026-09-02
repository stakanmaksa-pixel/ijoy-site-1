"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export function CartButton({ variantId, className = "", compact = false }: { variantId: string; className?: string; compact?: boolean }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        addToCart(variantId);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
      className={compact
        ? `rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark ${className}`
        : `rounded-full border border-brand px-5 py-3 font-display text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white ${className}`}
    >
      {added ? "Добавлено" : "В корзину"}
    </button>
  );
}
