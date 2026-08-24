import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";
import { CONTACTS, FOUNDED_YEAR } from "@/lib/contacts";
import { Logo } from "@/components/Logo";

const MESSENGERS = [
  { label: "Чат в Telegram", value: CONTACTS.telegramChat, href: `https://t.me/${CONTACTS.telegramChat.replace("@", "")}` },
  { label: "Канал в Telegram", value: CONTACTS.telegramChannel, href: `https://t.me/${CONTACTS.telegramChannel.replace("@", "")}` },
  { label: "Чат в WhatsApp", value: CONTACTS.whatsapp, href: CONTACTS.whatsappUrl },
  { label: "Написать в Direct", value: CONTACTS.instagramHandle, href: CONTACTS.instagramUrl },
] as const;

// Подвал повторяет структуру реального сайта на Тильде: крупные контакты,
// адрес/часы работы, ряд мессенджеров и копирайт — на тёмном фирменном
// фоне (раньше подвал был маленьким и светлым, терялся на фоне остального).
export function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <a
              href={`mailto:${CONTACTS.email}`}
              className="block break-all font-display text-2xl font-semibold text-white transition-colors hover:text-accent sm:text-3xl"
            >
              {CONTACTS.email}
            </a>
            <a
              href={CONTACTS.phoneHref}
              className="mt-2 block font-display text-2xl font-semibold text-accent transition-colors hover:text-white sm:text-3xl"
            >
              {CONTACTS.phone}
            </a>

            <div className="mt-5 text-sm text-white/70">
              <p>г. Москва, Багратионовский проезд, 7к2</p>
              <p>Пн–Вс. с 10:00 до 21:00</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 md:grid-cols-2">
            {MESSENGERS.map((m) => (
              <a
                key={m.label}
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="text-sm font-medium text-accent transition-colors group-hover:text-white">
                  {m.label}
                </div>
                <div className="mt-0.5 text-sm text-white/70">{m.value}</div>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Logo variant="light" />
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-accent">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50 sm:px-6">
        © {FOUNDED_YEAR}–{new Date().getFullYear()} «iJoy». Все права защищены.
      </div>
    </footer>
  );
}
