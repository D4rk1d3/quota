"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDayMonth, formatEUR } from "@/lib/domain";
import { PAYMENT_METHOD_LABEL, type Payment } from "@/lib/types";
import { EmptyState } from "@/components/quota/empty-state";
import { VoidPaymentDialog } from "@/components/quota/void-payment-dialog";
import { Receipt } from "lucide-react";

export function PaymentHistoryList({ payments }: { payments: Payment[] }) {
  const [voidTarget, setVoidTarget] = React.useState<Payment | null>(null);

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
            <div
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-3 ${p.voided ? "opacity-50" : ""}`}
            >
              <div>
                <p className="text-[13.5px] font-medium text-[var(--text-primary)]">
                  {formatEUR(p.amount)}
                  {p.voided && (
                    <span className="ml-2 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
                      Annullato
                    </span>
                  )}
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  {formatDayMonth(p.date)} · {PAYMENT_METHOD_LABEL[p.method]}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!p.voided && (
                  <p className="text-[12px] text-[var(--text-tertiary)]">fino al {formatDayMonth(p.coversUntil)}</p>
                )}
                {!p.voided && (
                  <Button variant="ghost" size="sm" onClick={() => setVoidTarget(p)}>
                    Annulla
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {voidTarget && (
        <VoidPaymentDialog
          open={!!voidTarget}
          onOpenChange={(open) => !open && setVoidTarget(null)}
          paymentId={voidTarget.id}
          amount={voidTarget.amount}
        />
      )}
    </Card>
  );
}
