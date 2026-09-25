# Quota — export del design system

Copia statica del design system pubblicato su Claude (artifact `XeEGDKJmLfYZ8defkRvn1C`), generata il 17 settembre 2026. Se lo modifichi nell'artifact, questo export non si aggiorna da solo: rifallo quando serve una copia aggiornata.

## Cosa c'è dentro

- `README.md` — il brand book: tono di voce, regole di formato (importi, date, stati), fondamenta visive, iconografia.
- `tokens.json` — tutti i design token in formato sorgente (colori, tipografia, spaziature, raggi, ombre).
- `tokens.css` — gli stessi token **compilati** in variabili CSS (`:root { --accent: ...; }` ecc.), generati da `tokens.json` per un uso rapido in contesti web/Electron. Non è il formato che consumerai su macOS/Android nativo — lì vai di `tokens.json` direttamente.
- `components/` — 14 componenti di riferimento (Button, Input, Card, Badge, ProgressBar, Avatar, MemberRow, Sidebar, CapsuleNav, EmptyState, ErrorBanner, Skeleton, Icon), ciascuno con:
  - `README.md` — a chi serve, cosa fornisce il chiamante, do/don't;
  - `preview.html` — piccola demo apribile in un browser (usa `bundle.js`/`bundle.css`, vanilla JS, nessun framework);
  - `bundle.js`, `bundle.css`, `index.d.ts` (nella cartella `components/`) — l'implementazione di riferimento condivisa da tutte le preview.
- `assets/Icons/` — le 22 icone del set (`.svg`, rounded-line, stroke `currentColor`), copiate esatte dai path del bundle originale.

## Come consumarlo

**Importante, dal brief originale:** questi file sono **riferimento di design**, non codice di produzione. Per l'app reale:
- **macOS**: ricrea i componenti con AppKit/SwiftUI usando i valori di `tokens.json`; sostituisci le icone con SF Symbols veri.
- **Android**: ricrea i componenti con Jetpack Compose usando gli stessi valori; sostituisci le icone con Material Icons Rounded o equivalenti.
- **Se invece ti serve una superficie web/Electron** (es. un pannello admin), `tokens.css` + `components/bundle.js`/`bundle.css` sono già utilizzabili così come sono: `<link>` il CSS, poi carica `bundle.js` come script classico — espone `window.Quota.Button(...)`, `window.Quota.Card(...)` ecc., ognuna ritorna un nodo DOM.

Il light mode non è stato disegnato nella sorgente originale: tutto qui è tema scuro.
