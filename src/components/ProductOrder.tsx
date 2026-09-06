"use client";

/* eslint-disable react-hooks/static-components -- локальные селекторы замыкаются на текущее состояние формы */

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { colorLabel, colorToHex } from "@/lib/colorSwatch";
import { PhoneField, phoneWithCountryCode } from "@/components/PhoneField";
import { CartButton } from "@/components/CartButton";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  // null — этой комбинации нет в прайсе, цену нужно уточнять у менеджера
  // (см. prisma/seed.ts, buildLiveIphoneProducts).
  price: number | null;
  inStock: boolean;
};

type Axis = "memory" | "color" | "region";

const PRICE_ON_REQUEST = "Уточняйте у менеджера";

function variantLabel(v: Variant) {
  return [v.memory, colorLabel(v.color), v.region].filter(Boolean).join(" · ") || "Стандарт";
}

function priceLabel(v: Variant | undefined): string {
  return v && v.price != null ? formatPrice(v.price) : PRICE_ON_REQUEST;
}

// Числовая величина для сортировки значений оси "память"/"размер"
// (128GB, 512GB, 1TB, 40mm, ...) — по возрастанию, единицы приводим к
// общему масштабу (GB), а "мм" (для часов) сравниваем как есть.
function memorySortValue(value: string): number {
  const m = value.match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MM)?/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const num = Number(m[1]);
  const unit = (m[2] ?? "").toUpperCase();
  if (unit === "TB") return num * 1000;
  return num;
}

function axisLabel(axis: Axis, values: string[]): string {
  if (axis === "memory") {
    return values.every((v) => /(?:mm|мм)$/i.test(v)) ? "Размер корпуса" : "Память";
  }
  if (axis === "color") return "Цвет";
  // region
  if (values.every((v) => /^(eSIM|SIM\+eSIM|2 SIM)$/.test(v))) return "Тип SIM";
  if (values.some((v) => /\p{Regional_Indicator}/u.test(v))) return "Регион";
  if (values.some((v) => /(?:loop|band|ремешок)/i.test(v))) return "Ремешок";
  return "Комплектация";
}

