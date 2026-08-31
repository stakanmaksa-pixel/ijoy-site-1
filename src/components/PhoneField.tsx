"use client";

const COUNTRY_CODES = [
  { code: "+7", label: "Россия / Казахстан (+7)" },
  { code: "+375", label: "Беларусь (+375)" },
  { code: "+998", label: "Узбекистан (+998)" },
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

  return (
    <div className={className}>
      <div className="flex overflow-hidden rounded-full bg-white text-foreground">
        <select
          aria-label="Код страны"
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value)}
          className="min-w-0 border-0 border-r border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none"
        >
          {COUNTRY_CODES.map((option) => (
            <option key={option.code || "other"} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={isOtherCountry ? "+код страны и номер" : "Номер без кода страны"}
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          className="min-w-0 flex-1 border-0 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>
      <p className="mt-1 text-xs text-current/65">
        {isOtherCountry ? "Введите номер полностью, начиная с +." : "Код страны уже выбран — вводите номер без +7."}
      </p>
    </div>
  );
}
