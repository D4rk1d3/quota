Bottone a pillola (`radius-pill`). Due varianti soltanto: `primary` (sfondo `accent` pieno, 44px, per l'unica azione principale di una schermata/card) e `secondary` (sfondo `rgba(255,255,255,0.1)` translucido, 32px, per azioni di supporto come "Riprova"). Non esiste una variante di bottone distruttivo/danger: nessuna azione dei mockup lo richiede.

**Il consumer fornisce:** `label` (imperativo, breve — "Invia link di accesso", "Aggiungi il primo membro"), `icon` opzionale (nome dal set, mostrato a sinistra del testo), `variant`, `loading` (mostra uno spinner al posto dell'icona e disabilita implicitamente l'interazione), `disabled`.

**Quando usarla:** un solo bottone `primary` visibile per schermata/card — è il modo in cui l'interfaccia dice "questa è l'azione che conta". `secondary` può comparire accanto a un banner o in coppia con altre azioni minori.

**Do:** testo sempre in `body`/600 (14px) per `primary`, 12.5px/600 per `secondary`; icona coerente con l'azione (`plus` per aggiungere/registrare, `refresh` per riprovare).
**Don't:** non usare `secondary` per l'azione principale di una schermata — la gerarchia primario/secondario è anche gerarchia di importanza, non solo di stile.
