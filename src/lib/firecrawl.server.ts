import Firecrawl from "@mendable/firecrawl-js";
import { MARKETPLACES, type MarketplaceId } from "./marketplaces";

export type ScrapedSale = {
  source: MarketplaceId;
  title: string;
  priceCents: number | null;
  url: string;
  imageUrl?: string;
  soldAt?: string | null;
  grade?: string | null;
};

function client() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
  return new Firecrawl({ apiKey });
}

// Lightweight extractor: parse a Firecrawl search/scrape markdown blob into sale-like rows
function parseRows(markdown: string, source: MarketplaceId, fallbackUrl: string): ScrapedSale[] {
  const rows: ScrapedSale[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const priceMatch = line.match(/\$\s?([\d,]+(?:\.\d{2})?)/);
    if (!priceMatch) continue;
    const priceCents = Math.round(parseFloat(priceMatch[1].replace(/,/g, "")) * 100);
    if (!priceCents || priceCents > 100_000_00) continue;
    const titleMatch = line.replace(priceMatch[0], "").replace(/^[-*#>\s]+/, "").trim();
    if (titleMatch.length < 8) continue;
    rows.push({
      source,
      title: titleMatch.slice(0, 180),
      priceCents,
      url: fallbackUrl,
      soldAt: null,
    });
    if (rows.length >= 12) break;
  }
  return rows;
}

export async function scrapeMarketplace(query: string, marketplace: MarketplaceId): Promise<ScrapedSale[]> {
  const meta = MARKETPLACES.find((m) => m.id === marketplace)!;
  const fc = client();
  try {
    const result: any = await fc.search(`${query} sold site:${meta.site}`, {
      limit: 8,
      scrapeOptions: { formats: ["markdown"] },
    });
    const items: any[] = result?.web ?? result?.data ?? [];
    const sales: ScrapedSale[] = [];
    for (const item of items) {
      const md: string = item.markdown ?? item.description ?? item.title ?? "";
      sales.push(...parseRows(md, marketplace, item.url ?? `https://${meta.site}`));
      if (sales.length >= 10) break;
    }
    return sales.slice(0, 10);
  } catch (err) {
    console.error(`[Firecrawl ${marketplace}]`, err);
    return [];
  }
}

export async function scrapeAllMarketplaces(query: string) {
  const results = await Promise.all(
    MARKETPLACES.map(async (m) => ({ source: m.id, sales: await scrapeMarketplace(query, m.id) })),
  );
  return results;
}
