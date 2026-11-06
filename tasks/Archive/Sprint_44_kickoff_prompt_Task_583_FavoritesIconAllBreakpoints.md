# Task 583 — Header: show the Favorites (heart) icon at ALL breakpoints (remove `visibleFrom="sm"`)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — responsive-visibility fix (single primitive). **NO redesign, NO new control.**
**Owner decision (2026-07-11):** the Favorites heart currently disappears below 640px; the owner wants it visible on
mobile too. **Depends on:** Task 575 landed (`HeaderActions` primitive).
**Pre-read:** `agent-contract.md`, `backlog.md`, `critical-flow-registry.md`, `docs/mantine-responsive-design-system.md`
(§7 mobile gate, §18 pitfalls), `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (clause 16),
`docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Why

`src/components/layout/HeaderActions.tsx` (Task 575) renders the Favorites `ActionIcon` with **`visibleFrom="sm"`** in
BOTH branches (authenticated → `Link` to `favoritesHref`; guest → `onClick={() => onOpenAuth('login')}`). Mantine's
`visibleFrom="sm"` hides the element **below 640px**, so on mobile the heart vanishes: a logged-in user can only reach
Favorites through the hamburger drawer, and a **guest has no Favorites entry on mobile at all** (on desktop the guest
heart opens the login sheet). The owner wants the heart present at every breakpoint.

## Files in scope

- `src/components/layout/HeaderActions.tsx` — the ONLY file. Remove `visibleFrom="sm"` from **both** Favorites
  `ActionIcon` branches (authenticated and guest) so the heart renders at all widths. Keep everything else identical:
  `variant="subtle"`, `mih/miw="2.75rem"` (≥44px touch target — clause 11 icon-only exemption, already documented in
  the comment), `aria-label={t('favorites')}`, the `component={Link} href={favoritesHref}` (authed) vs
  `onClick={() => onOpenAuth('login')}` (guest) split, and the `notificationSlot` + login/register `Group visibleFrom="md"`
  below it (UNCHANGED — do not touch the login/register buttons' `visibleFrom="md"`).

**MUST NOT touch:** `Header.tsx` (including the mobile hamburger drawer's existing authed `Favorites` link, lines
~217–223 — it stays; the top-bar heart and the drawer link coexisting is acceptable and out of scope to change),
`NotificationBell`, locale JSON, routing, any other file. The heart is icon-only, so the clause-11 **full-width**
mobile rule does NOT apply (documented icon/compact exemption — it stays compact, ≥44px).

## Current behavior to PRESERVE / required after-behavior

- **≥640:** identical to today — heart visible; authed → `/favorites`, guest → opens login sheet.
- **<640 (NEW):** the SAME heart now also renders in the top bar (compact, ≥44px, next to the `LocaleSwitcher` trigger
  and the hamburger). Authed → navigates to `favoritesHref`; guest → opens the login sheet (same handlers as ≥640).
- Layout at 320px must stay clean: Logo — [`EN ⌄` locale trigger · ♥ · ☰ hamburger] with **no horizontal scroll and no
  overlap/clipping** in any of sq/en/uk/it. Login/register buttons remain `visibleFrom="md"` (unchanged).

## Positive / Negative flow

- **Positive:** at 320 and 1280, as a guest → tap the heart → login sheet opens; as a logged-in user → tap the heart →
  route goes to `/{locale}/favorites`. Identical behavior at both widths.
- **Negative:** no duplicate/second heart appears at ≥640; the login/register buttons still only show ≥768 (`md`); no
  horizontal scroll at 320 in any locale; the heart keeps a ≥44px touch target and does not overlap the locale trigger
  or hamburger; `aria-label` present in all 4 locales (existing `nav.favorites` key — no new key added).

## Gates

- **Rendered matrix (clause 12):** 320·375·390·768·1280·1440·2560 × sq/en/uk/it, **uk@320/375/390 mandatory** —
  prove the heart is visible and tappable at every breakpoint including <640, ≥44px, no clip, no h-scroll, no overlap
  with the sibling compact controls. Provide the rendered evidence (live dev-server or the machine harness); a full
  before/after at 320 for the mandatory uk cell.
- **Internal-spacing / chrome visual check (owner P0):** personally open the 320 screenshots and confirm the three
  compact controls (locale trigger · heart · hamburger) have visible gaps and none clips — `screenshots:assert` is
  geometry-blind to overlap.
- **Mobile <640 (clause 11):** heart is the documented icon-only exemption (stays compact ≥44px, NOT full-width).
- **TailAdmin (clause 16):** unchanged — `variant="subtle"` `ActionIcon`, no style drift, no invented values.
- **Locale parity:** N/A — no string keys added/changed (reuses `nav.favorites`).
- **File-integrity (clause 14)** clean; `tsc=0`/lint/`check:stories`/`check:i18n` green; `screenshots:assert --
  --mantine-only` stays green (this file has no story of its own; if `HeaderActions` gains render coverage note it, else
  the live-app render is the proof — same pattern as Task 577).
- **No `git add`/`git commit` by Sonnet.** Session log: Files-Changed table + AC self-audit + rendered matrix.

## Acceptance criteria

1. `HeaderActions.tsx` — `visibleFrom="sm"` removed from BOTH Favorites `ActionIcon` branches; everything else
   (variant, 44px min, aria-label, authed-Link vs guest-onClick split, notificationSlot, login/register `visibleFrom="md"`)
   unchanged. *(diff)*
2. The heart is visible and functional at every breakpoint including <640, for both guest (→ login sheet) and
   logged-in (→ `/favorites`); exactly ONE heart at each breakpoint. *(render matrix + human-eye cell)*
3. 320px layout is clean in all 4 locales — no h-scroll, no overlap/clip, ≥44px touch target, visible gaps between the
   compact controls. *(rendered evidence + personally-reviewed 320 screenshots)*
4. `tsc=0`/lint/`check:stories`/`check:i18n`/`screenshots:assert` green; file-integrity clean; Files-Changed table +
   AC self-audit in the session log; NO `git add`/`git commit` emitted by Sonnet. *(transcripts)*
