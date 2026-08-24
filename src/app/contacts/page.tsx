import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CONTACTS } from "@/lib/contacts";

export const metadata: Metadata = { title: "Контакты" };

// Реальная структура /contacts на Тильде: крупные контакты (тот же
// приём, что и в подвале — раньше на этой странице контакты были
// мелкими и терялись), затем сетка мессенджеров.
const MESSENGERS = [
  { label: "Чат в Telegram", value: CONTACTS.telegramChat, href: `https://t.me/${CONTACTS.telegramChat.replace("@", "")}` },
  { label: "Канал в Telegram", value: CONTACTS.telegramChannel, href: `https://t.me/${CONTACTS.telegramChannel.replace("@", "")}` },
  { label: "Чат в WhatsApp", value: CONTACTS.whatsapp, href: CONTACTS.whatsappUrl },
  { label: "Написать в Direct", value: CONTACTS.instagramHandle, href: CONTACTS.instagramUrl },
] as const;

export default function ContactsPage() {
  return (
    <div>
      <PageHero title="Контакты Магазина iJoy Gadget Store" highlight="Магазина" />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <a
          href={`mailto:${CONTACTS.email}`}
          className="block break-all font-display text-2xl font-semibold text-foreground transition-colors hover:text-accent sm:text-3xl"
        >
          {CONTACTS.email}
        </a>
        <a
          href={CONTACTS.phoneHref}
          className="mt-2 block font-display text-2xl font-semibold text-accent transition-colors hover:text-brand sm:text-3xl"
        >
          {CONTACTS.phone}
        </a>

        <div className="mt-5 text-sm text-zinc-500">
          <p>г. Москва, Багратионовский проезд, 7к2</p>
          <p>Работаем каждый день с 10:00 до 21:00</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-zinc-100 pt-10 sm:grid-cols-4">
          {MESSENGERS.map((m) => (
            <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer" className="group">
              <div className="text-sm font-medium text-accent transition-colors group-hover:text-brand">
                {m.label}
              </div>
              <div className="mt-0.5 text-sm text-zinc-500">{m.value}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
