import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fingerprintQuery } from "./format";

const IdentifyInput = z.object({
  imageDataUrl: z.string().min(20).max(15_000_000),
});

const IdentifySchema = z.object({
  player: z.string().nullable(),
  year: z.string().nullable(),
  set_name: z.string().nullable(),
  card_number: z.string().nullable(),
  parallel: z.string().nullable(),
  grade: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable(),
});

export const identifyCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdentifyInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI key not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You identify sports trading cards from a single photo. Extract player name, year, set/brand (e.g. Topps Chrome, Panini Prizm), card number, parallel/variant (e.g. Silver, Refractor, Gold /10), and grading label (e.g. PSA 10, BGS 9.5, raw). Use null for any field you cannot determine. Respond with valid JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Identify this card and respond as JSON with this exact shape: {"player": string|null, "year": string|null, "set_name": string|null, "card_number": string|null, "parallel": string|null, "grade": string|null, "confidence": number 0-1, "notes": string|null}',
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit exceeded. Try again in a moment.");
    if (res.status === 402) throw new Error("Out of AI credits. Add credits in Workspace → Usage.");
    if (!res.ok) throw new Error(`AI gateway error (${res.status})`);

    const body = await res.json();
    const text: string = body.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = IdentifySchema.parse(JSON.parse(text));
    } catch {
      parsed = { player: null, year: null, set_name: null, card_number: null, parallel: null, grade: null, confidence: 0, notes: "Could not parse AI response" };
    }
    return { suggestion: parsed };
  });

function makeSlug(name: string) {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export const createCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        isPublic: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("collections")
      .insert({
        user_id: context.userId,
        name: data.name,
        description: data.description ?? null,
        is_public: data.isPublic,
        share_slug: data.isPublic ? makeSlug(data.name) : null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { collection: row };
  });

export const updateCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).nullable().optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const updates: {
      name?: string;
      description?: string | null;
      is_public?: boolean;
      share_slug?: string | null;
    } = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.isPublic !== undefined) {
      updates.is_public = data.isPublic;
      if (data.isPublic) {
        const { data: existing } = await context.supabase
          .from("collections")
          .select("share_slug, name")
          .eq("id", data.id)
          .single();
        if (existing && !existing.share_slug) {
          updates.share_slug = makeSlug(existing.name);
        }
      }
    }
    const { error } = await context.supabase.from("collections").update(updates).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCollections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: cols } = await context.supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (cols ?? []).map((c) => c.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const { data: owned } = await context.supabase
        .from("owned_cards")
        .select("collection_id")
        .in("collection_id", ids);
      counts = (owned ?? []).reduce<Record<string, number>>((acc, r) => {
        acc[r.collection_id] = (acc[r.collection_id] ?? 0) + 1;
        return acc;
      }, {});
    }
    return {
      collections: (cols ?? []).map((c) => ({ ...c, card_count: counts[c.id] ?? 0 })),
    };
  });

export const getCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: col, error } = await context.supabase
      .from("collections")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !col) throw new Error("Collection not found");
    const { data: cards } = await context.supabase
      .from("owned_cards")
      .select("*")
      .eq("collection_id", data.id)
      .order("created_at", { ascending: false });
    return { collection: col, cards: cards ?? [] };
  });

export const createOwnedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        collectionId: z.string().uuid(),
        displayTitle: z.string().min(1).max(250),
        player: z.string().max(120).nullable().optional(),
        year: z.string().max(20).nullable().optional(),
        setName: z.string().max(120).nullable().optional(),
        cardNumber: z.string().max(40).nullable().optional(),
        parallel: z.string().max(120).nullable().optional(),
        grade: z.string().max(40).nullable().optional(),
        condition: z.string().max(40).nullable().optional(),
        frontImagePath: z.string().max(500).nullable().optional(),
        backImagePath: z.string().max(500).nullable().optional(),
        purchasePriceCents: z.number().int().nonnegative().nullable().optional(),
        acquiredOn: z.string().nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const fingerprint = fingerprintQuery(data.displayTitle);
    const { data: row, error } = await context.supabase
      .from("owned_cards")
      .insert({
        user_id: context.userId,
        collection_id: data.collectionId,
        fingerprint,
        normalized_query: {},
        display_title: data.displayTitle,
        player: data.player ?? null,
        year: data.year ?? null,
        set_name: data.setName ?? null,
        card_number: data.cardNumber ?? null,
        parallel: data.parallel ?? null,
        grade: data.grade ?? null,
        condition: data.condition ?? null,
        front_image_path: data.frontImagePath ?? null,
        back_image_path: data.backImagePath ?? null,
        purchase_price_cents: data.purchasePriceCents ?? null,
        acquired_on: data.acquiredOn ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { card: row };
  });

