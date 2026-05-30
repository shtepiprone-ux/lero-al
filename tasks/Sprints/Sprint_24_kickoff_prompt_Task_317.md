# Sprint 24 — Task 317 kickoff (Epic II Phase 1 — Missing-key scanner script + `check:i18n-dynamic` wiring)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This task adds ONE governance SCRIPT (Node) + ONE `package.json` script entry. It does NOT touch production code or locale data. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (i18n + Notes 18), `docs/qa-rules.md`, `tasks/Epics/Epic_II_Global_i18n_Hardening.md`, `tasks/Sprints/Sprint_24_kickoff_prompt_Task_316.md` (Task 316 audit produces the per-call-site inventory this scanner formalises), existing `scripts/governance/` patterns (tailwind-entropy.mjs / scan-primitives.mjs / check-i18n.mjs if exists). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 317 is Epic II Phase 1 task #2. Ships AFTER Task 316 audit so the scanner formalises the inventory Task 316 manually produced.

---

```
Type:        governance script + npm script wiring (no production code, no locale data, no migration)
Priority:    HIGH (locks in Task 316 audit as a permanent CI guard; without it, dynamic-key gaps regress on every new enum value)
Area:        scripts/governance — i18n parity guard extension for dynamic t() calls
```

## Why this task exists

Task 316 (Phase 1) produces a one-off `docs/governance-reports/2026-05-31-i18n-dynamic-key-audit.md` manually enumerating every dynamic `t()` call + its source enum + per-locale missing-key matrix. That audit is **point-in-time** — it goes stale the moment a new enum value or new dynamic `t()` call lands.

Task 317 formalises the audit as a **CI-runnable script** that statically resolves dynamic `t()` calls against the source enums, then fails when any resolved key is missing in any locale. This is the parity guard the project is currently missing — the existing `check:i18n` validates key COUNT parity between locale files but does not statically resolve dynamic call sites against the enum source.

After Task 317:
- `npm run check:i18n-dynamic` (or extension of `check:i18n`) scans the repo, reads source enum union types from `src/types/database.ts` + ad-hoc string-union types in components, statically enumerates each dynamic `t()` template, and reports missing keys per locale.
- Phase 2 (Task 320) is unblocked — fills the gaps surfaced by the scanner.
- Phase 3 (Task 323) wires the script as a blocking CI gate.

## Goal

Implement `scripts/governance/i18n-missing-keys.mjs` (or `.cjs` if the existing governance scripts use CommonJS — match the pattern) that:

1. Scans `src/` (and optionally `messages/`) for every `t(\`...${var}\`)` and `t(\`...${expr}\`)` call.
2. For each call, parses the template literal into `prefix_${variable}_suffix` shape; identifies the variable's source enum union (recommended approach: read `src/types/database.ts` + manual config map for non-DB enums).
3. Enumerates every possible resolved key per call site.
4. Loads `messages/{sq,en,uk,it}.json`.
5. For each enumerated key, reports MISSING in any locale where it does not exist.
6. Exits non-zero if any missing key found; exits 0 if all 4 locales have every enumerated key.
7. Reports a clean summary table to stdout (per-file × per-locale missing-count breakdown).

Plus:
- Wire `npm run check:i18n-dynamic` in `package.json`.
- Document the script + the dynamic-`t()`-pattern requirements in `docs/i18n-rules.md` (which Task 316 created — extend it).
- Add allowlist support (`scripts/governance/i18n-missing-keys.allowlist.json`) for intentional exceptions — same pattern as `scripts/governance/tailwind-entropy.allowlist.json` from Task 283.

## Source-enum config strategy (orchestrator recommendation — STOP & ASK to confirm)

The scanner needs to know "for `t(\`role_${user.role}\`)`, what are the possible values of `user.role`?". Two strategies:

**Strategy A — Static TypeScript parser:** parse `src/types/database.ts` with `typescript` package, resolve the union type for each variable, enumerate union members. PROS: zero config drift. CONS: TS parser dependency added (or use `@swc/core` already in tree?), complex implementation.

**Strategy B — Hand-maintained config map:** `scripts/governance/i18n-missing-keys.config.json` mapping `{ "callSitePattern": ["enum_value_1", "enum_value_2"] }` (e.g. `{ "role_": ["user", "agent", "moderator", "admin"] }`). PROS: trivial implementation, zero new deps. CONS: drift risk if a new enum value lands and the config map is not updated — but this is acceptable if the config map itself is reviewed in every PR that adds an enum value.

**Default recommendation: Strategy B.** Simpler, faster to ship, drift caught by `check:schema-drift`-style discipline + PR review. STOP & ASK if Sonnet prefers A.

## Current behavior to preserve (Note 19 — extra-light for governance tasks)

This task adds new infrastructure; it does not change any user-visible behaviour. But it MUST NOT:
- Break the existing `npm run check:i18n` (parity-count guard) — extend or run alongside, never replace.
- Break the existing `npm run governance:tailwind` / `governance:primitives` (separate scanners).
- Add new dependencies without owner approval (prefer Node built-ins + existing deps).
- Modify any production code path.

## Required investigation (PASTE summary in session log)

