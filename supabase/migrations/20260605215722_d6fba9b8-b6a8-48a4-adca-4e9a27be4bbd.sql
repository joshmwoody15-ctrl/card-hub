
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  verified_deals_count integer not null default 0,
  completed_deals_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable to authenticated" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.tracked_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_query text not null,
  normalized_query jsonb not null default '{}'::jsonb,
  fingerprint text not null,
  display_title text,
  created_at timestamptz not null default now()
);
create index tracked_cards_user_idx on public.tracked_cards (user_id);
create unique index tracked_cards_user_fp on public.tracked_cards(user_id, fingerprint);
grant select, insert, update, delete on public.tracked_cards to authenticated;
grant all on public.tracked_cards to service_role;
alter table public.tracked_cards enable row level security;
create policy "own tracked_cards" on public.tracked_cards for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.card_sales (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  source text not null,
  title text,
  price_cents integer,
  currency text default 'USD',
  sold_at timestamptz,
  url text,
  image_url text,
  grade text,
  raw jsonb,
  fetched_at timestamptz not null default now()
);
create index card_sales_fp_source_idx on public.card_sales(fingerprint, source);
create index card_sales_sold_at_idx on public.card_sales(sold_at desc);
grant select on public.card_sales to authenticated;
grant all on public.card_sales to service_role;
alter table public.card_sales enable row level security;
create policy "authenticated read sales" on public.card_sales for select to authenticated using (true);

create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracked_card_id uuid references public.tracked_cards(id) on delete cascade,
  fingerprint text not null,
  direction text not null check (direction in ('above','below')),
  threshold_cents integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index price_alerts_user_idx on public.price_alerts(user_id);
grant select, insert, update, delete on public.price_alerts to authenticated;
grant all on public.price_alerts to service_role;
alter table public.price_alerts enable row level security;
create policy "own alerts" on public.price_alerts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.price_alerts(id) on delete cascade,
  user_id uuid not null,
  triggered_price_cents integer not null,
  triggered_at timestamptz not null default now(),
  sale_url text
);
create index alert_events_user_idx on public.alert_events(user_id);
grant select on public.alert_events to authenticated;
grant all on public.alert_events to service_role;
alter table public.alert_events enable row level security;
create policy "own alert events" on public.alert_events for select to authenticated using (auth.uid() = user_id);

create table public.cash_deals (
  id uuid primary key default gen_random_uuid(),
  card_fingerprint text not null,
  normalized_query jsonb not null default '{}'::jsonb,
  display_title text not null,
  price_cents integer not null check (price_cents > 0),
  sale_date date not null,
  initiator_id uuid not null references auth.users(id) on delete cascade,
  initiator_role text not null check (initiator_role in ('buyer','seller')),
  counterparty_id uuid references auth.users(id) on delete set null,
  counterparty_email text,
  status text not null default 'pending_counterparty' check (status in ('draft','pending_counterparty','approved','disputed','cancelled','expired')),
  notes text,
  claim_token text unique,
  approved_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cash_deals_initiator_idx on public.cash_deals(initiator_id);
create index cash_deals_counterparty_idx on public.cash_deals(counterparty_id);
create index cash_deals_fp_idx on public.cash_deals(card_fingerprint);
create index cash_deals_status_idx on public.cash_deals(status);
grant select, insert, update on public.cash_deals to authenticated;
grant all on public.cash_deals to service_role;
alter table public.cash_deals enable row level security;
create policy "view own deals" on public.cash_deals for select to authenticated
  using (auth.uid() = initiator_id or auth.uid() = counterparty_id or status = 'approved');
create policy "create own deals" on public.cash_deals for insert to authenticated
  with check (auth.uid() = initiator_id);
create policy "update own deals" on public.cash_deals for update to authenticated
  using (auth.uid() = initiator_id or auth.uid() = counterparty_id);

create table public.cash_deal_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.cash_deals(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index cash_deal_events_deal_idx on public.cash_deal_events(deal_id);
grant select, insert on public.cash_deal_events to authenticated;
grant all on public.cash_deal_events to service_role;
alter table public.cash_deal_events enable row level security;
create policy "view deal events when party" on public.cash_deal_events for select to authenticated
  using (exists (select 1 from public.cash_deals d where d.id = deal_id and (d.initiator_id = auth.uid() or d.counterparty_id = auth.uid())));
create policy "insert deal events when party" on public.cash_deal_events for insert to authenticated
  with check (exists (select 1 from public.cash_deals d where d.id = deal_id and (d.initiator_id = auth.uid() or d.counterparty_id = auth.uid())));
