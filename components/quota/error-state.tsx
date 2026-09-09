"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Qualcosa non ha funzionato",
  description = "Non è stato possibile caricare questi dati. Riprova.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brick-soft)]">
        <AlertTriangle className="h-5 w-5 text-[var(--brick)]" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[15px] font-medium text-[var(--text-primary)]">{title}</p>
        <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </div>
  );
}
