# iPad mini / Apple TV update (2026-09-07)

Specifications and supported configurations:

- https://www.apple.com/ipad-mini/specs/
- https://support.apple.com/en-us/121456
- https://www.apple.com/shop/buy-ipad/ipad-mini

iPad mini (A17 Pro): 128/256/512 GB × Blue/Purple/Starlight/Space Gray × Wi-Fi/Wi-Fi + Cellular = 24 combinations. Cellular uses eSIM, not a physical SIM. Pencil Pro and Pencil USB-C are compatible. Existing prices are preserved; this update does not import new prices.

Unmodified original Apple Store images (1200 × 1200 JPEG, quality 95):

- Base URL: `https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/`
- mini asset IDs: `ipad-mini-select-{wifi|cell}-{blue|purple|spacegray|starlight}-202410`
- Apple TV asset ID: `apple-tv-4k-hero-select-202210`, from https://www.apple.com/shop/buy-tv/apple-tv-4k
- Query: `?wid=1200&hei=1200&fmt=jpeg&qlt=95`

Files ship in `public/catalog/product-photos/`, outside the persistent uploads volume. No network download is needed during server synchronization. Apple TV 64 GB and 128 GB share the same exterior and Siri Remote; using the same official hero image is intentional.

## Deployment

Build both `app` and `migrate`, then run `prisma/scripts/sync-ipad-mini-catalog.ts` through the migrate service. Optional `--dry-run` prints exact targets without database writes. Restart app afterwards to refresh cached navigation. Do not reseed the database.

The script archives only the named old iPad models plus tablet-category HONOR/OnePlus products as `HIDDEN`. Their variants are retained. Selected mini variants move to the canonical product without changing IDs, prices, stock, SKUs or order references. Remaining duplicates stay hidden; surplus canonical variants are moved to a hidden archive bucket. All database changes run in one serializable transaction. The existing current Pro M5 / Air M4 / A16 models are protected.

Apple TV changes are limited to images, without rewriting variants or prices. This targeted script is preferable to the older TV catalogue-normalization script for this update.
