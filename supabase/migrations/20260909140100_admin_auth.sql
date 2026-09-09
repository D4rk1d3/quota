-- Quota — accesso ristretto al solo amministratore configurato
--
-- Schema `private`: non e' incluso negli schema esposti da PostgREST
-- (di default solo `public`), quindi non e' raggiungibile via API REST.
-- Aggiungiamo comunque REVOKE espliciti per difesa in profondita'.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role;

-- Riga singola con l'indirizzo email autorizzato ad amministrare l'app.
create table private.admin_config (
  id boolean primary key default true,
  email text not null,
  constraint admin_config_singleton check (id),
  constraint admin_config_email_lower check (email = lower(email))
);

revoke all on private.admin_config from public, anon, authenticated;

-- Valore iniziale: unico amministratore autorizzato.
insert into private.admin_config (email) values ('trevisanpietro12@gmail.com');

-- ---------------------------------------------------------------------------
-- private.is_admin() — usata da tutte le policy RLS.
--
-- Giustificazione per SECURITY DEFINER (unica funzione privilegiata del
-- progetto): il ruolo `authenticated` non ha alcun grant su
-- `private.admin_config` (vedi REVOKE sopra), quindi senza definer rights
-- non potrebbe valutare la condizione. La funzione:
--   * vive in uno schema non esposto via API (`private`);
--   * ha search_path bloccato per evitare hijacking;
--   * non espone dati: restituisce solo un boolean;
--   * verifica sempre auth.role()/auth.email() della sessione chiamante,
--     non bypassa in alcun modo la RLS sulle tabelle applicative;
--   * l'EXECUTE e' concesso solo al ruolo `authenticated` (mai anon/public).
-- ---------------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = private, pg_temp
as $$
  select exists (
    select 1
    from private.admin_config c
    where auth.role() = 'authenticated'
      and auth.email() is not null
      and lower(auth.email()) = c.email
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- public.handle_new_auth_user() — trigger su auth.users.
--
-- Giustificazione per SECURITY DEFINER: i trigger su `auth.users` girano
-- necessariamente con i privilegi del definer per poter scrivere in
-- `public.profiles`; qui viene usata esclusivamente per (a) rifiutare la
-- creazione di qualunque utente la cui email non sia quella configurata in
-- private.admin_config, sollevando un'eccezione che fa fallire l'intera
-- transazione di signup, e (b) creare la riga di profilo per l'unico admin
-- legittimo. Nessun dato applicativo viene bypassato: la funzione tocca solo
-- auth.users/public.profiles.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_admin_email text;
begin
  select email into v_admin_email from private.admin_config;

  if v_admin_email is null or lower(new.email) <> v_admin_email then
    raise exception 'signup non consentito per %', new.email
      using errcode = '42501';
  end if;

  insert into public.profiles (id, email, display_name)
  values (new.id, lower(new.email), split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
