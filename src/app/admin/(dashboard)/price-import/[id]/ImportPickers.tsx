"use client";

import { useMemo, useState } from "react";

export type ImportVariantOption = {
  id: string;
  productName: string;
  productSlug: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  price: number | null;
};

export type ImportProductOption = { id: string; name: string; slug: string };

function normalize(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function searchableVariant(option: ImportVariantOption) {
  return normalize([
    option.productName,
    option.productSlug.replace(/[-_]/g, " "),
    option.memory,
    option.color,
    option.region,
  ].filter(Boolean).join(" "));
}

function matchesQuery(haystack: string, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

function VariantLabel({ option }: { option: ImportVariantOption }) {
  const details = [option.memory, option.color, option.region].filter(Boolean).join(" · ");
  return (
    <>
      <span className="block font-medium text-zinc-900">{option.productName}</span>
      <span className="block text-xs text-zinc-500">
        {details || "без характеристик"} · {option.price != null ? `${new Intl.NumberFormat("ru-RU").format(option.price)} ₽ сейчас` : "цена не указана"}
      </span>
    </>
  );
}

export function VariantPicker({
  options,
  suggestedIds,
  selectedId,
  initialQuery,
  name = "variantId",
  submitLabel = "Применить цену",
}: {
  options: ImportVariantOption[];
  suggestedIds: string[];
  selectedId: string | null;
  initialQuery: string;
  name?: string;
  submitLabel?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(selectedId ?? "");
  const suggested = useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option]));
    return suggestedIds.map((id) => byId.get(id)).filter((option): option is ImportVariantOption => Boolean(option));
  }, [options, suggestedIds]);
  const results = useMemo(() => {
    const preferredIds = new Set(suggestedIds);
    return options
      .filter((option) => matchesQuery(searchableVariant(option), query))
      .sort((a, b) => Number(preferredIds.has(b.id)) - Number(preferredIds.has(a.id)) || a.productName.localeCompare(b.productName))
      .slice(0, 60);
  }, [options, query, suggestedIds]);
  const selectedOption = options.find((option) => option.id === selected);

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 p-3">
      <label className="block text-xs text-zinc-600">
        Найти модификацию по модели, памяти, цвету или SIM
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Например: 17 Pro Max 1TB Blue eSIM"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>
      {selectedOption && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-2">
          <div><VariantLabel option={selectedOption} /></div>
          <button type="button" onClick={() => setSelected("")} className="shrink-0 text-xs text-zinc-600 underline">Сбросить</button>
        </div>
      )}
      {suggested.length > 0 && query === initialQuery && !selected && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-emerald-700">Автоматически подобрано ({suggested.length})</p>
          <div className="flex flex-col gap-1">
            {suggested.slice(0, 5).map((option) => (
              <button key={option.id} type="button" onClick={() => setSelected(option.id)} className="rounded-lg border border-emerald-200 px-2 py-1.5 text-left hover:bg-emerald-50">
                <VariantLabel option={option} />
              </button>
            ))}
          </div>
        </div>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-accent">Варианты этой модели{results.length ? ` · ${results.length} вариантов` : ""}</summary>
        {results.length ? (
          <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-zinc-200">
            {results.map((option) => (
              <button key={option.id} type="button" onClick={() => setSelected(option.id)} className="block w-full border-b border-zinc-100 px-3 py-2 text-left last:border-0 hover:bg-zinc-50">
                <VariantLabel option={option} />
              </button>
            ))}
          </div>
        ) : <p className="mt-2 text-xs text-zinc-500">Ничего не найдено. Уточните запрос.</p>}
      </details>
      <input type="hidden" name={name} value={selected} />
      <button type="submit" disabled={!selected} className="mt-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
        {submitLabel}
      </button>
    </div>
  );
}

export function ProductPicker({
  products,
  initialQuery,
  name = "productId",
  submitLabel = "Создать и принять",
}: {
  products: ImportProductOption[];
  initialQuery: string;
  name?: string;
  submitLabel?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState("");
  const results = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    return products.map((product) => {
      const haystack = normalize(`${product.name} ${product.slug.replace(/[-_]/g, " ")}`);
      const score = tokens.filter((token) => haystack.includes(token)).length;
      return { product, score };
    }).filter((item) => !tokens.length || item.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
      .slice(0, 30).map((item) => item.product);
  }, [products, query]);
  const selectedProduct = products.find((product) => product.id === selected);

  return (
    <div className="min-w-64 flex-1">
      <label className="block text-xs text-zinc-600">
        Товар для новой модификации
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Начните вводить модель товара"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>
      {selectedProduct && <p className="mt-1 text-xs text-emerald-700">Выбрано: {selectedProduct.name}</p>}
      <div className="mt-1 max-h-44 overflow-auto rounded-lg border border-zinc-200">
        {results.length ? results.map((product) => (
          <button key={product.id} type="button" onClick={() => setSelected(product.id)} className={`block w-full border-b border-zinc-100 px-3 py-1.5 text-left text-sm last:border-0 hover:bg-zinc-50 ${selected === product.id ? "bg-emerald-50" : ""}`}>
            {product.name}
          </button>
        )) : <p className="px-3 py-2 text-xs text-zinc-500">Товар не найден</p>}
      </div>
      <input type="hidden" name={name} value={selected} />
      <button type="submit" disabled={!selected} className="mt-2 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50">
        {submitLabel}
      </button>
    </div>
  );
}
