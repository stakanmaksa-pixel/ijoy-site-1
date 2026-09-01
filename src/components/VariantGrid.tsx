"use client";

import { useMemo, useState } from "react";
import { VariantCard } from "@/components/VariantCard";

export type ProductVariantForGrid = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  price: number | null;
  inStock: boolean;
};

function valuesOf(variants: ProductVariantForGrid[], field: "memory" | "color" | "region") {
  return [...new Set(variants.map((variant) => variant[field]).filter((value): value is string => Boolean(value)))];
}

export function VariantGrid({
  slug,
  variants,
  imageByColor,
}: {
  slug: string;
  variants: ProductVariantForGrid[];
  imageByColor: Record<string, string | null>;
}) {
  const memories = useMemo(() => valuesOf(variants, "memory"), [variants]);
  const colors = useMemo(() => valuesOf(variants, "color"), [variants]);
  const regions = useMemo(() => valuesOf(variants, "region"), [variants]);
  const [memory, setMemory] = useState("");
  const [color, setColor] = useState("");
  const [region, setRegion] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = variants.filter(
    (variant) =>
      (!memory || variant.memory === memory) &&
      (!color || variant.color === color) &&
      (!region || variant.region === region) &&
      (!onlyInStock || variant.inStock),
  );
  const hasFilters = memories.length > 1 || colors.length > 1 || regions.length > 1 || variants.some((v) => !v.inStock);

  function reset() {
    setMemory("");
    setColor("");
    setRegion("");
    setOnlyInStock(false);
  }

  function toggleCompare(id: string) {
    setCompareIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current,
    );
  }

  const compared = variants.filter((variant) => compareIds.includes(variant.id));

  return (
    <>
      {hasFilters && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            {memories.length > 1 && (
              <label className="flex min-w-36 flex-1 flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Память
                <select value={memory} onChange={(event) => setMemory(event.target.value)} className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent">
                  <option value="">Любая</option>
                  {memories.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            )}
            {colors.length > 1 && (
              <label className="flex min-w-36 flex-1 flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Цвет
                <select value={color} onChange={(event) => setColor(event.target.value)} className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent">
                  <option value="">Любой</option>
                  {colors.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            )}
            {regions.length > 1 && (
              <label className="flex min-w-36 flex-1 flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Регион / SIM
                <select value={region} onChange={(event) => setRegion(event.target.value)} className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent">
                  <option value="">Любой</option>
                  {regions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            )}
            {variants.some((variant) => !variant.inStock) && (
              <label className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 text-sm text-zinc-700">
                <input type="checkbox" checked={onlyInStock} onChange={(event) => setOnlyInStock(event.target.checked)} className="h-4 w-4 accent-accent" />
                В наличии
              </label>
            )}
            {(memory || color || region || onlyInStock) && <button type="button" onClick={reset} className="px-2 py-2 text-sm text-zinc-500 hover:text-accent">Сбросить</button>}
          </div>
          <p className="mt-3 text-sm text-zinc-500">Показано вариантов: {filtered.length}</p>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((variant) => {
            const selected = compareIds.includes(variant.id);
            const limitReached = !selected && compareIds.length >= 3;
            return (
              <div key={variant.id} className="relative">
                <VariantCard slug={slug} variant={variant} imageUrl={imageByColor[variant.color ?? ""] ?? null} />
                <button
                  type="button"
                  onClick={() => toggleCompare(variant.id)}
                  disabled={limitReached}
                  className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "bg-accent text-white" : "bg-white text-zinc-700 hover:text-accent"}`}
                >
                  {selected ? "Выбрано" : "Сравнить"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm text-zinc-500">Нет вариантов с такими параметрами.</p>
      )}

      {compared.length > 0 && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Сравнение вариантов</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Выбрано: {compared.length} из 3</p>
            </div>
            <button type="button" onClick={() => setCompareIds([])} className="text-sm text-zinc-500 hover:text-accent">Очистить</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <tbody>
                {[
                  ["Память", (variant: ProductVariantForGrid) => variant.memory || "—"],
                  ["Цвет", (variant: ProductVariantForGrid) => variant.color || "—"],
                  ["Регион / SIM", (variant: ProductVariantForGrid) => variant.region || "—"],
                  ["Наличие", (variant: ProductVariantForGrid) => (variant.inStock ? "В наличии" : "Под заказ")],
                  ["Цена", (variant: ProductVariantForGrid) => (variant.price != null ? `${variant.price.toLocaleString("ru-RU")} ₽` : "Уточняйте у менеджера")],
                ].map(([label, value]) => (
                  <tr key={label as string} className="border-b border-zinc-100 last:border-0">
                    <th className="w-40 bg-zinc-50 px-4 py-3 font-medium text-zinc-600 sm:px-5">{label as string}</th>
                    {compared.map((variant) => <td key={variant.id} className="px-4 py-3 text-foreground sm:px-5">{(value as (item: ProductVariantForGrid) => string)(variant)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
