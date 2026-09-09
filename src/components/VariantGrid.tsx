"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { VariantCard } from "@/components/VariantCard";
import { colorLabel } from "@/lib/colorSwatch";
import { isSmartGlassesSlug } from "@/lib/smartGlasses";
import { gamingLifestyleAxisLabel, gamingLifestyleCategoryForProduct } from "@/lib/catalogAxes";

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

function bandChoice(region: string | null) {
  if (!region) return null;
  // Размер уже выбирается отдельным фильтром, поэтому не дублируем одну и
  // ту же модель ремешка строками S/M, M/L, S, M и L.
  return region.trim().replace(/\s+(?:XS\/S|S\/M|M\/L|S|M|L)$/i, "");
}

function bandChoiceLabel(value: string) {
  const translations: Array<[RegExp, string]> = [
    [/Black\/Charcoal/gi, "чёрный/угольный"],
    [/Blue\/Bright Blue/gi, "синий/ярко-синий"],
    [/Black Titanium/gi, "чёрный титан"],
    [/Natural Titanium/gi, "натуральный титан"],
    [/Light Blue/gi, "светло-голубой"],
    [/Anchor Blue/gi, "синий Anchor"],
    [/Neon Green/gi, "неоново-зелёный"],
    [/Purple Fog/gi, "сиреневый туман"],
    [/Light Blush/gi, "светло-розовый"],
    [/\(Black\)/gi, "(чёрный)"],
    [/\(Gold\)/gi, "(золотой)"],
    [/\(Natural\)/gi, "(натуральный)"],
    [/\(Slate\)/gi, "(графитовый)"],
  ];
  const translated = translations.reduce((label, [pattern, replacement]) => label.replace(pattern, replacement), value);
  return translated.replace(" (", " · ").replace(/\)$/, "");
}

function ipadRegion(region: string | null) {
  if (!region) return null;
  const [connectivity, glass] = region.split(" · ").map((value) => value.trim());
  return connectivity && /(?:Wi.?Fi|Cellular)/i.test(connectivity)
    ? { connectivity, glass: glass || null }
    : null;
}

