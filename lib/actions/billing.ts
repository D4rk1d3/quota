"use server";

import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import type { ActionResult } from "@/lib/actions/types";

/**
 * Crea una sessione di checkout LemonSqueezy per passare al piano Pro.
 * custom.user_id nel checkout e' cio' che l'Edge Function
 * lemonsqueezy-webhook userà per collegare l'evento all'entitlement giusto
 * (vedi supabase/functions/lemonsqueezy-webhook).
 */
export async function createCheckoutSession(): Promise<ActionResult<{ url: string }>> {
  const env = getServerEnv();
  if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID || !env.LEMONSQUEEZY_VARIANT_ID) {
    return {
      ok: false,
      error:
        "Pagamenti non ancora configurati: crea un account LemonSqueezy e imposta LEMONSQUEEZY_API_KEY/STORE_ID/VARIANT_ID.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Devi essere autenticato." };

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            custom: { user_id: user.id },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/impostazioni?upgraded=1`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: env.LEMONSQUEEZY_VARIANT_ID } },
        },
      },
    }),
  });

  if (!res.ok) {
    return { ok: false, error: "Impossibile avviare il checkout. Riprova più tardi." };
  }

  const body = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = body.data?.attributes?.url;
  if (!url) return { ok: false, error: "Risposta inattesa dal servizio di pagamento." };

  return { ok: true, data: { url } };
}
