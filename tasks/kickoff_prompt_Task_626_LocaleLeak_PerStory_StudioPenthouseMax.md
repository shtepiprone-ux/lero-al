# Task 626 — Move `Studio` / `Penthouse` / `Max` from the global locale-leak allowlist into `PER_STORY_TOKENS` (restore honest mistranslation signal)

- **Task number:** 626
- **Epic:** MM — Mantine/TailAdmin Restyle (`tasks/Epics/Epic_MM_Mantine_UI_Migration.md`)
- **Sprint:** 45 (Mantine-migration governance tail)
- **Parent:** Task 625 landing (R5 was explicitly deferred there as a non-blocking follow-up; this is that follow-up). Originates from the Task 624 review **P2** finding.

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **CI / governance infrastructure (locale-leak detector allowlist).** Low product-code surface; changes what the locale-leak gate will and will not flag.
- QA profile: **Q0 Docs/Governance + mandatory planted-violation gate proof** (agent-contract clause 13) — same profile the parent tasks (Q0R / 624 / 625) used. The change alters a governance gate's detection semantics, so a planted-violation failure proof is mandatory.

## Objective

Stop the global `LEAK_ALLOWLIST` from masking three tokens (`Studio`, `Penthouse`, `Max`) that **do** have distinct localized forms (it `Monolocale`/`Attico`, sq `Maks`). Move them to `PER_STORY_TOKENS`, scoped only to the specific canonical stories that legitimately render them as raw fixture text (exactly as `Gas` is scoped to `mantine-primitives-filterspanelshell`). After the change the detector must still report **0 leaks** on the current tree, but a **mistranslation of these tokens in any other story must now be caught** instead of globally silenced.

## Verified context

Inspected `scripts/check-locale-leak.mjs` at HEAD-of-worktree (the Task 625 landing state):

- **Global allowlist, line 106:** `/^(Premium|Studio|Duplex|Penthouse)$/`. This is the block to narrow.
- **Global allowlist, line 112:** `/^(Min|Max)$/`. This is the second block to narrow (`Max`).
- **`PER_STORY_TOKENS` (lines 148–197)** is the destination map; matching is prefix-based via `isPerStoryAllowlisted(storyId, token)` (line 199): `storyId.startsWith(prefix) && tokens.includes(token)`.
- Existing precedent rows to copy the pattern from:
  - `'mantine-primitives-filterspanelshell': ['Gas']` (line 196) — the canonical "loanword scoped to one Mantine story" example named by the parent kickoff.
  - `'primitives-checkbox': ['Studio', 'Villa']` (line 154) and `'layout-filterbar': ['Studio']` (line 169) — **legacy-prefixed** Studio allowances that never matched Mantine story IDs.
- **Verified localized forms (parent-task assertion — the executor must re-confirm against `messages/*.json` before relying on it):** it translates `Studio`→`Monolocale` and `Penthouse`→`Attico`; sq spells `Max`→`Maks`. `Premium` and `Duplex` are genuine cognates in both sq and it and **stay global** (do not touch them).
- The detector currently reports **0 leaks / exit 0** in full `--mantine-only` mode (owner-native run, 2026-07-19, verified during the Task 625 review).
- Full run command: `npm run check:locale-leak:mantine-only` → `node scripts/check-locale-leak.mjs --mantine-only` (3 viewports). Fast pre-check: `node scripts/check-locale-leak.mjs --mantine-only --fast` (1 viewport). **Both require a built `storybook-static` and a Playwright Chromium browser** — treat these as owner-native runs if the sandbox lacks the browser (record the exact command + expected output for the owner, per agent-contract clause 9).
- The locale-leak **CI job** is warn-only since Task 625 (`continue-on-error: true`), but the script's own exit code stays honest. This task must **not** touch `governance-pr.yml` or the script's exit logic.

## Requirements

| ID | Source | Requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | 624 P2 / 625 R5 | Remove `Studio` and `Penthouse` from the global allowlist (line 106 → `/^(Premium\|Duplex)$/`) | P0 | Diff | Confirmed |
| R2 | 624 P2 / 625 R5 | Remove `Max` from the global allowlist (line 112 → `/^(Min)$/`) | P0 | Diff | Confirmed |
| R3 | Detector semantics | Add `Studio` / `Penthouse` / `Max` to `PER_STORY_TOKENS` **only** under the exact canonical story-ID prefixes that legitimately render each as raw fixture text; each entry carries a one-line justification comment | P0 | Diff + 0-leak run | Confirmed |
| R4 | Parent assertion | Re-confirm against `messages/*.json` that it uses `Monolocale`/`Attico` and sq uses `Maks`, so scoping is safe and the honest signal is real | P1 | Grep evidence in session log | Confirmed |
| R5 | Preserve | `Premium` and `Duplex` stay in the global allowlist unchanged; no other allowlist row edited | P0 | Diff | Confirmed |
| R6 | Gate proof | After the change, a planted **mistranslation** of one of these tokens in a story **not** covered by the new per-story entries is flagged (script names it, exits non-zero); restore byte-identical and re-verify clean | P0 | Planted-violation round-trip | Confirmed |
| R7 | Preserve | Full `check:locale-leak:mantine-only` still reports **0 leaks / exit 0** on the restored tree; `governance-pr.yml` and the script's exit logic untouched | P0 | Owner-native full run; diff | Confirmed |

