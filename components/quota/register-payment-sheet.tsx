"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuotaData, useToday } from "@/components/quota/quota-data-provider";
import { computeCoverageFromPayment, formatDayMonth, formatEUR, isoDate } from "@/lib/domain";
import { euroToCents } from "@/lib/adapters";
import { recordPayment } from "@/lib/actions/payments";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

interface RegisterPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMemberId?: string;
}

const METHODS: PaymentMethod[] = ["bonifico", "revolut", "trade_republic", "contanti", "satispay"];

export function RegisterPaymentSheet({ open, onOpenChange, defaultMemberId }: RegisterPaymentSheetProps) {
  const router = useRouter();
  const { members, plan } = useQuotaData();
  const today = useToday();
  const firstMemberId = members[0]?.id ?? "";

  const [memberId, setMemberId] = React.useState(defaultMemberId ?? firstMemberId);
  const [amount, setAmount] = React.useState(plan.perMemberShare.toFixed(2).replace(".", ","));
  const [date, setDate] = React.useState(isoDate(today));
  const [method, setMethod] = React.useState<PaymentMethod>("revolut");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemberId(defaultMemberId ?? firstMemberId);
      setAmount(plan.perMemberShare.toFixed(2).replace(".", ","));
      setDate(isoDate(today));
      setMethod("revolut");
      setNote("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultMemberId]);

  const member = members.find((m) => m.id === memberId) ?? members[0];
  const numericAmount = parseFloat(amount.replace(",", ".")) || 0;

  const preview = React.useMemo(() => {
    if (!member || numericAmount <= 0) return null;
    return computeCoverageFromPayment(member.coveredUntil, numericAmount, member.monthlyShare, isoDate(today));
  }, [member, numericAmount, today]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member || numericAmount <= 0) return;
    setSubmitting(true);
    setError(null);

    const result = await recordPayment({
      memberId: member.id,
      amountCents: euroToCents(numericAmount),
      method,
      paidAt: date,
      note: note.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    router.refresh();
    toast.custom(
      () => (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-elevated)]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
          <div>
            <p className="text-[13.5px] font-medium text-[var(--text-primary)]">Pagamento registrato</p>
            <p className="text-[12.5px] text-[var(--text-secondary)]">
              {member.name} · {formatEUR(numericAmount)}
              {preview ? ` · coperto fino al ${formatDayMonth(isoDate(preview.newCoveredUntil))}` : ""}
            </p>
          </div>
        </div>
      ),
      { duration: 3600 }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Registra pagamento</SheetTitle>
            <SheetDescription>Aggiungi la quota versata da un membro del gruppo.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="member">Membro</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger id="member">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Importo</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-tertiary)]">€</span>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    className="pl-8"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="method">Metodo</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Nota (facoltativa)</Label>
              <Textarea id="note" placeholder="Es. due mesi in anticipo" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {preview && (
              <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                <p className="text-[13px] leading-snug text-[var(--accent-strong)]">
                  {preview.isPartial ? (
                    <>Pagamento parziale: non copre ancora un ciclo intero.</>
                  ) : (
                    <>
                      Questo pagamento coprirà {member?.name.split(" ")[0]} fino al{" "}
                      <strong className="font-semibold">{formatDayMonth(isoDate(preview.newCoveredUntil))}</strong>
                      {preview.cyclesPaid > 1 ? ` (${preview.cyclesPaid} mesi)` : ""}.
                    </>
                  )}
                </p>
              </div>
            )}

            {error && <p className="text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="secondary">
                Annulla
              </Button>
            </SheetClose>
            <Button type="submit" disabled={numericAmount <= 0 || submitting || !member}>
              {submitting ? "Registrazione…" : "Registra pagamento"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
