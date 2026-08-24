import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArticle, deleteArticle } from "../actions";
import { ArticleForm } from "../ArticleForm";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">{article.title}</h1>
        <form action={deleteArticle}>
          <input type="hidden" name="id" value={article.id} />
          <button type="submit" className="text-sm text-red-500 hover:text-red-700">
            Удалить статью
          </button>
        </form>
      </div>

      <div className="mt-6 max-w-3xl">
        <ArticleForm action={updateArticle} article={article} submitLabel="Сохранить" />
      </div>
    </div>
  );
}
