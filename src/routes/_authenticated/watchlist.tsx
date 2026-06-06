import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWatchlist, removeFromWatchlist } from "@/lib/cards.functions";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist · Card Hub" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const listFn = useServerFn(listWatchlist);
  const removeFn = useServerFn(removeFromWatchlist);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["watchlist"], queryFn: () => listFn() });
  const removeMut = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Watchlist</div>
      <h1 className="font-display text-4xl md:text-5xl">Cards you're tracking.</h1>
      <p className="mt-2 text-muted-foreground">Saved searches re-run nightly so you always have fresh comps.</p>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (data?.cards ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Nothing here yet.</p>
            <Button asChild className="mt-4"><Link to="/search">Find your first card</Link></Button>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {data!.cards.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.display_title || c.raw_query}</p>
                  <p className="text-xs text-muted-foreground tabular">Added {formatDate(c.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/search" search={{}}><ExternalLink className="mr-2 h-4 w-4" />Open</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeMut.mutate(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
