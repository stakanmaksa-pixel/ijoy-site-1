// Only the ten catalogue assets can be read through the runtime photo endpoint.
export function isIphone2026PhotoFile(file: string): boolean {
  return /^(?:iphone-18-pro(?:-max)?-(?:black|silver|glacier|burgundy)|iphone-duo-(?:night-sky|star-white))\.png$/.test(file);
}
export function iphone2026RuntimePhoto(url: string): string {
  const prefix = "/uploads/products/iphone-2026/";
  const file = url.startsWith(prefix) ? url.slice(prefix.length) : "";
  return isIphone2026PhotoFile(file) ? `/api/catalog/iphone-2026/${file}` : url;
}
