import { getEventsForMonth, MONTH_LABELS } from "@/lib/calendar-utils";
import { formatEUR } from "@/lib/domain";
import { EmptyState } from "@/components/quota/empty-state";
import { useMemberName, useQuotaData, useToday } from "@/components/quota/quota-data-provider";
import { CalendarX2 } from "lucide-react";

const DOT_COLOR: Record<string, string> = {
  charge: "var(--text-tertiary)",
  payment: "var(--accent)",
  reminder: "var(--amber)",
};

export function AgendaList() {
  const today = useToday();
  const { plan, payments, activity } = useQuotaData();
  const memberName = useMemberName();
  const year = today.getFullYear();
  const month = today.getMonth();
  const eventsByDay = getEventsForMonth(year, month, { plan, payments, activity, memberName });
  const days = Object.keys(eventsByDay).map(Number).sort((a, b) => a - b);

  if (days.length === 0) {
    return <EmptyState icon={CalendarX2} title="Nessun evento questo mese" />;
  }

  return (
    <div className="flex flex-col gap-1">
      {days.map((day) => (
        <div key={day} className="flex gap-4 py-2.5">
          <div className="w-11 shrink-0 text-[13px] font-medium text-[var(--text-tertiary)]">
            {day} {MONTH_LABELS[month].slice(0, 3)}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {eventsByDay[day].map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: DOT_COLOR[e.kind] }} />
                <span className="flex-1 text-[13px] text-[var(--text-primary)]">{e.label}</span>
                {e.amount && <span className="text-[12.5px] text-[var(--text-tertiary)]">{formatEUR(e.amount)}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
