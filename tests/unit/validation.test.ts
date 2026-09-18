import { describe, it, expect } from "vitest";
import {
  memberCreateSchema,
  recordPaymentSchema,
  reversePaymentSchema,
  subscriptionCreateSchema,
} from "@/lib/validation";

describe("memberCreateSchema", () => {
  const subscriptionId = "11111111-1111-4111-8111-111111111111";

  it("accetta un nome valido", () => {
    const res = memberCreateSchema.safeParse({ subscriptionId, name: "Giulia Ferraro" });
    expect(res.success).toBe(true);
  });

  it("rifiuta un nome vuoto", () => {
    const res = memberCreateSchema.safeParse({ subscriptionId, name: "" });
    expect(res.success).toBe(false);
  });

  it("rifiuta un colore in formato non esadecimale", () => {
    const res = memberCreateSchema.safeParse({ subscriptionId, name: "Giulia Ferraro", avatarColor: "verde" });
    expect(res.success).toBe(false);
  });

  it("rifiuta un subscriptionId che non è un uuid", () => {
    const res = memberCreateSchema.safeParse({ subscriptionId: "non-un-uuid", name: "Giulia" });
    expect(res.success).toBe(false);
  });
});

describe("recordPaymentSchema", () => {
  const base = {
    chargeId: "11111111-1111-4111-8111-111111111111",
    amount: 19.99,
  };

  it("accetta un pagamento valido", () => {
    expect(recordPaymentSchema.safeParse(base).success).toBe(true);
  });

  it("rifiuta importi negativi o zero", () => {
    expect(recordPaymentSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ ...base, amount: -10 }).success).toBe(false);
  });

  it("rifiuta un chargeId che non è un uuid", () => {
    const res = recordPaymentSchema.safeParse({ ...base, chargeId: "non-un-uuid" });
    expect(res.success).toBe(false);
  });
});

describe("reversePaymentSchema", () => {
  it("richiede un motivo non vuoto per stornare un pagamento", () => {
    const res = reversePaymentSchema.safeParse({
      paymentId: "11111111-1111-4111-8111-111111111111",
      reason: "",
    });
    expect(res.success).toBe(false);
  });

  it("accetta uno storno con motivo valido", () => {
    const res = reversePaymentSchema.safeParse({
      paymentId: "11111111-1111-4111-8111-111111111111",
      reason: "importo sbagliato",
    });
    expect(res.success).toBe(true);
  });
});

describe("subscriptionCreateSchema", () => {
  const base = {
    name: "Netflix",
    currentPrice: 19.99,
    billingFrequency: "monthly" as const,
    shareType: "equal" as const,
    startDate: "2026-09-01",
  };

  it("accetta un abbonamento valido", () => {
    expect(subscriptionCreateSchema.safeParse(base).success).toBe(true);
  });

  it("rifiuta un prezzo non positivo", () => {
    expect(subscriptionCreateSchema.safeParse({ ...base, currentPrice: 0 }).success).toBe(false);
  });

  it("rifiuta una frequenza non ammessa", () => {
    const res = subscriptionCreateSchema.safeParse({ ...base, billingFrequency: "weekly" });
    expect(res.success).toBe(false);
  });
});
