# Task 547 — Deterministic visual-defect inventory report (stop the perpetual git-dirty artifact)

> **Sprint 40 / Epic MM — harness hygiene. Governance-tooling task (NOT a UI/product task).**
> **Executor:** Sonnet 4.6. **Type:** build/gate tooling (report serialization only). **Status:** OPEN.
> **Owner decision (2026-07-05):** make the report deterministic (keep it tracked + human-readable, but stop
> it changing between identical runs). Do NOT untrack it, do NOT `.gitignore` it.

## Problem

`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` is a harness-generated,
git-tracked report. It shows up as `modified` after **every** `npm run screenshots:assert` run even when no
real defect changed, so it perpetually dirties the working tree and leaks into unrelated commits. Root cause =
two volatile fields the emitter writes into the committed `.md`:

1. **`scripts/check-stories-rendered.mjs:1318`** — `**Date:** ${new Date().toISOString().slice(0, 10)}`
   stamps today's date into the report on every run.
2. **`scripts/check-stories-rendered.mjs:1361` and `:1371`** — the selector column emits raw Mantine
   auto-generated element IDs (`#mantine-<random>`, e.g. `#mantine-zqr5kx3nj`). Mantine's `useId` produces a
   fresh random suffix on every Storybook build (the code itself documents this at `:419`), so the string
   churns run-to-run with zero semantic change.

The manifest (`.screenshots/rendered-assert/<timestamp>/manifest.json`, written at `:1311`, gitignored) already
keeps the real run timestamp — the committed `.md` does not need its own date.

## Scope (surgical — report serialization ONLY)

Edit ONLY the inventory-emission block of `scripts/check-stories-rendered.mjs` (~`:1314`–`:1429`). Do NOT touch:
- the manifest JSON shape or its `timestamp` field (`:1311`) — other consumers/tests read it;
- the `.screenshots/rendered-assert/<timestamp>/` directory naming (`:1047`);
- any PASS/FAIL/OUT-OF-RANGE/AMBIGUOUS **counting or verdict logic** — this task changes only how the human-
  readable `.md` is serialized, never the gate result;
- the `storyId` column, the `screenshot` filename column, or the locale/viewport columns (all already stable);
- any other script, any product code, any story, any doc rule except the two noted below.

## Required after-behavior

1. **Drop the volatile date.** Replace the `**Date:** ${new Date()...}` fragment at `:1318` so the committed
   report carries NO run-specific date. Keep a static provenance line instead, e.g.
   `**Harness:** \`scripts/check-stories-rendered.mjs\` + \`scripts/geometry-integrity.mjs\` (Task 467 R1–R4/B1–B8) — run timestamp recorded in \`.screenshots/rendered-assert/<ts>/manifest.json\``.
   No `new Date()` call may feed the committed `.md`.
2. **Normalize Mantine auto-IDs in the selector column.** Before writing the selector string into the inventory
   rows (`:1361`, `:1371`, and any other selector interpolation in this block), replace every occurrence of the
   auto-id pattern with a stable placeholder: `String(selector).replace(/#mantine-[a-z0-9]+/gi, '#mantine-<id>')`.
   - The regex MUST require the leading `#` so it hits only element-id selectors (`#mantine-zqr5kx3nj`) and NEVER
     the storyId column values (`mantine-primitives-combobox--default` has no `#` — must stay intact).
   - Apply it centrally (one small helper, e.g. `stableSelector(s)`) used by BOTH the geometry-violation row
     (`:1361`) and the ambiguous-overlap row (`:1371`) so the two paths cannot drift.
3. **Result:** two back-to-back `npm run screenshots:assert -- --mantine-only` runs with NO source change
   produce a **byte-identical** inventory `.md` (empty `git diff` on that file after the second run).

## Positive flow (happy path)

- Actor: CI / owner runs `npm run screenshots:assert -- --mantine-only`.
- The gate computes the same 448-cell matrix, prints the same summary, writes the manifest as before.
- The inventory `.md` is written with a static header (no date) and selector cells with `#mantine-<id>` in place
  of random suffixes.
- Post-condition: running the exact same command again (no code/story change) leaves the inventory `.md`
  **unchanged** in `git status` — the tree stays clean between identical runs.

## Negative flow (every off-happy-path branch)

