import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { updateOrderStatus } from "./actions";
import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Новая",
  CONFIRMED: "Подтверждена",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

const QUICK_FILTERS = [
  { key: "", label: "Все" },
  { key: "NEW", label: "Новые" },
  { key: "PROCESSING", label: "В работе" },
] as const;

const STATUS_STYLE: Record<OrderStatus, string> = {
  NEW: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-700 ring-sky-200",
  PROCESSING: "bg-violet-50 text-violet-700 ring-violet-200",
  SHIPPED: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

const DELIVERY_LABEL = {
  PICKUP: "Самовывоз",
  DELIVERY: "Доставка",
} as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const selectedStatus = status && status in STATUS_LABEL ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: selectedStatus ? { status: selectedStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
    },
  });
  const [newCount, processingCount, totalCount] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count(),
  ]);
  const countByFilter: Record<string, number> = {
    "": totalCount,
    NEW: newCount,
    PROCESSING: processingCount,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Заявки и заказы</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Новых заявок: <span className="font-semibold text-amber-700">{newCount}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => {
            const isActive = selectedStatus === filter.key;
            const href = filter.key ? `/admin/orders?status=${filter.key}` : "/admin/orders";
            return (
              <Link
                key={filter.key || "all"}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {filter.label} · {countByFilter[filter.key]}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {orders.map((order) => {
          const total = order.items.reduce(
            (sum, item) => sum + Number(item.priceAtOrder) * item.quantity,
            0,
          );

          return (
            <div
              key={order.id}
              className={`rounded-2xl border p-4 ${
                order.status === "NEW" ? "border-amber-200 bg-amber-50/30" : "border-zinc-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-zinc-900">{order.customerName}</div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        STATUS_STYLE[order.status]
                      }`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
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
                  {order.deliveryMethod !== "UNSPECIFIED" && (
                    <div className="mt-2 text-sm text-zinc-700">
                      <span className="font-medium">Получение: </span>
                      {DELIVERY_LABEL[order.deliveryMethod]}
                      {order.deliveryMethod === "DELIVERY" && order.deliveryAddress && (
                        <span> · {order.deliveryAddress}</span>
                      )}
                    </div>
                  )}
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
