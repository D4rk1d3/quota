-- Limiti del piano gratuito applicati nel DB, cosi' valgono per qualunque
-- client (app macOS, Android, script). Costanti: 1 abbonamento, 6 membri.
-- seed_demo_data e job interni possono saltarli con:
--   select set_config('quota.skip_limits', 'on', true);

create or replace function public.enforce_free_tier()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organizer uuid;
  v_count int;
begin
  if coalesce(current_setting('quota.skip_limits', true), '') = 'on' then
    return new;
  end if;

  if tg_table_name = 'subscriptions' then
    v_organizer := new.organizer_id;
  else
    select organizer_id into v_organizer from subscriptions where id = new.subscription_id;
  end if;

  if coalesce((select is_pro from get_current_entitlement(v_organizer)), false) then
    return new;
  end if;

  if tg_table_name = 'subscriptions' then
    select count(*) into v_count from subscriptions
      where organizer_id = v_organizer and status <> 'archived';
    if v_count >= 1 then
      raise exception 'FREE_LIMIT_SUBSCRIPTIONS: il piano gratuito include 1 abbonamento'
        using errcode = 'P0001';
    end if;
  else
    select count(*) into v_count from subscription_members
      where subscription_id = new.subscription_id and status <> 'removed';
    if v_count >= 6 then
      raise exception 'FREE_LIMIT_MEMBERS: il piano gratuito include 6 membri per abbonamento'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_free_tier_subscriptions on public.subscriptions;
create trigger trg_free_tier_subscriptions
  before insert on public.subscriptions
  for each row execute function public.enforce_free_tier();

drop trigger if exists trg_free_tier_members on public.subscription_members;
create trigger trg_free_tier_members
  before insert on public.subscription_members
  for each row execute function public.enforce_free_tier();
