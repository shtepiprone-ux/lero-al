### Task 383 — CORRECTIVE D: FINAL rendered 26×9 conformance sweep — machine-evidenced (supersedes the un-run Task 377)

> # 🔴 Runs ONLY after Tasks 380, 381, 382 are ALL implemented AND orchestrator rendered-reviewed. This is the
> final certification. Unlike Task 377 (which was never run and relied on self-reported greps), EVERY cell here is
> backed by a machine-produced screenshot from `responsive-screenshots --assert` (Task 380) and the gates must be
> green. tsc/lint/build-storybook exit 0 does NOT close this task.

Type:      corrective certification sweep — every story, machine-evidenced
Priority:  CRITICAL (gates the Sprint 32+33 batch commit)
Area:      all 26 `*.stories.tsx` + `src/stories/StoryListingCard.tsx` + `src/stories/fixtures/**` (verification);
           story-layer-only residual fixes; `messages/*` keys only

## Required pre-read
`docs/agent-contract.md` (7, 11, 12, 13) · `docs/backlog.md` · `docs/storybook-governance.md` (Enforceable gates +
fixture i18n + the 6-point STANDARD) · `docs/design-system.md` (§12a/§12b/§14) · `docs/ui-rules.md` ·
`docs/component-rules.md` · `docs/qa-rules.md` · Task 380/381/382 session logs + their rendered artifacts.

## Per-file checklist (every one of the 26 files must pass every check, machine-evidenced)
1. No raw `<button>/<input>/<select>/<textarea>` (real JSX; triaged) — `check:stories` 0.
2. No hardcoded user-facing string (visible text + aria-label) — `check:stories` 0; zero English leak on sq/uk/it.
3. No hardcoded relative-time/units — locale-safe (`useFormatter`).
4. Single toolbar-reactive `LocaleStress` per component; NO `Ukrainian*` story; no uk pin; no mixed-language canvas.
5. All 4 locales render correctly (sq/en/uk/it) — visually, via screenshots.
6. Responsive: no overflow/clip/hidden controls at all required breakpoints AND at <640 every text Button/control
   is full-width, ≥44px, labels wrap, no h-scroll at 320, every popup demonstrated renders as a full-width bottom
   sheet — asserted by `responsive-screenshots --assert` (no `scrollWidth>clientWidth` at 320; full-width <640).
7. Scenario-named exports (no width-number suffixes).
8. Canonical primitives reflect the 372/373/374/375/379/380/382 fixes (single underline Tabs no left-clip,
   full-width Buttons via the canvas, Select full-width+h-11, Dialog/Sheet + all-popups bottom sheet, FilterBar
   hierarchy, RVS no-scrollbar + stacked header, Skeleton responsive) — stories show the corrected behavior.
9. Interactive controls wired to the Actions panel via `fn()`/args.

## Required after behavior
A **26×9 conformance matrix** in the session log; every cell PASS with a concrete evidence reference (file:line,
grep result, OR — for every rendered cell — the PNG/JSON artifact path emitted by `responsive-screenshots
--assert`). The gates (`lint`, `check:stories`, `check:i18n`, `--assert`) must all be green. Any residual defect
fixable at the story layer is fixed here; anything needing a runtime/component change beyond 380–382 is a
**STOP&ASK + follow-up against the owning task** (383 makes no runtime edits).

## Re-certification carry-overs (must each be machine-evidenced, INSIDE the 26×9 matrix — no hidden columns)
- **Button full-width matrix (was 372/377 amendment 7):** re-run discovery greps; confirm every `text` Button is
  full-width at <640 via the canvas (uk@320/375/390 PNGs). A non-full-width text Button = STOP&ASK + follow-up to
  the owning task; 383 does not edit runtime.
- **h-11 form-control ladder (Task 375, design-system §12a):** shared-row height parity + no dense-surface
  clip/overflow on `input/select/Combobox/AdminTable/AdminPageShell/AdminCardList/FilterBar` at uk@320/375/390 and
  desktop 1280/1440. Real-app surfaces stay "OWNER QA REQUIRED"; any clip = STOP&ASK to 375.
- **FilterBar/side-Sheet <640 = full-width bottom sheet** (Task 374/379 carry-over) — PNG-evidenced.

## Exact files allowed to edit
The 26 `*.stories.tsx` + helpers/fixtures (story-layer residual fixes only) + `messages/*` (keys, parity) +
`docs/storybook-governance.md` + `docs/backlog.md` + session log. **NO runtime/component edits, no gate/script
edits.** Any required runtime change = STOP&ASK + follow-up to the owning task.

## Positive / Negative flow
Positive: every story across sq/en/uk/it × the breakpoint set → canonical components, localized text, corrected
primitive behavior, Actions wired, no overflow/leak, all gates green. Negative (per file): any raw control →
replaced; any English leak → localized; any `Ukrainian*` story → removed; any old pattern (centred button,
clipped tab, raw-value/clipped select, scrolly side-drawer dialog, visible RVS scrollbar) → updated; any
non-full-width text control at <640 → STOP&ASK to the owning task.

## Acceptance criteria
- AC1 The 26×9 matrix is present, every cell PASS with evidence; rendered cells reference `--assert` artifacts.
  A missing row/column or an unevidenced cell = INCOMPLETE.
- AC2 `npm run lint`, `npm run check:stories`, `npm run check:i18n`, `responsive-screenshots --assert` all exit 0
  (transcripts pasted); grep gates clean (raw output + triage).
- AC3 Each file renders correctly in all 4 locales at all required breakpoints — PNG artifacts referenced;
  uk@320/375/390 mandatory.
- AC4 Stories demonstrate the 380/382 corrected behavior; no story showcases a rejected pattern.
- AC5 No runtime component changed by this task; every required runtime change logged as STOP&ASK + follow-up.
- AC6 Every owner FAIL item from `Stories_fails.zip` is re-rendered PASS (map each screenshot → the fixed cell).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run check:stories` · `npm run build-storybook` ·
`responsive-screenshots --assert` · the 26×9 matrix · grep gates.

## Required Sonnet evidence format
Sprint 33 standard — machine screenshots/transcripts only; "no browser access" is not acceptable. Report = AC
table + command transcript (exit codes) + grep raw outputs/triage + the full 26×9 matrix with per-cell PNG/JSON
references + the owner-FAIL→PASS mapping + STOP&ASK log (all runtime routes) + Files Changed table. INCOMPLETE if
any AC, any 26×9 cell, or any required rendered cell is NOT CHECKED. NO `git add`/`commit` — orchestrator emits
after reviewing the rendered artifacts.
