import Link from "next/link";
import { PageShell } from "@/components/quota/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/quota/empty-state";
import { getUpcomingCycles } from "@/lib/supabase/queries";
import { formatEUR, formatDate } from "@/lib/domain";
import { CalendarDays } from "lucide-react";

const STATUS_VARIANT = {
  current: "accent",
  overdue: "brick",
  upcoming: "neutral",
  closed: "neutral",
} as const;

const STATUS_LABEL: Record<string, string> = {
  current: "In corso",
  overdue: "In ritardo",
  upcoming: "In arrivo",
  closed: "Chiuso",
};

export default async function CalendarioPage() {
  const cycles = await getUpcomingCycles();

  return (
    <PageShell title="Calendario" subtitle="Prossimi rinnovi e cicli in corso, in tutti i tuoi abbonamenti">
      {cycles.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nessun ciclo di fatturazione"
          description="Genera il primo ciclo da una pagina abbonamento per vederlo qui."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {cycles.map((c) => (
            <Link key={c.id} href={`/abbonamenti/${c.subscriptionId}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--surface-muted)]">
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{c.subscriptionName}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                    Rinnova il {formatDate(c.renewalDate, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13.5px] font-medium text-[var(--text-primary)]">
                    {formatEUR(c.collectedTotal, c.currency)} / {formatEUR(c.expectedTotal, c.currency)}
                  </span>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
