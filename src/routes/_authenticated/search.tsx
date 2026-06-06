import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchCardSales, addToWatchlist, createAlert } from "@/lib/cards.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SalesTable } from "@/components/SalesTable";
import { PriceChart } from "@/components/PriceChart";
import { MARKETPLACES } from "@/lib/marketplaces";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Bell, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search · Card Hub" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set(MARKETPLACES.map((m) => m.id)));

  const searchFn = useServerFn(searchCardSales);
  const watchFn = useServerFn(addToWatchlist);
  const alertFn = useServerFn(createAlert);

  const { data, isLoading } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => searchFn({ data: { query: submitted! } }),
    enabled: !!submitted,
  });

  const watchMut = useMutation({
    mutationFn: () => watchFn({ data: { query: submitted! } }),
    onSuccess: () => toast.success("Added to watchlist"),
    onError: (e: Error) => toast.error(e.message),
  });

  const sales = (data?.sales ?? []).filter((s) => activeSources.has(s.source));
  const prices = sales.filter((s) => s.price_cents).map((s) => s.price_cents!);
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  const chartData = sales
    .filter((s) => s.sold_at && s.price_cents)
    .map((s) => ({ date: s.sold_at!, price: s.price_cents! / 100 }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAlert = async () => {
    if (!data?.fingerprint || !avg) return;
    await alertFn({ data: { fingerprint: data.fingerprint, direction: "above", thresholdCents: Math.round(avg * 1.1) } });
    toast.success("Alert set at 10% above average");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Search</div>
      <h1 className="font-display text-4xl md:text-5xl">Find the comp.</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Enter a card — player, year, set, parallel, grade. We'll scan every connected marketplace.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (query.trim().length >= 2) setSubmitted(query.trim()); }}
        className="mt-6 flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 2003 Topps Chrome LeBron James RC PSA 10"
            className="h-12 pl-10 text-base"
          />
        </div>
        <Button type="submit" size="lg">Search</Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {MARKETPLACES.map((m) => {
          const on = activeSources.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => {
                const next = new Set(activeSources);
                if (on) next.delete(m.id); else next.add(m.id);
                setActiveSources(next);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-12 text-center text-sm text-muted-foreground">Scanning {MARKETPLACES.length} marketplaces…</div>
      )}

      {data && (
        <div className="mt-10 space-y-8">
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Sales found" value={String(sales.length)} />
            <Stat label="Average" value={formatPrice(avg)} />
            <Stat label="Low" value={formatPrice(min)} />
            <Stat label="High" value={formatPrice(max)} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Price trend</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => watchMut.mutate()}>
                <Bookmark className="mr-2 h-4 w-4" /> Watch
              </Button>
              <Button variant="outline" size="sm" onClick={handleAlert} disabled={!avg}>
                <Bell className="mr-2 h-4 w-4" /> Set alert
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <PriceChart data={chartData} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl">Recent sales</h2>
              {data.cached && <Badge variant="outline" className="text-xs">Cached</Badge>}
            </div>
            <SalesTable sales={sales} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular">{value}</div>
    </div>
  );
}
