// Some supplied images intentionally show the whole model line rather than one
// finish. Keep those images as the product-level cover and switch to the exact
// finish only after the visitor chooses a variant.
const GENERAL_PRODUCT_GALLERY_SLUGS = new Set([
  "apple-watch-ultra-4",
  "dyson-camerajet",
  "iphone-18-pro",
  "iphone-18-pro-max",
  "iphone-duo",
]);

export function usesGeneralProductGallery(productSlug: string): boolean {
  return GENERAL_PRODUCT_GALLERY_SLUGS.has(productSlug);
}
