-- Quota — correzioni di performance segnalate dal linter Supabase:
--   * indici mancanti su due foreign key;
--   * auth.uid() chiamato direttamente nelle policy (rivalutato per ogni
--     riga) invece che come sotto-select scalare (valutato una sola volta
--     per statement). Nessuna modifica di comportamento, solo di piano di
--     esecuzione.

create index if not exists notifications_member_id_idx on public.notifications (member_id);
create index if not exists payments_created_by_idx on public.payments (created_by);

drop policy profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) and private.is_admin());

drop policy profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and private.is_admin())
  with check (id = (select auth.uid()) and private.is_admin());

drop policy payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert to authenticated
  with check (private.is_admin() and created_by = (select auth.uid()));
