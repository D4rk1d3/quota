Banner in alto sulla schermata: icona `wifiSlash`, titolo e bordo in `danger` su sfondo tenue (12%/30% di opacità), bottone `secondary` "Riprova" con icona `refresh`. Va sempre in coppia con il contenuto sottostante mantenuto a `opacity: 0.35` invece che nascosto — l'utente deve capire che i dati sono "vecchi", non spariti.

**Il consumer fornisce:** `title` (default "Impossibile aggiornare i dati"), `description` (default "Verifica la connessione e riprova."), `onRetry`.

**Quando usarla:** un errore di rete/aggiornamento su una schermata che ha già del contenuto da mostrare (stale-while-error) — non per un errore bloccante alla prima apertura, dove serve invece un `EmptyState` con testo d'errore o un pattern dedicato.

**Do:** il banner sta sempre in cima, sopra il contenuto sbiadito, mai sovrapposto/in overlay.
**Don't:** non nascondere il contenuto sottostante quando appare il banner — è la differenza esplicita tra questo pattern e uno stato vuoto.
