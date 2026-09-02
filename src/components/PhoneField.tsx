"use client";

import { useState } from "react";

const COUNTRY_CODES = [
  { code: "+7", label: "Россия +7" },
  { code: "+375", label: "Беларусь +375" },
  { code: "+998", label: "Узбекистан +998" },
  { code: "", label: "Другая страна" },
] as const;

export function phoneWithCountryCode(countryCode: string, phone: string) {
  return countryCode ? `${countryCode} ${phone.trim()}` : phone.trim();
}

export function PhoneField({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  className = "",
  allowCountrySelect = true,
}: {
  countryCode: string;
  onCountryCodeChange: (countryCode: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  className?: string;
  // В коротких формах обратной связи работаем только с российским номером;
  // в корзине и заказе кнопка +7 открывает выбор другой страны.
  allowCountrySelect?: boolean;
}) {
  const isOtherCountry = countryCode === "";
  const [countryOpen, setCountryOpen] = useState(false);

  return <div className={className}>
    <label className="text-sm font-medium text-foreground">Номер телефона</label>
    <div className="relative mt-2 flex overflow-visible rounded-xl border border-zinc-300 bg-white transition-colors focus-within:border-accent">
      {allowCountrySelect && <button type="button" onClick={() => setCountryOpen((open) => !open)} aria-expanded={countryOpen} className="flex shrink-0 items-center gap-1.5 border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-foreground hover:bg-zinc-100"><span>{countryCode || "+"}</span><span className={`text-xs text-zinc-400 transition-transform ${countryOpen ? "rotate-180" : ""}`}>⌄</span></button>}
      <input required type="tel" inputMode="tel" autoComplete="tel-national" placeholder={isOtherCountry ? "Введите номер полностью, начиная с +" : "Номер телефона"} value={phone} onChange={(event) => onPhoneChange(event.target.value)} className="min-w-0 flex-1 rounded-xl border-0 bg-transparent px-4 py-3 text-base outline-none placeholder:text-zinc-400" />
      {allowCountrySelect && countryOpen && <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl">
        {COUNTRY_CODES.map((option) => <button key={option.code || "other"} type="button" onClick={() => { onCountryCodeChange(option.code); setCountryOpen(false); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${countryCode === option.code ? "bg-brand/10 font-semibold text-brand" : "text-zinc-700 hover:bg-zinc-50"}`}>{option.label}</button>)}
      </div>}
    </div>
    <p className="mt-2 text-xs leading-5 text-current/65">{allowCountrySelect ? (isOtherCountry ? "Введите номер полностью, начиная с +." : `Код ${countryCode} уже выбран — нажмите на него, чтобы изменить страну.`) : "Введите номер в российском формате."}</p>
  </div>;
}
