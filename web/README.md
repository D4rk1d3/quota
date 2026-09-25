# Quota — divisione Spotify Family

PWA privata per la gestione della divisione di un abbonamento Spotify Family
tra sei persone. Un solo amministratore autenticato; i membri non hanno
accesso all'app — è un pannello di controllo a uso personale, con backend
reale su Supabase (Postgres + Auth + RLS + Edge Functions + cron).

## Stack

- Next.js 16 (App Router) + TypeScript, Server Actions, Server Components
- Supabase: Postgres, Auth (magic link), Row Level Security, Edge Functions,
  pg_cron + pg_net per il job giornaliero
- Zod per la validazione degli input lato server
- Tailwind CSS v4 + componenti in stile shadcn/ui su primitive Radix
- Vitest per i test unitari e di integrazione
- Vercel per il deployment

Tutti gli importi sono trattati **esclusivamente in centesimi interi** nel
database e nella business logic (colonne `*_cents`, funzioni SQL, Zod
schema). La conversione in euro avviene solo all'ultimo miglio, per la sola
formattazione a schermo (`lib/adapters.ts`, `formatEUR`).

## Struttura del progetto

```
app/
  login/page.tsx              Login (magic link)
  auth/callback/route.ts      Scambio codice PKCE -> sessione
  offline/page.tsx             Pagina offline della PWA
  (app)/layout.tsx             Fetch dati reali + provider, protetto da middleware
  (app)/page.tsx                Dashboard
  (app)/membri/                Lista + dettaglio membro
  (app)/calendario/            Calendario mensile derivato
  (app)/impostazioni/          Piano Spotify, notifiche automatiche, fondo

components/quota/              Componenti di dominio (invariati nella grafica
                                originale, ora alimentati da dati reali via
                                QuotaDataProvider invece che da mock)

lib/
  supabase/server.ts           Client Supabase server-side (sessione utente, anon key)
  supabase/client.ts           Client Supabase browser-side
  supabase/middleware.ts       Refresh sessione + protezione rotte
  supabase/queries.ts          Query di sola lettura (dashboard, membri, attività...)
  supabase/database.types.ts   Tipi generati dallo schema Postgres
  actions/                     Server Actions (members, payments, subscription, auth)
  validation.ts                Schema Zod per ogni input
  domain.ts, calendar-utils.ts Formattazione/derivazione lato UI (euro, date)
  adapters.ts                  Conversione cents <-> euro (solo per la UI)

supabase/
  migrations/                  Migrazione SQL riproducibile, in ordine
  functions/daily-notifications Edge Function del job giornaliero
  tests/rls.test.sql           Test RLS eseguibili in SQL Editor / psql
  config.toml                  Config Supabase CLI per lo sviluppo locale

tests/
  unit/                        Test Vitest puri (nessuna rete)
  integration/                 Test Vitest contro il progetto Supabase reale
```

## Modello dati (riassunto)

Il DB supporta **più abbonamenti attivi in parallelo** (Spotify, Netflix,
ecc.), condivisi dallo stesso gruppo di persone:

- `subscriptions` — un abbonamento: `name`, `monthly_cost_cents`,
  `billing_day`, `member_quota_cents` (quota "standard" suggerita),
  `start_date`. Più righe `active = true` possono coesistere
  (storicizzabile: disattivarne una non la cancella).
- `members` — anagrafica **globale** delle persone (nome, email, colore,
  note). Nessun account: sono solo record, condivisi tra abbonamenti.
- `subscription_members` — la partecipazione di una persona a un
  abbonamento specifico: `monthly_share_cents`, `joined_at`, `active`. È
  qui che vive la quota reale di ognuno per quel piano (una stessa persona
  può avere quote diverse su abbonamenti diversi).
- `payments` — **ledger immutabile**: solo `INSERT`/`SELECT`, nessun grant
  `UPDATE`/`DELETE` nemmeno per l'admin. Annullare o correggere un
  pagamento significa inserire una nuova riga (`kind = 'void'` o
  `'adjustment'`) che referenzia l'originale — mai una modifica silenziosa.
  Ogni riga porta `subscription_id` **e** `member_id`, vincolati da una
  foreign key composita verso `subscription_members`: non è possibile
  registrare un pagamento per una combinazione persona/abbonamento
  inesistente.
- `coverage_allocations` — come l'importo di ogni pagamento è stato diviso
  sui cicli mensili (`cycle_date`) di **quel** abbonamento. Anch'essa
  immutabile/insert-only, stessa foreign key composita di `payments`.
