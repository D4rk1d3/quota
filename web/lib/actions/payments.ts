"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  recordPaymentSchema,
  reversePaymentSchema,
  type RecordPaymentInput,
  type ReversePaymentInput,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_payment", {
    p_charge_id: parsed.data.chargeId,
    p_amount: parsed.data.amount,
    p_payment_method_id: parsed.data.paymentMethodId,
    p_paid_at: parsed.data.paidAt,
    p_note: parsed.data.note,
  });

  if (error || !data) return { ok: false, error: "Impossibile registrare il pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data } };
}

export async function reversePayment(input: ReversePaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = reversePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reverse_payment", {
    p_payment_id: parsed.data.paymentId,
    p_reason: parsed.data.reason,
  });

  if (error || !data) return { ok: false, error: "Impossibile stornare il pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data } };
}
