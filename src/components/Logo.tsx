import Link from "next/link";

// Единственное место, где верстается логотип "iJoy" — используется и в
// шапке, и в подвале, чтобы они не расходились случайно. Реальный логотип
// (яблоко + вордмарк) скачан с живого сайта на Тильде — это тот же файл,
// что и в шапке на project7320453.tilda.ws. Для тёмного подвала — тот же
// рисунок, но с перекрашенным в белый текстом (на тёмном фоне тёмно-
// фиолетовый текст оригинала был бы почти не виден).
export function Logo({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const src = variant === "light" ? "/brand/logo-light.svg" : "/brand/logo.svg";
  return (
    <Link href="/" className={`flex shrink-0 items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- статичный
      векторный логотип, next/image по умолчанию блокирует SVG-оптимизацию */}
      <img src={src} alt="iJoy" className="h-8 w-auto shrink-0 sm:h-9" />
    </Link>
  );
}
