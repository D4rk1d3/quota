import type { Member, MemberStatus } from "./types";

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return new Intl.DateTimeFormat(
    "it-IT",
    opts ?? { day: "numeric", month: "long", year: "numeric" }
  ).format(d);
}

export function formatDateShort(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short" });
}

/**
 * Giorno, mese e anno (es. "5 gennaio 2027"). Le date di copertura possono
 * cadere in anni diversi da quello corrente (pagamenti multi-mese/anno in
 * anticipo): l'anno va sempre mostrato per evitare ambiguità.
 */
export function formatDayMonth(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "long", year: "numeric" });
}

/** Prossima data di addebito Spotify a partire da "oggi". */
export function getNextChargeDate(billingDay: number, from: Date = new Date()): Date {
  const next = new Date(from.getFullYear(), from.getMonth(), billingDay);
  if (next.getTime() <= stripTime(from).getTime()) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  const ms = stripTime(target).getTime() - stripTime(from).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Data locale in formato yyyy-mm-dd. Usa i componenti locali del Date, MAI
 * toISOString() (che converte in UTC e sposta il giorno per i fusi orari
 * avanti rispetto a UTC, es. Europe/Rome).
 */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Calcola la data di copertura successiva dato un pagamento a partire da una data base. */
export function addBillingCycles(fromIso: string, cycles: number): Date {
  const d = new Date(fromIso + "T00:00:00");
  d.setMonth(d.getMonth() + cycles);
  return d;
}

export function computeCoverageFromPayment(
  currentCoveredUntilIso: string,
  amount: number,
  monthlyShare: number,
  todayIso: string
): { newCoveredUntil: Date; cyclesPaid: number; isPartial: boolean } {
  const cyclesPaidRaw = amount / monthlyShare;
  const cyclesPaid = Math.floor(cyclesPaidRaw + 1e-6);
  const isPartial = cyclesPaidRaw < 1;
  // Se il membro è già coperto oltre oggi, si estende da lì; altrimenti da oggi.
  const base =
    new Date(currentCoveredUntilIso) > new Date(todayIso)
      ? currentCoveredUntilIso
      : todayIso;
  const newCoveredUntil = addBillingCycles(base, Math.max(cyclesPaid, isPartial ? 0 : 1));
  return { newCoveredUntil, cyclesPaid, isPartial };
}

export function statusLabel(status: MemberStatus): string {
  switch (status) {
    case "regolare":
      return "In regola";
    case "in_scadenza":
      return "In scadenza";
    case "in_ritardo":
      return "In ritardo";
  }
}

export function sortMembersByAttention(members: Member[]): Member[] {
  const order: Record<MemberStatus, number> = {
    in_ritardo: 0,
    in_scadenza: 1,
    regolare: 2,
  };
  return [...members].sort((a, b) => order[a.status] - order[b.status]);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
