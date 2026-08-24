import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { updateOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Новая",
  CONFIRMED: "Подтверждена",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Заказы</h1>

      <div className="mt-6 flex flex-col gap-3">
        {orders.map((order) => {
          const total = order.items.reduce(
            (sum, item) => sum + Number(item.priceAtOrder) * item.quantity,
            0,
          );

          return (
            <div key={order.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-zinc-900">{order.customerName}</div>
                  <div className="text-sm text-zinc-500">
                    <a href={`tel:${order.customerPhone}`} className="hover:text-zinc-900">
                      {order.customerPhone}
                    </a>
                    {order.customerEmail && <span> · {order.customerEmail}</span>}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(order.createdAt)}
                  </div>
                </div>

                <form action={updateOrderStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
                  >
                    Сохранить
                  </button>
                </form>
              </div>

              {order.items.length === 0 ? (
                <div className="mt-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Заявка «перезвоните мне» — без товара
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-600">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.variant.product.name}
                        {" — "}
                        {[item.variant.memory, item.variant.color, item.variant.region]
                          .filter(Boolean)
                          .join(" · ")}
                        {" × "}
                        {item.quantity}
                      </span>
                      <span>{formatPrice(Number(item.priceAtOrder) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-sm">
                {order.comment && <span className="text-zinc-500">«{order.comment}»</span>}
                {order.items.length > 0 && (
                  <span className="ml-auto font-medium text-zinc-900">{formatPrice(total)}</span>
                )}
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <p className="text-sm text-zinc-500">Заявок пока нет.</p>
        )}
      </div>
    </div>
  );
}
