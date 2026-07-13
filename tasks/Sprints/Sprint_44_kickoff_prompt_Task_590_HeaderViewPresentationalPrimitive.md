# Task 590 — Extract `HeaderView` presentational primitive from `Header.tsx` (+ canonical story)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — presentational-primitive split + Storybook (product code: new primitive + thin container + story + storybook i18n). **Owner-directed 2026-07-13.**
**Depends on:** Tasks 574–581 (Header sub-primitives: `HeaderActions`, `UserMenu`, `MobileNavDrawer`, `LocaleSwitcher`), 580 (thin-container audit), 586 (the desktop-hamburger composition bug this story exists to prevent recurring).

## Why

`Header.tsx` is the ONE app-shell component still consuming data/network hooks (`useUser`, `useRouter`) with **no
prop-driven presentational primitive and no story** — a direct violation of the **Presentational-Primitive Split
Gate** (owner P0, 2026-07-10, `docs/component-rules.md` → "Container / Presentational Primitive Split"). Its
sub-widgets are all extracted + storied, but the **shell composition** (logo · desktop-nav · right-cluster order ·
sticky chrome · the `md` show/hide of desktop-nav vs hamburger) has ZERO rendered proof. That is exactly the gap that
let **Task 586** ship a hamburger on desktop next to the user menu — a composition bug no story could catch because
there is no Header story. This task closes the split-gate gap and gives the header composition standing regression
coverage. **This is a REFACTOR/MOVE, not a restyle — the rendered header must be visually byte-identical before/after.**

## Pre-read (rule-index → UI / layout / component task + Storybook / visual)

- `docs/agent-contract.md` (clauses **1, 3, 5, 11, 12, 13, 16**) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (**Logout row line 27** — reachable via `Header` → `UserMenu`/`MobileNavDrawer` `onLogout`; this task must NOT change
  that wiring, only pass it through; baseline `browser.smoke.test.ts` green before+after).
- 🔴 `docs/component-rules.md` → **"Container / Presentational Primitive Split"** (the rule being satisfied) +
  `docs/mantine-responsive-design-system.md` §7 (mobile gate), §8 (Mantine story proof path — single `Default`,
  `skipCanvas`, toolbar-driven viewport/locale), §12 (canonical patterns), §18.9 (icon/overlap).
- 🔴 `docs/tailadmin-style-reference.md` — reference only for confirming the moved chrome is UNCHANGED (this is not a
  restyle; no new §-row). `docs/ui-rules.md` (§15 control-height, §17 pre-flight), `docs/qa-rules.md`,
  `docs/storybook-governance.md` (§14 `check:stories`), `docs/storybook-visual-snapshots.md`.
- Reference implementations to MIRROR: `src/components/layout/HeaderActions.tsx` (prop-driven primitive; `useTranslations`
  is allowed inside a primitive — only **data/network** hooks like `useUser`/`useRouter`/Supabase are forbidden;
  `notificationSlot` is the container-owned-widget-as-slot pattern), `src/components/layout/MobileNavDrawer.tsx` +
  `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` (controlled primitive + single-`Default` story +
  render-both-states-without-stacking-overlays discipline), the current `src/components/layout/Header.tsx`.

## Files in scope

1. **NEW** `src/components/layout/HeaderView.tsx` — the presentational primitive. Pure, prop-driven. MAY use
   `useTranslations`/`useLocale` (i18n only). MUST NOT call `useUser`, `useRouter`, `useState`/`useEffect` for the
   auth-sheet event, `signOut`, or any Supabase/data hook. Renders the `<header>` shell exactly as `Header.tsx`
   renders it today (logo · desktop `NavLinks` · right cluster: `LocaleSwitcher` + `HeaderActions` + `UserMenu` +
   hamburger `ActionIcon` + `MobileNavDrawer`). `NavLinks` folds INTO this file at module level (stable ref — keep the
   hydration-stability comment from `Header.tsx` lines 24–34).
2. **EDIT** `src/components/layout/Header.tsx` — becomes the THIN container: keeps ALL hooks (`useUser`, `useRouter`,
   `useLocale`, `useTranslations` for wiring, `useState`/`useEffect` for `mobileOpen`/`authOpen`/`authView` + the
   `AUTH_SHEET_EVENT` listener), keeps `openAuthSheet`/`switchLocale`/`handleLogout`, and renders `<HeaderView …/>`
   passing hook-derived values + handlers as props, with `NotificationBell` (dynamic `ssr:false`) and `AuthSheet`
   passed as **slots**. Public component (`export function Header()`) — NO signature/behavior change; it is still the
   same drop-in used by the app layout.
