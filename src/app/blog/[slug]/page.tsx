import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  return article ? { title: article.title } : {};
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/blog" className="text-sm text-zinc-500 hover:text-accent">
        ← Блог
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-foreground">
        {article.title}
      </h1>
      {article.publishedAt && (
        <div className="mt-2 text-xs text-zinc-400">
          {new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(
            article.publishedAt,
          )}
        </div>
      )}
      <div
        className="prose prose-zinc mt-8 max-w-none text-sm leading-6 text-zinc-700"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
