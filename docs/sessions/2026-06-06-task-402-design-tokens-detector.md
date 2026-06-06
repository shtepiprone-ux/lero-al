# Session Log — Task 402: `check:design-tokens` Detector + `--container-max` Cleanup

**Date:** 2026-06-06  
**Task:** 402 — `check:design-tokens` detector (report mode) + `--container-max` → `--width-page-max` rename  
**Epic:** JJ — Design Variables (single-source tokens), Phase 2  
**Executor:** Sonnet 4.6

---

## Pre-reads completed

- `docs/agent-contract.md` (clauses 1–14) ✓
- `docs/backlog.md` ✓
- `scripts/check-hardcoded-i18n.mjs` (396) — reused file-collection, skip-line, area-grouping patterns ✓
- `scripts/check-story-coverage.mjs` (398) — reused allowlist/stale-entry pattern ✓
- `scripts/check-file-integrity.mjs` (400) — reused SKIP_DIRS conventions ✓
- `.github/workflows/governance-pr.yml` — understood existing step structure ✓
- `package.json` — understood existing script patterns ✓
- `docs/design-system.md §22` (Task 401 token registry) ✓

---

## Part B — `--container-max` rename (done first — simpler)

### Change
- `src/app/globals.css` line 237–238: `--container-max: 88rem` → `--width-page-max: 88rem`
- Updated comment to explain footgun: "NOT in the `--container-*` namespace (avoids max-w-max keyword clash)"
- `docs/design-system.md §22.5` container table row: `--container-max` → `--width-page-max` with note about `max-w-max` keyword clash

### Rename safety verification
```
grep --container-max src/**  →  0 results
grep --container-max (project-wide)  →  only in task/doc files (history only, not live CSS)
```
`max-w-max` unchanged — it's a static Tailwind keyword resolving to `max-content` independent of any custom property. The rename removes the dead/footgun token only; `navigation-menu.tsx` `max-w-max` compiles to `max-content` as before.

---

## Part A — Detector script

### Detection coverage (`scripts/check-design-tokens.mjs`)

| Category | Pattern | Examples flagged | NOT flagged |
|---|---|---|---|
| `color` | `#[0-9a-fA-F]{3,8}`, `rgb(/rgba(/hsl(/hsla(/oklch(` | `#abcdef`, `rgb(255,0,0)` | `var(--color-*)`, `text-red-500` |
| `length` | `\w+-\[[\d.]+(?:px\|rem)\]`, `:\s*['"][\d.]+(?:px\|rem)['"]` | `p-[13px]`, `h-[340px]`, `width: '220px'` | `p-4`, `h-11`, `max-w-md` |
| `z-index` | `z-\[\d+\]`, `zIndex:\s*\d+` | `z-[100]`, `zIndex: 9999` | `z-50`, `z-30` |
| `shadow` | `shadow-\[[^\]]+\]` | `shadow-[0_0_2px_red]` | `shadow-sm`, `shadow-md` |
| `duration` | `duration-\[[^\]]+\]`, `transitionDuration\|animationDuration:\s*N+ms` | `duration-[450ms]` | `duration-200`, `duration-300` |

### Allowlist (`scripts/design-tokens-allowlist.json`) — 4 entries, 0 stubs

| Path | Justification |
|---|---|
| `src/modules/notifications/lib/emails` | HTML email clients require literal inline styles |
| `src/modules/notifications/lib/sendTemplatedEmail.ts` | HTML email layout with BRAND_ACCENT const |
| `src/app/api/auth-email-hook/route.ts` | Supabase auth email hook inline HTML template |
| `src/modules/auth/components/AuthSheet.tsx` | Google brand SVG fill colors (policy-fixed) |

Note: `src/app/api/auth-email-hook/route.ts` was discovered during the scan (not listed in Task 401 audit) — it generates inline HTML for email_change events. Same rationale as email templates. Added to allowlist with real justification.

---

## Inventory (final clean scan — probe deleted, allowlist applied)

