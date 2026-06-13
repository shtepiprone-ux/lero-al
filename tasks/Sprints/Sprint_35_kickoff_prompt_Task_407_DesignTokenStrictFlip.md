# Sprint 35 — Task 407 — Flip `check:design-tokens` to STRICT / BLOCKING (Epic JJ final task)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> Epic JJ's **final** step. The detector is now trustworthy: **Task 408 (`6a0b9e623`) closed all three blind
> spots** (JSX-comment false-positive, inline-zIndex un-suppressibility, function-wrapped `calc/min/max/clamp`
> false-negative) and locked them with a 25-test harness. The whole tree is at **0 unsuppressed violations** and
> `--strict` already exits **0** natively. This task **flips the gate from non-blocking report to blocking** so any
> new raw style value fails CI. It must be **GREEN on landing** (the tree is already clean).

```
Type:        Tooling / governance / CI gate — config + docs. NO product code, NO detector logic change.
Priority:    HIGH — closes Epic JJ.
Depends on:  Task 408 committed (6a0b9e623) — detector hardened + green. Whole-tree --strict = exit 0.
Area:        .github/workflows/governance-pr.yml (the gate step) + package.json (scripts) +
             docs/design-system.md §23 (final contract) + docs/backlog.md + docs/sessions/.
             scripts/check-design-tokens.mjs ONLY if §3 (report-mode removal) is owner-approved — default is NO edit.
NON-goal:    Changing detection/suppression LOGIC (that was 408 — frozen). Adding/removing tokens. Refactoring any
             product code. Re-scanning categories. A baseline file (policy A = strict, NO baseline). Touching any
             other CI job (locale-leak, governance-scheduled).
```

## Current state (verified 2026-06-13, HEAD after 408)
- `package.json`: `"check:design-tokens": "node scripts/check-design-tokens.mjs --report"` (non-blocking — report mode exits 0 even with violations; only missing-reason/stale exit 1). `"check:design-tokens:strict": "node scripts/check-design-tokens.mjs --strict"` exists but is **unwired**.
- `.github/workflows/governance-pr.yml` (~line 67): step **"Design token report — report only (strict gate lands in Task 407)"** runs `npm run check:design-tokens` with **`continue-on-error: true`** → never blocks a PR.
- No husky / `.husky/` and no native git pre-commit hook exist in the repo.
- Strict semantics (Epic JJ, policy A, owner-confirmed): success = **0 *unsuppressed* violations** (inline `design-tokens-allow` markers + the path-level `scripts/design-tokens-allowlist.json` are the justified exemptions). NOT "zero raw values exist".

## §1 — Flip the CI gate to blocking
In `.github/workflows/governance-pr.yml`, the design-token step MUST become a hard gate:
- Run **`npm run check:design-tokens:strict`** (not the report variant).
- **Remove `continue-on-error: true`** so a non-zero exit fails the job (and blocks the PR).
- Rename the step to something like **"Design token strict gate (blocking — 0 unsuppressed raw values)"**.
- Do **not** touch any other step or the `locale-leak` / scheduled jobs. The YAML must remain valid (lint/parse it).

## §2 — Make the default script strict (local/CI parity)
In `package.json`:
- Repoint **`"check:design-tokens"` → `"node scripts/check-design-tokens.mjs --strict"`** so a developer running the bare script sees the same blocking behavior as CI.
- Add **`"check:design-tokens:report": "node scripts/check-design-tokens.mjs --report"`** to preserve the inventory/report capability under an explicit name (the `--report` code path is NOT deleted — see §3).
- Keep `check:design-tokens:strict` (now redundant with the bare name but harmless; keep for explicitness) and `check:design-tokens:update-allowlist` unchanged.

## §3 — "Remove report-mode" (Epic JJ wording) — ORCHESTRATOR DECISION: do NOT delete the code
Epic JJ line 48 says "remove report-mode". **Interpretation (orchestrator):** remove report mode **as the CI gate and as the default** (done in §1+§2) — but **KEEP the `--report` code path** in `scripts/check-design-tokens.mjs`, because it is the dev inventory tool and is wired to `check:design-tokens:report` + `check:design-tokens:update-allowlist`. **Do NOT edit `check-design-tokens.mjs`.** If the owner explicitly wants the `--report` code physically deleted, that is a separate STOP & ASK — do not do it in this task.

## §4 — Document the final contract in `docs/design-system.md §23`
- State that `check:design-tokens` is now **BLOCKING** (strict, no baseline): any **unsuppressed** raw style value fails CI and the local script.
- State the exemption mechanism is the canonical, frozen one from Task 408: inline `// design-tokens-allow: <exact value> — <reason>` markers (incl. the JSX-comment-wrapped form) + the path-level allowlist; **missing-reason and stale-marker both fail** in strict mode.
- Reference the §23.5 test harness as the proof the gate is real. Update the §23.4 rollout table: mark **407 = strict flip landed, gate blocking, green-on-flip**.
- Carry forward the **escalation guardrail** (Epic JJ): if the same bespoke off-scale value is inline-suppressed 3+ times across areas, it should be promoted to a token (note as standing policy, no action this task).

