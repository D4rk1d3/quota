-- Quota — job programmato: chiama l'Edge Function daily-notifications ogni
-- giorno alle 06:00 UTC (~08:00 Europe/Rome in inverno, 07:00-08:00 in
-- estate a seconda dell'ora legale) tramite pg_cron + pg_net.
--
-- La service_role key NON viene mai scritta in una migrazione (finirebbe
-- nel controllo versione). Va salvata una sola volta in Supabase Vault
-- dall'admin, dopo il primo deploy:
--
--   select vault.create_secret(
--     '<service_role key da Project Settings > API>',
--     'quota_service_role_key'
--   );
--
-- Finche' il secret non esiste, il job chiama comunque l'Edge Function ma
-- senza Authorization valida: la funzione rispondera' 401 senza alcun
-- effetto collaterale (nessuna notifica generata, nessun errore per il
-- resto del database).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'quota-daily-notifications',
    '0 6 * * *',
    $$
    select net.http_post(
      -- URL pubblico del progetto (non e' un segreto). Se si clona questa
      -- migrazione per un altro progetto Supabase, aggiornare il ref qui.
      url := 'https://npkcgyebqszcrrsqawnc.supabase.co/functions/v1/daily-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'quota_service_role_key'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
    $$
  )
where not exists (
  select 1 from cron.job where jobname = 'quota-daily-notifications'
);
