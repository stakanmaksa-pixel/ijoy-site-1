export function iphone18Availability(slug: string): string | undefined {
  return ["iphone-18-pro", "iphone-18-pro-max"].includes(slug) ? "В наличии с 23 сентября" : undefined;
}