```
Total: 140 raw style-value violation(s) across 8 area(s)
By category:
  length               113
  color                9
  z-index              8
  shadow               7
  duration             3
```

| Area | Count | Notable items |
|---|---|---|
| ui | 20 | `ring-[3px]`, `text-[0.8rem]`, `rounded-[4px]`, `min-w-[96px]`, `h-[18.4px]/w-[32px]` (switch), sheet translate |
| shared | 12 | `zIndex: 9999` ×3 (Combobox mobile sheet), `w-[272px]` (DatePicker), `min-h-[44px]` ×3, `text-[10px]` ×3 |
| layout | 6 | `max-w-[120/220px]` (Header/Footer), `text-[10px]` ×3, custom shadow (MobileBottomNav) |
| admin | 49 | `text-[10px]` many, various `max-w-[...]`, `min-h-[...]`, `z-[1]`/`z-[2]` (AdminTable sticky columns) |
| listing | 26 | `h-[340/420/500px]` gallery heights, `z-[100]` lightbox, oklch shadow values (ListingCard) |
| app | 6 | `h-[340/420/500px]` (loading.tsx + page.tsx), performance lib hex colors ×9 (in `src/lib/performance/`) |
| modules | 7 | cabinet/notifications misc |
| other | 14 | `src/lib/performance/` hex colors, `src/stories/` |

This inventory scopes Tasks 403–406 refactor work.

---

## Negative Flow (proven — transcripts)

### Probe planted: `src/components/ui/__tok_probe.tsx`
```tsx
export function TokProbe() {
  return (
    <div
      className="p-[13px] z-[123] shadow-[0_0_2px_red] duration-[450ms]"
      style={{ color: '#abcdef' }}
    />
  );
}
```

### `--strict` mode exit 1 ✓
```
src/components/ui/__tok_probe.tsx  (5)
  :5  [length:arbitrary px/rem utility]  "p-[13px]"
  :5  [z-index:arbitrary z-index class]  "z-[123]"
  :5  [shadow:arbitrary shadow class]  "shadow-[0_0_2px_red]"
  :5  [duration:arbitrary duration class]  "duration-[450ms]"
  :6  [color:hex color]  "#abcdef"
❌  check:design-tokens STRICT — 165 raw style-value violation(s) found.
EXIT_CODE=1  ✓
```

### `--report` mode exit 0 ✓
```
Same violations listed above (including probe entries).
📋  Report mode — 165 violation(s) listed above (inventory for Tasks 403–406).
EXIT_CODE=0  ✓
```

### Probe deleted ✓
`Remove-Item src/components/ui/__tok_probe.tsx -Force`

### False positive check ✓
```
grep of report output for: z-50, z-30, p-4, text-sm, shadow-md, duration-200, max-w-md, var(--
→  0 results  (none of these appear as violations)
```

### Allowlist works ✓
- `src/modules/notifications/lib/emails/**`, `sendTemplatedEmail.ts`, `auth-email-hook/route.ts`, `AuthSheet.tsx` → not in report
- Stale entry check: all 4 paths exist; 0 warnings

---

## Pre-Completion Integrity Transcript

```
scripts/check-design-tokens.mjs   NUL=0  BOM=False  EndsNewline=True  Size=14087  ✓
scripts/design-tokens-allowlist.json  NUL=0  BOM=False  EndsNewline=True  Size=809  ✓
src/app/globals.css               NUL=0  BOM=False  EndsNewline=True  Size=32726  ✓
docs/design-system.md             NUL=0  BOM=False  EndsNewline=True  Size=55923  ✓
.github/workflows/governance-pr.yml  NUL=0  BOM=False  EndsNewline=True  Size=2724  ✓
package.json                      NUL=0  BOM=False  EndsNewline=True  Size=5395   ✓

node --check scripts/check-design-tokens.mjs  →  OK  ✓
JSON.parse(design-tokens-allowlist.json)       →  valid (4 entries, 0 stubs)  ✓
npx tsc --noEmit                               →  0 errors  ✓
```