3. **NEW** `src/stories/mantine/primitives/HeaderView.stories.tsx` — title `Mantine/Primitives/HeaderView`, single
   `Default` export, `skipCanvas:true`, `layout:'fullscreen'` (mirror `MobileNavDrawer.stories.tsx`). Renders TWO
   `HeaderView` instances stacked vertically — a **guest** fixture and an **authenticated** fixture — both with
   `mobileOpen={false}` and closed/no-op overlays, `notificationSlot` a static placeholder node, `authSheetSlot`
   null. (Header bars are NOT overlays, so stacking two is safe — unlike the MobileNavDrawer overlay-collision case;
   do NOT open the mobile drawer or auth sheet in the story.)
4. **EDIT** `messages/{sq,en,uk,it}.json` — add any storybook caption key(s) needed (e.g.
   `storybook.mantine.header_view_caption_guest` / `_authed`) in ALL FOUR locales, same key set. Nav/action labels
   resolve from the existing `nav.*`/`common.*` namespaces via `useTranslations` (already available in the Mantine
   story `NextIntlClientProvider` — `HeaderActions` relies on it), so NO new product `nav.*` key.

**MUST NOT touch:** the sub-primitives (`HeaderActions`/`UserMenu`/`MobileNavDrawer`/`LocaleSwitcher`) — they are
consumed as-is; `AuthSheet`, `NotificationBell`, `signOut`/`lib/auth`, `setAdminLocale`, routing; any product `nav.*`
key; the header's visual chrome (this is a move — no restyle). If a sub-primitive's prop API doesn't fit cleanly,
STOP AND ASK — do not modify the sub-primitive.

## Current behavior to PRESERVE (byte-identical render) / required after-behavior

- **Preserve exactly:** the `<header className="site-header sticky top-0 z-30 …">` chrome; logo markup; desktop
  `<nav className="hidden md:flex …">` with Home/Listings; the right-cluster order (LocaleSwitcher → HeaderActions →
  UserMenu(authed, `hidden md:flex`) → hamburger(`hiddenFrom="md"`) → MobileNavDrawer); AuthSheet mounted at the end.
  Every handler fires exactly as today (`openAuthSheet`, `switchLocale` via LocaleSwitcher `onSwitch`, `router.push`
  navigations, `handleLogout`, `setMobileOpen`). The global `AUTH_SHEET_EVENT` listener stays in the container.
- **After:** identical rendered output at every breakpoint × locale; the ONLY change is the JSX now lives in
  `HeaderView` driven by props, with `Header.tsx` wiring hooks → props. `router.refresh`/nav/locale-switch/logout/auth
  flows unchanged end-to-end.

## Presentational-primitive split gate (the rule being satisfied)

- `HeaderView` takes ALL data via props: `isAuthenticated`, `user` (`{name,avatar_url}|null`), `locale`, and the
  handlers `onOpenAuth(view)`, `onSwitchLocale(newLocale)`, `onNavigate(path)`, `onOpenAdmin()`, `onLogout()`,
  `mobileOpen`, `onOpenMobile()`, `onCloseMobile()`; container-owned widgets (`NotificationBell`, `AuthSheet`) come in
  as `notificationSlot?: ReactNode` / `authSheetSlot?: ReactNode`.
- The story/test targets `HeaderView` with **plain fixtures** — NO `useUser`/`useRouter` mock, NO `.storybook` module
  alias, NO live Supabase. If the implementation reaches for a hook mock, the split was done wrong — the container
  must own the hooks. (This is the exact failure mode `HeroSearch`/Task 568 caused and the gate forbids.)

## Mobile <640 full-width gate (clause 11)

The header bar's interactive controls are the already-documented **icon-only / compact exemptions**: `LocaleSwitcher`
compact `EN ⌄` trigger, Favorites icon (`HeaderActions`), hamburger `ActionIcon` (all ≥44px touch, `hiddenFrom`/
`visibleFrom` as today). The guest Login/Register live inside `HeaderActions` (`visibleFrom="md"`) — unchanged. No new
full-width text surface is introduced by this move; preserve every existing exemption verbatim and list them in the
session log's exemption table. `MobileNavDrawer`'s own full-width bottom-sheet behavior is unchanged (owned by that
primitive). No horizontal scroll at 320.

## TailAdmin conformance (clause 16)

This is a **refactor, not a restyle** — no token/chrome change. Conformance proof = the rendered header is
**byte-identical before/after** at the canonical breakpoints × locales (capture a before/after pair at `uk@320` +
`en@1280`). Zero new/changed color/px/radius/shadow. No new `§-row`.

## Positive / Negative flow

- **Positive:** app renders `<Header/>` → container wires hooks → `HeaderView` renders the identical bar; desktop
  (`≥md`) shows nav + no hamburger; mobile (`<md`) shows hamburger + no desktop nav (the Task 586 guard); guest shows
  Login/Register (≥md) + Favorites→login; authed shows UserMenu + NotificationBell + Favorites link; LocaleSwitcher
  switches locale; hamburger opens `MobileNavDrawer`; logout via UserMenu/drawer fires `onLogout`.
