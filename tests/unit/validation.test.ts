import { describe, it, expect } from "vitest";
import {
  memberCreateSchema,
  recordPaymentSchema,
  voidPaymentSchema,
  adjustPaymentSchema,
  updateSubscriptionSchema,
} from "@/lib/validation";

describe("memberCreateSchema", () => {
  it("accetta un nome valido", () => {
    const res = memberCreateSchema.safeParse({ name: "Giulia Ferraro" });
    expect(res.success).toBe(true);
  });

  it("rifiuta un nome troppo corto", () => {
    const res = memberCreateSchema.safeParse({ name: "G" });
    expect(res.success).toBe(false);
  });

  it("rifiuta un colore in formato non esadecimale", () => {
    const res = memberCreateSchema.safeParse({ name: "Giulia Ferraro", color: "verde" });
    expect(res.success).toBe(false);
  });
});

describe("recordPaymentSchema", () => {
  const base = {
    memberId: "11111111-1111-4111-8111-111111111111",
    amountCents: 350,
    method: "revolut" as const,
    paidAt: "2026-09-09",
  };

  it("accetta un pagamento valido in centesimi interi", () => {
    expect(recordPaymentSchema.safeParse(base).success).toBe(true);
  });

  it("rifiuta importi non interi (centesimi frazionari)", () => {
    const res = recordPaymentSchema.safeParse({ ...base, amountCents: 3.5 });
    expect(res.success).toBe(false);
  });

  it("rifiuta importi negativi o zero", () => {
    expect(recordPaymentSchema.safeParse({ ...base, amountCents: 0 }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ ...base, amountCents: -350 }).success).toBe(false);
  });

  it("rifiuta un metodo di pagamento non ammesso", () => {
    const res = recordPaymentSchema.safeParse({ ...base, method: "paypal" });
    expect(res.success).toBe(false);
  });

  it("rifiuta una data non in formato yyyy-mm-dd", () => {
    const res = recordPaymentSchema.safeParse({ ...base, paidAt: "09/09/2026" });
    expect(res.success).toBe(false);
  });

  it("rifiuta un memberId che non è un uuid", () => {
    const res = recordPaymentSchema.safeParse({ ...base, memberId: "non-un-uuid" });
    expect(res.success).toBe(false);
  });
});

describe("voidPaymentSchema", () => {
  it("richiede una nota non vuota per annullare un pagamento", () => {
    const res = voidPaymentSchema.safeParse({
      paymentId: "11111111-1111-4111-8111-111111111111",
      note: "",
    });
    expect(res.success).toBe(false);
  });

  it("accetta un annullamento con nota valida", () => {
    const res = voidPaymentSchema.safeParse({
      paymentId: "11111111-1111-4111-8111-111111111111",
      note: "importo sbagliato",
    });
    expect(res.success).toBe(true);
  });
});

describe("adjustPaymentSchema", () => {
  const base = { paymentId: "11111111-1111-4111-8111-111111111111", note: "correzione" };

  it("accetta un delta positivo o negativo, purché diverso da zero", () => {
    expect(adjustPaymentSchema.safeParse({ ...base, deltaCents: 100 }).success).toBe(true);
    expect(adjustPaymentSchema.safeParse({ ...base, deltaCents: -100 }).success).toBe(true);
  });

  it("rifiuta un delta pari a zero", () => {
    const res = adjustPaymentSchema.safeParse({ ...base, deltaCents: 0 });
    expect(res.success).toBe(false);
  });
});

describe("updateSubscriptionSchema", () => {
  it("accetta i valori di default del piano Spotify Family", () => {
    const res = updateSubscriptionSchema.safeParse({
      monthlyCostCents: 2099,
      billingDay: 5,
      memberQuotaCents: 350,
    });
    expect(res.success).toBe(true);
  });

  it("rifiuta un giorno di addebito fuori range (>28)", () => {
    const res = updateSubscriptionSchema.safeParse({
      monthlyCostCents: 2099,
      billingDay: 31,
      memberQuotaCents: 350,
    });
    expect(res.success).toBe(false);
  });
});
