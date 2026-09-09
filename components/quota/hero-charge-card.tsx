"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEUR, daysUntil, formatDayMonth, isoDate, getNextChargeDate } from "@/lib/domain";
import { useQuotaActions } from "@/components/quota/quota-provider";
import { useQuotaData, useToday } from "@/components/quota/quota-data-provider";
import { Music2 } from "lucide-react";

export function HeroChargeCard() {
  const { openRegisterPayment } = useQuotaActions();
  const { plan, fund: FUND } = useQuotaData();
  const today = useToday();
  const SPOTIFY_PLAN = plan;
  const nextCharge = getNextChargeDate(plan.billingDay, today);
  const days = daysUntil(nextCharge, today);
  const covered = FUND.collectedThisCycle + FUND.balance >= SPOTIFY_PLAN.monthlyCost;
  const progressPct =
    FUND.expectedThisCycle > 0
      ? Math.min(100, Math.round((FUND.collectedThisCycle / FUND.expectedThisCycle) * 100))
      : 0;

  return (
    <Card className="relative overflow-hidden p-7 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-soft-strong), transparent 70%)" }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
            <Music2 className="h-4 w-4 text-[var(--accent)]" />
            Prossimo addebito Spotify
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-[38px] font-semibold leading-none tracking-[-0.02em] text-[var(--text-primary)] md:text-[44px]">
              {formatEUR(SPOTIFY_PLAN.monthlyCost)}
            </span>
            <span className="text-[14px] text-[var(--text-tertiary)]">il {formatDayMonth(isoDate(nextCharge))}</span>
          </div>

          <p className="mt-2 text-[13.5px] text-[var(--text-secondary)]">
            {days === 0 ? "Addebito oggi" : days === 1 ? "Tra 1 giorno" : `Tra ${days} giorni`}
          </p>

          <div className="mt-5 max-w-[280px]">
            <div className="flex items-center justify-between text-[12px] text-[var(--text-tertiary)]">
              <span>Fondo coperto</span>
              <span>{progressPct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-[var(--ease-standard)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
            style={{
              backgroundColor: covered ? "var(--accent-soft)" : "var(--amber-soft)",
              color: covered ? "var(--accent-strong)" : "var(--amber)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {covered ? "Fondo sufficiente" : `Mancano ${formatEUR(SPOTIFY_PLAN.monthlyCost - FUND.collectedThisCycle - FUND.balance)}`}
          </span>
          <Button size="lg" onClick={() => openRegisterPayment()}>
            Registra pagamento Spotify
          </Button>
        </div>
      </div>
    </Card>
  );
}
