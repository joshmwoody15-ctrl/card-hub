import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOwnedCard, deleteOwnedCard, signCardPhotoUrls } from "@/lib/collection.functions";
import { Button } from "@/components/ui/button";
import { PriceChart } from "@/components/PriceChart";
import { SalesTable } from "@/components/SalesTable";
import { formatDate, formatPrice } from "@/lib/format";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/collection/card/$cardId")({
  head: () => ({ meta: [{ title: "Card · Card Hub" }] }),
  component: CardDetailPage,
});

function CardDetailPage() {
  const { cardId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getOwnedCard);
  const delFn = useServerFn(deleteOwnedCard);
  const signFn = useServerFn(signCardPhotoUrls);

  const { data, isLoading } = useQuery({
    queryKey: ["owned-card", cardId],
    queryFn: () => getFn({ data: { id: cardId } }),
  });

  const paths = useMemo(() => {
    if (!data?.card) return [];
    return [data.card.front_image_path, data.card.back_image_path].filter((p): p is string => !!p);
  }, [data]);
  const { data: signed } = useQuery({
    queryKey: ["signed", paths],
    queryFn: () => signFn({ data: { paths } }),
    enabled: paths.length > 0,
  });

  const delMut = useMutation({
    mutationFn: () => delFn({ data: { id: cardId } }),
    onSuccess: () => {
      toast.success("Card deleted");
      qc.invalidateQueries({ queryKey: ["collections"] });
      navigate({ to: "/collection" });
    },
  });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>;
  if (!data?.card) return null;

  const { card, sales } = data;
  const frontUrl = card.front_image_path ? signed?.urls[card.front_image_path] : null;
  const backUrl = card.back_image_path ? signed?.urls[card.back_image_path] : null;

  const recent = sales.filter((s) => s.sold_at && new Date(s.sold_at) > new Date(Date.now() - 30 * 24 * 3600 * 1000));
  const median = (() => {
    const arr = recent.map((s) => s.price_cents).filter((p): p is number => p != null).sort((a, b) => a - b);
    return arr.length ? arr[Math.floor(arr.length / 2)] : null;
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/collection/$id" params={{ id: card.collection_id }} className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3 w-3" /> {(card as { collections?: { name: string } }).collections?.name ?? "Folder"}
      </Link>

      <div className="mt-2 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-4">
          {frontUrl ? (
            <img src={frontUrl} alt={card.display_title} className="w-full rounded-lg border border-border bg-card object-cover" />
          ) : (
            <div className="aspect-[3/4] rounded-lg border border-dashed border-border bg-card" />
          )}
          {backUrl && <img src={backUrl} alt="back" className="w-full rounded-lg border border-border bg-card object-cover" />}
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Card</div>
          <h1 className="font-display text-4xl">{card.display_title}</h1>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Row label="Player" value={card.player} />
            <Row label="Year" value={card.year} />
            <Row label="Set" value={card.set_name} />
            <Row label="Number" value={card.card_number} />
            <Row label="Parallel" value={card.parallel} />
            <Row label="Grade" value={card.grade} />
            <Row label="Condition" value={card.condition} />
            <Row label="Acquired" value={card.acquired_on ? formatDate(card.acquired_on) : null} />
            <Row label="Paid" value={card.purchase_price_cents != null ? formatPrice(card.purchase_price_cents) : null} />
            <Row label="Est. value (30d median)" value={median != null ? formatPrice(median) : "No comps"} accent />
          </dl>

          {card.notes && <p className="mt-6 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">{card.notes}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => { if (confirm("Delete this card?")) delMut.mutate(); }}>
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
          </div>

        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl">Market trend</h2>
        <div className="mt-4">
          <PriceChart
            data={sales
              .filter((s) => s.sold_at && s.price_cents != null)
              .map((s) => ({ date: s.sold_at!, price: (s.price_cents ?? 0) / 100, source: s.source }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          />
        </div>
      </div>


      <div className="mt-12">
        <h2 className="font-display text-2xl">Recent comps</h2>
        <div className="mt-4">
          <SalesTable sales={sales} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string | null | undefined; accent?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-display text-[var(--gold)] tabular" : "tabular"}>{value || "—"}</dd>
    </>
  );
}
