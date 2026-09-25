Barra di avanzamento: traccia `rgba(255,255,255,0.08)` alta 8px, completamente arrotondata, con riempimento `accent` proporzionale a `value / max`.

**Il consumer fornisce:** `value` e `max` (numeri, stessa unità — es. euro nel fondo cassa); l'etichetta numerica sopra la barra ("14,00 € / 21,00 €") e il titolo ("Fondo coperto") sono testo esterno al componente, a cura del consumer.

**Quando usarla:** un solo avanzamento per card, sempre sotto un'etichetta testuale che ne spiega il significato — non ha stati di colore alternativi (non diventa mai ambra/rossa: quello è il ruolo di `Badge`).

**Do:** azzerare la barra (`value: 0`) nello stato vuoto invece di nasconderla, per mantenere la struttura visiva della card.
**Don't:** non superare `max` con `value` — viene troncato al 100% ma il numero sopra la barra deve restare coerente.
