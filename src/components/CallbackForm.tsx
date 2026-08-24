"use client";

import { useState } from "react";

// Форма "Оставьте заявку — перезвоним через 15 минут" — тот же блок
// (T1015 на Тильде: градиент accent → brand, белые поля, обводная кнопка),
// который повторяется на нескольких страницах (главная, Trade-In,
// Гарантия, Доставка) с разным заголовком. Заявка уходит в тот же Order,
// что и заказы товаров, просто без позиций — админ видит её в /admin/orders.
export function CallbackForm({
  title,
  source,
  subtitle = "Оставьте заявку сейчас, перезвоним через 15 минут!",
  id,
}: {
  title: string;
  source: string;
  subtitle?: string;
  id?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          comment: `Заявка «${source}»: перезвонить`,
          items: [],
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl bg-gradient-to-b from-accent to-brand px-6 py-12 text-center text-white sm:px-12"
    >
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm text-white/85">{subtitle}</p>

      {status === "sent" ? (
        <p className="mx-auto mt-8 max-w-sm text-sm text-white/90">
          Спасибо! Заявка принята — мы свяжемся с вами в ближайшее время.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <input
            required
            placeholder="Ваше имя*"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border-0 px-5 py-3 text-sm text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white sm:w-56"
          />
          <input
            required
            type="tel"
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-full border-0 px-5 py-3 text-sm text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white sm:w-56"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full shrink-0 rounded-full border-2 border-white px-8 py-3 font-display text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand-dark disabled:opacity-60 sm:w-auto"
          >
            {status === "sending" ? "Отправляем…" : "Отправить"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="mt-4 text-sm text-white/90">
          Не удалось отправить заявку — позвоните нам напрямую.
        </p>
      )}

      <p className="mx-auto mt-6 max-w-md text-xs text-white/60">
        Нажимая на кнопку, вы даёте согласие на обработку своих персональных
        данных.
      </p>
    </section>
  );
}
