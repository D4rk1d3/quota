// Test di integrazione contro il progetto Supabase reale (vedi
// NEXT_PUBLIC_SUPABASE_URL in .env.local). Nessun dato mock: verificano il
// comportamento vero di RLS e delle funzioni RPC.
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
  it("anon non può leggere i membri", async () => {
    const anon = createClient<Database>(url, anonKey);
    const { data, error } = await anon.from("members").select("*");
    // Con RLS + grant negati, ci si aspetta un array vuoto oppure un errore
    // di permessi — mai dati reali.
    if (error) {
      expect(error.code === "42501" || error.message.length > 0).toBe(true);
    } else {
      expect(data).toEqual([]);
    }
  });

  it("anon non può registrare un pagamento via RPC", async () => {
    const anon = createClient<Database>(url, anonKey);
    const { error } = await anon.rpc("record_payment", {
      p_member_id: "00000000-0000-0000-0000-000000000000",
      p_amount_cents: 350,
      p_method: "revolut",
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

  it("record_payment + member_coverage + void_payment: ciclo completo con audit trail", async () => {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", adminEmail!.toLowerCase())
      .single();
    expect(profile, "serve un profilo admin reale (primo login già avvenuto)").toBeTruthy();

    const { data: member, error: memberErr } = await admin
      .from("members")
      .insert({ name: "Integration Test Member", monthly_share_cents: 350 })
      .select("id")
      .single();
    expect(memberErr).toBeNull();
    const memberId = member!.id;

    try {
      const { data: payment, error: payErr } = await admin.rpc("record_payment", {
        p_member_id: memberId,
        p_amount_cents: 350,
        p_method: "revolut",
        p_note: "integration test",
      });
      expect(payErr).toBeNull();

      const { data: coverage } = await admin.rpc("member_coverage", { p_member_id: memberId });
      expect(coverage?.[0].fully_covered_cycles).toBe(1);
      expect(coverage?.[0].is_overdue).toBe(false);

      const { error: voidErr } = await admin.rpc("void_payment", {
        p_payment_id: (payment as { id: string }).id,
        p_note: "integration test cleanup",
      });
      expect(voidErr).toBeNull();

      const { data: coverageAfterVoid } = await admin.rpc("member_coverage", { p_member_id: memberId });
      expect(coverageAfterVoid?.[0].fully_covered_cycles).toBe(0);

      const { data: ledger } = await admin
        .from("payments")
        .select("kind")
        .eq("member_id", memberId)
        .order("created_at");
      expect(ledger?.map((p) => p.kind)).toEqual(["payment", "void"]);
    } finally {
      await admin.from("coverage_allocations").delete().eq("member_id", memberId);
      await admin.from("payments").delete().eq("member_id", memberId);
      await admin.from("members").delete().eq("id", memberId);
    }
  });

  it("void_payment rifiuta di annullare due volte lo stesso pagamento", async () => {
    const { data: member } = await admin
      .from("members")
      .insert({ name: "Double Void Test", monthly_share_cents: 350 })
      .select("id")
      .single();
    const memberId = member!.id;

    try {
      const { data: payment } = await admin.rpc("record_payment", {
        p_member_id: memberId,
        p_amount_cents: 350,
        p_method: "contanti",
      });
      const paymentId = (payment as { id: string }).id;

      const first = await admin.rpc("void_payment", { p_payment_id: paymentId, p_note: "primo annullamento" });
      expect(first.error).toBeNull();

      const second = await admin.rpc("void_payment", { p_payment_id: paymentId, p_note: "secondo annullamento" });
      expect(second.error).not.toBeNull();
    } finally {
      await admin.from("coverage_allocations").delete().eq("member_id", memberId);
      await admin.from("payments").delete().eq("member_id", memberId);
      await admin.from("members").delete().eq("id", memberId);
    }
  });
});
