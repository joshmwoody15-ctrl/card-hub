import { Badge } from "./ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import { marketplaceLabel } from "@/lib/marketplaces";
import { ExternalLink } from "lucide-react";

type Sale = {
  id: string;
  source: string;
  title: string | null;
  price_cents: number | null;
  url: string | null;
  sold_at: string | null;
  grade: string | null;
};

export function SalesTable({ sales }: { sales: Sale[] }) {
  if (sales.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        No sales found. Try a different query.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Source</th>
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-left font-medium">Sold</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-t border-border hover:bg-accent/30">
              <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-[10px] uppercase">{marketplaceLabel(s.source)}</Badge></td>
              <td className="max-w-md truncate px-4 py-3">{s.title}{s.grade && <span className="ml-2 text-xs text-[var(--gold)]">{s.grade}</span>}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold tabular">{formatPrice(s.price_cents)}</td>
              <td className="px-4 py-3 text-muted-foreground tabular">{formatDate(s.sold_at)}</td>
              <td className="px-4 py-3 text-right">
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
