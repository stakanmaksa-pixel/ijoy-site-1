"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

const VALID_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !VALID_STATUSES.includes(status as OrderStatus)) return;

  await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus },
  });

  revalidatePath("/admin/orders");
}
