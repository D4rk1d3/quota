// Quota — webhook LemonSqueezy: aggiorna public.entitlements in base agli
// eventi subscription_* dello store. Inerte finche' LEMONSQUEEZY_WEBHOOK_SECRET
// non e' configurato (nessuna verifica possibile => 501, nessun effetto).
//
// Setup atteso lato LemonSqueezy: Settings > Webhooks, URL di questa
// funzione, eventi subscription_created/updated/cancelled/resumed/expired/
// paused, e il "Signing secret" salvato come secret Supabase:
//   npx supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=whsec_...
//
// custom_data.user_id nel payload (echeggiato da checkout_data.custom
// impostato in lib/actions/billing.ts) collega l'evento all'utente giusto.

import { createClient } from "jsr:@supabase/supabase-js@2";

interface LemonSqueezySubscriptionAttributes {
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  product_id: number;
  variant_id: number;
  customer_id: number;
  cancelled: boolean;
}

async function verifySignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function mapEntitlementStatus(lsStatus: string): "free" | "active" | "past_due" | "cancelled" | "expired" {
  switch (lsStatus) {
    case "active":
    case "on_trial":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
    case "paused":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "free";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
  if (!secret) {
    return Response.json({ ok: false, warning: "LEMONSQUEEZY_WEBHOOK_SECRET non configurato" }, { status: 501 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature");
  const valid = await verifySignature(rawBody, signature, secret);
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const payload = JSON.parse(rawBody) as {
    meta: { event_name: string; custom_data?: { user_id?: string } };
    data: { id: string; attributes: LemonSqueezySubscriptionAttributes };
  };

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const eventId = `${payload.meta.event_name}:${payload.data.id}`;

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "lemonsqueezy")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    return Response.json({ ok: true, deduped: true });
  }

  await supabase.from("webhook_events").insert({
    provider: "lemonsqueezy",
    event_id: eventId,
    event_type: payload.meta.event_name,
    payload: payload as unknown as Record<string, unknown>,
  });

  const userId = payload.meta.custom_data?.user_id;
  if (!userId || !payload.meta.event_name.startsWith("subscription_")) {
    return Response.json({ ok: true, skipped: "nessun user_id o evento non gestito" });
  }

  const attrs = payload.data.attributes;

  const { error: upsertErr } = await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      provider: "lemonsqueezy",
      customer_id: String(attrs.customer_id),
      provider_subscription_id: payload.data.id,
      product_id: String(attrs.product_id),
      variant_id: String(attrs.variant_id),
      status: mapEntitlementStatus(attrs.status),
      current_period_end: attrs.renews_at ?? attrs.ends_at,
      cancel_at_period_end: attrs.cancelled,
    },
    { onConflict: "user_id" }
  );

  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString(), error: upsertErr?.message ?? null })
    .eq("provider", "lemonsqueezy")
    .eq("event_id", eventId);

  if (upsertErr) return Response.json({ ok: false, error: upsertErr.message }, { status: 500 });
  return Response.json({ ok: true });
});
