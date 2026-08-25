-- Карточка товара: характеристики, ключевые особенности и сравнение с
-- предыдущим поколением. Все поля необязательные — старые товары без этих
-- данных продолжают работать как раньше, блок на странице просто не
-- показывается (см. ProductDetail.tsx).
ALTER TABLE "Product" ADD COLUMN     "specs" JSONB;
ALTER TABLE "Product" ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN     "previousGenLabel" TEXT;
ALTER TABLE "Product" ADD COLUMN     "previousGenHighlights" TEXT[] DEFAULT ARRAY[]::TEXT[];
