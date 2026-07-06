# Task 556 — PhoneField → Mantine/TailAdmin migration (Sprint 41 / Epic MM Phase-2)

**Type:** UI / component migration (product code). **Executor:** Sonnet 4.6.
**Origin:** Epic MM Phase-2 — after the Combobox family (551/552/553) closed, `PhoneField` is the next
composite. It still renders through the LEGACY trees (`@/components/shared/Combobox`, `@/components/ui/input`,
`@/components/ui/label`). This task migrates it to the canonical Mantine primitives (`MantineCombobox` +
Mantine `TextInput` + the canonical Mantine label), preserving 100% of behavior and the public Props API.

## Current state (read before touching — `src/components/shared/PhoneField.tsx`)

`PhoneField` is a two-control inline row:
- **Dial-code selector** — legacy `Combobox variant="button" searchable`, options `{ value, label:"🇦🇱 +355",
  dropdownLabel:"🇦🇱 Albania", description:"+355", searchText:<all-locale names> }`, `size`, `className`/
  `triggerClassName` = `w-28 shrink-0 pr-8` (compact fixed width), `portal`, `dropdownMinWidth={240}`.
- **National number** — legacy `Input type="tel"` with `onChange` (char-filtered), `onPaste`
  (`normalizePastedNational`), `placeholder=getPhonePlaceholder(iso2)`, `autoComplete="tel"`, `flex-1 min-w-0`.
- **Label** — legacy `Label` above the row (optional). **Error** — single `<p class="text-xs text-destructive">`
  below the row.
- All phone logic (`parsePhoneValue`, `buildE164`, char-filtering, paste normalization, `emit`) is UI-agnostic
  and **stays byte-identical** — this is a presentational swap only, NOT a logic change.

