import type { Metadata } from "next";
import { PageHero, SectionKicker } from "@/components/PageHero";
import { InfoCards } from "@/components/InfoCards";
import { CallbackForm } from "@/components/CallbackForm";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = { title: "Доставка" };

// Реальные условия доставки iJoy (согласованы с владельцем 22.08.2026) —
// заменяют временный текст-заглушку с Тильды.
const STEPS = [
  {
    title: "Приём заказа",
    text: "Заказы, оформленные до 19:00, отправляются в доставку в тот же день. Позже — на следующий.",
  },
  {
    title: "По Москве",
    text: "В пределах МКАД — 800 ₽. За МКАД до ЦКАД — 1000 ₽ + 50 ₽ за каждый километр от МКАД.",
  },
  {
    title: "Срочная доставка",
    text: "Доставим от 1 часа — точную стоимость и время уточняет менеджер индивидуально под ваш адрес.",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Сроки доставки",
    answer:
      "Заказ, оформленный до 19:00, доставим в тот же день. Точное время согласует менеджер после оформления.",
  },
  {
    question: "Стоимость по Москве и области",
    answer:
      "В пределах МКАД — 800 ₽. От МКАД до ЦКАД — 1000 ₽ + 50 ₽ за каждый километр. Срочная доставка (от 1 часа) — индивидуально.",
  },
  {
    question: "Другие регионы и города",
    answer:
      "Доставка за пределами Москвы и Московской области оформляется через менеджера — способ и сроки уточняются при оформлении заказа.",
  },
  {
    question: "Гарантия",
    answer:
      "Убедитесь, что гарантия на технику начинается с момента доставки и что вы получили все необходимые документы.",
  },
];

export default function DeliveryPage() {
  return (
    <div>
      <PageHero title="Доставка Заказов iJoy Gadget Store" highlight="Заказов" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionKicker lines={["Как это", "работает"]} />
        <InfoCards items={STEPS} ctaLabel="Доставка заказов" ctaHref="#delivery-form" />

        <div className="mt-16">
          <CallbackForm id="delivery-form" title="Доставка заказов" source="Доставка заказов" />
        </div>

        <div className="mt-20 max-w-3xl">
          <SectionKicker lines={["Важно", "знать"]} />
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </div>
    </div>
  );
}
