# Session Log — Task 398 — Story Coverage Gate + Scaffold

**Date:** 2026-06-06
**Executor:** Sonnet 4.6
**Status:** COMPLETE — pending orchestrator review + commit emission

---

## Summary

Built `check:story-coverage` gate (fail-on-new; tiered exemption allowlist) + `scaffold-story.mjs` (story generator). Wired into `package.json` + CI. All positive and negative flows machine-proven.

---

## AC-by-AC Self-Audit

| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| Gate exists | `check:story-coverage` enumerates components, matches stories, checks exemption allowlist | ✅ PASS | `node scripts/check-story-coverage.mjs` exits 0 on clean tree |
| Fail-on-new | Existing storyless components in allowlist; new ones fail | ✅ PASS | 72-entry seeded allowlist; gate exits 0 |
| Plant probe FAIL | `src/components/ui/__probe.tsx` with no story + no exemption → exit 1 naming it | ✅ PASS | See negative-flow transcript below |
| Add exemption → PASS | Adding `__probe.tsx` entry to exempt JSON → exit 0 | ✅ PASS | See negative-flow transcript below |
| Add real story → PASS | Adding `__probe.stories.tsx` → exit 0 | ✅ PASS | See negative-flow transcript below |
| Stale exemption flagged | Exemption entry pointing at non-existent file → warning + stale count | ✅ PASS | See negative-flow transcript below |
| Scaffold exists | `npm run new:story <path>` creates colocated `*.stories.tsx` | ✅ PASS | Generated `src/components/ui/separator.stories.tsx` |
| Scaffold passes check:stories | Generated story passes with 0 violations unmodified | ✅ PASS | `check:stories PASSED — 33 files checked, 0 violations` |
| Raw string → FAIL | Adding `aria-label="Divider line"` to scaffold → check:stories fails with `jsx-prop-literal` | ✅ PASS | See negative-flow transcript below |
| `node --check` | Both scripts parse | ✅ PASS | `check-story-coverage.mjs OK` · `scaffold-story.mjs OK` |
| 0 NUL bytes | All touched files | ✅ PASS | 0 NUL in all 6 files (see integrity transcript) |
| `tsc=0` | No new TypeScript errors | ✅ PASS | `npx tsc --noEmit` → 0 output |
| CI wired | `check:story-coverage` step in governance-pr.yml | ✅ PASS | Added after file-integrity gate |
| §15 documented | `docs/storybook-governance.md` §15 added | ✅ PASS | §15.1–§15.4 written |
| No git commands | Executor does not run git | ✅ PASS | Compliant |

---

## Negative-Flow Transcripts

### 1. Plant probe component with no story + no exemption → FAILS

```
📖  check:story-coverage — 97 component(s) in src/components/**
    ✅ 24 have a colocated *.stories.tsx
    📋 72 explicitly exempt (in allowlist)
    ❌ 1 uncovered and NOT exempt

❌  check:story-coverage FAILED — 1 component(s) have no story and no exemption entry:

    src/components/ui/__probe.tsx
```

### 2. Add exemption entry → passes

```
📖  check:story-coverage — 97 component(s) in src/components/**
    ✅ 24 have a colocated *.stories.tsx
    📋 73 explicitly exempt (in allowlist)
    ❌ 0 uncovered and NOT exempt

✅  check:story-coverage PASSED — all components are covered or explicitly exempt.
```

### 3. Add real story instead → passes

```
📖  check:story-coverage — 97 component(s) in src/components/**
    ✅ 25 have a colocated *.stories.tsx
    📋 72 explicitly exempt (in allowlist)
    ❌ 0 uncovered and NOT exempt

✅  check:story-coverage PASSED — all components are covered or explicitly exempt.
```

### 4. Stale exemption entry → flagged as warning

```
📖  check:story-coverage — 96 component(s) in src/components/**
    ✅ 24 have a colocated *.stories.tsx
    📋 72 explicitly exempt (in allowlist)
    ❌ 0 uncovered and NOT exempt
    ⚠️  1 stale exemption entry/entries (file no longer exists)

⚠️  Stale exemption entries (not a hard failure — clean up when convenient):
    src/components/ui/__nonexistent.tsx

✅  check:story-coverage PASSED (with 1 stale entry/entries — clean up).
```

### 5. Scaffold output passes check:stories immediately (0 edits)

```
npm run new:story src/components/ui/separator.tsx
✅  Story scaffold created: src/components/ui/separator.stories.tsx

node scripts/check-stories.mjs
✅ check:stories PASSED — 33 files checked, 0 violations.
```

### 6. Raw English string in scaffold → check:stories FAILS

After adding `aria-label="Divider line"` to the scaffold:

```
❌ check:stories FAILED — 1 violation(s):

  src/components/ui/separator.stories.tsx:32  [jsx-prop-literal]
    Hardcoded English literal in JSX prop aria-label="Divider line".
    Use storyT(locale, 'storybook.*') instead (§14.7).
```

---

## File Integrity Transcript

```
OK scripts/check-story-coverage.mjs (8270 bytes, 0 NUL, BOM=false)
OK scripts/scaffold-story.mjs (8165 bytes, 0 NUL, BOM=false)
OK scripts/story-coverage-exempt.json (10871 bytes, 0 NUL, BOM=false)
OK package.json (5133 bytes, 0 NUL, BOM=false)
OK .github/workflows/governance-pr.yml (2568 bytes, 0 NUL, BOM=false)
OK docs/storybook-governance.md (40418 bytes, 0 NUL, BOM=false)
All files integrity OK
```

```
check-story-coverage.mjs OK
scaffold-story.mjs OK
JSON parse OK  (story-coverage-exempt.json)
JSON parse OK  (package.json)
npx tsc --noEmit → 0 errors
```

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `scripts/check-story-coverage.mjs` | NEW | Story coverage gate: enumerates components, matches stories, checks exemption allowlist; fail-on-new exit 1 on uncovered+non-exempt components |
| `scripts/scaffold-story.mjs` | NEW | Scaffold generator: `npm run new:story <path>` creates colocated story skeleton that passes check:stories immediately |
| `scripts/story-coverage-exempt.json` | NEW | Tiered exemption allowlist: 72 entries seeded from current storyless components, each with a one-line justification |
| `package.json` | MODIFIED | Added `check:story-coverage`, `check:story-coverage:report`, `check:story-coverage:update-exempt`, `new:story` scripts |
| `.github/workflows/governance-pr.yml` | MODIFIED | Added `check:story-coverage` step to governance job (after file-integrity gate) |
| `docs/storybook-governance.md` | MODIFIED | Added §15 (§15.1 gate, §15.2 exemption allowlist, §15.3 scaffold, §15.4 CI wiring) |
| `docs/backlog.md` | MODIFIED | Updated Last Session + Task 398 status to COMPLETE |

---

## Self-Validation

- `check:story-coverage` PASS (96 components, 24 stories, 72 exempt, 0 missing)
- `check:stories` PASS (32 files, 0 violations)
- `check:i18n-hardcode` PASS (1 known baseline, 0 NEW)
- `node --check` PASS — both new scripts
- 0 NUL bytes, no BOM — all 6 touched files
- `tsc --noEmit` → 0 errors
- All 6 negative flows machine-proven (probe FAIL; exemption→PASS; story→PASS; stale flag; scaffold clean; raw-string FAIL)

**Self-validation: COMPLETE — all ACs met, all negative flows proven, integrity verified.**
