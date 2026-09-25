Superficie contenitore (`surface`, `shadow-card`). Due dimensioni di raggio soltanto: `default` (`radius-card`, 20px — quasi ogni card) e `lg` (`radius-card-lg`, 22px — riservata alla card principale della dashboard, l'unico elemento che rompe la regola per essere il primo che l'utente guarda).

**Il consumer fornisce:** `size`, `padding` (default `24px 26px`), `gap` (spaziatura verticale tra i figli, default 18px), `shadow` (`false` per annullarla quando la card è annidata in un'altra superficie già ombreggiata, come le righe membro), `children` (nodi già composti — testo, `ProgressBar`, `Button`, ecc.).

**Quando usarla:** ogni raggruppamento di contenuto a sé stante (riepilogo, lista, impostazione). Le righe membro (`MemberRow`) vivono dentro una `Card` con `padding: "2px 16px"` e senza gap tra le righe (il separatore lo disegna `MemberRow` stessa con `divider`).

**Do:** un solo livello di `shadow-card` visibile per area — se annidi una card dentro un'altra, la interna passa `shadow: false`.
**Don't:** non usare `radius-card-lg` per altro che la card "prossimo addebito": è un'eccezione dichiarata, non un'alternativa stilistica.
