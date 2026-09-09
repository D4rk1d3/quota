-- Quota — funzioni di dominio (copertura, fondo, calendario derivato,
-- registrazione/annullamento/rettifica pagamenti).
--
-- Tutte in SECURITY INVOKER (default): girano con i privilegi e sotto la
-- RLS dell'utente chiamante. Nessuna di queste bypassa la sicurezza a
-- livello riga: sono "solo" query/transazioni incapsulate lato server.

-- ---------------------------------------------------------------------------
-- public.active_subscription() — piano Spotify correntemente attivo
-- ---------------------------------------------------------------------------

create or replace function public.active_subscription()
returns public.subscriptions
language sql
stable
as $$
  select * from public.subscriptions where active limit 1;
$$;

-- ---------------------------------------------------------------------------
-- public.billing_cycles(from, to) — calendario derivato delle scadenze
-- mensili Spotify, calcolato al volo dal giorno di addebito configurato.
-- Non esiste alcuna tabella "una riga per scadenza": e' sempre calcolato.
-- ---------------------------------------------------------------------------

create or replace function public.billing_cycles(p_from date, p_to date)
returns setof date
language plpgsql
stable
as $$
declare
  v_sub public.subscriptions;
  v_cycle date;
begin
  v_sub := public.active_subscription();
  if v_sub is null then
    return;
  end if;

  v_cycle := v_sub.start_date;
  while v_cycle < p_from loop
    v_cycle := v_cycle + interval '1 month';
  end loop;

  while v_cycle <= p_to loop
    return next v_cycle;
    v_cycle := v_cycle + interval '1 month';
  end loop;
end;
$$;

