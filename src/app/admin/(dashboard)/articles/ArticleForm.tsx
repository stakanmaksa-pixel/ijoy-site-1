import { RichTextEditor } from "./RichTextEditor";

type ArticleValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: string;
};

export function ArticleForm({
  action,
  article,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  article?: ArticleValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {article?.id && <input type="hidden" name="id" value={article.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Заголовок
          <input
            required
            name="title"
            defaultValue={article?.title}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Slug (URL)
          <input
            name="slug"
            defaultValue={article?.slug}
            placeholder="автоматически из заголовка, если пусто"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Краткое описание
          <textarea
            name="excerpt"
            defaultValue={article?.excerpt ?? ""}
            rows={2}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Обложка (URL)
          <input
            name="coverImage"
            defaultValue={article?.coverImage ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Статус
          <select
            name="status"
            defaultValue={article?.status ?? "DRAFT"}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовано</option>
          </select>
        </label>
      </div>

      <div>
        <div className="mb-1 text-sm">Текст статьи</div>
        <RichTextEditor name="content" defaultValue={article?.content ?? ""} />
      </div>

      <button
        type="submit"
        className="w-fit rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
