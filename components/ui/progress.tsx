"use client";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full flex-1 rounded-full bg-[var(--accent)] transition-transform duration-500 ease-[var(--ease-standard)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
