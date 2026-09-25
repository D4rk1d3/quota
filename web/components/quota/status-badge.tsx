import { Badge } from "@/components/ui/badge";
import type { ChargeStatus } from "@/lib/types";
import { chargeStatusLabel } from "@/lib/domain";

const VARIANT: Record<ChargeStatus, "accent" | "amber" | "brick" | "neutral"> = {
  paid: "accent",
  partial: "amber",
  overdue: "brick",
  credit: "accent",
  scheduled: "neutral",
};

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  return <Badge variant={VARIANT[status]}>{chargeStatusLabel(status)}</Badge>;
}
