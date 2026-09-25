Guscio visivo del campo di testo: superficie `surface`, bordo `border-subtle`, raggio `radius-field`, icona opzionale a sinistra. Il mockup usa un solo campo (email, nel login): non è ancora specificato un set completo di stati di validazione.

**Il consumer fornisce:** `icon` (nome dal set icone, es. `envelope`), `placeholder`, `value` (quando presente, il testo passa da `ink-tertiary` a `ink`); il comportamento reale di focus/digitazione/validazione va implementato con l'`<input>` nativo della piattaforma — questo componente ne definisce solo l'aspetto.

**Quando usarla:** un solo campo per schermata nei mockup attuali (email di login). Estendere ad altri campi (es. importi in Impostazioni) riusando esattamente `radius-field`/`border-subtle`/`surface`, non inventare una variante.

**Do:** icona sempre a 15px, colore `ink-tertiary`, allineata a sinistra con 10px di gap dal testo.
**Don't:** non usare `radius-card` (20px) per i campi — i campi hanno un raggio dedicato più stretto (`radius-field`, 14px) proprio per distinguersi dalle carte.
