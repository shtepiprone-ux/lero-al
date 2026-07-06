# Task 555 — Fix LocationCombobox main-field icon/text overlap (D1) + missing region placeholder (D2) (Sprint 41 / Epic MM Phase-2)

**Type:** UI / component-fix (product code). **Executor:** Sonnet 4.6.
**Origin:** Owner-caught render defects on the Task 553/554 rendered screenshots (orchestrator review, 2026-07-06).
The Task 554 geometry matrix reported 478/496 PASS while the field was visibly broken — see the new IRON RULE
`docs/mantine-responsive-design-system.md §18.9`. This task fixes both product defects AND proves internal spacing
per §18.9 (the geometry gate alone does NOT close this task).

## The two defects (both visible at 320/375/480/1280 × EN+UK in the Task 554 screenshots)

- **D1 — main-field icon/text overlap.** `LocationCombobox` (`src/components/shared/LocationCombobox.tsx:115–129`)
  renders `MantineCombobox variant="input"` with `icon={<MapPin className="h-4 w-4" />}`, passed through as
  `leftSection` (`MantineCombobox.tsx:241`). The rendered placeholder/value text is NOT clearing the icon — it reads
  "◉ll cities" / "◉сі міста" with the first character occluded by the pin. There must be a **visible gap** between
  the icon and the text.
- **D2 — region picker has no placeholder.** The add-location sub-panel's region `MantineCombobox variant="button"`
  (`LocationCombobox.tsx:158–167`) is passed `triggerAriaLabel` + `sheetTitle` but **no `placeholder`**, so it
  renders as an empty box with only a chevron — no hint what it is.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses 1–16; esp. 7, 11, 12, 16) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (the Task-553 "Admin add-location sub-panel" row already exists — update its coverage, do not duplicate).
- 🔴 `docs/mantine-responsive-design-system.md` — **§18.9 (the new IRON RULE — read FIRST)** + §18.1–§18.6
  (theming/CSS pitfalls; `input-chrome.css` guarded-padding mechanism) + §18.2 (stable class names).
- 🔴 `docs/tailadmin-style-reference.md` §6d/§6e (field chrome) + §6s (the toggle) + §6l (item chrome).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Root-cause D1 FIRST in DevTools — do NOT guess (§18.6 discipline)

Before changing anything, confirm the actual cause in the running app at `uk@320` (DevTools):
- Is `data-with-left-section` present on the main-field `.mantine-TextInput-input`? Is `--input-left-section-width`
  set, and does the input's computed `padding-inline-start` actually reserve it?
- Which rule wins the cascade for `padding-inline-start` on that element — Mantine's section reservation, the guarded
  `input-chrome.css:116` rule (`:not([data-with-left-section])` — should EXCLUDE this element), a `theme.ts`
  `styles.input`, or an unguarded shorthand? Paste the winning declaration + its source into the session log.
- **Fix at the CANONICAL source, not a one-off** (Note 14 global-change rule): the fix belongs in `MantineCombobox`
  and/or `input-chrome.css` so EVERY current/future icon-bearing `variant="input"` consumer is correct — NOT a
  bespoke class on `LocationCombobox` only. If the cause is an unconditional padding rule, add the missing
  `:not([data-with-…-section])` guard (per §18.9 rule 1). If the `leftSection` default width is simply too tight for
  a comfortable gap, widen the reservation via the supported Mantine API — document the exact §-cited value.
- **Regression sweep:** grep every consumer that passes `icon`/`leftSection` to `MantineCombobox`/`TextInput`/`Select`
  and confirm the fix does not push their text too far or break a non-icon trigger. List them before/after.

## D2 fix

Pass a `placeholder` to the region `MantineCombobox` (`LocationCombobox.tsx:158–167`). Reuse the EXISTING
4-locale key `common.region` (already used for `triggerAriaLabel`/`sheetTitle`) as the placeholder — **zero new keys**,
matches the aria-label. If a longer hint ("Select region" / "Оберіть регіон") reads better, add a `common.select_region`
key with full sq/en/uk/it parity instead — pick ONE and note the choice; do not leave it empty. (If unsure which the
owner prefers, STOP and ASK — do not guess silently.)

## §18.9 IRON RULE compliance — REQUIRED to close (geometry gate is NOT enough)

Per `docs/mantine-responsive-design-system.md §18.9`, the session log MUST include a **human-inspected side-by-side**
of the ACTUAL render at `uk@320` + one desktop width proving: (a) main-field icon↔text has a visible gap, no overlap,
in all 4 locales; (b) the region trigger shows its placeholder; (c) no internal element clips/overlaps. A geometry
`screenshots:assert` PASS count is a baseline, NOT the verdict for this task.

## Mobile <640 full-width gate (clause 11)

Unchanged from Task 554: `TextInput` + region trigger full-width `<640`; Add/Cancel full-width stacked; toggle
`Anchor` is the one compact exemption. The fix must NOT regress any of these — re-prove them.

## TailAdmin conformance (clause 16)

Field chrome stays §6d/§6e (border gray-300, radius lg, focus ring, shadow-xs, Open Sans). The icon gap must match
TailAdmin's own icon-input spacing — cite the reference value; invent nothing.

## Positive flow (happy path)

Actor: user on the listings filter / admin add-location. 1) Main field renders with the pin icon and a clear gap
before "All cities"/"Всі міста" — no occlusion. 2) User opens the add-location sub-panel → region trigger shows its
placeholder (e.g. "Region"/"Регіон"). 3) All fields full-width `<640`. Success: icon never overlaps text; region
picker never blank.

## Negative flow (every off-happy-path branch)

- **Long uk/it value in the main field** → text wraps/truncates cleanly AFTER the icon gap, never under the icon.
- **No-icon consumer of `MantineCombobox`** (e.g. PropertyType/Year `variant="button"`, no `leftSection`) → unchanged,
  no extra left padding introduced (regression sweep proves it).
- **Region value selected** → selected label shows with the same gap, placeholder gone.
- **Empty region (initial)** → placeholder visible (the D2 fix), NOT a blank box.
- **RTL/locale switch** → `padding-inline-start` (logical prop) keeps the gap correct in all 4 locales.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. **D1 fixed at the canonical source:** the main-field icon↔text gap is present, no overlap, at 320/375/390/480/1280
   × sq/en/uk/it — proven by rendered screenshots pasted into the session log (§18.9 rule 3). Diff shows the fix in
   `MantineCombobox`/`input-chrome.css` (canonical), not a `LocationCombobox`-only hack. Regression sweep of all
   icon/section consumers listed with before/after.
2. **D2 fixed:** region trigger renders a placeholder; diff shows the `placeholder` prop added; i18n key has
   sq/en/uk/it parity (`check:i18n` green); no new blank-trigger anywhere.
3. **§18.9 human visual proof present** in the session log (side-by-side, uk@320 + desktop) — not just a geometry
   PASS count.
4. **`screenshots:assert -- --mantine-only`** still green (the existing Task 554 story now shows the fixed render);
   re-paste the Phase-0 line. Update the Task-554 story's doc note if the render it documents changed.
5. **Gates:** `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens --strict`, `check:mojibake`,
   `check:file-integrity` all green; a planted-violation transcript for any NEW assertion added. Files-Changed table.
   Critical-flow-registry coverage for the sub-panel row updated. **Do NOT run git** — held for orchestrator review.

## Out of scope

Any behavior change to the combobox dropdown/sheet logic; migrating other consumers; re-doing the primitive matrix;
adding a force-open prop. This is a spacing/placeholder fix + its proof only.
