"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!name) return;

  await prisma.category.create({
    data: {
      name,
      slug: slugInput || slugify(name),
      icon: icon || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!id || !name || !slug) return;

  await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      icon: icon || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Категория с товарами не удалится из-за внешнего ключа — это ожидаемо,
  // сначала нужно перенести или удалить товары.
  await prisma.category.delete({ where: { id } }).catch(() => {
    // тихо игнорируем — на странице ниже покажем список, пользователь увидит,
    // что категория никуда не делась, если в ней остались товары
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/");
}
