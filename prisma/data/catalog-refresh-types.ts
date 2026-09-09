export type RefreshVariant = { memory: string | null; color: string | null; region: string | null; image: string; images?: string[] };
export type RefreshProduct = {
  slug: string; name: string; brand: string; category: "telefony" | "planshety" | "chasy";
  description: string; highlights: string[]; specs: Record<string, string>;
  sources: string[]; variants: RefreshVariant[]; aliases?: string[];
};
