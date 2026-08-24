"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_MAX_AGE, ADMIN_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!login || !password) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const admin = await prisma.adminUser.findUnique({ where: { login } });
  const ok = admin ? await bcrypt.compare(password, admin.passwordHash) : false;

  if (!admin || !ok) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = createSessionToken(admin.id);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect(next && next.startsWith("/admin") ? next : "/admin");
}
