# Epic II — Task 423 kickoff — Harden `check-i18n-dynamic.mjs` manifest/baseline validation (script + docs only)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. **SCRIPT + DOCS ONLY: tighten the runtime validation inside an existing governance script + update
> one docs rule. NO product runtime-code changes (`git diff --stat src` MUST be empty). NO change to manifest/baseline
> DATA (no key/namespace/locale/owner content edits — see Architecture decision 1).**
> Non-blocking hardening follow-up to **Task 317** (APPROVED 2026-06-13). Both items were raised by the owner at Task 317
> review and confirmed real against the code.

```
Type:        chore (governance-script hardening)
Priority:    medium (Epic II — closes two soft spots in the Task 317 dynamic-key gate; non-blocking)
Area:        scripts/check-i18n-dynamic.mjs (EDIT — validation only) + docs/i18n-rules.md (EDIT — document mandatory fields)
Output:      the scanner fails fast (non-zero, clear message) on (a) a manifest entry missing `id` or `site`, and
             (b) a baseline entry missing `owner` or carrying the `UPDATE ME` placeholder. Current tree still exits 0.
```

## Goal

Close the two validation gaps the owner flagged at Task 317 review:

1. **Manifest entries must carry an `id` AND a `site`.** Today the scanner validates only `namespace` (non-empty string)
   and `keys` (non-empty array of non-empty strings) — `check-i18n-dynamic.mjs` lines ~90–99. `id` and `site` are part
   of the documented manifest entry shape (Task 317 architecture decision 1) and are what make a miss diagnosable
   ("which call site owns this key?"), but a typo that drops either currently passes silently.
2. **Baseline entries must carry a real `owner` and must NOT use the `UPDATE ME` placeholder.** Today `owner` is optional
   (`base.owner ?? 'no owner'`, line ~162) and `--update-baseline` literally writes `owner: 'UPDATE ME — owning task'`
   for new entries (line ~203) — which then PASSES the gate, so un-owned debt can ship. After this task an un-owned or
   placeholder-owned baseline entry FAILS the gate, forcing the dev to assign an owning task before the entry can mask a
   miss.

This keeps the gate self-enforcing: regenerate the baseline → the new entries are placeholder-owned → the next normal
run FAILS until a real owner is assigned.

## Pre-read (mandatory — do NOT "read all docs")

1. **Always:** `docs/agent-contract.md` (clauses **1–14**) · `docs/backlog.md`.
2. **`scripts/check-i18n-dynamic.mjs`** — read the whole file first; this task edits its validation blocks only.
3. **`scripts/i18n-dynamic-manifest.json`** + **`scripts/i18n-dynamic-baseline.json`** — confirm the current data already
   satisfies the new rules (all 33 entries have non-empty `id`+`site`; all 3 baseline entries have a real, non-placeholder
   `owner`). This is WHY the task is additive-validation-only and ships green — do NOT edit their data.
4. **`docs/i18n-rules.md`** — the rule doc to update (document the now-mandatory `id`/`site`/`owner` fields + no-placeholder
   rule).
5. **Convention match (read before writing a line):** `scripts/check-hardcoded-i18n.mjs` (its baseline `owner` convention
   and `--update-baseline` shape) and `scripts/check-i18n-parity.mjs` (style). `docs/qa-rules.md` for the gate-report shape.

## Architecture decisions (DECIDED by the orchestrator — do NOT re-invent; if any is blocking, STOP & ASK)

1. **Additive validation ONLY — zero data edits.** All 33 manifest entries already carry non-empty `id`+`site`; all 3
   baseline entries already have real owners (`Task 320 — …`, not the placeholder). Therefore this task adds validation
   code + docs ONLY. You MUST NOT add/remove/rename any manifest `namespace`/`keys` pair, nor change any baseline
   `key`/`locales`/`owner`. The gate MUST still exit 0 on the current tree (12 baselined WARNs, 0 errors). If you find an
   entry that actually violates a new rule, STOP & ASK — do not "fix" the data under cover of this task.
