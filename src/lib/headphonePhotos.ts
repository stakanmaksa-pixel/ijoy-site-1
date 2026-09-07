const ROOT = "/catalog/product-photos/audio/";

export function isHeadphoneProduct(slug: string) {
  return /(?:airpods|earpods|galaxy-buds|headphones|sony-pulse|marshall-major)/i.test(slug);
}

// Only replace known auto-imported covers, never photographs uploaded by an editor.
// Bundled assets also fix existing databases without another catalogue/price import.
export function resolveHeadphonePhoto(url: string): string {
  const legacy = url.match(/^\/uploads\/products\/([^/]+)\/([^/]+)$/);
  if (!legacy) return url;
  const [, slug, file] = legacy;
  if (/airpods-max-2(?:-|$)/i.test(slug)) {
    const color = file.match(/^max2-(midnight|starlight|blue|purple|orange)\.jpg$/)?.[1];
    return color ? `${ROOT}max2-${color}.jpg` : url;
  }
  if (file !== "cover.jpg") return url;
  if (/airpods-pro-3(?:-|$)/i.test(slug)) return `${ROOT}airpods-pro-3.jpg`;
  if (/airpods-pro-2(?:-|$)/i.test(slug)) return `${ROOT}airpods-pro-2.jpg`;
  if (/airpods-4(?:-|$)/i.test(slug)) return `${ROOT}${/anc|noise/i.test(slug) ? "airpods-4-anc" : "airpods-4"}.jpg`;
  if (/earpods.*usb-c/i.test(slug)) return `${ROOT}earpods-usb-c.jpg`;
  return url;
}

// Original Apple assets have different built-in margins. Only add positive padding;
// never stretch or crop the product, and don't apply these presets to custom photos.
export function headphonePhotoPadding(url: string | null | undefined): string {
  if (url === `${ROOT}airpods-pro-2.jpg`) return "10%";
  if (url === `${ROOT}airpods-4-anc.jpg`) return "6%";
  if (url === `${ROOT}earpods-usb-c.jpg`) return "16%";
  return url?.startsWith(ROOT) ? "0" : "5%";
}
