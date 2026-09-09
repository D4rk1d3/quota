import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayMonth, formatEUR } from "@/lib/domain";
import type { ActivityItem } from "@/lib/types";
import { ArrowDownCircle, Bell, UserPlus, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  payment: ArrowDownCircle,
  reminder: Bell,
  member_added: UserPlus,
  charge: Music2,
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attività recente</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-0 px-3 pb-4">
        {items.map((item, idx) => {
          const Icon = ICONS[item.type];
          const isLast = idx === items.length - 1;
          return (
            <div key={item.id} className="flex gap-3 px-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    item.type === "payment" && "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
                    item.type === "reminder" && "bg-[var(--amber-soft)] text-[var(--amber)]",
                    item.type === "charge" && "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
                    item.type === "member_added" && "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                {!isLast && <div className="my-1 w-px flex-1 bg-[var(--border)]" />}
              </div>
              <div className={cn("flex-1 pb-4", isLast && "pb-1")}>
                <p className="text-[13px] leading-snug text-[var(--text-primary)]">{item.description}</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--text-tertiary)]">
                  {formatDayMonth(item.date)}
                  {item.amount ? ` · ${formatEUR(item.amount)}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