- **Real defect appears / roster changes** → the inventory MUST still update: a new failing/ambiguous cell adds
  its row (storyId, locale, viewport, screenshot, reason, normalized selector, label). Determinism must NOT
  freeze the report — only the volatile-noise fields are neutralized. Prove this with a planted violation
  (row appears) then revert (row gone).
- **selector is undefined/empty** → the existing `?? ''` fallback still holds; `stableSelector('')` returns `''`
  (no throw, no `undefined` printed).
- **selector contains a non-Mantine id** (e.g. `.recently-viewed`, `[data-testid="..."]`, an `a[href*=...]`,
  or a plain accessible name like `button("Të gjitha qytetet")`) → passes through UNCHANGED (regex anchored on
  `#mantine-`).
- **storyId column** (`mantine-primitives-*`) → UNCHANGED (no leading `#`, regex must not match).
- **Two Mantine ids in one overlap selector** (`#mantine-a ↔ #mantine-b`) → BOTH normalized to `#mantine-<id>`
  (global `/g` flag). Acceptable that they collapse to the same placeholder — the storyId + label columns
  disambiguate; the raw ids carried no stable meaning anyway.
- **Manifest consumers** → the manifest JSON is byte-for-byte unaffected by this change (only the `.md` emitter
  is touched); confirm the manifest still parses and other gate assertions are unchanged.

## Pre-read (rule-index → docs-only/governance + Storybook gate)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md`.
- `docs/critical-flow-registry.md` — scan; this is harness serialization, no registered product flow touched
  (confirm and state it).
- `docs/storybook-governance.md` §14 (the enforced rendered-gate contract this harness implements) — add a short
  record of the determinism fix (new `§14.9.x`).
- `docs/qa-rules.md` (encoding/hygiene, gate conventions).
- The harness itself: `scripts/check-stories-rendered.mjs` (emission block `:1314`–`:1429`, and `:419` context).

No UI/mobile/locale rendering gate applies — this task renders NO product surface. No `sq/en/uk/it` string work,
no breakpoint matrix (state this explicitly in the session log so the reviewer doesn't expect a rendered matrix).

## Gates to close (HELD until green)

- **Determinism proof (the core AC):** run `npm run screenshots:assert -- --mantine-only` twice with no source
  change; after the second run, `git status`/`git diff -- docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
  is EMPTY. Paste both the "first run regenerated" and "second run = no diff" transcript.
- **Not-frozen proof:** plant one violation (e.g. a temporary over-wide element in any Mantine story), run the
  gate → the inventory gains the expected row (with `#mantine-<id>` normalized, no raw suffix, no date churn);
  revert → row gone, file back to the deterministic baseline. Paste the transcript.
- `npx tsc --noEmit` (0 new errors), `node --check scripts/check-stories-rendered.mjs`, `npm run check:mojibake`,
  `npm run check:file-integrity` — all green (paste). Confirm the manifest JSON still `JSON.parse`s.
- Regression (clause 15): confirm no `critical-flow-registry.md` flow touched — state it.

## Acceptance criteria

1. `scripts/check-stories-rendered.mjs` inventory emitter no longer writes a run-specific date (`:1318` fixed;
   no `new Date()` feeds the committed `.md`); static provenance line present instead.
2. A single `stableSelector()` helper normalizes `#mantine-<random>` → `#mantine-<id>` for BOTH the geometry
   (`:1361`) and ambiguous (`:1371`) selector cells; storyId/screenshot/other-selector columns unchanged.
3. Two identical back-to-back gate runs produce a byte-identical inventory `.md` (empty `git diff`) — transcript
   in the session log.
4. Planted-violation transcript proves the report still updates on real roster changes, then reverts clean.
5. All light gates green; manifest JSON shape unchanged and still parses; no product/UI/story/locale file touched.
6. `docs/storybook-governance.md` new `§14.9.x` records the determinism fix; session log has Files-Changed table,
   AC-by-AC self-audit, and the `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) +
the two determinism transcripts, then emits the explicit-path commit (`scripts/check-stories-rendered.mjs` +
`docs/storybook-governance.md` + the regenerated `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
now in its deterministic form + session log + tracker/backlog). Owner runs it in PowerShell after the native gate.
