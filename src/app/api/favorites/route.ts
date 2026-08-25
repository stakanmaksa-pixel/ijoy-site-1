import { NextResponse } from "next/server";
import { getFavoriteVariants } from "@/lib/catalog";

// Отдаёт данные избранных модификаций по списку их id из localStorage
// клиента (?ids=cl123,cl456 — через запятую) — используется страницей
// /favorites, поскольку сам список избранного хранится только в браузере,
// и на сервере о нём ничего не известно.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const items = await getFavoriteVariants(ids);
  return NextResponse.json({ items });
}
