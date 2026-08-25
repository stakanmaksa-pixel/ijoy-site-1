import type { Metadata } from "next";
import { Montserrat, Unbounded } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteFeedback } from "@/components/SiteFeedback";

// Те же шрифты, что и на прежнем сайте на Тильде: Unbounded — для
// заголовков и кнопок, Montserrat — для основного текста.
const bodyFont = Montserrat({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const headingFont = Unbounded({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

// Шапка сайта (Header) на каждой странице читает меню каталога из базы,
// поэтому статическая пре-генерация страниц при сборке Docker-образа
// ломается: на этапе сборки базы данных ещё нет (она поднимается только
// в отдельном контейнере при запуске). Явно делаем весь сайт динамическим,
// чтобы меню каталога всегда читалось "живьём" при заходе пользователя —
// это и правильно с точки зрения актуальности каталога после апдейта цен.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "iJoy — магазин электроники",
    template: "%s — iJoy",
  },
  description:
    "iJoy — телефоны, часы, планшеты, дайсоны и другая электроника с гарантией.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased snap-y snap-proximity`}
    >
      <body className="flex min-h-full flex-col bg-white text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <SiteFeedback />
        <Footer />
      </body>
    </html>
  );
}
