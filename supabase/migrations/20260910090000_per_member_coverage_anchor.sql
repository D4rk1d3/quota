-- Quota — corregge il punto di partenza del calcolo di copertura.
--
-- Bug: member_coverage()/record_payment()/adjust_payment() facevano
-- ripartire SEMPRE l'allocazione dei cicli da subscription.start_date (un
-- singolo "inizio piano" globale e fisso), ignorando sia la data indicata
-- nel pagamento (paid_at) sia il momento in cui il membro e' entrato nel
-- gruppo (joined_at). Un pagamento datato nel passato (es. per registrare
-- contributi arretrati) veniva quindi allocato a partire da oggi/dall'inizio
-- piano invece che dalla data effettiva del pagamento, producendo una data
-- "coperto fino al" completamente sbagliata.
--
-- Fix: l'ancora per ciascun membro diventa dinamica:
--   * in lettura (member_coverage) = la prima cycle_date gia' allocata per
--     quel membro, oppure il ciclo del suo joined_at se non ha ancora
--     pagamenti;
--   * in scrittura (record_payment) = la PIU' PRECOCE tra il ciclo della
--     data del nuovo pagamento e l'ancora di cui sopra, cosi' un pagamento
--     retrodatato estende correttamente la copertura all'indietro.
-- subscription.start_date resta usato SOLO per il fondo/calendario
-- (concetto di gruppo, non di singolo membro): nessuna modifica li'.

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
  v_joined_at date;
  v_sub public.subscriptions;
  v_cycle date;
  v_min_alloc date;
  v_allocated integer;
  v_fully_covered integer := 0;
  v_guard integer := 0;
begin
  select monthly_share_cents, joined_at into v_quota, v_joined_at
  from public.members where id = p_member_id;

  if v_quota is null then
    raise exception 'membro % non trovato', p_member_id;
  end if;

  v_sub := public.active_subscription();
  if v_sub is null then
    raise exception 'nessun piano Spotify attivo configurato';
  end if;

  select min(ca.cycle_date) into v_min_alloc
  from public.coverage_allocations ca where ca.member_id = p_member_id;

  v_cycle := coalesce(
    v_min_alloc,
    date_trunc('month', v_joined_at)::date + (v_sub.billing_day - 1)
  );

  loop
    select coalesce(sum(ca.amount_cents), 0) into v_allocated
    from public.coverage_allocations ca
    where ca.member_id = p_member_id and ca.cycle_date = v_cycle;

    exit when v_allocated < v_quota;

    v_fully_covered := v_fully_covered + 1;
    v_cycle := v_cycle + interval '1 month';

    v_guard := v_guard + 1;
    if v_guard > 2400 then
      raise exception 'member_coverage: troppi cicli, controllare joined_at';
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
  v_joined_at date;
  v_sub public.subscriptions;
  v_cycle date;
  v_paid_at_cycle date;
  v_min_alloc date;
  v_remaining integer := p_amount_cents;
  v_existing integer;
  v_to_allocate integer;
  v_guard integer := 0;
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount_cents deve essere positivo';
  end if;

  select monthly_share_cents, joined_at into v_quota, v_joined_at
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

  select min(cycle_date) into v_min_alloc
  from public.coverage_allocations where member_id = p_member_id;

  v_paid_at_cycle := date_trunc('month', p_paid_at)::date + (v_sub.billing_day - 1);

  -- Ancora = il piu' precoce tra il ciclo di questo pagamento e cio' che il
  -- membro copriva gia' (o il suo ingresso nel gruppo, se e' il primo
  -- pagamento): un pagamento retrodatato estende la copertura all'indietro.
  v_cycle := least(
    v_paid_at_cycle,
    coalesce(v_min_alloc, date_trunc('month', v_joined_at)::date + (v_sub.billing_day - 1))
  );

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
      raise exception 'record_payment: troppi cicli, controllare joined_at/paid_at';
    end if;
  end loop;

  return v_payment;
end;
$$;

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
  v_joined_at date;
  v_cycle date;
  v_min_alloc date;
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

  select monthly_share_cents, joined_at into v_quota, v_joined_at
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
    select min(cycle_date) into v_min_alloc
    from public.coverage_allocations where member_id = v_original.member_id;

    v_cycle := coalesce(
      v_min_alloc,
      date_trunc('month', v_joined_at)::date + (v_sub.billing_day - 1)
    );

    v_remaining := p_delta_cents;
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
        raise exception 'adjust_payment: troppi cicli, controllare joined_at';
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

alter function public.member_coverage(uuid, date) set search_path = public, pg_temp;
alter function public.record_payment(uuid, integer, public.payment_method, date, text) set search_path = public, pg_temp;
alter function public.adjust_payment(uuid, integer, text) set search_path = public, pg_temp;
