# Sprint 34 — Task 396 — Static hardcoded-i18n scanner over ALL `src/**` + full inventory audit + CI gate (no point-fixes)

> **Owner directive 2026-06-05 (repeated ≥ before): STOP point-fixing hardcodes.** The render-based
> `check:locale-leak` gate only sees the **29 stories** that exist — it structurally cannot cover the **~109
> components without a story** (138 components total). Fixing `dialog`/`sheet` "Close" by hand is latching, not a
> system. This task builds the **systemic** layer: a STATIC, story-independent scanner over **every** `src/**/*.tsx`
> that finds hardcoded user-facing English, produces a complete inventory, and wires a CI gate so **no new hardcode
> can land**. Actual remediation of the existing backlog is **Task 397** (batched). **Read `docs/agent-contract.md`
> (1–13) FIRST.** STOP & ASK if ambiguous.
>
> **🔴 DEPENDS ON Task 395 (re-do) approved first** (owner-chosen order). 395 makes the render gate runnable; 396 is
> the complementary static layer. They are different scripts/files — but 395 ships first.
> **Structure (owner-chosen): 396 = scanner + audit + gate ONLY; remediation = Task 397.**

```
Type:        tooling (static i18n scanner) + governance (CI gate) + audit (full inventory)
Priority:    HIGH (systemic coverage — closes the render-gate blind spot)
Area:        scripts/check-hardcoded-i18n.mjs (NEW), package.json scripts, eslint/CI wiring,
             docs/i18n-hardcode-audit.md (NEW inventory), docs/storybook-governance.md or a new docs/i18n-governance.md
NON-area:    NO src/** component edits in this task (that is Task 397). Scanner + baseline + gate + audit only.
```

## Why a static scanner (not "add 109 stories", not "fix the 3 spots")
- `check:locale-leak` renders a story and compares locale outputs — excellent for what it covers, but **blind to any
  component without a story**. A 30-second grep already finds, OUTSIDE the gate's reach:
  - **3 hardcoded `sr-only` literals:** `dialog.tsx:81` "Close", `sheet.tsx:74` "Close", `pagination.tsx:121` "More pages".
  - **11 hardcoded `aria-label` literals:** breadcrumb `"Breadcrumb"` (favorites/listings/[slug] pages),
    `pagination.tsx` "Go to previous/next page", `AdminSupportManager` "Clear selection", `Footer` "Facebook"/"Instagram",
    `AvatarCropModal` "Avatar crop area; drag to position", `AuthRedirect` "Loading…", `ListingsPagination` "Pagination".
  - The true count (incl. JSX text children, `title`, `placeholder`, `alt`) will be higher — that's the point of the audit.
