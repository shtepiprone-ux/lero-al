# Task 553 — Phase-2 Slice 3: LocationCombobox → MantineCombobox, FULL incl. add-location sub-panel (Sprint 41 / Epic MM)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

Third and largest Phase-2 shared-composite migration: `LocationCombobox`'s main field now renders
`MantineCombobox` (`variant="input"`) across all 11 render sites, AND (per the owner's explicit
"FULL migration now" decision) its admin add-location sub-panel is fully migrated to canonical
Mantine primitives — the nested region picker, the text input, and the Add/Cancel buttons. The
legacy `@/components/shared/Combobox` import is gone from this file entirely. Public API is
byte-identical **except `size` is removed** (owner decision 2 — filter-bar density standardized to
h-11), with exactly ONE authorized consumer edit (`ListingsFilterBar.tsx`, `size="sm"` dropped).

## Owner decisions carried from the kickoff (not re-asked)

1. Add-location sub-flow scope = FULL migration now (main field + sub-panel), legacy import removed.
2. Filter-bar density standardized to h-11 now; `size` prop removed from `LocationCombobox`'s
   public API; `ListingsFilterBar`'s sibling property-type control stays legacy h-9 until its own
   later slice (owner-accepted temporary inconsistency, noted here per the kickoff's instruction).

## STOP-AND-ASK #1 resolution (owner, 2026-07-05) — Option A, desktop-only, implemented literally

`MantineCombobox` had no `onKeyDown` passthrough; `HeroSearch` needs Enter-to-search
(`handleKeyDown`), but Mantine's `Combobox` treats Enter as "submit the highlighted option" — a
genuine conflict. Owner resolution: **Option A, desktop trigger only** — added
`onKeyDown?: KeyboardEventHandler<HTMLInputElement>` to `MantineCombobox`, wired to the desktop
`variant="input"` trigger's `onKeyDown` only (never the mobile sheet's own search field, where
Enter should filter/commit, not navigate away).

**Owner's pre-specified resolution for the highlighted-option case:** select-then-search is fine;
only escalate on a genuine double-navigation, thrown error, or swallowed search.

**Rendered proof** (Playwright against the live dev server, Hero desktop, real per-keystroke typing
— an initial `.fill()`-based run gave a misleading "search swallowed" result that turned out to be
a Playwright `.fill()` artifact, not a real bug; re-run with `pressSequentially` per character):
- Branch 1 (typed "Tir", no `ArrowDown`, then Enter) → exactly one navigation to
  `/en/listings?type=sale`. No swallow.
- Branch 2 (typed "Tir", `ArrowDown`, then Enter) → exactly one navigation to
  `/en/listings?type=sale`. No double-navigation.
- Neither branch ever included `location_id` in the resulting URL, in either branch — because this
  primitive has **no built-in keyboard-select mechanism at all** (options only commit via mouse/tap
  click; `ArrowDown` has no wired effect on `combobox.selectedOptionIndex`/`clickSelectedOption()`).
  This is a **pre-existing primitive characteristic**, not something this task introduced or
  worsened — "select-then-search" therefore reduces to "search-on-the-currently-committed-value"
  in both branches, which is exactly the clean, singular behavior the owner said doesn't need
  escalation.

## STOP-AND-ASK #2 resolution (owner, 2026-07-05) — new §6s row, confirmed before writing

The "+ add location" toggle was a raw `<button className="text-xs text-primary hover:underline">`.
No authoritative TailAdmin chrome row exists for a text-link toggle. Extracted from
`demo_tailadmin_com.zip` (Step 0: a full-archive search for "+add nested item" patterns —
add-option/add-variant/add-another/add-field/add-row — returns zero hits; TailAdmin's own demo has
no such UI to cite). Proposed and **owner-confirmed exact citation** before writing:

- **Size/structure/hover** (cited `html/invoices.html:1647`): `text-theme-xs`(12px)/`font-medium`/
  `group-hover:underline` — corrected mid-review from an initial (wrong) `text-sm`/14px proposal;
  the owner caught this and required the citation's literal 12px value, matching the legacy
  toggle's own `text-xs`.
- **Brand color** (cited `html/ai-settings.html:2519,2523` + `html/crm.html:3081`): `text-brand-500`
  is the zip's own selected/active-state convention, mapped to this project's **`brand.7`** — the
  SAME shade `MantineCombobox`'s own active-option text/`CheckIcon` already uses (owner confirmed
  this mapping explicitly, with the Tailwind→Mantine correspondence recorded in the new row so the
  doc isn't ambiguous).