**Consumers (public API must stay stable — verify each still compiles + renders unchanged):**
`AuthSheet.tsx:684` (registration, inside a Sheet; `label`, default size), `ProfileTab.tsx:302,307` (cabinet;
`label`, default size), `AdminUserProfile.tsx:1003,1021` (`size="sm"`, `error`, ×2), `AdminUserCreate.tsx:239,257`
(`size="sm"`, `error`, ×2), `input.stories.tsx:113` (story). No consumer currently passes `portal` or
`onPasteError`; `size="sm"` is passed ONLY by the two admin forms.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses 1–16; esp. 3, 4, 7, 11, 12, 16) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` (**no phone row exists yet — this task ADDS one**, see Regression coverage).
- 🔴 `docs/mantine-responsive-design-system.md` — **§18 (theming/CSS pitfalls, `input-chrome.css` mechanism) +
  §18.9 (icon/placeholder IRON RULE) + §7 (mobile gate) + §12 (canonical patterns) + §15/§16 (gates)**.
- 🔴 `docs/tailadmin-style-reference.md` **§6d/§6e (field chrome — the national input + the button trigger both
  inherit this VERBATIM, no new §6x needed) + §6l (dropdown item chrome) + §6 label tokens**.
- `docs/ui-rules.md` (§15 control-height alignment, §17 UI pre-flight), `docs/component-rules.md`, `docs/qa-rules.md`.
- Reference: `src/design-system/mantine/patterns/MantineCombobox.tsx` (the target primitive + its full Props
  doc) and the Task 551/552/553 session logs (the established migration pattern + the `size`-removal precedent).

## What maps cleanly (no decision needed)

- Country options `{ value, label, dropdownLabel, description, searchText }` → **already exactly
  `MantineComboboxOption`** (MantineCombobox.tsx:18–28). Build them the same way; zero shape change.
- `variant="button" searchable`, `searchPlaceholder=t('search_placeholder')` → supported 1:1.
- `MantineCombobox` REQUIRES `noResultsLabel` → reuse the existing `common.no_results` (as LocationCombobox
  does) — **zero new key**. `triggerAriaLabel`/`sheetTitle` for the country picker → use an existing phone/
  common key if one fits; **only if none exists**, add ONE key `phone.country` (or reuse `phone.search_placeholder`)
  with full sq/en/uk/it parity — state which you picked. This is the ONLY place a new key might appear.
- National `Input` → Mantine `TextInput` (`type="tel"`, `autoComplete="tel"`, same `onChange`/`onPaste`/
  `placeholder`, `w="100%"`/`flex:1`). It inherits §6d/§6e chrome for free via the existing
  `.mantine-TextInput-input` rules (Task 505/527/528/555) — **no new CSS**.
- Error → pass `error={error}` to the national `TextInput` so it renders the native §6e red border + message
  (red-6, 12px); **remove the hand-rolled `<p class="text-destructive">`**. Country trigger carries no error
  border (the error is about the number, not the country). Confirm the message still wraps (`break-words`).
- `portal` → **keep in Props as a documented no-op** (Mantine's low-level `Combobox` portals its dropdown by
  default, `withinPortal:true` — so it does not clip inside the AuthSheet Sheet or admin overflow). This mirrors
  the Task 552 `YearCombobox` precedent (kept `portal` as a no-op for API stability). Do NOT delete the prop.
- Label → the canonical Mantine label (§6 label tokens: Open Sans / 600 / 14px), matching how the migrated
  `TextInput`-based fields render their label. Keep it optional + above the row.

## 🔴 STOP-AND-ASK #1 — `size="sm"` (admin density) vs the h-11 standardization

`MantineCombobox` has **no `size` prop** — it was deliberately removed in Task 553 (owner decision 2: filter-bar
h-11 standardization). But `AdminUserProfile` + `AdminUserCreate` pass `size="sm"` (legacy h-9/h-10) for admin
form density. You CANNOT re-add `size` to `MantineCombobox` without contradicting that owner decision. **Do NOT
guess — STOP and ASK the owner** which they want:
- **(A)** Drop `size` from `PhoneField` entirely → standardize every phone field to **h-11** (consistent with the
  whole Combobox family; the two admin forms get slightly taller phone rows). Simplest, most consistent.
- **(B)** Keep a `size='sm'` visual by sizing the national `TextInput` + country trigger locally in `PhoneField`
  (e.g. `size="xs"`/a height override on both sub-controls) WITHOUT touching `MantineCombobox` — more code, keeps
  admin density.

Record the owner's choice in the session log before implementing. If (A), also confirm the two admin call-sites
drop the `size="sm"` prop (authorized consumer edits — list them).

## 🔴 STOP-AND-ASK #2 — desktop dropdown min-width for the compact country trigger

The country trigger is intentionally narrow (`w-28` ≈ 112px). Legacy passed `dropdownMinWidth={240}` so the
localized country rows ("🇦🇱 Албанія  +355") aren't cramped. `MantineCombobox` does **not** expose a dropdown-width
prop yet (its own doc, MantineCombobox.tsx:157–161, says one "will be added when a Phase-2 consumer needs it" —
**PhoneField is that consumer**). The mobile path is already a full-width bottom sheet (fine); only the **desktop
anchored dropdown** needs a min-width. **STOP and ASK** before adding primitive API:
- **(A)** Add an optional `dropdownMinWidth?: number` (or `dropdownWidth?`) to `MantineCombobox`, applied to
  `Combobox.Dropdown` on the desktop path only, default `undefined` (byte-identical when absent) — then
  `PhoneField` passes `240`. Canonical, benefits future narrow-trigger consumers.
- **(B)** Confirm (with a rendered `getComputedStyle` proof) that Mantine's default dropdown width is already
  adequate for the longest country row at 320/desktop, and drop `dropdownMinWidth` as unnecessary.

Do NOT invent a width value or add the prop silently — get the owner's ruling, then cite the exact value.

## Mobile <640 full-width gate (clause 11) — PRESERVE the current inline layout, do NOT restack

The current shipped layout is an **inline row** at ALL breakpoints: `[compact country trigger] [national input
flex-1]`, container inheriting parent full width. This is clause-11-compliant: the ROW is full-width and the
country trigger is **the ONE documented compact exemption** (a fixed-width dial-code button, not a text field).
The stale header comment in `PhoneField.tsx:13–14` CLAIMS the two controls "stack full-width" on mobile — the code
does NOT, and never has. **Preserve the inline row; do NOT introduce stacking (that would be an out-of-scope
behavior change). Fix the stale comment to describe the actual inline layout.** Required after-behavior:
- Country trigger = compact fixed width at every breakpoint (map `w-28`/`w-24` → `triggerWidth={{ base:'7rem',
  sm:'7rem' }}` or the size-decision equivalent). It is the exempted compact control — document it as such.
- National `TextInput` fills the remaining row width (`flex:1`, `w="100%"`, `min-w-0`) — full-bleed to the row edge.
- The country **dropdown** renders as a full-width bottom sheet `<640` (MantineCombobox already does this) with a
  ≥44px touch target per row; the in-sheet search field present (`searchable`).
- ≥44px touch targets on both sub-controls; long sq/en/uk/it labels wrap, never clip; **no horizontal scroll at 320**.

## TailAdmin conformance (clause 16) — all existing chrome, no new §6x, no invented values

- National `TextInput` + country `variant="button"` trigger → §6d/§6e resting/focus/error/disabled chrome
  VERBATIM via the existing `input-chrome.css` rules (border gray-300, radius `lg`, `shadow-xs`, brand-3 focus
  ring, Open Sans). Nothing new to extract.
- Dropdown/sheet rows → §6l item chrome (14px / gray-7 / `lg` radius), as MantineCombobox already renders.
- **§15 control-height alignment:** the country trigger and the national input MUST be the same height and
  vertically aligned in the row (both h-11, or both the size-decision height). Prove it rendered.
- Clause 16a does NOT apply (no zip-absent primitive — every value traces to an existing §6d/§6e/§6l row).

## Positive flow (happy path)

Actor: user filling a phone field (registration / cabinet profile / admin user form).
1) Field renders: optional label, compact country trigger showing "🇦🇱 +355", national input with the
   country-specific placeholder, same height, aligned. 2) User clicks the country trigger → desktop anchored
   dropdown (≥640) / full-width bottom sheet (<640) opens with a search field + localized country rows. 3) User
   types to filter (matches label/dropdownLabel/description/searchText across all 4 locales) → selects a country
   → trigger updates to the new dial code, `onChange` emits `{ national, dialCode, iso2, e164 }` with the rebuilt
   E.164. 4) User types the national number (non-phone chars blocked) → `onChange` emits updated E.164. 5) User
   pastes a full international number → `normalizePastedNational` strips the country code and fills the national
   part; a mismatch/unsupported paste is rejected via `onPasteError`. Success: E.164 correct, no layout shift,
   no clip at 320.

## Negative flow (every off-happy-path branch)

- **Cancel/dismiss the country picker** (Esc, backdrop tap, re-click trigger) → closes, no selection change,
  focus returns to the trigger; mobile sheet search resets on close (MantineCombobox already handles).
- **Empty search / no matching country** → the `common.no_results` row shows (desktop + sheet), not a blank list.
- **Validation error present** (`error` prop) → national `TextInput` shows the §6e red border + wrapped message;
  country trigger unaffected; message never clips at 320 in any locale.
- **Paste rejected** (`normalizePastedNational` not ok) → paste prevented, `onPasteError(errorKey)` fires, field
  content unchanged (existing behavior — preserve exactly).
- **Non-phone characters typed** → filtered out (`/[^\d\s\-().]/g`), `+` only ever in the dial-code slot (preserve).
- **`size="sm"` admin path** → renders per STOP-AND-ASK #1's resolved option; both admin forms verified.
- **Inside AuthSheet (overlay) + admin overflow** → country dropdown does NOT clip (portal-by-default); prove it
  rendered in the AuthSheet registration step.
- **Long uk/it country name in the dropdown row** → wraps, never clips or forces h-scroll.
- **Locale switch (sq/en/uk/it)** → trigger, placeholder, dropdown names, label, error all reflect the active
  locale at runtime (not just key-count parity).

## Regression coverage (clause 15) — critical flow, MUST add a registry row + baseline

`PhoneField` feeds registration (`AuthSheet`) and profile/admin submit → E.164 is written to the DB. There is
**no `critical-flow-registry.md` row for phone entry yet — ADD one** (route/action: registration + profile save;
happy = valid national → correct E.164 emitted + submitted; failure = rejected paste / invalid number). Baseline
the existing `src/lib/phone/__tests__/phone.test.ts` (must be green BEFORE the change — record it), and add/confirm
a **PhoneField component smoke** (RTL) asserting: country change rebuilds E.164, national change emits E.164, a
rejected paste fires `onPasteError` and does not mutate — since the migration is a presentational swap, this smoke
is the proof the wiring survived. Include a planted-violation transcript proving the smoke FAILS if `onChange`
stops emitting. Do NOT close without this automated proof (a manual check is not sufficient).

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- Add ONE persisted story rendering the **REAL `PhoneField`**, titled under **`Mantine/Primitives/`** (NOT
  `Composites/` — Task 554 proved `--mantine-only` gives standing enforcement ONLY to `Mantine/Primitives/*`).
  Toolbar-driven locale + viewport (no per-viewport/`Ukrainian*` exports; `storyT`-driven strings, full sq/en/uk/it
  parity per `check:stories`). It must render both the default and the `size`-decision + error states.
- `screenshots:assert -- --mantine-only` green (paste the Phase-0 count line, before/after).
- 🔴 **§18.9 human-visual proof (the geometry gate is BLIND to overlap/placeholder/alignment):** paste
  human-inspected screenshots at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280** proving: country
  trigger + national input same height and aligned; national placeholder + country dial code visible (no blank/
  occluded text); dropdown rows readable (min-width per STOP #2); error message wraps; full-width row, no h-scroll
  at 320. A green PASS count is NOT the verdict for this task.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. `PhoneField` renders through `MantineCombobox` (country) + Mantine `TextInput` (national) + the canonical
   Mantine label — zero legacy `@/components/shared/Combobox` / `@/components/ui/input` / `@/components/ui/label`
   imports remain in the file. Public Props API unchanged except the STOP-AND-ASK #1 outcome (with all consumers
   updated + listed if `size` is dropped).
2. All phone LOGIC (`parsePhoneValue`/`buildE164`/char-filter/paste/`emit`) byte-identical; behavior preserved
   end-to-end (positive + every negative branch has a verifiable line).
3. STOP-AND-ASK #1 (`size`) and #2 (`dropdownMinWidth`) both resolved by the owner and implemented as decided;
   any `MantineCombobox` prop addition is optional + default-absent-is-byte-identical, covered by a smoke +
   planted-violation transcript.
4. Mobile <640: inline row preserved, country trigger the documented compact exemption, national input full-bleed,
   dropdown = full-width bottom sheet, no h-scroll at 320 × sq/en/uk/it; stale header comment fixed.
5. TailAdmin §6d/§6e/§6l chrome matched rendered side-by-side; §15 height alignment proven; zero invented values.
6. Registry row added + `phone.test.ts` baseline recorded + PhoneField smoke (with planted-violation FAIL transcript).
7. i18n: zero new keys except (at most) one country-label key with full sq/en/uk/it parity — state it; `check:i18n`
   green. All 4 locales confirmed at runtime, not just key counts.
8. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens --strict`, `check:mojibake`,
   `check:file-integrity` all green; `screenshots:assert --mantine-only` green; §18.9 human-visual set pasted;
   Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

Any change to `src/lib/phone/*` (parsing/validation/CLDR names); migrating the consumers' OTHER fields; changing
the two-field layout to a stacked/single-field design; adding country flags as `leftSection` icons; re-doing the
Combobox primitive matrix. This is a presentational primitive-swap of `PhoneField` + its proof only.
