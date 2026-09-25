Riga di lista per un membro: `Avatar` + nome (+ "· Tu" se è l'utente loggato) + "Coperto fino al …" + `Badge` di stato + chevron. È la stessa riga, identica, in Dashboard, Membri e (filtrata) nello storico di Dettaglio membro.

**Il consumer fornisce:** `initials`, `color`, `person`, `covered` (data testuale, es. "15 nov 2026"), `status`, `you` (aggiunge il suffisso "· Tu" — riservato all'utente loggato).

**Quando usarla:** sempre dentro una `Card` con `padding: "2px 16px"` e senza gap tra le righe — è `MemberRow` stessa a disegnare il separatore (`divider`) sul bordo inferiore, l'ultima riga di una lista lo mostra comunque (nessuna logica "ultimo elemento" nei mockup). Tappabile per aprire Dettaglio membro (il chevron lo segnala).

**Do:** ordine delle righe stabile (non riordinare per stato) — nei mockup i membri appaiono sempre nello stesso ordine su Dashboard e Membri.
**Don't:** non omettere il chevron: è il segnale che la riga è interattiva, a differenza di righe puramente informative.