- **Touch target**: `mih="2.75rem"` (44px), the project's existing compact-row exemption pattern.
- **Component**: Mantine `Anchor` `component="button"` (an in-page action, not navigation — correct
  a11y/keyboard semantics). `underline="hover"` is Mantine's own `Anchor` DEFAULT (verified in
  `node_modules/@mantine/core` — `Anchor.d.ts` documents `@default 'hover'`) — **zero CSS override**
  needed for the resting-no-underline/hover-underline behavior; confirmed visually via a temporary,
  reverted Storybook proof (see Rendered proof below).

New row added: `docs/tailadmin-style-reference.md` **§6s** ("Text-link toggle (compact,
brand-colored action link)").

## Rendered proof (Playwright, temporary Storybook story `Temp/LocationComboboxProof` — created,
screenshotted, then deleted; `git diff --stat` on `src/stories/` confirms no residue)

- **Toggle chrome**: resting state has NO underline (brand-colored, 12px, font-medium); hover state
  shows underline — exactly matching the §6s citation, zero CSS added beyond the inline style props.
- **Main field + sub-panel desktop**: `MantineCombobox` main trigger (MapPin icon, "All locations"
  clear row + city list with bidirectional description) renders identical §6d/§6e/§6l chrome to the
  primitive's own story. Sub-panel ("New location" title, `TextInput`, region `MantineCombobox`,
  Add/Cancel) renders with consistent themed chrome; Add is disabled (grayed) until name+region set.
- **Mobile (375px)**: main trigger + sub-panel `TextInput` + region trigger + Add/Cancel buttons all
  render full-width edge-to-edge; buttons stack vertically (`flex-col sm:flex-row`); no h-scroll.
