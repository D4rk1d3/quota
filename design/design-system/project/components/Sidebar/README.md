Navigazione macOS: colonna vetro/vibrancy larga 220px (`surface-glass` + blur 40–50px saturate 180–200% + `border-glass` sul bordo destro), 5 voci fisse in quest'ordine: Dashboard, Membri, Calendario, Attività, Impostazioni — stile Mail/Note/Reminders.

**Il consumer fornisce:** `active` (una tra `dashboard`, `members`, `calendar`, `activity`, `settings`) — le 5 voci e le loro icone (`home`, `people`, `calendar`, `clock`, `gear`) sono fisse, non configurabili dal chiamante: il set di navigazione non cambia tra le schermate.

**Quando usarla:** solo su macOS, sempre a tutta altezza a sinistra, con `MacToolbar` in cima al contenuto a destra (titolo + eventuale ricerca). Su Android usare `CapsuleNav`, mai `Sidebar`.

**Do:** la voce attiva ha sfondo `rgba(255,255,255,0.12)`, icona `#6FA382`, testo 600; le altre restano a icona `rgba(255,255,255,0.55)`, testo 500 — il contrasto tra i due stati è minimo di proposito (è una superficie vetro, non una lista ad alto contrasto).
**Don't:** non aggiungere una sesta voce o un badge di notifica sulla sidebar: il brief la vuole essenziale, solo icona + etichetta.
