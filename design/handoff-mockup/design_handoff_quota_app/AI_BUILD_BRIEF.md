# Build brief for a coding agent — Quota, three native apps, ONE identical visual design

You are building three separate native codebases — **macOS (SwiftUI)**, **iOS (SwiftUI)**, **Android (Jetpack Compose)** — that must render **visually identical UI** to the mockups in this handoff. Read `README.md` and `PALETTE.md` first. This file is the strict parity checklist.

## The core instruction
Every screen in `screenshots/` and every `.dc.html` source file in `source/` is the exact, final visual target. Not "inspired by" — **identical**: same colors (hex-for-hex, from `PALETTE.md`), same type sizes/weights, same spacing, same corner radii, same shadows, same icon shapes/strokes, same copy (Italian text is final — do not translate or reword it), same layout structure and proportions. iOS and Android in particular must look like the same screenshot with only OS-forced chrome differences — do not apply Material Design defaults (no bottom tab bar, no FAB, no ripple, no Material elevation/shadow tokens, no default Material color roles) to the Android build. Android reuses the exact same floating pill navigation, cards, and typography scale as iOS.

## Do this, in order
1. **Build the token layer first**, one per platform, transcribed directly from `PALETTE.md` — colors (dark + light), type scale, spacing scale, radii, shadows, control heights, motion durations. Do not let the platform's default design system (Human Interface Guidelines defaults, Material 3 defaults) leak in anywhere a token is specified here.
2. **Build each component once**, matching the corresponding `source/QDS *.dc.html` file exactly, including every state it defines (default/hover/pressed/disabled/loading/error, and its light-mode branch): Button, Avatar, AmountDisplay, StatusBadge (8 statuses: scheduled/due/paid/partial/overdue/credit/paused/removed — always icon + label, never color alone), MemberRow, PaymentRow, ProgressBar, SubscriptionCard, the pill-shaped bottom nav (iOS/Android) and sidebar nav (macOS).
3. **Build each screen** from the corresponding screenshot(s) + the matching section of the `.dc.html` source (search the file for the screen's Italian heading, e.g. `Registra pagamento`, to find its exact markup/values). Match:
   - Exact copy (Italian, verbatim)
   - Exact numbers/sample data (Netflix €19,99/mese, Pietro/Marco/Luca, €6,66/€6,67 shares, etc. — realistic data, not placeholders)
   - Exact spacing between elements (use the spacing scale, don't eyeball it)
   - Exact corner radii and shadow depth per element type
4. **Verify pixel parity** by placing your build side-by-side with the matching screenshot at the same width and checking: type size/weight, color, spacing, radius, icon shape. Fix any drift before moving to the next screen.

## Platform-specific adaptation (the ONLY things allowed to differ)
- **Navigation mechanics**: macOS = persistent sidebar + toolbar; iOS/Android = floating pill nav bar (5 items: Home, Groups, Calendar, Activity, Settings) — same on both, not a Material bottom bar.
- **Back behavior**: iOS swipe-back / nav-bar back chevron; Android system back gesture/button; macOS has no "back" — sidebar switches sections directly.
- **System dialogs / pickers**: use each platform's native date picker, share sheet, etc. — but style any custom sheet/modal chrome (corner radius, backdrop, blur) to match the mockup, not the OS default.
- **Keyboard handling**: platform-native text input behavior; visual style (border, radius, placeholder color) stays per `PALETTE.md`.
- **Safe areas / gestures**: respect each OS's safe-area and gesture-navigation insets; don't let them shift the visual token values used inside the safe area.
- **Typography engine**: Apple platforms use real SF Pro (`-apple-system` in the mockups approximates it) — use the system font directly. Android has no SF Pro license; use an equivalent neutral geometric/humanist system sans (e.g. Roboto or Google Sans Text) at the *same* size/weight/line-height scale from `PALETTE.md` — do not adopt Android's default Material type scale.
- **Icons**: redraw the icon set from `source/quota-icons.jsx` (rounded-line, ~1.7–2px stroke) using SF Symbols on Apple platforms and Material Symbols Rounded (outlined/rounded variant, not filled) on Android, matched for size and visual weight — never swap in a differently-weighted or filled icon style.

## What must NOT differ across the three apps
Color values, type scale, spacing scale, radii, shadow depth, component shapes (button pill shape, card corner radius, avatar circle, status-badge pill), copy/microcopy, sample data, information architecture (same 5 sections: Home/Groups/Calendar/Activity/Settings), and the dark-mode-first posture (dark is the primary experience; light mode is the same layout with the light tokens from `PALETTE.md`, not a separate design).

## Screens to implement (see README.md §"App screens" for the full list and behavior notes)
Login, Home/Dashboard, Groups list, Group detail, Record payment, Reverse payment (macOS), Activity, Calendar, Settings, Member detail, Onboarding (4 steps), Edit subscription, Add member, Price change, Add payment method, Analytics, and the no-account Member web page (separate lightweight web deliverable, not part of the three native apps).

## Product logic to preserve (not just visuals)
- Quota never holds, moves, or processes money. "Record payment" and "I've paid" are both just status updates/notifications — never a real transaction.
- Payments are never silently edited or deleted — a correction is always a reversal (with reason) followed by a new entry; the activity log shows both.
- Partial payments track `paid / total` and support adding more later.
- Price changes apply from the next cycle only; past cycles are immutable.
- Members never need accounts, passwords, or the app installed — only the organizer has an account.
