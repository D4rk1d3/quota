Renderizza una singola icona del set Quota (22 icone rounded-line "in stile SF Symbols", disegnate a mano — non asset Apple/Material reali) come `<svg>` inline che eredita colore da `currentColor`.

**Il consumer fornisce:** `name` (una chiave del set: `home`, `people`, `calendar`, `clock`, `gear`, `plus`, `chevronRight`, `chevronLeft`, `chevronDown`, `check`, `x`, `coin`, `pencil`, `warning`, `tray`, `envelope`, `wifiSlash`, `bell`, `undo`, `refresh`, `lock`, `euroSign`); opzionalmente `size` (default 20), `color` (default `currentColor`), `strokeWidth` (default 1.7, lo spessore di linea del set).

**Quando usarla:** ovunque serva un'icona coerente con il set — dentro `Button`, `IconButton`, `Badge`-adiacenze, `MemberRow`, banner di stato. Non introdurre altre icone/librerie: il set è chiuso e definisce l'inventario del sistema.

**Do:** lasciare che il colore erediti dal contesto (`accent-ink` su superfici scure attive, `danger` nei banner di errore, `ink-tertiary` per elementi disattivati/placeholder).
**Don't:** forzare un `fill` — le icone sono a stroke, non piene; un nome non riconosciuto ricade silenziosamente su `x`, quindi verificare sempre l'ortografia del nome.

Nella build finale macOS/Android questo set va sostituito con SF Symbols veri (macOS) o Material Icons Rounded/equivalenti (Android): è un riferimento pixel-per-pixel, non l'asset di produzione.
