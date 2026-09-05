"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { VariantCard } from "@/components/VariantCard";
import { colorLabel } from "@/lib/colorSwatch";

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

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function strapMaterial(region: string | null, isUltra: boolean) {
  if (!region) return null;
  if (/trail loop/i.test(region)) return "Нейлон";
  if (/alpine loop|sport loop/i.test(region)) return "Текстиль";
  if (/ocean band|sport band/i.test(region)) return "Силикон";
  if (/milanese loop/i.test(region)) return isUltra ? "Титан" : "Нержавеющая сталь";
  return null;
}

function strapSize(region: string | null) {
  if (!region) return null;
  const match = region.trim().match(/(?:^|\s)(XS\/S|S\/M|M\/L|S|M|L)$/i);
  return match?.[1].toUpperCase() ?? "Универсальный";
}

function toggleValue(value: string, setter: Dispatch<SetStateAction<string[]>>) {
  setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
}

function FilterGroup({
  label,
  selected,
  values,
  onChange,
  anyLabel,
  formatLabel = (value: string) => value,
}: {
  label: string;
  selected: string[];
  values: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
  anyLabel: string;
  formatLabel?: (value: string) => string;
}) {
  return <div>
    <h3 className="text-sm font-semibold text-foreground">{label}</h3>
    <div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
      <button type="button" onClick={() => onChange([])} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${!selected.length ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-accent"}`}>{anyLabel}</button>
      {values.map((item) => {
        const active = selected.includes(item);
        return <button key={item} type="button" aria-pressed={active} onClick={() => toggleValue(item, onChange)} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-accent"}`}>{formatLabel(item)}</button>;
      })}
    </div>
  </div>;
}

export function VariantGrid({
  slug,
  variants,
  imageByVariant,
}: {
  slug: string;
  variants: ProductVariantForGrid[];
  imageByVariant: Record<string, string | null>;
}) {
  const memories = useMemo(() => valuesOf(variants, "memory"), [variants]);
  const colors = useMemo(() => valuesOf(variants, "color"), [variants]);
  const regions = useMemo(() => valuesOf(variants, "region"), [variants]);
  const isWatch = slug.includes("watch") || variants.some((variant) => /(?:loop|band)/i.test(variant.region ?? ""));
  const isUltra = slug.includes("ultra");
  const strapMaterials = [...new Set(variants.map((variant) => strapMaterial(variant.region, isUltra)).filter(isPresent))];
  const strapSizeOrder = ["XS/S", "S/M", "M/L", "S", "M", "L", "Универсальный"];
  const strapSizes = [...new Set(variants.map((variant) => strapSize(variant.region)).filter(isPresent))]
    .sort((a, b) => strapSizeOrder.indexOf(a) - strapSizeOrder.indexOf(b));

  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStrapMaterials, setSelectedStrapMaterials] = useState<string[]>([]);
  const [selectedStrapSizes, setSelectedStrapSizes] = useState<string[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = variants.filter(
    (variant) =>
      (!selectedMemories.length || (variant.memory != null && selectedMemories.includes(variant.memory))) &&
      (!selectedColors.length || (variant.color != null && selectedColors.includes(variant.color))) &&
      (!selectedRegions.length || (variant.region != null && selectedRegions.includes(variant.region))) &&
      (!selectedStrapMaterials.length || selectedStrapMaterials.includes(strapMaterial(variant.region, isUltra) ?? "")) &&
      (!selectedStrapSizes.length || selectedStrapSizes.includes(strapSize(variant.region) ?? "")) &&
      (!onlyInStock || variant.inStock),
  );
  const hasFilters = memories.length > 1 || colors.length > 1 || regions.length > 1 || variants.some((v) => !v.inStock);
  const hasActiveFilters = selectedMemories.length > 0 || selectedColors.length > 0 || selectedRegions.length > 0 || selectedStrapMaterials.length > 0 || selectedStrapSizes.length > 0 || onlyInStock;

  function reset() {
    setSelectedMemories([]);
    setSelectedColors([]);
    setSelectedRegions([]);
    setSelectedStrapMaterials([]);
    setSelectedStrapSizes([]);
    setOnlyInStock(false);
  }

  function toggleCompare(id: string) {
    setCompareIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current,
    );
  }

  const compared = variants.filter((variant) => compareIds.includes(variant.id));

  return (
    <div className={hasFilters ? "mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]" : "mt-8"}>
      {hasFilters && <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 lg:sticky lg:top-36">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">Фильтры</h2>
          {hasActiveFilters && <button type="button" onClick={reset} className="text-sm text-zinc-500 hover:text-accent">Сбросить</button>}
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Выберите нужные характеристики.</p>
        <div className="mt-5 space-y-5">
          {memories.length > 1 && <FilterGroup label={isWatch ? "Размер корпуса" : "Память"} selected={selectedMemories} values={memories} onChange={setSelectedMemories} anyLabel="Все" />}
          {colors.length > 1 && <FilterGroup label={isWatch ? "Цвет корпуса" : "Цвет"} selected={selectedColors} values={colors} onChange={setSelectedColors} anyLabel="Все" formatLabel={colorLabel} />}
          {isWatch && strapMaterials.length > 1 && <FilterGroup label="Материал ремешка" selected={selectedStrapMaterials} values={strapMaterials} onChange={setSelectedStrapMaterials} anyLabel="Все" />}
          {isWatch && strapSizes.length > 1 && <FilterGroup label="Размер ремешка" selected={selectedStrapSizes} values={strapSizes} onChange={setSelectedStrapSizes} anyLabel="Все" />}
          {regions.length > 1 && <FilterGroup label={isWatch ? "Модель и цвет ремешка" : "Регион / SIM"} selected={selectedRegions} values={regions} onChange={setSelectedRegions} anyLabel="Все" />}
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
                <VariantCard slug={slug} variant={variant} imageUrl={imageByVariant[variant.id] ?? null} />
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
                  ...(isWatch ? [
                    ["Материал ремешка", (variant: ProductVariantForGrid) => strapMaterial(variant.region, isUltra) || "—"],
                    ["Размер ремешка", (variant: ProductVariantForGrid) => strapSize(variant.region) || "—"],
                  ] as const : []),
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
