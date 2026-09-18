"use client";
import { PageShell } from "@/components/quota/page-shell";
import { MetricCard } from "@/components/quota/metric-card";
import { SubscriptionCard } from "@/components/quota/subscription-card";
import { AddSubscriptionDialog } from "@/components/quota/add-subscription-dialog";
import { EmptyState } from "@/components/quota/empty-state";
import { useQuotaData } from "@/components/quota/quota-data-provider";
import { formatEUR, formatDate } from "@/lib/domain";
import { Wallet, TrendingUp, AlertCircle, PackagePlus } from "lucide-react";

export default function DashboardPage() {
  const { subscriptions, dashboard } = useQuotaData();

  return (
    <PageShell
      title="Dashboard"
      subtitle="I tuoi abbonamenti condivisi, in un colpo d'occhio"
      action={<AddSubscriptionDialog />}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Incassato"
            value={formatEUR(dashboard.totalCollected)}
            hint={`su ${formatEUR(dashboard.totalExpected)} attesi`}
            icon={Wallet}
            tone="accent"
          />
          <MetricCard
            label="Pagamenti registrati"
            value={String(dashboard.paymentsCount)}
            hint={
              dashboard.nextRenewalDate
                ? `Prossimo rinnovo: ${formatDate(dashboard.nextRenewalDate)}`
                : "Nessun rinnovo in programma"
            }
            icon={TrendingUp}
          />
          <MetricCard
            label="Da recuperare"
            value={formatEUR(dashboard.totalOutstanding)}
            hint={`${dashboard.overdueCount} ciclo/i in ritardo`}
            icon={AlertCircle}
            tone={dashboard.overdueCount > 0 ? "amber" : "default"}
          />
        </div>

        {subscriptions.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title="Nessun abbonamento ancora"
            description="Aggiungi il primo abbonamento condiviso (Netflix, Spotify, palestra...) per iniziare a tracciare chi ha pagato."
            action={<AddSubscriptionDialog />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((s) => (
              <SubscriptionCard key={s.id} subscription={s} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
