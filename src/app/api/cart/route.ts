import { NextResponse } from "next/server";
import { getFavoriteVariants } from "@/lib/catalog";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean).slice(0, 50);
  return NextResponse.json({ items: await getFavoriteVariants(ids) });
}
