import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ожидает проверки",
  PARTIALLY_APPLIED: "Частично применено",
  APPLIED: "Применено",
  REJECTED: "Отклонено",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PARTIALLY_APPLIED: "bg-blue-100 text-blue-800",
  APPLIED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-zinc-200 text-zinc-600",
};

export default async function PriceImportListPage() {
  const batches = await prisma.priceImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true } } },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Импорт прайса</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Сюда попадают прайсы, присланные через кнопку «Обновить цены на сайте» в
        Telegram-боте. Цены не применяются автоматически — каждую партию нужно
        открыть и подтвердить (или отклонить) вручную.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {batches.map((batch) => (
          <Link
            key={batch.id}
            href={`/admin/price-import/${batch.id}`}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 hover:border-zinc-300"
          >
            <div>
              <div className="font-medium text-zinc-900">
                {new Intl.DateTimeFormat("ru-RU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(batch.createdAt)}
              </div>
              <div className="text-sm text-zinc-500">{batch._count.lines} позиций</div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${STATUS_CLASS[batch.status] ?? "bg-zinc-100 text-zinc-700"}`}
            >
              {STATUS_LABEL[batch.status] ?? batch.status}
            </span>
          </Link>
        ))}

        {batches.length === 0 && (
          <p className="text-sm text-zinc-500">
            Пока пусто — как только бот пришлёт прайс, партия появится здесь.
          </p>
        )}
      </div>
    </div>
  );
}
