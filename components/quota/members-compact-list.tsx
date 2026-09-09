import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/quota/status-badge";
import { formatDayMonth, formatEUR } from "@/lib/domain";
import type { Member } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export function MembersCompactList({ members }: { members: Member[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Membri</CardTitle>
        <Link href="/membri" className="text-[12.5px] font-medium text-[var(--accent-strong)] hover:underline">
          Vedi tutti
        </Link>
      </CardHeader>
      <div className="flex flex-col px-3 pb-3">
        {members.map((m) => (
          <Link
            key={m.id}
            href={`/membri/${m.id}`}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <Avatar name={m.name} color={m.color} size="sm" />
              <div>
                <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{m.name}</p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  Coperto fino al {formatDayMonth(m.coveredUntil)} · {formatEUR(m.monthlyShare)}/mese
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={m.status} />
              <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
