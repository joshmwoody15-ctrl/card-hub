export const MARKETPLACES = [
  { id: "ebay", name: "eBay", site: "ebay.com", color: "var(--chart-1)" },
  { id: "fanatics", name: "Fanatics Collect", site: "collect.fanatics.com", color: "var(--chart-2)" },
  { id: "beckett", name: "Beckett", site: "marketplace.beckett.com", color: "var(--chart-3)" },
  { id: "comc", name: "COMC", site: "comc.com", color: "var(--chart-4)" },
  { id: "whatnot", name: "Whatnot", site: "whatnot.com", color: "var(--chart-5)" },
  { id: "sportlots", name: "Sportlots", site: "sportlots.com", color: "var(--gold)" },
  { id: "myslabs", name: "MySlabs", site: "myslabs.com", color: "var(--primary)" },
  { id: "collx", name: "CollX", site: "app.collx.com", color: "var(--verified)" },
] as const;

export type MarketplaceId = (typeof MARKETPLACES)[number]["id"];

export function marketplaceLabel(id: string) {
  return MARKETPLACES.find((m) => m.id === id)?.name ?? id;
}
