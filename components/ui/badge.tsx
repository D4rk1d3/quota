import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-medium leading-none w-fit",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
        accent: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
        amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
        brick: "bg-[var(--brick-soft)] text-[var(--brick)]",
        outline: "border border-[var(--border-strong)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

function Dot({ className }: { className?: string }) {
  return <span className={cn("h-1.5 w-1.5 rounded-full bg-current", className)} />;
}

function Badge({
  className,
  variant,
  dot = true,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <Dot />}
      {props.children}
    </span>
  );
}

export { Badge, badgeVariants };
