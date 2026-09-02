"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { PhoneField, phoneWithCountryCode } from "@/components/PhoneField";
import { clearCart, removeFromCart, setCartQuantity, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

type CartItem = {
  variantId: string; memory: string | null; color: string | null; region: string | null;
  price: number | null; inStock: boolean; productSlug: string; productName: string; brand: string | null; imageUrl: string | null;
};

const label = (item: CartItem) => [item.memory, item.color, item.region].filter(Boolean).join(" · ") || "Стандарт";

export default function CartPage() {
  const lines = useCart();
  const idsKey = lines.map((line) => line.variantId).join(",");
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+7");
  const [deliveryMethod, setDeliveryMethod] = useState<"UNSPECIFIED" | "PICKUP" | "DELIVERY">("UNSPECIFIED");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    if (!idsKey) { setItems([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/cart?ids=${encodeURIComponent(idsKey)}`).then((res) => res.json()).then((data) => {
      if (!cancelled) setItems(data.items ?? []);
    }).catch(() => { if (!cancelled) setItems([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [idsKey]);

  const lineById = new Map(lines.map((line) => [line.variantId, line]));
  const unavailable = items.filter((item) => !item.inStock || item.price == null);
  const total = useMemo(() => items.reduce((sum, item) => sum + (item.price ?? 0) * (lineById.get(item.variantId)?.quantity ?? 0), 0), [items, idsKey]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length || unavailable.length) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        customerName: name, customerPhone: phoneWithCountryCode(countryCode, phone), website, deliveryMethod, deliveryAddress, comment,
        items: items.map((item) => ({ variantId: item.variantId, quantity: lineById.get(item.variantId)?.quantity ?? 1 })),
      }) });
      if (!response.ok) throw new Error("order failed");
      clearCart();
      setStatus("sent");
    } catch { setStatus("error"); }
  }

  if (status === "sent") return <div><PageHero title="Заказ оформлен" highlight="Заказ" /><div className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><div className="rounded-2xl bg-zinc-50 p-6 text-zinc-700">Спасибо! Заявка принята. Менеджер свяжется с вами по указанному телефону, чтобы подтвердить состав заказа, способ получения и оплату.</div></div></div>;

  return <div>
    <PageHero title="Корзина iJoy Gadget Store" highlight="Корзина" />
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {loading ? <p className="text-sm text-zinc-500">Загружаем корзину…</p> : items.length === 0 ? <div className="rounded-2xl bg-zinc-50 p-6 text-sm text-zinc-600">Корзина пока пуста. <Link href="/catalog" className="font-semibold text-accent hover:text-brand">Перейти в каталог</Link></div> : <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {items.map((item) => {
            const quantity = lineById.get(item.variantId)?.quantity ?? 1;
            return <article key={item.variantId} className="flex gap-4 rounded-2xl border border-zinc-200 p-3 sm:p-4">
              <Link href={`/product/${item.productSlug}?variant=${item.variantId}`} className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">{item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" /> : <span className="text-xs text-zinc-400">Фото</span>}</Link>
              <div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-wide text-zinc-400">{item.brand}</div><Link href={`/product/${item.productSlug}?variant=${item.variantId}`} className="font-medium text-foreground hover:text-accent">{item.productName}</Link><div className="mt-1 text-sm text-zinc-500">{label(item)}</div>{(!item.inStock || item.price == null) && <div className="mt-1 text-xs text-[#d86451]">Эту позицию сейчас нельзя оформить — удалите её или уточните у менеджера.</div>}<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center rounded-full border border-zinc-200"><button type="button" onClick={() => setCartQuantity(item.variantId, quantity - 1)} className="px-3 py-1.5 text-lg text-zinc-600">−</button><span className="min-w-8 text-center text-sm">{quantity}</span><button type="button" onClick={() => setCartQuantity(item.variantId, quantity + 1)} className="px-3 py-1.5 text-lg text-zinc-600">+</button></div><div className="flex items-center gap-4"><span className="font-semibold">{item.price != null ? formatPrice(item.price * quantity) : "Уточняйте цену"}</span><button type="button" onClick={() => removeFromCart(item.variantId)} className="text-sm text-zinc-500 hover:text-[#f95d51]">Удалить</button></div></div></div>
            </article>;
          })}
        </section>
        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-end justify-between gap-4 border-b border-zinc-100 pb-5"><span className="font-display text-xl font-semibold">Итого</span><span className="font-display text-2xl font-semibold text-brand">{formatPrice(total)}</span></div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">Оплату и точную стоимость доставки менеджер согласует с вами после заявки.</p>
          {unavailable.length === 0 ? <form onSubmit={submit} className="mt-6 space-y-5"><label className="absolute -left-[10000px]"><input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label><input required placeholder="Ваше имя" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none transition-colors placeholder:text-zinc-400 focus:border-accent" /><PhoneField countryCode={countryCode} onCountryCodeChange={setCountryCode} phone={phone} onPhoneChange={setPhone} className="text-foreground" /><fieldset><legend className="text-sm font-medium text-foreground">Как получить заказ</legend><div className="mt-2 grid gap-2"><label className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition-colors ${deliveryMethod === "UNSPECIFIED" ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 text-zinc-700 hover:border-accent"}`}><input type="radio" name="deliveryMethod" checked={deliveryMethod === "UNSPECIFIED"} onChange={() => setDeliveryMethod("UNSPECIFIED")} className="sr-only" /><span className="font-medium">Обсудить с менеджером</span><span className="mt-0.5 block text-xs text-zinc-500">Выберем удобный вариант позже.</span></label><div className="grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition-colors ${deliveryMethod === "PICKUP" ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 text-zinc-700 hover:border-accent"}`}><input type="radio" name="deliveryMethod" checked={deliveryMethod === "PICKUP"} onChange={() => setDeliveryMethod("PICKUP")} className="sr-only" /><span className="font-medium">Самовывоз</span></label><label className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition-colors ${deliveryMethod === "DELIVERY" ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 text-zinc-700 hover:border-accent"}`}><input type="radio" name="deliveryMethod" checked={deliveryMethod === "DELIVERY"} onChange={() => setDeliveryMethod("DELIVERY")} className="sr-only" /><span className="font-medium">Доставка</span></label></div></div></fieldset>{deliveryMethod === "DELIVERY" && <textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Адрес доставки (необязательно)" rows={2} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none focus:border-accent" />}<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Комментарий (необязательно)" rows={2} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none focus:border-accent" /><button disabled={status === "sending"} className="w-full rounded-full bg-brand px-5 py-4 font-display text-base font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60">{status === "sending" ? "Отправляем…" : "Оформить заявку"}</button>{status === "error" && <p className="text-sm text-[#f95d51]">Не удалось отправить заявку. Попробуйте ещё раз.</p>}</form> : <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Уберите недоступные позиции, чтобы оформить заказ.</p>}
        </aside>
      </div>}
    </div>
  </div>;
}
