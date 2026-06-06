# Card Hub — Scan & Collection Feature

Add a personal card collection users build by photographing cards. Lovable AI suggests identification details, the user confirms, and the card is saved into their collection with an estimated market value.

## On portability / export

Worth knowing: nothing about this feature locks you in. Lovable Cloud is just managed Supabase (open source Postgres + storage + auth). The whole codebase, schema migrations under `supabase/migrations/`, and your data can be exported and re-pointed at any Supabase instance (self-hosted or Supabase.com) by swapping `VITE_SUPABASE_URL` and the publishable key. Card photos are stored in Supabase Storage and can be bulk-downloaded. We'll keep using standard Postgres + Supabase APIs (no Lovable-proprietary tables) so export stays a config change, not a rewrite.

## Scope

1. **Scan flow**
   - Upload from file OR capture from camera (mobile + desktop webcam via `<input type="file" accept="image/*" capture="environment">`).
   - Front + optional back image.
   - Image uploaded to a new `card-photos` storage bucket (private, user-scoped folder).
   - `identifyCard` server function sends the front image to Lovable AI (`google/gemini-2.5-flash` vision) with a structured-output schema returning: `player`, `year`, `set`, `card_number`, `parallel`, `grade_label`, `confidence`.
   - User sees a pre-filled review form, edits any field, then saves.

2. **Collection model**
   - `collections` table — user folders (name, description, is_public, share_slug).
   - `owned_cards` table — one row per physical card (collection_id, fingerprint, normalized fields, front/back image paths, condition, purchase_price_cents, notes).
   - Fingerprint reuses the same normalization used by search/watchlist so a card auto-links to its `card_sales` history → estimated value.

3. **Collection UI**
   - `/collection` — list of folders, total estimated value, total card count.
   - `/collection/$slug` — folder view with grid of card thumbnails, sortable by value/date added/player.
   - `/collection/card/$id` — single card detail: photos, identified attributes, mini PriceChart, "Recent comps" table, edit/delete, **"Start cash deal"** button (pre-fills `/deals/new` via query params: fingerprint, title, image).
   - `/u/$shareSlug` — public read-only folder view (no auth required) when `is_public = true`.

4. **Value calculation**
   - `estimated_value_cents` = median of last 30 days of `card_sales` for that fingerprint (computed on read via a Postgres view or server function — no stale denormalized field).
   - Folder/collection totals = sum across owned cards.

5. **Navigation**
   - Add "Collection" link to `SiteHeader` between Watchlist and Deals.
   - Landing page gets a new feature tile for scanning.

## Technical details

**New migration**
- `storage` bucket `card-photos` (private), with RLS: users can read/write only objects under `{auth.uid()}/...`.
- `public.collections` (id, user_id, name, description, is_public bool default false, share_slug text unique nullable, created_at, updated_at).
- `public.owned_cards` (id, user_id, collection_id fk, fingerprint, normalized_query jsonb, display_title, player, year, set_name, card_number, parallel, grade, condition, front_image_path, back_image_path, purchase_price_cents nullable, acquired_on date nullable, notes, created_at, updated_at).
- Indexes on `(user_id)`, `(collection_id)`, `(fingerprint)`.
- RLS:
  - `collections`: owner full access; `SELECT` allowed to anon/authenticated when `is_public = true` (for public share pages).
  - `owned_cards`: owner full access; `SELECT` allowed to anon/authenticated when the parent collection `is_public = true` (via `EXISTS` subquery).
- GRANTs: `authenticated` full CRUD on both; `anon` SELECT on both (RLS narrows to public rows); `service_role` ALL.

**New server functions** (`src/lib/collection.functions.ts`)
- `identifyCard({ imagePath })` — signed-URL read from storage, calls Lovable AI vision with Zod schema, returns suggested fields + confidence. Uses `requireSupabaseAuth`.
- `createOwnedCard(input)` — inserts row, recomputes fingerprint.
- `listCollections()`, `getCollection(id|slug)`, `listOwnedCards({ collectionId })`, `getOwnedCard(id)`, `updateOwnedCard`, `deleteOwnedCard`.
- `getEstimatedValue({ fingerprint })` — queries `card_sales` median (last 30d).
- `getPublicCollection({ slug })` — no auth middleware; reads through anon RLS.

**New routes**
- `src/routes/_authenticated/collection.tsx` (folder list)
- `src/routes/_authenticated/collection.$id.tsx` (folder detail)
- `src/routes/_authenticated/collection.scan.tsx` (scan + review flow)
- `src/routes/_authenticated/collection.card.$cardId.tsx` (card detail)
- `src/routes/u.$slug.tsx` (public folder, no auth gate)

**New components**
- `ScanCapture.tsx` — file/camera input, preview, upload progress.
- `CardIdentifyForm.tsx` — editable AI-suggested fields with confidence badges.
- `CollectionCard.tsx` — thumbnail tile with value chip.
- `CollectionStats.tsx` — total count + estimated value header.

**Cash Deal integration**
- `deals.new.tsx` accepts optional query params `fingerprint`, `title`, `image_url`, `owned_card_id` and pre-fills the form. Saving a deal stamps `owned_card_id` on the deal so the seller's collection card shows a "Listed in deal #..." badge.
- Add nullable `owned_card_id uuid` column to `cash_deals` (no FK constraint to keep export portable).

**Dependencies** — none new. Reuses `@/integrations/supabase/client`, existing AI gateway helper, existing `PriceChart`, `SalesTable`, `framer-motion`.

## Out of scope (this pass)
- Barcode/QR scanning of slab labels — AI vision is enough for v1.
- Bulk scan (multi-card per photo).
- Trade offers between users.
- CSV import/export of collection (easy follow-up; data is plain Postgres so `pg_dump` works today).