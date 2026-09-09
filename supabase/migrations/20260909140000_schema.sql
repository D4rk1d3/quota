-- Quota — schema di base
-- Enum, tabelle, indici e trigger updated_at. Nessuna RLS qui (vedi 20260909140200_rls.sql).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.payment_method as enum (
  'bonifico',
  'revolut',
  'trade_republic',
  'contanti',
  'satispay'
);

create type public.payment_kind as enum (
  'payment',
  'void',
  'adjustment'
);

create type public.notification_type as enum (
  'charge_reminder_3d',
  'charge_due',
  'member_uncovered',
  'coverage_ending_soon'
);

-- ---------------------------------------------------------------------------
-- Funzione generica per updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — un solo amministratore, 1:1 con auth.users
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- members — i sei partecipanti alla quota (non hanno un account)
-- ---------------------------------------------------------------------------

create table public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  email text,
  color text not null default '#5B8F6F',
  monthly_share_cents integer not null default 350 check (monthly_share_cents > 0),
  joined_at date not null default current_date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_active_idx on public.members (active);

create trigger members_set_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions — piano Spotify Family (storicizzabile, una sola riga attiva)
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Spotify Family',
  monthly_cost_cents integer not null check (monthly_cost_cents > 0),
  billing_day smallint not null check (billing_day between 1 and 28),
  member_quota_cents integer not null check (member_quota_cents > 0),
  member_count smallint not null check (member_count > 0),
  start_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una sola sottoscrizione attiva alla volta
create unique index subscriptions_single_active_idx
  on public.subscriptions ((active))
  where active;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payments — ledger immutabile (solo INSERT/SELECT, mai UPDATE/DELETE)
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete restrict,
  amount_cents integer not null,
  kind public.payment_kind not null default 'payment',
  method public.payment_method,
  paid_at date not null default current_date,
  note text,
  voids_payment_id uuid references public.payments (id),
  adjusts_payment_id uuid references public.payments (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint payments_amount_not_zero check (amount_cents <> 0),
  constraint payments_kind_payment_shape check (
    kind <> 'payment'
    or (amount_cents > 0 and method is not null and voids_payment_id is null and adjusts_payment_id is null)
  ),
  constraint payments_kind_void_shape check (
    kind <> 'void'
    or (voids_payment_id is not null and adjusts_payment_id is null and note is not null)
  ),
  constraint payments_kind_adjustment_shape check (
    kind <> 'adjustment'
    or (adjusts_payment_id is not null and voids_payment_id is null and note is not null)
  )
);

create index payments_member_paid_at_idx on public.payments (member_id, paid_at desc);
create index payments_voids_idx on public.payments (voids_payment_id) where voids_payment_id is not null;
create index payments_adjusts_idx on public.payments (adjusts_payment_id) where adjusts_payment_id is not null;
create index payments_created_at_idx on public.payments (created_at desc);

-- Un pagamento puo' essere annullato una sola volta
create unique index payments_voids_payment_id_unique
  on public.payments (voids_payment_id)
  where voids_payment_id is not null;

-- ---------------------------------------------------------------------------
-- coverage_allocations — allocazione immutabile di un pagamento su uno o piu'
-- cicli mensili. Righe negative usate per riportare indietro un void/rettifica.
-- ---------------------------------------------------------------------------

create table public.coverage_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete restrict,
  member_id uuid not null references public.members (id) on delete restrict,
  cycle_date date not null,
  amount_cents integer not null check (amount_cents <> 0),
  created_at timestamptz not null default now(),
  unique (payment_id, cycle_date)
);

create index coverage_allocations_member_cycle_idx
  on public.coverage_allocations (member_id, cycle_date);
create index coverage_allocations_payment_idx
  on public.coverage_allocations (payment_id);

-- ---------------------------------------------------------------------------
-- notifications — generate dal job giornaliero (in-app + traccia invio email)
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type public.notification_type not null,
  member_id uuid references public.members (id) on delete cascade,
  cycle_date date,
  title text not null,
  body text not null,
  idempotency_key text not null unique,
  in_app_read_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_type_created_idx on public.notifications (type, created_at desc);
create index notifications_unread_idx on public.notifications (in_app_read_at) where in_app_read_at is null;
