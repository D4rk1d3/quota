import type { ChargeStatus } from "./types";

export function formatEUR(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
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

export function daysUntil(targetIso: string, fromIso?: string): number {
  const from = fromIso ? new Date(fromIso + "T00:00:00") : new Date();
  const target = new Date(targetIso + "T00:00:00");
  const ms =
    Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function chargeStatusLabel(status: ChargeStatus): string {
  switch (status) {
    case "paid":
      return "Pagato";
    case "partial":
      return "Parziale";
    case "overdue":
      return "In ritardo";
    case "credit":
      return "Credito";
    case "scheduled":
      return "Da pagare";
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
