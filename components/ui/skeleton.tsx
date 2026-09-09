import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
