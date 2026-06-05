# i18n Hardcode Governance — Lero.al

**Established:** 2026-06-05 (Task 396, Sprint 34)
**Status:** PERMANENT GOVERNANCE REFERENCE

---

## §1 — PURPOSE

This document governs the static i18n hardcode scanner added by Task 396.

Two complementary gates protect against hardcoded English user-facing strings:

| Gate | Scope | Tool | Trigger |
|---|---|---|---|
| Render-based (`check:locale-leak`) | 29 story-covered components | Playwright + DOM diff | Storybook build / CI |
| Static (`check:i18n-hardcode`) | ALL 344 `src/**/*.tsx` files | AST/regex scan | Every PR via CI |

The static gate is **story-independent** — it covers the ~109 components with no story that the render gate cannot see.

---

## §2 — SCANNER: `scripts/check-hardcoded-i18n.mjs`

### What it scans

All `src/**/*.tsx` (and `.ts` where JSX/HTML strings appear), excluding:
- `*.stories.tsx` (covered by `check:stories`)
- `*.test.tsx` / `*.test.ts` (test fixtures)
- `src/stories/` directory (Storybook helpers)

### Detection scope

1. **JSX prop attributes** carrying user-facing text:
   `aria-label`, `aria-description`, `aria-placeholder`, `aria-roledescription`,
   `title`, `placeholder`, `alt`, `label`

2. **JSX text children** on the same line (the `>TEXT<` form):
   - Covers `sr-only` span content
   - Covers visible JSX prose (email templates, admin labels)
   - Excludes `{…}` expressions (already a JS value)

### String-form coverage

For each watched attribute, all four literal forms are detected:
- `attr="VALUE"` — double-quote
- `attr='VALUE'` — single-quote
- `attr={"VALUE"}` or `attr={'VALUE'}` — JSX expression string
- `` attr={`VALUE`} `` — JSX expression template literal (no interpolation)

Lines containing `t(`, `useTranslations`, or `storyT(` are skipped (already localized).

### `isEnglishish()` heuristic

A value is flagged only when it:
- Starts with ASCII uppercase A–Z
- Contains ≥ 3 ASCII alpha characters
- Contains NO non-ASCII accented/diacritic/Cyrillic characters

This filters out Albanian (ë/ç), Italian (à/è), Ukrainian (Cyrillic), and
pure-numeric / symbol-only values.

**Known limitation:** pure-ASCII Albanian text (e.g. `"Ekipi i Lero.al"`,
`"Tregu kryesor i pasurive..."`) passes `isEnglishish()` since it lacks
accented chars. These are annotated as false positives in the audit doc.

### Allowlist (language-neutral ONLY)

| Pattern | Rationale |
|---|---|
| `Tirana`, `Durrës`, Albanian cities | Geographic proper nouns — not translatable |
| `EUR`, `URL`, `DELETE`, `SMS`, `HTTP`, `HTTPS`, `API`, `ID`, `SEO`, `QA`, `ALL`, `JSON`, `CSV`, `PDF`, `RSS`, `CTA` | Currency/acronym codes — never translated |
| All-caps identifiers `/^[A-Z][A-Z0-9_]+$/` | Enum/status codes (ACTIVE, PENDING, SOLD_OUT) |
| Pure numeric/symbol values | Not user-facing prose |
| `Outline`, `Neutral`, `Primary`, `Secondary`, `Ghost`, `Destructive`, `Default` | CSS variant labels — not translatable |
| `Lero(\.al)?` | Site brand name |
| `OpenStreetMap` | Map tile provider — proper noun |

**Rule:** NEVER add translatable vocabulary to this allowlist.
Words like `Close`, `Save`, `Loading`, `Breadcrumb`, `Pagination`, `Privacy`,
`Help`, `Slug` are translatable and must NOT appear here.

---

## §3 — GATE MODE: fail-on-new

The scanner uses a **committed baseline** (`scripts/i18n-hardcode-baseline.json`)
to distinguish existing debt from new introductions.

- **Gate exits 0 (pass):** all findings are in the baseline. Existing debt is tracked, not blocking.
- **Gate exits 1 (fail):** one or more findings have a `file:line` key not in the baseline = NEW hardcode introduced.

The baseline is keyed by `"file:line"` (e.g. `"src/components/ui/dialog.tsx:81"`).
Moving the same hardcode to a different line counts as NEW at the new location
(and removes the old baseline entry as stale). This is by design — prevents "move
to hide" workarounds.

### Updating the baseline

Only update the baseline when:
1. A finding is confirmed to be a false positive (document the reason)
2. Task 397 remediates a finding (it disappears from the scan, baseline entry becomes stale)
3. A new allowlist entry is added (re-run to shrink baseline)

```
npm run check:i18n-hardcode:update-baseline
```

Commit the new baseline alongside the code change. Never update the baseline
to hide a real new hardcode — that defeats the gate.

---

## §4 — CI WIRING

**Job:** `governance` in `.github/workflows/governance-pr.yml`
**Step:** `Static i18n hardcode gate (fail-on-new, baseline-diff)`
**Command:** `npm run check:i18n-hardcode`
**Trigger:** every PR touching `src/**`, `scripts/**`, `package.json`, or `messages/**`

The gate runs BEFORE the `Full governance report` step so CI surfaces the
violation immediately.

---

## §5 — RELATIONSHIP TO OTHER GATES

```
check:stories          — story-file governance (layout, raw controls, locale parity)
check:locale-leak      — rendered DOM leak detection (story-gated, Playwright)
check:i18n-hardcode    — static source scan (story-independent, covers all src/**)
check:i18n             — message key parity (key counts, sq/en/uk/it presence)
```

These four gates are complementary and non-overlapping in scope.

---

## §6 — EPIC II CROSS-REFERENCE

Task 396 materialises Epic II Phase 1 (P1 audit + P3 CI gate):

| Epic II Phase | Task | Status |
|---|---|---|
| Phase 0 — Sprint 21 hotfix | 300 | CLOSED |
| Phase 1 P1 — Static scan + audit | **396** | DONE (2026-06-05) |
| Phase 1 P2 — Batch remediation | **397** | NEXT |
| Phase 2 — Notification locale-binding | 319 | PLANNED |
| Phase 2 — Dynamic-key remediation | 320 | PLANNED |
| Phase 3 — CI hardening | 323 | PLANNED |

See `tasks/Epics/Epic_II_Global_i18n_Hardening.md` for full epic plan.
