-- Фото товара по цветам (JSON: цвет -> массив путей к файлам).
ALTER TABLE "Product" ADD COLUMN "colorImages" JSONB;
