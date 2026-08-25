"use client";

import { toggleFavorite, useIsFavorite } from "@/lib/favorites";

// Сердечко "добавить в избранное" — используется поверх карточек товара
// (ProductCard, VariantCard) и на странице товара. Привязано к id конкретной
// модификации (память+цвет+регион), а не к товару целиком — у одного айфона
// может быть избрана только чёрная 512ГБ версия, а не все подряд. Живёт
// внутри <Link>, поэтому обязательно останавливает всплытие клика, иначе
// вместо переключения избранного сработает переход по ссылке.
export function FavoriteButton({
  variantId,
  className = "",
}: {
  variantId: string;
  className?: string;
}) {
  const active = useIsFavorite(variantId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(variantId);
      }}
      aria-pressed={active}
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      title={active ? "Убрать из избранного" : "Добавить в избранное"}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition-all duration-150 hover:scale-105 hover:bg-white active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="23"
        height="23"
        aria-hidden
        className="transition-all duration-150"
        style={{
          fill: active ? "#f95d51" : "none",
          stroke: active ? "#f95d51" : "#a3a3ab",
          strokeWidth: 1.7,
        }}
      >
        <path
          d="M12 20.5c-.24 0-.48-.07-.68-.2C7.1 17.6 3 14.02 3 9.86 3 6.9 5.3 4.6 8.2 4.6c1.6 0 3.13.76 4.1 1.96C13.27 5.36 14.8 4.6 16.4 4.6c2.9 0 5.2 2.3 5.2 5.26 0 4.16-4.1 7.74-8.32 10.44-.2.13-.44.2-.68.2Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
