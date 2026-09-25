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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PackagePlus } from "lucide-react";
import { createSubscription } from "@/lib/actions/subscription";
import { BILLING_FREQUENCY_LABEL, SHARE_TYPE_LABEL, type BillingFrequency, type ShareType } from "@/lib/types";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AddSubscriptionDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [frequency, setFrequency] = React.useState<BillingFrequency>("monthly");
  const [shareType, setShareType] = React.useState<ShareType>("equal");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createSubscription({
      name: name.trim(),
      currentPrice: parseFloat(price.replace(",", ".")) || 0,
      billingFrequency: frequency,
      billingInterval: 1,
      shareType,
      startDate: todayIso(),
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setName("");
    setPrice("");
    router.refresh();
    router.push(`/abbonamenti/${result.data.id}`);
    toast.success(`${name.trim()} aggiunto`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PackagePlus className="h-4 w-4" /> Nuovo abbonamento
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuovo abbonamento</DialogTitle>
            <DialogDescription>Es. Netflix, Spotify Family, un abbonamento in palestra.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Netflix"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Prezzo (€)</Label>
              <Input
                id="price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="19,99"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Frequenza</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as BillingFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BILLING_FREQUENCY_LABEL) as BillingFrequency[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {BILLING_FREQUENCY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Come si divide</Label>
              <Select value={shareType} onValueChange={(v) => setShareType(v as ShareType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SHARE_TYPE_LABEL) as ShareType[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SHARE_TYPE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="mt-3 text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creazione…" : "Crea abbonamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