## Assumptions and open questions

- **Assumption (reversible):** the only Mantine/canonical stories that render `Studio`/`Penthouse`/`Max` as raw text are a small set discoverable by removing the tokens from global and reading the detector's named leaks. The executor must **derive the exact prefix list empirically** (step 3 below), not guess it.
- **Open question (non-blocking):** if a token turns out to render in a story where it is a genuine cognate with no distinct localized form, keep it per-story there with a justification comment; if it renders where a real localized form exists and the story should use `storyT`, that is a **story bug** — record it as a follow-up finding, do **not** silence it by adding a per-story entry. Surface any such case in the session log rather than masking it.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 7, 9, 13).
- `docs/storybook-governance.md` (§14.9.x locale-leak policy; the new §14.9.22 warn-only note from Task 625).
- `docs/qa-profiles.md` (Q0 + planted-violation).
- `scripts/check-locale-leak.mjs` (the `LEAK_ALLOWLIST`, `PER_STORY_TOKENS`, `isEnglishish` regions).
- `messages/it.json` and `messages/sq.json` (confirm `Monolocale`/`Attico`/`Maks`).
- Parent context: `tasks/kickoff_prompt_Task_625_Q0R_WarnOnly_Landing.md` (R5 paragraph) and `docs/sessions/2026-07-19-task624-locale-leak-mantine-allowlist.md` (the P2 finding).

## Scope

1. In `scripts/check-locale-leak.mjs`, narrow the two global regex rows (R1, R2) to drop `Studio`, `Penthouse`, `Max`.
2. Add precise, comment-justified `PER_STORY_TOKENS` entries for each token, scoped to the exact story-ID prefixes that render it (R3), modeled on the `Gas` entry.
3. Update the affected allowlist comments (lines 102–112) so they no longer claim `Studio`/`Penthouse`/`Max` are globally safe.

## Out of scope

- The detector algorithm (`isEnglishish`, token-diff), `--mantine-only` scoping, viewport/locale matrices, timeouts, sharding — all forbidden (Q0R Q9 still holds).
- `Premium` and `Duplex` global entries — do not touch.
- `governance-pr.yml`, the warn-only CI policy, and the script's own exit-code logic — untouched.
- Any change to the actual story fixtures or `messages/*.json` values — this task only reclassifies allowlist entries. (A real story bug found under the open question is logged as a follow-up, not fixed here.)
- The legacy-prefixed `primitives-checkbox` / `layout-filterbar` Studio rows — leave as-is unless the empirical run proves they are now dead; if dead, note it, do not delete under this task.

## Current and required behavior

- **Current:** `Studio`, `Penthouse`, `Max` are globally allowlisted, so the comparison-based detector cannot flag them **anywhere** — including a story that wrongly renders raw "Penthouse" where it should show it `Attico`. The gate is silent on a whole class of real mistranslations.
- **Required after:** the three tokens are allowlisted **only** in the specific stories that legitimately show them as fixture text; everywhere else the detector treats a raw occurrence as a leak. The current tree still passes 0 leaks (the legitimate occurrences are covered), but the honest signal for future mistranslations is restored.

## Implementation requirements

1. Edit line 106 `/^(Premium|Studio|Duplex|Penthouse)$/` → `/^(Premium|Duplex)$/`.
2. Edit line 112 `/^(Min|Max)$/` → `/^(Min)$/`.
3. Run the detector to enumerate exactly which canonical story IDs now leak `Studio`/`Penthouse`/`Max`; for each legitimate one, add `PER_STORY_TOKENS['<exact-prefix>'] = [...]` with a one-line justification. Reuse an existing key if the prefix already exists (append the token, keep it sorted/readable).
4. Re-run until the full `--mantine-only` run is back to 0 leaks / exit 0 with **no global masking** of the three tokens.
5. Keep all touched files UTF-8, no BOM, `node --check`-clean.

## Positive and negative flows

