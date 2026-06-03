### Task 377 — CORRECTIVE F: FULL conformance sweep over ALL 26 *.stories.tsx (owner "all stories" directive)

> **Execution order (Sprint 32 correctives) — A → B → C → D → E → F, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. **F is the FINAL certification sweep — it runs ONLY after A + B + C + D + E are ALL implemented AND reviewed (amendment 1), not a parallel implementation task.**

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
added by Corrective E) · `docs/ui-rules.md` · `docs/component-rules.md` · `docs/qa-rules.md` · `docs/ai-behavior.md` Note
14. **Correctives A + B + C + D + E must ALL be implemented AND orchestrator-reviewed/approved before F starts
(amendment 1) — not just E.** F is the FINAL certification sweep; it runs only after every primitive/governance fix
(A–E) has landed and been diff-reviewed, and it is NOT a parallel implementation task. (E specifically defines the
canonical story patterns/STANDARD this sweep applies.)

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
6. **Responsive**: renders without overflow/clip/hidden controls at ALL required breakpoints.
7. **Scenario-named exports** (§8b); no per-width export names.
8. **Canonical primitives reflect A–E fixes** (default underline Tabs, mobile full-width Buttons, clean Dialog, FilterBar
   hierarchy, Select label, governance helpers) — stories must demonstrate the corrected behavior, not the old one.
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

## Out of scope
Runtime component/primitive logic (A–E own it); multilingual settlements (368); new components.

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · the grep gates (paste output) ·
the 26×9 conformance matrix · Manual QA matrix.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it (each). Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390
mandatory). Per file, confirm checks 1–9.

## Final report requirements
The full 26×9 conformance matrix; grep gate outputs; per-file fix summary; list of any STOP&ASK items; validation
outputs; Files Changed table. NO `git add`/`commit` — orchestrator emits after diff review.
