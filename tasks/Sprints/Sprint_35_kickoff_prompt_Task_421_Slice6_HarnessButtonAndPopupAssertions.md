# Sprint 35 — Task 421 (Slice 6) — Kickoff Prompt for Sonnet 4.6

> Single source of truth for this task. Read this file directly; do not work from chat paraphrase.
> Single-writer git: do NOT run `git add` / `git commit`. Produce a "Files Changed" table; the
> orchestrator emits explicit-path commit commands at review.

---

### Task 421 — Add machine assertions (d) button-full-width + (e) popup-bottom-sheet to the rendered Storybook harness, with the minimal Button marker and open-state overlay stories needed to make them bite

Type:        feature (governance harness) + tiny primitive marker
Priority:    high
Area:        `scripts/check-stories-rendered.mjs` (rendered harness) · `src/components/ui/button.tsx` (inert marker only) · `src/stories/*` (minimal open-state overlay stories) · docs

Pre-read (mandatory before any code change):
1. `docs/agent-contract.md` (clauses 1–14; clause 11 = mobile <640 full-width + bottom-sheet; clause 13 = enforceable Storybook gate; clause 14 = file-integrity).
2. `docs/backlog.md`.
3. From `docs/rule-index.md`:
   - **Storybook / visual snapshot task** → `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/design-system.md §27`.
   - **Responsive/global-inventory task** → `docs/responsive-screenshot-governance.md` (§MQ), `docs/responsive-screenshot-matrix.md`, `docs/responsive-storybook-inventory.md`.
4. `docs/design-system.md` **§26** (full read — §26.1 full-width controls, §26.2 popup bottom-sheet contract, §26.3 map-marker exemption, §26.4 icon-only exemptions, §26.6 owner-approved overlay exceptions) and **§27.3** (the two machine-detection gaps this task closes).
5. Inspect `package.json` for the current validation scripts (`screenshots:assert`, `build-storybook`, `check:stories`, `check:i18n`, `check:story-coverage`, `check:design-tokens`, `lint`).
6. Read the current harness in full: `scripts/check-stories-rendered.mjs` — assertions (a)(b)(c) at lines ~376–438, the `ASSERT_STORIES` list (lines ~84–135), `FULL_WIDTH_TOLERANCE`, `VIEWPORTS_FULL`/`LOCALES`, and the per-cell `captureCell` flow.

Localization coverage:
- **No new user-facing strings.** The harness is non-UI; the Button marker is inert; new overlay stories MUST reuse the existing `storyT`/`useTranslations` fixtures and existing `messages/*.json` keys (sq/en/uk/it) — NO raw string literals, NO new keys, NO `/Ukrainian/` export, NO `globals:{locale}` pin (clause 13). If an overlay story needs a label that has no existing key, **STOP & ASK** — do not hardcode.
- All four locales (sq/en/uk/it) must still pass the full `screenshots:assert` matrix.

Responsive coverage:
- This task IS the responsive proof layer: the full canonical 14-viewport × 4-locale matrix in `VIEWPORTS_FULL`. uk@320/375/390 mandatory. The new assertions are evaluated only at `viewport.width < 640`.

---

## Owner decisions already made (2026-06-12) — implement exactly, do not re-litigate

**Decision A — Button icon-only marker (fork 1).** Add `data-icon-only` to the canonical Button
primitive (`src/components/ui/button.tsx`) as an **inert DOM/testability marker only**:
- Emitted automatically for icon-only sizes/variants (`size` ∈ `icon`, `icon-xl`, `icon-lg`, `icon-sm`, `icon-xs`); consumers pass nothing.
- It is the ONLY change to `button.tsx`. Do **not** change Button classes, sizing, variants, layout, behavior, accessibility, focus, or any consumer. It must be visually and class-wise inert.
- Harness assertion (d) selects `[data-slot="button"]:not([data-icon-only])`.
- Prove inertness: focused `Primitives/Button` story render is byte-for-byte visually unchanged (the diff adds an attribute, not a class) + full `screenshots:assert` stays green.
- Allowed scope expansion for the marker: `src/components/ui/button.tsx` ONLY. No consumer refactor, no product UI redesign.

