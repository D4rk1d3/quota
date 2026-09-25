# Handoff: Quota — Design System & App Mockups (macOS, iOS, Android, Member Web)

## Overview
Quota is a premium app for tracking recurring shared subscription costs (Netflix, Spotify, gym, etc.) inside small groups. One organizer (Pietro, in this dataset) pays and tracks who owes what; members never need an account. This package contains a complete design system and full-app mockups for macOS, iOS, and Android, plus the no-account member web page — realistic Italian sample data throughout.

## About the design files
The files in `source/` are **design references built in HTML** (Anthropic "Design Component" format — a custom templating/preview runtime). They are prototypes showing the intended look, layout, and states — **not production code to copy directly**. The task is to **recreate these designs pixel-for-pixel in real native/production code**:
- **macOS** → SwiftUI (or AppKit) native app
- **iOS** → SwiftUI native app
- **Android** → Jetpack Compose native app
- **Member web page** → any lightweight web stack (static HTML/CSS/JS or a simple framework) — no login, no build step required

Do not try to run or embed the `.dc.html`/`.jsx` files themselves in the product — treat them purely as the visual and behavioral spec. Open them in a browser (they're self-contained) to inspect live, or use the PNG screenshots in `screenshots/` for a static reference.

## Fidelity: HIGH (hifi) — pixel parity is the goal
This is a finished, hifi design system with final colors, typography, spacing, states, and copy. **The explicit requirement from the design owner is that the three apps must look graphically IDENTICAL to each other and to these mockups** — same layout, same colors, same type scale, same spacing, same corner radii, same iconography — adapted only where the OS truly requires it (navigation chrome, back gesture, system dialogs, safe areas, keyboard behavior). See `AI_BUILD_BRIEF.md` for the platform-by-platform parity checklist — read that file first if you are the engineer/agent implementing this.

## Design system source
- `source/Quota Design System - Foundations.dc.html` — color, type, spacing, radii, shadow, motion, icon, height tokens (dark + light).
- `source/Quota Design System - Components.dc.html` — the component gallery (all states: default/hover/pressed/disabled/loading/error).
- `PALETTE.md` — the same tokens as a flat, copy-pasteable reference (exact hex/rgba values).
- Individual component source: `source/QDS *.dc.html` (Button, Avatar, AmountDisplay, StatusBadge, MemberRow, PaymentRow, ProgressBar, SubscriptionCard, Capsule Nav, Mac Sidebar) — each one is the literal spec for that component's every visual state, including its `light` prop branch.

## App screens (all three platforms carry the same set; iOS/Android are the same layout, only nav chrome differs from macOS)
1. **Login** — magic-link email entry; default, loading, error, and light-mode states.
2. **Home / Dashboard** — greeting, month totals (collected/remaining/paid count), active subscription card with member rows and a "Remind" action; full-data, loading-skeleton, empty, error, and light-mode states.
3. **Groups list** — all subscriptions as cards (progress bar + status), plus an outstanding/renewals/overdue summary strip.
4. **Group detail** (Netflix) — cycle switcher (past/current/upcoming), progress, member rows, edit/record-payment actions.
5. **Record payment** — member picker, amount (pre-filled with remainder), method, date, note; modal on macOS, bottom sheet on iOS/Android.
6. **Reverse payment** (macOS) — confirmation flow with reason, never a silent delete.
7. **Activity** — chronological, grouped by day (Today/Yesterday/date), lightweight icons per event type.
8. **Calendar** — month grid with renewal/payment/reminder dots + legend.
9. **Settings** — profile, payment methods, notification lead time, CSV/PDF export.
10. **Member detail** (Luca) — avatar, status, quota vs. remaining, pause/edit/remove actions, full payment history including one reversed entry.
11. **Onboarding** — welcome → create first group → add members → done (4 steps).
12. **Edit subscription**, **Add member**, **Price change confirmation**, **Add payment method** — all as modal/sheet overlays over a dimmed background screen.
13. **Analytics** — collection rate, totals, 6-month bar chart.
14. **Member web page** (no device frame — it's a browser page) — overdue state with amount/status/pay-to info and an "I've paid" report button, plus the post-report confirmation state.

Full screenshots of every one of these, per platform, are in `screenshots/`.

## Design tokens
See `PALETTE.md` for the complete, exact list (colors, type scale, spacing, radii, shadows, motion, icon sizes, control heights). All values there are final — do not approximate or re-derive them.

## Cross-platform rule (critical)
There is **one** design system with three renderings, not three separate designs:
- iOS and Android must be visually near-identical to each other: same layout, spacing, type, color, copy, iconography, and the same floating pill navigation (not a Material bottom tab bar, not Material ripple/elevation conventions — this brand intentionally overrides Android's default visual language to match iOS).
- macOS reuses the same tokens and components but in a sidebar + toolbar desktop layout, taking advantage of width (multi-column, hover states, keyboard affordances).
- Only navigation mechanics, back behavior, system dialogs, keyboard handling, gestures, and safe areas should differ per platform — never colors, type, spacing, or component shapes.

## Assets
- Icons: a small custom rounded-line icon set (`source/quota-icons.jsx`, spirit of SF Symbols, redrawn — not copied from Apple). Recreate as SF Symbols on Apple platforms and Material Symbols Rounded (or an equivalent neutral icon set) on Android, matching stroke weight/proportions.
- Device chrome (`ios-frame.jsx`, `android-frame.jsx`, `macos-window.jsx`, `browser-window.jsx`) is presentation-only scaffolding used to preview the screens — not part of the product UI.
- No photographic or bitmap assets are used anywhere; everything is type, color, and vector icons.

## Files
- `source/` — every design-system and app `.dc.html`/`.jsx` file, current as of this handoff.
- `screenshots/macos/`, `screenshots/ios/`, `screenshots/android/`, `screenshots/member-web/` — PNG captures of the key screens listed above, per platform.
- `PALETTE.md` — flat token reference.
- `AI_BUILD_BRIEF.md` — the build brief for an engineer/coding-agent, with the explicit pixel-parity checklist and platform-by-platform notes.
