// Called explicitly by sync-iphone-2026-catalog.ts on deployment, never on import/build.
// No database access. Keeps original PNG bytes in the shared uploads volume.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { IPHONE_2026_CATALOG } from "../data/iphone-2026-catalog";

export function officialIphonePhotoUrl(html: string, id: string) {
  const urls = [...html.matchAll(/https:\/\/store\.storeimages\.cdn-apple\.com\/1\/as-images\.apple\.com\/is\/[^"<>\s]+/g)]
    .map(m => m[0].replaceAll("&amp;", "&").replace(/\\+$/, ""));
  const source = urls.find(url => url.split("?")[0].endsWith(`/${id}`));
  if (!source) throw Error(`Apple no longer lists this colour asset: ${id}`);
  const url = new URL(source);
  url.searchParams.set("wid", "940"); url.searchParams.set("hei", "1112"); url.searchParams.set("fmt", "png-alpha");
  return url.href;
}
export function validateIphonePng(bytes: Buffer) {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw Error("Not a PNG image");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < 600 || height < 600 || width > 4096 || height > 4096) throw Error(`Unexpected image dimensions: ${width} x ${height}`);
  return { width, height };
}
export async function downloadIphone2026Photos() {
  const pages: Record<string, string> = {};
  for (const family of ["iphone-18-pro", "iphone-duo"]) {
    const response = await fetch(`https://www.apple.com/shop/buy-iphone/${family}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Apple Store: ${response.status}`);
    pages[family] = await response.text();
  }
  const downloaded = [];
  for (const product of IPHONE_2026_CATALOG) {
    for (const color of product.colors) {
      const finish = color.toLowerCase().replaceAll(" ", "-");
      const id = `${product.slug}-finish-select-${finish}-202609`;
      const source = officialIphonePhotoUrl(pages[product.slug === "iphone-duo" ? "iphone-duo" : "iphone-18-pro"], id);
      const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw Error(`Apple image: ${id} ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const dimensions = validateIphonePng(bytes);
      downloaded.push({ slug: product.slug, color, file: `${product.slug}-${finish}.png`, source, sha256: createHash("sha256").update(bytes).digest("hex"), ...dimensions, bytes });
    }
  }
  // Catch a CDN fallback returning the same generic device for different colours.
  for (const product of IPHONE_2026_CATALOG) {
    const colorPhotos = downloaded.filter(photo => photo.slug === product.slug);
    if (new Set(colorPhotos.map(photo => photo.sha256)).size !== product.colors.length) throw Error(`Duplicate colour images: ${product.slug}`);
  }
  const root = path.resolve("public/uploads/products/iphone-2026");
  await mkdir(root, { recursive: true });
  for (const {file, bytes} of downloaded) {
    const destination = path.join(root, file);
    try { await writeFile(destination, bytes, { flag: "wx" }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (!(await readFile(destination)).equals(bytes)) throw Error(`Existing photo differs; retained without overwrite: ${file}`);
    }
    console.log(`PHOTO ${file}`);
  }
  return downloaded.map(({bytes: _bytes, ...entry}) => entry);
}
