Pillola di stato: testo colorato su sfondo tenue dello stesso colore (16% di opacità). Le tre etichette e il loro ordine di gravità sono fissi: `regolare` → `ritardo`.

**Il consumer fornisce:** `status` (`"regolare"` | `"scadenza"` | `"ritardo"` | `"cancelled"`); l'etichetta è generata automaticamente ("Regolare", "In scadenza", "In ritardo", "Annullato") — passare `label` solo per un override esplicito, non per tradurre o rinominare gli stati.

**Quando usarla:** stato di un membro (in `MemberRow`, nell'header di Dettaglio membro) o di un pagamento (`cancelled` nello storico pagamenti). Non è un badge generico: i colori sono funzionali (`warning`/`danger`), non decorativi — non riusarla per etichette che non siano uno di questi 4 stati.

**Do:** un solo badge per riga/elemento.
**Don't:** non colorare `warning`/`danger` per altro che "in scadenza"/"in ritardo o errore" — sono riservati a questi significati in tutto il sistema.
