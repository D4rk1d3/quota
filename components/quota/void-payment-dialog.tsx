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
import { formatEUR } from "@/lib/domain";
import { voidPayment } from "@/lib/actions/payments";

export function VoidPaymentDialog({
  open,
  onOpenChange,
  paymentId,
  amount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  amount: number;
}) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNote("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (note.trim().length < 3) {
      setError("Spiega brevemente il motivo dell'annullamento.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await voidPayment({ paymentId, note: note.trim() });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    router.refresh();
    toast.success("Pagamento annullato", {
      description: "Resta visibile nello storico come annullato, non è stato cancellato.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Annulla pagamento</DialogTitle>
            <DialogDescription>
              Il pagamento da {formatEUR(amount)} non viene eliminato: resta nello storico come
              annullato, e la copertura viene ricalcolata di conseguenza.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col gap-2">
            <Label htmlFor="void-note">Motivo</Label>
            <Textarea
              id="void-note"
              placeholder="Es. importo o data sbagliati"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            {error && <p className="text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Chiudi
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? "Annullamento…" : "Annulla pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
