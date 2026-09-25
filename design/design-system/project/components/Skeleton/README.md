Blocco grigio pulsante (`quota-pulse`, 1.3s, opacità 0.35 → 0.7) che sostituisce un elemento reale mentre carica.

**Il consumer fornisce:** `width`, `height`, `radius` (di default 6px — usare `999px` per sostituire una pillola/progress bar, `radius-pill`/40px+40px per sostituire un `Avatar`), `background` (default `rgba(255,255,255,0.1)`; usare un valore più tenue come `rgba(255,255,255,0.07)` per il secondo/terzo elemento di un gruppo, come nella dashboard).

**Quando usarla:** solo per lo stato di caricamento — ogni schermata replica la **stessa forma** del proprio contenuto reale (uno skeleton rettangolare al posto di una riga di testo, un cerchio al posto di un `Avatar`), mai una forma generica uguale ovunque. Login e Dashboard hanno layout di caricamento disegnati; le altre schermate (Membri, Dettaglio membro, Calendario, Attività, Impostazioni) devono replicare lo stesso pattern visto in Dashboard.

**Do:** raggruppare 2–3 skeleton per riga/card, come nel contenuto reale che sostituiscono.
**Don't:** non animare più di una manciata di skeleton contemporaneamente con intensità diverse: la pulsazione è unica e condivisa (`quota-pulse`).