**Decision B — Open-state overlay stories (fork 2).** Slice 6 includes the **minimal** open-state
Storybook targets required for assertion (e). A harness DOM check is meaningless if no overlay is
open in the rendered story (it would create a green gate that catches nothing).
- Add only minimal `open` / `defaultOpen` stories for the overlay primitives intended to be machine-checked (see §"Open-state stories to add" below).
- Register those specific open-state story IDs in `ASSERT_STORIES`.
- Add DOM assertion (e) only against those open overlay targets (plus any other overlay that happens to be open in an existing story).
- Do NOT redesign overlay primitives in this task. **If assertion (e) fails on an existing primitive: STOP with a focused failure report, or split a separate fix task — UNLESS the fix is tiny and clearly inside the primitive's existing §26.2 contract** (in which case document it explicitly). No product/admin surface refactors, no unrelated story cleanup.
- Report the **new matrix cell count** clearly (`(45 + N) × 14 × 4`).

---

## Current behavior to preserve (verify in the diff)

- **The three existing assertions stay intact and still gate:** (a) no horizontal overflow at the viewport; (b) `SelectTrigger`/`TabsList`/form-`input` full-width at <640; (c) render-failure detection (error screen / blank canvas = FAIL). Do not weaken, reorder, or change their thresholds.
- **`ASSERT_STORIES` existing 45 entries remain** — you only ADD open-state IDs; you do not remove or rename existing ones.
- **`VIEWPORTS_FULL` (14) and `LOCALES` (4) are unchanged.** `FULL_WIDTH_TOLERANCE` reused (do not loosen it to make a check pass).
- **`Button` primitive:** all sizes/variants/classes/a11y unchanged except the added inert `data-icon-only` attribute.
- **§26.6 owner-approved overlay exceptions are NOT defects and MUST be skipped by assertion (e):**
  - `AdminSidebar` left-nav drawer — `[data-slot="sheet-content"][data-side="left"]` (left-anchored persistent app-chrome drawer). Assertion (e) MUST skip `data-side="left"` sheets.
  - `ListingGallery` fullscreen lightbox (`fixed inset-0`, not a popup data-slot) — not matched by (e)'s selectors; do not add it.
  - These two are exhaustive per Task 414; any OTHER overlay remains bound by §26.2.
- **Map-marker popups (§26.3)** — not Storybook surfaces; not in scope. If encountered, STOP & ASK.

---

## Bug / Goal

`docs/design-system.md §27.3` documents two machine-detection gaps that `screenshots:assert`
currently does NOT catch, leaving them to fragile manual QA:

1. **Button not full-width at <640** — assertion (b) explicitly excludes buttons ("too many edge-cases"), so a text button that fails §26.1 ships green.
2. **Popup bottom-sheet non-compliance** — there is no DOM check that an open overlay at <640 is bottom-anchored + edge-to-edge per §26.2; a centered-card / mini-dropdown popup ships green.

Close both gaps by adding real machine assertions (d) and (e), plus the minimal Button marker and
open-state overlay stories that make them actually bite. After this task, `screenshots:assert`
machine-enforces §26.1 (text buttons) and §26.2 (popup bottom-sheet) — no longer "OWNER QA REQUIRED".

---

## Required after behavior

On `npm run screenshots:assert` (full mode, built Storybook):