## §5 — Windows pre-commit hook — OUT OF SCOPE this task (no infra exists)
Epic JJ mentions "Windows pre-commit". There is **no** husky/hook infrastructure in the repo, and the project is **single-writer git (owner runs git in PowerShell)** — a committed `.git/hooks/pre-commit` is not version-controlled and would sit oddly with that model. **Scope of 407 = the CI blocking gate (the authoritative enforcement) + local script parity.** A native pre-commit hook, if wanted, is a separate owner-decision follow-up — do **not** invent hook infra here. Note this explicitly in the session log.

## Positive flow (happy path)
1. Clean tree (current state): `npm run check:design-tokens` (now strict) → **exit 0**, "0 violations found".
2. CI `governance-pr` job runs the strict step → **passes** (green-on-flip) because the tree is already clean.
3. A normal PR that introduces no raw style value → gate green → merge unblocked.

## Negative flow (must be PROVEN — the gate is real)
- **Planted raw value blocks:** add a temporary `className="text-[13px]"` (or `zIndex: 9999`, or `w-[calc(100px+2rem)]`) to a scratch `src/**` file → `npm run check:design-tokens` (strict) **exits 1** and names the file:line. Then **revert the plant** and re-run → exit 0. Paste both transcripts. (This proves the CI step would turn the PR red.)
- **Missing-reason marker** → exit 1 (unchanged). **Stale marker** → exit 1 (unchanged).
- **Report variant still non-blocking:** `npm run check:design-tokens:report` on the planted violation exits 0 for inventory (only missing-reason/stale exit 1) — confirms the report tool is preserved and distinct from the gate.
- **No masking:** the green-on-flip is achieved by the already-clean tree, NOT by adding allowlist entries or blanket suppressions. `scripts/design-tokens-allowlist.json` is unchanged by this task (confirm in diff).

## Acceptance criteria (machine-proven)
- `.github/workflows/governance-pr.yml`: design-token step runs `check:design-tokens:strict`, `continue-on-error` removed, step renamed; YAML valid; no other job/step changed (verify in diff).
- `package.json`: bare `check:design-tokens` = `--strict`; new `check:design-tokens:report` = `--report`; `:strict` + `:update-allowlist` intact. No other script changed.
- `scripts/check-design-tokens.mjs` **unchanged** (byte-identical to `6a0b9e623`) unless owner approved §3 deletion.
- `scripts/design-tokens-allowlist.json` **unchanged** (no new exemptions to force green).
- Positive: strict gate exit 0 on the clean tree (native transcript pasted).
- Negative: planted-violation → exit 1 → revert → exit 0 (both transcripts pasted); missing-reason/stale → exit 1; report variant exits 0 on a violation.
- `docs/design-system.md §23` updated with the final blocking contract + rollout table row; `docs/backlog.md` + session log updated; **Files-Changed table matches the real diff** (Task 264 rule).
- Self-validation: `node --check scripts/check-design-tokens.mjs` (unchanged file still parses), `npx tsc --noEmit` 0, `npm run lint` 0 new, native `check:file-integrity` green on touched files.
- Explicit statement: **Epic JJ is complete — `check:design-tokens` is blocking + green; the strict end-state is reached.**

## Mobile <640 gate — N/A (documented exemption)
This task touches only CI config, npm scripts, and docs — no rendered UI, no component, no locale string, no breakpoint. The mobile full-width gate and the breakpoint × locale render matrix do not apply. State this exemption explicitly in the session log.

## Pre-read (mandatory — governance/CI bundle, per `docs/rule-index.md`)
- `docs/agent-contract.md` (1–14) · `docs/rule-index.md` · `docs/backlog.md`
- `docs/governance-enforcement.md` (how CI gates are wired) · `docs/tailwind-governance.md` · `docs/qa-rules.md`
- `docs/design-system.md` §23 (the section you are finalizing) · `tasks/Epics/Epic_JJ_Design_Variables_Single_Source.md` (§ Sequencing row 4 + epic-level acceptance)
- `.github/workflows/governance-pr.yml` · `package.json` (scripts) · `scripts/check-design-tokens.mjs` (read-only — do not edit) · the Task 408 commit `6a0b9e623`

## Out of scope
- Any detector logic/regex/suppression change (frozen at 408). New/removed tokens. Product-code edits. A baseline file. A Windows native pre-commit hook (§5 — owner-decision follow-up). Any other CI job. Deleting the `--report` code path (§3 — owner STOP & ASK only).

> **Single-writer git:** the executor writes files via the filesystem only and includes a "Files Changed" table — **no `git add`/`commit`**. The orchestrator reviews the real diff and emits explicit-path commit commands; the owner runs them in PowerShell.
>
> **Sequencing.** This is the last Epic JJ task. On landing (gate blocking + green, contract documented), Epic JJ is closed.