- `notifications` — generate dal job giornaliero per ciascun abbonamento
  attivo, con `idempotency_key` univoca (namespaced per `subscription_id`)
  per evitare duplicati.
- **Nessuna tabella di calendario**: le scadenze mensili sono calcolate al
  volo da `billing_day` + `start_date` (funzione `public.billing_cycles`).

La copertura di un membro (credito disponibile, mesi coperti, "coperto fino
al") è calcolata da `public.member_coverage(member_id, subscription_id,
as_of)`, il fondo da `public.fund_state(subscription_id, as_of)` — ogni
abbonamento ha il proprio fondo, essendo economicamente indipendente.
Entrambe leggibili via RPC da `lib/supabase/queries.ts`.

**Nota sull'app attuale**: l'interfaccia mostra ancora un solo piano per
schermata (non c'è ancora uno switcher tra abbonamenti). Tutte le query
risolvono "quale" abbonamento tramite `getDefaultSubscriptionId()` in
`lib/supabase/queries.ts` (il più vecchio tra gli attivi) — un ponte
deliberato e isolato in un unico punto, in attesa di un selettore reale in
UI.

## Setup da zero

### 1. Progetto Supabase

```bash
npx supabase login
npx supabase link --project-ref <il-tuo-project-ref>
npx supabase db push   # applica supabase/migrations/*.sql in ordine
```

In alternativa, incolla il contenuto dei file in `supabase/migrations/` (in
ordine di nome file) nello SQL Editor di Supabase Studio.

⚠️ **Prima di applicare `20260909140100_admin_auth.sql`**, sostituisci
l'email di esempio con quella reale dell'amministratore:

```sql
insert into private.admin_config (email) values ('la-tua-email@esempio.com');
```

### 2. Autenticazione (magic link, solo admin)

Nella dashboard Supabase → **Authentication → Providers → Email**:
- Abilita "Email provider"; magic link è già incluso.
- Non serve altro lato Auth: il blocco per email non-admin avviene a
  livello database (`private.is_admin()` + trigger `handle_new_auth_user`
  che rifiuta qualunque signup con email diversa da quella configurata).

**Authentication → URL Configuration**:
- Site URL: l'URL di produzione (es. `https://quota.tuodominio.vercel.app`)
- Redirect URLs: aggiungi anche `http://localhost:3000/auth/callback` e
  l'URL di ogni ambiente preview che userai.

Il login è passwordless: l'admin inserisce la propria email in `/login`,
riceve un'email con un link, e viene autenticato. Qualunque altra email
viene rifiutata sia lato client (`lib/actions/auth.ts`, confronto con
`ADMIN_EMAIL`) sia lato database (`handle_new_auth_user`).

### 3. Variabili d'ambiente

```bash
cp .env.example .env.local
```

Compila con:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — da
  Project Settings → API (la anon/publishable key è pubblica per design,
  la sicurezza è demandata alla RLS).
- `NEXT_PUBLIC_SITE_URL` — URL della build corrente (localhost in dev).
- `ADMIN_EMAIL` — deve combaciare con `private.admin_config.email`.

**Non serve** `SUPABASE_SERVICE_ROLE_KEY` nell'app Next.js: tutte le Server
Action girano con la sessione dell'admin sotto RLS, mai con privilegi di
servizio. La service role key serve solo (a) all'Edge Function del job
notifiche, tramite Supabase Vault (vedi sotto), e (b) opzionalmente per i
test di integrazione più completi.

### 4. Avvio locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000, effettua il login con l'email admin.

## Job giornaliero di notifiche

L'Edge Function `supabase/functions/daily-notifications` genera (in modo
idempotente, via `idempotency_key` univoca) le notifiche in-app e le invia
via email all'admin in un'unica email di riepilogo:

1. 3 giorni prima dell'addebito del giorno 5
2. il giorno dell'addebito
3. quando un membro non copre ancora il ciclo in arrivo
4. quando la copertura di un membro termina entro 7 giorni

### Deploy della funzione

```bash
npx supabase functions deploy daily-notifications
```

### Email (Resend, dietro interfaccia)

