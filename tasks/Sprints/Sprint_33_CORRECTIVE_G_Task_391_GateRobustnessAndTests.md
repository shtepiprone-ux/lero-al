### Task 391 — Harden the Storybook gate: close Check-10 loopholes + add a TEST SUITE for all 10 checks

> # ✅ CORRECTION (2026-06-04). An earlier orchestrator note claimed `scripts/check-stories.mjs` was "truncated /
> a no-op". That was WRONG — a stale sandbox-mount read on the orchestrator side. The real file is COMPLETE
> (500 lines): Check 10 implemented (L437-481), verdict block with `process.exit(0/1)` (L486-499). The gate WORKS
> and fails the build on violations. **Do NOT "restore" or rewrite the script wholesale.** This task is pure
> hardening: close the remaining Check-10 detection loopholes and add automated tests for the gate.

> ## 🔴 GOAL (owner's bar): no small loophole for hardcode, AND every check covered by a test.

Type: corrective hardening — detection coverage + automated gate tests
Priority: HIGH (last hardening before Design System closure)

## Verified-real defects (independently tested against the actual file)
1. **Check 10 matches only DOUBLE-quote props.** L469: `/\b(title|description|label|placeholder|heading|subject|
   cta|alt|aria-label|name)\s*=\s*"([^"]*)"/`. Proven by test to MISS all of:
   - single-quote props: `title='Listings'`
   - expression props: `title={"Listings"}` / `title={'Listings'}`
   - template-literal props (no `${}`): `` title={`Listings`} ``
   - JSX text children: `<Button>Submit</Button>` / `<Section>Browse listings</Section>`
2. **No automated test suite for the gate.** A regression that turns any check into a no-op (bad edit, refactor)
   would pass silently — confirm whether `scripts/__tests__/check-stories.test.*` exists; if not, add it.

## Pre-read
`docs/agent-contract.md` (12,13) · `docs/storybook-governance.md` §14 · `scripts/check-stories.mjs` (read the
ACTUAL current file end-to-end first; it is complete — confirm before editing) · `vitest.config.ts` ·
`src/lib/phone/__tests__/phone.test.ts` (test style).

## Required after behavior
1. **Broaden Check 10** to flag Englishish user-facing literals in stories for ALL of: single OR double quotes;
   expression props (`={'…'}` / `={"…"}`); template-literal props with no interpolation (`` ={`…`} ``); and JSX
   text children (`>English words<`). Keep the existing `isEnglishish` diacritic/Cyrillic exclusion, the storyT/t()
   skip, and the `JSX_PROP_ALLOWLIST`. Each variant must be caught; true-negatives (storyT, Tirana, ë/ç, Cyrillic)
   must still pass.
2. **Add the gate TEST SUITE** `scripts/__tests__/check-stories.test.ts` (vitest). For EACH of the 10 checks: one
   KNOWN-BAD fixture asserted to make the gate exit non-zero / report that rule, and one KNOWN-GOOD fixture asserted
   to pass. Plus explicit tests for the 4 Check-10 variants above. Drive by invoking the script
   (`execFileSync('node', ['scripts/check-stories.mjs'], …)` against a temp fixture dir) OR refactor the checks into
   exported pure functions and unit-test them directly (preferred — also enables a "all 10 checks ran" assertion).
3. **(Optional robustness)** have the script assert it ran all expected checks before the verdict, so a future
   accidental early-return fails loudly. Nice-to-have, not the focus.
4. **Wire the test into `npm test` + CI** (`governance-pr.yml`) so the gate's own correctness is enforced.

## Files allowed to edit
`scripts/check-stories.mjs` (broaden Check 10 only — do NOT rewrite working checks; refactor-to-export is OK if it
keeps behavior); `scripts/__tests__/check-stories.test.ts` (new); `package.json` / `vitest.config.ts` (wiring);
`.github/workflows/governance-pr.yml`; `docs/storybook-governance.md` §14; `docs/backlog.md`; session log.

## Positive / Negative flow
Positive: clean repo → `node scripts/check-stories.mjs` prints all 10 checks + PASS, exit 0; `npm test` gate suite green.
Negative (each demonstrated by a test): single-quote / expression / template / JSX-text English literal → gate
exits 1; inline locale map → exit 1; uk value without Cyrillic → exit 1; each of checks 1-9 bad fixture → exit 1.

## Acceptance
- AC1 Check 10 catches all 4 variants (single-quote, expression, template, JSX-text) — test output proving each.
- AC2 `scripts/__tests__/check-stories.test.ts` exists; every one of the 10 checks has a bad-fixture (fails) and a
  good-fixture (passes) test; `npm test` green; wired into CI.
- AC3 On the real repo, `check:stories` still passes with the verdict line printed and exit 0 (full transcript).
- AC4 No working check was broken by the Check-10 broadening (run the full gate; 0 real violations).

## Validation
`node scripts/check-stories.mjs` (full output + exit code) · `npm test` · `npm run check:stories` · `npm run lint` ·
the per-variant Check-10 test output · planted-violation transcripts.

## Evidence format (Sprint 33 standard)
Command transcripts with exit codes are the proof. Report = AC table + full `check:stories` output (verdict line) +
the test-suite run (per-check bad/good) + the 4 Check-10 variant proofs + Files Changed table. NO `git add`/`commit`.
