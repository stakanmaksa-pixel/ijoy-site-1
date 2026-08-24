import type { Metadata } from "next";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Вход в админку" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const next = params.next || "/admin";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        action={loginAction}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 p-6"
      >
        <h1 className="text-lg font-semibold text-zinc-900">Вход в админку iJoy</h1>

        {hasError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Неверный логин или пароль.
          </p>
        )}

        <input type="hidden" name="next" value={next} />

        <div className="mt-4 flex flex-col gap-3">
          <input
            required
            name="login"
            placeholder="Логин"
            autoComplete="username"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            name="password"
            placeholder="Пароль"
            autoComplete="current-password"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="mt-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Войти
          </button>
        </div>
      </form>
    </div>
  );
}
