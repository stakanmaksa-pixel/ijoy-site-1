import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { CallbackForm } from "@/components/CallbackForm";
import { getCategoriesWithCounts, getPublishedProducts } from "@/lib/catalog";

// Каталог обновляется через Telegram-бота без пересборки сайта, поэтому
// страницу нельзя пререндерить статически (в т.ч. во время сборки Docker-образа,
// когда база ещё не запущена) — рендерим всегда на сервере по запросу.
export const dynamic = "force-dynamic";

// Главная страница повторяет структуру и реальные тексты старого сайта на
// Тильде (project7320453.tilda.ws): видео-обложка → плитки каталога →
// форма-приглашение → тёмный блок "Ваш надёжный продавец" → FAQ. Фото/видео
// в /public/home — это те же файлы, что были на Тильде (перекачаны оттуда
// напрямую), названия категорий и товары — уже из нашей базы, а не заглушки.
const CATEGORY_TILE_IMAGES: Record<string, string> = {
  telefony: "/home/tile-phones.jpg",
  noutbuki: "/home/tile-laptops.jpg",
};

// Для категорий, для которых нет подходящей реальной фотографии из старого
// сайта (там были только телефоны/ноутбуки/наушники/приставки — не совсем
// наш ассортимент), используем плитку в фирменных цветах вместо чужой
// картинки "для похожести".
const CATEGORY_TILE_GRADIENTS: Record<string, string> = {
  chasy: "from-brand to-accent",
  planshety: "from-brand-dark via-brand to-accent",
  aksessuary: "from-coral to-brand",
  daisony: "from-brand-dark to-brand",
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Как происходит оплата товара?",
    answer:
      "После заполнения заявки на обратный звонок на сайте, вам перезвонит специалист с подтверждением и уточнением деталей вашего заказа. После определяемся с датой и временем доставки. И при получении гаджета — проходит этап оплаты. Вы можете расплатиться картой любого банка или наличными.",
  },
  {
    question: "Гарантии на устройства?",
    answer:
      "Все наши устройства имеют фирменный серийный номер и гарантию качества устройства. Все товары можно проверить на официальном сайте производителя.",
  },
  {
    question: "Как работает доставка?",
    answer:
      "Мы доставляем наши товары по всей Москве без выходных. Работаем вместе с курьерской службой Яндекс.Доставка. Доставка быстрая и без выходных в любое удобное для вас место. При желании вы можете забрать товар с нашего склада самовывозом.",
  },
  {
    question: "Пришёл другой товар?",
    answer:
      "Обратитесь в наш отдел поддержки. Наши специалисты обработают вашу заявку и постараются решить возникшую проблему как можно быстрее и качественнее. Заменим товар и дадим скидку!",
  },
  {
    question: "Продаёте гаджеты оптом?",
    answer:
      "Как правило такого опыта у нас нет. Но мы заинтересованы в новых предложениях и готовы к большим заказам!",
  },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategoriesWithCounts(),
    getPublishedProducts(),
  ]);

  const featured = products.slice(0, 8);

  return (
    <div>
      {/* Обложка — то же видео, что было на главной Тильды.
          snap-start — блоки страницы мягко "прилипают" к экрану при
          прокрутке (scroll-snap на <html>, см. layout.tsx), чтобы не
          застревать на середине блока между Новинками и следующим тёмным
          блоком. */}
      <section className="relative flex min-h-[85vh] snap-start items-center overflow-hidden bg-brand-dark">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/home/hero-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/home/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/80" />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h1 className="font-display text-6xl font-semibold text-white sm:text-7xl">
            iJoy
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Техника Apple по лучшим ценам
          </p>
          <Link
            href="/catalog"
            className="mt-8 inline-block rounded-full border-2 border-accent px-8 py-3 font-display text-sm font-medium text-white shadow-lg transition-colors hover:bg-accent"
          >
            Каталог
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Каталог товаров — плитки категорий.
            snap-start и здесь тоже: без этой точки прокрутка от обложки
            "перепрыгивала" сразу к Новинкам, а сам каталог оставался не
            виден — снапиться было ровно не на что между двумя далёкими
            точками. */}
        <section className="snap-start">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Каталог товаров
          </h2>

          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Категории пока не добавлены.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => {
                const image = CATEGORY_TILE_IMAGES[c.slug];
                const gradient =
                  CATEGORY_TILE_GRADIENTS[c.slug] ?? "from-brand to-brand-dark";
                return (
                  <Link
                    key={c.id}
                    href={`/catalog?category=${c.slug}`}
                    className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-2xl"
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-105`}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="relative p-5">
                      <div className="font-display text-lg font-semibold text-white">
                        {c.name}
                      </div>
                      <div className="mt-1 text-sm text-white/80 transition-colors group-hover:text-accent">
                        Перейти →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Не нашли нужный гаджет? — тот же розово-фиолетовый градиент и
            форма, что и на Тильде */}
        <div className="mt-20">
          <CallbackForm title="Не нашли нужный гаджет?" source="Не нашли нужный гаджет" />
        </div>

        {/* Новинки */}
        <section className="mt-20 snap-start">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Новинки
            </h2>
            <Link href="/catalog" className="text-sm text-zinc-500 hover:text-accent">
              Весь каталог →
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Товары появятся здесь после загрузки прайса.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {featured.map((p) => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  brand={p.brand}
                  minPrice={p.minPrice}
                  hasStock={p.hasStock}
                  defaultVariantId={p.defaultVariantId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Ваш надёжный продавец */}
      <section className="snap-start bg-brand-dark px-4 py-16 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight sm:text-[42px]">
              Ваш надёжный продавец
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white">
              Мы доставляем все наши товары точно в срок и следим за тем,
              чтобы весь процесс покупки в интернет-магазине iJoy store всегда
              был качественным на каждом этапе покупки.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white">
              Наши специалисты всегда вам всё подскажут и проинформируют о
              состоянии вашего заказа.
            </p>
            <p className="mt-4 text-white/70">
              Работаем для вас: Пн–Вс с 11:00 до 20:00.
            </p>
            <Link
              href="/catalog"
              className="mt-8 inline-block rounded-full border-2 border-accent px-8 py-3 font-display text-sm font-medium text-white transition-colors hover:bg-accent"
            >
              Подобрать gadget
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-2">
            {[
              { src: "/home/icon-products.svg", label: "Только оригинальная техника" },
              { src: "/home/icon-safe.svg", label: "Гарантия на каждое устройство" },
              { src: "/home/icon-speed.svg", label: "Быстрая доставка по Москве" },
              { src: "/home/icon-team.svg", label: "Специалисты всегда на связи" },
            ].map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={item.src} className="flex flex-col items-center gap-3 text-center">
                <img src={item.src} alt="" className="h-12 w-12" />
                <span className="text-xs text-white/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные вопросы */}
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-2xl font-semibold text-foreground">
          Популярные вопросы
        </h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </div>
    </div>
  );
}