- The fix is a **static AST/regex scanner** that runs over the whole tree independent of Storybook, mirroring the
  philosophy already in `scripts/check-stories.mjs` (checks 9/10) but applied to ALL `src/**`, not just stories.

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–13) · `docs/backlog.md`
- `scripts/check-stories.mjs` (existing static checks 9 "runtime component hardcoded literals" + 10 "English JSX
  string-prop literals" + the `isEnglishish()` + allowlist patterns — REUSE this logic; do not reinvent).
- `scripts/check-locale-leak.mjs` (the `LEAK_ALLOWLIST` language-neutral philosophy — the new scanner's allowlist
  must follow the same "language-neutral tokens ONLY, never translatable vocabulary" rule).
- `docs/storybook-governance.md` §14 (gate-wiring conventions: `prebuild` + CI, negative-flow proof).
- `docs/ai-behavior.md` → "Localization (i18n) Rules"; `docs/rule-index.md` "Storybook / visual snapshot" + the i18n bits.
- `tasks/Epics/Epic_II_Global_i18n_Hardening.md` — this task is Epic II P1 (audit + scanner) + P3 (CI gate) materialised;
  keep it consistent with that epic's plan and cross-link.

## Scope of detection (what the scanner MUST flag)
Across **all** `src/**/*.tsx` (and `.ts` where JSX-adjacent), flag a hardcoded user-facing English literal in any of:
- JSX text children (`>Some Text<`) not wrapped in `t()`/`storyT()`/an i18n call.
- `sr-only` span/text literals.
- String-literal values of accessibility/visible attributes: `aria-label`, `aria-description`, `aria-placeholder`,
  `title`, `placeholder`, `alt`, `label` (when a raw string), and `aria-roledescription`.
- Reuse `isEnglishish()` so non-English / interpolated / token values are not false-flagged.
**Allowlist (language-neutral ONLY):** brand/acronym (EUR/URL/API/…), proper nouns, all-caps enum codes, pure
numbers/units/symbols, CSS/code tokens, single icons. **NEVER** allowlist translatable words (Close/Save/Loading/
Breadcrumb/Pagination/…). Mirror `check-locale-leak.mjs`'s allowlist discipline; document every pattern.

## Positive flow (happy path)
- **Step 1 — Build `scripts/check-hardcoded-i18n.mjs`** (static; no browser/Storybook dependency). Walks `src/**`,
  parses each file, applies the detection scope + allowlist, emits a JSON + console report grouped by file:line:token.
- **Step 2 — Produce the full inventory** → write `docs/i18n-hardcode-audit.md` with the COMPLETE list (every file,
  line, token, attribute kind), counts per directory, and a machine baseline file (e.g.
  `scripts/i18n-hardcode-baseline.json`) capturing today's known findings.
- **Step 3 — Wire the CI gate in 'fail on NEW' mode:** add `npm run check:i18n-hardcode`; the gate compares against the
  committed baseline and exits 1 only if a finding appears that is NOT in the baseline (existing debt does not block;
  NEW hardcode is un-committable). Wire into `prebuild`/CI alongside the other gates.
- **Success state:** `check:i18n-hardcode` runs over all `src/**`, prints the full count, exits 0 against the baseline;
  the audit doc + baseline are committed; the gate is in CI.

## Negative flow (must be proven, not claimed)
- **Plant a NEW hardcode** (e.g. add `aria-label="Brand New Hardcode"` to a component NOT in the baseline) → the gate
  MUST exit 1 and name the file:line. Revert; gate green again. Paste the transcript against the committed scanner.
- **Plant a baseline-listed finding's twin in a new file** → must be flagged (baseline is keyed to file:line, not the
  raw token, so the same word elsewhere is NEW). Prove it.
- **False-positive guard:** confirm a correctly-localized `t('common.close')` call and a non-English literal are NOT
  flagged (so the gate is usable, not noise). Show a small sample.
- **Coverage proof:** the scanner report MUST include components that have NO story (e.g. `pagination.tsx`,
  `AvatarCropModal.tsx`, page-level breadcrumbs) — demonstrating it sees what `check:locale-leak` cannot.

## Acceptance criteria (machine-proven)
- `scripts/check-hardcoded-i18n.mjs` exists, static, covers ALL `src/**` (not story-gated); `node --check` passes;
  the script is complete (no truncation — verify the file parses and `run()` is invoked) — **explicit re-read of the
  full file end is required in the self-audit (Task 395 lesson).**
- `docs/i18n-hardcode-audit.md` lists the COMPLETE inventory (≥ the 3 sr-only + 11 aria-label already known, plus all
  others found); per-directory counts; total.
- `check:i18n-hardcode` wired into `package.json` + CI in 'fail-on-new' mode against a committed baseline; negative-flow
  plant proves it bites; existing debt does not block.
- `tsc=0`, `lint=0`; NO `src/**` component behavior change in this task; Files Changed table matches the real diff
  exactly (verify the table against `git status`/diff — Task 395 lesson).
- Session log: AC-by-AC self-audit, Files Changed table, **no `git add`/`commit` from the executor**.

## Out of scope (→ Task 397)
- Editing components to replace hardcodes with `t()` keys, and adding locale keys. That is **Task 397** (batched
  remediation that burns down the 396 baseline). 396 ends when the scanner, audit, baseline, and gate are in place.
- The render gate itself (Task 395). Notification/email/toast dynamic-key i18n (Epic II P2 — separate).
