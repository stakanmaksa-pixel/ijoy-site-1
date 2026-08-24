// Три карточки "как это работает" с кнопкой-якорем на форму заявки ниже
// по странице — тот же паттерн, что на реальных страницах Доставки/
// Trade-In/Гарантии на Тильде.
export function InfoCards({
  items,
  ctaLabel,
  ctaHref,
}: {
  items: { title: string; text: string }[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col rounded-2xl border border-zinc-200 p-6"
        >
          <div className="font-display text-lg font-medium text-foreground">
            {item.title}
          </div>
          <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">
            {item.text}
          </p>
          <a
            href={ctaHref}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            {ctaLabel}
          </a>
        </div>
      ))}
    </div>
  );
}
