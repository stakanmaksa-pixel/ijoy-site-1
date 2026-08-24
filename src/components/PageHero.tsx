// Заголовок внутренних страниц — общий для Доставки/Гарантии/Trade-In/
// Отзывов/Блога/Контактов/Каталога. Копирует реальный паттерн с Тильды:
// H1 вида "Доставка Заказов iJoy Gadget Store", где одно ключевое слово
// (там оно ещё "печатается" анимацией) выделено фирменным фиолетовым.
export function PageHero({
  title,
  highlight,
}: {
  title: string;
  highlight: string;
}) {
  const idx = title.indexOf(highlight);
  const before = idx >= 0 ? title.slice(0, idx) : title;
  const after = idx >= 0 ? title.slice(idx + highlight.length) : "";

  return (
    <div className="border-b border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {before}
          {idx >= 0 && <span className="text-accent">{highlight}</span>}
          {after}
        </h1>
      </div>
    </div>
  );
}

// Двустрочный акцентный подзаголовок вида "Как это / работает" или
// "Важно / знать" — тем же приёмом (первая строка фиолетовая, вторая —
// основным цветом), которым на Тильде подписаны блоки с карточками и FAQ.
export function SectionKicker({ lines }: { lines: [string, string] }) {
  return (
    <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
      <span className="block text-accent">{lines[0]}</span>
      <span className="block text-foreground">{lines[1]}</span>
    </h2>
  );
}
