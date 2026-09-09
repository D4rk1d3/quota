"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateSubscriptionSchema, type UpdateSubscriptionInput } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/members";

export async function updateSubscription(input: UpdateSubscriptionInput): Promise<ActionResult> {
  const parsed = updateSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      monthly_cost_cents: parsed.data.monthlyCostCents,
      billing_day: parsed.data.billingDay,
      member_quota_cents: parsed.data.memberQuotaCents,
    })
    .eq("active", true);

  if (error) return { ok: false, error: "Impossibile salvare le impostazioni del piano." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