export const updateOwnedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        displayTitle: z.string().min(1).max(250).optional(),
        condition: z.string().max(40).nullable().optional(),
        grade: z.string().max(40).nullable().optional(),
        purchasePriceCents: z.number().int().nonnegative().nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const updates: {
      display_title?: string;
      fingerprint?: string;
      condition?: string | null;
      grade?: string | null;
      purchase_price_cents?: number | null;
      notes?: string | null;
    } = {};
    if (data.displayTitle !== undefined) {
      updates.display_title = data.displayTitle;
      updates.fingerprint = fingerprintQuery(data.displayTitle);
    }
    if (data.condition !== undefined) updates.condition = data.condition;
    if (data.grade !== undefined) updates.grade = data.grade;
    if (data.purchasePriceCents !== undefined) updates.purchase_price_cents = data.purchasePriceCents;
    if (data.notes !== undefined) updates.notes = data.notes;
    const { error } = await context.supabase.from("owned_cards").update(updates).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const deleteOwnedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("owned_cards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOwnedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: card, error } = await context.supabase
      .from("owned_cards")
      .select("*, collections(name, is_public, share_slug)")
      .eq("id", data.id)
      .single();
    if (error || !card) throw new Error("Card not found");
    const { data: sales } = await context.supabase
      .from("card_sales")
      .select("*")
      .eq("fingerprint", card.fingerprint)
      .order("sold_at", { ascending: false, nullsFirst: false })
      .limit(50);
    return { card, sales: sales ?? [] };
  });

export const getEstimatedValues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ fingerprints: z.array(z.string()).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.fingerprints.length === 0) return { values: {} as Record<string, number | null> };
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await context.supabase
      .from("card_sales")
      .select("fingerprint, price_cents, sold_at")
      .in("fingerprint", data.fingerprints)
      .gte("sold_at", cutoff)
      .not("price_cents", "is", null);
    const groups: Record<string, number[]> = {};
    for (const r of rows ?? []) {
      if (r.price_cents == null) continue;
      (groups[r.fingerprint] ??= []).push(r.price_cents);
    }
    const values: Record<string, number | null> = {};
    for (const fp of data.fingerprints) {
      const arr = groups[fp];
      if (!arr || arr.length === 0) {
        values[fp] = null;
      } else {
        arr.sort((a, b) => a - b);
        values[fp] = arr[Math.floor(arr.length / 2)];
      }
    }
    return { values };
  });

export const signCardPhotoUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ paths: z.array(z.string().max(500)).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const urls: Record<string, string | null> = {};
    if (data.paths.length === 0) return { urls };
    const { data: signed } = await context.supabase.storage
      .from("card-photos")
      .createSignedUrls(data.paths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.path) urls[s.path] = s.signedUrl ?? null;
    }
    return { urls };
  });

export const getPublicCollection = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: col } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("share_slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (!col) throw new Error("Collection not found or not public");
    const { data: cards } = await supabaseAdmin
      .from("owned_cards")
      .select("*")
      .eq("collection_id", col.id)
      .order("created_at", { ascending: false });
    const paths = (cards ?? [])
      .map((c) => c.front_image_path)
      .filter((p): p is string => !!p);
    const urls: Record<string, string | null> = {};
    if (paths.length) {
      const { data: signed } = await supabaseAdmin.storage
        .from("card-photos")
        .createSignedUrls(paths, 60 * 60);
      for (const s of signed ?? []) {
        if (s.path) urls[s.path] = s.signedUrl ?? null;
      }
    }
    const { data: owner } = await supabaseAdmin
      .from("profiles")
      .select("display_name, verified_deals_count")
      .eq("id", col.user_id)
      .maybeSingle();
    return { collection: col, cards: cards ?? [], signedUrls: urls, owner };
  });
