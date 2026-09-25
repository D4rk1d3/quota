Bottone circolare solo icona, in tre possibili stati visivi: neutro (trasparente, icona `ink-secondary`), attivo (sfondo `rgba(111,163,130,0.22)`, icona `#6FA382` — usato in `CapsuleNav` per la voce di navigazione corrente) e pieno (sfondo `accent`, icona `ink` — usato per azioni compatte come il "+" nell'header di Membri).

**Il consumer fornisce:** `icon`, `active` (per lo stato di navigazione selezionata — mutuamente esclusivo con `filled`), `filled` (per un'azione compatta piena), `size` (default 40px; 34px nell'header di Membri), `iconSize`.

**Quando usarla:** dentro `CapsuleNav` (sempre `active` sulla voce corrente, mai su più di una) o come azione compatta isolata quando un `Button` con testo sarebbe troppo ingombrante (es. header di lista).

**Do:** il cerchio "attivo" è **tenue** (`rgba(111,163,130,0.22)`), mai un riempimento pieno — nel brief è esplicitamente "un cerchio verde tenue, non un blob invadente".
**Don't:** non combinare `active` e `filled` sullo stesso bottone — sono due significati diversi (posizione corrente vs. azione).
