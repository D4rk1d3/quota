"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  memberCreateSchema,
  memberIdSchema,
  memberUpdateSchema,
  type MemberCreateInput,
  type MemberUpdateInput,
} from "@/lib/validation";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createMember(input: MemberCreateInput): Promise<ActionResult<{ id: string }>> {
  const parsed = memberCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      color: parsed.data.color,
      monthly_share_cents: parsed.data.monthlyShareCents,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: "Impossibile aggiungere il membro." };

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
    .from("members")
    .update({
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.email !== undefined ? { email: rest.email } : {}),
      ...(rest.color !== undefined ? { color: rest.color } : {}),
      ...(rest.monthlyShareCents !== undefined ? { monthly_share_cents: rest.monthlyShareCents } : {}),
      ...(rest.active !== undefined ? { active: rest.active } : {}),
      ...(rest.notes !== undefined ? { notes: rest.notes } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Impossibile aggiornare il membro." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/** "Rimuovere" un membro disattiva il record: preserva lo storico pagamenti (FK RESTRICT). */
export async function deactivateMember(input: { id: string }): Promise<ActionResult> {
  const parsed = memberIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ID non valido" };

  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ active: false }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Impossibile rimuovere il membro." };

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