function ipadConnectivityOrder(value: string) {
  return value === "Wi‑Fi" ? 0 : value === "Wi‑Fi + Cellular" ? 1 : 2;
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
  const isWatch = variants.some((variant) => /(?:loop|band)/i.test(variant.region ?? ""));
  const isGalaxyWatch = /^samsung-galaxy-watch-/.test(slug);
  const isIpad = /^(?:ipad-|samsung-galaxy-tab-)/.test(slug);
  const isSmartGlasses = isSmartGlassesSlug(slug);
  const gamingLifestyleCategory = gamingLifestyleCategoryForProduct(slug);
  const isGamingLifestyle = gamingLifestyleCategory != null;
  const isUltra = slug.includes("ultra");
  const bandChoices = isWatch
    ? [...new Set(variants.map((variant) => bandChoice(variant.region)).filter(isPresent))]
    : regions;
  const strapMaterials = [...new Set(variants.map((variant) => strapMaterial(variant.region, isUltra)).filter(isPresent))];
  const strapSizeOrder = ["XS/S", "S/M", "M/L", "S", "M", "L", "Универсальный"];
  const strapSizes = [...new Set(variants.map((variant) => strapSize(variant.region)).filter(isPresent))]
    .sort((a, b) => strapSizeOrder.indexOf(a) - strapSizeOrder.indexOf(b));
  const ipadConnectivity = [...new Set(variants.map((variant) => ipadRegion(variant.region)?.connectivity).filter(isPresent))]
    .sort((a, b) => ipadConnectivityOrder(a) - ipadConnectivityOrder(b));
  const ipadGlass = [...new Set(variants.map((variant) => ipadRegion(variant.region)?.glass).filter(isPresent))];

  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStrapMaterials, setSelectedStrapMaterials] = useState<string[]>([]);
  const [selectedStrapSizes, setSelectedStrapSizes] = useState<string[]>([]);
  const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
  const [selectedGlass, setSelectedGlass] = useState<string[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const filtered = variants.filter(
    (variant) =>
      (!selectedMemories.length || (variant.memory != null && selectedMemories.includes(variant.memory))) &&
      (!selectedColors.length || (variant.color != null && selectedColors.includes(variant.color))) &&
      (!selectedRegions.length || selectedRegions.includes(isWatch ? bandChoice(variant.region) ?? "" : variant.region ?? "")) &&
      (!selectedStrapMaterials.length || selectedStrapMaterials.includes(strapMaterial(variant.region, isUltra) ?? "")) &&
      (!selectedStrapSizes.length || selectedStrapSizes.includes(strapSize(variant.region) ?? "")) &&
      (!selectedConnectivity.length || selectedConnectivity.includes(ipadRegion(variant.region)?.connectivity ?? "")) &&
      (!selectedGlass.length || selectedGlass.includes(ipadRegion(variant.region)?.glass ?? "")) &&
      (!onlyInStock || variant.inStock),
  );
  const hasFilters = memories.length > 1 || colors.length > 1 || bandChoices.length > 1 || ipadConnectivity.length > 1 || ipadGlass.length > 1 || variants.some((v) => !v.inStock);
  const hasActiveFilters = selectedMemories.length > 0 || selectedColors.length > 0 || selectedRegions.length > 0 || selectedStrapMaterials.length > 0 || selectedStrapSizes.length > 0 || selectedConnectivity.length > 0 || selectedGlass.length > 0 || onlyInStock;

  function reset() {
    setSelectedMemories([]);
    setSelectedColors([]);
    setSelectedRegions([]);
    setSelectedStrapMaterials([]);
    setSelectedStrapSizes([]);
    setSelectedConnectivity([]);
    setSelectedGlass([]);
    setOnlyInStock(false);
  }

  return (
    <div className={hasFilters ? "mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]" : "mt-8"}>
      {hasFilters && <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 lg:sticky lg:top-36">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">Фильтры</h2>
          {hasActiveFilters && <button type="button" onClick={reset} className="text-sm text-zinc-500 hover:text-accent">Сбросить</button>}
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Выберите нужные характеристики.</p>
        <div className="mt-5 space-y-5">
          {memories.length > 1 && <FilterGroup label={isSmartGlasses ? "Размер" : isWatch || isGalaxyWatch ? "Размер корпуса" : isGamingLifestyle ? gamingLifestyleAxisLabel("memory", memories, gamingLifestyleCategory) : "Память"} selected={selectedMemories} values={memories} onChange={setSelectedMemories} anyLabel="Все" />}
          {colors.length > 1 && <FilterGroup label={isSmartGlasses ? "Оправа" : isWatch ? "Цвет корпуса" : isGamingLifestyle ? gamingLifestyleAxisLabel("color", colors, gamingLifestyleCategory) : "Цвет"} selected={selectedColors} values={colors} onChange={setSelectedColors} anyLabel="Все" formatLabel={isSmartGlasses ? undefined : colorLabel} />}
          {isWatch && strapMaterials.length > 1 && <FilterGroup label="Материал ремешка" selected={selectedStrapMaterials} values={strapMaterials} onChange={setSelectedStrapMaterials} anyLabel="Все" />}
          {isWatch && strapSizes.length > 1 && <FilterGroup label="Размер ремешка" selected={selectedStrapSizes} values={strapSizes} onChange={setSelectedStrapSizes} anyLabel="Все" />}
          {isIpad && ipadConnectivity.length > 1 && <FilterGroup label="Подключение" selected={selectedConnectivity} values={ipadConnectivity} onChange={setSelectedConnectivity} anyLabel="Все" />}
          {isIpad && ipadGlass.length > 1 && <FilterGroup label="Стекло дисплея" selected={selectedGlass} values={ipadGlass} onChange={setSelectedGlass} anyLabel="Все" />}
          {!isIpad && bandChoices.length > 1 && <FilterGroup label={isSmartGlasses ? "Линзы" : isWatch ? "Ремешок" : isGalaxyWatch ? "Подключение" : isGamingLifestyle ? gamingLifestyleAxisLabel("region", bandChoices, gamingLifestyleCategory) : "Регион / SIM"} selected={selectedRegions} values={bandChoices} onChange={setSelectedRegions} anyLabel="Все" formatLabel={isWatch ? bandChoiceLabel : undefined} />}
          {variants.some((variant) => !variant.inStock) && <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={onlyInStock} onChange={(event) => setOnlyInStock(event.target.checked)} className="h-4 w-4 accent-accent" /> Только в наличии</label>}
        </div>
      </aside>}

      <div>
        <p className="mb-4 text-sm text-zinc-500">Показано вариантов: {filtered.length}</p>
        {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((variant) => <VariantCard key={variant.id} slug={slug} variant={variant} imageUrl={imageByVariant[variant.id] ?? null} />)}
        </div>
        ) : (
        <p className="mt-5 text-sm text-zinc-500">Нет вариантов с такими параметрами.</p>
      )}

      </div>
    </div>
  );
}
