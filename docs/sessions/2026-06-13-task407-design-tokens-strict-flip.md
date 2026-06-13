# Session Log — 2026-06-13 — Task 407

**Task:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_407_DesignTokenStrictFlip.md`
**Scope:** Flip `check:design-tokens` from non-blocking report mode to a strict, blocking gate
(CI step + local script parity). Epic JJ's final task. NO detector/suppression logic change
(frozen at Task 408, `6a0b9e623`). NO product code, NO new/removed tokens.

**STATUS: DONE — gate flipped, green-on-flip on the already-clean tree. Epic JJ complete.**

---

## 1. §1 — CI gate flipped to blocking

`.github/workflows/governance-pr.yml`: the design-token step in the `governance` job —
- Renamed `"Design token report — report only (strict gate lands in Task 407)"` →
  `"Design token strict gate (blocking — 0 unsuppressed raw values)"`.
- Command changed `npm run check:design-tokens` → `npm run check:design-tokens:strict`.
- `continue-on-error: true` removed — a non-zero exit now fails the `governance` job and blocks
  the PR.
- No other step, job (`locale-leak`), or trigger config touched. YAML validated with `js-yaml`
  (`VALID via js-yaml`).

## 2. §2 — Local script parity

`package.json` `scripts`:
- `"check:design-tokens"`: `--report` → `--strict` (bare script now matches CI).
- Added `"check:design-tokens:report": "node scripts/check-design-tokens.mjs --report"` —
  preserves the inventory tool under an explicit name.
- `"check:design-tokens:strict"` and `"check:design-tokens:update-allowlist"` unchanged.

## 3. §3 — Report-mode code path preserved

`scripts/check-design-tokens.mjs` **not edited** (confirmed via `git status --porcelain` — no
diff; byte-identical to `6a0b9e623`). `scripts/design-tokens-allowlist.json` also unchanged (no
new exemptions added to force green). The `--report` code path remains wired via the new
`check:design-tokens:report` script.

## 4. §4 — `docs/design-system.md` §23 final contract

- §23 heading + intro block rewritten: gate is now **STRICT/BLOCKING, no baseline**; states the
  exemption mechanism (inline `design-tokens-allow` markers incl. JSX-comment form, §23.1.a +
  path-level allowlist, §23.2.a; missing-reason and stale markers both fail in strict mode);
  references §23.5 harness as proof; carries forward the escalation guardrail (3+ repeated
  bespoke inline suppressions → token-candidate, standing policy, no action this task).
- §23.3 CLI-modes table updated: bare `check:design-tokens` = strict (blocking, default);
  `check:design-tokens:strict` = explicit alias; new `check:design-tokens:report` = non-blocking
  inventory; `:update-allowlist` unchanged.
- §23.4 rollout table: added row **407 (done)** — strict flip landed, green-on-flip, Epic JJ
  complete.
- §23.5 closing line updated to reflect the flip has landed (was "before Task 407 flips it").

## 5. §5 — Windows pre-commit hook — confirmed OUT OF SCOPE

No husky/`.husky/` or native `.git/hooks/pre-commit` exists in the repo (verified). Per the
kickoff, this is a separate owner-decision follow-up — not invented here. Scope of 407 = CI
blocking gate (authoritative) + local script parity (done above).

---

## Positive flow — native transcripts

**1. Clean tree, bare script (now strict):**
```
> lero-al@0.1.0 check:design-tokens
> node scripts/check-design-tokens.mjs --strict

🔍  check:design-tokens — scanning 348 src/**/*.{tsx,ts,css} files
    (excludes globals.css, *.stories.tsx, *.test.tsx, and allowlisted paths)

  Total: 0 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)

✅  check:design-tokens — 0 violations found.
```
Exit code: 0.

## Negative flow — native transcripts (gate is real, then reverted)

**2. Planted violation** — created `src/__scratch_task407/Scratch.tsx`:
```tsx
export function Scratch() {
  return <div className="text-[13px]">scratch</div>;
}
```
`npm run check:design-tokens` (strict):
```
  ── OTHER  (1 finding) ──
  src/__scratch_task407/Scratch.tsx  (1)
    :2  [length:arbitrary px/rem utility]  "text-[13px]"

  Total: 1 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
  By category (regular violations):
    length               1

❌  check:design-tokens STRICT — 1 raw style-value violation(s) + 0 stale-marker(s) found.
```
Exit code: 1.

**3. Report variant on the same planted violation** (`npm run check:design-tokens:report`):
```
  ── OTHER  (1 finding) ──
  src/__scratch_task407/Scratch.tsx  (1)
    :2  [length:arbitrary px/rem utility]  "text-[13px]"

  Total: 1 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
  By category (regular violations):
    length               1

