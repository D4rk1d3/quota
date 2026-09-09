-- Quota — test RLS riproducibili.
--
-- Dimostra che: anon non vede nulla; un utente authenticated con email
-- diversa da quella configurata non vede nulla; l'admin vede e scrive i
-- propri dati; il ledger (payments/coverage_allocations) resta immutabile
-- anche per l'admin (nessuna policy di UPDATE/DELETE).
--
-- Esecuzione: incolla in SQL Editor (Supabase Studio) oppure
--   psql "$DATABASE_URL" -f supabase/tests/rls.test.sql
-- Tutto gira in una transazione con ROLLBACK finale: nessuna riga persiste.

begin;

do $$
declare
  v_admin_email text;
  v_other_uid uuid := gen_random_uuid();
  v_admin_uid uuid;
  v_count integer;
  v_member_id uuid;
  v_payment_id uuid;
  v_void_id uuid;
  v_credit integer;
  v_fully_covered integer;
begin
  select email into v_admin_email from private.admin_config;
  if v_admin_email is null then
    raise exception 'setup: private.admin_config e'' vuota';
  end if;

  -- Usa un profilo admin gia' esistente (creato al primo login reale) cosi'
  -- da rispettare la FK profiles.id -> auth.users.id senza inserire righe
  -- fittizie in auth.users. Se il progetto e' del tutto vergine (nessun
  -- login ancora avvenuto) la sezione 4-6 viene saltata.
  select id into v_admin_uid from public.profiles where email = v_admin_email limit 1;

  -------------------------------------------------------------------------
  -- 1) anon: nessun accesso a nessuna tabella applicativa
  -------------------------------------------------------------------------
  set local role anon;
  reset request.jwt.claims;

  begin
    select count(*) into v_count from public.members;
    if v_count <> 0 then
      raise exception 'FAIL: anon vede % member(s), attesi 0', v_count;
    end if;
  exception when insufficient_privilege then
    -- anche un errore di privilegio e' un esito valido (nessun accesso)
    null;
  end;
  raise notice 'PASS: anon non vede members (RLS o grant negato)';

  -------------------------------------------------------------------------
  -- 2) authenticated ma email NON admin: nessun accesso
  -------------------------------------------------------------------------
  reset role;
  set local role authenticated;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_other_uid::text, 'email', 'intruso@example.com', 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_count from public.members;
  if v_count <> 0 then
    raise exception 'FAIL: utente non-admin vede % member(s), attesi 0', v_count;
  end if;
  raise notice 'PASS: utente authenticated non-admin non vede members';

  begin
    insert into public.members (name) values ('Intruso');
    raise exception 'FAIL: utente non-admin e'' riuscito a inserire un membro';
  exception when insufficient_privilege then
    raise notice 'PASS: utente non-admin non puo'' inserire membri';
  end;

  -------------------------------------------------------------------------
  -- 3) authenticated con email admin: accesso pieno ai propri dati
  -------------------------------------------------------------------------
  reset role;
  set local role authenticated;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_uid::text, 'email', v_admin_email, 'role', 'authenticated')::text,
    true
  );

  insert into public.members (name, monthly_share_cents) values ('Membro Test RLS', 350)
  returning id into v_member_id;
  raise notice 'PASS: admin puo'' inserire un membro (id=%)', v_member_id;

  select count(*) into v_count from public.members where id = v_member_id;
  if v_count <> 1 then
    raise exception 'FAIL: admin non rivede il membro appena creato';
  end if;
  raise notice 'PASS: admin rivede il membro appena creato';

  -------------------------------------------------------------------------
  -- 4) record_payment: transazione atomica payment + coverage_allocations
  --
  -- payments.created_by ha una FK verso profiles(id), che a sua volta ha
  -- una FK verso auth.users(id): serve percio' un profilo admin reale (nato
  -- dal primo login effettivo via magic link), non se ne puo' creare uno
  -- fittizio qui. Se il progetto e' vergine (nessun login ancora avvenuto)
  -- questa sezione viene saltata con una NOTICE.
  -------------------------------------------------------------------------
  if v_admin_uid is null then
    raise notice 'SKIP: nessun profilo admin reale trovato (nessun login ancora avvenuto) - salto i test su record_payment/void_payment';
    raise notice '--- TEST RLS DI BASE PASSATI (accesso anon/non-admin/admin) ---';
    return;
  end if;

  select (public.record_payment(v_member_id, 350, 'revolut', current_date, 'test RLS')).id into v_payment_id;

  select credit_cents, fully_covered_cycles into v_credit, v_fully_covered
  from public.member_coverage(v_member_id, current_date);

  if v_fully_covered <> 1 then
    raise exception 'FAIL: dopo un pagamento pieno fully_covered_cycles=% (atteso 1)', v_fully_covered;
  end if;
  raise notice 'PASS: record_payment alloca correttamente un ciclo pieno';

  -------------------------------------------------------------------------
  -- 5) payments/coverage_allocations sono immutabili: nessuna UPDATE/DELETE
  -------------------------------------------------------------------------
  begin
    update public.payments set note = 'modifica silenziosa' where id = v_payment_id;
    raise exception 'FAIL: e'' stato possibile fare UPDATE su payments (ledger non immutabile)';
  exception when insufficient_privilege then
    raise notice 'PASS: UPDATE su payments negato (nessun grant)';
  end;

  begin
    delete from public.payments where id = v_payment_id;
    raise exception 'FAIL: e'' stato possibile fare DELETE su payments (ledger non immutabile)';
  exception when insufficient_privilege then
    raise notice 'PASS: DELETE su payments negato (nessun grant)';
  end;

  -------------------------------------------------------------------------
  -- 6) void_payment: annullamento esplicito, mai modifica silenziosa
  -------------------------------------------------------------------------
  select (public.void_payment(v_payment_id, 'annullo per test RLS')).id into v_void_id;

  select credit_cents, fully_covered_cycles into v_credit, v_fully_covered
  from public.member_coverage(v_member_id, current_date);

  if v_fully_covered <> 0 then
    raise exception 'FAIL: dopo void_payment fully_covered_cycles=% (atteso 0)', v_fully_covered;
  end if;
  raise notice 'PASS: void_payment ripristina correttamente la copertura';

  select count(*) into v_count from public.payments where member_id = v_member_id;
  if v_count <> 2 then
    raise exception 'FAIL: attese 2 righe payments (payment+void), trovate %', v_count;
  end if;
  raise notice 'PASS: il ledger conserva sia il pagamento originale sia lo storno (audit trail)';

  raise notice '--- TUTTI I TEST RLS SONO PASSATI ---';
end $$;

rollback;
