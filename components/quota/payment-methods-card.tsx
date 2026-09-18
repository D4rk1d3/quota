"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/quota/empty-state";
import { createPaymentMethod, archivePaymentMethod } from "@/lib/actions/payment-methods";
import { PAYMENT_METHOD_LABEL, type PaymentMethod, type PaymentMethodType } from "@/lib/types";
import { Wallet, X, Plus } from "lucide-react";

export function PaymentMethodsCard({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<PaymentMethodType>("revolut");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createPaymentMethod({ label: label.trim(), methodType: type });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setLabel("");
    setAdding(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    const result = await archivePaymentMethod({ id });
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--accent-strong)]" />
            <CardTitle>Metodi di pagamento</CardTitle>
          </div>
          {!adding && (
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Aggiungi
            </Button>
          )}
        </div>
        <CardDescription>I tuoi metodi per registrare rapidamente da dove arrivano i pagamenti.</CardDescription>
      </CardHeader>
      <CardContent>
        {adding && (
          <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pm-label">Nome</Label>
              <Input id="pm-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Il mio Revolut" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PaymentMethodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethodType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {PAYMENT_METHOD_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Annulla
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Salvataggio…" : "Salva"}
              </Button>
            </div>
          </form>
        )}

        {paymentMethods.length === 0 && !adding ? (
          <EmptyState icon={Wallet} title="Nessun metodo salvato" compact />
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {paymentMethods.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{m.label}</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">{PAYMENT_METHOD_LABEL[m.methodType]}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => handleRemove(m.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
