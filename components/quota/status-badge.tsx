import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/lib/types";
import { statusLabel } from "@/lib/domain";

const VARIANT: Record<MemberStatus, "accent" | "amber" | "brick"> = {
  regolare: "accent",
  in_scadenza: "amber",
  in_ritardo: "brick",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  return <Badge variant={VARIANT[status]}>{statusLabel(status)}</Badge>;
}
