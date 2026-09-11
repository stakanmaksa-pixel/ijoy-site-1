// Development-only: download unmodified manufacturer originals, never recolour products.
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { ACCESSORY_PHOTOS, accessoryPhotoPath } from "../data/accessory-variant-photos";
async function main() {
for (const [slug, photos] of Object.entries(ACCESSORY_PHOTOS)) {
  const only = process.argv.find(arg => arg.startsWith("--slug="))?.slice(7);
  if (only && slug !== only) continue;
  await Promise.all(Object.entries(photos).map(async ([key, source]) => {
    const target = path.resolve(`public${accessoryPhotoPath(slug, key)}`);
    if (!process.argv.includes("--refresh")) {
      try { await access(target); console.log(`EXISTS ${key}`); return; } catch {}
    }
    const response = await fetch(source, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw Error(`${key}: HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const isImage = buffer.subarray(1, 4).toString() === "PNG" || buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])) || buffer.subarray(8, 12).toString() === "WEBP";
    if (!isImage) throw Error(`${key}: ответ не является изображением`);
    if (buffer.length < 5000) throw Error(`${key}: подозрительно маленькое изображение`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer, { flag: process.argv.includes("--refresh") ? "w" : "wx" });
    console.log(`PHOTO ${slug} / ${key}: ${buffer.length}`);
  }));
}
}
main().catch(error => { console.error(error); process.exitCode = 1; });