2. **Where the checks live: structural validation, fail-fast, BEFORE the coverage scan.** Add the new manifest checks to
   the existing per-entry validation loop (the same loop that today rejects a missing `namespace`/`keys`). Add the new
   baseline check as a new structural-validation block right after the baseline is parsed (lines ~108–114), BEFORE the
   `missingByKey` scan. A structural failure prints a single `❌ check:i18n-dynamic — …` line and `process.exit(1)` — same
   shape as the existing malformed-manifest / missing-file errors. These are STRUCTURAL failures (bad config), distinct
   from the per-locale WARN/ERROR key-coverage classification — do not fold them into the WARN/ERROR counters.
3. **`id` rules:** every entry's `id` must be a non-empty string. Additionally enforce **`id` uniqueness across entries**
   (two entries with the same `id` make diagnostics ambiguous) — duplicate `id` → fail fast. `site` must be a non-empty
   string (format is free-text `File.ext:line`; do NOT regex-validate the path — non-empty is enough; over-strict path
   validation is out of scope).
4. **Baseline `owner` rules:** every baseline entry must have a non-empty string `owner`, and that `owner` MUST NOT match
   the placeholder sentinel (case-insensitive `/UPDATE ME/`). Either condition → fail fast, non-zero, with a message that
   names the offending key and tells the dev to set a real owning task. Define the placeholder sentinel as a single named
   constant reused by both the validator and `--update-baseline` (single source of truth).
5. **`--update-baseline` stays self-rejecting (do NOT silently fix it to require a flag).** Keep `--update-baseline`
   writing the placeholder owner for NEW entries (it still preserves an existing real owner). Because decision 4 now
   rejects that placeholder on a normal run, a freshly regenerated baseline with un-owned entries FAILS until the dev
   assigns a real owner — that is the intended self-enforcing loop. The `--update-baseline` run ITSELF still exits 0
   (it is an explicit write action), but it MUST print a clear notice: "N new entry(ies) written with placeholder owner —
   assign an owning task before the gate will pass." Do NOT add an `--owner=` flag (rejected — keeps ergonomics; existing
   real owners are already preserved).
6. **No new doc file.** Update the EXISTING `docs/i18n-rules.md` (add `id`/`site` mandatory + baseline `owner` mandatory +
   no-`UPDATE ME` to the manifest-maintenance and baseline sections). Do not create a second doc.

## Positive flow (happy path)

- **Actor:** a developer (or CI) runs `npm run check:i18n-dynamic` on the current `main` tree (post-Task-317).
- **Preconditions:** all 33 manifest entries carry non-empty `id`+`site`; all 3 baseline entries carry a real,
  non-placeholder `owner`.
- **Steps & system responses:**
  1. Scanner loads the 4 locale files, the manifest, and the baseline (unchanged).
  2. **NEW** structural validation: every manifest entry has non-empty `id` (unique) + `site`; every baseline entry has a
     non-empty, non-placeholder `owner`. All pass.
  3. Coverage scan + WARN/ERROR classification run exactly as today.