1. **Assertion (d) — text-button full-width at <640.** For every cell with `viewport.width < 640`, every visible `[data-slot="button"]:not([data-icon-only])` that is NOT excluded by the **narrow** skip-list in **Addendum §2** (icon-only, `[data-slot="button-group"]` members, non-text overlay chrome/close controls, documented §26.6 exceptions) MUST have `offsetWidth >= parentContentWidth - FULL_WIDTH_TOLERANCE`. **Text CTA/action buttons INSIDE a mobile dialog/sheet/popover/dropdown/select ARE checked — do NOT blanket-skip overlay buttons.** A non-full-width text button fails the cell with a clear `✗ text button not full-width at <640` message + the offending button's text/label in the manifest.
2. **Assertion (e) — open popup = bottom-anchored full-width at <640.** For every cell with `viewport.width < 640`, every VISIBLE open overlay content slot (`dialog-content`, `sheet-content` *except* `data-side="left"`, `select-content`, `popover-content`, `dropdown-menu-content`, `navigation-menu-content`, command popup) MUST be (i) **edge-to-edge** — bounding-rect width ≥ viewport width − TOLERANCE, `left ≈ 0`, `right ≈ viewportWidth` (no `max-w-*` leak); and (ii) **bottom-anchored** — bounding-rect `bottom ≈ viewportHeight` within TOLERANCE. A centered-card / anchored / non-edge-to-edge popup fails the cell with `✗ popup not bottom-sheet at <640` + the slot name in the manifest.
3. Both new assertions are recorded in each cell's `assertions` object in `manifest.json` (e.g. `fullWidthButtonsAtMobile`, `popupBottomSheetAtMobile`) — `true`/`false`/`null` (null when ≥640 or no target present), parallel to the existing `fullWidthControlsAtMobile`.
4. The cell `pass` boolean now also requires `(viewport.width >= 640 || (fullWidthButtonsOk && popupBottomSheetOk))`.
5. The header docblock (lines ~7–14) and §27.3 of `docs/design-system.md` are updated to move the "Button not full-width" and "Popup bottom-sheet non-compliance" rows from "does NOT detect" to "machine-checked".
6. `npm run screenshots:assert` exits 0 on the current (already §26-compliant) codebase, with the new matrix cell count reported.

---

## Open-state stories to add (minimal — Decision B)

Add minimal open-state stories ONLY for the overlay primitives to be machine-checked, reusing
existing fixtures (no hardcode, no `/Ukrainian/`, no `layout:'centered'`, global `withCanvas` +
`layout:'fullscreen'`). Suggested set (confirm exact `id`s after `build-storybook`, then register):

- `Primitives/Dialog` → an `Open` story (`open` / `defaultOpen`) so `dialog-content` is in the DOM.
- `Primitives/Select` → an open story rendering `select-content`.
- `Primitives/Popover` → an open story rendering `popover-content`.
- `Primitives/DropdownMenu` → an open story rendering `dropdown-menu-content`.
- `Primitives/NavigationMenu` → an open story rendering `navigation-menu-content`.
- `Primitives/Sheet` → an open **bottom** sheet story (`side="bottom"`) rendering `sheet-content`. (The existing `sheet--filter-sheet-right` stays as-is; if it renders a `side="right"` sheet open at <640 and assertion (e) would bite it, classify per §26.2/§26.6 and **STOP & ASK** rather than guess — do not silently exempt it.)
- `Primitives/Command` → register only an actual overlay/popup Command story if one exists or can be minimally added without app-runtime scaffolding. Do NOT register `command--inline` as a popup-bottom-sheet target if it is inline-only; document that classification in the session log (per Addendum §3).

Register the resulting open-state story IDs in `ASSERT_STORIES` (append; keep existing entries).
If any overlay cannot be rendered open in Storybook without a router/provider it lacks, **STOP & ASK**
— do not add app-runtime scaffolding speculatively.

---

## Required investigation