- **Negative:** `HeaderView` contains NO `useUser`/`useRouter`/`signOut`/Supabase (grep-confirm 0 in `HeaderView.tsx`);
  the story uses NO hook mock/module alias; guest vs authed diverge only via the `isAuthenticated`/`user` props (both
  fixtures render in the single story); overlays stay CLOSED in the story (no drawer/auth-sheet stacking);
  `Header.tsx` public API unchanged; long uk/it nav/label wrap, no clip, no h-scroll at 320; desktop hamburger does
  NOT render at `≥md` (explicit assertion — the 586 regression).

## Regression coverage (clause 15) — critical flow: Logout

Logout (`docs/critical-flow-registry.md` line 27) is reachable through the header. This task only MOVES the JSX and
PASSES `onLogout` through — no logic change. Required: baseline `npx vitest run
src/lib/auth/__tests__/browser.smoke.test.ts` green BEFORE + AFTER, and confirm in the diff that `handleLogout` →
`signOut` wiring is unchanged in the container and `HeaderView` merely calls the passed `onLogout`. No new test
required (presentational move); record the green baseline + the pass-through proof.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- `npm run screenshots:assert -- --mantine-only` before/after — the NEW `Mantine/Primitives/HeaderView/Default` cells
  must PASS; the overall count must show zero NEW fail/ambiguous vs the current baseline (634/660/0/26 after Task 589).
- 🔴 §18.9 / composition human-visual at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280**: guest AND authed
  header bars — (a) `<md`: hamburger present, desktop nav absent; (b) `≥md` (en@1280): desktop nav present, hamburger
  ABSENT (the 586 guard), UserMenu present when authed; (c) logo + right-cluster order intact; (d) no clip / no
  h-scroll / labels wrap; (e) before/after byte-identical bar (refactor proof).
- Rendered matrix (breakpoints × sq/en/uk/it) with real per-cell evidence; uk@320/375/390 mandatory.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. NEW `HeaderView.tsx` presentational primitive: prop-driven, renders the exact current header shell; `NavLinks`
   folded in at module level (hydration comment retained); NO data/network hook (grep 0 `useUser`/`useRouter`/
   `signOut`/`createClient`); `NotificationBell`+`AuthSheet` are slots. *(diff)*
2. `Header.tsx` reduced to a thin container: keeps hooks + `openAuthSheet`/`switchLocale`/`handleLogout` + the
   `AUTH_SHEET_EVENT` effect, renders `<HeaderView …/>`; public `Header()` API + behavior unchanged. *(diff)*
3. NEW `HeaderView.stories.tsx`: `Mantine/Primitives/HeaderView`, single `Default`, guest + authed fixtures stacked,
   overlays closed, NO hook mock / module alias / live Supabase. *(diff + `check:stories`)*
4. Split-gate satisfied: story renders with plain fixtures, no mock. *(diff)*
5. Rendered header byte-identical before/after (refactor); desktop hamburger absent `≥md`, present `<md`. *(rendered)*
6. Clause 11 exemptions (LocaleSwitcher/Favorites/hamburger icon-only) preserved + listed; no h-scroll at 320; labels
   wrap sq/en/uk/it. *(clause 11 + rendered)*
7. Logout smoke green before+after; `handleLogout`→`signOut` wiring unchanged; `HeaderView` only calls passed
   `onLogout`. *(clause 15, transcript + diff)*
8. i18n: any new key only under `storybook.mantine.*`, all four locales, same key set; no new product `nav.*` key;
   `check:i18n` green. *(diff + transcript)*
9. Gates: `tsc=0`, `eslint`, `check:stories`, `check:i18n`, `check:file-integrity`, `check:mojibake`,
   `screenshots:assert -- --mantine-only` all green; §18.9 + before/after set + rendered matrix + Files-Changed table +
   AC-by-AC self-audit in the session log. **Do NOT run `git add`/`git commit` — HELD for orchestrator review.** *(transcript)*

## STOP-AND-ASK (resolve before inventing)

- If any sub-primitive's prop API does not compose cleanly into `HeaderView` without editing that sub-primitive —
  STOP and ASK (do not modify `HeaderActions`/`UserMenu`/`MobileNavDrawer`/`LocaleSwitcher`).
- If rendering the authed fixture in the story requires opening an overlay (drawer/auth-sheet) to prove anything —
  STOP: verify closed-state composition only; the open-overlay states are already covered by the sub-primitive
  stories (MobileNavDrawer/UserMenu). Do not stack open overlays (Task 578/585 collision lesson).

## Out of scope

Any restyle of the header chrome (this is a move); any change to the sub-primitives, `AuthSheet`, `NotificationBell`,
`signOut`, routing, or `setAdminLocale`; new product `nav.*`/`common.*` keys; the legacy-button migration of unrelated
files; the pre-existing `default`/`outline` follow-ups (closed by Task 589).
