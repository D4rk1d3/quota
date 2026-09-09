"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/quota/status-badge";
import { PaymentHistoryList } from "@/components/quota/payment-history-list";
import { formatDayMonth, formatEUR } from "@/lib/domain";
import { useQuotaActions } from "@/components/quota/quota-provider";
import type { Member, Payment } from "@/lib/types";
import { ArrowLeft, CreditCard } from "lucide-react";

export function MemberDetail({ member, payments }: { member: Member; payments: Payment[] }) {
  const router = useRouter();
  const { openRegisterPayment } = useQuotaActions();

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push("/membri")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Membri
      </button>

      <Card className="p-6 md:p-7">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={member.name} color={member.color} size="lg" />
            <div>
              <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{member.name}</h2>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                Nel gruppo dal {formatDayMonth(member.joinedAt)}
              </p>
            </div>
          </div>
          <StatusBadge status={member.status} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5">
          <div>
            <p className="text-[11.5px] text-[var(--text-tertiary)]">Quota mensile</p>
            <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">{formatEUR(member.monthlyShare)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-[var(--text-tertiary)]">Coperto fino a</p>
            <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">{formatDayMonth(member.coveredUntil)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-[var(--text-tertiary)]">Ultimo pagamento</p>
            <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
              {member.lastPaymentDate ? formatDayMonth(member.lastPaymentDate) : "—"}
            </p>
          </div>
        </div>

        <Button className="mt-6 w-full sm:w-auto" onClick={() => openRegisterPayment(member.id)}>
          <CreditCard className="h-4 w-4" /> Registra pagamento
        </Button>
      </Card>

      <PaymentHistoryList payments={payments} />
    </div>
  );
}