1. Read `scripts/check-stories-rendered.mjs` assertions (a)(b)(c) and mirror their reliability technique (parent-content-width helper, visibility/`offsetWidth<=1` skip, overlay skip) for (d).
2. Inspect `src/components/ui/button.tsx` `buttonVariants` `size` map to enumerate the icon-only sizes that must emit `data-icon-only`.
3. Inspect each overlay primitive's `data-slot` and any `data-side` attribute: `dialog.tsx`, `sheet.tsx`, `select.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `navigation-menu.tsx`, `command.tsx` — confirm the selectors (e) will use and confirm the `data-side="left"` skip for `AdminSidebar`.
4. `npm run build-storybook` then list the generated story IDs to confirm the exact open-state IDs before registering them.
5. Determine, by running the full matrix once with (d)+(e) added, whether any EXISTING ASSERT_STORIES cell now fails. Classify every new failure as: real §26.1/§26.2 violation (→ STOP & report / open follow-up fix task; do NOT fix product code here beyond `button.tsx`) OR a legitimate documented exemption (→ explicit skip in the harness + justification in the session log). **The final harness run MUST be green only in the Addendum §1 happy path. If a real existing §26.1/§26.2 violation is exposed, stop with the Addendum §1 focused failure report instead of forcing green.**

---

## Positive flow (happy path)

- **Actor:** CI / owner running `npm run screenshots:assert` (full mode) against built Storybook on the current §26-compliant codebase.
- **Preconditions:** `storybook-static/` built; Playwright chromium installed.
- **Steps & system responses:**
  1. Harness boots, serves `storybook-static/`, iterates `ASSERT_STORIES` (now `45 + N`) × 14 viewports × 4 locales.
  2. For each `<640` cell it runs (a)(b)(c) AND new (d)(e).
  3. (d): every text button fills its parent content width → `fullWidthButtonsAtMobile = true`.
  4. (e): every open overlay (Dialog/Select/Popover/DropdownMenu/NavigationMenu/Sheet-bottom/Command) is edge-to-edge + bottom-anchored → `popupBottomSheetAtMobile = true`.
  5. icon-only buttons (`data-icon-only`), `data-side="left"` sheet, and `button-group` members are correctly skipped.
- **Success state:** `Results: <total>/<total> PASS, 0 FAIL`, exit 0; `manifest.json` records `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` per cell; new matrix count printed.
- **Post-conditions:** harness docblock + `design-system.md §27.3` updated; `backlog.md` + session log updated; "Files Changed" table present.

## Negative flow (every off-happy-path branch)

For EACH branch the diff must contain a verifiable handler/guard, and the session log must show the
gate biting (negative proof):

- **Planted non-full-width button (proves (d) bites):** temporarily render a `w-auto`/content-width text button in a throwaway fixture/story at <640 → assertion (d) → cell `fullWidthButtonsAtMobile=false`, cell FAIL, message `✗ text button not full-width at <640` + button label in manifest, exit 1. Revert the plant; capture the transcript in the session log.
- **Planted centered-card popup (proves (e) bites):** temporarily force an open overlay to a centered `max-w-sm` card at <640 (e.g. a local class override in a throwaway story) → assertion (e) → `popupBottomSheetAtMobile=false`, cell FAIL, message `✗ popup not bottom-sheet at <640` + slot name, exit 1. Revert; capture transcript.
- **Icon-only button:** an icon-only button (`data-icon-only`) at <640 is SKIPPED by (d) (not flagged) — verify with a cell containing `Button size="icon"`.
- **§26.6 left-drawer:** `AdminSidebar` open `data-side="left"` sheet at <640 is SKIPPED by (e) (not flagged) — verify against `admin-adminsidebar--mobile-drawer-open`.
- **No overlay open in a cell:** `popupBottomSheetAtMobile = null`, cell not failed on (e) (vacuous pass) — verify against a non-overlay story (e.g. `Badge/Default`).
- **≥640 viewport:** (d) and (e) both `null` (desktop popup/anchor behavior intact) — verify at 1440.
- **Render failure in an open-state story (clause 27.4):** if a new open-state story renders a Storybook error boundary / blank canvas, assertion (c) FAILs the cell (an error PNG is never proof). Fix the story setup, not the gate.
- **Existing primitive regression surfaced by (d)/(e):** STOP, write a focused failure report, and either split a fix task or (only if tiny + clearly within §26.2) document the in-primitive fix. Do NOT silently add a skip to hide a real violation.