`supabase/functions/daily-notifications/_shared/email.ts` definisce
`EmailProvider` con due implementazioni: `ResendEmailProvider` e
`NoopEmailProvider` (fallback che si limita a loggare, usato se
`RESEND_API_KEY` non è configurata — utile in sviluppo). Per abilitare
l'invio reale:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set NOTIFICATIONS_FROM_EMAIL=quota@tuodominio.com
npx supabase secrets set NOTIFICATIONS_TO_EMAIL=admin@esempio.com
```

### Push nativa (Android, FCM)

Stessa idea di `email.ts`: `_shared/push.ts` definisce `PushProvider` con
`FcmPushProvider` (invio reale via FCM HTTP v1, firma il JWT del service
account a mano con Web Crypto — nessuna dipendenza `firebase-admin` in
Deno) e `NoopPushProvider` (fallback che logga soltanto). Per abilitare
l'invio reale, dopo aver creato un progetto Firebase e generato una
service account key (Project Settings → Service accounts → Generate new
private key):

```bash
npx supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
```

I token dei device vengono registrati in `public.device_push_tokens`
dall'app Android stessa (vedi sezione successiva); il job li legge tutti
e invia una push per token a ogni run con notifiche pendenti
(`push_sent_at is null`, stesso pattern di retry di `email_sent_at`).
Token non più validi (app disinstallata, permesso revocato) vengono
rimossi automaticamente quando FCM risponde `UNREGISTERED`/`NOT_FOUND`.

### Pianificazione (pg_cron)

La migrazione `20260909141000_notifications_cron.sql` registra un job
`pg_cron` che chiama la funzione ogni giorno alle 06:00 UTC via `pg_net`.
Per motivi di sicurezza **la service role key non è mai scritta in una
migrazione**: va salvata una sola volta in Supabase Vault, dopo il primo
deploy della funzione:

```sql
select vault.create_secret(
  '<service_role key da Project Settings > API>',
  'quota_service_role_key'
);
```

Finché il secret non esiste, il cron chiama comunque la funzione ma senza
autorizzazione valida (401): nessun effetto collaterale, nessuna notifica
generata.

Per testare manualmente:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/daily-notifications" \
  -H "Authorization: Bearer <service_role o anon key>" \
  -H "Content-Type: application/json" -d '{}'
```

## App Android (Capacitor)

`android/` è un progetto nativo generato da [Capacitor](https://capacitorjs.com)
che carica direttamente `https://quota-nu-six.vercel.app` (vedi
`capacitor.config.ts`) in una WebView: niente build statica, Server
Actions e sessione Supabase via cookie funzionano esattamente come sul
web. Il valore aggiunto del wrapper nativo è la push FCM reale, l'icona
sul dispositivo e la distribuzione via Play Store.

### 1. Firebase (una tantum, gratuito)

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com).
2. Aggiungi un'app Android con package name `com.quota.app` (deve
   combaciare con `appId` in `capacitor.config.ts`).
3. Scarica `google-services.json` e mettilo in `android/app/`
   (è già in `.gitignore`: ognuno usa il proprio progetto Firebase).
4. Project Settings → Service accounts → "Generate new private key": il
   JSON scaricato è quello da usare per `FCM_SERVICE_ACCOUNT_JSON` (vedi
   sopra).

### 2. Build e run

```bash
npx cap sync android
npx cap open android   # apre Android Studio
```

Da Android Studio: Run su un device/emulatore. Al primo avvio l'app
chiede il permesso notifiche e registra il token FCM (server action
`registerPushToken`, tabella `device_push_tokens`, protetta da RLS come
tutto il resto — solo l'admin autenticato può scrivere il proprio token).

### 3. Pubblicazione su Play Store

Non necessaria per l'uso personale (puoi installare l'APK/AAB firmato
direttamente sul tuo device). Se in futuro vorrai pubblicarla: serve un
account Google Play Console ($25 una tantum), una release firmata
(`./gradlew bundleRelease` con un keystore, non incluso nel repo), e le
schermate/testo per la scheda Play Store.

### macOS

Non ancora impacchettata: al momento la PWA installata (Safari/Chrome →
"Aggiungi al Dock") copre il caso d'uso desktop. Un wrapper nativo con
[Tauri](https://tauri.app) resta un'opzione futura, ma richiede un Apple
Developer Program a pagamento ($99/anno) per firma/notarizzazione — non
attivato per ora.

## Sicurezza

- **RLS su ogni tabella** in `public`, con `FORCE ROW LEVEL SECURITY`.
- **`payments` e `coverage_allocations` sono immutabili anche a livello di
  grant SQL**: né RLS né i privilegi concessi ad `authenticated`
  includono `UPDATE`/`DELETE`. Annullamenti e rettifiche sono nuove righe
  (`void_payment`, `adjust_payment`), mai modifiche in-place.
- **`anon` non ha alcun grant** su nessuna tabella o funzione applicativa:
  l'app non ha superfici pubbliche.
- **Un'unica funzione `SECURITY DEFINER` "vera"**: `private.is_admin()`,
  usata da ogni policy RLS. Vive in uno schema non esposto (`private`),
  ha `search_path` bloccato, `EXECUTE` concesso solo ad `authenticated`, e
  verifica sempre `auth.role()`/`auth.email()` della sessione chiamante —
  non bypassa mai la RLS sui dati applicativi. `handle_new_auth_user()` è
  l'unica altra funzione privilegiata (necessaria per i trigger su
  `auth.users`): rifiuta ogni signup la cui email non sia quella
  configurata in `private.admin_config`.
