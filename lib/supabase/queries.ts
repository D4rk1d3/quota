import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  BillingCycle,
  DashboardSummary,
  Entitlement,
  MemberCharge,
  PaymentMethod,
  Subscription,
  SubscriptionMember,
} from "@/lib/types";

// Fuso orario di riferimento per "oggi" (l'admin/i suoi gruppi fatturano in
// Europe/Rome nella maggior parte dei casi d'uso attesi). Il server Next.js
// (es. Vercel) gira in UTC: Intl.DateTimeFormat con timeZone esplicito e'
// corretto a prescindere dal fuso del processo Node.
function todayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

export { todayIso };

function mapSubscription(row: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  currency: string;
  current_price: number;
  billing_frequency: Subscription["billingFrequency"];
  billing_interval: number;
  share_type: Subscription["shareType"];
  next_renewal_date: string;
  start_date: string;
  status: Subscription["status"];
}): Subscription {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    currency: row.currency,
    currentPrice: row.current_price,
    billingFrequency: row.billing_frequency,
    billingInterval: row.billing_interval,
    shareType: row.share_type,
    nextRenewalDate: row.next_renewal_date,
    startDate: row.start_date,
    status: row.status,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard");
  if (error) throw new Error(error.message);
  const row = data?.[0];
  return {
    totalExpected: row?.total_expected ?? 0,
    totalCollected: row?.total_collected ?? 0,
    totalOutstanding: row?.total_outstanding ?? 0,
    paymentsCount: row?.payments_count ?? 0,
    overdueCount: row?.overdue_count ?? 0,
    nextRenewalDate: row?.next_renewal_date ?? null,
    nextRenewalSubscription: row?.next_renewal_subscription ?? null,
  };
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, subscription_members(count)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...mapSubscription(row),
    memberCount: (row.subscription_members as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export interface SubscriptionDetail {
  subscription: Subscription;
  members: SubscriptionMember[];
  cycles: BillingCycle[];
  chargesByCycle: Record<string, MemberCharge[]>;
}

export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  const supabase = await createClient();

  const [{ data: subRow, error: subErr }, { data: memberRows, error: memErr }, { data: cycleRows, error: cycErr }] =
    await Promise.all([
      supabase.from("subscriptions").select("*").eq("id", id).maybeSingle(),
      supabase.from("subscription_members").select("*").eq("subscription_id", id).order("created_at"),
      supabase
        .from("billing_cycles")
        .select("*")
        .eq("subscription_id", id)
        .order("period_start", { ascending: false })
        .limit(12),
    ]);

  if (subErr) throw new Error(subErr.message);
  if (!subRow) return null;
  if (memErr) throw new Error(memErr.message);
  if (cycErr) throw new Error(cycErr.message);

  const cycleIds = (cycleRows ?? []).map((c) => c.id);
  const nameByMember = new Map((memberRows ?? []).map((m) => [m.id, m.name]));

  const chargesByCycle: Record<string, MemberCharge[]> = {};
  if (cycleIds.length > 0) {
    const { data: chargeRows, error: chargeErr } = await supabase
      .from("v_member_charges")
      .select("*")
      .in("billing_cycle_id", cycleIds);
    if (chargeErr) throw new Error(chargeErr.message);

    for (const c of chargeRows ?? []) {
      if (!c.billing_cycle_id || !c.id || !c.member_id) continue;
      const list = (chargesByCycle[c.billing_cycle_id] ??= []);
      list.push({
        id: c.id,
        billingCycleId: c.billing_cycle_id,
        memberId: c.member_id,
        memberName: nameByMember.get(c.member_id) ?? "Membro",
        expectedAmount: c.expected_amount ?? 0,
        currency: c.currency ?? subRow.currency,
        dueDate: c.due_date ?? subRow.next_renewal_date,
        totalPaid: c.total_paid ?? 0,
        remainingAmount: c.remaining_amount ?? 0,
        status: (c.charge_status as MemberCharge["status"]) ?? "scheduled",
      });
    }
  }

  return {
    subscription: mapSubscription(subRow),
    members: (memberRows ?? []).map((m) => ({
      id: m.id,
      subscriptionId: m.subscription_id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      initials: m.initials,
      avatarColor: m.avatar_color,
      defaultShare: m.default_share,
      status: m.status,
      pauseFrom: m.pause_from,
      pauseUntil: m.pause_until,
      joinedAt: m.joined_at,
    })),
    cycles: (cycleRows ?? []).map((c) => ({
      id: c.id,
      subscriptionId: c.subscription_id,
      periodStart: c.period_start,
      periodEnd: c.period_end,
      renewalDate: c.renewal_date,
      priceAtCycle: c.price_at_cycle,
      currency: c.currency,
      expectedTotal: c.expected_total,
      collectedTotal: c.collected_total,
      status: c.status,
    })),
    chargesByCycle,
  };
}

export interface UpcomingCycle extends BillingCycle {
  subscriptionName: string;
}

export async function getUpcomingCycles(limit = 30): Promise<UpcomingCycle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_cycles")
    .select("*, subscriptions(name)")
    .in("status", ["upcoming", "current", "overdue"])
    .order("renewal_date", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => ({
    id: c.id,
    subscriptionId: c.subscription_id,
    subscriptionName: (c.subscriptions as unknown as { name: string } | null)?.name ?? "Abbonamento",
    periodStart: c.period_start,
    periodEnd: c.period_end,
    renewalDate: c.renewal_date,
    priceAtCycle: c.price_at_cycle,
    currency: c.currency,
    expectedTotal: c.expected_total,
    collectedTotal: c.collected_total,
    status: c.status,
  }));
}

export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isPro: false, status: "free", currentPeriodEnd: null, cancelAtPeriodEnd: false };

  const { data, error } = await supabase.rpc("get_current_entitlement", { p_user_id: user.id });
  if (error) throw new Error(error.message);
  const row = data?.[0];

  return {
    isPro: row?.is_pro ?? false,
    status: row?.status ?? "free",
    currentPeriodEnd: row?.current_period_end ?? null,
    cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
  };
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, label, method_type, is_default")
    .is("archived_at", null)
    .order("is_default", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => ({
    id: m.id,
    label: m.label,
    methodType: m.method_type as PaymentMethod["methodType"],
    isDefault: m.is_default,
  }));
}
