import { resolveHeadphonePhoto } from "./headphonePhotos";
import bounds from "./catalogPhotoBounds.json";
import appleWatchPhotos from "./appleWatchPhotoReplacements.json";
import accessoryBounds from "./accessoryPhotoBounds.json";
import { iphone2026RuntimePhoto } from "./iphone2026Photos";

export type PhotoBounds = { width: number; height: number; x: number; y: number; w: number; h: number };

const ROOT = "/catalog/product-photos/gaming-lifestyle/";
const REPLACEMENTS: Record<string, string> = {
  "steam-deck-oled.jpg": "steam-deck-oled-v2.png",
  "steam-deck-dock.jpg": "steam-deck-dock-v2.png",
  "dualsense-edge.jpg": "dualsense-edge-v2.png",
  "ps-portal.png": "ps-portal-v2.png",
  "nintendo-switch-2.webp": "nintendo-switch-2-v2.png",
  "logitech-g923.jpg": "logitech-g923-v2.png",
  "logitech-g29.jpg": "logitech-g29-v2.png",
  "meta-quest-3.webp": "meta-quest-3-v3.jpg",
  "meta-quest-3s.webp": "meta-quest-3s-v2.jpg",
  "nintendo-switch-oled.png": "nintendo-switch-oled-v3.jpg",
  "valve-steam-machine.jpg": "valve-steam-machine-cover.jpg",
};

// Only known catalogue assets are normalized. Editor uploads keep their framing.
export function resolveCatalogPhoto(url: string, slug?: string, region?: string | null): string {
  const iphonePhoto = iphone2026RuntimePhoto(url);
  if (iphonePhoto !== url) return iphonePhoto;
  // Replace only exact legacy imports; arbitrary editor uploads retain their image and framing.
  const watchPhoto = (appleWatchPhotos as Record<string, string>)[url];
  if (watchPhoto) return watchPhoto;
  if (region === "С Steam Controller" &&
    ["valve-steam-machine.jpg", "valve-steam-machine-cover.jpg"].some(file => url === ROOT + file)) {
    return ROOT + "valve-steam-machine-v2.jpg";
  }
  if (url === `${ROOT}ps5-slim.png`) {
    if (slug === "playstation-5-slim-disc-rev2") return `${ROOT}ps5-slim-disc-v2.png`;
    if (slug === "playstation-5-slim-digital-rev2") return `${ROOT}ps5-slim-digital-v2.png`;
  }
  if (url.startsWith(ROOT) && REPLACEMENTS[url.slice(ROOT.length)]) {
    return ROOT + REPLACEMENTS[url.slice(ROOT.length)];
  }
  return resolveHeadphonePhoto(url);
}

export function catalogPhotoBounds(url: string): PhotoBounds | null {
  return (accessoryBounds as Record<string, PhotoBounds>)[url] ?? (bounds as Record<string, PhotoBounds>)[url] ?? null;
}
