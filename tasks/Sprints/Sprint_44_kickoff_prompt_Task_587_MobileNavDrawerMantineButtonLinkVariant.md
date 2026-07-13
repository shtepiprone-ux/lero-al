# Task 587 — MobileNavDrawer: migrate legacy Button → Mantine + add a reusable TailAdmin link/transparent Button variant

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — legacy-primitive migration + shared theme variant (product code). **Owner-directed 2026-07-13.**
**Depends on:** Task 579 (`MobileNavDrawer` primitive landed), Task 583 (`HeaderActions` Mantine-Button precedent).

## Why

`src/components/layout/MobileNavDrawer.tsx` was migrated to a "Mantine primitive" in Task 579 but STILL imports the
**legacy** `@/components/ui/button` (line 6) for all four of its buttons — the last legacy-Button consumer in the
Header stack. The owner caught this on review (2026-07-13): a reworked Mantine primitive must not ship a legacy
button. Two owner requirements:

1. **Replace the legacy Button with Mantine core `Button`** (same path `HeaderActions.tsx` already uses:
   `import { Button } from '@mantine/core'`).
2. The borderless/fill-less buttons (Logout, Register-as-agent) must use a **reusable, first-class Mantine Button
   variant** styled under TailAdmin — the owner chose a **Link button** (icon-left, transparent, NO background fill
   even on hover). This is `variant="transparent"` themed in `theme.ts` (NOT a per-call `className` hack).
3. Fix the **Logout button's left indent**: it currently sits indented to the RIGHT of every other drawer item
   (the legacy `size="xl"` button's internal left padding vs the flush-left nav links) — the owner's original report.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses **1, 3, 5, 11, 12, 13, 15, 16**) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (**Logout row line 27** — `signOut` via `lib/auth/browser.ts:56`, covered by `browser.smoke.test.ts`, Task 441).
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §12 (canonical patterns), §18 (theming pitfalls:
  `theme.styles`/`variantColorResolver`, inline-style-freezes-cascade), **§18.9 (icon/placeholder/overlap iron rule —
  the LogOut `leftSection` ↔ label gap lives here)**.
- 🔴 `docs/tailadmin-style-reference.md` — the **NEW `§6a-link` row + note** (orchestrator live-captured 2026-07-13:
  the link/tertiary button reference = TailAdmin sidebar `menu-item` resting chrome; owner override = pure-link, no
  hover fill). Trigger secondary = §6a "Button (secondary/outline)"; primary = §6a "Button (primary)".
- `docs/ui-rules.md` (§15 control-height, §17 pre-flight), `docs/component-rules.md` (NO raw `<button>`, single-source
  primitives), `docs/qa-rules.md`.
- Reference implementations: `src/components/layout/HeaderActions.tsx` (canonical `@mantine/core` Button usage),
  `src/design-system/mantine/theme.ts` lines 193–226 (the existing Button `styles` callback that themes
  `outline`/`default`; you ADD the `transparent` branch here).

## Files in scope

