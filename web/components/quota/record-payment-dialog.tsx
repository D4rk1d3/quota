"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { recordPayment } from "@/lib/actions/payments";
import type { PaymentMethod } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/types";

export function RecordPaymentDialog({
  open,
  onOpenChange,
  chargeId,
  memberName,
  remainingAmount,
  paymentMethods,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargeId: string;
  memberName: string;
  remainingAmount: number;
  paymentMethods: PaymentMethod[];
}) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(remainingAmount.toFixed(2)).replace(".", ","));
  const [methodId, setMethodId] = React.useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setAmount(String(remainingAmount.toFixed(2)).replace(".", ","));
  }, [open, remainingAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await recordPayment({
      chargeId,
      amount: parseFloat(amount.replace(",", ".")) || 0,
      paymentMethodId: methodId,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    router.refresh();
    toast.success(`Pagamento di ${memberName} registrato`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registra pagamento</DialogTitle>
            <DialogDescription>{memberName}</DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {paymentMethods.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Metodo (facoltativo)</Label>
                <Select value={methodId} onValueChange={setMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Non specificato" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label} · {PAYMENT_METHOD_LABEL[m.methodType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrazione…" : "Registra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