```
# 1. Existing governance scripts pattern
ls -la scripts/governance/ scripts/check-* 2>&1
cat scripts/governance/tailwind-entropy.mjs | head -60
cat scripts/governance/scan-primitives.mjs | head -60 2>/dev/null
cat scripts/check-i18n.mjs 2>/dev/null || cat scripts/check-i18n* 2>/dev/null

# 2. Existing npm scripts
cat package.json | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)['scripts'], indent=2))"

# 3. Existing allowlist format (Task 283 precedent)
cat scripts/governance/tailwind-entropy.allowlist.json | head -40

# 4. Read Task 316 audit output to seed the scanner's expected call-site set
cat docs/governance-reports/2026-05-31-i18n-dynamic-key-audit.md | head -120
# (or whatever date Task 316 actually shipped)

# 5. Confirm available deps
cat package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('deps:', list(d.get('dependencies',{}).keys())[:20]); print('devDeps:', list(d.get('devDependencies',{}).keys())[:30])"
```

After investigation, paste:
- Which Strategy (A vs B) Sonnet recommends + 2-line rationale.
- Existing governance-script shape (CJS vs ESM, top-level args parsing, exit code convention).
- Whether existing `check:i18n` is parity-count only (most likely) or already does any dynamic resolution.

## STOP & ASK before writing the script

1. **Strategy A vs B** — confirm with orchestrator.
2. **Config map shape** (if Strategy B) — propose JSON shape; STOP & ASK if ambiguous.
3. **Allowlist semantics** — should the allowlist suppress one specific missing key per locale, or an entire call-site pattern?
4. **`check:i18n-dynamic` separate vs. fold into existing `check:i18n`** — recommend SEPARATE so existing parity-count guard stays intact; combined later in Task 323.
5. **CI wiring** — Task 317 wires `npm run check:i18n-dynamic` but does NOT wire it as a blocking CI gate (that is Task 323). Confirm.

## Scope (files Sonnet may touch)

- `scripts/governance/i18n-missing-keys.mjs` (NEW; or `.cjs` matching existing pattern)
- `scripts/governance/i18n-missing-keys.config.json` (NEW if Strategy B chosen)
- `scripts/governance/i18n-missing-keys.allowlist.json` (NEW — empty array initially)
- `package.json` — ADD one `"check:i18n-dynamic": "node scripts/governance/i18n-missing-keys.mjs"` entry; no other edits
- `docs/i18n-rules.md` — EXTEND (Task 316 created this) with: "Missing-key scanner" section (how to run, allowlist usage, config map maintenance)
- `docs/sessions/2026-05-31-task-317-i18n-missing-key-scanner.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- Any file under `src/`
- Any file under `messages/` (no locale changes — gap-filling is Task 320)
- Existing `scripts/check-i18n*` (do not replace; coexist)
- Other governance scripts
- Task 316 spec doc (extend; do not rewrite)
- DB / RLS / migrations
- Sprint 21 / 22 / 23 files

**Maximum SOURCE-FILE delta: 0** (zero `src/` files). Allowed deltas: 1 new mjs + 2 new JSON (config + allowlist) + `package.json` (1 line) + 1 docs extend + 1 session log + 1 backlog. Total: 7 files.

## Acceptance criteria (literal)

- `scripts/governance/i18n-missing-keys.mjs` exists and is executable via `node scripts/governance/i18n-missing-keys.mjs`.
- `npm run check:i18n-dynamic` runs the script and reports per-file × per-locale missing-key matrix; exit 0 when all enumerated keys present, exit non-zero when any missing.
- Config map (Strategy B) or static-resolution (Strategy A) approach picked + documented after STOP & ASK.
- Allowlist file exists (initially empty `[]`); allowlist entries follow `{ pattern, locale, reason, expires, reviewer }` shape mirroring tailwind allowlist.
- Existing `npm run check:i18n` (parity-count) continues to work unchanged.
- Existing `npm run governance:tailwind` / `governance:primitives` unchanged.
- `docs/i18n-rules.md` extended with "Missing-key scanner" section.
- `package.json` adds exactly ONE new script entry (no other edits to `package.json`).
- Zero source / locale changes.
- `npx tsc --noEmit` → 0 errors. `npm run build` → passes. `npm run lint` → 0/0. `npm run governance:tailwind` → C0/H0/M0.
- Running `npm run check:i18n-dynamic` reports missing keys that match the manual audit in Task 316.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n-dynamic ran (N missing keys reported, matches Task 316 audit) · src diff=empty · messages/ diff=empty · existing check:i18n unchanged · PASS`.

## Out of scope

- Filling the missing keys — Task 320 (Phase 2).
- Wiring as blocking CI gate — Task 323 (Phase 3).
- Notification locale-binding audit — Task 318 (Phase 1).
- Email / toast / modal i18n audit — Tasks 321 / 322 (Phase 2).
- Any change to `messages/*.json`.
- Any change to production code.
- Adding new dependencies (use Node built-ins + existing deps unless explicit STOP & ASK approval).

## Final report required

1. Files Changed table (≤7 files).
2. Strategy A vs B chosen + rationale.
3. Config/allowlist file format.
4. `npm run check:i18n-dynamic` output (paste verbatim — should match Task 316 audit's missing-key count).
5. Confirmation existing `check:i18n` + `governance:tailwind` + `governance:primitives` still work.
6. AC-by-AC self-audit table.
7. Confirmation no `src/` / `messages/` file edited.

Do NOT emit git commands. Do NOT run git. Do NOT touch source code or locale files. STOP & ASK on Strategy A vs B before writing the script.
