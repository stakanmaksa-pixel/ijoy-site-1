import { catalogPhotoBounds, resolveCatalogPhoto } from "@/lib/catalogPhotos";

/** Fit the entire device, not the whitespace in a manufacturer's canvas. */
export function ProductPhoto({ src, alt, slug, region }: { src: string; alt: string; slug?: string; region?: string | null }) {
  const photo = resolveCatalogPhoto(src, slug, region);
  const bounds = catalogPhotoBounds(photo);
  if (bounds) {
    return <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative shrink-0 overflow-hidden" style={{
        aspectRatio: `${bounds.w} / ${bounds.h}`,
        width: bounds.w >= bounds.h ? "76%" : undefined,
        height: bounds.h > bounds.w ? "76%" : undefined,
      }}>
        <img src={photo} alt={alt} loading="lazy" decoding="async" data-product-photo={photo}
          className="absolute max-w-none" style={{
            width: `${100 * bounds.width / bounds.w}%`,
            height: `${100 * bounds.height / bounds.h}%`,
            left: `${-100 * bounds.x / bounds.w}%`,
            top: `${-100 * bounds.y / bounds.h}%`,
          }} />
      </div>
    </div>;
  }
  const isPencil = /\/apple-pencil-[^/]+\//.test(photo);
  return <img src={photo} alt={alt} loading="lazy" decoding="async"
    data-product-photo={photo} className={`absolute inset-0 h-full w-full object-contain p-3 ${isPencil ? "rotate-[34deg]" : ""}`} />;
}
