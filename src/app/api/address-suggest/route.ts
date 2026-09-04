import { NextRequest, NextResponse } from "next/server";

const DADATA_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) return NextResponse.json({ suggestions: [] });

  const token = process.env.DADATA_API_KEY;
  // Адрес можно ввести руками; отсутствие ключа не должно ломать оформление.
  if (!token) return NextResponse.json({ suggestions: [] });

  try {
    const response = await fetch(DADATA_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ query, count: 6, language: "ru" }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ suggestions: [] });
    const data: unknown = await response.json();
    const suggestions = typeof data === "object" && data !== null && "suggestions" in data
      ? (data as { suggestions?: unknown }).suggestions
      : [];
    return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions.map((item) => {
      const value = item && typeof item === "object" && "value" in item ? (item as { value?: unknown }).value : "";
      return { value: typeof value === "string" ? value : "" };
    }).filter((item) => item.value) : [] });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
