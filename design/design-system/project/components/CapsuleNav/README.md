Navigazione Android: pillola vetro flottante, staccata dai bordi, solo icone — stesse 5 voci di `Sidebar` (Dashboard, Membri, Calendario, Attività, Impostazioni), nello stesso ordine. Non è una tab bar Material standard.

**Il consumer fornisce:** `active` (una tra `dashboard`, `members`, `calendar`, `activity`, `settings`); ogni voce è un `IconButton` a 40px con `iconSize` 21px.

**Quando usarla:** solo su Android, ancorata in basso, staccata dai bordi dello schermo (mai a tutta larghezza, mai attaccata al fondo). È l'unico punto in cui macOS e Android divergono strutturalmente: stesso set di icone e stessa gerarchia, contenitore diverso.

**Do:** la voce attiva usa il cerchio verde **tenue** (`rgba(111,163,130,0.22)`) — "come se Apple l'avesse disegnata", mai un blob invadente o un colore pieno.
**Don't:** non aggiungere etichette testuali sotto le icone: il brief la vuole solo-icona, a differenza della sidebar macOS.
