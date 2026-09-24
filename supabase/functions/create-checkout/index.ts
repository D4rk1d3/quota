// Crea una sessione di checkout LemonSqueezy per l'utente autenticato.
// La API key resta qui (secret Supabase): i client nativi non la vedono mai.
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  const storeId = Deno.env.get("LEMONSQUEEZY_STORE_ID");
  const variantId = Deno.env.get("LEMONSQUEEZY_VARIANT_ID");
  if (!apiKey || !storeId || !variantId) return json({ error: "billing_not_configured" }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: { checkout_data: { email: user.email, custom: { user_id: user.id } } },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });
  if (!res.ok) return json({ error: "checkout_failed" }, 502);

  const body = await res.json();
  const url = body?.data?.attributes?.url;
  if (!url) return json({ error: "unexpected_response" }, 502);
  return json({ url });
});
