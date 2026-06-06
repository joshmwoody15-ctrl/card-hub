
-- collections
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  share_slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collections_user_idx ON public.collections(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own collections all" ON public.collections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public collections readable" ON public.collections
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- owned_cards
CREATE TABLE public.owned_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  normalized_query jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_title text NOT NULL,
  player text,
  year text,
  set_name text,
  card_number text,
  parallel text,
  grade text,
  condition text,
  front_image_path text,
  back_image_path text,
  purchase_price_cents integer,
  acquired_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX owned_cards_user_idx ON public.owned_cards(user_id);
CREATE INDEX owned_cards_collection_idx ON public.owned_cards(collection_id);
CREATE INDEX owned_cards_fingerprint_idx ON public.owned_cards(fingerprint);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owned_cards TO authenticated;
GRANT SELECT ON public.owned_cards TO anon;
GRANT ALL ON public.owned_cards TO service_role;

ALTER TABLE public.owned_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own owned_cards all" ON public.owned_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public owned_cards readable" ON public.owned_cards
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = owned_cards.collection_id AND c.is_public = true
  ));

-- updated_at trigger fn (shared)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_collections BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_owned_cards BEFORE UPDATE ON public.owned_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- link cash deals to a collection card (optional)
ALTER TABLE public.cash_deals ADD COLUMN owned_card_id uuid;
