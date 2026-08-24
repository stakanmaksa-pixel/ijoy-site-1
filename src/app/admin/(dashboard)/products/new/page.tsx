import { prisma } from "@/lib/prisma";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Новый товар</h1>
      <div className="mt-6 max-w-2xl">
        <ProductForm action={createProduct} categories={categories} submitLabel="Создать" />
      </div>
    </div>
  );
}
