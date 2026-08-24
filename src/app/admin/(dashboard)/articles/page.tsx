import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
};

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Блог</h1>
        <Link
          href="/admin/articles/new"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
        >
          + Новая статья
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/admin/articles/${a.id}`}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 hover:border-zinc-900"
          >
            <span className="font-medium text-zinc-900">{a.title}</span>
            <span className="text-xs text-zinc-500">{STATUS_LABEL[a.status] ?? a.status}</span>
          </Link>
        ))}

        {articles.length === 0 && (
          <p className="text-sm text-zinc-500">Статей пока нет.</p>
        )}
      </div>
    </div>
  );
}
