# Task 429 — Mojibake gate: extend signature coverage + fix allowlist (rework of Task 428)

**Type:** governance/tooling (CI gate hardening + docs). NOT product code.
**Priority:** medium (closes blind spots in the Task 428 mojibake gate before it is committed).
**Executor:** Sonnet 4.6. **Single-writer git:** do NOT emit `git add`/`git commit`; the orchestrator emits commit commands at review.
**Origin:** Task 428 review (2026-06-15). Two defects found against the *committed-pending* Task 428 diff, both confirmed:
- **Signature blind spot.** `scripts/check-mojibake.mjs` `SIGNATURES` covers only the kickoff's literal "at minimum" list. It has **zero** coverage for `Ã«` (`ë`), `Ã§` (`ç`), the `Â…` family, or Cyrillic `Ð…/Ñ…` — even though the Task 428 kickoff prose named the `Â`/`Ð`/`Ñ` families, and this is an `sq` (Albanian `ë`/`ç` ubiquitous) + `uk` (Cyrillic locale) repo. A throwaway file containing `ShtÃ«pi` passes the gate (exit 0).
- **Unjustified allowlist entry.** `docs/backlog.md` is in `scripts/mojibake-allowlist.json` but contains **no** mojibake. Proven natively: removing the entry leaves the tree clean (`0 artifacts`, exit 0). The entry permanently de-protects the highest-churn governance file for no reason.

## Pre-read (rule-index: docs-only/governance + tooling)

- `docs/agent-contract.md` (P0 clauses, esp. clause 14 + the Task 428 companion-gate bullet).
- `docs/backlog.md`.
- `docs/orchestrator-role.md` (review checklist).
- `docs/ai-behavior.md` → "Pre-Completion Self-Validation (Note 18)".
- `scripts/check-mojibake.mjs` (the file you are extending — Task 428).
- `scripts/mojibake-allowlist.json` (the allowlist you are pruning).
- `docs/qa-rules.md` → "Encoding hygiene (UTF-8, mojibake gate — Task 428)".
- `messages/uk.json` (real Cyrillic — the false-positive reference set).

## Current behavior to preserve

- The existing Task 428 gate keeps working: scope roots, allowlist mechanism, `path:line:col` + snippet + hint output, exit 0/1 contract, `git ls-files --cached --others --exclude-standard` collection, overlap-masking, UTF-8 `fatal:true` decode → "Not valid UTF-8" branch.
- All other governance gates and the CI workflow step order stay unchanged. The `check:mojibake` step stays exactly where Task 428 placed it (after file-integrity).
- All 4 legitimately-allowlisted files stay allowlisted (`tasks/kickoff_prompt_Task_428_*`, `docs/sessions/2026-06-15-task426-*`, `docs/qa-rules.md`, `docs/sessions/2026-06-15-task428-*`). Only `docs/backlog.md` is removed.
- Existing valid UTF-8 (`→`, `✅`, `—`, `🔴`, real `ë`/`ç` in Albanian text, real Cyrillic in `uk`) MUST NOT be flagged. Re-confirm zero false positives on the whole clean tree.

## Required after behavior

1. **Extend `SIGNATURES`** in `scripts/check-mojibake.mjs` (keep the maintainable list form — no single mega-regex):
   - **Albanian accents:** `Ã«` (→ `ë` U+00EB), `Ã§` (→ `ç` U+00E7).
   - **`Â…` family (specific, not bare `Â`):** `Â ` (NBSP, U+00A0), `Â«`, `Â»`, `Â©`, `Â®`, `Â°`. Do NOT add bare `Â` alone (false-positive risk).
   - **Cyrillic `Ð…/Ñ…` family (paired bytes, not bare `Ð`/`Ñ`):** add the specific two-char CP1252-of-UTF-8 sequences for the common Cyrillic letters actually used in `uk` (e.g. `Ð°`,`Ð¸`,`Ð½`,`Ð¾`,`Ñ€`,`Ñ‚`,`Ð¿`,`Ð²`,`Ð´`,`Ð»`,`Ðµ`,`Ñ–`,`Ñ—`,`Ñ”` …). A bare `Ð`/`Ñ` signature is FORBIDDEN — it must be a multi-char sequence so properly-encoded Cyrillic never trips it.
   - If the correct Cyrillic signature set is genuinely ambiguous or you cannot bound the false-positive risk against `messages/uk.json`, **STOP and ASK the orchestrator** — do not guess (agent-contract clause 2).
