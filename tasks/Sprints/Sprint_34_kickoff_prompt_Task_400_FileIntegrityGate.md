# Sprint 34 — Task 400 — File-integrity gate (`check:file-integrity`): no truncated / NUL-corrupted / unparseable files

> **Owner directive 2026-06-05 — "залізне правило".** Files written on the Cowork/Windows mount have repeatedly come
> out truncated mid-token or with embedded NUL bytes while the session log still claimed `tsc=0`/gate-green
> (Task 395 gate script; Task 397 ×2 — baseline JSON + `BaseEmail.tsx`/`PasswordChangedEmail.tsx`). This task builds the
> machine gate that makes that class **un-committable** and **un-claimable**. The rule is already codified in
> `docs/agent-contract.md` clause 14 + `docs/orchestrator-role.md` review checklist — this task provides the script that
> enforces it. **Read `docs/agent-contract.md` (1–14) FIRST.** STOP & ASK if ambiguous.
>
> **Priority:** 🔴 HIGH — it protects every future task. Best done next (it would have caught 395 and both 397 rejects).

```
Type:        tooling (integrity gate) + governance wiring
Area:        scripts/check-file-integrity.mjs (NEW), package.json (script), .github/workflows/governance-pr.yml (CI),
             docs/agent-contract.md clause 14 (already added — cross-link), docs/ai-behavior.md (Note 18 cross-link)
NON-area:    No product-code edits.
```

## What it must check (per agent-contract clause 14)
For a set of files (default: `git diff --name-only` + untracked under the repo, excluding `node_modules`/`.next`/
`storybook-static`/`.screenshots`), FAIL (exit 1) and name the offender if ANY of:
- **NUL bytes present** — any `\x00` in the file (`Buffer.includes(0)`).
- **Stray UTF-8 BOM** at start of a source file (`EF BB BF`) unless the file type legitimately requires it.
- **Unparseable `.json`** — `JSON.parse` throws.
- **Unparseable `.mjs`/`.js`** — `node --check` fails (run via child_process or equivalent).
- **`.ts`/`.tsx`** — defer to `tsc --noEmit` (the script may just flag NUL/BOM/truncation for these and rely on the
  existing tsc gate for full type-check, to avoid a slow per-file compile — document the choice).
- **Truncated mid-token** — for code/JSON this is caught by the parse checks; add a heuristic for other text files
  (e.g. file does not end with a newline AND ends inside an obviously open construct) — keep it conservative to avoid
  false positives; document the heuristic.

CLI modes: default = check changed+untracked; `--all` = whole `src/` + `scripts/` + `messages/` + `docs/`;
`--files <list>` = explicit set. Clear, grouped output naming each bad file + the reason.

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–14, esp. the new clause 14) · `docs/backlog.md`
- `scripts/check-hardcoded-i18n.mjs` (reuse its file-walk + SKIP_DIRS conventions) · `package.json` scripts ·
  `.github/workflows/governance-pr.yml` (where the other gates are wired).

## Positive flow
- Build `scripts/check-file-integrity.mjs` per the checks above; add `npm run check:file-integrity` (+ `:all`).
- Wire into `.github/workflows/governance-pr.yml` (and, if a pre-commit/`prebuild` hook exists, there too) so corruption
  fails CI.
- Cross-link from `docs/ai-behavior.md` Note 18 (pre-completion self-validation now includes this gate).
- **Self-validate the script with itself:** `node --check scripts/check-file-integrity.mjs`, 0 NUL bytes, runs green on a
  clean tree. (Verify the script file end — Task 395 lesson.)

## Negative flow (must be proven)
- **NUL plant:** write a temp file containing a `\x00` byte → gate FAILS naming it → remove (note the sandbox EPERM-unlink
  caveat; if undeletable, leave it inert and flag to the orchestrator).
- **Truncated JSON plant:** a file containing just `{` → gate FAILS.
- **Truncated `.mjs` plant:** a file ending mid-template-literal (like the 395 break) → `node --check` path FAILS.
- **Clean tree:** with no plants, gate exits 0.
- Each plant reverted; gate green after.

## Acceptance criteria (machine-proven)
- `scripts/check-file-integrity.mjs` exists, `node --check` clean, 0 NUL bytes, complete (verify file end).
- `check:file-integrity` wired into CI; negative-flow plants (NUL, `{`-only JSON, truncated `.mjs`) each FAIL with the
  offender named; clean tree exits 0 — transcripts pasted.
- Detects all three historical failures retroactively (demonstrate on a crafted copy of the 395 truncated script + a
  NUL-injected file): all flagged.
- `tsc=0`, `lint=0`; Files Changed table matches the diff. **Self-audit MUST itself include the clause-14 checks**
  (`tr -cd '\000'`, `JSON.parse`, `node --check`) on every file this task touched.
- **No `git add`/`commit` from the executor** — orchestrator emits commits on review (and independently re-runs the
  integrity check on the real files first).

## Out of scope
- Fixing the underlying mount write-failure (environmental). This gate makes the corruption impossible to land/claim;
  it does not change the writer. The remediation tasks (397) still fix their own corrupted files.
