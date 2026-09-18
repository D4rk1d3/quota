


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."billing_frequency" AS ENUM (
    'monthly',
    'quarterly',
    'yearly',
    'custom'
);


ALTER TYPE "public"."billing_frequency" OWNER TO "postgres";


CREATE TYPE "public"."cycle_status" AS ENUM (
    'upcoming',
    'current',
    'overdue',
    'closed'
);


ALTER TYPE "public"."cycle_status" OWNER TO "postgres";


CREATE TYPE "public"."entitlement_status" AS ENUM (
    'free',
    'active',
    'past_due',
    'cancelled',
    'expired'
);


ALTER TYPE "public"."entitlement_status" OWNER TO "postgres";


CREATE TYPE "public"."member_status" AS ENUM (
    'active',
    'paused',
    'removed'
);


ALTER TYPE "public"."member_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'active',
    'reversed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."reminder_channel" AS ENUM (
    'copy',
    'email',
    'push'
);


ALTER TYPE "public"."reminder_channel" OWNER TO "postgres";


CREATE TYPE "public"."reminder_status" AS ENUM (
    'pending',
    'sent',
    'failed'
);


ALTER TYPE "public"."reminder_status" OWNER TO "postgres";


CREATE TYPE "public"."share_type" AS ENUM (
    'equal',
    'fixed',
    'percentage'
);


ALTER TYPE "public"."share_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'paused',
    'cancelled',
    'archived'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_billing_period"("p_date" "date", "p_frequency" "public"."billing_frequency", "p_interval" integer) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_months int;
  v_first_of_target date;
  v_last_day_of_target date;
begin
  if p_frequency = 'custom' then
    return p_date + (p_interval || ' days')::interval;
  end if;

  v_months := case p_frequency
    when 'monthly' then p_interval
    when 'quarterly' then p_interval * 3
    when 'yearly' then p_interval * 12
  end;

  v_first_of_target := (date_trunc('month', p_date) + (v_months || ' months')::interval)::date;
  v_last_day_of_target := (date_trunc('month', v_first_of_target) + interval '1 month' - interval '1 day')::date;

  return least(v_first_of_target + (extract(day from p_date)::int - 1), v_last_day_of_target);
end;
$$;


