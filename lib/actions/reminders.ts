"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createReminderSchema, type CreateReminderInput } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

/** Registra un promemoria "copy": il testo va copiato/inviato manualmente
 * dall'organizzatore (nessun invio automatico via email/push per ora), ma
 * teniamo traccia che è stato mandato. */
export async function recordReminderSent(input: CreateReminderInput): Promise<ActionResult<{ id: string }>> {
  const parsed = createReminderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Devi essere autenticato." };

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      organizer_id: user.id,
      member_id: parsed.data.memberId,
      charge_id: parsed.data.chargeId ?? null,
      message: parsed.data.message,
      channel: "copy",
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Impossibile registrare il promemoria." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}
