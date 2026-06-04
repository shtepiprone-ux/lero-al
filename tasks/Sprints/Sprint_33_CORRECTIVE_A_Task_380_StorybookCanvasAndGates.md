### Task 380 — CORRECTIVE A: Storybook full-width canvas + locale-aware fixture layer + ENFORCEABLE anti-hardcode gates

> # 🔴 OWNER P0 (2026-06-03/04). This task is the FOUNDATION of Sprint 33. It must make two things TRUE and
> ENFORCED before any story is touched: (1) the Storybook canvas renders every story at the FULL available width
> in a mobile-accurate frame, so a correct `max-sm:w-full` primitive actually fills <640 (no more
> `layout:'centered'/'padded'` masking); (2) hardcoded user-facing strings, `layout:'centered'/'padded'`,
> `Ukrainian*`-named stories, and raw HTML controls become **un-committable** via lint + a build-gating script.
> Read the root-cause log first: `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md`.

Type:      corrective infrastructure — Storybook canvas + i18n fixture layer + enforcement gates
Priority:  CRITICAL (blocks 381/382/383)
Area:      `.storybook/preview.tsx` · `.storybook/main.ts` · `eslint.config.mjs` · `scripts/check-stories.mjs` (NEW) ·
           `scripts/responsive-screenshots.mjs` · `messages/{sq,en,uk,it}.json` (`storybook.*` namespace) ·
           `src/stories/_storyI18n.ts` (NEW helper) · `package.json` (wire gate) · docs

## Required pre-read
`docs/agent-contract.md` (esp. clauses 7, 11, 12, and the NEW clause 13) · `docs/backlog.md` ·
`docs/storybook-governance.md` (incl. the NEW "Enforceable Storybook gates" section) · `docs/component-rules.md` ·
`docs/qa-rules.md` · `docs/responsive-screenshot-governance.md` · `docs/responsive-screenshot-matrix.md` ·
`.storybook/preview.tsx` · `scripts/responsive-screenshots.mjs` · `eslint.config.mjs`.

## Current broken behavior (file evidence)
- `button.tsx` correctly has `max-sm:w-full` on every text size, yet `Button/Default` renders centred at 320 →
  cause = `button.stories.tsx:13 layout:'centered'`. Same for badge/checkbox/PasswordInput (`layout:'centered'` ×5)
  and the 11 `layout:'padded'` stories. **The canvas, not the primitive, is the defect.**
- `.storybook/preview.tsx` `withTheme` wraps in `min-h-screen bg-background` but enforces **no width frame**; the
  global `layout:'padded'` adds a non-canonical gutter. There is no mobile-accurate full-width canvas.
- Hardcoded user-facing literals exist in `src/stories/fixtures/listing.fixture.ts`, `select.stories.tsx`,
  `Combobox.stories.tsx`, `AdminTable.stories.tsx`, `button.stories.tsx` — and nothing fails the build for it.
- No lint rule / script blocks `layout:'centered'|'padded'`, raw controls, `Ukrainian*` stories, or raw literals.

## Required after behavior