---

## Mobile <640 full-width gate (OWNER P0 — clause 11 / §26)

This task is the **enforcement layer** for the gate, so it must embody it precisely:
- Assertion (d) enforces §26.1 for **text** buttons (`max-sm:w-full`); icon-only sizes are the ONLY exemption (§26.4), detected via the new inert `data-icon-only` and skipped — list them in the session log.
- Assertion (e) enforces §26.2 (all popups = full-width bottom sheet at <640: bottom-anchored, edge-to-edge, no `max-w-*` leak), with the two §26.6 owner-approved exceptions (`AdminSidebar` left drawer, `ListingGallery` lightbox) skipped/not-matched.
- Both assertions run at every `<640` viewport × all four locales (uk@320/375/390 mandatory). Labels inside new open-state stories must wrap (`whitespace-normal break-words`), never clip; no horizontal scroll at 320 (assertion (a) still guards this).
- The new open-state overlay stories MUST themselves render full-width bottom sheets at <640 (they are the proof targets). If a primitive does NOT render as a bottom sheet at <640, that is a real §26.2 defect → STOP & report (do not weaken (e) to pass it).

---

## Addendum — ambiguity guards before implementation (owner, 2026-06-12) — BINDING

1. **Final green rule.** `screenshots:assert` must be green ONLY if the newly added assertions do not expose a real existing §26.1/§26.2 violation. If a real existing violation is exposed, do NOT hide it with a skip and do NOT expand product/UI scope. Acceptable final state in that branch: focused failure report (exact failing story / viewport / locale / slot / button), a proposed follow-up fix task, and all temporary negative-test plants reverted. (Resolves the apparent "STOP & report" vs "final green" conflict — green is required only on an already-compliant codebase.)

2. **Button-in-overlay rule.** Do NOT broadly skip all `[data-slot="button"]` elements inside overlays. Skip only: `[data-icon-only]`; buttons inside `[data-slot="button-group"]`; overlay chrome/close controls when they are NOT canonical text action buttons; targets explicitly documented as §26.6 exceptions. **Text CTA/action buttons inside a mobile dialog / sheet / popover / dropdown / select content remain subject to §26.1** unless the docs explicitly exempt them.

