-- Preavviso (in giorni) delle notifiche di rinnovo, scelto dall'utente.
alter table public.profiles
  add column if not exists notify_days_before integer not null default 3
  check (notify_days_before between 0 and 14);
