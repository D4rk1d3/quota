-- Quota — valori iniziali del piano Spotify Family
--
-- 20,99 € = 2099 centesimi, addebito il giorno 5, quota 3,50 € = 350
-- centesimi per 6 membri. start_date e' il primo ciclo di fatturazione da
-- cui viene calcolato tutto il calendario derivato.

insert into public.subscriptions (
  name, monthly_cost_cents, billing_day, member_quota_cents, member_count, start_date, active
) values (
  'Spotify Family', 2099, 5, 350, 6, date_trunc('month', current_date)::date + 4, true
);
