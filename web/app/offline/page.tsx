import { WifiOff } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-5">
      <div className="flex max-w-[360px] flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)]">
          <WifiOff className="h-5 w-5 text-[var(--text-tertiary)]" />
        </div>
        <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Sei offline</h1>
        <p className="text-[13.5px] text-[var(--text-secondary)]">
          Quota mostra sempre dati aggiornati e non funziona senza connessione. Riconnettiti e
          ricarica la pagina per continuare.
        </p>
      </div>
    </div>
  );
}
