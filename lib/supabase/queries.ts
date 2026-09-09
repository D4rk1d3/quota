import "server-only";
import { createClient } from "@/lib/supabase/server";
import { centsToEuro } from "@/lib/adapters";
import type {
  ActivityItem,
  FundState,
  Member,
  MemberStatus,
  Payment,
  SpotifyPlan,
} from "@/lib/types";

// Fuso orario di riferimento per "oggi": l'admin e Spotify fatturano in
// Europe/Rome. Il server Next.js (es. Vercel) gira in UTC, quindi non si
// puo' usare new Date().toISOString() (sposterebbe la data vicino alla
// mezzanotte). Intl.DateTimeFormat con timeZone esplicito e' corretto a
// prescindere dal fuso del processo Node.
const BUSINESS_TIMEZONE = "Europe/Rome";

function todayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Aggiunge un mese a una data "YYYY-MM-DD" via aritmetica su stringa (nessun Date/fuso orario coinvolto). */
function addOneMonthToDateString(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${iso.slice(8, 10)}`;
}

function statusFromCoverage(isOverdue: boolean, coveredUntil: string, asOf: string): MemberStatus {
  if (isOverdue) return "in_ritardo";
  const days = Math.ceil(
    (new Date(coveredUntil + "T00:00:00").getTime() - new Date(asOf + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (days <= 7) return "in_scadenza";
  return "regolare";
}

export async function getSubscriptionPlan(): Promise<SpotifyPlan> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subscriptions").select("*").eq("active", true).single();
  if (error || !data) {
    throw new Error("Nessun piano Spotify attivo configurato");
  }
  return {
    planName: data.name,
    monthlyCost: centsToEuro(data.monthly_cost_cents),
    billingDay: data.billing_day,
    perMemberShare: centsToEuro(data.member_quota_cents),
    adminPaymentMethod: "bonifico",
  };
}

interface MembersWithCoverageResult {
  members: Member[];
  asOf: string;
}

export async function getMembersWithCoverage(): Promise<MembersWithCoverageResult> {
  const supabase = await createClient();
  const asOf = todayIso();

  const [{ data: coverage, error: covErr }, { data: memberRows, error: memErr }, { data: payments, error: payErr }] =
    await Promise.all([
      supabase.rpc("member_coverage_all", { p_as_of: asOf }),
      supabase.from("members").select("*").eq("active", true),
      supabase
        .from("payments")
        .select("member_id, amount_cents, paid_at, kind")
        .eq("kind", "payment")
        .order("paid_at", { ascending: false }),
    ]);

  if (covErr) throw new Error(covErr.message);
  if (memErr) throw new Error(memErr.message);
  if (payErr) throw new Error(payErr.message);

  const joinedAtByMember = new Map((memberRows ?? []).map((m) => [m.id, m.joined_at]));
  const lastPaymentByMember = new Map<string, { date: string; amount: number }>();
  for (const p of payments ?? []) {
    if (!lastPaymentByMember.has(p.member_id)) {
      lastPaymentByMember.set(p.member_id, { date: p.paid_at, amount: centsToEuro(p.amount_cents) });
    }
  }

  const members: Member[] = (coverage ?? []).map((c) => {
    const last = lastPaymentByMember.get(c.member_id);
    return {
      id: c.member_id,
      name: c.name,
      monthlyShare: centsToEuro(c.monthly_share_cents),
      coveredUntil: c.covered_until,
      lastPaymentDate: last?.date ?? null,
      lastPaymentAmount: last?.amount ?? null,
      status: statusFromCoverage(c.is_overdue, c.covered_until, asOf),
      joinedAt: joinedAtByMember.get(c.member_id) ?? asOf,
      color: c.color,
    };
  });

  return { members, asOf };
}

export async function getFundState(): Promise<FundState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fund_state", { p_as_of: todayIso() });
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) throw new Error("Impossibile calcolare lo stato del fondo");

  return {
    balance: centsToEuro(row.balance_cents),
    collectedThisCycle: centsToEuro(row.collected_this_cycle_cents),
    expectedThisCycle: centsToEuro(row.expected_this_cycle_cents),
    toRecover: centsToEuro(row.to_recover_cents),
    membersInGoodStanding: row.members_in_good_standing,
    totalMembers: row.total_members,
  };
}

export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [{ data: payments, error: payErr }, { data: notifications, error: notifErr }, { data: members }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("id, member_id, amount_cents, kind, paid_at, created_at, note")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("notifications")
        .select("id, member_id, type, created_at, body")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase.from("members").select("id, name"),
    ]);

  if (payErr) throw new Error(payErr.message);
  if (notifErr) throw new Error(notifErr.message);

  const nameById = new Map((members ?? []).map((m) => [m.id, m.name]));

  const paymentItems: ActivityItem[] = (payments ?? []).map((p) => {
    const name = nameById.get(p.member_id) ?? "Membro";
    let description: string;
    if (p.kind === "payment") description = `${name} ha pagato la quota`;
    else if (p.kind === "void") description = `Pagamento di ${name} annullato`;
    else description = `Rettifica sul pagamento di ${name}`;

    return {
      id: p.id,
      type: "payment",
      memberId: p.member_id,
      date: p.created_at.slice(0, 10),
      amount: centsToEuro(p.amount_cents),
      description,
    };
  });

  const notificationItems: ActivityItem[] = (notifications ?? []).map((n) => ({
    id: n.id,
    type: n.type === "charge_due" || n.type === "charge_reminder_3d" ? "charge" : "reminder",
    memberId: n.member_id ?? undefined,
    date: n.created_at.slice(0, 10),
    description: n.body,
  }));

  return [...paymentItems, ...notificationItems]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export interface MemberDetailResult {
  member: Member;
  payments: Payment[];
}

export async function getMemberDetail(id: string): Promise<MemberDetailResult | null> {
  const supabase = await createClient();
  const asOf = todayIso();

  const [{ data: memberRow, error: memErr }, { data: coverageRows, error: covErr }] = await Promise.all([
    supabase.from("members").select("*").eq("id", id).maybeSingle(),
    supabase.rpc("member_coverage", { p_member_id: id, p_as_of: asOf }),
  ]);

  if (memErr) throw new Error(memErr.message);
  if (!memberRow) return null;
  if (covErr) throw new Error(covErr.message);

  const coverage = coverageRows?.[0];

  const { data: paymentRows, error: payErr } = await supabase
    .from("payments")
    .select("id, amount_cents, kind, method, paid_at, note, created_at")
    .eq("member_id", id)
    .order("created_at", { ascending: false });
  if (payErr) throw new Error(payErr.message);

  const { data: allocRows, error: allocErr } = await supabase
    .from("coverage_allocations")
    .select("payment_id, cycle_date, amount_cents")
    .eq("member_id", id);
  if (allocErr) throw new Error(allocErr.message);

  const maxCycleByPayment = new Map<string, string>();
  for (const a of allocRows ?? []) {
    const current = maxCycleByPayment.get(a.payment_id);
    if (!current || a.cycle_date > current) maxCycleByPayment.set(a.payment_id, a.cycle_date);
  }

  const payments: Payment[] = (paymentRows ?? [])
    .filter((p) => p.kind === "payment")
    .map((p) => {
      const lastCycle = maxCycleByPayment.get(p.id);
      const coversUntil = lastCycle ? addOneMonthToDateString(lastCycle) : p.paid_at;
      return {
        id: p.id,
        memberId: id,
        amount: centsToEuro(p.amount_cents),
        date: p.paid_at,
        method: p.method!,
        note: p.note ?? undefined,
        coversUntil,
      };
    });

  const member: Member = {
    id: memberRow.id,
    name: memberRow.name,
    monthlyShare: centsToEuro(memberRow.monthly_share_cents),
    coveredUntil: coverage?.covered_until ?? asOf,
    lastPaymentDate: payments[0]?.date ?? null,
    lastPaymentAmount: payments[0]?.amount ?? null,
    status: coverage ? statusFromCoverage(coverage.is_overdue, coverage.covered_until, asOf) : "in_ritardo",
    joinedAt: memberRow.joined_at,
    color: memberRow.color,
  };

  return { member, payments };
}

export async function getAllPayments(): Promise<Payment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, member_id, amount_cents, kind, method, paid_at, note")
    .eq("kind", "payment")
    .order("paid_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    id: p.id,
    memberId: p.member_id,
    amount: centsToEuro(p.amount_cents),
    date: p.paid_at,
    method: p.method!,
    note: p.note ?? undefined,
    coversUntil: p.paid_at,
  }));
}
