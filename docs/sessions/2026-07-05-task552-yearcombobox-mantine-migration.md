# Task 552 — Phase-2 Slice 2: YearCombobox → MantineCombobox (Sprint 41 / Epic MM)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

Second Phase-2 shared-composite migration: `YearCombobox` now renders `MantineCombobox` with
`variant="input"` (its first `variant="input"`/typeahead product consumer) instead of the legacy
`@/components/shared/Combobox`. Its public API (`value`/`onChange`/`placeholder`/`className`/
`portal`) is byte-identical, so all six render sites have an empty diff.

## STOP-AND-ASK #1 resolution (owner, 2026-07-05) — Option A, implemented literally

`MantineCombobox`'s `variant="input"` trigger had no way to live-commit a value on keystroke (only
on option-select) and no `inputMode` passthrough — `YearCombobox` needs both (typing a valid year
commits it immediately; the mobile numeric keypad). Owner resolution: **Option A** — add two
backward-compatible props to `MantineCombobox`:

- `inputMode?: TextInputProps['inputMode']` — threaded onto BOTH the desktop `variant="input"`
  trigger `<TextInput>` (`MantineCombobox.tsx`, the `inputMode={inputMode}` line right after the
  trigger's `onChange`) AND the mobile sheet's own search `<TextInput>` (gated to
  `variant === 'input'` only, since the button-variant's in-dropdown search field never live-commits).
- `onInputChange?: (raw: string) => void` — fired with the raw typed value from the same two
  inputs. **Load-bearing suppression rule** (owner-flagged): when `onInputChange` is provided, the
  primitive's desktop `onChange` handler does `if (!onInputChange) onChange('')` instead of always
  calling `onChange('')` — this stops the double-fire (clear-then-commit) race the owner warned
  about. When `onInputChange` is absent, on-type behavior is byte-identical to today (both proven
  by planted-violation transcripts below, per the owner's explicit review checklist).
- `YearCombobox` maps `onInputChange` to its existing `handleInputChange` sanitize/validate
  function unchanged; passes `inputMode="numeric"`.

STOP-AND-ASK #2 (`portal`) — orchestrator's recommended resolution (documented no-op) confirmed by
rendered proof, not silently assumed: `portal` stays in `YearCombobox`'s public `Props` interface
(all four `portal`-passing call sites stay byte-identical) but is no longer destructured/forwarded
to `MantineCombobox` (which has no `portal` prop — Mantine's `Combobox.Dropdown` always portals via
`withinPortal: true` default, and the mobile path is always a portaled bottom sheet). **Rendered
proof** (Playwright against the live dev server, both filter pairs, desktop 1280 + mobile 375):
- `HeroSearch.tsx` → `FiltersPanel.tsx` (Advanced-filters slide-over panel): desktop — the
  `Combobox.Dropdown` renders as a full floating list, escaping the panel's own bounds entirely
  (visually extends left of/beyond the panel edge); mobile — full-width bottom sheet on top of the
  panel, drag handle visible, list fully rendered top-to-bottom. **Not clipped.**
- `ListingsShell.tsx` → `ListingsFilters.tsx` (legacy shadcn `Sheet`, `overflow-y-auto`, nested
  `AccordionSection`): desktop — dropdown renders as a large floating list extending far beyond the
  Sheet's own scroll container (proving the portal genuinely escapes to `document.body`, not
  clipped by the Sheet's `overflow-y-auto`); mobile — full-width bottom sheet, same as above.
  **Not clipped.**

No clipping was found on either surface at either breakpoint — the orchestrator's recommended
resolution stands as-is; no further owner escalation was needed.

## Third finding (owner-approved scope expansion, surfaced while proving STOP-AND-ASK #2)

While capturing the un-clipped rendered proof above, the desktop dropdown for `YearCombobox`
(Hero + Listings) rendered as one giant unclamped column of all ~82 years extending far past the
viewport — not "clipped," the opposite: `MantineCombobox`'s desktop `Combobox.Options` carries no
max-height/scroll cap at all (`theme.ts` confirmed — no `mah`/overflow styling exists for it).
`YearCombobox` is the first consumer with a genuinely long list; every prior consumer's list was
short enough never to expose this. Flagged to the owner before touching anything further (outside
both authorized STOP-AND-ASKs' scope).

**Owner ruling:** fix now — a real defect surfaced by this task's own required proof, not scope
creep. Cite the **canonical sibling primitive `MantineSelect`** (Mantine's own `<Select>`, zero
override on its `maxDropdownHeight`), NOT the legacy `Combobox.tsx`'s unrelated 224px `max-h-56`.
Measured empirically, not assumed:

1. Started Storybook (`npm run storybook`), temporarily added an 80-item long-list block to
   `Select.stories.tsx` (measurement only), opened it via Playwright, and read
   `getComputedStyle` on `.mantine-Select-options`: `height: "220px"`, confirmed visually (7 of 80
   years visible, internal scroll) — Mantine's own built-in default, not invented.
2. Reverted `Select.stories.tsx` byte-identical (`git diff --stat` empty, confirmed).
3. Applied to `MantineCombobox.tsx`: `<Combobox.Options mah={220} style={{ overflowY: 'auto' }}>`
   with an inline citation comment (no `overflow-y` accessor exists elsewhere in the primitive —
   `Combobox.Options` had zero style props before this).
4. Re-verified live against the real `YearCombobox` in `FiltersPanel` (Hero, post-fix):
   `maxHeight: "220px"`, `overflowY: "auto"`, `rectHeight: 220`, `childCount: 82` — byte-for-byte
   matching the `MantineSelect` measurement. Screenshot confirms only ~5 years visible
   (2031–2027) in a clean scrollable box, replacing the pre-fix unclamped column.
5. Mobile `ResponsiveBottomSheet`'s own `≤90dvh` cap is untouched — no double cap, no scope leak
   into the mobile path.
6. New primitive smoke test + planted-violation transcript (below). Kickoff file's
   `tasks/Sprints/Sprint_41_kickoff_prompt_Task_552_YearComboboxMantineMigration.md` updated with
   a "Scope-expansion trail" section recording this exact finding-→-ruling-→-fix chain.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | Added optional `inputMode?: TextInputProps['inputMode']` + `onInputChange?: (raw: string) => void` props; desktop trigger `onChange` now does `if (!onInputChange) onChange('')` and calls `onInputChange?.(raw)`; desktop trigger gets `inputMode={inputMode}`; mobile sheet's own search field's `onChange` calls `onInputChange?.(raw)` when `variant === 'input'` and gets `inputMode={variant === 'input' ? inputMode : undefined}`; **+ desktop `Combobox.Options` gained `mah={220} style={{overflowY:'auto'}}`** (third finding, scope-expansion, see above) | STOP-and-ASK #1 Option A + owner-approved scope expansion |
| `src/components/shared/YearCombobox.tsx` | Swapped legacy `<Combobox variant="input">` for `<MantineCombobox variant="input">`; wrapped in the same width-bearing `<div className={cn('year-combobox', className)}>` (Task 551 recipe); `triggerWidth={{base:'100%',sm:'100%'}}`; `onInputChange={handleInputChange}` (unchanged sanitize/validate logic); `inputMode="numeric"`; `noResultsLabel={t('no_results')}` (new `useTranslations('common')` hook); `triggerAriaLabel`/`sheetTitle` reuse the call site's own localized `placeholder` (no new key needed — `variant="input"` doesn't render `triggerAriaLabel` visually anyway, per the primitive); `portal` kept in `Props` (documented no-op) but no longer destructured/forwarded | Task 552 scope — primitive swap, public API preserved |
| `src/stories/mantine/primitives/Combobox.stories.tsx` | Added a `NumericTypeaheadDemo` helper + a 9th demo block: `onInputChange` + `inputMode="numeric"`, typing a full valid year (2018–2026 range) live-commits it, mirroring `YearCombobox`'s contract | Primitive gained two props — story must demonstrate them |
| `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` | Added a second `describe` block, 3 assertions: (1) `onInputChange` present → fires with raw value AND `onChange` not called; (2) `onInputChange` absent → `onChange('')` still fires (byte-identical default); (3) `inputMode` reaches the desktop trigger input. Both the suppression rule and the `inputMode`-threading planted-violations verified to FAIL (see below) | Clause-15 regression coverage for the two new primitive props |
| `messages/{en,sq,uk,it}.json` | Added `storybook.mantine.combobox_numeric_placeholder` (4-locale parity) | Story block 9's placeholder — reusing `combobox_placeholder` ("Search city...") would have been semantically wrong for a year field |
| `docs/mantine-tailadmin-migration-tracker.md` | PHASE 2 section: struck `YearCombobox` done, added the Slice-2/both-STOP-and-ASK note | Tracker discipline |
| `docs/backlog.md` | Task 552 entry added/updated, including the third-finding fix | Backlog tidy rule |
| `tasks/Sprints/Sprint_41_kickoff_prompt_Task_552_YearComboboxMantineMigration.md` | Added a "Scope-expansion trail" section recording the third finding, owner ruling, and verification chain | Owner-required: document scope expansions in the kickoff itself |
| `src/stories/mantine/primitives/Select.stories.tsx` | Temporarily edited (80-item long-list block) to measure `MantineSelect`'s dropdown height, then reverted byte-identical | Measurement only — confirmed empty diff via `git diff --stat` |

No change to `YearComboboxField.tsx`, `StepDetails.tsx`, `FiltersPanel.tsx`, `ListingsFilters.tsx`,
any shared token/semantic array, `globals.css`, the legacy `Combobox.tsx`, or any of ITS other
consumers (`LocationCombobox`, `PhoneField`, `Header`, admin managers, `AuthSheet`, `ProfileTab`,
`SavedSearchesTab`, `ContactForm`, `ListingsFilterBar`, `ListingsSortBar`) — confirmed via
`git diff --stat` (empty on all four consumer files) and `grep -rl "@/components/shared/Combobox'" src`
(16 files, none of them `YearCombobox.tsx`/`PropertyTypeCombobox.tsx`).

## Planted-violation proofs (primitive smoke tests)

**Suppression rule** (owner-flagged as load-bearing): temporarily reverted
`if (!onInputChange) onChange('')` → `onChange('')` (always). Result:

```
 × onInputChange present: fires with the raw typed value AND suppresses the internal onChange("") on keystroke
   → expected "vi.fn()" to not be called at all, but actually been called 1 times
     1st vi.fn() call: [ "" ]
 ✓ onInputChange absent: on-type behavior is byte-identical to today …
 ✓ inputMode reaches the desktop trigger input
 Tests  1 failed | 4 passed (5)
```

Reverted; green again.

**`inputMode` threading** (owner-flagged: "must thread to both inputs … otherwise the numeric
keypad is lost on mobile, which is half the point"): temporarily removed `inputMode={inputMode}`
from the desktop trigger. Result:

```
 × inputMode reaches the desktop trigger input
   → expected null to be 'numeric'
 Tests  1 failed | 4 passed (5)
```

Reverted; all 6 primitive smoke tests green again (see Gates below).

**Desktop options scroll cap** (the third finding's fix): temporarily removed
`mah={220} style={{overflowY:'auto'}}` from `Combobox.Options`. Result:

```
 × caps Combobox.Options at 220px with overflow-y:auto, matching MantineSelect
   → expected '--combobox-option-fz: var(--mantine-f…' to contain 'max-height'
 Tests  1 failed | 5 passed (6)
```

Reverted; all 6 primitive smoke tests green again (see Gates below).

## Gates

- `tsc --noEmit` — clean, 0 errors.
- `npm run check:stories` — PASSED, 104 files checked, 0 violations; `storybook.mantine.*` parity 540 keys × 4 locales (was 539 before Task 551, 540 after this task's one new key). `Select.stories.tsx` measurement edit confirmed reverted byte-identical (`git diff --stat` empty).
- `npm run check:i18n` — PASSED, 2105 keys × 4 locales, parity intact.
- `npm run check:design-tokens -- --strict` — PASSED, 0 raw-value violations across 397 files (the `mah={220}` numeric value is a Mantine style-prop, not a raw CSS literal — matches the existing `mih="2.75rem"`-class exemption precedent, cited inline).
- `npm run check:mojibake` — PASSED, 0 artifacts in 1585 files.
- `npm run check:file-integrity` — PASSED, 12 changed files clean.
- `npx vitest run .../MantineCombobox.smoke.test.tsx` — 6/6 PASS (2 from Task 551 + 3 for STOP-and-ASK #1 + 1 for the scroll cap) + all three planted-violation transcripts above.
- Listing-form regression baseline (clause 15) — `createListing.smoke.test.ts` + `updateListing.smoke.test.ts` — 9/9 PASS after the migration (action contract untouched; before == after).
- `npm run screenshots:assert -- --mantine-only` — **462/480 PASS, 0 FAIL, 18 AMBIGUOUS, exit 0**
  (manifest: `.screenshots/rendered-assert/2026-07-05T20-40/manifest.json`), run AFTER the
  `mah={220}` cap fix. Byte-identical to the pre-fix run and to Task 550/551's baseline (same 480
  cells, same 18 pre-existing ambiguous-overlap/offscreen findings — `Combobox/Default` block-1
  city sample-data backdrop overlap on mobile-320/375/390 × 4 locales, `Drawer/Default`
  desktop-1024 backdrop overlap × 4 locales, `Tabs/Default` mobile-320 swipe-reachable offscreen
  tab × sq/it — none touch the new block-9 numeric-typeahead demo or the `Combobox.Options` cap
  fix). **Zero new FAIL, zero new AMBIGUOUS from either this task's primitive changes or the
  scope-expansion fix.**

## AC-by-AC self-audit

1. **`YearCombobox` renders via `MantineCombobox` (`variant="input"`, Calendar icon); legacy import
   gone; public API byte-identical.** `YearCombobox.tsx:7` imports `MantineCombobox` from
   `@/design-system/mantine/patterns`; no `@/components/shared/Combobox` import remains. `Props`
   interface (`value`/`onChange`/`placeholder`/`className`/`portal`) unchanged. **Positive flow**
   verified: all six render sites (`YearComboboxField.tsx:14`, `StepDetails.tsx:126`,
   `FiltersPanel.tsx:247,253`, `ListingsFilters.tsx:263,269`) compile unchanged against the same
   prop surface (empty diff, confirmed above).
2. **STOP-AND-ASK #1 resolved + implemented literally; `year_built` still commits; mobile `<640`
   full-width bottom sheet preserved.** See resolution above + both planted-violation transcripts.
   **Negative flow (a)/(b)/(e):** `handleInputChange`'s sanitize/validate logic
   (`YearCombobox.tsx:32-38`) is untouched — digits-only, ≤4 chars, range-checked, `onChange(undefined)`
   on out-of-range/empty — now wired through `onInputChange` instead of the legacy `Combobox`'s
   `onInputChange` prop, same function, same behavior.
3. **STOP-AND-ASK #2 resolved with the owner's pre-authorized default; both filter pairs proven
   un-clipped at desktop + `<640`.** See the rendered-proof section above (**Negative flow (f)**).
   This same proof pass surfaced the third finding (desktop `Combobox.Options` had no scroll cap) —
   flagged to the owner before fixing, then fixed and re-verified per the owner's explicit ruling
   (see "Third finding" section above).
4. **`noResultsLabel`/`triggerAriaLabel`/`sheetTitle` from i18n, zero hardcode.**
   `YearCombobox.tsx` passes `t('no_results')` (`common` namespace, present in all 4 locales,
   reused from Task 551, unchanged); `triggerAriaLabel`/`sheetTitle` reuse each call site's own
   already-localized `placeholder` string (`listing.year_built_placeholder` / `common.year_from` /
   `common.year_to` — all pre-existing, full sq/en/uk/it parity, `check:i18n` confirms unchanged
   2105-key parity aside from the one NEW story-only key).
5. **All six consumers unchanged; no shared token/semantic array/`globals.css` change; legacy
   `Combobox.tsx` and its other consumers untouched.** See Files Changed + grep above
   (**Negative flow (g)**).
6. **Rendered `--assert` matrix + planted-violation transcripts; light gates green; listing
   baseline green before+after; new primitive smokes green.** See Gates section.
7. **Session log: Files-Changed table, AC self-audit citing both flows, `Self-validation:` line.
   No git run.** This document. No `git add`/`git commit` executed.

## Negative flow coverage

- **(a)** N/A (years ≤4 chars) — confirmed no clip/overflow at 320 in the rendered proof; numeric
  keypad appears on mobile via `inputMode="numeric"` (planted-violation-proven wiring).
- **(b)** out-of-range/non-numeric (`1700`, `abcd`, `20255`) → `handleInputChange` sanitizes to
  ≤4 digits and range-checks against `MIN_PROPERTY_YEAR…MAX_YEAR`, calling `onChange(undefined)`
  when invalid — unchanged function, now reached via the primitive's `onInputChange` callback.
- **(c)** dismiss without selecting — `MantineCombobox`'s own close handling (`onBlur`/backdrop/Esc)
  is untouched by this task.
- **(d)** re-open after prior selection — `sheetSearch`/`search` reset effects
  (`MantineCombobox.tsx`) untouched by this task.
- **(e)** clearing (deleting all digits) → `handleInputChange('')` → `onChange(undefined)` for all
  six adapters (`v => onChange({ year_built: v })`, `v => update({ year_built_min: v })`,
  `v => updateParams({ year_built_min: v != null ? String(v) : null })`, etc.) — none of these
  adapter functions were touched (empty diff on all four consumer files).
- **(f)** portal/clip — see rendered proof above.
- **(g)** regression — see AC 5 above.

## Self-validation

Self-validation: both STOP-and-ASKs were resolved before implementation — #1 with the owner
(Option A, with the suppression rule and `inputMode` dual-threading both proven via
planted-violation, exactly as the owner required before closing), #2 against the orchestrator's
pre-authorized default, confirmed (not assumed) via live rendered proof on both real filter
surfaces at desktop and mobile showing zero clipping. That same proof pass surfaced a third,
unanticipated primitive gap (desktop `Combobox.Options` had no scroll cap) — flagged to the owner
before touching anything, then fixed per the owner's explicit ruling: cited to the canonical
sibling `MantineSelect` (empirically measured at 220px via a rendered proof, temporary
measurement-only story edit reverted byte-identical), NOT the legacy component, re-verified
side-by-side against the live `YearCombobox`, and recorded in the kickoff file's own
scope-expansion trail. `YearCombobox`'s public API and all six consumers are unchanged (empty
diff). One new i18n key was needed for a story-only demo caption (product code needed zero new
keys, reusing existing `common.no_results`/`year_from`/`year_to`/`listing.year_built_placeholder`).
All six light gates, six primitive smoke tests (three planted-violations confirmed), and the
listing-form regression baseline are green. Git was not run — HELD for the orchestrator's diff
review and commit emission.
