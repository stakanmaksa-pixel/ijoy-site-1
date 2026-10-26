// Explicit asset download only: no database or runtime network dependency.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MINI_A20_PHOTO_ASSETS, MINI_A20_SOURCES } from "../data/ipad-mini-a20-pro-catalog";

export function validateMiniA20Photo(bytes: Buffer) {
  if (bytes.length < 10_000 || bytes.length > 8_000_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw Error("Некорректное JPEG-фото iPad mini A20 Pro");
  for (let offset = 2; offset + 8 < bytes.length;) {
    if (bytes[offset] !== 0xff) throw Error("Некорректный JPEG-маркер");
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) throw Error("Повреждённый JPEG-сегмент");
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      const height = bytes.readUInt16BE(offset + 5), width = bytes.readUInt16BE(offset + 7);
      if (width < 600 || height < 600 || width > 4096 || height > 4096) throw Error(`Неверный размер фото: ${width} × ${height}`);
      return { width, height };
    }
    offset += 2 + length;
  }
  throw Error("Не найден размер JPEG-фото");
}

export async function downloadMiniA20Photos() {
  const photos = await Promise.all(MINI_A20_PHOTO_ASSETS.map(async asset => {
    const response = await fetch(asset.source, { signal: AbortSignal.timeout(30000), redirect: "error" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg")) throw Error(`Apple Newsroom: ${asset.file}, HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    return { ...asset, ...validateMiniA20Photo(bytes), sha256: createHash("sha256").update(bytes).digest("hex"), bytes };
  }));
  if (new Set(photos.map(photo => photo.sha256)).size !== 3) throw Error("Apple вернула одинаковые фото для разных кадров");
  for (const photo of photos) {
    const destination = path.join(process.cwd(), "public", photo.file.slice(1));
    await mkdir(path.dirname(destination), { recursive: true });
    try { await writeFile(destination, photo.bytes, { flag: "wx" }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (!(await readFile(destination)).equals(photo.bytes)) throw Error(`Фото уже существует и отличается; не перезаписываю: ${photo.file}`);
    }
    console.log(`PHOTO ${photo.file}`);
  }
  return photos.map(({ bytes, ...photo }) => ({ ...photo, bytes: bytes.length }));
}

if (process.argv[1] && /(?:^|[\\/])download-ipad-mini-a20-pro-photos\.ts$/.test(process.argv[1])) {
  downloadMiniA20Photos().then(photos => console.log(JSON.stringify({ checkedAt: "2026-10-27", sources: MINI_A20_SOURCES, photos }, null, 2)))
    .catch(error => { console.error(error); process.exitCode = 1; });
}
