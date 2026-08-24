import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const adminId = verifySessionToken(token);
  if (!adminId) return null;

  return prisma.adminUser.findUnique({ where: { id: adminId } });
}

/**
 * Для использования внутри server actions админки — вторая линия защиты
 * поверх proxy.ts (там же проверяется cookie-сессия перед рендером страниц).
 */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
