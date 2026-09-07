export type SamsungPhoneMenuGroup = {
  label: string;
  matches: (value: string) => boolean;
};

const has = (pattern: RegExp) => (value: string) => pattern.test(value.toLowerCase());

// Это именно согласованный ассортимент Samsung в бургер-меню. Пары моделей
// объединены в одну строку, чтобы список был компактным и совпадал с тем,
// как покупатель выбирает линейку, а не с техническими названиями в прайсе.
export const SAMSUNG_PHONE_MENU_GROUPS = [
  { label: "Samsung Galaxy S26 Ultra", matches: has(/\bs26[-\s]*ultra\b/) },
  {
    label: "Samsung Galaxy S26/S26+",
    matches: (value) => /\bs26\+?(?=$|[-\s])/.test(value.toLowerCase()) && !/\bs26[-\s]*(?:ultra|fe)\b/.test(value.toLowerCase()),
  },
  { label: "Samsung Galaxy S26 FE", matches: has(/\bs26[-\s]*fe\b/) },
  { label: "Samsung Galaxy S25 Ultra", matches: has(/\bs25[-\s]*ultra\b/) },
  { label: "Samsung Galaxy S25 Edge", matches: has(/\bs25[-\s]*edge\b/) },
  {
    label: "Samsung Galaxy S25/S25+",
    matches: (value) => /\bs25\+?(?=$|[-\s])/.test(value.toLowerCase()) && !/\bs25[-\s]*(?:ultra|edge|fe)\b/.test(value.toLowerCase()),
  },
  { label: "Samsung Galaxy S25 FE", matches: has(/\bs25[-\s]*fe\b/) },
  { label: "Samsung Galaxy Z Fold8 Ultra", matches: has(/\b(?:z[-\s]*)?fold8[-\s]*ultra\b/) },
  {
    label: "Samsung Galaxy Z Fold8",
    matches: (value) => /\b(?:z[-\s]*)?fold8\b/.test(value.toLowerCase()) && !/fold8[-\s]*ultra/.test(value.toLowerCase()),
  },
  { label: "Samsung Galaxy Z Flip8", matches: has(/\b(?:z[-\s]*)?flip8\b/) },
  {
    label: "Samsung Galaxy Fold7/Flip7",
    matches: (value) => /\b(?:z[-\s]*)?(?:fold7|flip7)\b/.test(value.toLowerCase()) && !/flip7[-\s]*fe/.test(value.toLowerCase()),
  },
  { label: "Samsung Galaxy Z Flip7 FE", matches: has(/\b(?:z[-\s]*)?flip7[-\s]*fe\b/) },
  { label: "Samsung Galaxy A57", matches: has(/\ba57(?:[-\s]*5g)?\b/) },
  { label: "Samsung Galaxy A56", matches: has(/\ba56(?:[-\s]*5g)?\b/) },
  { label: "Samsung Galaxy A27/A37", matches: has(/\ba(?:27|37)(?:[-\s]*5g)?\b/) },
  { label: "Samsung Galaxy A26/A36", matches: has(/\ba(?:26|36)(?:[-\s]*5g)?\b/) },
  { label: "Samsung Galaxy A07/A17", matches: has(/\ba(?:07|17)(?:[-\s]*(?:4g|5g))?\b/) },
] as const satisfies readonly SamsungPhoneMenuGroup[];

export function getSamsungPhoneMenuGroup(name: string, slug: string): SamsungPhoneMenuGroup | null {
  const value = `${name} ${slug}`;
  return SAMSUNG_PHONE_MENU_GROUPS.find((group) => group.matches(value)) ?? null;
}

export function isAllowedSamsungPhone(name: string, slug: string): boolean {
  return getSamsungPhoneMenuGroup(name, slug) !== null;
}
