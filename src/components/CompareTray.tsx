"use client";

import Link from "next/link";
import { useComparisonSlugs } from "@/lib/comparison";

export function CompareTray() {
  const slugs = useComparisonSlugs();
  if (slugs.length === 0) return null;

  const href = `/compare?models=${encodeURIComponent(slugs.join(","))}`;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
        <div>
          <div className="text-sm font-semibold text-foreground">Сравнение</div>
          <div className="text-xs text-zinc-500">Выбрано моделей: {slugs.length} из 3</div>
        </div>
        <Link href={href} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
          {slugs.length < 2 ? "Добавить ещё" : "Сравнить"}
        </Link>
      </div>
    </div>
  );
}
