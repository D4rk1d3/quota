"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkFreeTierLimit } from "@/lib/actions/entitlements";
import {
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  type SubscriptionCreateInput,
  type SubscriptionUpdateInput,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

export async function createSubscription(
  input: SubscriptionCreateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = subscriptionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();

  const limitError = await checkFreeTierLimit(supabase, "subscription");
  if (limitError) return { ok: false, error: limitError };

  const { data, error } = await supabase.rpc("add_billing_period", {
    p_date: parsed.data.startDate,
    p_frequency: parsed.data.billingFrequency,
    p_interval: parsed.data.billingInterval,
  });
  if (error || !data) return { ok: false, error: "Impossibile calcolare la data di rinnovo." };

  const { data: sub, error: insertErr } = await supabase
    .from("subscriptions")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
      current_price: parsed.data.currentPrice,
      billing_frequency: parsed.data.billingFrequency,
      billing_interval: parsed.data.billingInterval,
      share_type: parsed.data.shareType,
      start_date: parsed.data.startDate,
      next_renewal_date: data,
      organizer_id: (await supabase.auth.getUser()).data.user!.id,
    })
    .select("id")
    .single();

  if (insertErr || !sub) return { ok: false, error: "Impossibile creare l'abbonamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: sub.id } };
}

export async function updateSubscription(input: SubscriptionUpdateInput): Promise<ActionResult> {
  const parsed = subscriptionUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  const { id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.description !== undefined ? { description: rest.description } : {}),
      ...(rest.currentPrice !== undefined ? { current_price: rest.currentPrice } : {}),
      ...(rest.status !== undefined ? { status: rest.status } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Impossibile aggiornare l'abbonamento." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/** Genera (o riusa se esiste già) il ciclo di fatturazione per una data di inizio periodo. */
export async function generateBillingCycle(input: {
  subscriptionId: string;
  periodStart: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_billing_cycle", {
    p_subscription_id: input.subscriptionId,
    p_period_start: input.periodStart,
  });
  if (error || !data) return { ok: false, error: "Impossibile generare il ciclo di fatturazione." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data } };
}
