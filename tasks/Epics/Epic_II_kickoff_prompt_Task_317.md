# Epic II — Task 317 kickoff — Dynamic-key missing-key scanner + `check:i18n-dynamic` wiring (script + docs only)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. **SCRIPT + DOCS ONLY: a new governance script + npm wiring + a small checked-in manifest + a docs
> rule. NO product runtime-code changes (`git diff --stat src` MUST be empty).**
> Re-issue of `tasks/Sprints/Sprint_24_kickoff_prompt_Task_317.md`, refreshed 2026-06-13 to clauses 1–14 and to the
> **actual** Task 316 audit output. **Depends on Task 316 audit (now COMMITTED `65a97a8cc`).**

```
Type:        chore (governance script)
Priority:    high (Epic II Phase 1 — turns the one-time Task 316 audit into a permanent pre-build guard)
Area:        scripts/check-i18n-dynamic.mjs (NEW) + scripts/i18n-dynamic-manifest.json (NEW) +
             scripts/i18n-dynamic-baseline.json (NEW) + package.json (scripts) + docs/i18n-rules.md (NEW)
Output:      a manifest-driven scanner that checks every dynamic t() resolved key against all 4 locale files and
             FAILS on any non-baselined miss; wired as `npm run check:i18n-dynamic`. Reports only — fixes nothing.
```

## Goal

Make the Task 316 finding permanent: a scanner that, on every run, verifies that **every key reachable from a dynamic
`t()` call site exists in all four locale files (`sq/en/uk/it`)**, and exits non-zero with a precise per-key/per-locale
report on any miss. This catches the dynamic-key class that `npm run check:i18n` (count-only parity) cannot see — the
exact class that produced the live `admin.support.user_status_*` leak.

## Pre-read (mandatory — do NOT "read all docs")

1. **Always:** `docs/agent-contract.md` (clauses **1–14**) · `docs/backlog.md`.
2. **`docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md`** (Task 316 output — the authoritative source). Its
   **§2 table** (resolved key sets per `(namespace, source enum)`) is the seed for this task's manifest; its **§1a/§1b**
   reachability notes (`error_phone_country_mismatch` dead union member; `floors_total` non-`t()` case) define what the
   scanner must and must NOT treat as a key.
3. `docs/ai-behavior.md` → "Localization (i18n) Rules" + `docs/qa-rules.md` + `docs/governance-enforcement.md` (how
   existing governance scripts are wired).
4. **Existing script conventions to MATCH and COMPOSE with (read before writing a line):**
   - `scripts/check-i18n-parity.mjs` (flatten + 4-locale diff — reuse its flatten helper; do NOT re-implement parity).
   - `scripts/check-hardcoded-i18n.mjs` + `scripts/i18n-hardcode-baseline.json` (the canonical **baseline** +
     `--report` / `--update-baseline` pattern — your baseline file mirrors this exactly).
   - `scripts/check-locale-leak.mjs` for the exit-code + console-report shape.
   - `package.json` `check:*` block for the npm-script naming/flag convention.

## Architecture decisions (DECIDED by the orchestrator — do NOT re-invent; if any is blocking, STOP & ASK)

1. **Manifest-driven, NOT AST enum-resolution.** Robust static resolution of 83 heterogeneous TS enums/arrays/objects is
   fragile and out of proportion for this task. Instead create **`scripts/i18n-dynamic-manifest.json`** — a checked-in,
   reviewable list seeded from audit §2. Each entry: `{ "id", "site": "File.tsx:line", "namespace", "keys": [...],
   "note?" }` where `keys` are the **bare** keys (the scanner prefixes `namespace.`). The scanner checks every
   `namespace.key` in the manifest against all 4 locale files. The manifest is the human-maintained source-of-truth that
   the docs rule (below) requires devs to update when they add an enum value.
2. **Flat script path `scripts/check-i18n-dynamic.mjs`** (NOT `scripts/governance/…` — there is no such dir; all existing
   `check-*.mjs` are flat in `scripts/`). Match the established convention.
3. **Baseline for the ONE known gap so the gate ships green.** The audit found exactly one live miss
   (`admin.support.user_status_{active,blocked,inactive}`, 3 keys × 4 locales). Epic sequencing puts the fix in Task 320
   (Phase 2), AFTER this task. So seed **`scripts/i18n-dynamic-baseline.json`** with exactly those 3 keys, each annotated
   `"owner": "Task 320 — remove this entry when filled"`. The scanner treats baselined misses as a known-debt WARN (exit
   0); any **non-baselined** miss is an ERROR (exit non-zero). This mirrors `check-hardcoded-i18n.mjs` precisely and keeps
   Phase 1 shippable standalone.