- **Nessun segreto in `NEXT_PUBLIC_*`**: solo URL e anon key, per design
  pubbliche. `SUPABASE_SERVICE_ROLE_KEY` non è mai importata nel codice
  Next.js.
- Test RLS riproducibili in `supabase/tests/rls.test.sql` (anon negato,
  utente non-admin negato, admin autorizzato, ledger immutabile anche per
  l'admin). Eseguibili incollandoli nello SQL Editor o via
  `psql "$DATABASE_URL" -f supabase/tests/rls.test.sql` — girano dentro una
  transazione con `ROLLBACK` finale, non lasciano dati.

⚠️ Attenzione se riusi questo schema su un progetto Supabase diverso:
Supabase concede di default privilegi `ALL` al ruolo `authenticated` su
ogni tabella al momento della creazione. Le migrazioni
`20260909140600_fix_authenticated_grants.sql` e
`20260909140700_fn_execute_grants.sql` li revocano esplicitamente prima di
riconcedere solo i grant puntuali: **vanno applicate entrambe**, altrimenti
l'immutabilità del ledger non è realmente garantita (verificato con test
reali durante lo sviluppo — vedi commenti nei file).

## Test

```bash
npm run test              # unit: allocazione pagamenti/copertura, Zod, date
npm run test:integration  # contro il progetto Supabase reale (RLS anon)
```

I test di integrazione "admin" (record_payment → member_coverage →
void_payment con verifica dell'audit trail) richiedono la service role key
e vengono saltati automaticamente se assente:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service_role key> npm run test:integration
```

Prima di ogni consegna: `npm run lint && npm run typecheck && npm run build
&& npm run test`, più `supabase/tests/rls.test.sql` sul progetto reale.

## PWA

- `public/manifest.webmanifest` + icone in `public/icons/`.
- `public/sw.js` — service worker essenziale: cache solo della shell
  necessaria a mostrare `/offline`, mai dei dati finanziari (privati,
  sempre da rete). Registrato solo in produzione
  (`components/service-worker-register.tsx`).
- `app/offline/page.tsx` — pagina offline minimale.

## Deployment su Vercel

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add NEXT_PUBLIC_SITE_URL
npx vercel env add ADMIN_EMAIL
npx vercel deploy --prod
```

Aggiungi ogni variabile sia per **Production** sia per **Preview** (i
valori possono differire — vedi sotto). Non aggiungere mai
`SUPABASE_SERVICE_ROLE_KEY` alle variabili Vercel: non serve all'app.

### Ambiente preview separato dalla produzione

Consigliato: un secondo progetto Supabase dedicato ai preview (piano free),
con le stesse migrazioni applicate:

```bash
npx supabase link --project-ref <project-ref-preview>
npx supabase db push
```

Poi in Vercel, sotto **Settings → Environment Variables**, imposta
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` con scope
"Preview" puntati al progetto preview, e con scope "Production" puntati al
progetto reale. Ogni PR ottiene così un ambiente isolato che non tocca mai
i dati finanziari reali. (In alternativa, se disponibile sul piano
Supabase in uso, si possono usare i *database branch* nativi di Supabase al
posto di un secondo progetto.)

### URL di reindirizzamento Auth per i preview

Aggiungi anche gli URL dei deployment preview (o un wildcard, se
supportato dal piano) in Supabase → Authentication → URL Configuration →
Redirect URLs, altrimenti il magic link fallirà su quegli ambienti.

## Note di design (invariate dallo scaffold originale)

- Palette: sfondo quasi bianco caldo `#F7F7F5` in chiaro, antracite
  `#131513` in scuro; un solo accento verde Spotify attenuato.
- Card con raggio 22–26px, bordo sottile, ombre quasi impercettibili.
- Animazioni 160–220ms, `prefers-reduced-motion` rispettato.
- Accessibilità: focus visibile, target di tocco minimo 44px, stato mai
  affidato al solo colore.
