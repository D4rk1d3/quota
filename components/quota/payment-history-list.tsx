import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayMonth, formatEUR } from "@/lib/domain";
import { PAYMENT_METHOD_LABEL, type Payment } from "@/lib/types";
import { EmptyState } from "@/components/quota/empty-state";
import { Receipt } from "lucide-react";

export function PaymentHistoryList({ payments }: { payments: Payment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storico pagamenti</CardTitle>
      </CardHeader>
      <div className="flex flex-col px-3 pb-3">
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="Nessun pagamento registrato" description="I pagamenti registrati compariranno qui." compact />
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-3">
              <div>
                <p className="text-[13.5px] font-medium text-[var(--text-primary)]">{formatEUR(p.amount)}</p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  {formatDayMonth(p.date)} · {PAYMENT_METHOD_LABEL[p.method]}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              <p className="text-[12px] text-[var(--text-tertiary)]">fino al {formatDayMonth(p.coversUntil)}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
