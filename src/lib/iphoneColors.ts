// Цвет → цвет кружка-образца для страницы сравнения (/compare). Названия —
// ровно то, что приходит из прайса и хранится в БД (см. live-pricelist-*.txt
// в prisma/data и getIphoneCompareLineup в catalog.ts). Оттенки подобраны
// вручную по официальным пресс-фото Apple — если появится цвет, которого
// нет в списке, кружок просто будет серым (см. fallback в CompareTable).
export const IPHONE_COLOR_SWATCHES: Record<string, string> = {
  Black: "#3b3c3e",
  Blue: "#3a5a8c",
  Desert: "#cbb493",
  Gold: "#f0e0c8",
  Gray: "#8f8f8c",
  Green: "#5c6d5c",
  Lavender: "#d6cbe0",
  Midnight: "#1c1c22",
  Natural: "#c8c2b6",
  Orange: "#d8613a",
  Pink: "#f2d1d6",
  Purple: "#6f6d84",
  Red: "#a02c33",
  Sage: "#a6ae9d",
  Silver: "#e5e5e6",
  "Soft Pink": "#f2d1d6",
  "Space Gray": "#54524f",
  Starlight: "#eee5d3",
  Teal: "#4f6a6a",
  Ultramarine: "#5b6fd0",
  White: "#f4f3ef",
  Yellow: "#e8d16a",
};

export function iphoneColorSwatch(color: string): string {
  return IPHONE_COLOR_SWATCHES[color] ?? "#d4d4d8";
}
