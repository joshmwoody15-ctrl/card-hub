import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCollections, createCollection, deleteCollection } from "@/lib/collection.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Camera, Folder, Plus, Trash2, ExternalLink, ScanLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/collection")({
  head: () => ({ meta: [{ title: "Collection · Card Hub" }] }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const listFn = useServerFn(listCollections);
  const createFn = useServerFn(createCollection);
  const deleteFn = useServerFn(deleteCollection);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["collections"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPublic: false });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Collection created");
      setOpen(false);
      setForm({ name: "", description: "", isPublic: false });
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });

  const collections = data?.collections ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Collection</div>
          <h1 className="font-display text-4xl md:text-5xl">Your card vault.</h1>
          <p className="mt-2 text-muted-foreground">Scan cards, organize into folders, watch values move.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/collection/scan"><ScanLine className="mr-2 h-4 w-4" />Scan a card</Link>
          </Button>
          <Button onClick={() => setOpen(!open)}>
            <Plus className="mr-2 h-4 w-4" />New folder
          </Button>
        </div>
      </div>

      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
          className="mt-6 rounded-lg border border-border bg-card p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Folder name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="PC Jordans" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea rows={1} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
              <span>Public — anyone with the link can view</span>
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>Create folder</Button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : collections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-16 text-center">
            <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No folders yet. Create one to start scanning.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <li key={c.id} className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <Link to="/collection/$id" params={{ id: c.id }} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-[var(--gold)]" />
                      <h2 className="font-display text-lg truncate">{c.name}</h2>
                    </div>
                    {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground tabular">
                      <span>{c.card_count} card{c.card_count === 1 ? "" : "s"}</span>
                      {c.is_public && <span className="rounded-sm bg-[var(--verified)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--verified)]">Public</span>}
                    </div>
                  </Link>
                  <div className="flex flex-col gap-1">
                    {c.is_public && c.share_slug && (
                      <a
                        href={`/u/${c.share_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Open public page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => { if (confirm(`Delete "${c.name}" and all its cards?`)) deleteMut.mutate(c.id); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
