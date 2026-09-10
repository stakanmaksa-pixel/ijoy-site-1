import manifest from "./watch-tablet-photo-sources.json";
import { variantImageKey } from "../../src/lib/pickCoverImage";

type Photo = { slug: string; color: string; file: string; memory?: string; sha256: string; source: string; url: string };
export type PhotoProduct = { slug: string; category: "chasy" | "planshety"; photos: Photo[] };
type Variant = { memory: string | null; color: string | null; region: string | null };
type Current = { images: string[]; colorImages: unknown; variants: Variant[] };
const photos: Photo[] = manifest.entries;
export const WATCH_TABLET_PHOTOS: PhotoProduct[] = [...new Set(photos.map(p => p.slug))].map(slug => ({
  slug, category: slug.includes("watch") ? "chasy" : "planshety", photos: photos.filter(p => p.slug === slug),
}));
export const WATCH9_ALIASES = ["samsung-galaxy-watch9", "galaxy-watch9"];

function colorKey(value: string) {
  return (value.match(/\(([^)]+)\)\s*$/)?.[1] ?? value).trim().toLowerCase().replace(/grey/g, "gray");
}
function memoryKey(value: string) { return value.toLowerCase().replace(/\s/g, "").replace(/мм/g, "mm"); }
function dictionary(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string[]] =>
    Array.isArray(entry[1]) && entry[1].every(item => typeof item === "string")));
}
const local = (photo: Photo) => `/catalog/product-photos/${photo.file}`;

/** Photo-only update: variant IDs, prices, stock, dimensions and publication stay untouched. */
export function planWatchTabletPhotos(current: Current, product: PhotoProduct) {
  if (!product.photos.length) throw Error(`No photos for ${product.slug}`);
  const previous = dictionary(current.colorImages);
  const colorImages = { ...previous };
  for (const photo of product.photos) {
    // Colour-level cover is deterministic; exact size matches are written below.
    if (photo === product.photos.find(p => p.color === photo.color)) colorImages[photo.color] = [local(photo)];
  }
  for (const variant of current.variants) {
    if (!variant.color) continue; // Existing unconfigured Huawei offer uses the product cover.
    let candidates = product.photos.filter(p => colorKey(p.color) === colorKey(variant.color!));
    if (candidates.some(p => p.memory) && variant.memory) {
      candidates = candidates.filter(p => p.memory && memoryKey(p.memory) === memoryKey(variant.memory!));
    }
    if (!candidates.length) {
      // Never substitute another colour/size for an unrecognised real offer.
      const existing = previous[variantImageKey(variant)] ?? previous[variant.color];
      if (existing?.length) continue;
      throw Error(`${product.slug}: no confirmed photo for ${variant.memory ?? ""} / ${variant.color}`);
    }
    const selected = candidates.map(local);
    colorImages[variantImageKey(variant)] = selected;
    // pickCoverImage receives a colour, not a size; keep a matching-colour cover too.
    colorImages[variant.color] = [selected[0]];
  }
  return { images: [local(product.photos[0])], colorImages };
}
