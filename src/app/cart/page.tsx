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
              <Link href={`/product/${item.productSlug}?variant=${item.variantId}`} className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-zinc-400">Фото</span>}</Link>
              <div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-wide text-zinc-400">{item.brand}</div><Link href={`/product/${item.productSlug}?variant=${item.variantId}`} className="font-medium text-foreground hover:text-accent">{item.productName}</Link><div className="mt-1 text-sm text-zinc-500">{label(item)}</div>{(!item.inStock || item.price == null) && <div className="mt-1 text-xs text-[#d86451]">Эту позицию сейчас нельзя оформить — удалите её или уточните у менеджера.</div>}<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center rounded-full border border-zinc-200"><button type="button" onClick={() => setCartQuantity(item.variantId, quantity - 1)} className="px-3 py-1.5 text-lg text-zinc-600">−</button><span className="min-w-8 text-center text-sm">{quantity}</span><button type="button" onClick={() => setCartQuantity(item.variantId, quantity + 1)} className="px-3 py-1.5 text-lg text-zinc-600">+</button></div><div className="flex items-center gap-4"><span className="font-semibold">{item.price != null ? formatPrice(item.price * quantity) : "Уточняйте цену"}</span><button type="button" onClick={() => removeFromCart(item.variantId)} className="text-sm text-zinc-500 hover:text-[#f95d51]">Удалить</button></div></div></div>
            </article>;
          })}
        </section>
        <aside className="h-fit rounded-2xl border border-zinc-200 p-5 sm:p-6"><div className="flex items-center justify-between border-b border-zinc-100 pb-4"><span className="font-display text-lg font-semibold">Итого</span><span className="font-display text-lg font-semibold">{formatPrice(total)}</span></div><p className="mt-3 text-xs leading-5 text-zinc-500">Оплата и точная стоимость доставки согласуются с менеджером после заявки.</p>{unavailable.length === 0 ? <form onSubmit={submit} className="mt-5 space-y-3"><label className="absolute -left-[10000px]"><input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label><input required placeholder="Ваше имя" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /><PhoneField countryCode={countryCode} onCountryCodeChange={setCountryCode} phone={phone} onPhoneChange={setPhone} className="text-foreground" /><select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as typeof deliveryMethod)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"><option value="UNSPECIFIED">Способ получения обсудить с менеджером</option><option value="PICKUP">Самовывоз</option><option value="DELIVERY">Доставка</option></select>{deliveryMethod === "DELIVERY" && <textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Адрес доставки (необязательно)" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />}<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Комментарий (необязательно)" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /><button disabled={status === "sending"} className="w-full rounded-full bg-brand px-5 py-3 font-display text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">{status === "sending" ? "Отправляем…" : "Оформить заявку"}</button>{status === "error" && <p className="text-sm text-[#f95d51]">Не удалось отправить заявку. Попробуйте ещё раз.</p>}</form> : <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Уберите недоступные позиции, чтобы оформить заказ.</p>}</aside>
      </div>}
    </div>
  </div>;
}
