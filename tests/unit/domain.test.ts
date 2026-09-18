import { describe, it, expect } from "vitest";
import { daysUntil, formatEUR, chargeStatusLabel, initials } from "@/lib/domain";

describe("daysUntil", () => {
  it("calcola correttamente i giorni interi tra due date", () => {
    expect(daysUntil("2026-10-05", "2026-09-09")).toBe(26);
  });

  it("restituisce 0 per la stessa data", () => {
    expect(daysUntil("2026-08-05", "2026-08-05")).toBe(0);
  });

  it("usa 'oggi' come default quando non si passa una data di partenza", () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    expect(daysUntil(iso)).toBe(0);
  });
});

describe("formatEUR", () => {
  it("formatta in stile italiano con simbolo euro", () => {
    const result = formatEUR(20.99);
    expect(result).toContain("20,99");
    expect(result).toContain("€");
  });

  it("rispetta una valuta diversa da EUR", () => {
    expect(formatEUR(20, "USD")).toContain("20");
  });
});

describe("chargeStatusLabel", () => {
  it("restituisce un'etichetta per ogni stato", () => {
    expect(chargeStatusLabel("paid")).toBe("Pagato");
    expect(chargeStatusLabel("overdue")).toBe("In ritardo");
    expect(chargeStatusLabel("scheduled")).toBe("Da pagare");
  });
});

describe("initials", () => {
  it("prende le iniziali di nome e cognome", () => {
    expect(initials("Giulia Ferraro")).toBe("GF");
  });

  it("gestisce un solo nome", () => {
    expect(initials("Giulia")).toBe("G");
  });
});
