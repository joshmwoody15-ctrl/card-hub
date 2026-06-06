import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCollection, getEstimatedValues, signCardPhotoUrls, updateCollection } from "@/lib/collection.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CollectionCard } from "@/components/CollectionCard";
import { formatPrice } from "@/lib/format";
import { ScanLine, Share2, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/collection/$id")({
  head: () => ({ meta: [{ title: "Folder · Card Hub" }] }),
  component: FolderPage,
});

function FolderPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getCollection);
  const valuesFn = useServerFn(getEstimatedValues);
  const signFn = useServerFn(signCardPhotoUrls);
  const updateFn = useServerFn(updateCollection);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const fingerprints = useMemo(() => Array.from(new Set((data?.cards ?? []).map((c) => c.fingerprint))), [data]);
  const paths = useMemo(() => (data?.cards ?? []).map((c) => c.front_image_path).filter((p): p is string => !!p), [data]);

  const { data: values } = useQuery({
    queryKey: ["estimates", fingerprints],
    queryFn: () => valuesFn({ data: { fingerprints } }),
    enabled: fingerprints.length > 0,
  });
  const { data: signed } = useQuery({
    queryKey: ["signed-urls", paths],
    queryFn: () => signFn({ data: { paths } }),
    enabled: paths.length > 0,
  });

  const cards = data?.cards ?? [];
  const collection = data?.collection;
  const total = useMemo(() => {
    if (!values) return null;
    return cards.reduce((sum, c) => sum + (values.values[c.fingerprint] ?? 0), 0);
  }, [cards, values]);

  const [updating, setUpdating] = useState(false);
  async function togglePublic(v: boolean) {
    if (!collection) return;
    setUpdating(true);
    try {
      await updateFn({ data: { id: collection.id, isPublic: v } });
      toast.success(v ? "Folder is now public" : "Folder is now private");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  function copyShare() {
    if (!collection?.share_slug) return;
    const url = `${window.location.origin}/u/${collection.share_slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>;
  if (!collection) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/collection" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3 w-3" /> All folders
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Folder</div>
          <h1 className="font-display text-4xl md:text-5xl">{collection.name}</h1>
          {collection.description && <p className="mt-2 max-w-2xl text-muted-foreground">{collection.description}</p>}
        </div>
        <Button asChild>
          <Link to="/collection/scan" search={{ collectionId: collection.id }}>
            <ScanLine className="mr-2 h-4 w-4" />Scan card
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Cards" value={String(cards.length)} />
        <Stat label="Total est. value" value={total == null ? "Calculating…" : formatPrice(total)} accent />
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Sharing</div>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={collection.is_public} onCheckedChange={togglePublic} disabled={updating} />
              Public
            </label>
            {collection.is_public && collection.share_slug && (
              <Button size="sm" variant="outline" onClick={copyShare}>
                <Share2 className="mr-2 h-3 w-3" />Copy link
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-16 text-center">
            <p className="text-muted-foreground">No cards yet. Scan one to get started.</p>
            <Button asChild className="mt-4">
              <Link to="/collection/scan" search={{ collectionId: collection.id }}>
                <ScanLine className="mr-2 h-4 w-4" />Scan card
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => (
              <li key={c.id}>
                <CollectionCard
                  card={c}
                  imageUrl={c.front_image_path ? signed?.urls[c.front_image_path] ?? null : null}
                  estimatedValueCents={values?.values[c.fingerprint] ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl tabular ${accent ? "text-[var(--gold)]" : ""}`}>{value}</div>
    </div>
  );
}
