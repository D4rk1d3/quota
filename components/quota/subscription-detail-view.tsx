"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AddMemberDialog } from "@/components/quota/add-member-dialog";
import { RecordPaymentDialog } from "@/components/quota/record-payment-dialog";
import { ChargeStatusBadge } from "@/components/quota/status-badge";
import { EmptyState } from "@/components/quota/empty-state";
import type { SubscriptionDetail } from "@/lib/supabase/queries";
import type { PaymentMethod } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/domain";
import { updateMember, removeMember } from "@/lib/actions/members";
import { generateBillingCycle } from "@/lib/actions/subscription";
import { MoreVertical, PauseCircle, PlayCircle, UserMinus, CalendarPlus, Users } from "lucide-react";

const CYCLE_STATUS_LABEL: Record<string, string> = {
  current: "In corso",
  overdue: "In ritardo",
  upcoming: "In arrivo",
  closed: "Chiuso",
};

export function SubscriptionDetailView({
  detail,
  paymentMethods,
}: {
  detail: SubscriptionDetail;
  paymentMethods: PaymentMethod[];
}) {
  const router = useRouter();
  const { subscription, members, cycles, chargesByCycle } = detail;
  const [generating, setGenerating] = React.useState(false);
  const [payingCharge, setPayingCharge] = React.useState<{ id: string; member: string; remaining: number } | null>(
    null
  );

  async function handleGenerateFirstCycle() {
    setGenerating(true);
    const result = await generateBillingCycle({
      subscriptionId: subscription.id,
      periodStart: subscription.startDate,
    });
    setGenerating(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleToggleMember(id: string, active: boolean) {
    const result = await updateMember({ id, status: active ? "active" : "paused" });
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  }

  async function handleRemoveMember(id: string) {
    const result = await removeMember({ id });
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--accent-strong)]" />
              <CardTitle>Membri</CardTitle>
            </div>
            <AddMemberDialog subscriptionId={subscription.id} />
          </div>
          <CardDescription>Chi partecipa a questo abbonamento.</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState icon={Users} title="Nessun membro" description="Aggiungi la prima persona." compact />
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar name={m.name} color={m.avatarColor ?? undefined} size="sm" />
                  <div className="flex-1">
                    <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{m.name}</p>
                    {m.status !== "active" && (
                      <p className="text-[12px] text-[var(--text-tertiary)]">
                        {m.status === "paused" ? "In pausa" : "Rimosso"}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.status === "active" ? (
                        <DropdownMenuItem onSelect={() => handleToggleMember(m.id, false)}>
                          <PauseCircle className="h-4 w-4" /> Metti in pausa
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => handleToggleMember(m.id, true)}>
                          <PlayCircle className="h-4 w-4" /> Riattiva
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => handleRemoveMember(m.id)}>
                        <UserMinus className="h-4 w-4" /> Rimuovi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {cycles.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="Nessun ciclo di fatturazione ancora"
          description="Genera il primo ciclo per iniziare a registrare i pagamenti."
          action={
            <Button size="sm" onClick={handleGenerateFirstCycle} disabled={generating || members.length === 0}>
              {generating ? "Generazione…" : "Genera il primo ciclo"}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {cycles.map((cycle) => {
            const charges = chargesByCycle[cycle.id] ?? [];
            const pct = cycle.expectedTotal > 0 ? Math.min(100, (cycle.collectedTotal / cycle.expectedTotal) * 100) : 0;
            return (
              <Card key={cycle.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--text-primary)]">
                      {formatDate(cycle.periodStart, { day: "numeric", month: "short" })} —{" "}
                      {formatDate(cycle.periodEnd, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                      {CYCLE_STATUS_LABEL[cycle.status] ?? cycle.status} · rinnova il{" "}
                      {formatDate(cycle.renewalDate, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <p className="text-[13.5px] font-medium text-[var(--text-primary)]">
                    {formatEUR(cycle.collectedTotal, cycle.currency)} / {formatEUR(cycle.expectedTotal, cycle.currency)}
                  </p>
                </div>
                <Progress value={pct} className="mt-3" />

                <div className="mt-4 flex flex-col divide-y divide-[var(--border)]">
                  {charges.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex-1 text-[13px] text-[var(--text-primary)]">{c.memberName}</span>
                      <ChargeStatusBadge status={c.status} />
                      <span className="w-20 text-right text-[12.5px] text-[var(--text-tertiary)]">
                        {formatEUR(c.expectedAmount, c.currency)}
                      </span>
                      {c.status !== "paid" && c.status !== "credit" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setPayingCharge({ id: c.id, member: c.memberName, remaining: c.remainingAmount })
                          }
                        >
                          Registra
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {payingCharge && (
        <RecordPaymentDialog
          open={!!payingCharge}
          onOpenChange={(open) => !open && setPayingCharge(null)}
          chargeId={payingCharge.id}
          memberName={payingCharge.member}
          remainingAmount={payingCharge.remaining}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}