grant execute on function public.active_subscription() to authenticated;
grant execute on function public.billing_cycles(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- public.member_coverage(member_id, as_of) — credito, mesi coperti, data
-- "coperto fino al" per un singolo membro.
-- ---------------------------------------------------------------------------

create or replace function public.member_coverage(
  p_member_id uuid,
  p_as_of date default current_date
)
returns table (
  member_id uuid,
  credit_cents integer,
  fully_covered_cycles integer,
  covered_until date,
  is_overdue boolean
)
language plpgsql
stable
as $$
declare
  v_quota integer;
  v_sub public.subscriptions;
  v_cycle date;
  v_allocated integer;
  v_fully_covered integer := 0;
  v_guard integer := 0;
begin
  select monthly_share_cents into v_quota
  from public.members where id = p_member_id;

  if v_quota is null then
    raise exception 'membro % non trovato', p_member_id;
  end if;

  v_sub := public.active_subscription();
  if v_sub is null then
    raise exception 'nessun piano Spotify attivo configurato';
  end if;

  v_cycle := v_sub.start_date;

  loop
    select coalesce(sum(ca.amount_cents), 0) into v_allocated
    from public.coverage_allocations ca
    where ca.member_id = p_member_id and ca.cycle_date = v_cycle;

    exit when v_allocated < v_quota;

    v_fully_covered := v_fully_covered + 1;
    v_cycle := v_cycle + interval '1 month';

    v_guard := v_guard + 1;
    if v_guard > 2400 then
      raise exception 'member_coverage: troppi cicli, controllare start_date';
    end if;
  end loop;

  return query select
    p_member_id,
    greatest(v_allocated, 0),
    v_fully_covered,
    v_cycle,
    (v_cycle <= p_as_of);
end;
$$;

grant execute on function public.member_coverage(uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- public.member_coverage_all(as_of) — copertura per tutti i membri attivi,
-- pronta per la dashboard/lista membri.
-- ---------------------------------------------------------------------------

create or replace function public.member_coverage_all(p_as_of date default current_date)
returns table (
  member_id uuid,
  name text,
  color text,
  monthly_share_cents integer,
  active boolean,
  credit_cents integer,
  fully_covered_cycles integer,
  covered_until date,
  is_overdue boolean
)
language sql
stable
as $$
  select
    m.id,
    m.name,
    m.color,
    m.monthly_share_cents,
    m.active,
    mc.credit_cents,
    mc.fully_covered_cycles,
    mc.covered_until,
    mc.is_overdue
  from public.members m
  cross join lateral public.member_coverage(m.id, p_as_of) mc
  where m.active
  order by mc.is_overdue desc, mc.covered_until asc, m.name asc;
$$;

grant execute on function public.member_coverage_all(date) to authenticated;

-- ---------------------------------------------------------------------------
-- public.members_to_follow_up(as_of) — membri in ritardo o in scadenza
-- entro 7 giorni: quelli da sollecitare.
-- ---------------------------------------------------------------------------

create or replace function public.members_to_follow_up(p_as_of date default current_date)
returns table (
  member_id uuid,
  name text,
  reason text,
  covered_until date,
  days_until_due integer
)
language sql
stable
as $$
  select
    mc.member_id,
    mc.name,
    case when mc.is_overdue then 'in_ritardo' else 'in_scadenza' end,
    mc.covered_until,
    (mc.covered_until - p_as_of)::integer
  from public.member_coverage_all(p_as_of) mc
  where mc.is_overdue or (mc.covered_until - p_as_of) <= 7
  order by mc.covered_until asc;
$$;

grant execute on function public.members_to_follow_up(date) to authenticated;

-- ---------------------------------------------------------------------------
-- public.fund_state(as_of) — saldo del fondo Spotify e stato del ciclo
-- corrente.
-- ---------------------------------------------------------------------------

create or replace function public.fund_state(p_as_of date default current_date)
returns table (
  current_cycle_date date,
  balance_cents integer,
  collected_this_cycle_cents integer,
  expected_this_cycle_cents integer,
  to_recover_cents integer,
  members_in_good_standing integer,
  total_members integer
)
language plpgsql
stable
as $$
declare
  v_sub public.subscriptions;
  v_cycle date;
  v_next date;
  v_elapsed_cycles integer := 0;
  v_collected_elapsed integer;
  v_collected_current integer;
  v_expected integer;
  v_total_members integer;
  v_good_standing integer;
  v_guard integer := 0;
begin
  v_sub := public.active_subscription();
  if v_sub is null then
    raise exception 'nessun piano Spotify attivo configurato';
  end if;

  v_cycle := v_sub.start_date;
  v_next := v_cycle + interval '1 month';
  while v_next <= p_as_of loop
    v_cycle := v_next;
    v_next := v_next + interval '1 month';
    v_elapsed_cycles := v_elapsed_cycles + 1;
    v_guard := v_guard + 1;
    if v_guard > 2400 then
      raise exception 'fund_state: troppi cicli, controllare start_date';
    end if;
  end loop;
  v_elapsed_cycles := v_elapsed_cycles + 1; -- include il ciclo corrente v_cycle

  select coalesce(sum(ca.amount_cents), 0) into v_collected_elapsed
  from public.coverage_allocations ca
  where ca.cycle_date <= v_cycle;

  select coalesce(sum(ca.amount_cents), 0) into v_collected_current
  from public.coverage_allocations ca
  where ca.cycle_date = v_cycle;

  select coalesce(sum(m.monthly_share_cents), 0), count(*)
  into v_expected, v_total_members
  from public.members m
  where m.active;

  select count(*) into v_good_standing
  from public.member_coverage_all(p_as_of) mc
  where not mc.is_overdue;

  return query select
    v_cycle,
    v_collected_elapsed - (v_elapsed_cycles * v_sub.monthly_cost_cents),
    v_collected_current,
    v_expected,
    greatest(v_expected - v_collected_current, 0),
    v_good_standing,
    v_total_members;
end;
$$;

grant execute on function public.fund_state(date) to authenticated;

-- ---------------------------------------------------------------------------
-- public.record_payment(...) — inserisce un pagamento e alloca l'importo sui
-- cicli mensili in una singola transazione (atomica: e' una sola chiamata
-- RPC, quindi un solo statement lato client).
-- ---------------------------------------------------------------------------

create or replace function public.record_payment(
  p_member_id uuid,
  p_amount_cents integer,
  p_method public.payment_method,
  p_paid_at date default current_date,
  p_note text default null
)
returns public.payments
language plpgsql
as $$
declare
  v_payment public.payments;
  v_quota integer;
  v_sub public.subscriptions;
  v_cycle date;
  v_remaining integer := p_amount_cents;
  v_existing integer;
  v_to_allocate integer;
  v_guard integer := 0;
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount_cents deve essere positivo';
  end if;

  select monthly_share_cents into v_quota
  from public.members where id = p_member_id and active
  for update;

  if v_quota is null then
    raise exception 'membro % non trovato o non attivo', p_member_id;
  end if;

  v_sub := public.active_subscription();
  if v_sub is null then
    raise exception 'nessun piano Spotify attivo configurato';
  end if;

  insert into public.payments (member_id, amount_cents, kind, method, paid_at, note, created_by)
  values (p_member_id, p_amount_cents, 'payment', p_method, p_paid_at, p_note, auth.uid())
  returning * into v_payment;

  v_cycle := v_sub.start_date;
  while v_remaining > 0 loop
    select coalesce(sum(amount_cents), 0) into v_existing
    from public.coverage_allocations
    where member_id = p_member_id and cycle_date = v_cycle;

    if v_existing < v_quota then
      v_to_allocate := least(v_remaining, v_quota - v_existing);
      insert into public.coverage_allocations (payment_id, member_id, cycle_date, amount_cents)
      values (v_payment.id, p_member_id, v_cycle, v_to_allocate);
      v_remaining := v_remaining - v_to_allocate;
    end if;

    v_cycle := v_cycle + interval '1 month';

    v_guard := v_guard + 1;
    if v_guard > 2400 then
      raise exception 'record_payment: troppi cicli, controllare start_date';
    end if;
  end loop;

  return v_payment;
end;
$$;

revoke all on function public.record_payment(uuid, integer, public.payment_method, date, text) from public, anon;
grant execute on function public.record_payment(uuid, integer, public.payment_method, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- public.void_payment(payment_id, note) — annulla un pagamento esistente
-- registrando una riga di storno (mai una UPDATE/DELETE sul ledger).
-- ---------------------------------------------------------------------------

create or replace function public.void_payment(
  p_payment_id uuid,
  p_note text
)
returns public.payments
language plpgsql
as $$
declare
  v_original public.payments;
  v_void public.payments;
  v_alloc record;
begin
  if p_note is null or btrim(p_note) = '' then
    raise exception 'p_note e'' obbligatoria per annullare un pagamento';
  end if;

  -- Nessun "for update": payments non ha grant UPDATE per authenticated
  -- (ledger immutabile) e SELECT ... FOR UPDATE richiederebbe quel
  -- privilegio anche solo per il row-lock. L'unicita' e' comunque
  -- garantita dall'indice payments_voids_payment_id_unique (unico admin,
  -- concorrenza reale trascurabile).
  select * into v_original from public.payments where id = p_payment_id;
  if v_original is null then
    raise exception 'pagamento % non trovato', p_payment_id;
  end if;
  if v_original.kind <> 'payment' then
    raise exception 'si puo'' annullare solo un pagamento originale (kind=payment)';
  end if;
  if exists (select 1 from public.payments where voids_payment_id = p_payment_id) then
    raise exception 'il pagamento % e'' gia'' stato annullato', p_payment_id;
  end if;

  insert into public.payments (
    member_id, amount_cents, kind, method, paid_at, note, voids_payment_id, created_by
  ) values (
    v_original.member_id, -v_original.amount_cents, 'void', v_original.method,
    current_date, p_note, p_payment_id, auth.uid()
  )
  returning * into v_void;

  for v_alloc in
    select * from public.coverage_allocations where payment_id = p_payment_id
  loop
    insert into public.coverage_allocations (payment_id, member_id, cycle_date, amount_cents)
    values (v_void.id, v_alloc.member_id, v_alloc.cycle_date, -v_alloc.amount_cents);
  end loop;

  return v_void;
end;
$$;

revoke all on function public.void_payment(uuid, text) from public, anon;
grant execute on function public.void_payment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- public.adjust_payment(payment_id, delta_cents, note) — rettifica esplicita
-- di un pagamento esistente (es. importo registrato errato). Un delta
-- positivo alloca cicli aggiuntivi in avanti; un delta negativo rimuove
-- copertura a partire dall'ultimo ciclo allocato all'indietro (LIFO),
-- mai sotto zero per ciclo.
-- ---------------------------------------------------------------------------

create or replace function public.adjust_payment(
  p_payment_id uuid,
  p_delta_cents integer,
  p_note text
)
returns public.payments
language plpgsql
as $$
declare
  v_original public.payments;
  v_adjustment public.payments;
  v_sub public.subscriptions;
  v_quota integer;
  v_cycle date;
  v_remaining integer;
  v_existing integer;
  v_to_allocate integer;
  v_guard integer := 0;
begin
  if p_note is null or btrim(p_note) = '' then
    raise exception 'p_note e'' obbligatoria per rettificare un pagamento';
  end if;
  if p_delta_cents is null or p_delta_cents = 0 then
    raise exception 'p_delta_cents deve essere diverso da zero';
  end if;

  -- Nessun "for update": vedi la stessa nota in void_payment().
  select * into v_original from public.payments where id = p_payment_id;
  if v_original is null then
    raise exception 'pagamento % non trovato', p_payment_id;
  end if;
  if v_original.kind <> 'payment' then
    raise exception 'si puo'' rettificare solo un pagamento originale (kind=payment)';
  end if;

  v_sub := public.active_subscription();
  if v_sub is null then
    raise exception 'nessun piano Spotify attivo configurato';
  end if;

  select monthly_share_cents into v_quota
  from public.members where id = v_original.member_id;
  if v_quota is null then
    raise exception 'membro % non trovato', v_original.member_id;
  end if;

  insert into public.payments (
    member_id, amount_cents, kind, method, paid_at, note, adjusts_payment_id, created_by
  ) values (
    v_original.member_id, p_delta_cents, 'adjustment', v_original.method,
    current_date, p_note, p_payment_id, auth.uid()
  )
  returning * into v_adjustment;

  if p_delta_cents > 0 then
    v_remaining := p_delta_cents;
    v_cycle := v_sub.start_date;
    while v_remaining > 0 loop
      select coalesce(sum(amount_cents), 0) into v_existing
      from public.coverage_allocations
      where member_id = v_original.member_id and cycle_date = v_cycle;

      if v_existing < v_quota then
        v_to_allocate := least(v_remaining, v_quota - v_existing);
        insert into public.coverage_allocations (payment_id, member_id, cycle_date, amount_cents)
        values (v_adjustment.id, v_original.member_id, v_cycle, v_to_allocate);
        v_remaining := v_remaining - v_to_allocate;
      end if;

      v_cycle := v_cycle + interval '1 month';
      v_guard := v_guard + 1;
      if v_guard > 2400 then
        raise exception 'adjust_payment: troppi cicli, controllare start_date';
      end if;
    end loop;
  else
    v_remaining := -p_delta_cents;
    for v_cycle in
      select ca.cycle_date
      from public.coverage_allocations ca
      where ca.member_id = v_original.member_id
      group by ca.cycle_date
      having sum(ca.amount_cents) > 0
      order by ca.cycle_date desc
    loop
      exit when v_remaining <= 0;

      select coalesce(sum(amount_cents), 0) into v_existing
      from public.coverage_allocations
      where member_id = v_original.member_id and cycle_date = v_cycle;

      v_to_allocate := least(v_remaining, v_existing);
      if v_to_allocate > 0 then
        insert into public.coverage_allocations (payment_id, member_id, cycle_date, amount_cents)
        values (v_adjustment.id, v_original.member_id, v_cycle, -v_to_allocate);
        v_remaining := v_remaining - v_to_allocate;
      end if;
    end loop;
  end if;

  return v_adjustment;
end;
$$;

revoke all on function public.adjust_payment(uuid, integer, text) from public, anon;
grant execute on function public.adjust_payment(uuid, integer, text) to authenticated;
