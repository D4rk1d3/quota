import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "amber";
}) {
  const toneColor = {
    default: "var(--text-secondary)",
    accent: "var(--accent-strong)",
    amber: "var(--amber)",
  }[tone];

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</span>
        <Icon className="h-4 w-4" style={{ color: toneColor }} strokeWidth={2} />
      </div>
      <p className="mt-3 text-[26px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">{value}</p>
      {hint && <p className="mt-1 text-[12.5px] text-[var(--text-tertiary)]">{hint}</p>}
    </Card>
  );
}
