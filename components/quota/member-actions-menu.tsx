"use client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CreditCard, Eye, UserMinus } from "lucide-react";
import { useQuotaActions } from "@/components/quota/quota-provider";
import { deactivateMember } from "@/lib/actions/members";
import { toast } from "sonner";

export function MemberActionsMenu({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter();
  const { openRegisterPayment } = useQuotaActions();

  async function handleRemove() {
    const result = await deactivateMember({ id: memberId });
    if (!result.ok) {
      toast.error("Impossibile rimuovere il membro", { description: result.error });
      return;
    }
    router.refresh();
    toast.message(`${memberName} rimosso dal gruppo`, {
      description: "Lo storico dei pagamenti resta consultabile.",
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label={`Azioni per ${memberName}`}>
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => openRegisterPayment(memberId)}>
          <CreditCard className="h-4 w-4" /> Registra pagamento
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`/membri/${memberId}`)}>
          <Eye className="h-4 w-4" /> Vedi dettaglio
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleRemove}>
          <UserMinus className="h-4 w-4" /> Rimuovi membro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
