"use client";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/billing";
import { FREE_TIER_LIMITS, type Entitlement } from "@/lib/types";
import { formatDate } from "@/lib/domain";
import { Sparkles } from "lucide-react";

const STATUS_LABEL: Record<Entitlement["status"], string> = {
  free: "Piano gratuito",
  active: "Pro attivo",
  past_due: "Pagamento in ritardo",
  cancelled: "Pro annullato",
  expired: "Pro scaduto",
};

export function EntitlementCard({ entitlement }: { entitlement: Entitlement }) {
  const [loading, setLoading] = React.useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const result = await createCheckoutSession();
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.data.url;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-strong)]" />
          <CardTitle>Piano</CardTitle>
        </div>
        <CardDescription>Limiti e stato dell&apos;abbonamento a Quota.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant={entitlement.isPro ? "accent" : "neutral"}>{STATUS_LABEL[entitlement.status]}</Badge>
          {entitlement.currentPeriodEnd && (
            <span className="text-[12.5px] text-[var(--text-tertiary)]">
              {entitlement.cancelAtPeriodEnd ? "Termina" : "Si rinnova"} il{" "}
              {formatDate(entitlement.currentPeriodEnd)}
            </span>
          )}
        </div>

        {!entitlement.isPro && (
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Il piano gratuito include un abbonamento con fino a {FREE_TIER_LIMITS.maxMembersPerSubscription} membri.
              Passa a Pro per abbonamenti e membri illimitati.
            </p>
            <Button size="sm" className="mt-3" onClick={handleUpgrade} disabled={loading}>
              {loading ? "Un attimo…" : "Passa a Pro"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
