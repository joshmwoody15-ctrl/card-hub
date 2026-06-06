import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fingerprintQuery } from "./format";
import { scrapeAllMarketplaces } from "./firecrawl.server";
import { MARKETPLACES } from "./marketplaces";

const CACHE_HOURS = 6;

const SearchInput = z.object({ query: z.string().min(2).max(200) });

export const searchCardSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SearchInput.parse(data))
  .handler(async ({ data }) => {
    const fingerprint = fingerprintQuery(data.query);
    const cutoff = new Date(Date.now() - CACHE_HOURS * 3600 * 1000).toISOString();

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("card_sales")
      .select("*")
      .eq("fingerprint", fingerprint)
      .gte("fetched_at", cutoff)
      .order("sold_at", { ascending: false, nullsFirst: false });

    if (cached && cached.length > 0) {
      return { fingerprint, query: data.query, sales: cached, cached: true };
    }

    // Live scrape
    const scraped = await scrapeAllMarketplaces(data.query);
    const rows = scraped.flatMap(({ source, sales }) =>
      sales.map((s) => ({
        fingerprint,
        source,
        title: s.title,
        price_cents: s.priceCents,
        url: s.url,
        image_url: s.imageUrl ?? null,
        sold_at: s.soldAt ?? null,
        grade: s.grade ?? null,
      })),
    );

    if (rows.length > 0) {
      await supabaseAdmin.from("card_sales").insert(rows);
    }

    const { data: fresh } = await supabaseAdmin
      .from("card_sales")
      .select("*")
      .eq("fingerprint", fingerprint)
      .gte("fetched_at", cutoff)
      .order("sold_at", { ascending: false, nullsFirst: false });

    return {
      fingerprint,
      query: data.query,
      sales: fresh ?? [],
      cached: false,
      sourcesScanned: MARKETPLACES.length,
    };
  });

export const addToWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ query: z.string().min(2).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const fingerprint = fingerprintQuery(data.query);
    const { error } = await context.supabase.from("tracked_cards").upsert(
      {
        user_id: context.userId,
        raw_query: data.query,
        fingerprint,
        display_title: data.query,
        normalized_query: {},
      },
      { onConflict: "user_id,fingerprint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, fingerprint };
  });

export const removeFromWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("tracked_cards").delete().eq("id", data.id);
    return { ok: true };
  });

export const listWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("tracked_cards")
      .select("*")
      .order("created_at", { ascending: false });
    return { cards: data ?? [] };
  });

export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        fingerprint: z.string().min(1),
        trackedCardId: z.string().uuid().optional(),
        direction: z.enum(["above", "below"]),
        thresholdCents: z.number().int().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("price_alerts").insert({
      user_id: context.userId,
      tracked_card_id: data.trackedCardId ?? null,
      fingerprint: data.fingerprint,
      direction: data.direction,
      threshold_cents: data.thresholdCents,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("price_alerts")
      .select("*, tracked_cards(display_title)")
      .order("created_at", { ascending: false });
    return { alerts: data ?? [] };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("price_alerts").delete().eq("id", data.id);
    return { ok: true };
  });
