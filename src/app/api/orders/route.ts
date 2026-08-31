import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAboutOrder } from "@/lib/orderNotifications";

const orderSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  customerPhone: z.string().trim().min(5).max(40),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  // items может быть пустым — так оформляются заявки "перезвоните мне"
  // (форма на главной, Trade-In, Гарантия, Доставка), не привязанные к
  // конкретному товару. Такая заявка попадает в тот же /admin/orders.
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(20).default(1),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { customerName, customerPhone, customerEmail, comment, items } =
    parsed.data;

  const variantIds = items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
  });

  if (variants.length !== variantIds.length) {
    return NextResponse.json(
      { error: "variant_not_found" },
      { status: 400 },
    );
  }

  // Модификации без цены (price: null — комбинация отсутствует в прайсе,
  // "уточняйте у менеджера") нельзя оформить с конкретной ценой: клиент
  // (ProductOrder.tsx) для них шлёт заявку без items, но на всякий случай
  // отбиваем это и на сервере, а не падаем с ошибкой БД на NOT NULL.
  const priceless = variants.filter((v) => v.price === null);
  if (priceless.length > 0) {
    return NextResponse.json(
      { error: "variant_price_on_request" },
      { status: 400 },
    );
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      comment: comment || null,
      items: {
        create: items.map((item) => {
          const variant = variants.find((v) => v.id === item.variantId)!;
          return {
            variantId: variant.id,
            quantity: item.quantity,
            // variant.price гарантированно не null — отфильтровано выше.
            priceAtOrder: variant.price!,
          };
        }),
      },
    },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  await notifyAboutOrder({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    comment: order.comment,
    items: order.items.map((item) => ({
      productName: item.variant.product.name,
      memory: item.variant.memory,
      color: item.variant.color,
      region: item.variant.region,
      quantity: item.quantity,
      price: Number(item.priceAtOrder),
    })),
  });

  return NextResponse.json({ id: order.id }, { status: 201 });
}
