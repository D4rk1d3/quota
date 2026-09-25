Card centrata: icona `tray` in un riquadro `rgba(255,255,255,0.06)`, titolo `headline`, descrizione `subheadline` (max 280px, centrata), bottone primario opzionale come unica via d'uscita dallo stato vuoto.

**Il consumer fornisce:** `title`, `description`, `ctaLabel` (omettibile se non c'è un'azione sensata — es. un elenco filtrato senza risultati potrebbe non averne una), `onCta`.

**Quando usarla:** il contenuto principale di una schermata è assente per la prima volta (nessun membro, nessuna attività) — non per un errore di rete: quello è `ErrorBanner`. Il pattern (icona + titolo + descrizione + CTA) va replicato identico su ogni schermata che può essere vuota, non solo su Dashboard dove è stato disegnato esplicitamente.

**Do:** descrizione sempre propositiva ("Aggiungi…", "Inizia a…"), mai colpevolizzante.
**Don't:** non usare `warning`/`danger` nell'icona o nel testo: uno stato vuoto non è un errore, è un punto di partenza.
