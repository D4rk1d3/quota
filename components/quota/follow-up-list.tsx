import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/quota/status-badge";
import { Button } from "@/components/ui/button";
import { formatDayMonth } from "@/lib/domain";
import type { Member } from "@/lib/types";
import { EmptyState } from "@/components/quota/empty-state";
import { CheckCircle2 } from "lucide-react";

export function FollowUpList({ members, onRegister }: { members: Member[]; onRegister: (id: string) => void }) {
  const toFollow = members.filter((m) => m.status !== "regolare");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Da seguire</CardTitle>
      </CardHeader>
      <div className="flex flex-col px-3 pb-3">
        {toFollow.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Tutti in regola"
            description="Nessun membro in ritardo o in scadenza in questo momento."
            compact
          />
        ) : (
          toFollow.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-muted)]"
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.name} color={m.color} size="sm" />
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{m.name}</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    Coperto fino al {formatDayMonth(m.coveredUntil)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusBadge status={m.status} />
                <Button size="sm" variant="secondary" onClick={() => onRegister(m.id)}>
                  Registra
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
