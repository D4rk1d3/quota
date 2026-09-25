Quota è un'app privata (macOS + Android) per dividere l'abbonamento Spotify Family tra i membri di una famiglia o di un gruppo: un admin registra i pagamenti, l'app calcola fino a quando ciascun membro è "coperto", tiene un fondo cassa per gli arrotondamenti e manda promemoria prima degli addebiti. Backend: Supabase (Postgres + Auth via magic link, nessuna password).

Tema **scuro** in stile Apple nativo (HIG), un solo accento verde salvia usato con parsimonia. Il light mode non è ancora stato definito: se richiesto, i token vanno ribilanciati (sfondo chiaro, testo scuro, stesso verde accento) ma i valori qui sotto restano quelli del tema scuro.

## Fondamenta di contenuto

- Tono diretto, funzionale, mai giocoso: l'app maneggia soldi condivisi tra persone reali. Frasi brevi, imperative sui bottoni ("Invia link di accesso", "Registra pagamento Spotify", "Aggiungi il primo membro"), descrittive negli stati ("Impossibile aggiornare i dati", "Verifica la connessione e riprova.").
- Nessuna password: il login è sempre descritto come link magico via email ("Accedi con il link che ti invieremo per email.", "Nessuna password: solo un link sicuro valido 15 minuti.").
- Importi sempre in euro con virgola decimale e simbolo `€` dopo il numero ("20,99 €", "3,50 €"), mai `€20.99`. Le date compatte usano il formato `15 nov 2026`; le date estese usano il formato `15 settembre 2026 · tra 3 giorni`.
- Gli stati dei membri hanno sempre le stesse tre etichette, in quest'ordine di gravità crescente: "Regolare", "In scadenza", "In ritardo". Un pagamento annullato è etichettato "Annullato", mai "Cancellato" o "Rimosso".
- L'utente loggato è sempre etichettato semplicemente "Tu", mai il proprio nome, per distinguersi a colpo d'occhio nella lista membri.
- Niente emoji nell'interfaccia: gli stati e i richiami usano le icone del set descritto in Iconografia, non emoji.

## Fondamenta visive

**Colore.** Un solo verde di brand (`accent`), usato con parsimonia: bottoni primari pieni, riempimento della progress bar, badge "Regolare". Ambra (`warning`) e rosso (`danger`) sono **funzionali**, non di branding: comunicano sempre e solo gli stati "In scadenza" e "In ritardo"/errore — non vanno mai usati come colori decorativi. Il verde acceso (`accent-ink`) è la variante leggibile su sfondo scuro per testo e icone, distinta dal verde pieno dei bottoni (`accent`): non intercambiabili. I membri hanno colori identificativi (`avatar-1`…`avatar-5`) assegnati in modo round-robin — sono etichette visive, non branding; l'utente loggato ("Tu") usa sempre `avatar-you`, che è un alias dell'accento.

**Tipografia.** Un'unica famiglia (SF Pro / -apple-system; su Android sostituire con un'alternativa legale simile, un font rounded neutro) e sette stili di testo (`hero`, `large-title`, `title`, `headline`, `body`, `subheadline`, `caption`). Gli importi grandi (`hero`) sono sempre `tabular-nums`, per non far "ballare" le cifre negli aggiornamenti. Le caption sono sempre maiuscole con letter-spacing, usate come etichette di sezione ("PROSSIMO ADDEBITO", "MEMBRI"), mai come testo continuo.

**Spaziatura e raggi.** Scala di spaziatura 4·8·12·16·20·24·32·40px. Le carte usano `radius-card` (20px) tranne la card principale della dashboard che usa `radius-card-lg` (22px, l'unica eccezione: è il primo elemento che l'utente guarda). Tutto ciò che è cliccabile e "pieno" (bottoni primari, badge, avatar) è una pillola (`radius-pill`, 999px) — è il segnale visivo di interattività/identità in questo sistema, mentre le carte restano ad angolo smussato ma non pillola.

**Ombre.** Una sola scala a tre livelli: `shadow-card` per ogni superficie carta, `shadow-overlay` per popup/overlay, `shadow-window` solo per cornici di finestra/dispositivo nei mockup — non va mai usata su elementi dentro l'interfaccia reale.

**Superfici vetro.** Sidebar macOS e nav a pillola Android sono le uniche superfici "vetro/vibrancy" (`surface-glass` + `border-glass` + blur 40–50px, saturate 180–200%): la vibrancy comunica "sei nella cornice di navigazione", non va estesa alle carte di contenuto.

**Stati vuoto/caricamento/errore.** Pattern fisso, riusato identico su ogni schermata: caricamento = blocchi grigi pulsanti (skeleton) della stessa forma del contenuto reale; vuoto = icona tray in un riquadro `surface`, titolo `headline`, descrizione `subheadline`, un bottone primario pillola come unica via d'uscita; errore = banner rosso in alto (`danger` su sfondo tenue, bordo `danger` tenue) con icona, titolo, descrizione e bottone "Riprova", contenuto sottostante mantenuto ma sbiadito (`opacity: 0.35`) invece che nascosto, così l'utente vede che i dati sono "vecchi" ma non persi.

## Iconografia

Set di 22 icone "in stile SF Symbols" disegnate a mano (linea arrotondata, monocromatiche, `viewBox 0 0 24 24`, `stroke-width 1.7`, `stroke-linecap/linejoin round`, nessun riempimento) — **non sono asset Apple reali**: nella build finale macOS vanno sostituite con SF Symbols veri, su Android con Material Icons Rounded o equivalenti. Fino ad allora, questo è il set di riferimento pixel-per-pixel (cartella `assets/Icons/`, un file per icona, colore ereditato da `currentColor`): `home`, `people`, `calendar`, `clock`, `gear`, `plus`, `chevronRight`, `chevronLeft`, `chevronDown`, `check`, `x`, `coin`, `pencil`, `warning`, `tray`, `envelope`, `wifiSlash`, `bell`, `undo`, `refresh`, `lock`, `euroSign`.

Le icone monocromatiche ereditano sempre il colore dal contesto (testo/icona coerenti, es. `danger` nel banner di errore, `accent-ink` sulla voce attiva della sidebar): non hanno mai un colore fisso proprio.

## Differenze di piattaforma

- **macOS**: navigazione con sidebar nativa a sinistra (vetro/vibrancy), stile Mail/Note/Reminders, toolbar in alto con titolo.
- **Android**: nessuna tab bar Material standard — nav **flottante a pillola**, staccata dai bordi, solo icone, in basso, con l'icona attiva evidenziata da un cerchio verde tenue (mai un blob invadente).
- Le due piattaforme condividono lo stesso set icone, gli stessi componenti riga-membro/badge di stato e la stessa scala di token: cambia solo il contenitore di navigazione.

## Intentional additions

Rispetto al bundle di handoff originale (due macro-schermate macOS/Android + 3 sotto-componenti + set icone), questo design system scompone l'interfaccia negli elementi riusabili effettivamente definiti nei mockup — non sono componenti "di libreria standard" aggiunti di iniziativa, ma ciò che le 7 schermate già usano ripetutamente: `Button`, `IconButton`, `Input`, `Card`, `Badge`, `ProgressBar`, `Avatar`, `MemberRow`, `Sidebar` (macOS), `CapsuleNav` (Android), `EmptyState`, `ErrorBanner`, `Skeleton`, `Icon`.
