-- Quota — blocca il search_path di tutte le funzioni applicative
-- (richiesto dal linter di sicurezza Supabase: previene hijacking via
-- search_path mutabile anche per le funzioni SECURITY INVOKER).

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.active_subscription() set search_path = public, pg_temp;
alter function public.billing_cycles(date, date) set search_path = public, pg_temp;
alter function public.member_coverage(uuid, date) set search_path = public, pg_temp;
alter function public.member_coverage_all(date) set search_path = public, pg_temp;
alter function public.members_to_follow_up(date) set search_path = public, pg_temp;
alter function public.fund_state(date) set search_path = public, pg_temp;
alter function public.record_payment(uuid, integer, public.payment_method, date, text) set search_path = public, pg_temp;
alter function public.void_payment(uuid, text) set search_path = public, pg_temp;
alter function public.adjust_payment(uuid, integer, text) set search_path = public, pg_temp;
