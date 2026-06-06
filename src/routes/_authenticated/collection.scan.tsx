import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { identifyCard, createOwnedCard, listCollections } from "@/lib/collection.functions";
import { ScanCapture } from "@/components/ScanCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ collectionId: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/collection/scan")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Scan a card · Card Hub" }] }),
  component: ScanPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const identifyFn = useServerFn(identifyCard);
  const createFn = useServerFn(createOwnedCard);
  const listFn = useServerFn(listCollections);

  const { data: cols } = useQuery({ queryKey: ["collections"], queryFn: () => listFn() });
  const collections = cols?.collections ?? [];

  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [step, setStep] = useState<"capture" | "review">("capture");
  const [collectionId, setCollectionId] = useState<string>(search.collectionId ?? "");
  const [details, setDetails] = useState({
    displayTitle: "",
    player: "",
    year: "",
    setName: "",
    cardNumber: "",
    parallel: "",
    grade: "",
    condition: "",
    purchasePrice: "",
    acquiredOn: "",
    notes: "",
  });
  const [confidence, setConfidence] = useState<number | null>(null);

  const identifyMut = useMutation({
    mutationFn: async () => {
      if (!front) throw new Error("Add a front photo first");
      const dataUrl = await fileToDataUrl(front);
      return identifyFn({ data: { imageDataUrl: dataUrl } });
    },
    onSuccess: ({ suggestion }) => {
      const title = [suggestion.year, suggestion.set_name, suggestion.player, suggestion.card_number ? `#${suggestion.card_number}` : null, suggestion.parallel, suggestion.grade]
        .filter(Boolean)
        .join(" ");
      setDetails({
        displayTitle: title,
        player: suggestion.player ?? "",
        year: suggestion.year ?? "",
        setName: suggestion.set_name ?? "",
        cardNumber: suggestion.card_number ?? "",
        parallel: suggestion.parallel ?? "",
        grade: suggestion.grade ?? "",
        condition: "",
        purchasePrice: "",
        acquiredOn: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      setConfidence(suggestion.confidence);
      setStep("review");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadPhoto(file: File, side: "front" | "back") {
    if (!user) throw new Error("Not signed in");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}-${side}.${ext}`;
    const { error } = await supabase.storage.from("card-photos").upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    return path;
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!collectionId) throw new Error("Pick a folder");
      if (!details.displayTitle) throw new Error("Card title is required");
      const frontPath = front ? await uploadPhoto(front, "front") : null;
      const backPath = back ? await uploadPhoto(back, "back") : null;
      const result = await createFn({
        data: {
          collectionId,
          displayTitle: details.displayTitle,
          player: details.player || null,
          year: details.year || null,
          setName: details.setName || null,
          cardNumber: details.cardNumber || null,
          parallel: details.parallel || null,
          grade: details.grade || null,
          condition: details.condition || null,
          frontImagePath: frontPath,
          backImagePath: backPath,
          purchasePriceCents: details.purchasePrice ? Math.round(parseFloat(details.purchasePrice) * 100) : null,
          acquiredOn: details.acquiredOn || null,
          notes: details.notes || null,
        },
      });
      return result.card;
    },
    onSuccess: (card) => {
      toast.success("Card added to collection");
      navigate({ to: "/collection/card/$cardId", params: { cardId: card.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <button onClick={() => navigate({ to: "/collection" })} className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3 w-3" /> Collection
      </button>
      <div className="mt-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Scan</div>
        <h1 className="font-display text-4xl">Add a card.</h1>
        <p className="mt-2 text-muted-foreground">Snap a photo, Card Hub identifies it, you confirm the details.</p>
      </div>

      {step === "capture" ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ScanCapture label="Front (required)" value={front} onChange={setFront} />
            <ScanCapture label="Back (optional)" value={back} onChange={setBack} />
          </div>
          <Button
            size="lg"
            disabled={!front || identifyMut.isPending}
            onClick={() => identifyMut.mutate()}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {identifyMut.isPending ? "Identifying…" : "Identify with AI"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setDetails({ ...details, acquiredOn: new Date().toISOString().slice(0, 10) });
              setConfidence(null);
              setStep("review");
            }}
            className="block w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Skip AI and enter manually
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }}
          className="mt-8 space-y-5"
        >
          {confidence != null && (
            <div className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-3 text-sm">
              <span className="font-medium text-[var(--gold)]">AI suggestion · {Math.round(confidence * 100)}% confidence.</span>{" "}
              <span className="text-muted-foreground">Review every field and edit anything that's off.</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Folder</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger><SelectValue placeholder="Choose a folder…" /></SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {collections.length === 0 && (
              <p className="text-xs text-muted-foreground">No folders yet. <a className="underline" href="/collection">Create one</a>.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Card title</Label>
            <Input value={details.displayTitle} onChange={(e) => setDetails({ ...details, displayTitle: e.target.value })} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Player" value={details.player} onChange={(v) => setDetails({ ...details, player: v })} />
            <Field label="Year" value={details.year} onChange={(v) => setDetails({ ...details, year: v })} />
            <Field label="Set / brand" value={details.setName} onChange={(v) => setDetails({ ...details, setName: v })} />
            <Field label="Card number" value={details.cardNumber} onChange={(v) => setDetails({ ...details, cardNumber: v })} />
            <Field label="Parallel / variant" value={details.parallel} onChange={(v) => setDetails({ ...details, parallel: v })} />
            <Field label="Grade (PSA 10, raw, …)" value={details.grade} onChange={(v) => setDetails({ ...details, grade: v })} />
            <Field label="Condition" value={details.condition} onChange={(v) => setDetails({ ...details, condition: v })} placeholder="NM, EX, …" />
            <Field label="Purchase price (USD)" value={details.purchasePrice} onChange={(v) => setDetails({ ...details, purchasePrice: v })} type="number" placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label>Acquired on</Label>
            <Input type="date" value={details.acquiredOn} onChange={(e) => setDetails({ ...details, acquiredOn: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} rows={3} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep("capture")}>Back</Button>
            <Button type="submit" disabled={saveMut.isPending} className="flex-1">
              {saveMut.isPending ? "Saving…" : "Save to collection"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
