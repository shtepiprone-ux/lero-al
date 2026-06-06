# Session Log — Task 399 — Harden i18n-hardcode scanner: brace-literal evasion

**Date:** 2026-06-06
**Task:** 399 — `{'...'}` / `{"..."}` JSX expression-child string literal detection
**Executor:** Sonnet 4.6
**Status:** COMPLETE — pending orchestrator review + commit

---

## Summary

Extended `scripts/check-hardcoded-i18n.mjs` (Task 396 gate) to close a trivial evasion: wrapping a hardcoded JSX text child in an expression container (`{'VALUE'}`) made it invisible to the existing `JSX_TEXT_RE` pattern (which explicitly excludes `{…}` via `[^<>{}\n]+`). The new detection treats a bare string or no-interpolation template literal inside a JSX expression child exactly the same as a raw `>VALUE<` text child.

---

## AC-by-AC self-audit

| AC | Result |
|----|--------|
| `node --check scripts/check-hardcoded-i18n.mjs` passes | ✅ PASS |
| File complete (ends `\nrun();\n`) | ✅ PASS — tail: `…process.exit(1);\n}\n\nrun();\n` |
| 0 NUL bytes, no BOM | ✅ NUL=0, BOM=False |
| Brace-literal evasion detected (negative-flow transcript) | ✅ PASS — both `{'Evasion Probe'}` and `` {`Static Template Literal`} `` → exit 1, `[expr-child]` |
| No false positives on dynamic/translated | ✅ PASS — `{t('x')}`, `{name}`, `` {`Page ${n}`} ``, ternary → 0 findings |
| `check:i18n-hardcode` green on clean tree | ✅ EXIT 0 — 1 baseline entry, 0 NEW |
| Existing accepted entries preserved | ✅ `PasswordChangedEmail.tsx:66` "Ekipi i Lero.al" still the only entry |
| `docs/i18n-governance.md` §2 documents the new rule | ✅ Added §2 item 3 "JSX expression-child string literals" |
| `tsc --noEmit` = 0 errors | ✅ EXIT 0 |
| No `git add`/`commit` emitted | ✅ — orchestrator emits on review |

---

## Positive flow

Added `JSX_EXPR_CHILD_PATTERNS` (three regexes) after `JSX_TEXT_RE` in `check-hardcoded-i18n.mjs`:
- `(?<!=)\{[ \t]*'([^'\n{}]+)'[ \t]*\}/g` — `{'VALUE'}`
- `(?<!=)\{[ \t]*"([^"\n{}]+)"[ \t]*\}/g` — `{"VALUE"}`
- `(?<!=)\{[ \t]*`([^`\n${}]+)`[ \t]*\}/g` — `` {`VALUE`} `` (no `${…}`)

Added detection loop in `scanFile` after the existing `JSX_TEXT_RE` loop. Reports new findings with `kind: 'jsx-expr-child'` (shown as `[expr-child]` in output).

Updated tag labels in both the report and error output paths.

---

## Negative flow transcripts

### 1. Brace-literal evasion now caught

**Probe:** `src/components/ui/__probe.tsx`
```tsx
export function Probe() {
  return (
    <div>
      <button aria-label={'Evasion Probe'}>click</button>
      <span>{'Evasion Probe'}</span>
    </div>
  )
}
```

**Output:**
```
❌  check:i18n-hardcode FAILED — 2 NEW hardcode(s) not in baseline:

  src/components/ui/__probe.tsx:4  [aria-label]  "Evasion Probe"
  src/components/ui/__probe.tsx:5  [expr-child]  "Evasion Probe"
EXIT: 1
```

Line 4 — caught by existing `ATTR_PATTERNS` (attribute `aria-label={'...'}` was already covered).
Line 5 — caught by new `JSX_EXPR_CHILD_PATTERNS` as `[expr-child]` ✅

### 2. Template literal (no interpolation) caught

**Probe:** `<span>{`Static Template Literal`}</span>`

**Output:**
```
❌  check:i18n-hardcode FAILED — 1 NEW hardcode(s) not in baseline:

  src/components/ui/__probe.tsx:4  [expr-child]  "Static Template Literal"
EXIT: 1
```
✅ Caught.

### 3. No false positives on dynamic/translated forms

**Probe:** component using `{t('x')}`, `{name}`, `` {`Page ${n}`} ``, `{n > 0 ? 'a' : 'b'}`

**Output:** 1 finding total (only existing baseline entry `PasswordChangedEmail.tsx:66`). EXIT 0.
✅ Zero false positives on all four dynamic forms.

### 4. Gate green after probe deleted

```
✅  check:i18n-hardcode PASSED — 1 known finding(s) in baseline, 0 NEW.
EXIT: 0
```
✅

---

## Baseline status

No new true-positives surfaced on the clean tree (post-397). The baseline remains:
```json
{
  "src/modules/notifications/lib/emails/PasswordChangedEmail.tsx:66": {
    "kind": "jsx-text",
    "value": "Ekipi i Lero.al"
  }
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `scripts/check-hardcoded-i18n.mjs` | Added `JSX_EXPR_CHILD_PATTERNS` (3 regexes) + detection loop in `scanFile`; updated report/error tag labels for `kind: 'jsx-expr-child'` |
| `docs/i18n-governance.md` | §2 — added item 3 "JSX expression-child string literals"; §6 — marked Task 399 DONE |
| `docs/backlog.md` | Last Session updated; Task 399 status updated to COMPLETE |

---

## Self-validation

`node --check` = PASS · NUL = 0 · BOM = False · file-end complete · `tsc --noEmit` = 0 · gate = EXIT 0 on clean tree · negative-flow plants proven · integrity = PASS
