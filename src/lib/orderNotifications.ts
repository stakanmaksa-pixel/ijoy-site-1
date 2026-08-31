type NotificationItem = {
  productName: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  quantity: number;
  price: number | null;
};

type OrderNotification = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  comment: string | null;
  items: NotificationItem[];
};

function itemLabel(item: NotificationItem) {
  const details = [item.memory, item.color, item.region].filter(Boolean).join(" · ");
  return [item.productName, details].filter(Boolean).join(" — ");
}

function messageText(order: OrderNotification) {
  const lines = ["Новая заявка с сайта iJoy", `№ ${order.id}`, "", `Имя: ${order.customerName}`, `Телефон: ${order.customerPhone}`];
  if (order.customerEmail) lines.push(`Email: ${order.customerEmail}`);
  if (order.items.length > 0) {
    lines.push("", "Товары:");
    for (const item of order.items) {
      const price = item.price != null ? ` — ${item.price.toLocaleString("ru-RU")} ₽` : " — цену уточнить";
      lines.push(`• ${itemLabel(item)} × ${item.quantity}${price}`);
    }
  } else {
    lines.push("", "Тип: заявка / уточнение цены");
  }
  if (order.comment) lines.push("", `Комментарий: ${order.comment}`);
  return lines.join("\n");
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_NOTIFICATIONS_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;
  if (!token || !chatId) return;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!response.ok) throw new Error(`Telegram notification failed: ${response.status}`);
}

async function sendEmail(text: string) {
  // Resend работает через HTTP, поэтому не нужен SMTP-сервер и лишняя
  // библиотека внутри Docker-образа.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  const to = process.env.ORDER_EMAIL_TO;
  if (!apiKey || !from || !to) return;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Новая заявка — iJoy", text }),
  });
  if (!response.ok) throw new Error(`Email notification failed: ${response.status}`);
}

// Заказ сначала надёжно сохраняется в БД; ошибка уведомления не должна
// мешать покупателю отправить заявку.
export async function notifyAboutOrder(order: OrderNotification) {
  const text = messageText(order);
  const results = await Promise.allSettled([sendTelegram(text), sendEmail(text)]);
  for (const result of results) {
    if (result.status === "rejected") console.error(result.reason);
  }
}
