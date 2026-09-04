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
  const isWatch = memories.length > 0 && memories.every((value) => /(?:mm|мм)$/i.test(value));

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

  function FilterGroup({ label, value, values, onChange, anyLabel }: { label: string; value: string; values: string[]; onChange: (value: string) => void; anyLabel: string }) {
    return <div>
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
        <button type="button" onClick={() => onChange("")} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${!value ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-accent"}`}>{anyLabel}</button>
        {values.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${value === item ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-accent"}`}>{item}</button>)}
      </div>
    </div>;
  }

  return (
    <div className={hasFilters ? "mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]" : "mt-8"}>
      {hasFilters && <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 lg:sticky lg:top-36">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">Фильтры</h2>
          {(memory || color || region || onlyInStock) && <button type="button" onClick={reset} className="text-sm text-zinc-500 hover:text-accent">Сбросить</button>}
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Выберите нужные характеристики.</p>
        <div className="mt-5 space-y-5">
          {memories.length > 1 && <FilterGroup label={isWatch ? "Размер корпуса" : "Память"} value={memory} values={memories} onChange={setMemory} anyLabel="Любой" />}
          {colors.length > 1 && <FilterGroup label={isWatch ? "Цвет корпуса" : "Цвет"} value={color} values={colors} onChange={setColor} anyLabel="Любой" />}
          {regions.length > 1 && <FilterGroup label={isWatch ? "Ремешок" : "Регион / SIM"} value={region} values={regions} onChange={setRegion} anyLabel="Любой" />}
          {variants.some((variant) => !variant.inStock) && <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={onlyInStock} onChange={(event) => setOnlyInStock(event.target.checked)} className="h-4 w-4 accent-accent" /> Только в наличии</label>}
        </div>
      </aside>}

      <div>
        <p className="mb-4 text-sm text-zinc-500">Показано вариантов: {filtered.length}</p>
        {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
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
                  [isWatch ? "Размер корпуса" : "Память", (variant: ProductVariantForGrid) => variant.memory || "—"],
                  [isWatch ? "Цвет корпуса" : "Цвет", (variant: ProductVariantForGrid) => variant.color || "—"],
                  [isWatch ? "Ремешок" : "Регион / SIM", (variant: ProductVariantForGrid) => variant.region || "—"],
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
      </div>
    </div>
  );
}
