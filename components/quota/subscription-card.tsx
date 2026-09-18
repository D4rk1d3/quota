import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@/lib/types";
import { BILLING_FREQUENCY_LABEL } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/domain";
import { Users } from "lucide-react";

const STATUS_VARIANT = {
  active: "accent",
  paused: "amber",
  cancelled: "brick",
  archived: "neutral",
} as const;

const STATUS_LABEL: Record<Subscription["status"], string> = {
  active: "Attivo",
  paused: "In pausa",
  cancelled: "Annullato",
  archived: "Archiviato",
};

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  return (
    <Link href={`/abbonamenti/${subscription.id}`}>
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:bg-[var(--surface-muted)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">{subscription.name}</p>
            {subscription.description && (
              <p className="mt-0.5 text-[12.5px] text-[var(--text-tertiary)]">{subscription.description}</p>
            )}
          </div>
          <Badge variant={STATUS_VARIANT[subscription.status]}>{STATUS_LABEL[subscription.status]}</Badge>
        </div>

        <p className="text-[24px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
          {formatEUR(subscription.currentPrice, subscription.currency)}
          <span className="ml-1 text-[13px] font-normal text-[var(--text-tertiary)]">
            / {BILLING_FREQUENCY_LABEL[subscription.billingFrequency].toLowerCase()}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between text-[12.5px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {subscription.memberCount ?? 0} membri
          </span>
          <span>Rinnova il {formatDate(subscription.nextRenewalDate, { day: "numeric", month: "short" })}</span>
        </div>
      </Card>
    </Link>
  );
}
