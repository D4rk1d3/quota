-- Quota — Row Level Security e grant minimi
--
-- Principio: revoke ALL di default, poi grant puntuali per ruolo/comando,
-- con RLS sempre abilitata + FORCE (si applica anche al proprietario tabella).
-- `payments` e `coverage_allocations` non hanno alcuna policy/grant di
-- UPDATE/DELETE: sono immutabili per costruzione, non solo per convenzione.

-- ---------------------------------------------------------------------------
-- Revoca globale di partenza
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from public, anon;
alter default privileges in schema public revoke all on tables from public;

-- anon non deve avere nulla in questo progetto (nessun accesso pubblico)
revoke all on schema public from anon;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

grant select, update on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() and private.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() and private.is_admin())
  with check (id = auth.uid() and private.is_admin());

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------

alter table public.members enable row level security;
alter table public.members force row level security;

grant select, insert, update, delete on public.members to authenticated;

create policy members_select on public.members
  for select to authenticated
  using (private.is_admin());

create policy members_insert on public.members
  for insert to authenticated
  with check (private.is_admin());

create policy members_update on public.members
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy members_delete on public.members
  for delete to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

grant select, insert, update on public.subscriptions to authenticated;

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (private.is_admin());

create policy subscriptions_insert on public.subscriptions
  for insert to authenticated
  with check (private.is_admin());

create policy subscriptions_update on public.subscriptions
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- payments — SOLO select + insert. Nessun grant update/delete: immutabile.
-- ---------------------------------------------------------------------------

alter table public.payments enable row level security;
alter table public.payments force row level security;

grant select, insert on public.payments to authenticated;

create policy payments_select on public.payments
  for select to authenticated
  using (private.is_admin());

create policy payments_insert on public.payments
  for insert to authenticated
  with check (private.is_admin() and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- coverage_allocations — SOLO select + insert, stessa logica di payments.
-- ---------------------------------------------------------------------------

alter table public.coverage_allocations enable row level security;
alter table public.coverage_allocations force row level security;

grant select, insert on public.coverage_allocations to authenticated;

create policy coverage_allocations_select on public.coverage_allocations
  for select to authenticated
  using (private.is_admin());

create policy coverage_allocations_insert on public.coverage_allocations
  for insert to authenticated
  with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- notifications — l'admin legge, segna come lette, elimina; l'inserimento
-- e' riservato al job schedulato (service_role, che ha sempre bypassrls).
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.notifications force row level security;

grant select, update, delete on public.notifications to authenticated;

create policy notifications_select on public.notifications
  for select to authenticated
  using (private.is_admin());

create policy notifications_update on public.notifications
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy notifications_delete on public.notifications
  for delete to authenticated
  using (private.is_admin());
