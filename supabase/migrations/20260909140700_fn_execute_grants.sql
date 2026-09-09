-- Quota — revoca EXECUTE da PUBLIC (quindi anche da anon) sulle funzioni di
-- sola lettura: per default Postgres concede EXECUTE a PUBLIC su ogni nuova
-- funzione. Le tabelle sottostanti sono gia' protette da RLS/grant (anon
-- non ha alcun grant su public.*), ma e' comunque corretto restringere
-- anche l'EXECUTE: nessuna funzione deve essere chiamabile da anon.

revoke execute on function public.active_subscription() from public;
revoke execute on function public.billing_cycles(date, date) from public;
revoke execute on function public.fund_state(date) from public;
revoke execute on function public.member_coverage(uuid, date) from public;
revoke execute on function public.member_coverage_all(date) from public;
revoke execute on function public.members_to_follow_up(date) from public;
revoke execute on function public.set_updated_at() from public;

alter default privileges in schema public revoke execute on functions from public;
