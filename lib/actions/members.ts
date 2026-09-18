"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkFreeTierLimit } from "@/lib/actions/entitlements";
import {
  memberCreateSchema,
  memberUpdateSchema,
  type MemberCreateInput,
  type MemberUpdateInput,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

export async function createMember(input: MemberCreateInput): Promise<ActionResult<{ id: string }>> {
  const parsed = memberCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();

  const limitError = await checkFreeTierLimit(supabase, "member", parsed.data.subscriptionId);
  if (limitError) return { ok: false, error: limitError };

  const { data, error } = await supabase
    .from("subscription_members")
    .insert({
      subscription_id: parsed.data.subscriptionId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      avatar_color: parsed.data.avatarColor,
      default_share: parsed.data.defaultShare,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Impossibile aggiungere il membro." };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function updateMember(input: MemberUpdateInput): Promise<ActionResult> {
  const parsed = memberUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  const { id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscription_members")
    .update({
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.email !== undefined ? { email: rest.email || null } : {}),
      ...(rest.phone !== undefined ? { phone: rest.phone || null } : {}),
      ...(rest.defaultShare !== undefined ? { default_share: rest.defaultShare } : {}),
      ...(rest.status !== undefined ? { status: rest.status } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Impossibile aggiornare il membro." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/** "Rimuovere" un membro lo segna come removed: preserva lo storico pagamenti (FK). */
export async function removeMember(input: { id: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscription_members")
    .update({ status: "removed", left_at: new Date().toISOString() })
    .eq("id", input.id);
  if (error) return { ok: false, error: "Impossibile rimuovere il membro." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
