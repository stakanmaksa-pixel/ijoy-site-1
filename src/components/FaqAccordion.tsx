"use client";

import { useState } from "react";

export type FaqItem = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  // На реальном сайте все пункты аккордеона свёрнуты по умолчанию
  // (aria-expanded="false" у каждого) — открываются только по клику.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-8 flex flex-col divide-y divide-zinc-200 border-t border-zinc-200">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="flex items-baseline gap-3">
                <span className="font-display text-sm text-accent">
                  {i + 1}.
                </span>
                <span className="font-display text-base font-medium text-foreground">
                  {item.question}
                </span>
              </span>
              <span
                className={`shrink-0 text-xl text-zinc-400 transition-transform ${isOpen ? "rotate-45" : ""}`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <p className="pb-5 pl-9 pr-8 text-sm leading-6 text-zinc-600">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
