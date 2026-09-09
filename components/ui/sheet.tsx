"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Sheet: su mobile appare come bottom sheet (slide-up, ancorato in basso,
// angoli superiori arrotondati); su desktop (md+) diventa un dialog
// centrato — stesso componente, comportamento responsive via CSS.

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]", className)}
      {...props}
    />
  );
}

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          // mobile: bottom sheet
          "fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto",
          "rounded-t-[var(--radius-lg)] border-t border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]",
          "p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] focus:outline-none",
          "data-[state=open]:animate-quota-in",
          // desktop: centered dialog
          "md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:w-full md:max-w-md",
          "md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-lg)] md:border md:max-h-[85vh]",
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-[var(--border-strong)] md:hidden" />
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 hidden rounded-full p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] md:block">
          <X className="h-4 w-4" />
          <span className="sr-only">Chiudi</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-6", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-[13px] text-[var(--text-secondary)]", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2.5 md:flex-row md:justify-end", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
