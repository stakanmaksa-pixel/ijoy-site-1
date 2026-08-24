"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { ArticleStatus } from "@/generated/prisma/client";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function isArticleStatus(value: string): value is ArticleStatus {
  return value === "DRAFT" || value === "PUBLISHED";
}

export async function createArticle(formData: FormData) {
  const admin = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT");
  const status = isArticleStatus(statusRaw) ? statusRaw : "DRAFT";

  if (!title) return;

  const article = await prisma.article.create({
    data: {
      title,
      slug: slugInput || slugify(title),
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      status,
      authorId: admin.id,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  revalidatePath("/admin/articles");
  revalidatePath("/blog");
  redirect(`/admin/articles/${article.id}`);
}

export async function updateArticle(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT");
  const status = isArticleStatus(statusRaw) ? statusRaw : "DRAFT";

  if (!id || !title || !slug) return;

  const existing = await prisma.article.findUnique({ where: { id } });

  await prisma.article.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      status,
      publishedAt:
        status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
    },
  });

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function deleteArticle(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.article.delete({ where: { id } });

  revalidatePath("/admin/articles");
  revalidatePath("/blog");
  redirect("/admin/articles");
}
