# Task 556 — PhoneField → Mantine/TailAdmin migration (Sprint 41 / Epic MM Phase-2)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

Migrated `PhoneField` (dial-code selector + national number, used by registration, cabinet
profile, and admin phone/whatsapp forms) from the legacy `@/components/shared/Combobox` +
`@/components/ui/input` + `@/components/ui/label` trees onto the canonical `MantineCombobox` +
Mantine `TextInput` + `InputLabel`. Presentational swap only — all phone LOGIC
(`parsePhoneValue`/`buildE164`/char-filter/paste/`emit`) is byte-identical, confirmed via the
untouched `phone.test.ts` baseline (56/56, unaffected) plus a new RTL wiring smoke.

## STOP-AND-ASK #1 — `size` (owner: Option A, drop entirely, standardize h-11)

Owner resolution: drop `size` from `PhoneFieldProps` entirely; remove the `countryClass`
sm/default branches, the `inputClass` sm-override, and the `size` passthrough. Every `PhoneField`
is now h-11 (default Mantine size), including the two admin forms (slightly taller admin phone
rows — consistent with the Task 553 `LocationCombobox` precedent). Country trigger's compact width
set via `triggerWidth={{ base: '7rem', sm: '7rem' }}` (7rem = the legacy `w-28` = 112px, cited
verbatim by the owner — no invented value; `w-24`'s sm-density variant is gone along with `size`).

**Authorized consumer edits** (owner-listed, all four confirmed and applied):
- `AdminUserProfile.tsx:1007` (phone) — `size="sm"` removed.
- `AdminUserProfile.tsx:1025` (whatsapp) — `size="sm"` removed.
- `AdminUserCreate.tsx:243` (phone) — `size="sm"` removed.
- `AdminUserCreate.tsx:261` (whatsapp) — `size="sm"` removed.

Other consumers (`AuthSheet.tsx:684`, `ProfileTab.tsx:302,307`, `input.stories.tsx:113`) never
passed `size` — zero diff, confirmed via `tsc --noEmit` (clean both before and after the admin-site
edits; the 4 `TS2322: Property 'size' does not exist` errors that appeared immediately after
dropping the prop from `PhoneFieldProps` pinpointed exactly these 4 call sites and no others).

## STOP-AND-ASK #2 — dropdown min-width (owner: Option A, add `dropdownMinWidth`)

Added `dropdownMinWidth?: number` to `MantineComboboxProps`, applied only to the desktop
`Combobox.Dropdown` (`style={dropdownMinWidth ? { minWidth: dropdownMinWidth } : undefined}`),
default `undefined` → byte-identical when omitted. `PhoneField` passes `dropdownMinWidth={240}` —
the exact legacy value, not invented. The primitive's own doc comment (which previously deferred
this prop "until a Phase-2 consumer needs it") was updated to record `PhoneField` as that consumer.
Mobile bottom sheet untouched (already full-width, unaffected by this prop).

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | Added `dropdownMinWidth?: number` prop, applied to desktop `Combobox.Dropdown` only; updated the primitive's doc comment | STOP-AND-ASK #2 |
| `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` | +2 tests (`dropdownMinWidth` reaches the dropdown / absent = byte-identical) | Smoke + planted-violation coverage for the new prop |
| `src/components/shared/PhoneField.tsx` | Full rewrite: legacy `Combobox`/`Input`/`Label` → `MantineCombobox`/Mantine `TextInput`/`InputLabel`; `size` prop removed; header comment corrected (was falsely claiming mobile stacking — always an inline row); `error` now renders via `TextInput`'s native `error` prop instead of a hand-rolled `<p>` | Task scope |
| `src/components/shared/__tests__/PhoneField.smoke.test.tsx` (new) | 3 RTL tests: country-change rebuilds E.164, national-change emits E.164, rejected paste fires `onPasteError` + no mutation | Registry requirement — PhoneField had zero prior component coverage |
| `src/components/admin/AdminUserProfile.tsx` | Removed `size="sm"` from both `PhoneField` call sites (phone + whatsapp) | STOP-AND-ASK #1 authorized consumer edit |
| `src/components/admin/AdminUserCreate.tsx` | Removed `size="sm"` from both `PhoneField` call sites (phone + whatsapp) | STOP-AND-ASK #1 authorized consumer edit |
| `src/stories/mantine/primitives/PhoneField.stories.tsx` (new) | Persisted `Default` story, title `Mantine/Primitives/PhoneField` (Phase-0 discovery), renders the REAL `PhoneField` in default + error states | Rendered-proof requirement |
| `messages/{en,sq,uk,it}.json` | Added ONE new key `phone.country` (4-locale parity) — used for `triggerAriaLabel`/`sheetTitle` on the country picker | No existing key fit (checked `common.country`/`common.region` — neither existed for this purpose) |
| `docs/critical-flow-registry.md` | Added "Phone entry (registration / profile / admin)" row (none existed); fixed a stale line-number citation on the adjacent "Admin add-location sub-panel" row (`AdminUserProfile.tsx:1037→1042`, `AdminUserCreate.tsx:276→281` — shifted by this task's `size` removals) | Registry requirement + accuracy |

No change to `LocationCombobox.tsx`, `src/lib/phone/*` (parsing/validation/CLDR names untouched),
any OTHER consumer field, `scripts/check-stories-rendered.mjs`, or the two-field row layout.

## §18.9 human-visual proof (mandatory — the geometry gate cannot see this)

Captured via the persisted `Mantine/Primitives/PhoneField` story + a live `AuthSheet` check:

- **uk@320/375/390** (mandatory), **sq@320**, **it@320**, **en@1280**: country trigger + national
  input render at the same height, top-aligned in the row; default state shows "AL +355" +
  placeholder-filled national value; error state shows the §6e red border + wrapped localized
  message on the national field ONLY (country trigger unaffected) in all 4 locales — no clipping,
  no overlap, full-width row at every mobile breakpoint. (Flag emoji glyphs did not render in the
  headless Chromium sandbox — a known environment font limitation, not a product defect; the
  underlying text is the real `🇦🇱 +355`/`🇦🇱 Albania` strings, confirmed present in the DOM.)
- **Dropdown open, desktop (uk@1280) + mobile (uk@320)**: `dropdownMinWidth={240}` confirmed —
  long localized names ("Боснія і Герцеговина") render fully readable, not cramped, in the desktop
  anchored dropdown; the mobile path renders the full-width bottom sheet with a search field and
  ≥44px rows, same as every other `MantineCombobox` consumer.
- **Live `AuthSheet` registration overlay** (`http://localhost:3000/uk`, real dev server, 1280px):
  `PhoneField` renders correctly inside the Sheet (label "Телефон", height-aligned row); clicking
  the country trigger opens the dropdown UN-CLIPPED, rendering fully outside/over the Sheet's own
  bounds — confirms the `portal`-by-default behavior (documented no-op prop) genuinely prevents
  clipping in the one real overlay context this component ships in.

## Mobile `<640` full-width gate (clause 11)

Inline row preserved at every breakpoint (not restacked — the stale header comment claiming mobile
stacking was corrected, since the code never actually stacked). Country trigger = the ONE
documented compact exemption (~112px fixed, `triggerWidth`); national `TextInput` fills the
remaining row width (`flex:1`, `minWidth:0`) — confirmed full-bleed to the row edge in every
screenshot above. Country dropdown = full-width bottom sheet `<640` (`MantineCombobox` default,
confirmed via the mobile dropdown screenshot). No horizontal scroll at 320 in any locale.

## TailAdmin conformance (clause 16)

No new §6x row — national `TextInput` + country `variant="button"` trigger both inherit §6d/§6e
chrome verbatim via the existing `input-chrome.css` rules (unaffected by this task); dropdown/sheet
rows use the established §6l item chrome. §15 control-height alignment confirmed rendered
side-by-side (see §18.9 evidence) — country trigger and national input are the same height,
top-aligned.

## Gates

- `tsc --noEmit` — clean, 0 errors (after the 4 `size`-removal consumer edits).
- `npm run check:stories` — PASSED, 106 files checked, 0 violations; `storybook.*` parity unaffected (543 keys × 4 locales — the new story reused an existing key, `storybook.input.phone`, zero new story keys).
- `npm run check:i18n` — PASSED, 2111 keys × 4 locales (2110→2111, the one new `phone.country` key, full parity).
- `npm run check:design-tokens -- --strict` — PASSED, 0 violations (after adding an exact-value `design-tokens-allow` marker for the owner-cited `7rem` trigger width — first attempt used an unquoted value and correctly failed as a stale marker until corrected to the byte-exact detected string).
- `npm run check:mojibake` — PASSED, 0 artifacts in 1596 files.
- `npm run check:file-integrity` — PASSED, 11 changed files clean.
- `npx vitest run` (`MantineCombobox.smoke` + `LocationCombobox.smoke` + `PhoneField.smoke` + `phone.test.ts`) — **73/73 PASS** (10 + 4 + 3 + 56).
- `npm run screenshots:assert -- --mantine-only` (fresh `storybook-static` rebuild) — **494/512 PASS, 0 FAIL, 18 pre-existing AMBIGUOUS** (story count 31→32, cells 496→512, +16 all clean; the 18 ambiguous cells are byte-identical to the pre-existing Combobox/Drawer/Tabs known set — zero new ambiguous or fail from this story).

## Planted-violation transcripts

**`dropdownMinWidth` (MantineCombobox primitive):** removed the `style={...}` from
`Combobox.Dropdown` → `"dropdownMinWidth reaches the desktop Combobox.Dropdown"` FAILS
(`expected '' to be '240px'`); reverted → 10/10 `MantineCombobox.smoke.test.tsx` PASS.

**PhoneField wiring smoke:** commented out `emit(dialCode, iso2, raw)` inside
`handleNationalChange` → `"national-number change emits an updated E.164 value"` FAILS (`onChange`
0 calls, expected 1); reverted → 3/3 `PhoneField.smoke.test.tsx` PASS. This proves the smoke would
have caught the migration if the new `TextInput`'s `onChange` wiring had been silently dropped
during the swap — the actual risk this presentational migration carried.

## AC-by-AC self-audit

1. **Renders through `MantineCombobox` + Mantine `TextInput` + canonical Mantine label; zero
   legacy imports; public API unchanged except the STOP-1 outcome, all 4 consumer sites updated +
   listed.** Confirmed — `PhoneField.tsx` imports only `@mantine/core`/`@/design-system/mantine/patterns`;
   `size` removed from `PhoneFieldProps`; 4 admin call sites edited (Files Changed table).
2. **All phone LOGIC byte-identical; behavior preserved end-to-end.** `parsePhoneValue`/`buildE164`/
   `emit`/char-filter/paste functions are untouched, copy-pasted verbatim from the legacy file;
   `phone.test.ts` 56/56 unaffected; new RTL smoke covers country-change/national-change/paste-reject.
3. **Both STOP-AND-ASKs resolved + implemented; new prop optional+default-absent-byte-identical,
   covered by smoke + planted-violation.** See both STOP sections above + the `dropdownMinWidth`
   planted-violation transcript.
4. **Mobile `<640`: inline row preserved, compact exemption documented, full-bleed national input,
   full-width sheet, no h-scroll at 320 × 4 locales; stale comment fixed.** See the dedicated
   section above; header comment rewritten to state the actual (always-inline) layout.
5. **TailAdmin chrome matched side-by-side; §15 height alignment proven; zero invented values.**
   See §18.9 evidence (height-aligned screenshots) + TailAdmin Conformance section (no new §6x row,
   `7rem` trigger width owner-cited to the legacy `w-28`, not invented).
6. **Registry row added; `phone.test.ts` baseline recorded; PhoneField smoke + planted-violation
   FAIL transcript.** "Phone entry (registration/profile/admin)" row added to
   `critical-flow-registry.md`; 56/56 baseline recorded above; 3 RTL tests + 1 planted-violation
   transcript (see above).
7. **i18n: zero new keys except at most one country-label key, stated; `check:i18n` green; all 4
   locales confirmed at runtime.** ONE new key, `phone.country` (stated in STOP-2/Files-Changed);
   `check:i18n` 2111×4 PASS; all 4 locales visually confirmed in the §18.9 screenshots (labels,
   error messages, dropdown names all correctly localized, not just key-count parity).
8. **All 6 light gates + `screenshots:assert --mantine-only` green; §18.9 set pasted; Files-Changed
   table present.** See Gates section — all green, 494/512 PASS 0 FAIL; §18.9 evidence documented
   above in full (breakpoints, locales, dropdown-open, live AuthSheet no-clip proof).

## Self-validation

Self-validation: both STOP-AND-ASKs were genuinely blocking decisions (an owner-decided
size-density tradeoff and a primitive-API-surface addition) — surfaced them rather than guessing,
and implemented exactly what was decided, including the owner's own cited legacy value (`7rem` =
`w-28`) rather than inventing a number. Verified the `size` removal's blast radius empirically via
`tsc` (the compiler pinpointed exactly the 4 admin call sites — no consumer was missed or
over-edited). Caught and fixed my own `design-tokens-allow` marker mismatch (first attempt used an
unquoted value that didn't byte-match the detected raw text, correctly triggering a stale-marker
violation — fixed by using the exact detected string). Proved the new `dropdownMinWidth` prop and
the migration's wiring integrity with real planted-violations, not just passing tests written to
pass. Went beyond the story-level proof to also check the ONE real overlay context `PhoneField`
ships in (`AuthSheet`'s registration Sheet) live on the dev server, confirming the dropdown
genuinely does not clip — the exact risk the kickoff's negative-flow section called out by name.
All 6 light gates green; 73/73 relevant vitest tests green; rendered gate 494/512 PASS 0 FAIL 18
pre-existing ambiguous (16 new cells, all clean). Git was not run — HELD for the orchestrator's
diff review and commit emission.