### Part 1 — Full-width mobile-accurate canvas (kills RC-1 globally)
1. Add a **global decorator** `withCanvas` in `.storybook/preview.tsx` that wraps every story in a container that
   takes the **full available canvas width** (`w-full` block, the project's real page gutter via the canonical
   container token — NOT Storybook's `padded`/`centered`), so `max-sm:w-full` controls fill the viewport at <640.
   The frame must NOT centre or shrink-wrap content. Document the exact gutter token used (must match the real app
   page gutter from `design-system.md`, no ad-hoc px).
2. Set the global default `parameters.layout: 'fullscreen'` and **remove per-story `layout:'centered'|'padded'`**
   (the lint rule in Part 3 enforces their absence). Stories that genuinely need a centred preview (none expected)
   must STOP&ASK — do not invent an exemption.
3. Keep the existing locale + theme decorators and viewport presets intact; `withCanvas` composes with them.
4. Verify rendered: at 320 the `Button/Default` fills the frame edge-to-edge with ≥44px height and wraps long
   labels; at ≥640 desktop behavior is unchanged.

### Part 2 — Locale-aware story fixture/i18n layer (kills RC-2 structurally)
1. Add a `storybook.*` namespace to `messages/{sq,en,uk,it}.json` holding EVERY user-facing string that stories
   and fixtures need (listing titles, admin ticket subjects, select/combobox option labels, table roles, demo
   button labels, section titles, etc.), with **complete sq/en/uk/it parity** (`check:i18n` must pass). The uk
   values are the "longest strings" used by Locale Stress — there is no separate hardcoded uk fixture.
2. Add `src/stories/_storyI18n.ts`: a small typed helper `storyT(locale, key)` (and/or a `useStoryMessages`
   hook) that resolves a `storybook.*` key for the active locale, with NO English fallback in sq/uk/it (a missing
   key throws in dev so it is caught immediately). This is the ONLY sanctioned source of fixture text.
3. Refactor `src/stories/fixtures/listing.fixture.ts` so fixtures expose **keys**, not literals (e.g.
   `titleKey: 'storybook.listing.modern_apartment'`), resolved through `storyT` at render. Remove the hardcoded
   English titles and the hardcoded Ukrainian long title. (The full per-file fixture/story migration is Task 381;
   here you deliver the layer + migrate `listing.fixture.ts` as the reference implementation.)

### Part 3 — ENFORCEABLE gates (the owner's core demand: hardcode can NEVER return)
1. **ESLint** (`eslint.config.mjs`, override block scoped to `**/*.stories.tsx` + `src/stories/**`):
   - **Ban `parameters.layout: 'centered'` and `'padded'`** in stories (`no-restricted-syntax` on the Property).
   - **Ban raw `<button>/<input>/<select>/<textarea>` JSX** elements (keep the current clean state locked).
   - **Ban story export names matching `/Ukrainian/`** (`no-restricted-syntax` on `ExportNamedDeclaration`).
   - **Ban raw user-facing string literals** in JSX text, `aria-label`, `title`/`label`/`placeholder` props, and
     fixture object fields: any string literal containing a letter that is not produced by `t()`/`storyT()` is an
     error. Allow a documented allowlist for developer-only prose (CSS classes, technical IDs) — keep it tight and
     listed. (Implement as a custom `no-restricted-syntax` selector set; document the selectors in the session log.)
2. **`scripts/check-stories.mjs` (NEW)** — a build-gating script that, across all `*.stories.tsx` + `src/stories/**`:
   - greps real JSX raw controls (triaged to exclude comment/doc-string false positives) → 0 allowed;
   - greps `layout:\s*'(centered|padded)'` → 0 allowed;
   - greps story export names / `globals:{locale:'uk'}` pins / `/Ukrainian/` identifiers → 0 allowed;
   - greps known English-leak phrases + a heuristic for raw Latin-word literals outside `storyT/t` → 0 allowed;
   - verifies every `storybook.*` key referenced exists in all 4 locales (parity).
   Non-zero exit on any violation; prints the offending file:line list.
3. **Wire it into the build**: add `node scripts/check-stories.mjs` to the `prebuild-storybook` /
   `prestorybook` chain (and expose `npm run check:stories`) so `build-storybook` FAILS on a violation, and add it
   to the CI workflow alongside `check:i18n`.
4. **Automated rendered assertion** — extend `scripts/responsive-screenshots.mjs` (or a sibling
   `scripts/check-stories-rendered.mjs`) with a `--assert` mode that, per story × {320,375,390,…} × {sq,en,uk,it}:
   captures the screenshot AND asserts (a) no horizontal scrollbar / no `scrollWidth > clientWidth` at 320, and
   (b) every rendered text Button/Select/Tabs trigger has bounding-box width ≈ canvas width at <640. Emit a
   machine-readable matrix (JSON + the PNGs) to the evidence folder. This is the proof artifact Tasks 381–383 and
   the orchestrator consume — it replaces "OWNER QA REQUIRED / NOT CHECKED".

## Exact files allowed to edit
`.storybook/preview.tsx`, `.storybook/main.ts` (only if needed to load the gate), `eslint.config.mjs`,
`scripts/check-stories.mjs` (new), `scripts/responsive-screenshots.mjs` (or new sibling), `package.json`,
`messages/{sq,en,uk,it}.json` (`storybook.*` only, full parity), `src/stories/_storyI18n.ts` (new),
`src/stories/fixtures/listing.fixture.ts` (reference migration only), `docs/storybook-governance.md`,
`docs/backlog.md`, new session log. **Do NOT edit other story files here** (that is Task 381) except as required
to keep `build-storybook` green after removing the global `layout` default — if a story breaks, STOP&ASK rather
than silently editing it.

## Current behavior to preserve
Locale + theme toolbars; all 20 viewport presets; existing PASS stories must still render; desktop (≥640)
appearance of every primitive unchanged; `check:i18n` parity.

## Positive flow
1. `withCanvas` makes `Button/Default` render full-width at 320 (sq/en/uk/it) with ≥44px height + wrapped label.
2. `storyT` resolves `storybook.*` keys per locale; `listing.fixture.ts` renders localized titles in every locale.
3. `npm run lint` + `npm run check:stories` pass on the clean tree.
4. `responsive-screenshots --assert` emits a green matrix (no 320 overflow, full-width <640) with PNG artifacts.

## Negative flow (each must be demonstrated, then reverted, in the session log)
- Add `layout:'centered'` to a story → `npm run lint` AND `check:stories` FAIL (paste output) → revert.
- Add a raw `<button>Foo</button>` to a story → lint + `check:stories` FAIL → revert.
- Add `export const UkrainianX` → lint + `check:stories` FAIL → revert.
- Add a raw literal `title: 'Hardcoded English'` in a fixture → lint + `check:stress` FAIL → revert.
- Remove a uk `storybook.*` key → `check:i18n` + `check:stories` FAIL → restore.
- Make a control non-full-width at 320 → `responsive-screenshots --assert` FAIL (cite the asserting code) → fix.

## Acceptance criteria (each with a negative branch)
- AC1 `withCanvas` global decorator present; every story renders full available width; NO per-story
  `layout:'centered'|'padded'` remains (grep 0). Rendered: `Button/Default` full-width at uk@320/375/390. Neg: ≥640 unchanged.
- AC2 `storyT` + `storybook.*` keys (sq/en/uk/it parity) exist; `listing.fixture.ts` migrated to keys; rendered
  localized titles in all 4 locales. Neg: missing uk key throws in dev (shown).
- AC3 ESLint override bans `layout:'centered'|'padded'`, raw controls, `/Ukrainian/` exports, raw user-facing
  literals; each ban demonstrated FAIL→revert in the negative-flow log.
- AC4 `scripts/check-stories.mjs` exists, wired into `prebuild-storybook` + CI + `npm run check:stories`; exits
  non-zero on each planted violation (transcript) and 0 on the clean tree.
- AC5 `responsive-screenshots --assert` emits the per-story machine matrix (JSON + PNGs) and asserts no-320-overflow
  + full-width-<640; sample artifacts referenced. Neg: a planted non-full-width control fails the assertion.
- AC6 `docs/storybook-governance.md` "Enforceable Storybook gates" section documents the gates + the canonical
  canvas/gutter token + the `storyT` pattern.

## Out of scope
Per-file story de-hardcoding + deleting redundant uk stories (Task 381); component-layout fixes
(Task 382); the final 26×9 rendered sweep (Task 383). NO runtime product-component edits here (canvas/infra only).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run check:stories` · `npm run build-storybook` ·
`responsive-screenshots --assert` · the planted-violation transcripts · AC self-audit · rendered matrix.

## Required Sonnet evidence format (MANDATORY — Sprint 33 standard; supersedes "OWNER QA REQUIRED" excuses)
A cell is PASS only if **a machine-produced screenshot or a command transcript proves it**. "No browser access"
is NOT acceptable — `responsive-screenshots --assert` is the browser; run it. tsc/lint/build-storybook exit 0 is a
baseline, never proof. The final report MUST include: (1) AC self-audit table (AC# · file:line · verification
evidence · PASS/FAIL/NOT CHECKED); (2) command transcript with exit codes; (3) grep gate raw outputs + triage;
(4) the rendered matrix (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory) referencing the emitted PNG/JSON
artifacts; (5) the negative-flow planted-violation transcripts (each gate FAILs then reverts); (6) STOP&ASK log;
(7) Files Changed table. INCOMPLETE if any AC or any required rendered cell is NOT CHECKED. NO `git add`/`commit`.
