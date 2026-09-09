"use client";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]",
        "bg-[var(--surface-muted)] data-[state=checked]:bg-[var(--accent)]",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[18px] w-[18px] translate-x-[3px] rounded-full bg-white shadow-sm transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)]",
          "data-[state=checked]:translate-x-[19px]"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