3. **Command rule.** `Command` is checked by the popup-bottom-sheet assertion (e) ONLY when it is rendered as an overlay/popup surface. An inline `Command` surface in normal document flow must NOT be forced to satisfy bottom-sheet geometry. If the existing `command--inline` story is inline-only, do NOT register it as a popup-bottom-sheet target; document the classification in the session log. (So (e)'s selector must distinguish an open overlay command popup from an inline command — match the popup/positioner wrapper, not a bare inline `command` surface.)

4. **`data-icon-only` DOM rule.** The attribute must be present ONLY for icon-only sizes (`icon`, `icon-xl`, `icon-lg`, `icon-sm`, `icon-xs`). For every non-icon size the attribute must be **absent** from the DOM, not present with `"false"`. Recommended shape: `data-icon-only={isIconOnly ? "" : undefined}` (or equivalent that omits the attribute entirely) — never `data-icon-only={false}`, which can serialize/leak as a present attribute and defeat the `:not([data-icon-only])` selector.

5. **Negative-test hygiene.** Temporary planted failure code / stories / classes must NOT remain in the final diff. The session log must include BOTH the failing transcript (gate bites) AND the post-revert green/expected transcript.

## Acceptance criteria

- **AC1 (Positive step 1–2):** `screenshots:assert` runs `(45+N)×14×4` cells; existing assertions (a)(b)(c) unchanged and still gating. Verifiable: diff of `runAssert`/`captureCell` + printed count.
- **AC2 (Positive step 3, (d)):** `[data-slot="button"]:not([data-icon-only])` full-width check implemented at `<640` with parent-content-width + the **Addendum §2 narrow** skip-list (NOT a blanket overlay skip — text action buttons inside overlays are checked); `fullWidthButtonsAtMobile` recorded per cell. Verifiable at file:line.
- **AC3 (Positive step 4, (e)):** open-overlay bottom-sheet check (edge-to-edge + bottom-anchored) implemented at `<640`, skipping `data-side="left"`; `popupBottomSheetAtMobile` recorded per cell. Verifiable at file:line.
- **AC4 (Decision A):** `data-icon-only` emitted by `button.tsx` for icon sizes only; inert (no class/behavior/a11y change); `Primitives/Button` render unchanged. Verifiable in diff + screenshot.
- **AC5 (Decision B):** minimal open-state overlay stories added (no hardcode, no `/Ukrainian/`, no `layout:'centered'`), exact IDs registered in `ASSERT_STORIES`. Verifiable in diff + `check:stories` PASS.
- **AC6 (cell pass):** `cell.pass` includes the two new assertions for `<640`. Verifiable at file:line.
- **AC7 (Negative — (d) bites):** transcript showing a planted non-full-width button FAILs + exit 1, then reverted. In session log.
- **AC8 (Negative — (e) bites):** transcript showing a planted centered-card popup FAILs + exit 1, then reverted. In session log.
- **AC9 (Negative — skips):** icon-only button, `data-side="left"` sheet, and no-overlay cells are NOT falsely failed; ≥640 cells → both new assertions `null`. In session log.
- **AC10 (docs):** harness docblock + `design-system.md §27.3` updated (two gap rows → machine-checked). Verifiable in diff.
- **AC11 (green gate — per Addendum §1):** full `screenshots:assert` exits 0 with the new cell count reported **only if the new assertions expose NO real existing §26.1/§26.2 violation**. If a real violation IS exposed, the acceptable final state is a focused failure report (exact story/viewport/locale/slot/button) + a proposed follow-up fix task + all temporary negative-test plants reverted — NOT a silent skip and NOT product/UI scope expansion. A green run achieved by hiding a real violation is a TASK FAILURE.
- Existing working assertions/flows preserved; 0 new lint errors/warnings; `npx tsc --noEmit` → 0 errors; `npm run build-storybook`, `npm run check:stories`, `npm run check:i18n`, `npm run check:story-coverage`, `npm run check:design-tokens` all PASS.
- **Clause 14 file-integrity:** every touched file — 0 NUL bytes (`tr -cd '\000' < f | wc -c` = 0), no BOM, `.mjs` `node --check` OK, `.tsx` compiles; paste the green integrity transcript in the session log.
- `docs/backlog.md` updated; session log under `docs/sessions/` added with the Note 18 self-validation block and a **"Files Changed" table** (one row per touched path + 1-line rationale). Do NOT emit `git add`/`git commit` — the orchestrator emits them at review.

## Out of scope (do NOT touch)

- Any product/admin/listing UI surface, any component other than `src/components/ui/button.tsx` (and that ONLY for the inert marker).
- Redesigning any overlay primitive (`dialog/sheet/select/popover/dropdown-menu/navigation-menu/command`). If (e) exposes a real §26.2 defect, STOP & report or split a fix task — do not fix it here unless tiny + clearly within the existing §26.2 contract (and then document it).
- The §26.6 owner-approved exceptions (`AdminSidebar` left drawer, `ListingGallery` lightbox) — do not "fix" them into bottom sheets.
- Loosening `FULL_WIDTH_TOLERANCE` or any existing assertion to make a check pass.
- Unrelated story cleanup, drive-by refactors, new locales, new message keys.
- `git add` / `git commit` (single-writer rule).
```
