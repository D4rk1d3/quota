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
import { UserPlus } from "lucide-react";
import { useQuotaData } from "@/components/quota/quota-data-provider";
import { formatEUR } from "@/lib/domain";
import { createMember } from "@/lib/actions/members";

export function AddMemberDialog() {
  const router = useRouter();
  const { plan } = useQuotaData();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createMember({ name: name.trim() });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setName("");
    router.refresh();
    toast.success(`${name.trim()} aggiunto al gruppo`, {
      description: `Quota mensile impostata a ${formatEUR(plan.perMemberShare)}.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" /> Aggiungi membro
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Aggiungi membro</DialogTitle>
            <DialogDescription>Entrerà a far parte della divisione del piano Family.</DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome e cognome</Label>
              <Input id="name" placeholder="Es. Chiara Longo" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-4 py-3 text-[12.5px] text-[var(--text-secondary)]">
              Quota mensile automatica: <strong className="text-[var(--text-primary)]">{formatEUR(plan.perMemberShare)}</strong>
            </div>
            {error && <p className="text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Annulla</Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting ? "Aggiunta…" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
