# Quota

Dividi gli abbonamenti in comune (Netflix, Spotify, palestra...) con il tuo gruppo:
chi ha pagato, quanto manca, quando si rinnova. Quota non muove mai soldi, registra soltanto.

Prodotto multi-abbonamento, multi-utente, con piano gratuito (1 abbonamento, 6 membri)
e piano Pro a pagamento (LemonSqueezy).

## Struttura

| Cartella | Cosa contiene | Stato |
|---|---|---|
| `supabase/` | Backend: migration (schema, RLS, funzioni, limiti del piano gratuito) ed Edge Function (`lemonsqueezy-webhook`, `create-checkout`). Progetto Supabase `nsxgzemqcsetxggmujdc`. | In uso |
| `macos/` | App nativa macOS in SwiftUI (`app.quota.mac`). Progetto Xcode generato con XcodeGen da `project.yml`. | In uso |
| `android/` | App nativa Android in Kotlin/Compose. **Ancora sul vecchio modello** (un solo Spotify) e sul vecchio progetto Supabase: da riscrivere sul nuovo backend. | Da rifare |
| `web/` | Vecchio sito Next.js. Non fa parte del prodotto (solo app native): tenuto come riferimento e da eliminare. | Dismesso |

## macOS

```bash
cd macos
xcodegen generate
xcodebuild -project Quota.xcodeproj -scheme Quota -configuration Debug \
  -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build
```

Login con link via email: lo schema URL `app.quota.mac://login-callback` deve essere
tra i Redirect URLs di Supabase (Authentication, URL Configuration).

## Backend

```bash
npx supabase link --project-ref nsxgzemqcsetxggmujdc
npx supabase db push                          # applica le migration in supabase/migrations
npx supabase functions deploy create-checkout # e lemonsqueezy-webhook
```

Segreti (mai nel repo): `.env.local` in questa cartella e i secret di Supabase
(`LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`).
