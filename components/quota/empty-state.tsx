import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-16"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-[var(--surface-muted)]",
          compact ? "h-9 w-9" : "h-12 w-12"
        )}
      >
        <Icon className={cn(compact ? "h-[18px] w-[18px]" : "h-5 w-5", "text-[var(--text-tertiary)]")} strokeWidth={1.8} />
      </div>
      <div>
        <p className={cn("font-medium text-[var(--text-primary)]", compact ? "text-[13px]" : "text-[15px]")}>{title}</p>
        {description && (
          <p className={cn("mt-0.5 text-[var(--text-tertiary)]", compact ? "text-[12px]" : "text-[13px]")}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
