# Task 574 — Header base-UI overlays → Mantine (fix the SSR-id hydration mismatch)

**Sprint:** 44 (Header / app-shell → Mantine — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / component migration + hydration bug fix (NOT a redesign).
**Depends on:** the already-landed canonical overlays — `MantineDropdownMenu` (Task 515), `MantineDrawer`
(Task 523), `MantineCombobox` (Task 537), all on `HEAD`. No task blocks this one.

## Why this exists

`src/components/layout/Header.tsx` and `src/components/shared/LocaleSwitcher.tsx` still render **base-UI**
overlay primitives — `@/components/ui/dropdown-menu` (LocaleSwitcher's language menu + the desktop user
menu) and `@/components/ui/sheet` (the mobile hamburger drawer) — plus the legacy `@/components/shared/Combobox`
(the <640 locale switcher). base-UI's `useId()` inside those triggers generates a **server-vs-client id
mismatch**, which is the console hydration error the owner captured 2026-07-10:

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties…
  <DropdownMenuTrigger …  + id="base-ui-_R_ct35rlmlb_"  − id="base-ui-_R_1jkd5rlmlb_" …>
  <SheetTrigger …         + id="base-ui-_R_fd35rlmlb_"   − id="base-ui-_R_1tkd5rlmlb_" …>
  at DropdownMenuTrigger (src/components/ui/dropdown-menu.tsx:19)
  at LocaleSwitcher (src/components/shared/LocaleSwitcher.tsx:56)
  at Header (src/components/layout/Header.tsx:143)
```

Migrating these overlays onto the canonical Mantine primitives removes the base-UI `useId()` source entirely
and eliminates the warning, while retiring the last overlay legacy holdouts in the app shell. **This is a
presentational + wiring swap: 100% of the Header's behavior is preserved, with ONE deliberate visual change —
the locale flags become 2-letter abbreviations (see §F)** (Task 556/566/567 precedent).

## Files in scope (the ONLY product files this task may change)

- `src/components/shared/LocaleSwitcher.tsx` — `ui/dropdown-menu` → `MantineDropdownMenu`; trigger `buttonVariants`
  → Mantine `Button`.
- `src/components/layout/Header.tsx` — desktop user menu (`ui/dropdown-menu`) → `MantineDropdownMenu`; mobile
  hamburger (`ui/sheet`) → `MantineDrawer`; mobile locale switcher (legacy `Combobox`) → `MantineCombobox`;
  the trigger `Button`s / `Avatar` inside these overlays → Mantine `Button` / Mantine `Avatar`.
- `src/stories/mantine/primitives/DropdownMenu.stories.tsx` — **add the compact abbreviation/icon-trigger
  reference option (§0), done FIRST, before any Header edit** (the CountButton-option precedent).
- Plus its Storybook story + any i18n JSON **only if** a new key is genuinely required (it should NOT be — all
  labels already exist).

**MUST NOT touch (out of scope — a later Task 575):** the standalone Header action buttons that are NOT base-UI
overlays and do NOT cause the hydration error — the Favorites `<Link className={buttonVariants(…)}>` / ghost
`Button`, the desktop login/register `Button`s, and the `NavLinks` `<Link>`s. Leave their `ui/button` usage as-is
this task; a follow-up finishes them. Also MUST NOT touch: `AuthSheet`, `NotificationBell`, `useUser`,
`setAdminLocale`, routing/`switchLocale`/`handleLogout` logic, any other file. If removing `ui/button` from the
overlay triggers leaves `Header.tsx` still importing `Button`/`buttonVariants` for those out-of-scope buttons,
that is EXPECTED — do not delete the import while other in-file consumers use it.

## Pre-read (rule-index → UI/component task + Storybook + regression bundle)

- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan for the
  locale-switch / auth-entry / logout / mobile-nav flows — this task touches them; clause 15 is in scope).
- **Required:** `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (every value cites a §-row);
  `docs/mantine-responsive-design-system.md` (§7 mobile gate, §12 canonical patterns, §18 theming pitfalls);
  `docs/ui-rules.md`; `docs/component-rules.md` (Container/Presentational split); `docs/qa-rules.md`;
  `docs/storybook-governance.md` (§14 gates).
- **Read the canonical primitives you are consuming (do NOT restyle them):**
  `src/design-system/mantine/patterns/MantineDropdownMenu.tsx`, `MantineDrawer.tsx`, `MantineCombobox.tsx`,
  and their `src/stories/mantine/primitives/{DropdownMenu,Drawer,Combobox}.stories.tsx`.
- Read `Header.tsx` (363 lines) and `LocaleSwitcher.tsx` (88 lines) in FULL first.

## Current behavior to PRESERVE (must be behaviorally identical after the swap)

**LocaleSwitcher (desktop, `hidden sm:flex` — visible ≥640 only):**
1. Trigger: ghost button, `Globe` icon + current flag + (when `isPending`) a spinning `Loader2`, else a
   `ChevronDown`. `disabled` while `isPending`. `showLabel` optionally shows the language name.
2. Menu: the 4 `LOCALES` (flag + language label); the **current** locale row is bold (`font-semibold`); clicking
   a row calls `onSwitch(code)`.
3. Props preserved: `onSwitch`, `isPending`, `showLabel`, `align`, `side`, `className`, `defaultOpen`
   (Storybook/QA-only — see STOP-AND-ASK #1).

**Desktop user menu (`hidden md:flex` — visible ≥768 only), when `user` is present:**
4. Trigger: ghost button = `Avatar` (avatar_url or initials fallback) + truncated `user.name` + `ChevronDown`.
5. Items, in order: **Profile** → `/${locale}/cabinet`; **My listings** → `/${locale}/cabinet?tab=listings`;
   *(separator)* **Add listing** → `/${locale}/listings/create`; *(separator, ONLY if `user.role` is `admin`
   or `moderator`)* **Admin dashboard** → `/admin` **opening in a NEW TAB** (`target="_blank"
   rel="noopener noreferrer"`), styled `text-primary font-medium`; *(separator)* **Logout** → `handleLogout()`,
   **destructive/red**.
6. When `user` is absent: the two desktop **Login** / **Register** buttons (OUT OF SCOPE — leave as `ui/button`).

**Mobile hamburger (`md:hidden` — visible <768):**
7. Trigger: ghost icon button (`Menu` icon), `aria-label={tc('aria_open_menu')}`, `rounded-xl`.
8. Drawer content (right side): optional user header (Avatar + name); nav links (Home, Listings, and — when
   logged in — Profile, My listings, Favorites, Add listing), **each closes the drawer on click**; when logged
   out: Login / Register / Register-as-agent buttons (each closes drawer + opens the AuthSheet with the right
   view); when logged in: a destructive Logout button (closes drawer + logs out).
9. `mobileOpen` state controls open/close; every nav/auth/logout action sets `mobileOpen=false`.

**Mobile locale switcher (`sm:hidden` — visible <640):**
10. Legacy `Combobox variant="button" size="default"`, `w-24`, `portal`, options = 4 locales
    (`${flag} ${CODE}` + language description), `value=locale`, `onChange=switchLocale`.

**Shared/global (DO NOT change):** `switchLocale` (syncs the admin-locale cookie via `setAdminLocale(newLocale)`
BEFORE `router.push`, preserving the current path); `handleLogout` (`signOut` → `router.push('/${locale}')`);
the global `AUTH_SHEET_EVENT` window listener; `NotificationBell` (authenticated only); the `NavLinks`
module-level component (kept at module scope — see its comment: defining it inline shifts the fiber id counter
and itself causes hydration mismatches).

## Required after-behavior (per primitive — no invention)

### 0. FIRST — add the reference trigger option to the `Mantine/Primitives/DropdownMenu` story (owner 2026-07-11)
🔴 **Do this BEFORE touching the Header** (mirror the CountButton precedent: establish the pattern in the
primitive story first, render it, get it approved, THEN consume it). This block is ALSO the **anti-invention
gate**: it renders the exact trigger the Header will use so the owner + orchestrator sign off on the styling
before it propagates.

**Build it by COPYING the existing examples already in `DropdownMenu.stories.tsx` — invent NOTHING.** That story
already defines the canonical trigger construction (examples 1–3): a Mantine `<Button variant="default">` (and
`<ActionIcon variant="default">` for icon-only), `storyT` labels under the `storybook.mantine.*` namespace, each
wrapped in a `<Stack gap="xs">` with a `<Text size="xs" c="gray.5" fw={500}>` caption. Add ONE more additive
`<Stack gap="xs">` block (existing examples untouched) that renders EXACTLY:

- `trigger={<Button variant="default" leftSection={<Globe size={16} />} rightSection={<ChevronDown size={16} />}>SQ</Button>}`
  — the abbreviation is the Button's plain **children**; `Globe`/`ChevronDown` go in Mantine's OWN
  `leftSection`/`rightSection` slots. **NO `className`, NO `style`, NO `size`/`color`/`px`/`gap`/font override,
  NO custom text styling.** Mantine's `variant="default"` chrome (already TailAdmin-conformant, same as examples
  1–3) IS the entire styling. If you think ANY custom style is needed, that is the trigger to STOP and ASK
  (STOP-AND-ASK #5) — never to add a value.
- `items` = the 4 locales as `{ label: <abbreviation + language name>, onClick: () => {} }` via `storyT` keys
  (add new `storybook.mantine.*` keys with sq/en/uk/it parity ONLY if a needed label truly doesn't exist).
- a `<Text>` caption describing it as the locale-switcher abbreviation trigger.

Use the SAME abbreviations §F fixes (`SQ`/`EN`/`UA`/`IT`; `uk` → `UA`). Do NOT change the story `meta`
(`skipCanvas` + `layout:'fullscreen'` stay). **The Header migration (§A–§F) MUST NOT begin until this option
renders correctly AND is approved** — it is the reviewable reference for the flags→abbreviation + trigger-chrome
decision. Every value in the diff must trace to an existing example in this same story file or a canonical
Mantine variant — a reviewer (orchestrator) will reject any invented `className`/px/color/size on sight.

### A. LocaleSwitcher → `MantineDropdownMenu`
- `trigger` = a Mantine `Button` (ghost/subtle equivalent, TailAdmin §6a chrome) rendering `Globe` +
  flag + `showLabel` name + (`isPending` ? `Loader2` spin : `ChevronDown`), `disabled={isPending}`.
- `items` = `LOCALES.map(...)` → `{ label, onClick: () => onSwitch(code) }`; the current-locale row's `label`
  is wrapped to render bold (`fw`/`font-semibold`) — preserve the active highlight.
- `LocaleSwitcher` is `hidden sm:flex`, so only the **anchored** (≥640) MantineDropdownMenu path is ever shown;
  keep the component's own visibility class on the outer trigger wrapper.
- Preserve `onSwitch`/`isPending`/`showLabel`/`align`/`side`/`className`. For `defaultOpen` → STOP-AND-ASK #1.

### B. Desktop user menu → `MantineDropdownMenu`
- `trigger` = Mantine `Button` (ghost) = Mantine `Avatar` (src `user.avatar_url`, fallback `userInitials`) +
  truncated name + `ChevronDown`.
- `items` array mapping the 6-step order above. Navigation items use `onClick: () => router.push('/${locale}/…')`
  (NOT a nested `<Link>` — the item row is the click target). The **Admin dashboard** new-tab item →
  `onClick: () => window.open('/admin', '_blank', 'noopener,noreferrer')`, only pushed into `items` when the
  role check passes; use `separator: true` + `color`/label styling to match. **Logout** item → `color: 'red'`,
  `onClick: handleLogout`, `separator: true`.

### C. Mobile hamburger `Sheet` → `MantineDrawer`
- `opened={mobileOpen}`, `onClose={() => setMobileOpen(false)}`, `side="right"`, an appropriate `size`.
- Move the existing drawer body (user header, nav links, auth/logout buttons) into `MantineDrawer`'s `children`.
  The nav entries stay `<Link>` (out-of-scope primitive) but MUST keep `onClick={() => setMobileOpen(false)}`.
  The hamburger **trigger** is now a sibling Mantine `Button` (icon, `aria-label={tc('aria_open_menu')}`) that
  sets `mobileOpen=true` — `MantineDrawer` is controlled and supplies no trigger of its own.

### D. Mobile locale `Combobox` → `MantineCombobox`
- Same options/value/onChange contract; compact trigger at `w-24`, `sm:hidden`. Match the current `variant="button"`
  compact trigger using `MantineCombobox`'s canonical trigger — if `MantineCombobox` has no compact/button-style
  trigger that fits `w-24`, STOP-AND-ASK #2 (do not invent one).

### E. Avatar → Mantine `Avatar`
- Both the desktop user-menu trigger and the mobile drawer header use Mantine `Avatar` (image + initials
  fallback), matching the `Mantine/Primitives/Avatar` story's canonical usage. Sizes: keep the current
  `h-7 w-7` (desktop trigger) and `h-10 w-10` (mobile header) equivalents.

### F. Locale display — flags → 2-letter abbreviations (owner change 2026-07-11) 🔴 INTENTIONAL VISUAL CHANGE
This is the ONE deliberate visual change in this task (everything else is behavior-preserving). Remove ALL
country-flag emojis (🇦🇱 🇬🇧 🇺🇦 🇮🇹) from every locale surface and show a short uppercase 2-letter abbreviation
instead:

| locale code | abbreviation shown |
|---|---|
| `sq` | `SQ` |
| `en` | `EN` |
| `uk` | `UA` ← **NOTE: `uk` displays `UA` (Ukraine), NOT `code.toUpperCase()` = "UK"** |
| `it` | `IT` |

- In `LocaleSwitcher.tsx`: replace the `flag` field on the `LOCALES` constant with an `abbr` field carrying the
  values above — a **static, language-neutral map (NOT an i18n key**; the abbreviation is identical in all 4 UI
  locales). Then update EVERY consumer of the old `flag` field (global-change rule / Note 14 — leave NO diverging
  call site): the LocaleSwitcher trigger (`Globe` + `abbr`, was `Globe` + flag), the LocaleSwitcher menu items
  (`abbr` + language name), and Header's `localeOptions` (was `` `${flag} ${code.toUpperCase()}` `` → just `abbr`
  — this ALSO fixes the current `uk → "UK"` bug in the mobile combobox, which must now read `UA`).
- Keep the full language NAME (the i18n `langLabels` values) exactly where it is shown today (menu-item labels,
  combobox `description`) — ONLY the flag token is replaced by the abbreviation; do NOT drop the language name.
- Keep the `Globe` icon on the trigger. a11y: the abbreviation is the visible token, and the full language name
  (i18n) still accompanies it in the menu/combobox rows, so the accessible name stays meaningful.
- **This §F OVERRIDES every "flag" mention in "Current behavior to PRESERVE" above** — those describe the CURRENT
  state; the flag token is the one thing that intentionally changes.

## Positive flow (happy path)

- Actor: any visitor / logged-in user, all 4 locales, all breakpoints.
- **Locale switch (≥640):** open the LocaleSwitcher menu → 4 locales, current one bold → pick another →
  `setAdminLocale` fires then `router.push` navigates preserving the path → header re-renders in the new locale.
- **Locale switch (<640):** the `MantineCombobox` opens as a full-width bottom sheet → pick a locale → same
  `switchLocale`.
- **User menu (≥768, logged in):** open → Profile/My listings/Add listing/(admin, new tab)/Logout → each routes
  correctly; Admin dashboard opens `/admin` in a new tab; Logout signs out and returns home.
- **Mobile hamburger (<768):** tap → `MantineDrawer` opens as a bottom sheet (edge-to-edge, drag handle) → nav
  link routes AND closes the drawer; logged-out shows Login/Register/Register-agent (each opens AuthSheet +
  closes drawer); logged-in shows the destructive Logout.
- **No console hydration error** on first paint of `/` in any locale (this is the bug's success criterion).

## Negative flow (every off-happy-path branch)

- **Dismiss without action:** backdrop tap AND `Esc` close the LocaleSwitcher menu, the user menu, the mobile
  Combobox sheet, and the hamburger drawer — with NO navigation, NO locale change, NO logout; focus returns to
  the trigger.
- **`isPending` locale switch:** the LocaleSwitcher trigger is `disabled` and shows the spinner; a second click
  does nothing (no double `router.push`).
- **Logged-out user menu:** the MantineDropdownMenu user menu is NOT rendered (the Login/Register buttons show
  instead — unchanged); the mobile drawer shows the auth buttons, not the logout/profile rows.
- **Non-admin user:** the Admin dashboard item is absent from both the desktop menu and (already) the mobile
  drawer — the role gate is preserved exactly.
- **Rapid re-open / double-tap** the hamburger: `mobileOpen` toggling stays consistent (controlled state); no
  duplicate drawer, no stuck backdrop.
- **Route already on target:** picking the current locale / current page is a no-op-navigation, no crash.

## 🔴 Mobile <640 full-width gate (OWNER P0 — clause 11)

- Every migrated **overlay** renders as a **full-width bottom sheet** at <640: the mobile locale `MantineCombobox`
  dropdown, the hamburger `MantineDrawer`. (The LocaleSwitcher menu and the desktop user menu are `hidden`
  below 640/768 respectively, so their mobile-sheet path is never shown — note this explicitly; they inherit
  the canonical bottom-sheet behavior for free from `MantineDropdownMenu` regardless.)
- The hamburger trigger and the mobile locale trigger are icon-only/compact → **documented icon-only exemptions**
  (list them). ≥44px touch targets; labels wrap in sq/en/uk/it; no horizontal scroll at 320.
- The canonical primitives already implement the bottom-sheet/drag-handle/Esc/backdrop rules — do NOT re-implement
  them; consume the primitive. If any overlay does not come out full-width at <640, that is a REJECT.

## 🔴 TailAdmin conformance (OWNER P0 — clause 16)

- Every migrated trigger `Button`, menu item, drawer, avatar, and combobox must match the TailAdmin reference
  (border `gray-300`, radius, focus ring, `shadow-theme-xs`, Outfit, density) — proven RENDERED side-by-side
  with the canonical primitive stories, NOT asserted. Brand stays `#EC5447`. Zero invented color/px/radius/shadow;
  cite each to a `tailadmin-style-reference.md` §-row. The canonical primitives already encode this — the job is
  to consume them and prove the Header render matches, not to restyle.

## 🔴 Regression coverage (clause 15 — critical-flow-registry)

- Scan `docs/critical-flow-registry.md` for the **locale switch**, **auth entry (login/register sheet)**,
  **logout**, and **mobile navigation** flows. This task touches them, so: baseline the existing coverage,
  and add/extend a registry row for "Header overlays (locale switch · user menu · mobile drawer)" whose proof
  includes **(a)** the migrated interactions still route correctly and **(b)** the hydration console error is
  GONE. Capture the before/after console evidence on `/` (error present on the base-UI version → absent after)
  as the concrete regression artifact — a green `screenshots:assert` alone does not prove the hydration fix.
- If a persisted automated check is feasible (e.g. asserting no `hydration-mismatch`/`base-ui-_R_` id in the
  console during the Header story render via the existing rendered-gate console capture), add it; otherwise
  record the manual before/after console transcript in the session log and the registry row.

## 🔴 Rendered verification matrix (clause 12) — REQUIRED to close

Session log MUST contain the rendered matrix: breakpoints (320·375·390·480·560·680·768·810·960·1024·1200·1440·
1920·2560) × sq/en/uk/it, with **uk@320/375/390 mandatory**, covering: the desktop LocaleSwitcher menu OPEN, the
desktop user menu OPEN (logged-in, admin + non-admin), the mobile locale Combobox sheet OPEN, and the hamburger
`MantineDrawer` OPEN (logged-in + logged-out). Machine-produced `screenshots:assert` artifacts for any migrated
story. `tsc=0`/build-green is NOT proof.

## Hard contract (verified against the real diff on return)

1. Scope = the two files at top only (+ story/i18n only if strictly required). No out-of-scope button/Avatar/Link
   touched beyond the overlay triggers named in §A–E. No behavior change to `switchLocale`/`handleLogout`/routing.
2. Do NOT invent architecture: consume `MantineDropdownMenu`/`MantineDrawer`/`MantineCombobox` as-is. Do NOT
   restyle or fork them. If the item/trigger API cannot express a required behavior (new-tab admin item,
   current-locale bold, `defaultOpen`, compact combobox trigger), STOP and ASK — do not hack around it.
3. Preserve every control (clause 3 / Note 20): before/after inventory of every Header interactive control in the
   session log; nothing silently dropped (all 4 locales; Profile/My-listings/Add/Admin/Logout; Favorites; bell;
   auth buttons; hamburger; both locale switchers).
4. Locale parity: no new visible string without sq/en/uk/it (there should be none new).
5. File-integrity (clause 14): read back each edited file — 0 NUL, no BOM, `tsc --noEmit`=0, not truncated;
   paste the green transcript.
6. Self-validation block + AC-by-AC table + "Files Changed" table. Do NOT run git / emit `git add`/`commit` —
   the orchestrator emits the commit at review.
7. Update `docs/backlog.md` (Last Session + mark 574) and add `docs/sessions/<date>-task574-header-mantine-overlays.md`.

## Acceptance criteria (each verifiable in the diff at file:line OR a named gate transcript/console capture)

1. `LocaleSwitcher.tsx` imports NO `@/components/ui/dropdown-menu`; renders `MantineDropdownMenu` with the Globe
   trigger + 4 locale items + current-locale bold + `isPending` disable/spinner preserved. *(diff)*
2. `Header.tsx` desktop user menu = `MantineDropdownMenu`; all 6 items in order; Admin item role-gated + opens
   `/admin` in a new tab; Logout destructive/red. *(diff)*
3. `Header.tsx` hamburger = `MantineDrawer` (controlled by `mobileOpen`), body preserved, every nav/auth/logout
   action still closes the drawer. *(diff)*
4. `Header.tsx` mobile locale switcher = `MantineCombobox`, same options/value/onChange, `sm:hidden`, compact. *(diff)*
5. Avatars are Mantine `Avatar` (image + initials fallback) in both the desktop trigger and mobile header. *(diff)*
6. NO `@/components/ui/dropdown-menu`, NO `@/components/ui/sheet`, NO legacy `@/components/shared/Combobox` import
   remains in either file. *(diff)*
7. The console **hydration error is gone** on `/` in all 4 locales — before/after console transcript captured. *(regression artifact)*
8. Rendered matrix (clause 12) + mobile full-width (clause 11, with documented icon-only exemptions) + TailAdmin
   side-by-side (clause 16) all present with real per-cell evidence. *(session log)*
9. `tsc --noEmit`=0; lint clean; `screenshots:assert -- --mantine-only` green (no new FAIL); file-integrity clean. *(transcripts)*
10. NO country-flag emoji remains on ANY locale surface (trigger, menu items, mobile combobox); each shows the
    abbreviation `SQ`/`EN`/`UA`/`IT` — with `uk` → `UA` (NOT `UK`) — and the full language name is preserved
    where shown today. *(diff + rendered evidence, all 4 locales)*
11. **(Done FIRST)** `Mantine/Primitives/DropdownMenu` story gains the compact abbreviation/icon-trigger option
    (`Globe` + 2-letter abbr + `ChevronDown`; items = abbr + language name), additive (existing examples
    untouched), rendering correctly BEFORE any Header edit. *(diff + Storybook render)*

## STOP-AND-ASK triggers

1. **`LocaleSwitcher.defaultOpen`** (Storybook/QA-only prop): `MantineDropdownMenu` uses an uncontrolled Menu
   with no `defaultOpen`. If the LocaleSwitcher story relies on it for open-state evidence, STOP and ASK how to
   render the open state for QA (do not silently drop the prop or fork the primitive).
2. **`MantineCombobox` compact/button trigger:** if it cannot reproduce the current `variant="button"` `w-24`
   compact mobile trigger, STOP and ASK — do not invent a bespoke trigger.
3. **New-tab admin item / current-locale bold:** if `DropdownMenuItemDef` cannot express the `_blank` admin item
   or the bold active row cleanly, STOP and ASK before working around the item API.
4. Any temptation to also migrate the out-of-scope plain action buttons / Favorites Link-as-button in this task
   (that is Task 575) — do NOT expand scope; STOP and ASK if it seems unavoidable.
5. **Trigger chrome — bordered `default` vs the current ghost look.** The existing Header LocaleSwitcher trigger
   is a borderless `ghost/sm` button; the canonical `DropdownMenu` story trigger is `Button variant="default"`
   (bordered). §0 uses `variant="default"` (canonical, zero-invention). If the current borderless look must be
   preserved on the Header, that maps to Mantine `variant="subtle"` — **STOP and ASK which variant before
   applying it; do NOT invent a third styling** (no custom `className`/border/bg to "fake" either look).
6. If ANY required trigger/menu/abbreviation styling is NOT already expressible via a canonical Mantine variant
   or an existing example in `DropdownMenu.stories.tsx` — STOP and ASK. Do not close the invention gap yourself.