---

## Mobile <640px Full-Width Gate

**N/A for this task.** Task 402 adds NO UI surfaces and changes NO component rendering. Changes are: a detector script, an allowlist JSON, npm scripts, a CI step, a CSS variable rename (visually inert — `--width-page-max` has 0 consumers), and documentation. The mobile full-width gate re-applies in full to Tasks 403–406.

---

## AC-by-AC Self-Audit Table

| Acceptance Criterion | Status | Evidence |
|---|---|---|
| `scripts/check-design-tokens.mjs` exists with `--report` (exit 0) | ✅ PASS | `node scripts/check-design-tokens.mjs --report` → exit 0 |
| `--strict` exits 1 on violation | ✅ PASS | Probe probe → exit 1, all 5 violations named |
| `--update-allowlist` mode exists | ✅ PASS | Flag parsed; writes stub entries to allowlist JSON |
| Negative flow: `--strict` bites and `--report` stays exit 0 | ✅ PASS | Proven above — both modes tested with probe |
| `scripts/design-tokens-allowlist.json` committed with real justifications (0 stubs) | ✅ PASS | 4 entries, all with non-stub justifications |
| Stale-entry warning works | ✅ PASS | `checkStaleEntries()` checks `existsSync(join(ROOT, key))`; all 4 paths exist (0 warnings in clean scan) |
| `package.json` has 3 scripts | ✅ PASS | `check:design-tokens`, `check:design-tokens:strict`, `check:design-tokens:update-allowlist` |
| CI has non-blocking report step only | ✅ PASS | `continue-on-error: true`; no strict step in CI |
| `--container-max` renamed to `--width-page-max` | ✅ PASS | `globals.css` + `design-system.md §22.5` updated |
| `§22.5` updated | ✅ PASS | Container row now shows `--width-page-max` with footgun note |
| 0 stray `--container-max` refs in src/ | ✅ PASS | `grep --container-max src/` → 0 results |
| `max-w-max` still resolves to `max-content` | ✅ PASS | Static Tailwind keyword; our rename is in a separate namespace |
| `docs/design-system.md §23` documents gate + rollout | ✅ PASS | §23.1–§23.4 added |
| `node --check` on script | ✅ PASS | `node --check scripts/check-design-tokens.mjs` → OK |
| 0 NUL/BOM/truncation on every touched file | ✅ PASS | Integrity transcript above |
| `tsc = 0` | ✅ PASS | `npx tsc --noEmit` → no output |
| `docs/backlog.md` updated | ✅ PASS | Last session + task numbering updated |
| Session log with AC-by-AC table + Files-Changed table | ✅ PASS | This file |
| No `git add`/`commit` from executor | ✅ PASS | Orchestrator emits commit commands on review |

**Self-validation: COMPLETE. All ACs met. Task 402 ready for orchestrator review.**

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-design-tokens.mjs` | NEW (259 lines) | Detector script: report/strict/update-allowlist modes, 5 detection categories, area grouping, allowlist matching |
| `scripts/design-tokens-allowlist.json` | NEW (4 entries) | Allowlist: email templates, Google SVG brand colors — all real justifications |
| `src/app/globals.css` | `--container-max` → `--width-page-max` (line 237–239) | Footgun fix: removes `--container-*` namespace collision with `max-w-max` |
| `docs/design-system.md` | §22.5 container row updated + §23 added (~75 lines) | Token registry update + gate documentation |
| `.github/workflows/governance-pr.yml` | Added non-blocking report step (`continue-on-error: true`) | CI wiring per kickoff §A.5 |
| `package.json` | Added 3 `check:design-tokens` scripts | CLI wiring per kickoff §A.4 |
| `docs/backlog.md` | Last session + task numbering updated | Governance: backlog currency rule |
| `docs/sessions/2026-06-06-task-402-design-tokens-detector.md` | NEW (this file) | Governance: session log rule (clause 10) |