function uniqueInOrder(values: (string | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

type Selection = { memory: string | null; color: string | null; region: string | null };

type WatchBandPart = "model" | "color" | "size";
type IpadOptionPart = "connectivity" | "glass";

type WatchBand = {
  model: string;
  color: string;
  size: string;
};

function parseWatchBand(region: string | null): WatchBand | null {
  if (!region) return null;
  const sizeMatch = region.trim().match(/(?:^|\s)(XS\/S|S\/M|M\/L|S|M|L)$/i);
  const size = sizeMatch?.[1].toUpperCase() ?? "Универсальный";
  const withoutSize = sizeMatch ? region.slice(0, sizeMatch.index).trim() : region.trim();
  const colorMatch = withoutSize.match(/^(.*?)\s*\(([^()]+)\)$/);
  return {
    model: colorMatch?.[1]?.trim() || withoutSize,
    color: colorMatch?.[2]?.trim() || "Стандартный",
    size,
  };
}

function watchBandLabel(value: string) {
  const translations: Record<string, string> = {
    "Black/Charcoal": "Чёрный/угольный",
    "Blue/Bright Blue": "Синий/ярко-синий",
    Black: "Чёрный",
    "Black Titanium": "Чёрный титан",
    "Natural Titanium": "Натуральный титан",
    "Light Blue": "Светло-голубой",
    "Anchor Blue": "Синий Anchor",
    "Neon Green": "Неоново-зелёный",
    "Purple Fog": "Сиреневый туман",
    "Light Blush": "Светло-розовый",
    Midnight: "Тёмная ночь",
    Starlight: "Сияющая звезда",
    Gold: "Золотой",
    Natural: "Натуральный",
    Slate: "Графитовый",
    "Стандартный": "Стандартный",
    "Универсальный": "Универсальный",
  };
  return translations[value] ?? value;
}

function parseIpadRegion(region: string | null) {
  if (!region || !/(?:Wi.?Fi|Cellular|стекло)/i.test(region)) return null;
  const [connectivity, glass] = region.split(" · ").map((part) => part.trim());
  if (!connectivity) return null;
  return { connectivity, glass: glass || null };
}

function ipadConnectivityOrder(value: string) {
  return value === "Wi‑Fi" ? 0 : value === "Wi‑Fi + Cellular" ? 1 : 2;
}

function findVariant(variants: Variant[], sel: Selection): Variant | undefined {
  return variants.find(
    (v) =>
      (sel.memory === null || v.memory === sel.memory) &&
      (sel.color === null || v.color === sel.color) &&
      (sel.region === null || v.region === sel.region),
  );
}

export function ProductOrder({
  productName,
  variants,
  initialVariantId,
  onSelectedVariantChange,
  allowUnavailableSelection = false,
}: {
  productName: string;
  variants: Variant[];
  // Модификация, выбранная ещё до открытия формы (пришли по ссылке на
  // конкретную память/цвет из карточки в сетке модификаций) — если задана,
  // именно она выбрана по умолчанию, а не первая в наличии.
  initialVariantId?: string;
  // Сообщает наружу id реально выбранной сейчас модификации (память/цвет/
  // регион переключаются внутри этого компонента) — родитель использует это,
  // чтобы сердечко избранного над фото всегда относилось к тому, что сейчас
  // выбрано, а не к товару вообще. См. ProductDetail.tsx.
  onSelectedVariantChange?: (variantId: string | undefined) => void;
  // Some catalogues list the complete configuration matrix, including offers on request.
  // Browsing those configurations must not imply stock or allow an unpriced purchase.
  allowUnavailableSelection?: boolean;
}) {
  const hasMemory = variants.some((v) => v.memory);
  const hasColor = variants.some((v) => v.color);
  const hasRegion = variants.some((v) => v.region);
  const isWatch = variants.some((v) => /(?:loop|band|ремешок)/i.test(v.region ?? ""));
  const isIpad = /iPad/i.test(productName) && variants.some((v) => parseIpadRegion(v.region));

  const memoryOptions = useMemo(
    () => (hasMemory ? uniqueInOrder(variants.map((v) => v.memory)).sort((a, b) => memorySortValue(a) - memorySortValue(b)) : []),
    [variants, hasMemory],
  );
  const colorOptions = useMemo(
    () => (hasColor ? uniqueInOrder(variants.map((v) => v.color)) : []),
    [variants, hasColor],
  );
  const regionOptions = useMemo(
    () => (hasRegion ? uniqueInOrder(variants.map((v) => v.region)) : []),
    [variants, hasRegion],
  );

  const initial =
    (initialVariantId && variants.find((v) => v.id === initialVariantId)) ||
    variants.find((v) => v.inStock) ||
    variants[0];
  const [selection, setSelection] = useState<Selection>({
    memory: initial?.memory ?? null,
    color: initial?.color ?? null,
    region: initial?.region ?? null,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+7");
  const [deliveryMethod, setDeliveryMethod] = useState<"UNSPECIFIED" | "PICKUP" | "DELIVERY">("UNSPECIFIED");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const selected = findVariant(variants, selection) ?? variants[0];

  useEffect(() => {
    onSelectedVariantChange?.(selected?.id);
    // onSelectedVariantChange обычно новая функция на каждый рендер родителя
    // (инлайн setState) — зависим только от того, что реально меняется.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  function pick(axis: Axis, value: string) {
    setSelection((prev) => {
      const next = { ...prev, [axis]: value };
      const exact = findVariant(variants, next);
      if (exact && (exact.inStock || allowUnavailableSelection)) return next;
      // Текущая комбинация недоступна с новым значением — подбираем
      // ближайший реальный (желательно в наличии) вариант с этим значением.
      const candidates = variants.filter((v) => v[axis] === value);
      const fallback = candidates.find((v) => v.inStock) ?? candidates[0];
      if (!fallback) return next;
      return { memory: fallback.memory, color: fallback.color, region: fallback.region };
    });
  }

  function pickWatchBand(part: WatchBandPart, value: string) {
    setSelection((prev) => {
      const currentBand = parseWatchBand(prev.region);
      const compatible = variants.filter((variant) =>
        (prev.memory === null || variant.memory === prev.memory) &&
        (prev.color === null || variant.color === prev.color) &&
        parseWatchBand(variant.region)?.[part] === value,
      );
      const ranked = [...compatible].sort((a, b) => {
        const score = (variant: Variant) => {
          const band = parseWatchBand(variant.region);
          if (!band || !currentBand) return variant.inStock ? 1 : 0;
          return (variant.inStock ? 8 : 0) +
            (band.model === currentBand.model ? 4 : 0) +
            (band.color === currentBand.color ? 2 : 0) +
            (band.size === currentBand.size ? 1 : 0);
        };
        return score(b) - score(a);
      });
      const fallback = ranked[0];
      return fallback
        ? { memory: fallback.memory, color: fallback.color, region: fallback.region }
        : prev;
    });
  }

  function pickIpadOption(part: IpadOptionPart, value: string) {
    setSelection((prev) => {
      const current = parseIpadRegion(prev.region);
      const compatible = variants.filter((variant) => {
        const parsed = parseIpadRegion(variant.region);
        return parsed?.[part] === value &&
          (prev.memory === null || variant.memory === prev.memory) &&
          (prev.color === null || variant.color === prev.color);
      });
      const ranked = [...compatible].sort((a, b) => {
        const score = (variant: Variant) => {
          const parsed = parseIpadRegion(variant.region);
          if (!parsed) return 0;
          const otherPart: IpadOptionPart = part === "connectivity" ? "glass" : "connectivity";
          return (variant.inStock ? 4 : 0) + (parsed[otherPart] === current?.[otherPart] ? 2 : 0) + (variant.price != null ? 1 : 0);
        };
        return score(b) - score(a);
      });
      const fallback = ranked[0];
      return fallback ? { memory: fallback.memory, color: fallback.color, region: fallback.region } : prev;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("sending");
    // Для модификации без цены (price: null) оформить заказ с конкретной
    // ценой нельзя — вместо этого уходит заявка на уточнение без позиции
    // (тот же механизм, что у формы "перезвоните мне", см. CallbackForm),
    // с описанием запрошенной модификации в комментарии.
    const priceOnRequest = selected.price == null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phoneWithCountryCode(countryCode, phone),
          website,
          deliveryMethod,
          deliveryAddress,
          comment: priceOnRequest
            ? [`Уточнить цену: «${productName}» (${variantLabel(selected)})`, comment]
                .filter(Boolean)
                .join(". ")
            : comment,
          items: priceOnRequest ? [] : [{ variantId: selected.id, quantity: 1 }],
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (variants.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Модификации этого товара сейчас не в продаже.
      </p>
    );
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
        Спасибо! Заявка на «{productName}» ({selected ? variantLabel(selected) : ""})
        принята — мы свяжемся с вами по указанному телефону.
      </div>
    );
  }

  function AxisSelector({ axis, options }: { axis: Axis; options: string[] }) {
    if (options.length === 0) return null;
    const value = selection[axis];

    // Ось "цвет" — кружки-свотчи вместо текстовых пилюль, чтобы было видно
    // цвет, не читая название.
    if (axis === "color") {
      return (
        <div>
          <div className="mb-2 text-sm font-medium text-foreground">
            {axisLabel(axis, options)}
            {value && <span className="font-normal text-zinc-500"> · {colorLabel(value)}</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => {
              const isSelected = value === opt;
              const previewVariant = findVariant(variants, { ...selection, color: opt });
              const available = variants.some((v) => v.color === opt && (v.inStock || allowUnavailableSelection));
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pick("color", opt)}
                  disabled={!available}
                  title={`${colorLabel(opt)}${previewVariant ? ` · ${priceLabel(previewVariant)}` : ""}`}
                  aria-label={colorLabel(opt)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? "border-brand" : "border-transparent hover:border-zinc-300"
                  } ${!available ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/10"
                    style={{ backgroundColor: colorToHex(opt) }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mb-2 text-sm font-medium text-foreground">
          {axisLabel(axis, options)}
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = value === opt;
            const previewVariant = findVariant(variants, { ...selection, [axis]: opt });
            const available = variants.some((v) => v[axis] === opt && (v.inStock || allowUnavailableSelection));
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(axis, opt)}
                disabled={!available}
                title={previewVariant ? priceLabel(previewVariant) : undefined}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-brand bg-brand text-white"
                    : "border-zinc-300 text-zinc-700 hover:border-accent"
                } ${!available ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function WatchBandSelector() {
    const current = parseWatchBand(selection.region);
    const compatible = variants.filter((variant) =>
      (selection.memory === null || variant.memory === selection.memory) &&
      (selection.color === null || variant.color === selection.color),
    );
    const modelOptions = uniqueInOrder(compatible.map((variant) => parseWatchBand(variant.region)?.model ?? null));
    const colorOptions = uniqueInOrder(compatible
      .filter((variant) => parseWatchBand(variant.region)?.model === current?.model)
      .map((variant) => parseWatchBand(variant.region)?.color ?? null));
    const sizeOrder = ["XS/S", "S/M", "M/L", "S", "M", "L", "Универсальный"];
    const sizeOptions = uniqueInOrder(compatible
      .filter((variant) => {
        const band = parseWatchBand(variant.region);
        return band?.model === current?.model && band?.color === current?.color;
      })
      .map((variant) => parseWatchBand(variant.region)?.size ?? null))
      .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

    function PartSelector({ label, part, options }: { label: string; part: WatchBandPart; options: string[] }) {
      if (!options.length) return null;
      return <div>
        <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selectedValue = current?.[part] === option;
            return <button
              key={option}
              type="button"
              onClick={() => pickWatchBand(part, option)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                selectedValue
                  ? "border-brand bg-brand text-white"
                  : "border-zinc-300 text-zinc-700 hover:border-accent"
              }`}
            >
              {part === "color" ? watchBandLabel(option) : option}
            </button>;
          })}
        </div>
      </div>;
    }

    return <>
      <PartSelector label="Модель ремешка" part="model" options={modelOptions} />
      <PartSelector label="Цвет ремешка" part="color" options={colorOptions} />
      <PartSelector label="Размер ремешка" part="size" options={sizeOptions} />
    </>;
  }

  function IpadOptionSelector() {
    const current = parseIpadRegion(selection.region);
    const compatible = variants.filter((variant) =>
      (selection.memory === null || variant.memory === selection.memory) &&
      (selection.color === null || variant.color === selection.color),
    );
    const connectivityOptions = uniqueInOrder(compatible.map((variant) => parseIpadRegion(variant.region)?.connectivity ?? null))
      .sort((a, b) => ipadConnectivityOrder(a) - ipadConnectivityOrder(b));
    const glassOptions = uniqueInOrder(compatible.map((variant) => parseIpadRegion(variant.region)?.glass ?? null));

    function Part({ label, part, options }: { label: string; part: IpadOptionPart; options: string[] }) {
      if (!options.length) return null;
      return <div>
        <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => <button
            key={option}
            type="button"
            onClick={() => pickIpadOption(part, option)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              current?.[part] === option
                ? "border-brand bg-brand text-white"
                : "border-zinc-300 text-zinc-700 hover:border-accent"
            }`}
          >
            {option}
          </button>)}
        </div>
      </div>;
    }

    return <>
      <Part label="Подключение" part="connectivity" options={connectivityOptions} />
      <Part label="Стекло дисплея" part="glass" options={glassOptions} />
    </>;
  }

  return (
    <div className="flex flex-col gap-4">
      <AxisSelector axis="memory" options={memoryOptions} />
      <AxisSelector axis="color" options={colorOptions} />
      {isWatch
        ? <WatchBandSelector />
        : isIpad
          ? <IpadOptionSelector />
          : <AxisSelector axis="region" options={regionOptions} />}

      {selected && (
        <div className="font-display text-2xl font-semibold text-foreground">
          {selected.price != null ? (
            <>
              {formatPrice(selected.price)}
              {!selected.inStock && (
                <span className="ml-2 align-middle text-sm font-normal text-zinc-400">
                  нет в наличии
                </span>
              )}
            </>
          ) : (
            <span className="text-lg font-medium text-zinc-500">{PRICE_ON_REQUEST}</span>
          )}
        </div>
      )}

      {!formOpen ? (
        <div className="flex flex-wrap gap-3">
          {selected?.price != null && selected.inStock && <CartButton variantId={selected.id} />}
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={!selected || (!selected.inStock && !(allowUnavailableSelection && selected.price == null))}
            className="w-full rounded-full bg-brand px-6 py-3 font-display text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-fit"
          >
            {selected?.price != null ? "Оформить сейчас" : "Уточнить цену"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-zinc-200 p-4"
        >
          <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            Сайт
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <input
            required
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <PhoneField
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            phone={phone}
            onPhoneChange={setPhone}
            className="text-foreground"
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Как получить заказ?
            </legend>
            <div className="grid gap-2">
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${
                  deliveryMethod === "UNSPECIFIED"
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="UNSPECIFIED"
                  checked={deliveryMethod === "UNSPECIFIED"}
                  onChange={() => setDeliveryMethod("UNSPECIFIED")}
                  className="sr-only"
                />
                Обсужу с менеджером
              </label>
              <div className="grid grid-cols-2 gap-2">
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${
                  deliveryMethod === "PICKUP"
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP"
                  checked={deliveryMethod === "PICKUP"}
                  onChange={() => setDeliveryMethod("PICKUP")}
                  className="sr-only"
                />
                Самовывоз
              </label>
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${
                  deliveryMethod === "DELIVERY"
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="DELIVERY"
                  checked={deliveryMethod === "DELIVERY"}
                  onChange={() => setDeliveryMethod("DELIVERY")}
                  className="sr-only"
                />
                Доставка
              </label>
              </div>
            </div>
            {deliveryMethod === "PICKUP" && (
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Менеджер согласует с вами магазин, дату и время получения.
              </p>
            )}
            {deliveryMethod === "DELIVERY" && (
              <AddressAutocomplete
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}
          </fieldset>
          <textarea
            placeholder="Комментарий (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            rows={2}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-full bg-brand px-6 py-3 font-display text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-fit"
          >
            {status === "sending" ? "Отправляем…" : "Отправить заявку"}
          </button>
          {status === "error" && (
            <p className="text-sm text-[#f95d51]">
              Не удалось отправить заявку, попробуйте ещё раз.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
