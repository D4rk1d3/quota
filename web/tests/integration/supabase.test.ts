// Test di integrazione contro il progetto Supabase reale (vedi
// NEXT_PUBLIC_SUPABASE_URL in .env.local). Nessun dato mock: verificano il
// comportamento vero di RLS e delle funzioni RPC sul progetto multi-tenant
// (nsxgzemqcsetxggmujdc).
//
// Il blocco "operazioni admin" richiede SUPABASE_SERVICE_ROLE_KEY (non
// presente in .env.local per scelta di sicurezza — l'app Next.js non ne ha
// bisogno). Per eseguirlo in locale:
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> npm run test:integration
// Senza la variabile, quel blocco viene saltato (skip), non fallisce.

import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

describe.skipIf(!url || !anonKey)("RLS — accesso anonimo", () => {
  it("anon non può leggere gli abbonamenti di nessuno", async () => {
    const anon = createClient<Database>(url, anonKey);
    const { data, error } = await anon.from("subscriptions").select("*");
    // Con RLS (organizer_id = auth.uid(), null per anon) ci si aspetta un
    // array vuoto oppure un errore di permessi — mai dati reali.
    if (error) {
      expect(error.code === "42501" || error.message.length > 0).toBe(true);
    } else {
      expect(data).toEqual([]);
    }
  });

  it("anon non può registrare un pagamento via RPC", async () => {
    const anon = createClient<Database>(url, anonKey);
    const { error } = await anon.rpc("record_payment", {
      p_charge_id: "00000000-0000-0000-0000-000000000000",
      p_amount: 3.5,
    });
    expect(error).not.toBeNull();
  });
});

describe.skipIf(!serviceRoleKey || !adminEmail)("Operazioni admin (service_role)", () => {
  // Chiave placeholder quando il blocco e' skippato: il client non viene
  // mai usato (describe.skipIf salta gli `it`, non l'inizializzazione),
  // ma createClient() lancia se la key e' una stringa vuota.
  const admin = createClient<Database>(url, serviceRoleKey ?? "placeholder-not-used", {
    auth: { persistSession: false },
  });

  async function createTestSubscription(organizerId: string) {
    const { data: sub, error } = await admin
      .from("subscriptions")
      .insert({
        organizer_id: organizerId,
        name: "Integration Test Subscription",
        current_price: 20,
        billing_frequency: "monthly",
        share_type: "equal",
        start_date: "2026-01-05",
        next_renewal_date: "2026-02-05",
      })
      .select("id")
      .single();
    if (error || !sub) throw error ?? new Error("insert subscription fallito");
    return sub.id;
  }

  async function cleanupSubscription(subscriptionId: string) {
    await admin.from("subscriptions").delete().eq("id", subscriptionId);
  }

  it("record_payment + reverse_payment: ciclo completo con audit trail", async () => {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", adminEmail!.toLowerCase())
      .single();
    expect(profile, "serve un profilo reale (primo login già avvenuto)").toBeTruthy();

    const subscriptionId = await createTestSubscription(profile!.id);

    try {
      const { data: member, error: memberErr } = await admin
        .from("subscription_members")
        .insert({ subscription_id: subscriptionId, name: "Integration Test Member" })
        .select("id")
        .single();
      expect(memberErr).toBeNull();

      const { data: cycleId, error: cycleErr } = await admin.rpc("generate_billing_cycle", {
        p_subscription_id: subscriptionId,
        p_period_start: "2026-01-05",
      });
      expect(cycleErr).toBeNull();

      const { data: charge, error: chargeErr } = await admin
        .from("member_charges")
        .select("id, expected_amount")
        .eq("billing_cycle_id", cycleId!)
        .eq("member_id", member!.id)
        .single();
      expect(chargeErr).toBeNull();

      const { data: paymentId, error: payErr } = await admin.rpc("record_payment", {
        p_charge_id: charge!.id,
        p_amount: charge!.expected_amount,
      });
      expect(payErr).toBeNull();

      const { data: chargeAfterPay } = await admin
        .from("v_member_charges")
        .select("charge_status")
        .eq("id", charge!.id)
        .single();
      expect(chargeAfterPay?.charge_status).toBe("paid");

      const { error: reverseErr } = await admin.rpc("reverse_payment", {
        p_payment_id: paymentId!,
        p_reason: "integration test cleanup",
      });
      expect(reverseErr).toBeNull();

      const { data: chargeAfterReverse } = await admin
        .from("v_member_charges")
        .select("charge_status")
        .eq("id", charge!.id)
        .single();
      expect(chargeAfterReverse?.charge_status).toBe("scheduled");

      const { data: ledger } = await admin
        .from("payments")
        .select("status")
        .eq("charge_id", charge!.id);
      expect(ledger).toHaveLength(1);
      expect(ledger?.[0].status).toBe("reversed");
    } finally {
      await cleanupSubscription(subscriptionId);
    }
  });

  it("reverse_payment rifiuta di stornare due volte lo stesso pagamento", async () => {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", adminEmail!.toLowerCase())
      .single();
    const subscriptionId = await createTestSubscription(profile!.id);

    try {
      const { data: member } = await admin
        .from("subscription_members")
        .insert({ subscription_id: subscriptionId, name: "Double Reverse Test" })
        .select("id")
        .single();

      const { data: cycleId } = await admin.rpc("generate_billing_cycle", {
        p_subscription_id: subscriptionId,
        p_period_start: "2026-01-05",
      });
      const { data: charge } = await admin
        .from("member_charges")
        .select("id, expected_amount")
        .eq("billing_cycle_id", cycleId!)
        .eq("member_id", member!.id)
        .single();

      const { data: paymentId } = await admin.rpc("record_payment", {
        p_charge_id: charge!.id,
        p_amount: charge!.expected_amount,
      });

      const first = await admin.rpc("reverse_payment", { p_payment_id: paymentId!, p_reason: "primo storno" });
      expect(first.error).toBeNull();

      const second = await admin.rpc("reverse_payment", { p_payment_id: paymentId!, p_reason: "secondo storno" });
      expect(second.error).not.toBeNull();
    } finally {
      await cleanupSubscription(subscriptionId);
    }
  });
});
