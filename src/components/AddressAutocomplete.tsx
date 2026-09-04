"use client";

import { useEffect, useState } from "react";

type Suggestion = { value: string };

export function AddressAutocomplete({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/address-suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data: unknown = await response.json();
        const next = typeof data === "object" && data !== null && "suggestions" in data
          ? (data as { suggestions?: unknown }).suggestions
          : [];
        setSuggestions(Array.isArray(next) ? next.filter((item): item is Suggestion => Boolean(item && typeof item === "object" && "value" in item && typeof (item as Suggestion).value === "string")) : []);
      } catch {
        // Ввод адреса всегда остаётся доступен и без подсказок.
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Начните вводить адрес"
        autoComplete="street-address"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.value}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(suggestion.value);
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-brand/5 hover:text-brand"
              >
                {suggestion.value}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
