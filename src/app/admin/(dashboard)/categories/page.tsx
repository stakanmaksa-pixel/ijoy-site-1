import { prisma } from "@/lib/prisma";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Категории</h1>

      <div className="mt-6 flex flex-col gap-3">
        {categories.map((c) => (
          <form
            key={c.id}
            action={updateCategory}
            className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-[1fr_1fr_100px_80px_auto_auto] sm:items-center"
          >
            <input type="hidden" name="id" value={c.id} />
            <input
              name="name"
              defaultValue={c.name}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Название"
            />
            <input
              name="slug"
              defaultValue={c.slug}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="slug"
            />
            <input
              name="icon"
              defaultValue={c.icon ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="иконка"
            />
            <input
              name="sortOrder"
              type="number"
              defaultValue={c.sortOrder}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="порядок"
            />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Сохранить
            </button>
            <span className="text-xs text-zinc-400">{c._count.products} товаров</span>
          </form>
        ))}

        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <form key={`del-${c.id}`} action={deleteCategory} className="flex justify-end">
                <input type="hidden" name="id" value={c.id} />
                {c._count.products === 0 && (
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Удалить «{c.name}»
                  </button>
                )}
              </form>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 p-4">
        <h2 className="text-sm font-medium text-zinc-900">Новая категория</h2>
        <form
          action={createCategory}
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_100px_80px_auto]"
        >
          <input
            required
            name="name"
            placeholder="Название"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="slug"
            placeholder="slug (необязательно)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="icon"
            placeholder="иконка"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
