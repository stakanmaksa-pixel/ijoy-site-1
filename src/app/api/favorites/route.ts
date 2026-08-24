import { NextResponse } from "next/server";
import { getProductsBySlugs } from "@/lib/catalog";

// Отдаёт карточки товаров по списку слагов из localStorage клиента
// (?slugs=iphone-17-pro,samsung-galaxy-s25 — через запятую) — используется
// страницей /favorites, поскольку сам список избранного хранится только
// в браузере и на сервере о нём ничего не известно.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await getProductsBySlugs(slugs);
  return NextResponse.json({ products });
}
