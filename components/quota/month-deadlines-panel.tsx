import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/quota/status-badge";
import { useQuotaData, useToday } from "@/components/quota/quota-data-provider";
import { formatEUR, formatDayMonth, getNextChargeDate, isoDate } from "@/lib/domain";

export function MonthDeadlinesPanel() {
  const { members: MEMBERS, plan: SPOTIFY_PLAN } = useQuotaData();
  const today = useToday();
  const pending = MEMBERS.filter((m) => m.status !== "regolare");
  const nextCharge = getNextChargeDate(SPOTIFY_PLAN.billingDay, today);

  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-[var(--text-secondary)]">Prossima scadenza</p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        {formatDayMonth(isoDate(nextCharge))}
      </p>
      <p className="text-[12.5px] text-[var(--text-tertiary)]">Totale atteso {formatEUR(SPOTIFY_PLAN.monthlyCost)}</p>

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <p className="text-[12px] font-medium text-[var(--text-tertiary)]">Chi deve ancora pagare</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {pending.length === 0 ? (
            <p className="text-[12.5px] text-[var(--text-tertiary)]">Tutti hanno già versato la quota.</p>
          ) : (
            pending.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.color} size="sm" />
                  <span className="text-[13px] text-[var(--text-primary)]">{m.name}</span>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
