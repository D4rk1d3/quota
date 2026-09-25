import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { FREE_TIER_LIMITS } from "@/lib/types";

/**
 * Gating lato server del tier gratuito: un utente senza entitlement "pro"
 * puo' avere al massimo FREE_TIER_LIMITS.maxSubscriptions abbonamenti e
 * FREE_TIER_LIMITS.maxMembersPerSubscription membri per abbonamento.
 * Ritorna un messaggio d'errore se il limite e' superato, altrimenti null.
 */
export async function checkFreeTierLimit(
  supabase: SupabaseClient<Database>,
  kind: "subscription" | "member",
  subscriptionId?: string
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Devi essere autenticato.";

  const { data: entitlementRows } = await supabase.rpc("get_current_entitlement", {
    p_user_id: user.id,
  });
  const isPro = entitlementRows?.[0]?.is_pro ?? false;
  if (isPro) return null;

  if (kind === "subscription") {
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .neq("status", "archived");
    if ((count ?? 0) >= FREE_TIER_LIMITS.maxSubscriptions) {
      return `Il piano gratuito include al massimo ${FREE_TIER_LIMITS.maxSubscriptions} abbonamento/i attivo/i. Passa a Pro per continuare.`;
    }
    return null;
  }

  const { count } = await supabase
    .from("subscription_members")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", subscriptionId!)
    .neq("status", "removed");
  if ((count ?? 0) >= FREE_TIER_LIMITS.maxMembersPerSubscription) {
    return `Il piano gratuito include al massimo ${FREE_TIER_LIMITS.maxMembersPerSubscription} membri per abbonamento. Passa a Pro per continuare.`;
  }
  return null;
}