📋  Report mode — 1 violation(s) listed above (inventory for Tasks 403–406).
    Run with --strict to block on these. Strict gate lands in Task 407.
```
Exit code: 0 — confirms the report tool is preserved and non-blocking, distinct from the gate.

**4. Missing-reason marker** — changed the planted line to
`// design-tokens-allow: text-[13px]` (no reason after `—`):
```
    :2  [missing-reason:design-tokens-allow marker missing reason after —]  "text-[13px]"
    :2  [length:arbitrary px/rem utility]  "text-[13px]"

  Total: 1 raw style-value violation(s) | 0 stale-marker(s) | 1 missing-reason error(s)

❌  check:design-tokens — 1 design-tokens-allow marker(s) with missing or empty reason.
```
Exit code: 1.

**5. Stale marker** — changed the planted line to `className="text-base"` with
`// design-tokens-allow: text-[13px] — stale marker test` (marker value no longer present):
```
  ── OTHER  (1 finding) ──
  src/__scratch_task407/Scratch.tsx  (1)
    :2  [stale-marker:stale inline suppression (value not detected on this line)]  "text-[13px]"

  Total: 0 raw style-value violation(s) | 1 stale-marker(s) | 0 missing-reason error(s)

❌  check:design-tokens STRICT — 0 raw style-value violation(s) + 1 stale-marker(s) found.
```
Exit code: 1.

**6. Revert** — removed `src/__scratch_task407/` entirely. `npm run check:design-tokens`:
```
🔍  check:design-tokens — scanning 348 src/**/*.{tsx,ts,css} files
    (excludes globals.css, *.stories.tsx, *.test.tsx, and allowlisted paths)

  Total: 0 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)

✅  check:design-tokens — 0 violations found.
```
Exit code: 0. Tree restored — `git status --porcelain src/` shows no remaining scratch path.

---

## Self-validation

- `node --check scripts/check-design-tokens.mjs` → parses OK (file unchanged).
- `npx tsc --noEmit` → exit 0.
- `npm run lint` → exit 0, no new findings.
- `git status --porcelain scripts/check-design-tokens.mjs scripts/design-tokens-allowlist.json`
  → empty (both byte-identical to `6a0b9e623`).
- `node scripts/check-file-integrity.mjs` (default, git-changed + untracked) flags 2 pre-existing
  untracked artifacts (`task411-final-screenshots-assert.txt`, `task411-screenshots-assert.txt`,
  NUL bytes) — **not touched by this task**, pre-existing from a prior session's Cowork-mount
  artifact. The 4 files this task touches
  (`.github/workflows/governance-pr.yml`, `package.json`, `docs/design-system.md`,
  `docs/backlog.md`) are not flagged.

## Mobile <640 gate

**N/A — documented exemption.** This task touches only CI config (`.github/workflows/governance-pr.yml`),
npm scripts (`package.json`), and docs (`docs/design-system.md`, `docs/backlog.md`,
`docs/backlog-archive.md`, this session log). No rendered UI, component, locale string, or
breakpoint is touched. The mobile full-width gate and breakpoint × locale render matrix do not
apply.

---

## Epic JJ — COMPLETE

`check:design-tokens` is now blocking (strict, no baseline): any unsuppressed raw style-value
violation, missing-reason marker, or stale marker fails both the local script and the
`governance-pr` CI job. The gate landed green-on-flip on the already-clean tree (0 violations).
**Epic JJ — Project-Wide Design Variables (single-source tokens) — is complete.**

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `.github/workflows/governance-pr.yml` | Design-token step → `check:design-tokens:strict`, removed `continue-on-error: true`, renamed step | §1 — flip CI gate to blocking |
| `package.json` | `check:design-tokens` → `--strict`; added `check:design-tokens:report` → `--report` | §2 — local/CI script parity, preserve report tool |
| `docs/design-system.md` | §23 intro/contract rewritten (strict, no baseline, exemptions, escalation guardrail), §23.3 CLI-modes table updated, §23.4 rollout table +407 row, §23.5 closing line updated | §4 — document final blocking contract |
| `docs/backlog.md` | "Last Session" replaced with Task 407 summary; Epic JJ row marked CLOSED | Session log + backlog tidy rule |
| `docs/backlog-archive.md` | Added Task 408 row at top of ledger (moved from previous "Last Session") | Backlog tidy rule (move older session to archive) |
| `docs/sessions/2026-06-13-task407-design-tokens-strict-flip.md` | New session log (this file) | Session record |

No product code, detector logic, tokens, or other CI jobs touched. `scripts/check-design-tokens.mjs`
and `scripts/design-tokens-allowlist.json` are byte-identical to `6a0b9e623`.