ALTER FUNCTION "public"."add_billing_period"("p_date" "date", "p_frequency" "public"."billing_frequency", "p_interval" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_member_charges"("p_billing_cycle_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_cycle billing_cycles%rowtype;
  v_subscription subscriptions%rowtype;
  v_member_ids uuid[];
  v_weights numeric[];
  v_fixed_amounts numeric[];
  v_shares_cents bigint[];
  v_total_cents bigint;
  v_expected_total numeric := 0;
  m record;
  i int := 0;
begin
  select * into v_cycle from billing_cycles where id = p_billing_cycle_id;
  select * into v_subscription from subscriptions where id = v_cycle.subscription_id;

  delete from member_charges where billing_cycle_id = p_billing_cycle_id;

  if v_subscription.share_type = 'fixed' then
    for m in
      select id, coalesce(default_share, 0) as amt
      from subscription_members
      where subscription_id = v_subscription.id
        and status = 'active'
        and not (pause_from is not null and v_cycle.period_start between pause_from and coalesce(pause_until, 'infinity'::date))
    loop
      insert into member_charges (billing_cycle_id, member_id, expected_amount, currency, due_date)
      values (p_billing_cycle_id, m.id, m.amt, v_cycle.currency, v_cycle.renewal_date);
      v_expected_total := v_expected_total + m.amt;
    end loop;

  else
    -- equal (weight = 1 each) or percentage (weight = default_share)
    v_total_cents := round(v_cycle.price_at_cycle * 100)::bigint;

    select array_agg(id), array_agg(case when v_subscription.share_type = 'percentage' then coalesce(default_share, 0) else 1 end)
    into v_member_ids, v_weights
    from subscription_members
    where subscription_id = v_subscription.id
      and status = 'active'
      and not (pause_from is not null and v_cycle.period_start between pause_from and coalesce(pause_until, 'infinity'::date));

    if v_member_ids is null or array_length(v_member_ids, 1) = 0 then
      update billing_cycles set expected_total = 0 where id = p_billing_cycle_id;
      return;
    end if;

    v_shares_cents := compute_shares(v_total_cents, v_weights);

    for i in 1..array_length(v_member_ids, 1) loop
      insert into member_charges (billing_cycle_id, member_id, expected_amount, currency, due_date)
      values (p_billing_cycle_id, v_member_ids[i], v_shares_cents[i] / 100.0, v_cycle.currency, v_cycle.renewal_date);
      v_expected_total := v_expected_total + v_shares_cents[i] / 100.0;
    end loop;
  end if;

  update billing_cycles set expected_total = v_expected_total where id = p_billing_cycle_id;
end;
$$;


ALTER FUNCTION "public"."calculate_member_charges"("p_billing_cycle_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_shares"("total_cents" bigint, "weights" numeric[]) RETURNS bigint[]
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  n int := array_length(weights, 1);
  weight_sum numeric := 0;
  raw numeric[];
  base bigint[];
  remainder numeric[];
  result bigint[];
  allocated bigint := 0;
  leftover bigint;
  idx int;
  order_idxs int[];
begin
  if n is null or n = 0 then
    return array[]::bigint[];
  end if;
  select sum(w) into weight_sum from unnest(weights) w;
  if weight_sum <= 0 then
    raise exception 'INVALID_AMOUNT: weights must sum to a positive number';
  end if;

  for i in 1..n loop
    raw[i] := total_cents * weights[i] / weight_sum;
    base[i] := floor(raw[i]);
    remainder[i] := raw[i] - base[i];
    result[i] := base[i];
    allocated := allocated + base[i];
  end loop;

  leftover := total_cents - allocated;

  -- distribute leftover cents to the members with the largest fractional remainder
  select array_agg(i order by remainder[i] desc, i asc) into order_idxs from generate_series(1, n) i;
  for k in 1..leftover loop
    idx := order_idxs[k];
    result[idx] := result[idx] + 1;
  end loop;

  return result;
end;
$$;


ALTER FUNCTION "public"."compute_shares"("total_cents" bigint, "weights" numeric[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_billing_cycle"("p_subscription_id" "uuid", "p_period_start" "date") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_subscription subscriptions%rowtype;
  v_cycle_id uuid;
  v_period_end date;
  v_renewal_date date;
  v_status cycle_status;
begin
  select * into v_subscription from subscriptions where id = p_subscription_id;
  if not found then
    raise exception 'NOT_FOUND: subscription % does not exist or is not accessible', p_subscription_id;
  end if;

  select id into v_cycle_id from billing_cycles
    where subscription_id = p_subscription_id and period_start = p_period_start;
  if found then
    return v_cycle_id;
  end if;

  v_renewal_date := add_billing_period(p_period_start, v_subscription.billing_frequency, v_subscription.billing_interval);
  v_period_end := v_renewal_date - 1;
  v_status := case
    when p_period_start > current_date then 'upcoming'
    when v_period_end < current_date then 'overdue'
    else 'current'
  end;

  insert into billing_cycles (subscription_id, period_start, period_end, renewal_date, price_at_cycle, currency, status)
  values (p_subscription_id, p_period_start, v_period_end, v_renewal_date, v_subscription.current_price, v_subscription.currency, v_status)
  returning id into v_cycle_id;

  perform calculate_member_charges(v_cycle_id);

  insert into activity_log (organizer_id, entity_type, entity_id, event_type, metadata, actor_id)
  values (v_subscription.organizer_id, 'billing_cycle', v_cycle_id, 'cycle_created',
          jsonb_build_object('subscription_id', p_subscription_id, 'period_start', p_period_start), auth.uid());

  return v_cycle_id;
end;
$$;


ALTER FUNCTION "public"."generate_billing_cycle"("p_subscription_id" "uuid", "p_period_start" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_upcoming_cycles"("p_window" integer DEFAULT 2) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  s subscriptions%rowtype;
  v_next_start date;
  i int;
begin
  for s in select * from subscriptions where status = 'active' loop
    select coalesce(max(period_end) + 1, s.start_date) into v_next_start
    from billing_cycles where subscription_id = s.id;

    for i in 1..p_window loop
      exit when v_next_start > current_date + interval '1 year';
      perform generate_billing_cycle(s.id, v_next_start);
      select renewal_date into v_next_start from billing_cycles
        where subscription_id = s.id and period_start = v_next_start;
    end loop;
  end loop;
end;
$$;


ALTER FUNCTION "public"."generate_upcoming_cycles"("p_window" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_entitlement"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("is_pro" boolean, "status" "public"."entitlement_status", "current_period_end" timestamp with time zone, "cancel_at_period_end" boolean)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select
    coalesce(e.status = 'active', false)
      and (e.current_period_end is null or e.current_period_end > now()) as is_pro,
    coalesce(e.status, 'free'::entitlement_status) as status,
    e.current_period_end,
    coalesce(e.cancel_at_period_end, false)
  from (select 1) dummy
  left join entitlements e on e.user_id = p_user_id;
$$;


ALTER FUNCTION "public"."get_current_entitlement"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard"() RETURNS TABLE("total_expected" numeric, "total_collected" numeric, "total_outstanding" numeric, "payments_count" bigint, "overdue_count" bigint, "next_renewal_date" "date", "next_renewal_subscription" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with current_cycles as (
    select bc.* from billing_cycles bc
    join subscriptions s on s.id = bc.subscription_id
    where s.organizer_id = auth.uid() and bc.status in ('current','overdue')
  ),
  next_renewal as (
    select s.next_renewal_date, s.name from subscriptions s
    where s.organizer_id = auth.uid() and s.status = 'active'
    order by s.next_renewal_date asc limit 1
  )
  select
    coalesce(sum(cc.expected_total), 0),
    coalesce(sum(cc.collected_total), 0),
    coalesce(sum(cc.expected_total - cc.collected_total), 0),
    (select count(*) from payments p
       join member_charges mc on mc.id = p.charge_id
       join billing_cycles bc2 on bc2.id = mc.billing_cycle_id
       join subscriptions s2 on s2.id = bc2.subscription_id
       where s2.organizer_id = auth.uid() and p.status = 'active'
         and bc2.id in (select id from current_cycles)),
    (select count(*) from current_cycles where status = 'overdue'),
    (select next_renewal_date from next_renewal),
    (select name from next_renewal)
  from current_cycles cc;
$$;


ALTER FUNCTION "public"."get_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_initial_price"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into subscription_price_history (subscription_id, amount, currency, effective_from)
  values (new.id, new.current_price, new.currency, new.start_date);
  return new;
end;
$$;


ALTER FUNCTION "public"."log_initial_price"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_payment"("p_charge_id" "uuid", "p_amount" numeric, "p_payment_method_id" "uuid" DEFAULT NULL::"uuid", "p_paid_at" timestamp with time zone DEFAULT "now"(), "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_charge member_charges%rowtype;
  v_cycle billing_cycles%rowtype;
  v_organizer_id uuid;
  v_payment_id uuid;
begin
  select mc.* into v_charge from member_charges mc where mc.id = p_charge_id;
  if not found then
    raise exception 'NOT_FOUND: charge % does not exist or is not accessible', p_charge_id;
  end if;

  select bc.* into v_cycle from billing_cycles bc where bc.id = v_charge.billing_cycle_id;
  if v_cycle.status = 'closed' then
    raise exception 'CYCLE_CLOSED: cannot record a payment on a closed cycle';
  end if;

  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT: payment amount must be positive';
  end if;

  select s.organizer_id into v_organizer_id
  from subscriptions s where s.id = v_cycle.subscription_id;

  insert into payments (charge_id, member_id, amount, currency, payment_method_id, paid_at, note, created_by)
  values (p_charge_id, v_charge.member_id, p_amount, v_charge.currency, p_payment_method_id, p_paid_at, p_note, auth.uid())
  returning id into v_payment_id;

  update billing_cycles set collected_total = collected_total + p_amount where id = v_cycle.id;

  insert into activity_log (organizer_id, entity_type, entity_id, event_type, metadata, actor_id)
  values (v_organizer_id, 'payment', v_payment_id, 'payment_recorded',
          jsonb_build_object('charge_id', p_charge_id, 'member_id', v_charge.member_id, 'amount', p_amount), auth.uid());

  return v_payment_id;
end;
$$;


ALTER FUNCTION "public"."record_payment"("p_charge_id" "uuid", "p_amount" numeric, "p_payment_method_id" "uuid", "p_paid_at" timestamp with time zone, "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reverse_payment"("p_payment_id" "uuid", "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_payment payments%rowtype;
  v_cycle_id uuid;
  v_organizer_id uuid;
  v_reversal_id uuid;
begin
  select * into v_payment from payments where id = p_payment_id;
  if not found then
    raise exception 'NOT_FOUND: payment % does not exist or is not accessible', p_payment_id;
  end if;
  if v_payment.status = 'reversed' then
    raise exception 'PAYMENT_ALREADY_REVERSED: payment % was already reversed', p_payment_id;
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'VALIDATION_ERROR: a reason is required to reverse a payment';
  end if;

  select bc.id, s.organizer_id into v_cycle_id, v_organizer_id
  from member_charges mc
  join billing_cycles bc on bc.id = mc.billing_cycle_id
  join subscriptions s on s.id = bc.subscription_id
  where mc.id = v_payment.charge_id;

  update payments set status = 'reversed' where id = p_payment_id;

  insert into payment_reversals (payment_id, reason, reversed_by)
  values (p_payment_id, p_reason, auth.uid())
  returning id into v_reversal_id;

  update billing_cycles set collected_total = collected_total - v_payment.amount where id = v_cycle_id;

  insert into activity_log (organizer_id, entity_type, entity_id, event_type, metadata, actor_id)
  values (v_organizer_id, 'payment', p_payment_id, 'payment_reversed',
          jsonb_build_object('reason', p_reason, 'amount', v_payment.amount), auth.uid());

  return v_reversal_id;
end;
$$;


ALTER FUNCTION "public"."reverse_payment"("p_payment_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_demo_data"("p_organizer_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_netflix uuid;
  v_spotify uuid;
  v_gym uuid;
  v_pietro uuid;
  v_marco uuid;
  v_luca uuid;
  v_anna uuid;
  v_cycle_aug uuid;
  v_cycle_sep uuid;
  v_charge_marco uuid;
  v_charge_luca uuid;
begin
  insert into subscriptions (organizer_id, name, description, icon, currency, current_price, billing_frequency, share_type, next_renewal_date, start_date, status)
  values (p_organizer_id, 'Netflix', 'Piano Premium condiviso', 'tv', 'EUR', 19.99, 'monthly', 'equal', add_billing_period(current_date, 'monthly', 1), (current_date - interval '2 months')::date, 'active')
  returning id into v_netflix;

  insert into subscriptions (organizer_id, name, description, icon, currency, current_price, billing_frequency, share_type, next_renewal_date, start_date, status)
  values (p_organizer_id, 'Spotify', 'Family Plan', 'music', 'EUR', 17.99, 'monthly', 'percentage', add_billing_period(current_date, 'monthly', 1), (current_date - interval '1 month')::date, 'active')
  returning id into v_spotify;

  insert into subscriptions (organizer_id, name, description, icon, currency, current_price, billing_frequency, share_type, next_renewal_date, start_date, status)
  values (p_organizer_id, 'Palestra', 'Abbonamento coppia', 'dumbbell', 'EUR', 60.00, 'monthly', 'fixed', add_billing_period(current_date, 'monthly', 1), (current_date - interval '1 month')::date, 'active')
  returning id into v_gym;

  insert into subscription_members (subscription_id, name, status, default_share) values (v_netflix, 'Pietro', 'active', null) returning id into v_pietro;
  insert into subscription_members (subscription_id, name, status, default_share) values (v_netflix, 'Marco', 'active', null) returning id into v_marco;
  insert into subscription_members (subscription_id, name, status, default_share) values (v_netflix, 'Luca', 'active', null) returning id into v_luca;

  insert into subscription_members (subscription_id, name, status, default_share) values (v_spotify, 'Pietro', 'active', 40);
  insert into subscription_members (subscription_id, name, status, default_share) values (v_spotify, 'Marco', 'active', 30);
  insert into subscription_members (subscription_id, name, status, default_share) values (v_spotify, 'Anna', 'active', 30) returning id into v_anna;

  insert into subscription_members (subscription_id, name, status, default_share) values (v_gym, 'Pietro', 'active', 30.00);
  insert into subscription_members (subscription_id, name, status, default_share) values (v_gym, 'Marco', 'active', 30.00);

  -- Netflix: a fully-paid past cycle, then a partially-paid cycle
  v_cycle_aug := generate_billing_cycle(v_netflix, (current_date - interval '2 months')::date);
  perform record_payment(mc.id, mc.expected_amount)
  from member_charges mc where mc.billing_cycle_id = v_cycle_aug;

  v_cycle_sep := generate_billing_cycle(v_netflix, (select renewal_date from billing_cycles where id = v_cycle_aug));

  select id into v_charge_marco from member_charges where billing_cycle_id = v_cycle_sep and member_id = v_marco;
  select id into v_charge_luca from member_charges where billing_cycle_id = v_cycle_sep and member_id = v_luca;
  perform record_payment(v_charge_marco, (select expected_amount from member_charges where id = v_charge_marco));
  perform record_payment(v_charge_luca, (select expected_amount from member_charges where id = v_charge_luca) / 2);

  -- Spotify/Gym: bring current cycle into existence too
  perform generate_billing_cycle(v_spotify, (current_date - interval '1 month')::date);
  perform generate_billing_cycle(v_gym, (current_date - interval '1 month')::date);

  -- Top up every subscription with its current + upcoming cycles
  perform generate_upcoming_cycles(2);
end;
$$;


ALTER FUNCTION "public"."seed_demo_data"("p_organizer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cycle_statuses"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  update billing_cycles set status = 'current'
    where status = 'upcoming' and period_start <= current_date and period_end >= current_date;

  update billing_cycles set status = 'overdue'
    where status in ('current','upcoming') and period_end < current_date and collected_total < expected_total;

  update billing_cycles set status = 'closed', closed_at = now()
    where status in ('current','overdue') and period_end < current_date and collected_total >= expected_total;
end;
$$;


ALTER FUNCTION "public"."update_cycle_statuses"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organizer_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "actor_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "renewal_date" "date" NOT NULL,
    "price_at_cycle" numeric(12,2) NOT NULL,
    "currency" character(3) NOT NULL,
    "expected_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "collected_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "public"."cycle_status" DEFAULT 'upcoming'::"public"."cycle_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    CONSTRAINT "billing_cycles_collected_total_check" CHECK (("collected_total" >= (0)::numeric)),
    CONSTRAINT "billing_cycles_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "billing_cycles_expected_total_check" CHECK (("expected_total" >= (0)::numeric)),
    CONSTRAINT "billing_cycles_price_at_cycle_check" CHECK (("price_at_cycle" > (0)::numeric))
);


ALTER TABLE "public"."billing_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'lemonsqueezy'::"text" NOT NULL,
    "customer_id" "text",
    "provider_subscription_id" "text",
    "product_id" "text",
    "variant_id" "text",
    "status" "public"."entitlement_status" DEFAULT 'free'::"public"."entitlement_status" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_charges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "billing_cycle_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "expected_amount" numeric(12,2) NOT NULL,
    "currency" character(3) NOT NULL,
    "due_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "member_charges_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "member_charges_expected_amount_check" CHECK (("expected_amount" >= (0)::numeric))
);


ALTER TABLE "public"."member_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organizer_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "method_type" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_methods_method_type_check" CHECK (("method_type" = ANY (ARRAY['revolut'::"text", 'bank_transfer'::"text", 'cash'::"text", 'satispay'::"text", 'trade_republic'::"text", 'paypal'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_reversals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "reversed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reversed_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_reversals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "charge_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character(3) NOT NULL,
    "payment_method_id" "uuid",
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "status" "public"."payment_status" DEFAULT 'active'::"public"."payment_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "payments_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payments_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text"))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "locale" "text" DEFAULT 'it-IT'::"text" NOT NULL,
    "currency" character(3) DEFAULT 'EUR'::"bpchar" NOT NULL,
    "timezone" "text" DEFAULT 'Europe/Rome'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "push_tokens_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text", 'macos'::"text"])))
);


ALTER TABLE "public"."push_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organizer_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "charge_id" "uuid",
    "message" "text" NOT NULL,
    "channel" "public"."reminder_channel" DEFAULT 'copy'::"public"."reminder_channel" NOT NULL,
    "status" "public"."reminder_status" DEFAULT 'pending'::"public"."reminder_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone
);


ALTER TABLE "public"."reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "initials" "text",
    "avatar_color" "text",
    "default_share" numeric(12,4),
    "status" "public"."member_status" DEFAULT 'active'::"public"."member_status" NOT NULL,
    "pause_from" "date",
    "pause_until" "date",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pause_window_valid" CHECK (((("pause_from" IS NULL) AND ("pause_until" IS NULL)) OR ("pause_until" >= "pause_from")))
);


ALTER TABLE "public"."subscription_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character(3) NOT NULL,
    "effective_from" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscription_price_history_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "subscription_price_history_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text"))
);


ALTER TABLE "public"."subscription_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organizer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "currency" character(3) DEFAULT 'EUR'::"bpchar" NOT NULL,
    "current_price" numeric(12,2) NOT NULL,
    "billing_frequency" "public"."billing_frequency" DEFAULT 'monthly'::"public"."billing_frequency" NOT NULL,
    "billing_interval" integer DEFAULT 1 NOT NULL,
    "share_type" "public"."share_type" DEFAULT 'equal'::"public"."share_type" NOT NULL,
    "renewal_day" integer,
    "next_renewal_date" "date" NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'active'::"public"."subscription_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_billing_interval_check" CHECK (("billing_interval" > 0)),
    CONSTRAINT "subscriptions_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "subscriptions_current_price_check" CHECK (("current_price" > (0)::numeric)),
    CONSTRAINT "subscriptions_renewal_day_check" CHECK ((("renewal_day" >= 1) AND ("renewal_day" <= 31)))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_member_charges" WITH ("security_invoker"='true') AS
 SELECT "mc"."id",
    "mc"."billing_cycle_id",
    "mc"."member_id",
    "mc"."expected_amount",
    "mc"."currency",
    "mc"."due_date",
    "mc"."created_at",
    "mc"."updated_at",
    COALESCE("p"."total_paid", (0)::numeric) AS "total_paid",
    ("mc"."expected_amount" - COALESCE("p"."total_paid", (0)::numeric)) AS "remaining_amount",
        CASE
            WHEN ((COALESCE("p"."total_paid", (0)::numeric) >= "mc"."expected_amount") AND ("mc"."expected_amount" > (0)::numeric)) THEN 'paid'::"text"
            WHEN (COALESCE("p"."total_paid", (0)::numeric) > (0)::numeric) THEN 'partial'::"text"
            WHEN (COALESCE("p"."total_paid", (0)::numeric) > "mc"."expected_amount") THEN 'credit'::"text"
            WHEN ("mc"."due_date" < CURRENT_DATE) THEN 'overdue'::"text"
            ELSE 'scheduled'::"text"
        END AS "charge_status"
   FROM ("public"."member_charges" "mc"
     LEFT JOIN ( SELECT "payments"."charge_id",
            "sum"("payments"."amount") AS "total_paid"
           FROM "public"."payments"
          WHERE ("payments"."status" = 'active'::"public"."payment_status")
          GROUP BY "payments"."charge_id") "p" ON (("p"."charge_id" = "mc"."id")));


ALTER VIEW "public"."v_member_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "processed_at" timestamp with time zone,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_cycles"
    ADD CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_cycles"
    ADD CONSTRAINT "billing_cycles_subscription_id_period_start_key" UNIQUE ("subscription_id", "period_start");



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."member_charges"
    ADD CONSTRAINT "member_charges_billing_cycle_id_member_id_key" UNIQUE ("billing_cycle_id", "member_id");



ALTER TABLE ONLY "public"."member_charges"
    ADD CONSTRAINT "member_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_reversals"
    ADD CONSTRAINT "payment_reversals_payment_id_key" UNIQUE ("payment_id");



ALTER TABLE ONLY "public"."payment_reversals"
    ADD CONSTRAINT "payment_reversals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_token_key" UNIQUE ("user_id", "token");



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_members"
    ADD CONSTRAINT "subscription_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_price_history"
    ADD CONSTRAINT "subscription_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_provider_event_id_key" UNIQUE ("provider", "event_id");



CREATE INDEX "idx_activity_actor" ON "public"."activity_log" USING "btree" ("actor_id");



CREATE INDEX "idx_activity_organizer_created" ON "public"."activity_log" USING "btree" ("organizer_id", "created_at" DESC);



CREATE INDEX "idx_charges_cycle" ON "public"."member_charges" USING "btree" ("billing_cycle_id");



CREATE INDEX "idx_charges_due_date" ON "public"."member_charges" USING "btree" ("due_date");



CREATE INDEX "idx_charges_member" ON "public"."member_charges" USING "btree" ("member_id");



CREATE INDEX "idx_cycles_renewal_date" ON "public"."billing_cycles" USING "btree" ("renewal_date");



CREATE INDEX "idx_cycles_status" ON "public"."billing_cycles" USING "btree" ("status");



CREATE INDEX "idx_cycles_subscription" ON "public"."billing_cycles" USING "btree" ("subscription_id");



CREATE INDEX "idx_entitlements_user" ON "public"."entitlements" USING "btree" ("user_id");



CREATE INDEX "idx_members_subscription" ON "public"."subscription_members" USING "btree" ("subscription_id");



CREATE INDEX "idx_payment_methods_organizer" ON "public"."payment_methods" USING "btree" ("organizer_id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_payments_charge" ON "public"."payments" USING "btree" ("charge_id");



CREATE INDEX "idx_payments_created_by" ON "public"."payments" USING "btree" ("created_by");



CREATE INDEX "idx_payments_member" ON "public"."payments" USING "btree" ("member_id");



CREATE INDEX "idx_payments_method" ON "public"."payments" USING "btree" ("payment_method_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_price_history_subscription" ON "public"."subscription_price_history" USING "btree" ("subscription_id", "effective_from" DESC);



CREATE INDEX "idx_reminders_charge" ON "public"."reminders" USING "btree" ("charge_id");



CREATE INDEX "idx_reminders_member" ON "public"."reminders" USING "btree" ("member_id");



CREATE INDEX "idx_reminders_organizer" ON "public"."reminders" USING "btree" ("organizer_id", "created_at" DESC);



CREATE INDEX "idx_reversals_reversed_by" ON "public"."payment_reversals" USING "btree" ("reversed_by");



CREATE INDEX "idx_subscriptions_next_renewal" ON "public"."subscriptions" USING "btree" ("next_renewal_date") WHERE ("status" = 'active'::"public"."subscription_status");



CREATE INDEX "idx_subscriptions_organizer" ON "public"."subscriptions" USING "btree" ("organizer_id");



CREATE OR REPLACE TRIGGER "entitlements_set_updated_at" BEFORE UPDATE ON "public"."entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "member_charges_set_updated_at" BEFORE UPDATE ON "public"."member_charges" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "payment_methods_set_updated_at" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "subscription_members_set_updated_at" BEFORE UPDATE ON "public"."subscription_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_log_initial_price" AFTER INSERT ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."log_initial_price"();



CREATE OR REPLACE TRIGGER "subscriptions_set_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_cycles"
    ADD CONSTRAINT "billing_cycles_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_charges"
    ADD CONSTRAINT "member_charges_billing_cycle_id_fkey" FOREIGN KEY ("billing_cycle_id") REFERENCES "public"."billing_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_charges"
    ADD CONSTRAINT "member_charges_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."subscription_members"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_reversals"
    ADD CONSTRAINT "payment_reversals_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payment_reversals"
    ADD CONSTRAINT "payment_reversals_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "public"."member_charges"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."subscription_members"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "public"."member_charges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."subscription_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_members"
    ADD CONSTRAINT "subscription_members_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_price_history"
    ADD CONSTRAINT "subscription_price_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "activity_insert_owner" ON "public"."activity_log" FOR INSERT WITH CHECK (("organizer_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_select_owner" ON "public"."activity_log" FOR SELECT USING (("organizer_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."billing_cycles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "charges_owner" ON "public"."member_charges" USING ((EXISTS ( SELECT 1
   FROM ("public"."billing_cycles" "bc"
     JOIN "public"."subscriptions" "s" ON (("s"."id" = "bc"."subscription_id")))
  WHERE (("bc"."id" = "member_charges"."billing_cycle_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."billing_cycles" "bc"
     JOIN "public"."subscriptions" "s" ON (("s"."id" = "bc"."subscription_id")))
  WHERE (("bc"."id" = "member_charges"."billing_cycle_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "cycles_owner" ON "public"."billing_cycles" USING ((EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."id" = "billing_cycles"."subscription_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."id" = "billing_cycles"."subscription_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."entitlements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "entitlements_select_self" ON "public"."entitlements" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."member_charges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "members_owner" ON "public"."subscription_members" USING ((EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."id" = "subscription_members"."subscription_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."id" = "subscription_members"."subscription_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_methods_owner" ON "public"."payment_methods" USING (("organizer_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("organizer_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."payment_reversals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_owner" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM (("public"."member_charges" "mc"
     JOIN "public"."billing_cycles" "bc" ON (("bc"."id" = "mc"."billing_cycle_id")))
     JOIN "public"."subscriptions" "s" ON (("s"."id" = "bc"."subscription_id")))
  WHERE (("mc"."id" = "payments"."charge_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."member_charges" "mc"
     JOIN "public"."billing_cycles" "bc" ON (("bc"."id" = "mc"."billing_cycle_id")))
     JOIN "public"."subscriptions" "s" ON (("s"."id" = "bc"."subscription_id")))
  WHERE (("mc"."id" = "payments"."charge_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "price_history_owner" ON "public"."subscription_price_history" USING ((EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."id" = "subscription_price_history"."subscription_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."id" = "subscription_price_history"."subscription_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_self" ON "public"."profiles" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "push_tokens_owner" ON "public"."push_tokens" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."reminders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reminders_owner" ON "public"."reminders" USING (("organizer_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("organizer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "reversals_owner" ON "public"."payment_reversals" USING ((EXISTS ( SELECT 1
   FROM ((("public"."payments" "p"
     JOIN "public"."member_charges" "mc" ON (("mc"."id" = "p"."charge_id")))
     JOIN "public"."billing_cycles" "bc" ON (("bc"."id" = "mc"."billing_cycle_id")))
     JOIN "public"."subscriptions" "s" ON (("s"."id" = "bc"."subscription_id")))
  WHERE (("p"."id" = "payment_reversals"."payment_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ((("public"."payments" "p"
     JOIN "public"."member_charges" "mc" ON (("mc"."id" = "p"."charge_id")))
     JOIN "public"."billing_cycles" "bc" ON (("bc"."id" = "mc"."billing_cycle_id")))
     JOIN "public"."subscriptions" "s" ON (("s"."id" = "bc"."subscription_id")))
  WHERE (("p"."id" = "payment_reversals"."payment_id") AND ("s"."organizer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."subscription_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_owner" ON "public"."subscriptions" USING (("organizer_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("organizer_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webhook_events_no_client_access" ON "public"."webhook_events" USING (false) WITH CHECK (false);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_billing_period"("p_date" "date", "p_frequency" "public"."billing_frequency", "p_interval" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_billing_period"("p_date" "date", "p_frequency" "public"."billing_frequency", "p_interval" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_billing_period"("p_date" "date", "p_frequency" "public"."billing_frequency", "p_interval" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_member_charges"("p_billing_cycle_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_member_charges"("p_billing_cycle_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_member_charges"("p_billing_cycle_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_shares"("total_cents" bigint, "weights" numeric[]) TO "anon";
GRANT ALL ON FUNCTION "public"."compute_shares"("total_cents" bigint, "weights" numeric[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_shares"("total_cents" bigint, "weights" numeric[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_billing_cycle"("p_subscription_id" "uuid", "p_period_start" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_billing_cycle"("p_subscription_id" "uuid", "p_period_start" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_billing_cycle"("p_subscription_id" "uuid", "p_period_start" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_upcoming_cycles"("p_window" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_upcoming_cycles"("p_window" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_entitlement"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_entitlement"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_entitlement"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_initial_price"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_initial_price"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_initial_price"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_payment"("p_charge_id" "uuid", "p_amount" numeric, "p_payment_method_id" "uuid", "p_paid_at" timestamp with time zone, "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_payment"("p_charge_id" "uuid", "p_amount" numeric, "p_payment_method_id" "uuid", "p_paid_at" timestamp with time zone, "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_payment"("p_charge_id" "uuid", "p_amount" numeric, "p_payment_method_id" "uuid", "p_paid_at" timestamp with time zone, "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reverse_payment"("p_payment_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reverse_payment"("p_payment_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reverse_payment"("p_payment_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_demo_data"("p_organizer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."seed_demo_data"("p_organizer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_demo_data"("p_organizer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_cycle_statuses"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_cycle_statuses"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."billing_cycles" TO "anon";
GRANT ALL ON TABLE "public"."billing_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."entitlements" TO "anon";
GRANT ALL ON TABLE "public"."entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."member_charges" TO "anon";
GRANT ALL ON TABLE "public"."member_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."member_charges" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payment_reversals" TO "anon";
GRANT ALL ON TABLE "public"."payment_reversals" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_reversals" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."reminders" TO "anon";
GRANT ALL ON TABLE "public"."reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_members" TO "anon";
GRANT ALL ON TABLE "public"."subscription_members" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_members" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_price_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."v_member_charges" TO "anon";
GRANT ALL ON TABLE "public"."v_member_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."v_member_charges" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







