import { describe, it, expect } from "vitest";
import {
  computeCoverageFromPayment,
  isoDate,
  getNextChargeDate,
  daysUntil,
  sortMembersByAttention,
  formatEUR,
} from "@/lib/domain";
import type { Member } from "@/lib/types";

describe("isoDate", () => {
  it("usa i componenti locali della data, non UTC", () => {
    // Regressione: toISOString() sposterebbe questa data al 4 ottobre nei
    // fusi orari avanti rispetto a UTC (es. Europe/Rome in ora legale).
    const d = new Date(2026, 9, 5); // 5 ottobre 2026, mezzanotte locale
    expect(isoDate(d)).toBe("2026-10-05");
  });

  it("aggiunge lo zero-padding a mese e giorno", () => {
    const d = new Date(2026, 0, 3); // 3 gennaio
    expect(isoDate(d)).toBe("2026-01-03");
  });
});

describe("getNextChargeDate", () => {
  it("restituisce lo stesso mese se il giorno di addebito non è ancora passato", () => {
    const from = new Date(2026, 8, 1); // 1 settembre
    const next = getNextChargeDate(5, from);
    expect(isoDate(next)).toBe("2026-09-05");
  });

  it("passa al mese successivo se il giorno di addebito è già passato", () => {
    const from = new Date(2026, 8, 9); // 9 settembre
    const next = getNextChargeDate(5, from);
    expect(isoDate(next)).toBe("2026-10-05");
  });

  it("include il giorno stesso dell'addebito come 'passato' (già avvenuto oggi)", () => {
    const from = new Date(2026, 8, 5); // 5 settembre, giorno di addebito
    const next = getNextChargeDate(5, from);
    expect(isoDate(next)).toBe("2026-10-05");
  });
});

describe("daysUntil", () => {
  it("calcola correttamente i giorni interi tra due date", () => {
    const from = new Date(2026, 8, 9);
    const target = new Date(2026, 9, 5);
    expect(daysUntil(target, from)).toBe(26);
  });

  it("restituisce 0 per la stessa data", () => {
    const d = new Date(2026, 8, 5);
    expect(daysUntil(d, d)).toBe(0);
  });
});

describe("computeCoverageFromPayment", () => {
  it("un pagamento esatto copre esattamente un ciclo", () => {
    const res = computeCoverageFromPayment("2026-09-05", 3.5, 3.5, "2026-08-20");
    expect(res.cyclesPaid).toBe(1);
    expect(res.isPartial).toBe(false);
    expect(isoDate(res.newCoveredUntil)).toBe("2026-10-05");
  });

  it("un pagamento doppio copre due cicli", () => {
    const res = computeCoverageFromPayment("2026-09-05", 7.0, 3.5, "2026-08-20");
    expect(res.cyclesPaid).toBe(2);
    expect(res.isPartial).toBe(false);
    expect(isoDate(res.newCoveredUntil)).toBe("2026-11-05");
  });

  it("un pagamento parziale non copre un ciclo intero", () => {
    const res = computeCoverageFromPayment("2026-08-05", 2.0, 3.5, "2026-08-20");
    expect(res.isPartial).toBe(true);
    expect(res.cyclesPaid).toBe(0);
  });

  it("estende da coveredUntil se il membro è già coperto oltre oggi", () => {
    const res = computeCoverageFromPayment("2026-11-05", 3.5, 3.5, "2026-08-20");
    expect(isoDate(res.newCoveredUntil)).toBe("2026-12-05");
  });

  it("riparte da oggi se il membro è scaduto (coveredUntil nel passato)", () => {
    const res = computeCoverageFromPayment("2026-06-05", 3.5, 3.5, "2026-08-20");
    expect(isoDate(res.newCoveredUntil)).toBe("2026-09-20");
  });
});

describe("sortMembersByAttention", () => {
  const base: Omit<Member, "id" | "status"> = {
    name: "X",
    monthlyShare: 3.5,
    coveredUntil: "2026-10-05",
    lastPaymentDate: null,
    lastPaymentAmount: null,
    joinedAt: "2025-01-01",
    color: "#000",
  };

  it("ordina in_ritardo, poi in_scadenza, poi regolare", () => {
    const members: Member[] = [
      { ...base, id: "a", status: "regolare" },
      { ...base, id: "b", status: "in_ritardo" },
      { ...base, id: "c", status: "in_scadenza" },
    ];
    const sorted = sortMembersByAttention(members);
    expect(sorted.map((m) => m.id)).toEqual(["b", "c", "a"]);
  });

  it("non muta l'array originale", () => {
    const members: Member[] = [
      { ...base, id: "a", status: "regolare" },
      { ...base, id: "b", status: "in_ritardo" },
    ];
    const original = [...members];
    sortMembersByAttention(members);
    expect(members).toEqual(original);
  });
});

describe("formatEUR", () => {
  it("formatta in stile italiano con simbolo euro", () => {
    expect(formatEUR(20.99)).toBe("20,99 €");
  });
});
