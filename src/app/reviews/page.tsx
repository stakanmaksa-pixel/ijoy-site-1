import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Отзывы" };

// Официальный виджет отзывов Яндекс Карт для организации iJoy
// (https://yandex.ru/maps/org/ijoy/61082823448/reviews/) — подтягивает
// реальные отзывы напрямую с Яндекс Карт и обновляется сам по себе, когда
// появляются новые: ничего вручную переносить/публиковать не нужно.
const YANDEX_ORG_ID = "61082823448";
const YANDEX_REVIEWS_URL = `https://yandex.ru/maps/org/ijoy/${YANDEX_ORG_ID}/reviews/`;
const YANDEX_WIDGET_URL = `https://yandex.ru/maps-reviews-widget/${YANDEX_ORG_ID}?comments`;

export default function ReviewsPage() {
  return (
    <div>
      <PageHero title="Отзывы Магазина iJoy Gadget Store" highlight="Магазина" />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm leading-6 text-zinc-600">
          Будем рады вашему отзыву на маркетплейсе — это помогает нам
          становиться лучше и помогает другим покупателям сделать выбор.
        </p>
        <a
          href={YANDEX_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-display text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Оставить отзыв на Яндекс Картах
        </a>

        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200">
          <iframe
            title="Отзывы iJoy на Яндекс Картах"
            src={YANDEX_WIDGET_URL}
            width="100%"
            height="700"
            frameBorder="0"
            loading="lazy"
            className="block w-full"
          />
        </div>
      </div>
    </div>
  );
}
