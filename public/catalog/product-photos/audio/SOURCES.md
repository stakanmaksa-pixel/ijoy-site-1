# Headphone product photography

Original Apple Store JPEG assets, downloaded without modification, 2026-09-07.
All files use `?wid=1200&hei=1200&fmt=jpeg&qlt=95` on the base URL
`https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/`.

| File | Apple asset ID | Source page |
| --- | --- | --- |
| airpods-pro-3.jpg | airpods-pro-3-hero-select-202509 | https://www.apple.com/shop/buy-airpods/airpods-pro-3 |
| airpods-pro-2.jpg | MTJV3 | Apple Store USB-C AirPods Pro 2 product asset (MTJV3; its former shop page now redirects to Pro 3) |
| airpods-4.jpg | airpods-4-select-202409_FV1 | https://www.apple.com/shop/buy-airpods/airpods-4 |
| airpods-4-anc.jpg | airpods-4-anc-select-202409_FV1 | https://www.apple.com/shop/buy-airpods/airpods-4 |
| earpods-usb-c.jpg | MTJY3 | https://www.apple.com/shop/product/myqy3am/a/earpods-usb-c |
| max2-COLOR.jpg | airpods-max-select-202409-COLOR_FV1 | https://www.apple.com/shop/buy-airpods/airpods-max-2/purple |

Max colors: midnight, starlight, blue, purple, orange. These are the color-specific assets served by Apple's current Max 2 product page, despite their historical 202409 asset names.

`resolveHeadphonePhoto` maps only the auto-importer's `cover.jpg` and `max2-COLOR.jpg` paths to these bundled images. User-uploaded files and other models are left untouched. Updating the app is sufficient; no database or price synchronization is needed.

CSS contains the complete image within a square, with positive model-specific padding to account for different baked-in margins. No background is generated, no image is stretched and no negative scaling or cropping is used.
