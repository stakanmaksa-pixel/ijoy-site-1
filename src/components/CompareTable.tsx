"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { pickCoverImage } from "@/lib/pickCoverImage";
import type { CompareModel } from "@/lib/catalog";
import { iphoneColorSwatch } from "@/lib/iphoneColors";

// Порядок строк характеристик — как на apple.com/iphone/compare/: сначала
// самое важное (экран, процессор, камеры, автономность), потом память и
// корпус. Ключи ровно те, что после нормализации (см. IPHONE_CONTENT_OVERRIDES
// в prisma/seed.ts) используются во всех 16 моделях единообразно.
const PRIMARY_SPEC_ROWS = [
  "Дисплей",
  "Процессор",
  "Основная камера",
  "Фронтальная камера",
  "Автономность",
  "Память",
  "Защита от воды и пыли",
  "Корпус",
];

const MAX_COLUMNS = 3;

function screenSize(specs: Record<string, string> | null): string | null {
  const value = specs?.["Дисплей"];
  if (!value) return null;
  const match = value.match(/^(\d+[.,]\d+)/);
  if (!match) return null;
  return `${match[1].replace(",", ".")}″`;
}

export function CompareTable({
  models,
  initialSlugs = [],
}: {
  models: CompareModel[];
  initialSlugs?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    initialSlugs.length > 0 ? initialSlugs : models.slice(0, MAX_COLUMNS).map((m) => m.slug),
  );
  const [activeColors, setActiveColors] = useState<Record<string, string>>({});

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) {
        // Хотя бы одна модель должна оставаться выбранной.
        return prev.length > 1 ? prev.filter((s) => s !== slug) : prev;
      }
      if (prev.length >= MAX_COLUMNS) {
        return [...prev.slice(1), slug];
      }
      return [...prev, slug];
    });
  }

  const columns = models.filter((m) => selected.includes(m.slug));

  // Строки таблицы: сначала фиксированный набор ключевых характеристик,
  // потом — все остальные ключи, что реально встретились у выбранных
  // моделей (например "Зум", "Зарядка", "Видео" — они есть не у всех
  // моделей, поэтому в основной список не входят).
  const extraKeys: string[] = [];
  for (const col of columns) {
    if (!col.specs) continue;
    for (const key of Object.keys(col.specs)) {
      if (!PRIMARY_SPEC_ROWS.includes(key) && !extraKeys.includes(key)) {
        extraKeys.push(key);
      }
    }
  }
  const rows = [...PRIMARY_SPEC_ROWS, ...extraKeys];
  const rowsWithData = rows.filter((row) => columns.some((c) => c.specs?.[row]));

  return (
    <div className="flex flex-col gap-8">
      {/* Выбор моделей — до 4 одновременно; выбор новой сверх лимита сдвигает
          самую "старую" из уже выбранных, а не блокируется молча. */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">Выберите модели</h2>
        <p className="mt-2 text-sm text-zinc-500">До трёх моделей одновременно.</p>
        <div className="mt-4 flex flex-wrap gap-2">
        {models.map((m) => {
          const isActive = selected.includes(m.slug);
          return (
            <button
              key={m.slug}
              type="button"
              onClick={() => toggle(m.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-accent bg-accent text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-accent hover:text-accent"
              }`}
            >
              {m.name}
            </button>
          );
        })}
        </div>
      </div>

      {/* Колонки моделей */}
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((m) => {
          const activeColor = activeColors[m.slug] ?? m.colors[0];
          const cover = pickCoverImage(m.images, m.colorImages, activeColor);
          const size = screenSize(m.specs);

          return (
            <div key={m.slug} className="flex flex-col items-center text-center">
              <Link href={`/product/${m.slug}`} className="mb-3 flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl bg-zinc-50 text-zinc-300">
                {cover ? (
                  <img src={cover} alt={m.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-sm">Фото</span>
                )}
              </Link>

              <Link href={`/product/${m.slug}`} className="font-display text-lg font-semibold text-foreground hover:text-accent">
                {m.name}
              </Link>

              {size && <div className="mt-1 text-2xl font-semibold text-foreground">{size}</div>}

              <div className="mt-2 text-sm text-zinc-500">
                {m.minPrice != null ? `от ${formatPrice(m.minPrice)}` : "Уточняйте у менеджера"}
              </div>

              {m.colors.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {m.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={color}
                      onClick={() => setActiveColors((prev) => ({ ...prev, [m.slug]: color }))}
                      className={`h-5 w-5 rounded-full border transition-transform ${
                        activeColor === color ? "scale-110 border-accent" : "border-zinc-200"
                      }`}
                      style={{ backgroundColor: iphoneColorSwatch(color) }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Таблица характеристик */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-100">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {rowsWithData.map((row, idx) => (
              <tr key={row} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50/60"}>
                <td className="w-40 shrink-0 border-r border-zinc-100 px-4 py-3 align-top font-medium text-zinc-500">
                  {row}
                </td>
                {columns.map((m) => (
                  <td key={m.slug} className="px-4 py-3 align-top text-foreground">
                    {m.specs?.[row] ?? <span className="text-zinc-300">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
