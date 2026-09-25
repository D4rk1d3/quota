"use client";
import { useEffect } from "react";
import { ErrorState } from "@/components/quota/error-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-5">
      <div className="w-full max-w-[420px]">
        <ErrorState
          title="Impossibile caricare i dati"
          description="Si è verificato un errore nel comunicare con il database. Riprova."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
