"use client";
import { PageShell } from "@/components/quota/page-shell";
import { HeroChargeCard } from "@/components/quota/hero-charge-card";
import { MetricCard } from "@/components/quota/metric-card";
import { FollowUpList } from "@/components/quota/follow-up-list";
import { MembersCompactList } from "@/components/quota/members-compact-list";
import { ActivityTimeline } from "@/components/quota/activity-timeline";
import { useQuotaData } from "@/components/quota/quota-data-provider";
import { formatEUR, sortMembersByAttention } from "@/lib/domain";
import { useQuotaActions } from "@/components/quota/quota-provider";
import { Wallet, Users, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { openRegisterPayment } = useQuotaActions();
  const { members, activity, fund } = useQuotaData();
  const sorted = sortMembersByAttention(members);

  return (
    <PageShell title="Buongiorno" subtitle="Ecco come va il gruppo Spotify questo mese">
      <div className="flex flex-col gap-6">
        <HeroChargeCard />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Incassato questo ciclo"
            value={formatEUR(fund.collectedThisCycle)}
            hint={`su ${formatEUR(fund.expectedThisCycle)} attesi`}
            icon={Wallet}
            tone="accent"
          />
          <MetricCard
            label="Membri in regola"
            value={`${fund.membersInGoodStanding}/${fund.totalMembers}`}
            hint="coperti per il ciclo corrente"
            icon={Users}
          />
          <MetricCard
            label="Da recuperare"
            value={formatEUR(fund.toRecover)}
            hint="da membri in ritardo"
            icon={AlertCircle}
            tone={fund.toRecover > 0 ? "amber" : "default"}
          />
        </div>

        <FollowUpList members={sorted} onRegister={openRegisterPayment} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MembersCompactList members={sorted} />
          <ActivityTimeline items={activity} />
        </div>
      </div>
    </PageShell>
  );
}
