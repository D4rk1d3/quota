Cerchio pieno (`radius-pill`) con le iniziali del membro, colorato con un colore identificativo — non di brand.

**Il consumer fornisce:** `initials` (2 lettere maiuscole), `color` (uno dei token `avatar-1`…`avatar-5` assegnati round-robin, oppure `avatar-you` per l'utente loggato), opzionalmente `size` (default 40px — 72px nell'header di Dettaglio membro).

**Quando usarla:** sempre insieme a un nome, mai da sola come identità — è `MemberRow` e l'header di Dettaglio membro a comporla con testo e stato. L'utente loggato ("Tu") usa sempre `avatar-you`, mai un colore round-robin, per restare riconoscibile a colpo d'occhio nella lista.

**Do:** iniziali sempre 2 caratteri maiuscoli, calcolati da nome (e cognome se disponibile).
**Don't:** non riusare lo stesso colore identificativo per due membri diversi nello stesso gruppo; non usare `accent` per un membro che non sia l'utente loggato.
