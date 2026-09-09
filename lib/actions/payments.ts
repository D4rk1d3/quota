"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  adjustPaymentSchema,
  recordPaymentSchema,
  voidPaymentSchema,
  type AdjustPaymentInput,
  type RecordPaymentInput,
  type VoidPaymentInput,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/members";

/**
 * Registra un pagamento e alloca l'importo sui cicli mensili in una singola
 * transazione atomica (RPC public.record_payment: INSERT payments + INSERT
 * coverage_allocations nello stesso statement plpgsql).
 */
export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_payment", {
    p_member_id: parsed.data.memberId,
    p_amount_cents: parsed.data.amountCents,
    p_method: parsed.data.method,
    p_paid_at: parsed.data.paidAt,
    p_note: parsed.data.note,
  });

  if (error) return { ok: false, error: "Impossibile registrare il pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

/** Annulla un pagamento registrando uno storno esplicito (mai una modifica silenziosa). */
export async function voidPayment(input: VoidPaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = voidPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("void_payment", {
    p_payment_id: parsed.data.paymentId,
    p_note: parsed.data.note,
  });

  if (error) return { ok: false, error: "Impossibile annullare il pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

/** Rettifica esplicita di un pagamento (delta positivo o negativo) con nota obbligatoria. */
export async function adjustPayment(input: AdjustPaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = adjustPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_payment", {
    p_payment_id: parsed.data.paymentId,
    p_delta_cents: parsed.data.deltaCents,
    p_note: parsed.data.note,
  });

  if (error) return { ok: false, error: "Impossibile rettificare il pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}