**Positive:** narrow the two global rows → detector names the now-unmasked legitimate occurrences → add exactly those story prefixes to `PER_STORY_TOKENS` → full run returns 0 leaks / exit 0, with the three tokens no longer globally allowlisted.

**Negative-flow applicability table:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Planted mistranslation of `Penthouse`/`Studio`/`Max` in a non-scoped story | **Yes** | Detector semantics (R6) | Script names story+locale+token, exits non-zero | Planted round-trip |
| Token renders in a story with a real localized form that *should* use `storyT` | **Yes** | Open question | Log as a story-bug follow-up; do **not** add a per-story entry to silence it | Session-log finding |
| Removing from global now leaks the token in a legitimate fixture story | **Yes** | R3 | Add exact per-story prefix; re-verify 0 leaks | Full run |
| Empty canonical Mantine set / detector infra | No (untouched, Q0R Q9) | — | Unchanged hard-error path | N/A |
| `governance-pr.yml` CI wiring | No (out of scope) | Task 625 | Warn-only, unchanged | N/A |

## Acceptance criteria

- `AC1 [R1,R2,R5]` Given the global allowlist, when diffed, then line 106 is `/^(Premium|Duplex)$/` and line 112 is `/^(Min)$/`, and every other `LEAK_ALLOWLIST` row (incl. `Premium`/`Duplex`) is unchanged.
- `AC2 [R3]` Given each legitimate raw occurrence of `Studio`/`Penthouse`/`Max`, when the full `--mantine-only` detector runs, then it reports **0 leaks / exit 0**, and each token is covered by a comment-justified `PER_STORY_TOKENS` entry under an exact story-ID prefix (no global entry).
- `AC3 [R4]` Given `messages/it.json`/`sq.json`, when grepped, then it uses `Monolocale`/`Attico` and sq uses `Maks` (evidence pasted in the session log).
- `AC4 [R6]` Given a planted raw "Penthouse" (expression-child form, as Q0R/624/625 used to survive `check:stories`) in a canonical story **not** in the new per-story set, when the detector runs, then it names that story+locale+token and exits non-zero; after byte-identical restore + rebuild it returns to 0 leaks / exit 0.
- `AC5 [R7]` Given the final tree, when `git diff` is inspected, then `.github/workflows/governance-pr.yml` and the script's `process.exit` leak-branch are untouched.

## QA profile and verification plan

**Profile: Q0 Docs/Governance + mandatory planted-violation gate proof.** Record actual output for each:

1. `git diff -- scripts/check-locale-leak.mjs` → shows the two narrowed global rows + the new per-story entries only — AC1/AC2.
2. `grep -nE '"(Monolocale|Attico|Maks)"' messages/it.json messages/sq.json` → confirm forms — AC3.
3. `npm run build-storybook` → exit 0.
4. `npm run check:locale-leak:mantine-only` → **0 leaks, exit 0** (verbatim). *Owner-native if the sandbox has no Playwright Chromium — provide the exact command + expected "ZERO leaks across N stories" line for the owner to run.* — AC2.
5. Planted-violation round-trip: plant raw "Penthouse" as an expression-child in one non-scoped `Mantine/Primitives/*` story → `build-storybook` → `node scripts/check-locale-leak.mjs --mantine-only --fast` names it + exit ≠ 0 → restore byte-identical (`git diff --stat` empty) → `build-storybook` → re-run → 0 leaks / exit 0 — AC4. *(Rebuild between plant/restore and each run — the detector reads `storybook-static`, not source.)*
6. `npx tsc --noEmit` → 0 (sanity; no TS touched but confirm no accidental syntax break).
7. `git status --short` reconciliation — only `scripts/check-locale-leak.mjs` (+ the session log + backlog) should appear.

## Completion report contract

Write `docs/sessions/2026-07-19-task626-locale-leak-perstory-studio-penthouse-max.md` + a concise `docs/backlog.md` update (replace the "R5 deferred" note with the landed R5 state; keep the file ≤80 lines). Include: a Files Changed table matching the real diff; R1–R7 each with evidence; the verbatim 0-leak run; the `Monolocale`/`Attico`/`Maks` grep; the full planted-violation transcript naming exact story+locale+token; confirmation `governance-pr.yml` and the script exit logic are untouched; any story-bug follow-up found under the open question. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: exact lines (106/112), exact destination map, the `Gas` precedent, and the empirical discovery step are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope names what must not change (`Premium`/`Duplex`, `governance-pr.yml`, exit logic, story fixtures). ✅
- The gate change carries a mandatory planted-violation proof that asserts observable behavior (a real mistranslation is caught), not a procedural claim. ✅
- Negative flows are selected by applicability, including the "real story bug → log, don't silence" branch. ✅
- Every cited file/line/command was inspected in this session. ✅
