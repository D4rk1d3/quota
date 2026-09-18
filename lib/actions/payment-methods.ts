"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { paymentMethodCreateSchema, type PaymentMethodCreateInput } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

export async function createPaymentMethod(
  input: PaymentMethodCreateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = paymentMethodCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Devi essere autenticato." };

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      organizer_id: user.id,
      label: parsed.data.label,
      method_type: parsed.data.methodType,
      is_default: parsed.data.isDefault ?? false,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Impossibile aggiungere il metodo di pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function archivePaymentMethod(input: { id: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", input.id);
  if (error) return { ok: false, error: "Impossibile rimuovere il metodo di pagamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
