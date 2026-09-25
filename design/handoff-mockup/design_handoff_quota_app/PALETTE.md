# Quota — Palette & Design Tokens

Source of truth: `source/Quota Design System - Foundations.dc.html` and the `light`/`dark` branches inside each `QDS *.dc.html` component. Every value below is taken verbatim from those files — do not invent new ones.

## Color — Dark (default, first-class)

| Token | Value | Use |
|---|---|---|
| color.background.primary | `#0B0B0D` | App background |
| color.background.elevated | `#1C1C1E` | Cards, sheets, rows |
| color.background.secondary | `#161618` | Rare secondary surface |
| color.text.primary | `#FFFFFF` | Primary text |
| color.text.secondary | `rgba(255,255,255,0.56)` | Secondary text |
| color.text.tertiary | `rgba(255,255,255,0.35)` | Placeholder / tertiary |
| color.separator | `rgba(255,255,255,0.08)` | Hairlines |
| color.accent | `#5B8F6F` | Primary actions / brand |
| color.accent.hover | `#6EA07F` | Primary hover |
| color.accent.pressed | `#4A7A5D` | Primary pressed |
| color.accent.text / success | `#7FB093` | Success text/icon, tertiary button text |
| color.status.warning (due/partial) | `#E3A548` | Amber — due / partial |
| color.status.error (overdue) | `#E2685C` | Red — overdue, destructive |
| color.status.credit | `#8E7CC3` | Purple — credit balance |
| color.status.information | `#5A8FBF` | Blue — informational, avatar tint |

## Color — Light

| Token | Value | Use |
|---|---|---|
| color.background.primary | `#F2F2F5` | App background |
| color.background.elevated | `#FFFFFF` | Cards, sheets, rows |
| color.text.primary | `#1C1C1E` | Primary text |
| color.text.secondary | `rgba(0,0,0,0.55)` | Secondary text |
| color.text.tertiary | `rgba(0,0,0,0.35)` | Placeholder / tertiary |
| color.separator | `rgba(0,0,0,0.08)` | Hairlines |
| color.accent | `#4C7A5D` | Primary actions (darkened for AA on white) |
| color.accent.hover | `#436b51` | Primary hover |
| color.accent.pressed | `#385a44` | Primary pressed |
| color.accent.text / success | `#3F6350` | Success text/icon |
| color.status.warning (due/partial) | `#9A5F12` | Amber, darkened for contrast |
| color.status.error (overdue) | `#C23B2E` | Red, darkened for contrast |
| color.status.credit | `#6B54A8` | Purple, darkened |
| color.status.information | `#5A8FBF` | Blue — unchanged, used as avatar tint only |

Only **one** accent (green) is brand. Amber/red/purple/blue are purely functional status colors, never decorative. Every status also carries an icon + text label — never color alone.

## Typography

Font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif` (Apple platforms use native SF Pro; Android substitutes an equivalent neutral system sans-serif — e.g. Roboto/Google Sans — same scale/weights).

| Token | Size / Weight | Example |
|---|---|---|
| type.display | 40px / 700, tabular-nums | `€13,99` |
| type.title | 28px / 700 | `Netflix` |
| type.headline | 20–25px / 600–700 | `Buonasera, Pietro` |
| type.subheadline | 15px / 600 | `Netflix · €19,99/mese` |
| type.body | 15px / 400 | Body copy |
| type.callout | 14px / 500–600 | Button labels |
| type.caption | 11–12px / 600, uppercase, +0.05em | `RACCOLTO` |
| type.footnote | 11px / 500 | Timestamps, fine print |

All monetary values use `font-variant-numeric: tabular-nums` and the highest weight/size the screen affords.

## Spacing scale (px)
4, 8, 12, 16, 20, 24, 32, 40, 48, 64

## Radii
- radius.sm — 10px (small chips)
- radius.md — 14px (inputs, buttons/pills use 999px)
- radius.lg — 20px
- radius.xl — 26px (cards, sheets, device frame corners)
- radius.pill — 999px (buttons, nav, avatars, status badges)

## Elevation / shadow
- elevation.1 — `0 6px 16px rgba(0,0,0,0.25)` dark / `0 6px 16px rgba(0,0,0,0.08)` light — compact row/card
- elevation.2 — `0 10px 28px rgba(0,0,0,0.35)` dark / `0 8px 22px rgba(0,0,0,0.08)` light — main card
- elevation.3 — `0 16px 40px rgba(0,0,0,0.5)` — modal / sheet / popover

## Component heights
- control.sm — 36px · control.md — 44px · control.lg — 52px
- row.standard — 60–66px (member/payment row)
- touch.min — 44px minimum interactive target

## Motion
- fast — 120ms ease-out (hover/press)
- standard — 180ms ease-in-out (state → state, e.g. pending → paid)
- expressive — 240ms ease-in-out (modal, screen change, cycle completion)

Respect "reduce motion" OS setting everywhere.
