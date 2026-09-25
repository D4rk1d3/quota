import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/quota/empty-state";
import type { ActivityEntry } from "@/lib/supabase/queries";
import { formatEUR, formatDate } from "@/lib/domain";
import { History } from "lucide-react";

function describeActivity(entry: ActivityEntry): string {
  const m = entry.metadata;
  switch (entry.eventType) {
    case "payment_recorded":
      return `Pagamento registrato${typeof m.amount === "number" ? `: ${formatEUR(m.amount)}` : ""}`;
    case "payment_reversed":
      return `Pagamento stornato${typeof m.amount === "number" ? `: ${formatEUR(m.amount)}` : ""}${
        typeof m.reason === "string" ? ` — ${m.reason}` : ""
      }`;
    case "cycle_created":
      return "Nuovo ciclo di fatturazione generato";
    default:
      return entry.eventType.replace(/_/g, " ");
  }
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--accent-strong)]" />
          <CardTitle>Attività recenti</CardTitle>
        </div>
        <CardDescription>Ultimi pagamenti e cicli di fatturazione.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState icon={History} title="Nessuna attività ancora" compact />
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13px] text-[var(--text-primary)]">{describeActivity(entry)}</span>
                <span className="shrink-0 text-[12px] text-[var(--text-tertiary)]">
                  {formatDate(entry.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
