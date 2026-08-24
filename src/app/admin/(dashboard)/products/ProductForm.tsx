type CategoryOption = { id: string; name: string };

type ProductValues = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  brand: string | null;
  description: string | null;
  status: string;
  images: string[];
};

export function ProductForm({
  action,
  categories,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  categories: CategoryOption[];
  product?: ProductValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Название
          <input
            required
            name="name"
            defaultValue={product?.name}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Slug (URL)
          <input
            name="slug"
            defaultValue={product?.slug}
            placeholder="автоматически из названия, если пусто"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Категория
          <select
            required
            name="categoryId"
            defaultValue={product?.categoryId}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="" disabled>
              Выберите категорию
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Бренд
          <input
            name="brand"
            defaultValue={product?.brand ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Описание
          <textarea
            name="description"
            defaultValue={product?.description ?? ""}
            rows={4}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Изображения (по одной ссылке в строке)
          <textarea
            name="images"
            defaultValue={(product?.images ?? []).join("\n")}
            rows={3}
            className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Статус
          <select
            name="status"
            defaultValue={product?.status ?? "DRAFT"}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликован</option>
            <option value="HIDDEN">Скрыт</option>
          </select>
        </label>
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
