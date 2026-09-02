"use client";

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
}: {
  countryCode: string;
  onCountryCodeChange: (countryCode: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  className?: string;
}) {
  const isOtherCountry = countryCode === "";

  return <div className={className}>
    <div className="text-sm font-medium text-foreground">Номер телефона</div>
    <div className="mt-2 flex flex-wrap gap-2">
      {COUNTRY_CODES.map((option) => {
        const active = countryCode === option.code;
        return <button key={option.code || "other"} type="button" onClick={() => onCountryCodeChange(option.code)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${active ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-accent hover:text-accent"}`}>
          {option.label}
        </button>;
      })}
    </div>
    <input required type="tel" inputMode="tel" autoComplete="tel-national" placeholder={isOtherCountry ? "Введите номер полностью, начиная с +" : `Номер без кода ${countryCode}`} value={phone} onChange={(event) => onPhoneChange(event.target.value)} className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-zinc-400 focus:border-accent" />
    <p className="mt-2 text-xs leading-5 text-current/65">{isOtherCountry ? "Введите номер полностью, начиная с +." : `Код ${countryCode} уже выбран — вводите номер без него.`}</p>
  </div>;
}
