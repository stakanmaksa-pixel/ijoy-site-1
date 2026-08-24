import { createArticle } from "../actions";
import { ArticleForm } from "../ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Новая статья</h1>
      <div className="mt-6 max-w-3xl">
        <ArticleForm action={createArticle} submitLabel="Создать" />
      </div>
    </div>
  );
}