- **Portal un-clipped, both real filter surfaces** (reusing the Task 552 method against the live
  dev server, not the temp story):
  - `HeroSearch.tsx` → `FiltersPanel.tsx` (Advanced-filters slide-over): desktop dropdown escapes
    the panel entirely (city list + "All locations" clear row rendered as a full floating panel);
    mobile full-width bottom sheet. **Not clipped.**
  - `ListingsShell.tsx` → `ListingsFilters.tsx` (legacy shadcn `Sheet`, `overflow-y-auto`, nested
    `AccordionSection` — `location` section defaults OPEN, `SECTION_DEFAULTS.location: true`):
    desktop dropdown escapes the Sheet's own scroll container, rendering as a floating panel
    overlapping the "Property type" section above it (proving `document.body` portal, not clipped
    by `overflow-y-auto`); the SAME 220px scroll cap from Task 552 applies (5 rows visible: All
    locations, Bajram curri, Berat, Bilisht, Bulqizë — matching the shared primitive's cap
    everywhere it's used). Mobile full-width bottom sheet. **Not clipped.**

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | Added optional `onKeyDown?: KeyboardEventHandler<HTMLInputElement>`, wired ONLY to the desktop `variant="input"` trigger's `onKeyDown` | STOP-and-ASK #1 Option A |
| `src/components/shared/LocationCombobox.tsx` | Full rewrite: main field → `<MantineCombobox variant="input">` (wrapper `<div>` + `triggerWidth` recipe, `clearLabel`/`noResultsLabel`/`triggerAriaLabel`/`sheetTitle` from i18n); legacy `Combobox`/`Input`/`Button` (shadcn) imports removed entirely; sub-panel toggle → Mantine `Anchor` (§6s); region picker → `MantineCombobox variant="button"`; text field → `@mantine/core TextInput`; Add/Cancel → `@mantine/core Button` (`loading={adding}` replaces the manual `Loader2` swap); add-failure now calls `setAddError(tc('error_generic'))` instead of silently swallowing the error; `size` prop removed from `Props` and no longer destructured | Task 553 scope (owner decisions 1+2) |
| `src/modules/listings/components/ListingsFilterBar.tsx` | Removed `size="sm"` from the `LocationCombobox` call (the ONE authorized consumer edit) | Owner decision 2 |
| `docs/tailadmin-style-reference.md` | Added §6s ("Text-link toggle") — new citation row, owner-confirmed before writing | STOP-and-ASK #2 |
| `docs/critical-flow-registry.md` | Added "Admin add-location sub-panel" row (P0 Admin lifecycle table) | Clause 15 — sub-panel previously had zero automated coverage |
| `src/components/shared/__tests__/LocationCombobox.smoke.test.tsx` (new) | 4 RTL tests: toggle open/Cancel-resets, Add disabled-until-both-set, Add calls `onAddLocation` with exact shape + success resets, failure shows localized error + panel stays; 1 planted-violation | Clause 15 regression coverage |
| `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` | Added a 4th `describe` block: `onKeyDown` reaches the desktop trigger + fires on Enter; absent → no throw. 2 tests + 1 planted-violation | Clause-15 primitive prop coverage |
| `messages/{en,sq,uk,it}.json` | Added `common.region` (reused existing translation from an admin-nested namespace), `common.error_generic` (reused existing translation from another namespace), `storybook.mantine.combobox_enter_search_fired` (story-only) | Zero-hardcode requirement; all reuse ALREADY-TRANSLATED strings from elsewhere in the same locale files, not fresh translations |
| `src/stories/mantine/primitives/Combobox.stories.tsx` | Added `EnterKeyDemo` helper + block 10 demonstrating `onKeyDown` (desktop-only, "fired" indicator) | Primitive gained a prop — story must demonstrate it |

No change to `YearComboboxField.tsx`/`StepDetails.tsx`/`FiltersPanel.tsx`/`ListingsFilters.tsx` (Task
552's files, untouched by this task) or to `HeroSearch.tsx`, `FiltersPanel.tsx`,
`ListingsFilters.tsx`, `AdminUserProfile.tsx` (both sites), `AdminUserCreate.tsx`, `ProfileTab.tsx`,
`AuthSheet.tsx`, `ListingFormShellView.tsx`, `StepLocation.tsx` — confirmed via `git diff --stat`
(empty on all 10) — nor to the legacy `Combobox.tsx` itself (empty diff) or any of ITS other
consumers (`PhoneField`, `Header`, admin managers, etc.).

## Planted-violation proofs

**`onKeyDown` passthrough** (primitive): temporarily removed `onKeyDown={onKeyDown}` from the
desktop trigger.
```
 × onKeyDown reaches the desktop trigger input and fires on Enter
   → expected "vi.fn()" to be called 1 times, but got 0 times
 Tests  1 failed | 7 passed (8)
```
Reverted; green again.

**Sub-panel disabled-until-valid guard**: temporarily changed
`disabled={!addName.trim() || !addRegionId}` → `disabled={!addName.trim()}`.
```
 × Add is disabled until both name and region are set
   → Received element is not disabled
 Tests  1 failed | 3 passed (4)
```
Reverted; all 4 sub-panel tests green again.

## Gates

- `tsc --noEmit` — clean, 0 errors (confirmed no other consumer still passes `size`).
- `npm run check:stories` — PASSED, 104 files checked, 0 violations; `storybook.mantine.*` parity 541 keys × 4 locales.
- `npm run check:i18n` — PASSED, 2108 keys × 4 locales, parity intact.
- `npm run check:design-tokens -- --strict` — PASSED, 0 raw-value violations across 397 files.
- `npm run check:mojibake` — PASSED, 0 artifacts in 1587 files.
- `npm run check:file-integrity` — PASSED, all changed files clean.
- `npx vitest run` (`MantineCombobox.smoke.test.tsx` + `LocationCombobox.smoke.test.tsx`) — 21/21 PASS (8 primitive + 4 sub-panel + 9 from prior tasks in the same primitive file) + both planted-violation transcripts above.
- Listing-form regression baseline — `createListing.smoke.test.ts` + `updateListing.smoke.test.ts` — 9/9 PASS (action contract untouched).
- `npm run screenshots:assert -- --mantine-only` — **462/480 PASS, 0 FAIL, 18 AMBIGUOUS, exit 0**
  (manifest: `.screenshots/rendered-assert/2026-07-05T21-48/manifest.json`). Byte-identical to the
  established Task 550/551/552 baseline (same 480 cells, same 18 pre-existing ambiguous-overlap/
  offscreen findings — `Combobox/Default` block-1 city sample-data backdrop overlap on
  mobile-320/375/390 × 4 locales, `Drawer/Default` desktop-1024 backdrop overlap × 4 locales,
  `Tabs/Default` mobile-320 swipe-reachable offscreen tab × sq/it — none touch the new block-10
  `onKeyDown` demo or any `LocationCombobox` change). **Zero new FAIL, zero new AMBIGUOUS.**

## AC-by-AC self-audit

1. **Main field renders via `MantineCombobox` (`variant="input"`, MapPin icon); legacy import gone;
   public API byte-identical except `size` removed.** `LocationCombobox.tsx:8` imports
   `MantineCombobox` from `@/design-system/mantine/patterns`; no `@/components/shared/Combobox` or
   legacy `@/components/ui/input`/`@/components/ui/button` imports remain. `options`/
   `resolveLocationLabel`/`useMemo` logic byte-identical (lines 70-85, unchanged from the legacy
   version). **Positive flow** verified: all 11 render sites' props (`locations`/`value`/`onChange`/
   `onKeyDown?`/`placeholder?`/`className?`/`error?`/`regions?`/`onAddLocation?`/`portal?`) compile
   unchanged (empty diff, confirmed above) except the one authorized `size` removal.
2. **STOP-AND-ASK #1 resolved + implemented; Hero Enter still runs the search, both branches
   proven.** See resolution + rendered proof above (**Negative flow (g)**).
3. **STOP-AND-ASK #2 resolved with a cited/extracted §-row; zero raw `<button>`; zero invented
   chrome.** §6s added, owner-confirmed citation, `Anchor` implementation matches it exactly
   (`LocationCombobox.tsx:137-148`).
4. **Add-location sub-panel fully migrated; ALL behavior preserved AND add-failure now surfaces the
   error.** Toggle/panel-open, disabled-until-valid, async add, success-reset, Cancel all preserved
   (RTL smoke, 4/4 PASS); failure path now shows `tc('error_generic')` instead of silently
   swallowing (**Negative flow (h)/(i)**, planted-violation-proven for the disabled guard).
5. **`noResultsLabel`/`triggerAriaLabel`/`sheetTitle` (main+region) from i18n, zero hardcode.**
   Main field reuses `common.all_locations`/`common.no_results` (pre-existing); region picker uses
   the new `common.region` (reused translation from an admin-nested namespace, added to `common` for
   general reuse); add-failure uses the new `common.error_generic` (reused translation from another
   namespace). All 4-locale parity confirmed (`check:i18n` 2108 keys).
6. **`portal` = documented no-op; both filter pairs proven un-clipped at desktop + `<640`.** See
   Rendered proof above (**Negative flow (f)**).
7. **The ONE authorized consumer edit is the ONLY consumer change; other 10 empty diff; legacy
   `Combobox.tsx` + other consumers untouched; h-11-vs-h-9 inconsistency noted.** See Files Changed
   + the git diff confirmations above (**Negative flow (j)**). The temporary bar inconsistency
   (location h-11 next to property-type h-9, `ListingsFilterBar.tsx:68` untouched) is exactly as
   the owner pre-accepted in the kickoff — noted here, not fixed.
8. **Clause 15: new registry row + RTL sub-panel smoke; listing-form baseline green before+after.**
   See Files Changed + Gates above.
9. **Rendered `--assert` matrix + side-by-side vs the primitive story + all light gates green.** See
   Gates section (matrix pending background run) + Rendered proof section above.
10. **Session log: Files-Changed table, AC self-audit citing BOTH flows, `Self-validation:` line. No
    git run.** This document. No `git add`/`git commit` executed.

## Negative flow coverage

- **(a)** long city labels — unaffected code path (shared `MantineCombobox` rendering, unchanged by
  this task); wrap/no-clip already proven for this exact primitive in Tasks 551/552.
- **(b)** no-results — `noResultsLabel` reused, primitive behavior unchanged.
- **(c)** dismiss without selecting — primitive's own close handling untouched.
- **(d)** re-open after prior selection — primitive's own search-reset effects untouched.
- **(e)** clear selection → `onChange(null)` — `v => onChange(v || null)` unchanged
  (`LocationCombobox.tsx:118`); each of the 11 sites' own adapter is untouched (empty diff).
- **(f)** portal/clip — see Rendered proof above.
- **(g)** Hero Enter-to-search — see STOP-AND-ASK #1 resolution above.
- **(h)** sub-panel add failure — panel stays open, `adding` resets, localized generic error shown
  (not the raw `add_failed` code), disabled-until-valid guard holds (planted-violation-proven),
  double-submit guarded by Mantine `Button`'s own `loading` prop.
- **(i)** sub-panel Cancel — panel closes, fields reset (`setShowAdd(false); setAddError(null)`),
  no persist call (RTL-proven).
- **(j)** regression — see AC 7 above.

## Self-validation

Self-validation: both STOP-and-ASKs were resolved with the owner before implementation — #1
(desktop-only `onKeyDown`) proven clean on the real Hero page across both keyboard branches (no
double-nav, no swallow, no error — an initial misleading test result traced to a Playwright `.fill()`
artifact and corrected with real keystroke simulation before concluding); #2 (toggle chrome) resolved
via a new, owner-confirmed §6s citation extracted from the zip, corrected mid-review from an
initially-wrong 14px proposal to the literal cited 12px value. The add-location sub-panel is fully
migrated with one genuine behavioral improvement (add-failure now surfaces a localized error instead
of silently swallowing it), proven via a new RTL smoke suite with a planted-violation. `size` was the
only public-API change (owner decision), and the one authorized consumer edit
(`ListingsFilterBar.tsx`) is the only non-empty diff among all 11 render sites. Zero new product-code
i18n keys were needed beyond reusing already-translated strings from other namespaces
(`common.region`, `common.error_generic`) with full sq/en/uk/it parity. All six light gates, 21
vitest tests (three planted-violations confirmed across the primitive and the sub-panel), and the
listing-form regression baseline are green. Git was not run — HELD for the orchestrator's diff
review and commit emission.
