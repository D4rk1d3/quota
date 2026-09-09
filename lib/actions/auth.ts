"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";

const emailSchema = z.string().trim().email("Inserisci un indirizzo email valido");

export type SendMagicLinkState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

export async function sendMagicLink(
  _prev: SendMagicLinkState,
  formData: FormData
): Promise<SendMagicLinkState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const email = parsed.data.toLowerCase();
  const { ADMIN_EMAIL } = getServerEnv();

  // Prima verifica applicativa (oltre alla RLS/trigger DB): evita anche di
  // fare la roundtrip verso Supabase per indirizzi chiaramente non admin.
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    return {
      status: "error",
      message: "Questa è un'app privata: l'accesso è riservato all'amministratore.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: "Impossibile inviare il link. Riprova." };
  }

  return { status: "sent", message: `Link di accesso inviato a ${email}.` };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
