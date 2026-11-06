# Task 447 — Eliminate raw-enum scanner false positives (attribute / interpolation / `tu()` variants) + regression test

> **Type:** tooling / governance (CI gate script). **NOT product code** — do not touch any `src/**` component
> to "fix" the warnings; they are already correct (verified by orchestrator 2026-06-16). The defect is in the
> SCANNER heuristic (`scripts/check-i18n-parity.mjs` Part 2), which over-reports.

## Background

`npm run check:i18n` Part 2 (raw-enum leak scan) reports two persistent **false positives**:

1. `src/components/admin/AdminInquiriesManager.tsx:288` — `currentStatus={selected.status}` — this is a JSX
   **attribute** passed to `StatusChangeControl` (which localizes internally), not a rendered child.
2. `src/components/admin/AdminSupportManager.tsx:124` —
   `{tu(`user_status_${user.status}` as `user_status_active`)}` — the match is the `${user.status}` **template
   interpolation** building a translation KEY, already inside the `tu()` translator call.

Root cause in `scripts/check-i18n-parity.mjs`:
- `RAW_ENUM_PATTERNS` matches `{x.status}` regardless of whether it is preceded by `=` (attribute) or `$`
  (template interpolation).
- The skip guard only recognises the literal `t(` — so translator variants like `tu(` / `tSort(` (no `t(`
  substring, because of the intervening letter) are not treated as localized.

Both are non-blocking today, but they create recurring review noise and erode trust in the gate. Fix the
heuristic so it stops flagging these two patterns **without weakening detection of real leaks**.

## Pre-read

- `docs/agent-contract.md` (clauses 1, 9, 10, 14, 15)
- `docs/backlog.md`
- `docs/critical-flow-registry.md` — P1 row "i18n parity on key routes" (`npm run check:i18n`). This task hardens
  that gate's accuracy; the regression-coverage rule (clause 15) applies → ADD a test (below).
- `docs/qa-rules.md`, `docs/i18n-rules.md`

## Scope (exact files)

1. `scripts/check-i18n-parity.mjs` — refine the Part-2 raw-enum scan + make it unit-testable.
2. `scripts/__tests__/check-i18n-parity.test.ts` — **NEW** regression test (mirror the existing
   `scripts/__tests__/check-stories.test.ts` pattern — import an exported helper, assert on findings).

Do **not** touch `AdminInquiriesManager.tsx`, `AdminSupportManager.tsx`, any other `src/**`, or any locale file.
Do **not** change Part 1 (locale key-set parity) behavior.

## Acceptance criteria

**AC1 — Suppress attribute & interpolation matches.** A `{x.status|role|plan|user_type}` match that is
immediately preceded by `=` (JSX attribute value) or `$` (template-literal interpolation) is NOT reported.
Implementation guidance (line-level guard added to the existing skip condition):
```js
&& !/[=$]\{[a-z_]+\.(role|status|plan|user_type)\}/.test(line)
```

**AC2 — Recognise translator variants.** A line whose enum sits inside any translator call — `t(`, `tu(`,
`tSort(`, `tStatus(`, etc. — is treated as localized and NOT reported. Guidance:
```js
&& !/\bt[A-Za-z]*\(\s*[`'"]/.test(line)
```
(Generalises the current literal `t(` checks; keep or replace the existing `t(` / `t('` / `t("` checks so the
net behavior is "any `t…(` translator call on the line is localized".)

**AC3 — True leaks STILL caught (no blinding).** A genuine raw render — e.g. `<span>{user.status}</span>`,
`<td>{entry.new_status}</td>`, `capitalize">{x.role}<` — is STILL reported. These are preceded by `>` (not `=`
or `$`) and contain no translator call, so the new guards must not skip them.

**AC4 — Testability refactor.** Extract the Part-2 scan into an exported pure helper (mirroring
`check-stories.mjs`'s `runGate` export), e.g.
`export function scanRawEnumLeaks(content: string, relPath: string): Array<{line:number,text:string}>`
(or `runRawEnumScan(root)`), so the test imports it directly. The CLI entrypoint behavior (console output +
non-zero only on Part-1 parity failure; Part-2 stays non-blocking/advisory) is UNCHANGED.

**AC5 — Regression test (clause 15).** `scripts/__tests__/check-i18n-parity.test.ts` asserts:
- the two real false-positive lines (the `currentStatus={selected.status}` attribute form and the
  `tu(`user_status_${user.status}`)` interpolation form) → **0 findings**;
- a planted TRUE leak (`<span>{user.status}</span>`) → **exactly 1 finding** on that line.
- **Planted-violation proof:** state in the session log that reverting the AC1/AC2 guards makes the
  false-positive assertions FAIL (the test is not a no-op). Paste the FAIL transcript.

**AC6 — Gates green (paste transcripts).** `npx tsc --noEmit` = 0; `npm run lint` = 0;
`npm run check:i18n` = parity PASS **and Part-2 now reports `✅ No suspicious raw-enum patterns detected`**
(0 findings — confirm the two lines are gone, run on the real tree); the new test green
(`npx vitest run scripts/__tests__/check-i18n-parity.test.ts`). File-integrity (clause 14): read each touched
file back, 0 NUL bytes, `.mjs` `node --check` passes, `.ts` compiles.

**AC7 — Session log + Files Changed.** Add `docs/sessions/2026-06-16-task447-raw-enum-scanner-false-positives.md`
with an AC-by-AC self-audit, the planted-violation transcript, and a complete "Files Changed" table. Update
`docs/backlog.md` (mark Task 447 done + advance the numbering line to "next free: 448"). Do NOT emit
`git add`/`git commit` — the orchestrator emits the commit after diff review.

## Positive flow (scanner — happy path)

Run `npm run check:i18n` on the real tree → Part 1 parity PASS (1821) unchanged → Part 2 scans all `.tsx`,
skips the attribute form (`=…{x.status}`), the interpolation form (`$…{x.status}`), and any `t…(` translator
line → reports `✅ No suspicious raw-enum patterns detected`. Exit code unchanged (0).

## Negative flow (every off-happy-path branch)

- **A real leak is introduced** (`<span>{user.status}</span>`) → Part 2 reports it (AC3); test AC5 asserts this.
- **A new translator variant** (e.g. `tBadge(`) appears around an enum → not flagged (AC2 generalised regex).
- **Part 1 parity breaks** (a key missing in one locale) → still exits non-zero (unchanged — do not regress).
- **`scanRawEnumLeaks` called with empty content / non-tsx** → returns `[]`, no throw.
- **Over-skip risk** — if a line has BOTH a real render AND an attribute on the same physical line, document the
  known limitation in a code comment; do not expand the guard to swallow true renders.

## Out of scope / do not do

- No edits to any `src/**` component or locale JSON. The components are correct.
- Do not make Part 2 blocking (it stays advisory) — that is a separate decision, not this task.
- Do not emit git commands; provide the Files Changed table only.