4. **Reachability fidelity (from audit §1a/§1b):** do NOT add `admin.user_profile.validation.error_phone_country_mismatch`
   to the manifest (dead union member, never reaches `t()` — audit §1a). Do NOT add a key for `floors_total` (it is a
   non-`t()` raw label — audit §1b; out of this scanner's scope). The manifest enumerates **reachable** keys only, exactly
   as audit §2 lists them.
5. **CI wiring: PROPOSE only, do NOT make it blocking.** Add the npm script and a one-paragraph proposal in the session
   log for how Task 323 should wire it into CI. Making it a blocking CI gate is **Task 323 + owner sign-off** — out of
   scope here. (If you believe it must be blocking now, STOP & ASK.)

## Positive flow (happy path)

- **Actor:** a developer (or CI) runs `npm run check:i18n-dynamic` on the current `main` tree.
- **Preconditions:** manifest seeded from audit §2; baseline seeded with the 3 known `admin.support.user_status_*` keys.
- **Steps & system responses:**
  1. Scanner loads `messages/{sq,en,uk,it}.json`, flattens each (reusing the parity script's helper).
  2. Loads `scripts/i18n-dynamic-manifest.json` and `scripts/i18n-dynamic-baseline.json`.
  3. For every manifest entry, for every `namespace.key`, checks presence in all 4 locales.
  4. Classifies each miss: in baseline → WARN line (known debt, names the owning task); not in baseline → ERROR line.
  5. Prints a grouped report (per namespace → per key → per missing locale), then a summary
     (`X keys checked · Y locales · Z baselined-warns · N errors`).
- **Success state:** with the seeded baseline, **N errors = 0 → exit 0**; the 12 baselined cells print as WARN with the
  `Task 320` owner tag.
- **Post-conditions:** no files written (read-only run); `--report` prints the same without changing exit semantics;
  `--update-baseline` (mirroring the hardcode script) regenerates the baseline file from current misses (used only when
  the owner intentionally accepts new debt — documented, not used in this task).

## Negative flow (every off-happy-path branch)

- **Planted non-baselined miss (the gate-is-real proof — MANDATORY):** temporarily delete one manifest-enumerated key
  (e.g. `listing.property_type_garage`) from `messages/en.json`, run the scanner → it prints an ERROR for that key/locale
  and **exits non-zero**; restore the key; re-run → exit 0. Paste both transcripts in the session log.
- **Baselined miss stays green:** confirm the 3 `admin.support.user_status_*` keys (absent in all 4) produce WARN, not
  ERROR, and exit stays 0 — proving the baseline mechanism works.
- **Manifest references a non-existent locale-file path / malformed JSON:** scanner fails fast with a clear message and a
  non-zero exit (not a silent pass). Plant a malformed manifest entry to prove it; restore.
- **Empty/missing manifest or baseline file:** scanner exits non-zero with a clear "manifest not found / unreadable"
  message (never a false green).
- **Stale baseline entry (key now present but still baselined):** scanner prints an INFO/WARN "baseline entry no longer
  needed — remove (owner: Task 320)" so baselines don't rot. (Exit code unaffected; advisory.)
- **`--report` flag:** prints the full report but **always exits 0** (advisory mode), distinct from the default blocking
  run — same convention as `check:i18n-hardcode:report`.

## Acceptance criteria (each maps to a flow above)

- `scripts/check-i18n-dynamic.mjs`, `scripts/i18n-dynamic-manifest.json`, `scripts/i18n-dynamic-baseline.json` exist;
  `npm run check:i18n-dynamic` runs and **exits 0** on the current tree (Positive flow success state), with the 12
  `admin.support.user_status_*` cells reported as `Task 320`-owned WARNs.
- `package.json` adds `check:i18n-dynamic` (blocking default), `check:i18n-dynamic:report` (advisory, exit 0), and
  `check:i18n-dynamic:update-baseline` — matching the existing `check:i18n-hardcode*` trio.
- Manifest covers **all 83 sites' resolved key sets from audit §2** (verify count of distinct `namespace.key` entries
  against §2; state the number in the log). Reachability exclusions §1a/§1b honored (no `error_phone_country_mismatch`,
  no `floors_total`).
- **Negative-flow transcripts pasted:** (1) planted non-baselined miss → FAIL → restore → PASS; (2) baselined miss → WARN
  + exit 0; (3) malformed/missing manifest → non-zero. (Positive + Negative flow parity — clause 6a.)
- **Canonical rule documented in `docs/i18n-rules.md` (NEW):** every dynamic `t()` call MUST cite its source enum, and
  every reachable enum value MUST appear in `scripts/i18n-dynamic-manifest.json` (which CI checks). Link it from
  `docs/ai-behavior.md` i18n section (one-line pointer; do not duplicate the rule body).
- **No product runtime-code changes** — `git diff --stat src` empty; only `scripts/**`, `package.json`, `docs/**`.
- **Clause 11/12/13 N/A** (no UI / no story / no breakpoint rendered) — state explicitly in the session log; the mobile
  <640 full-width gate and the breakpoint × locale matrix do not apply.
- **Clause 14 (file-integrity):** after writing each new file, read it back; before claiming complete, paste the GREEN
  integrity transcript for every touched file — `tr -cd '\000' < f | wc -c` = 0, no BOM, `node --check` on the `.mjs`,
  `JSON.parse` (via `node -e`) on each `.json`. A claimed green contradicted by a NUL/unparseable file = TASK FAILURE.
- `tsc` is N/A for a `.mjs` script; `lint` clean for the new file; `docs/backlog.md` + a session log under
  `docs/sessions/` updated; **"Files Changed" table present**; **executor emits NO git** (orchestrator commits on review).

## Out of scope

- **Filling** any missing key (that is Task 320 — this scanner only reports/baselines).
- Making the check a **blocking CI gate** (Task 323 + owner sign-off).
- The notification wrong-locale fix (Task 319) and its audit (Task 318).
- Rewriting / replacing `check:i18n` parity — **compose** with its flatten helper, don't duplicate or supersede it.
- AST-based enum auto-discovery — explicitly rejected in favor of the reviewable manifest (decision 1 above).
