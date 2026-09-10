-- Quota — corregge un errore introdotto dalla migrazione precedente:
-- member_coverage() dichiara una colonna di output chiamata member_id
-- (RETURNS TABLE (member_id uuid, ...)), che in PL/pgSQL resta visibile
-- come variabile in tutto il corpo della funzione. Il riferimento
-- "where member_id = p_member_id" su coverage_allocations risultava quindi
-- ambiguo (poteva riferirsi alla colonna di output o alla colonna della
-- tabella), con errore 42702 a runtime. Fix: qualificare esplicitamente la
-- colonna della tabella (ca.member_id).

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

alter function public.member_coverage(uuid, date) set search_path = public, pg_temp;