1. `src/design-system/mantine/theme.ts` — **add the `transparent` variant chrome** to the existing `Button.styles`
   callback (the same callback that already branches on `props.variant === 'outline' || 'default'`). Add a
   `props.variant === 'transparent'` branch implementing the `§6a-link` reference:
   - `color: var(--mantine-color-gray-7)` as the DEFAULT resting text (so `<Button variant="transparent">` with no
     `color` prop renders gray-700, per §6a-link — Mantine's own `transparent` default is brand text; override it).
     When a consumer passes `color="red"` (Logout) Mantine's `variantColorResolver` already yields red text — do NOT
     hard-freeze `color` in a way that blocks the `color` prop (use the same CSS-custom-property technique the
     `outline`/`default` branch uses — `--button-color` — NOT a literal `color`, so `color="red"` still wins). If a
     literal is unavoidable, gate it to only when `props.color` is undefined.
   - `background: transparent`, no border, **no hover background fill** (owner override — pure link). Confirm Mantine's
     stock `transparent` variant already has no hover bg; if it adds one, neutralize it via `--button-hover` /
     `input-chrome.css` (§18 — a state selector cannot live in inline `theme.styles`).
   - radius `lg` (8px, already the Button default), `minHeight: 2.75rem` (already set globally), `fontWeight: 500`
     (already set), `text-theme-sm` (14px, already the `size="sm"` default).
   - **Zero invented values** — every value traces to the `§6a-link` row. Add a code comment citing `§6a-link`.
   - **Do NOT touch** the existing `outline`/`default`/filled behavior, or any other component block.
2. `src/components/layout/MobileNavDrawer.tsx` — swap `import { Button } from '@/components/ui/button'` →
   `import { Button } from '@mantine/core'` and re-map the four buttons (see behavior table). Remove the legacy import
   entirely (grep-confirm 0 `@/components/ui/button` in the file). Fix the Logout left-indent.

**MUST NOT touch:** `Header.tsx` and its `onLogout`/`onNavigate`/`onOpenAuth` wiring (the drawer's controlled API —
`MobileNavDrawerProps` — stays byte-identical), `MantineDrawer`, `signOut`/`lib/auth/browser.ts`, locale JSON
(reuse existing `nav.*` keys — no new key), routing, any other Button consumer anywhere else in `src/` (the
`theme.ts` `transparent` branch is additive and default-off for the current `transparent` behavior — verify no other
`variant="transparent"` consumer exists via grep; if any does, its render must be confirmed unchanged/acceptable —
report it, do not silently restyle a surprise consumer).

## Current behavior to PRESERVE / required after-behavior (button-by-button)

| Button | Current (legacy) | After (Mantine core) |
|---|---|---|
| **Login** (guest) | `variant="outline" size="xl" w-full` | `variant="default"` (§6a secondary), full-width, ≥44px — visual intent preserved |
| **Register** (guest) | default `size="xl" w-full` (primary) | `variant="filled"` (§6a primary brand), full-width, ≥44px |
| **Register-as-agent** (guest) | `variant="ghost" size="xl" w-full` | `variant="transparent"` (§6a-link), full-width; keep NO icon (none today) — see STOP-AND-ASK |
| **Logout** (authed) | `variant="ghost" size="xl" w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/5` + `<LogOut/>` icon | `variant="transparent" color="red"` (§6a-link destructive), full-width, `justify-start`, **left padding = 0 so the LogOut icon aligns flush-left with the nav links above it**, `<LogOut/>` as `leftSection`, ≥44px |

- Handlers unchanged: Login/Register/Register-agent → `openAuth(view)` (calls `onClose()` then `onOpenAuth(view)`);
  Logout → `logout()` (calls `onLogout()` then `onClose()`). The `onClick` wiring must be identical.
- The LogOut icon → label gap uses Mantine `leftSection` (do NOT hand-place the `<LogOut/>` as a raw child with a
  manual gap) — §18.9: visible gap, no overlap.
- All four remain **full-width at every breakpoint** (they already were `w-full`; Mantine `Button` is not full-width
  by default → pass `fullWidth` or keep a `w-full`/`className` equivalent). Clause 11: these are full-width text
  buttons, NOT icon-only — full-width is REQUIRED, not exempt.

## The left-indent fix (owner's original report) — exact

The nav `Link`s (`navLinkClass`, lines 55–83) have **zero horizontal padding** → their text starts at the drawer
content's left edge. The legacy Logout `size="xl"` button carried internal `px-5` (20px) padding; with `justify-start`
that pushed the icon+label ~20px to the right of the nav text — the visible misalignment. Required after: the Logout
link button's **content left edge aligns with the nav links' left edge** (padding-left 0 on that button;
`justify-start` retained). Verify by eye at `uk@320` that the LogOut icon's left edge lines up vertically with the
"Home"/"Профіль"/… text above it. (The centered guest buttons — Login/Register — are not affected; only the
`justify-start` Logout showed the indent.)

## STOP-AND-ASK (resolve before inventing)

- **Register-as-agent alignment/emphasis:** it becomes a `transparent` link (owner named it alongside Logout). It sits
  in the guest button stack under a primary (Register) + secondary (Login). Implement it **left-aligned `justify-start`
  with `leftSection` empty (no icon today), padding-left 0** — consistent with the Logout link. **IF** the owner wants
  it centered (to match the two CTAs above) or wants an icon, that is a one-line follow-up — flag it in the session log,
  do NOT guess a redesign. Everything else here is decided; do not re-ask the variant choice (owner chose Link).

## Mobile <640 full-width gate (clause 11)

All four buttons are text buttons → **full-width at every breakpoint** (`fullWidth`), ≥44px (`minHeight:2.75rem`
already global), long `sq/en/uk/it` labels wrap (`whiteSpace:'normal'` already themed), no clip, no h-scroll at 320.
The drawer itself is `MantineDrawer size="xs"` (unchanged). No popup/overlay pattern changes.

## TailAdmin conformance (clause 16 / 16a)

- The `transparent` variant chrome must match the `§6a-link` reference **rendered side-by-side** with the captured
  values (transparent bg, no border, gray-700 resting text / red for Logout, 14px/500, radius 8, no hover fill).
- Trigger of migration for Login/Register: `§6a` secondary/primary — no invented chrome; they use the already-themed
  `default`/`filled` variants verbatim.
- `tsc=0`/gate-green is NOT style proof — rendered proof required (below).

## Positive / Negative flow

- **Positive:** (authed) open drawer → Logout link renders flush-left with nav, red text, LogOut icon-left, ≥44px →
  tap → `onLogout()` then `onClose()` fire (session clears via existing `signOut`; unchanged). (Guest) Login →
  `onOpenAuth('login')`, Register → `onOpenAuth('register')`, Register-agent (link) → `onOpenAuth('register-agent')`,
  each after `onClose()`.
- **Negative:** no legacy `@/components/ui/button` import remains (grep=0); no raw `<button>`; the four handlers still
  fire exactly once each; `variant="transparent"` shows NO background on hover/press (pure link); Logout keeps the red
  destructive tint; guest buttons still only render when `!user`, authed Logout only when `user`; long uk/it labels
  wrap without h-scroll at 320; any other `variant="transparent"` consumer (if found) renders unchanged.

## Regression coverage (clause 15) — critical flow: Logout

Logout is registered (`docs/critical-flow-registry.md` line 27, `browser.smoke.test.ts`). This task changes ONLY the
button's presentation, NOT `signOut`/`onLogout` wiring. Required: **baseline the existing logout smoke green BEFORE and
AFTER** (`npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`) and confirm in the diff that the Logout
button's `onClick` still calls `logout()` (→ `onLogout()`). No new test required (presentational-only), but the
session log MUST record the green baseline + the unchanged-handler proof. If you find the handler wiring must change,
STOP — that is out of scope.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- The existing `MobileNavDrawer.stories.tsx` `Default` story renders the **logged-in** fixture `opened` → it already
  shows the **Logout link button**. Re-run `screenshots:assert -- --mantine-only` (paste before/after count; story
  count unchanged, cells unchanged — this is a restyle, expect the `MobileNavDrawer` cells to still PASS geometry).
- 🔴 **§18.9 human-visual proof (geometry gate is BLIND to this):** paste human-inspected screenshots at
  **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280** proving: (a) Logout link = transparent (no fill/border),
  red text, LogOut icon-left with a visible gap to the label (no overlap), (b) the LogOut icon's left edge **aligns
  flush-left with the nav links above** (the indent is fixed), (c) full-width ≥44px, (d) no hover-fill on the link
  (capture a hover frame at one desktop width), (e) long uk/it labels wrap, no h-scroll at 320. A green PASS count is
  NOT the verdict for this task (Task 553/554 lesson).
- Guest branch (Login/Register/Register-agent) verified by code inspection of the `{user ? … : …}` conditional (the
  story renders only the logged-in fixture by design — Task 585 precedent; do NOT fork a second open overlay).

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. `theme.ts` Button `styles` callback gains a `props.variant === 'transparent'` branch implementing `§6a-link`
   (transparent bg, no border, no hover fill, gray-700 default text via `--button-color` so `color="red"` still wins,
   14px/500/radius-8/≥44px) — **additive**, `outline`/`default`/`filled` untouched, every value cited to `§6a-link`,
   zero invented values. *(diff)*
2. `MobileNavDrawer.tsx` imports `Button` from `@mantine/core` ONLY — **zero** `@/components/ui/button`, **zero** raw
   `<button>`; the four buttons map per the table (Login=`default`, Register=`filled`, Register-agent=`transparent`,
   Logout=`transparent` `color="red"` with `<LogOut/>` `leftSection`); `MobileNavDrawerProps` API byte-identical;
   `Header.tsx` untouched. *(diff)*
3. Logout left-indent fixed — content flush-left with nav links (padding-left 0 + `justify-start`); proven by eye at
   `uk@320`. *(rendered)*
4. All four full-width every breakpoint, ≥44px, labels wrap sq/en/uk/it, no h-scroll at 320; link variant shows no
   background on hover/press. *(clause 11 + rendered)*
5. `§6a-link` rendered side-by-side match (transparent/gray-700/red/no-hover-fill/radius-8). *(clause 16, rendered)*
6. Logout critical-flow smoke green baseline before+after; handler wiring unchanged. *(clause 15, transcript)*
7. i18n: reuse existing `nav.login`/`nav.register`/`nav.register_agent`/`nav.logout`/`nav.favorites` etc. — NO new key;
   `check:i18n` green. *(transcript)*
8. Gates: `tsc=0`, `eslint`, `check:stories`, `check:i18n`, `check:file-integrity`, `check:mojibake`,
   `screenshots:assert -- --mantine-only` all green; §18.9 human-visual set pasted; Files-Changed table +
   AC-by-AC self-audit + rendered matrix in the session log. **Do NOT run `git add`/`git commit` — HELD for
   orchestrator review.**

## Out of scope

Any change to `signOut`/auth logic or `MobileNavDrawerProps`; restyling any OTHER Button consumer; the guest-group
LAYOUT beyond the variant swap (Register-agent centered-vs-left is a flagged STOP-AND-ASK, not a redesign here);
adding icons to buttons that don't have one today; `Header.tsx`. The `transparent` theme branch is the only shared
change — it must be additive and must not alter any existing `transparent` consumer's intent (report any found).
