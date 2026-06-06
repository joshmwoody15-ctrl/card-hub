import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAlerts, deleteAlert } from "@/lib/cards.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts · Card Hub" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const listFn = useServerFn(listAlerts);
  const delFn = useServerFn(deleteAlert);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["alerts"], queryFn: () => listFn() });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Alerts</div>
      <h1 className="font-display text-4xl md:text-5xl">Tell us when to ping.</h1>
      <p className="mt-2 text-muted-foreground">Get notified the moment a card crosses your threshold on any marketplace.</p>

      <div className="mt-8">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          (data?.alerts ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              No alerts yet. Run a search and tap “Set alert.”
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {data!.alerts.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div>
                    <p className="font-medium">{a.tracked_cards?.display_title ?? a.fingerprint}</p>
                    <p className="text-xs text-muted-foreground tabular">
                      Notify when sale is <span className="text-foreground">{a.direction}</span>{" "}
                      <span className="font-mono">{formatPrice(a.threshold_cents)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.active ? "default" : "outline"}>{a.active ? "Active" : "Off"}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => delMut.mutate(a.id)}>
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