2. **Allowlist surgery in `scripts/mojibake-allowlist.json`:** **remove** `"docs/backlog.md"` (proven to contain no artifact); keep the other 4 entries; **add** `"tasks/kickoff_prompt_Task_429_mojibake_signature_coverage_and_allowlist_fix.md"` (THIS kickoff quotes the new artifacts as examples and will trip the extended gate — same justified pattern as the Task 428 kickoff entry). Net: still path-scoped, never blanket.
3. **Docs:** if `docs/qa-rules.md` "Encoding hygiene" lists what the gate catches, add the new families (Albanian `ë`/`ç`, NBSP/`«»©®`, Cyrillic) to that list. No new user-facing UI string.
4. **Integrity transcript completeness:** the session log's file-integrity transcript MUST cover **every** touched file in the Files Changed table (Task 428's covered 7/9 — do not repeat that gap).

## Positive flow (happy path)

`npm run check:mojibake` on the current tree → with the extended signatures AND `docs/backlog.md` removed from the allowlist → still **0 non-allowlisted artifacts** across the real tree (real `ë`/`ç`/Cyrillic in locales NOT flagged) → prints `check:mojibake: 0 artifacts in N files` → exit 0. Post-condition: no repo state change; gate green in transcript.

## Negative flow (every off-happy-path branch)

- **Albanian artifact** — throwaway file containing `ShtÃ«pi` (bytes `53 68 74 C3 83 C2 AB 70 69`) and `Ã§mim`: scanner now reports `path:line:col` + hint, exit 1. (This is the test that exposed the Task 428 gap — it MUST now fail.) Remove the throwaway after; not part of the diff.
- **Cyrillic artifact** — throwaway containing a `Ð¿Ñ€…`-style sequence: reported, exit 1.
- **`Â…` artifact** — throwaway containing `Â ` (mojibake NBSP) or `Â©`: reported, exit 1.
- **False-positive guard (CRITICAL)** — run the extended gate against the untouched tree incl. `messages/uk.json` + Albanian text: **0 hits** on real `ë`/`ç`/Cyrillic. If any real locale string trips, the signature is too broad — STOP and narrow it.
- **Allowlist still real** — removing one of the 4 *kept* entries (e.g. the Task 426 log) still makes the gate FAIL on that file (proves allowlist not a no-op). `docs/backlog.md` removal leaves the tree clean (proves the removed entry was unneeded).
- **Binary / non-UTF-8 / empty-set** branches: unchanged from Task 428 (code inspection).

## Acceptance criteria

1. `scripts/check-mojibake.mjs` extended with `Ã«`, `Ã§`, the specific `Â…` set, and paired Cyrillic `Ð…/Ñ…` signatures; no bare `Â`/`Ð`/`Ñ`. Valid (`node --check`, 0 NUL, no BOM). → file:line per added signature.
2. Planted `ShtÃ«pi` / `Ã§` → exit 1 (paste transcript). Planted Cyrillic `Ð¿Ñ€…` → exit 1 (paste transcript). Planted `Â ` / `Â©` → exit 1 (paste transcript).
3. **Zero false positives:** full-tree run with extended signatures = `0 artifacts`, exit 0 — real `ë`/`ç`/Cyrillic in `sq`/`uk` NOT flagged (paste transcript naming `messages/uk.json` as in-scan-set).
4. `"docs/backlog.md"` removed from `scripts/mojibake-allowlist.json`; other 4 entries intact; tree still clean (exit 0). → diff.
5. `docs/qa-rules.md` "what it catches" list updated with the new families. **i18n: N/A** (no UI string). **Responsive matrix: N/A** (no rendered surface). State both.
6. File-integrity green on **every** touched file (full transcript, no 7/9 gap). `docs/backlog.md` + a `docs/sessions/` log added with a Files Changed table. No `git add`/`git commit` emitted by the executor.

## Out of scope

Do NOT mass-rewrite docs to strip legitimate UTF-8. Do NOT change product/runtime code, locales, CI step order, or other gates. Do NOT add bare single-char `Â`/`Ð`/`Ñ` signatures. Detection-coverage + allowlist-pruning only.
