# Task 447 — Raw-enum scanner false positives (attribute / interpolation / `tu()` variants)

**Date:** 2026-06-16
**Type:** tooling / governance (CI gate script)
**Status:** DONE — awaiting orchestrator diff review + commit emission

---

## Root Cause

`scripts/check-i18n-parity.mjs` Part-2 raw-enum scan over-reported two lines from the live codebase:

1. `src/components/admin/AdminInquiriesManager.tsx:288`
   ```tsx
   currentStatus={selected.status}
   ```
   A JSX **attribute value** — `StatusChangeControl` localizes it internally. The `{selected.status}` is preceded by `=`, not `>`, so it is not a JSX text render.

2. `src/components/admin/AdminSupportManager.tsx:124`
   ```tsx
   <Badge ...>{tu(`user_status_${user.status}` as `user_status_active`)}</Badge>
   ```
   The `{user.status}` appears inside a **template-literal interpolation** (`${user.status}`) building a translation KEY already inside the `tu()` translator call.

The scanner's skip guard only recognised literal `t(` substring — so `tu(`, `tSort(`, etc. were not treated as "already localized". And it had no guard for `=` (attribute) or `$` (template-interpolation) preceding the match.

---

## Fix

### AC1 — Attribute + interpolation guard (added to `scanRawEnumLeaks`)
```js
// Skip JSX attribute values (=…{x.field}) and template interpolations ($…{x.field})
&& !/[=$]\{[a-z_]+\.(role|status|plan|user_type)\}/.test(line)
```
- `currentStatus={selected.status}` → `=` precedes `{selected.status}` → guard fires → skipped ✅
- `${user.status}` → `$` precedes `{user.status}` → guard fires → skipped ✅
- `<span>{user.status}</span>` → `>` precedes `{user.status}` → guard does NOT fire → reported ✅

**Known limitation:** a line containing BOTH a real render AND an attribute/interpolation on the same physical line is silently skipped (AC1 fires on the attribute). Documented in the code comment; such mixed-concern lines are extremely rare in practice.

### AC2 — Generalised translator call guard (replaces literal `t(` checks)
```js
// Skip lines where the enum sits inside any translator variant (t(, tu(, tSort(, tStatus(, …)
&& !/\bt[A-Za-z]*\(\s*[`'"]/.test(line)
```
Replaces the old `!line.includes('t(`') && !line.includes("t('") && !line.includes('t("')` guards. Now any `t…(` call (e.g. `tu(`, `tSort(`) on the line is treated as "already localized".

### AC4 — Exported `scanRawEnumLeaks` helper
The Part-2 scan body was extracted into:
```js
export function scanRawEnumLeaks(content, relPath)
  → Array<{ line: number; text: string }>
```
The CLI entrypoint calls it for each file (unchanged behavior). The export enables the regression test to import and call it directly without file I/O.

---

## Regression Coverage (AC5)

**`scripts/__tests__/check-i18n-parity.test.ts` — 12 tests, all green**

```
✓ AC1 — JSX attribute value is NOT reported
  ✓ GOOD — currentStatus={selected.status} (attribute, =…{x.status}) → 0 findings
  ✓ GOOD — someProp={x.status} attribute form → 0 findings
✓ AC2 — translator variant tu() is NOT reported
  ✓ GOOD — tu(`user_status_${user.status}`) template-key interpolation → 0 findings
  ✓ GOOD — tSort(`status_${x.status}`) translator variant → 0 findings
  ✓ GOOD — standard t(`status_${x.role}`) → 0 findings
✓ AC3 — genuine raw-enum renders ARE reported
  ✓ BAD — <span>{user.status}</span> → exactly 1 finding
  ✓ BAD — <td>{entry.new_status}</td> → exactly 1 finding
  ✓ BAD — capitalize class with raw {x.role} → at least 1 finding
  ✓ BAD — line number in finding matches the actual source line
✓ edge cases
  ✓ empty content → 0 findings, no throw
  ✓ comment line with {user.status} → 0 findings (skipped)
  ✓ comparison {x.status} === … → 0 findings (already guarded)
```

### Planted-violation FAIL transcript (AC5)

Reverting BOTH AC1 and AC2 guards (setting guards to `true` so they never fire) produces:

```
FAIL  scripts/__tests__/check-i18n-parity.test.ts

  × GOOD — currentStatus={selected.status} (attribute, =…{x.status}) → 0 findings
    AssertionError: expected [ { line: 1, text: 'currentStatus={selected.status}' } ] to have a length of 0 but got 1
    → AC1 guard absent: attribute form matched by RAW_ENUM_PATTERNS pattern 1

  × GOOD — tu(`user_status_${user.status}`) template-key interpolation → 0 findings
    AssertionError: expected [ { line: 1, text: '...tu(`user_status_${user.status}`...)' } ] to have a length of 0 but got 1
    → AC1 guard absent: ${ } interpolation form matched; AC2 guard absent: tu() not recognized as translator
```

The test is not a no-op: both false-positive assertions FAIL when the guards are removed.

---

## AC Self-Audit

| AC | Status | Evidence |
|---|---|---|
| AC1 — Attribute + interpolation guard | ✅ | `[=$]\{...\}` regex added; attribute FP suppressed; `<span>{user.status}</span>` still caught |
| AC2 — Generalised translator variant guard | ✅ | `\bt[A-Za-z]*\(\s*[` regex added; `tu(`, `tSort(` suppressed |
| AC3 — True leaks still caught | ✅ | 3 BAD fixtures all report ≥1 finding |
| AC4 — `scanRawEnumLeaks` exported | ✅ | Test imports directly; CLI entrypoint unchanged |
| AC5 — Regression test + planted-violation | ✅ | 12 tests green; 2 FAIL transcripts documented above |
| AC6 — Gates green | ✅ | `tsc`=0; `lint`=0; `check:i18n` Part 2 = `✅ No suspicious raw-enum patterns detected`; vitest 12/12; `node --check` clean |
| AC7 — Session log + backlog updated | ✅ | This file; `docs/backlog.md` updated (447 done, next free: 448) |

---

## Gate Transcripts

**`npm run check:i18n`:**
```
── Part 1: Locale key-set parity ──────────────────────────────
  ✅ en  — 1821 keys (matches sq)
  ✅ uk  — 1821 keys (matches sq)
  ✅ it  — 1821 keys (matches sq)

── Part 2: Raw-enum leak scan ──────────────────────────────────
  ✅ No suspicious raw-enum patterns detected in .tsx files.

✅ Parity PASSED — all 4 locale files have identical key sets (1821 keys).
```

**`npx vitest run scripts/__tests__/check-i18n-parity.test.ts`:**
```
 Test Files  1 passed (1)
      Tests  12 passed (12)
   Duration  267ms
```

**`npx tsc --noEmit`:** 0 errors  
**`npm run lint`:** 0 violations  
**`node --check scripts/check-i18n-parity.mjs`:** clean

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `scripts/check-i18n-parity.mjs` | MODIFIED | Extracted Part-2 scan into exported `scanRawEnumLeaks(content, relPath)`; added AC1 (`[=$]` prefix guard) + AC2 (generalised `t…(` guard) |
| `scripts/__tests__/check-i18n-parity.test.ts` | NEW | 12-case regression test: 2 false-positive → 0 findings, 3 planted TRUE leaks → ≥1 finding, edge cases |
| `docs/backlog.md` | MODIFIED | Last session updated; task numbering 446→447; next free: 448 |
| `docs/sessions/2026-06-16-task447-raw-enum-scanner-false-positives.md` | NEW | This file |
