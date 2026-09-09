"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { getMonthMatrix, WEEKDAY_LABELS, MONTH_LABELS, type CalendarDay } from "@/lib/calendar-utils";
import { useMemberName, useQuotaData, useToday } from "@/components/quota/quota-data-provider";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatEUR } from "@/lib/domain";

const DOT_COLOR: Record<string, string> = {
  charge: "var(--text-tertiary)",
  payment: "var(--accent)",
  reminder: "var(--amber)",
};

export function MonthCalendar() {
  const today = useToday();
  const { plan, payments, activity } = useQuotaData();
  const memberName = useMemberName();
  const [cursor, setCursor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = React.useState<CalendarDay | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = getMonthMatrix(year, month, today, { plan, payments, activity, memberName });

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-4">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {MONTH_LABELS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mese precedente"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
          >
            Oggi
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mese successivo"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="pb-2 text-[11px] font-medium text-[var(--text-tertiary)]">
            {d}
          </div>
        ))}
        {weeks.flat().map((d, i) => (
          <button
            key={i}
            onClick={() => d.events.length > 0 && setSelectedDay(d)}
            disabled={d.events.length === 0}
            className={cn(
              "mx-auto flex h-11 w-full max-w-11 flex-col items-center justify-center gap-1 rounded-[14px] text-[13px] transition-colors duration-[var(--dur-fast)]",
              d.inMonth ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]/40",
              d.isToday && "bg-[var(--accent-soft)] font-semibold text-[var(--accent-strong)]",
              d.events.length > 0 && !d.isToday && "hover:bg-[var(--surface-muted)]",
              d.events.length === 0 && "cursor-default"
            )}
          >
            <span>{d.day}</span>
            {d.events.length > 0 && (
              <span className="flex items-center gap-0.5">
                {d.events.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: DOT_COLOR[e.kind] }}
                  />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${selectedDay.day} ${MONTH_LABELS[month]}`}
            </DialogTitle>
            <DialogDescription>{selectedDay?.events.length} evento/i in questa data</DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-col gap-3">
            {selectedDay?.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-4 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: DOT_COLOR[e.kind] }} />
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{e.label}</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--text-tertiary)]">{e.detail}</p>
                </div>
                {e.amount && (
                  <span className="ml-auto text-[13px] font-medium text-[var(--text-secondary)]">{formatEUR(e.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
