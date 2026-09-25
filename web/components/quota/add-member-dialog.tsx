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
import { createMember } from "@/lib/actions/members";

export function AddMemberDialog({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createMember({ subscriptionId, name: name.trim() });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpen(false);
    const addedName = name.trim();
    setName("");
    router.refresh();
    toast.success(`${addedName} aggiunto al gruppo`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <UserPlus className="h-4 w-4" /> Aggiungi membro
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Aggiungi membro</DialogTitle>
            <DialogDescription>Aggiungi una persona a questo abbonamento.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col gap-2">
            <Label htmlFor="member-name">Nome</Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome e cognome"
              required
            />
          </div>

          {error && <p className="mt-3 text-[12.5px] text-[var(--danger,#B23A3A)]">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Aggiunta…" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
