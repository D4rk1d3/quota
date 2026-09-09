-- Quota — corregge un gap di sicurezza: Supabase concede di default privilegi
-- ALL (SELECT/INSERT/UPDATE/DELETE/...) al ruolo `authenticated` su ogni
-- tabella di public al momento della creazione del progetto. La migrazione
-- 20260909140200_rls.sql revocava ALL da `public` e `anon`, ma non da
-- `authenticated` (che ha un grant esplicito separato dal baseline PUBLIC):
-- di conseguenza l'admin poteva fare UPDATE/DELETE diretti su payments e
-- coverage_allocations, aggirando l'immutabilita' del ledger.
--
-- Qui si revoca tutto da `authenticated` e si ri-concedono SOLO i grant
-- puntuali gia' documentati in 20260909140200_rls.sql (nessuna policy e'
-- stata modificata: restano identiche).

revoke all on all tables in schema public from authenticated;
alter default privileges in schema public revoke all on tables from authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert on public.payments to authenticated;
grant select, insert on public.coverage_allocations to authenticated;
grant select, update, delete on public.notifications to authenticated;
