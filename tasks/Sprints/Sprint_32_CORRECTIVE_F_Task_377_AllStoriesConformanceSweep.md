### Task 377 — CORRECTIVE F: FULL conformance sweep over ALL 26 *.stories.tsx (owner "all stories" directive)

> **Execution order (Sprint 32 correctives) — REVISED 2026-06-03 (owner): `372 (incl. folded 378) → 373 → 379 → 374 → 375 → 376 → 377`, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. **377 is the FINAL certification sweep — it runs ONLY after Tasks 372, 373, 379, 374, 375 AND 376 are ALL implemented AND orchestrator-reviewed, not a parallel implementation task.**

Type:      corrective governance sweep — EVERY story file (owner-rejected Sprint 32)
Priority:  CRITICAL
Area:      every `*.stories.tsx` under `src/`

## Owner rejection context
Owner: "корективний план має покривати усі, без винятку, Stories, бо проблеми у всіх Stories" + "у всіх задачах 360-371
не виконані вимоги". Assume problems exist in EVERY story until each is verified conformant. This sweep enforces the
canonical story STANDARD (defined in Corrective E) across all 26 files. It MUST NOT be a superficial pass — a per-file ×
per-check matrix is mandatory, every cell evidenced.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/storybook-governance.md` (incl. the §8a/§8b + the 6-point STANDARD
added by Corrective E) · `docs/ui-rules.md` · `docs/design-system.md` (§12a One-row-one-height = canonical form-control
height ladder; §12b Tabs single-style; §14 Dialog/Sheet bottom-sheet) · `docs/component-rules.md` · `docs/qa-rules.md` ·
`docs/ai-behavior.md` Note 14. **Tasks 372, 373, 379, 374, 375 AND 376 must ALL be implemented AND orchestrator-reviewed/approved before 377 starts
(amendment 1, updated 2026-06-03 to include 379) — not just 376.** 377 is the FINAL certification sweep; it runs only
after every primitive/governance fix (372→373→379→374→375→376) has landed and been diff-reviewed, and it is NOT a
parallel implementation task. (376 specifically defines the canonical story patterns/STANDARD this sweep applies; 379
delivers the all-popups bottom-sheet model the sweep certifies.)

## The 26 story files (ALL in scope — none skipped)
`src/components/admin/AdminCardList.stories.tsx` · `AdminPageShell.stories.tsx` · `AdminTable.stories.tsx` ·
`StatusChangeControl.stories.tsx` · `StatusChangeHistory.stories.tsx` · `src/components/layout/FilterBar.stories.tsx` ·
`PageHeader.stories.tsx` · `PageShell.stories.tsx` · `Section.stories.tsx` · `src/components/shared/Combobox.stories.tsx`
· `src/components/ui/PasswordInput.stories.tsx` · `PasswordRequirementsHint.stories.tsx` · `badge.stories.tsx` ·
`button.stories.tsx` · `checkbox.stories.tsx` · `dialog.stories.tsx` · `input.stories.tsx` · `select.stories.tsx` ·
`sheet.stories.tsx` · `skeleton.stories.tsx` · `tabs.stories.tsx` · `src/stories/AdminLayout.stories.tsx` ·
`Containers.stories.tsx` · `EmptyState.stories.tsx` · `ListingGrid.stories.tsx` · `RecentlyViewedSection.stories.tsx`.
(If a new story file exists at execution time, include it — STOP&ASK only if the count differs materially.)

## Story helpers & fixtures ALSO in scope (amendment 2 — MANDATORY)
The grep / i18n-leak / raw-control / locale-parity checks (checks 1, 2, 3, 5) apply NOT ONLY to the 26 `*.stories.tsx`
files but ALSO to the story helpers and fixtures they import that render visible text or `aria-label`:
- `src/stories/StoryListingCard.tsx`
- `src/stories/fixtures/**` (every fixture file)
- **any helper imported by a `*.stories.tsx` that renders visible text or an `aria-label`** — discover these via the
  story import graph and list each one inspected.
These helpers/fixtures get the same English-leak, raw-control, hardcoded-relative-time/units and locale-parity checks,
and each appears as its own row in the conformance matrix (or a dedicated helper/fixture matrix). Deep fixes to
`StoryListingCard.tsx` land in Corrective E; F VERIFIES it (and every other helper/fixture) is conformant and fixes any
residual leak that is story-layer-only — if conformance requires a runtime component change beyond A–E, STOP and ASK.

## Per-file checklist (every file must pass every check)
1. **No raw `<button>`/`<input>`/`<select>`/`<textarea>`** — canonical components only (grep gate). **The grep gate MUST
   distinguish ACTUAL JSX raw controls from documentation-string / comment / prop-description false positives
   (amendment 6):** match opening JSX element tags that are actually rendered (e.g. `<button`/`<input` as a JSX element),
   and EXCLUDE occurrences inside code comments, doc strings, `argTypes`/`description` text, MDX prose, or string
   literals that merely mention the tag name. A flagged hit counts only if it is a real rendered raw control, not a
   textual mention. The session log records the raw grep output AND the triaged real-hit list.
2. **No hardcoded user-facing English** in visible text or `aria-label` that should be localized; use `t()` or a
   locale-safe story label; zero English leak in sq/uk/it canvases (grep gate for known leak phrases).
3. **No hardcoded relative-time/units** like `"2h ago"`, `"€/m²"` hardcoded where a localized form exists — locale-safe.
4. **Locale-stress / *LocaleStress / Ukrainian* stories pin `globals:{locale:'uk'}`**; non-stress follow toolbar; no
   mixed-language canvas.
5. **All 4 locales render** correctly (sq/en/uk/it) — visually, not just key counts.
6. **Responsive**: renders without overflow/clip/hidden controls at ALL required breakpoints — AND (Amendment 8) at
   `<640` every text Button/control is full-width, ≥44px, labels wrap, no h-scroll at 320, and every popup demonstrated in
   the story renders as a full-width bottom sheet (not a centered card / mini-dropdown).
7. **Scenario-named exports** (§8b); no per-width export names.
8. **Canonical primitives reflect the 372/373/379/374/375/376 fixes** (default underline Tabs, mobile full-width Buttons,
   clean Dialog/Sheet bottom-sheet, the 379 all-popups bottom-sheet model, FilterBar hierarchy, Select label, governance
   helpers) — stories must demonstrate the corrected behavior, not the old one.
9. **Interactive controls wired to Actions panel** via `fn()`/args where the story demonstrates interaction.

## Required after behavior
Every one of the 26 files passes all 9 checks. Produce a **conformance matrix** (rows = 26 files, columns = checks 1–9)
in the session log; every cell PASS with evidence (file:line or grep result or rendered OWNER-QA note). Any file needing
a fix is fixed in this task. If a fix would require a runtime component change beyond what A–E delivered, STOP and ASK
(do not silently expand scope).

## Exact files to inspect / allowed to edit
Inspect + edit: the 26 `*.stories.tsx` files **PLUS the story helpers/fixtures in scope (amendment 2):
`src/stories/StoryListingCard.tsx`, `src/stories/fixtures/**`, and any visible-text helper imported by a `*.stories.tsx`**
(story-layer fixes only). `messages/*` ONLY to add missing keys referenced by stories/helpers (keep parity).
`docs/storybook-governance.md`, `docs/backlog.md`, new session log. NO runtime component edits (those are A–E); if a
story OR helper/fixture cannot conform without a component change, STOP and ASK.

## Positive flow
Open each story across sq/en/uk/it and the breakpoint set → canonical components, localized text, correct primitive
behavior (A–E), Actions wired, no overflow/leak.

## Negative flow (must be verified per file)
- Any raw HTML control → replaced. - Any English leak in non-English canvas → localized. - Any locale-stress story not
  pinned → pinned. - Any story still showing old pill-tabs / non-full-width buttons / scrolly dialog / mid-row search /
  raw-value select → updated to the corrected behavior. - Any interactive control not logging to Actions → wired.

## Acceptance criteria
- AC1 The conformance matrix (26 × 9) is present in the session log, every cell PASS with evidence. A missing row/column
  or an unevidenced cell = INCOMPLETE.
- AC2 Grep gates across ALL story files AND the in-scope helpers/fixtures (amendment 2) return clean: no raw
  `<button`/`<input`/`<select`/`<textarea` (real JSX controls — triaged to exclude documentation-string false positives
  per amendment 6; session log shows raw output + triaged real-hit list, 0 real hits to pass); no known English-leak
  phrases; no `"2h ago"`; locale-stress stories contain `globals: { locale: 'uk' }`.
- AC3 Each file renders in all 4 locales at all required breakpoints (OWNER QA REQUIRED cells listed explicitly per file).
- AC4 Stories demonstrate the A–E corrected behavior (no story still showcases a rejected pattern).
- AC5 No runtime component changed by this task (story-only + messages keys); any needed component change was STOP&ASK'd.

## Amendment 7 — RE-CERTIFY Task 372's Button matrix (REVISED 2026-06-03 — ownership resolved)
**Ownership decision 2026-06-03: the COMPLETE Button consumer matrix is OWNED and PRODUCED by Task 372 (its requirement 2
+ AC3/AC4), NOT here.** 377 does NOT re-build the matrix and has **NO runtime-edit carve-out** — the earlier "close the
full matrix here in F / minimal call-site edit allowed" wording is REVOKED to remove the 372↔377 double-ownership
conflict. Task 377 instead **RE-CERTIFIES** 372's matrix as part of the final sweep:
- Re-run the discovery greps (`rg "from '@/components/ui/button'"` + `rg '<Button'`) and confirm the COUNT and the set of
  `text`/`icon-only`/`exempted` classifications still MATCH 372's delivered matrix (account for any Button call sites
  added by 373/379/374/375/376 — those new sites must already be full-width per the primitive; if any new `text` site is
  NOT full-width at <640, that is a regression in the task that introduced it → **route back to that task, do NOT fix it
  here**).
- Rendered spot-check: confirm `button.stories.tsx` and a representative sample of real consumers still render every
  `text` Button full-width at <640 (uk@320/375/390), matching 372's evidence.
- **If 377 discovers a `text` Button that is NOT full-width at <640, 377 does NOT edit runtime code to fix it — it is a
  STOP&ASK + a follow-up task against 372 (or the introducing task).** 377 remains story-layer + messages-keys only.

## AC6 (amendment 7, revised) — Task 372's Button matrix re-certified
The session log shows: the re-run discovery grep output + count; a diff/delta vs 372's delivered matrix (ideally "no
change", plus any newly-introduced call sites and their `<640` result); a rendered spot-check confirming `text` Buttons
are full-width at <640 at uk@320/375/390. **377 produces NO Button runtime edits.** Any non-full-width `text` Button found
is logged as a STOP&ASK + follow-up against the owning task, not fixed here. A re-certification that merely re-states
372's table without re-running discovery = INCOMPLETE.

## Amendment 8 — Mobile <640 full-width + ALL-popups-bottom-sheet certification (owner P0 2026-06-03)
F now ALSO depends on **Task 379** (all-popups bottom-sheet) in addition to A–E — do not start F until 372(v2), 373(v2),
374, 375, 376 AND 379 are implemented + reviewed. Every story in the sweep MUST be certified against the mobile P0
(`agent-contract.md` clauses 11–12):
- At <640: every text Button/control full-width, ≥44px, labels wrap (sq/en/uk/it), no h-scroll at 320.
- EVERY popup demonstrated in any story (Dialog/Sheet/Select/Combobox/DropdownMenu/NavigationMenu/Popover/Command) renders
  as a **full-width bottom sheet** at <640 — no centered card, no mobile mini-dropdown. A story still showing an old
  centered/anchored mobile popup = INCOMPLETE.
- **The matrix stays 26×9 — Amendment 8 does NOT add a hidden 10th column (clarified 2026-06-03).** It is certified
  INSIDE the existing checks: the mobile `<640` full-width treatment + the all-popups bottom-sheet rendering are evidenced
  under **Check 6 (Responsive: renders without overflow/clip/hidden controls at all breakpoints — now explicitly including
  "full-width at <640" and "popups render as a full-width bottom sheet at <640")** and **Check 8 (Canonical primitives
  reflect A–E + 379 fixes — now explicitly including the bottom-sheet popup model from 379)**. Do NOT create an
  unevidenced extra check. The rendered evidence (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory) is the ONLY proof —
  tsc=0/build=✅ does NOT close F. **`AC7` is a SEPARATE acceptance criterion that SUMMARIZES those Check-6 + Check-8
  rendered cells** (mobile full-width + bottom-sheet popups certified across all stories) — it is a roll-up of matrix
  evidence, not an additional unevidenced gate.

## Amendment 9 — Global form-control height (Input h-11) + FilterBar `side="right"` mobile carry-over (owner 2026-06-03)
Two specific consequences of the Sprint 32 correctives MUST be explicitly certified in this sweep (still INSIDE the 26×9
matrix — no hidden extra column; evidenced under **Check 6** "Responsive / <640 full-width" and **Check 8** "Canonical
primitives reflect A–E + 379"):

1. **Global form-control height ladder (Task 375 → canonical, `design-system.md §12a` "One-row-one-height").** `Input`
   default height changed `h-9 → h-11` (44px) APP-WIDE, and `Input`/`SelectTrigger`/`Combobox` now share the `size`
   ladder `default=h-11 / sm=h-9 / xs=h-8`. Because this +8px touches **every** form across the product (not just
   PhoneField), certify per story that:
   - inputs, selects and comboboxes that share a row render at the SAME height (no mixed-height rows);
   - the taller control does NOT introduce clip / overflow / row-collision in **dense surfaces** — explicitly render and
     evidence `input.stories`, `select.stories`, `Combobox.stories`, **`AdminTable.stories`, `AdminPageShell.stories`,
     `AdminCardList.stories`, `FilterBar.stories`** at uk@320/375/390 AND at a desktop dense width (1280/1440);
   - at <640 the form controls are full-width / ≥44px / wrap, no h-scroll at 320.
   The story sweep is NOT sufficient on its own for an app-wide height change: the session log MUST add an **"OWNER QA
   REQUIRED — real app surfaces"** call-out listing the live admin/cabinet/auth form surfaces that need rendered QA for
   the h-11 change (admin tables/toolbars, AdminUserCreate/Profile, AuthSheet, cabinet ProfileTab). If 377's rendered
   pass finds a real clip/overflow/row-collision caused by h-11 on a real surface, that is a **STOP&ASK + follow-up
   against Task 375** (377 makes no runtime edit).

2. **FilterBar `side="right"` Sheet + consumer `max-w-sm` (carry-over flagged in the Task 373 v2 session log).** A
   right-anchored Sheet whose consumer caps width at `max-w-sm` is a possible <640 full-width-bottom-sheet P0 violation
   (`agent-contract.md` clause 11 — "ALL popups = full-width bottom sheet at <640, no exceptions"). Certify the FilterBar
   Sheet (and any other `side="left"/"right"` Sheet demonstrated in a story) at uk@320/375/390: at <640 it MUST render as
   a full-width bottom sheet, not a margined side drawer. If it does not, that is a **STOP&ASK + follow-up against Task
   374 / 379** (the owning tasks) — 377 does not fix runtime.

## AC7b (amendment 9) — height ladder + side-Sheet certified
The session log shows, under the 26×9 matrix Check-6/Check-8 cells: (a) shared-row height parity + no dense-surface
clip/overflow from the h-11 change, with the explicit "real app surfaces — OWNER QA REQUIRED" list and any STOP&ASK
routed to Task 375; (b) the FilterBar/side-Sheet <640 bottom-sheet rendering, with any violation routed to Task 374/379.
Re-stating the rule without rendered evidence at uk@320/375/390 = INCOMPLETE.

## Out of scope
Runtime component/primitive LOGIC (Tasks 372/373/379/374/375/376 own it); multilingual settlements (368); new components.
**NO runtime carve-out (revised 2026-06-03): 377 makes NO runtime/component edits at all — not even minimal Button
call-site `className` tweaks. It is story-layer + `messages/*` keys ONLY. Any required runtime change (including a
non-full-width Button) is a STOP&ASK + a follow-up against the owning task.**

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · the grep gates (paste output) ·
the 26×9 conformance matrix · Manual QA matrix.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it (each). Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390
mandatory). Per file, confirm checks 1–9.

## Required Sonnet evidence format (MANDATORY — applies to this and every Sprint 32 corrective)
Sonnet must NOT mark any conformance-matrix or rendered/manual QA cell PASS unless Sonnet PERSONALLY rendered or
inspected that cell. "OWNER QA REQUIRED" means the owner MAY ADDITIONALLY audit — it does NOT replace Sonnet's own
evidence. A cell that was not checked = `NOT CHECKED`, and the task is then INCOMPLETE. `tsc`/`lint`/`build-storybook`
are baseline checks only; they do NOT replace rendered/manual verification, and "it compiles" never counts as PASS.
The final report MUST include:
1. **AC self-audit table** — AC# · requirement · implementation evidence (file:line) · verification evidence (command
   output / rendered matrix cell / grep output / test result) · status `PASS` / `FAIL` / `NOT CHECKED`.
2. **Command transcript** — for each required command: exact command · exit code · short result. If a command was not
   run, state the explicit reason. "Not run" NEVER counts as PASS.
3. **Grep gates** — paste the exact grep command and its RAW output; write `(no output)` if empty; for any false
   positives, provide a triage table separating real hits from documentation/comment/string mentions (per amendment 6).
4. **Rendered evidence matrix** — the 26×9 conformance matrix AND, per surface/story: locale (sq/en/uk/it) · viewport
   (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560) · interaction performed · expected result · observed
   result · evidence reference (screenshot path / story URL / exact written observation) · status `PASS`/`FAIL`/`NOT
   CHECKED`. **uk@320/375/390 are mandatory cells.** A drawn-but-unevidenced matrix cell = `NOT CHECKED`.
5. **Tests** — test file · cases added/updated · command run · pass/fail · failure output if any (if any apply).
6. **STOP&ASK log** — every ambiguity found · whether work stopped · what was left unchanged because it was out of scope
   (especially any runtime change routed back to the owning task).
A task is INCOMPLETE if any required AC, any 26×9 matrix cell, or any required rendered cell is marked `NOT CHECKED`.

## Final report requirements
The full 26×9 conformance matrix; grep gate outputs; per-file fix summary; list of any STOP&ASK items; validation
outputs; Files Changed table. NO `git add`/`commit` — orchestrator emits after diff review.
