import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Блог" };
// См. комментарий в app/page.tsx — статьи тоже читаются из базы,
// пререндер во время сборки Docker-образа упадёт без запущенного Postgres.
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <PageHero title="Блог Компании iJoy Gadget Store" highlight="Компании" />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {articles.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Статьи скоро появятся — редактор блога будет доступен в админке.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="group block rounded-2xl border border-zinc-200 p-6 transition-colors hover:border-accent"
              >
                <div className="font-display text-lg font-medium text-foreground">
                  {a.title}
                </div>
                {a.excerpt && (
                  <p className="mt-2 text-sm text-zinc-600">{a.excerpt}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  {a.publishedAt ? (
                    <div className="text-xs text-zinc-400">
                      {new Intl.DateTimeFormat("ru-RU", {
                        dateStyle: "long",
                      }).format(a.publishedAt)}
                    </div>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm font-medium text-accent transition-colors group-hover:text-brand">
                    Читать →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
