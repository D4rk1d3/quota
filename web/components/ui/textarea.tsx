import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--text-primary)]",
        "placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus-visible:border-[var(--accent)] resize-none",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
