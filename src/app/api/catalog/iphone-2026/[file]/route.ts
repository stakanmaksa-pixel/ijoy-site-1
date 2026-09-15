import { readFile } from "node:fs/promises";
import path from "node:path";
import { isIphone2026PhotoFile } from "@/lib/iphone2026Photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read uploads at request time: files added by migrate need not exist at app startup.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!isIphone2026PhotoFile(file)) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), "public/uploads/products/iphone-2026", file));
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": "image/png", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (!missing) console.error("iPhone photo read failed", file, (error as NodeJS.ErrnoException).code);
    return new Response(null, { status: missing ? 404 : 500, headers: { "Cache-Control": "no-store" } });
  }
}
