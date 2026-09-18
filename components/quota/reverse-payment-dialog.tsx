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
import { Textarea } from "@/components/ui/textarea";
import { reversePayment } from "@/lib/actions/payments";
import { formatEUR } from "@/lib/domain";

export function ReversePaymentDialog({
  open,
  onOpenChange,
  paymentId,
  memberName,
  amount,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  memberName: string;
  amount: number;
  currency: string;
}) {
  const router = useRouter();
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await reversePayment({ paymentId, reason });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setReason("");
    onOpenChange(false);
    router.refresh();
    toast.success(`Pagamento di ${memberName} stornato`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Storna pagamento</DialogTitle>
            <DialogDescription>
              {memberName} · {formatEUR(amount, currency)}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col gap-2">
            <Label htmlFor="reason">Motivo dello storno</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Es. importo sbagliato, pagamento duplicato…"
              required
              minLength={3}
            />
          </div>

          {error && <p className="mt-3 text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? "Storno…" : "Storna pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
