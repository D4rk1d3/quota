"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/quota/status-badge";
import { MemberActionsMenu } from "@/components/quota/member-actions-menu";
import { formatDayMonth, formatEUR } from "@/lib/domain";
import type { Member } from "@/lib/types";

export function MembersView({ members }: { members: Member[] }) {
  return (
    <>
      {/* Mobile: card */}
      <div className="flex flex-col gap-3 md:hidden">
        {members.map((m) => (
          <Link key={m.id} href={`/membri/${m.id}`}>
            <Card className="p-4 transition-transform active:scale-[0.99]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.color} />
                  <div>
                    <p className="text-[14.5px] font-medium text-[var(--text-primary)]">{m.name}</p>
                    <p className="text-[12.5px] text-[var(--text-tertiary)]">{formatEUR(m.monthlyShare)}/mese</p>
                  </div>
                </div>
                <MemberActionsMenu memberId={m.id} memberName={m.name} />
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Coperto fino a</p>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{formatDayMonth(m.coveredUntil)}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {["Membro", "Quota", "Coperto fino a", "Ultimo pagamento", "Stato", ""].map((h) => (
                <th key={h} className="px-6 py-3.5 text-[12px] font-medium text-[var(--text-tertiary)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="group border-b border-[var(--border)] last:border-0">
                <td className="p-0">
                  <Link href={`/membri/${m.id}`} className="flex items-center gap-3 px-6 py-3.5">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span className="text-[13.5px] font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-strong)]">
                      {m.name}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-3.5 text-[13.5px] text-[var(--text-secondary)]">{formatEUR(m.monthlyShare)}</td>
                <td className="px-6 py-3.5 text-[13.5px] text-[var(--text-secondary)]">{formatDayMonth(m.coveredUntil)}</td>
                <td className="px-6 py-3.5 text-[13.5px] text-[var(--text-secondary)]">
                  {m.lastPaymentDate ? formatDayMonth(m.lastPaymentDate) : "—"}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-6 py-3.5 text-right">
                  <MemberActionsMenu memberId={m.id} memberName={m.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