- **Success state:** structural validation passes → 12 baselined `admin.support.user_status_*` WARNs → **0 errors →
  exit 0** (identical to Task 317's success state; no regression).
- **Post-conditions:** no files written on a normal run; `--report` unchanged (advisory, exit 0); `--update-baseline`
  writes the baseline AND prints the placeholder notice from decision 5.

## Negative flow (every off-happy-path branch — each transcript pasted in the session log)

- **Manifest entry missing `id`:** temporarily delete `"id"` from one entry → `❌ … malformed manifest entry … "id" must
  be a non-empty string` + **exit 1**; restore → exit 0.
- **Manifest entry missing `site`:** temporarily delete `"site"` from one entry → `❌ … "site" must be a non-empty string`
  + **exit 1**; restore → exit 0.
- **Duplicate `id`:** temporarily set two entries to the same `id` → `❌ … duplicate manifest entry id "<id>"` + **exit 1**;
  restore → exit 0.
- **Baseline entry missing `owner`:** temporarily delete `"owner"` from one baseline entry → `❌ … baseline entry
  "<key>" must have a non-empty "owner"` + **exit 1**; restore → exit 0.
- **Baseline entry with `UPDATE ME` placeholder:** temporarily set a baseline `owner` to `"UPDATE ME — owning task"` →
  `❌ … baseline entry "<key>" still has the placeholder owner — assign an owning task` + **exit 1**; restore → exit 0.
- **`--update-baseline` self-enforcing loop:** plant a non-baselined miss (delete a manifest key from `messages/en.json`),
  run `--update-baseline` (writes a new placeholder-owned entry, exit 0, prints the placeholder notice), then run the
  normal gate → it **FAILS** on the placeholder (exit 1); set a real owner → passes; then restore both the baseline and
  `messages/en.json` to their seeded state (confirm `git diff --stat scripts/i18n-dynamic-baseline.json messages` empty).
- **Regression proof (Task 317 branches still hold):** re-paste at least (a) planted non-baselined miss → exit 1 →
  restore → exit 0, and (b) malformed `namespace`/missing manifest → exit 1, to prove the new validation did not break the
  existing behavior.

## Acceptance criteria (each maps to a flow above)

- `scripts/check-i18n-dynamic.mjs` now rejects, with a clear `❌` message and **non-zero exit**, each of: manifest entry
  missing/empty `id`; duplicate `id`; manifest entry missing/empty `site`; baseline entry missing/empty `owner`; baseline
  entry whose `owner` matches `/UPDATE ME/i`. (Negative flow, each branch verifiable at file:line.)
- **No regression:** `npm run check:i18n-dynamic` on the current tree still **exits 0** with the 12
  `admin.support.user_status_*` baselined WARNs (Positive flow success state).
- **No DATA change:** `git diff scripts/i18n-dynamic-manifest.json scripts/i18n-dynamic-baseline.json` shows **no
  semantic change** to any `namespace`/`keys`/`key`/`locales`/`owner` (decision 1). The only code change is in
  `check-i18n-dynamic.mjs`; the only other change is `docs/i18n-rules.md`.
- `--update-baseline` still writes the baseline (exit 0) and prints the decision-5 placeholder notice; a regenerated
  placeholder-owned entry then FAILS a normal run (self-enforcing loop demonstrated in the log).
- **Negative-flow transcripts pasted** for every branch above + the two Task 317 regression branches (clause 6a — Positive
  + Negative parity).
- **Docs:** `docs/i18n-rules.md` updated to state that every manifest entry MUST carry a unique `id` + a `site`, and every
  baseline entry MUST carry a real `owner` (no `UPDATE ME` placeholder), enforced by `npm run check:i18n-dynamic`. No new
  doc file; no rule-body duplication elsewhere (a one-line pointer already exists in `docs/ai-behavior.md` from Task 317 —
  do not add another).
- **No product runtime-code changes** — `git diff --stat src` empty; only `scripts/check-i18n-dynamic.mjs` + `docs/**`.
- **Clause 11/12/13 N/A** (no UI / no story / no breakpoint rendered) — state explicitly in the session log; the mobile
  <640 full-width gate and the breakpoint × locale matrix do not apply.
- **Clause 14 (file-integrity):** after editing each file, read it back; before claiming complete, paste the GREEN
  integrity transcript for every touched file — `tr -cd '\000' < f | wc -c` = 0, no BOM, `node --check` on the `.mjs`,
  and (since you edit the script) re-run `node scripts/check-i18n-dynamic.mjs` to confirm exit 0. A claimed green
  contradicted by a NUL/unparseable/truncated file = TASK FAILURE.
- `tsc` is N/A for a `.mjs` script; `lint` clean for the edited file; `docs/backlog.md` + a session log under
  `docs/sessions/` updated; **"Files Changed" table present**; **executor emits NO git** (orchestrator commits on review).

## Out of scope

- **Editing manifest key coverage** (adding/removing/renaming any `namespace`/`keys` pair) — that is ordinary manifest
  maintenance, not this task. If a real data violation is found, STOP & ASK.
- **Filling** any missing locale key (Task 320) — this scanner only reports/baselines.
- Making the check a **blocking CI gate** (Task 323 + owner sign-off).
- Changing the per-locale **WARN/ERROR classification** or the stale-baseline INFO logic — untouched.
- Adding an `--owner=` flag to `--update-baseline` (explicitly rejected — decision 5).
- AST-based enum auto-discovery (rejected at Task 317).
