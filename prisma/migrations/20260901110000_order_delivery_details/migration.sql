-- Способ получения и адрес доставки для заявок на товар.
CREATE TYPE "DeliveryMethod" AS ENUM ('UNSPECIFIED', 'PICKUP', 'DELIVERY');

ALTER TABLE "Order"
  ADD COLUMN "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'UNSPECIFIED',
  ADD COLUMN "deliveryAddress" TEXT;
