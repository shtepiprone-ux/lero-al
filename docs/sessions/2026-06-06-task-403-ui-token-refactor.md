# Session Log — Task 403: Token refactor `src/components/ui/**` (Epic JJ Phase 3)

**Date:** 2026-06-06  
**Executor:** Sonnet 4.6  
**Sprint:** 35  
**Status:** COMPLETE — pending orchestrator review + commit emission

---

## Summary

Refactored `src/components/ui/**` to replace raw style-value literals with design tokens from
`docs/design-system.md §22`. Also added Part 0 exact-value inline suppression to the detector.
Result: **unsuppressed UI violations = 0** (down from 20).

**Final token-resolution report headline:**  
**"unsuppressed UI violations = 0 (4 bespoke values remain, inline-suppressed with reasons; 1 file path-allowlisted)"**

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-design-tokens.mjs` | Part 0: added exact-value inline suppression, comment-stripping before detection, stale-marker + missing-reason error categories | Policy A requires exact-value (not line-level) suppression |
| `src/components/ui/badge.tsx` | Group A: `focus-visible:ring-[3px]` → `focus-visible:ring-3` | Named utility; same 3px computed value |
| `src/components/ui/scroll-area.tsx` | Group A: `focus-visible:ring-[3px]` → `focus-visible:ring-3` | Named utility; same 3px computed value |
| `src/components/ui/sheet.tsx` | Group A: `translate-y-[2.5rem]`×2→`translate-y-10`, `translate-x-[2.5rem]`×2→`translate-x-10`, `translate-x-[-2.5rem]`×2→`-translate-x-10` | `--spacing-10: var(--space-10)` = 2.5rem in globals.css |
| `src/components/ui/dropdown-menu.tsx` | Group A: `min-w-[96px]` → `min-w-24` | `--spacing-24: var(--space-24)` = 6rem = 96px in globals.css |
| `src/components/ui/switch.tsx` | Group A: `w-[32px]`→`w-8`, `w-[24px]`→`w-6`, `h-[14px]`→`h-3.5`; Group C: suppression marker for `h-[18.4px]` | Spacing wired in globals.css; h-[18.4px] off-scale |
| `src/components/ui/navigation-menu.tsx` | Group C: `duration-[0.35s]`×3 → `duration-300` | Owner-approved 350ms→300ms harmonization (--duration-slow) |
| `src/components/ui/checkbox.tsx` | Group C: inline suppression marker for `rounded-[4px]` | 4px corner on 16px box; radius-sm = 7.2px here |
| `src/components/ui/tabs.tsx` | Group C: inline suppression marker for `p-[3px]` | Tablist inset; off-scale (space-0.5=2px, space-1=4px) |
| `src/components/ui/button.tsx` | Group C: inline suppression marker for `text-[0.8rem]` | 12.8px on sm button; off-scale (xs=12px, sm=14px) |
| `scripts/design-tokens-allowlist.json` | Group B: added `appImageConfig.ts` path entry | Next/Image sizes strings + inline SVG color cannot use CSS vars |
| `docs/design-system.md` | §23.2 expanded: §23.2.a (path-level allowlist) + §23.2.b (inline suppression docs) + updated appImageConfig.ts table entry | Documents Part 0 mechanism + escalation guardrail |
| `docs/backlog.md` | Updated Last Session + task numbering | Task 403 complete; next free task = 404 |

---

## Part 0 — Exact-value inline suppression (detector)

**Implementation in `scripts/check-design-tokens.mjs`:**
- Added `parseInlineMarkers(line)` — extracts `design-tokens-allow: <value> — <reason>` markers from any line
- `codeOnly = line.replace(/\s*\/\/.*$/, '')` — strips trailing `//` comments before detection (prevents marker text itself from being detected as a violation)
- Markers found on full original line; detection runs on `codeOnly` only
- Per-finding suppression: if marker's `rawValue` string-equals a detected match AND `hasReason=true` → suppressed
- `missing-reason` (no em-dash or empty reason) → exit 1 in BOTH report and strict modes
- `stale-marker` (rawValue not detected on line) → exit 1 in strict, listed in report
- One marker suppresses one exact value string; duplicate occurrences on same line suppressed together

---

## Group A — Inert swaps (primary proof: computed values from globals.css)

All swaps verified against `src/app/globals.css @theme` token wiring:

| File:line | Raw | After | Computed-value proof |
|---|---|---|---|
| `badge.tsx:8` | `focus-visible:ring-[3px]` | `focus-visible:ring-3` | `ring-3` = 3px ring-width (Tailwind v4 named utility; used in switch.tsx already) |
| `scroll-area.tsx:21` | `focus-visible:ring-[3px]` | `focus-visible:ring-3` | same — 3px ring-width |
| `sheet.tsx:58` | `translate-y-[2.5rem]` ×2 | `translate-y-10` | `--spacing-10: var(--space-10)` = `2.5rem` (40px) in globals.css |
| `sheet.tsx:58` | `translate-x-[2.5rem]` ×2 | `translate-x-10` | same — `--spacing-10` = `2.5rem` |
| `sheet.tsx:58` | `translate-x-[-2.5rem]` ×2 | `-translate-x-10` | negative of `--spacing-10` = `-2.5rem` |
| `dropdown-menu.tsx:154` | `min-w-[96px]` | `min-w-24` | `--spacing-24: var(--space-24)` = `6rem` = 96px (16px/rem × 6) |
| `switch.tsx:19` | `data-[size=default]:w-[32px]` | `data-[size=default]:w-8` | `--spacing-8: var(--space-8)` = `2rem` = 32px |
| `switch.tsx:19` | `data-[size=sm]:w-[24px]` | `data-[size=sm]:w-6` | `--spacing-6: var(--space-6)` = `1.5rem` = 24px |
| `switch.tsx:19` | `data-[size=sm]:h-[14px]` | `data-[size=sm]:h-3.5` | `--spacing-3.5` (Tailwind default formula `0.25rem × 3.5`) = `0.875rem` = 14px; `--space-3-5: 0.875rem` in globals.css confirms same value |

**Note on `translate-y-[-2.5rem]` (top-side sheet, ×2):** NOT listed in kickoff Group A table; not flagged by gate (negative bracket values don't match `[\d.]+rem` regex). Left as-is per "Do NOT invent mappings" rule. Documented for 404 review.

**Inertness confirmation:** `ring-3` is already used in `switch.tsx` (existing code), confirming Tailwind v4 generates this utility in this project. Spacing tokens for 6/8/10/24 are explicitly wired via `--spacing-N: var(--space-N)` in globals.css. Fractional `--spacing-3.5` is not explicitly wired but uses Tailwind v4 default formula `calc(0.25rem * 3.5) = 0.875rem` which matches `--space-3-5: 0.875rem`.

---

## Group B — Path-level allowlist

`src/components/ui/appImageConfig.ts` added to `scripts/design-tokens-allowlist.json`:
- **`sizes: '96px'` / `'80px'`** — Next/Image `sizes` media-descriptor strings; browser requires concrete CSS length to pick a source; `var(--...)` is invalid there
- **`#e2e8f0`** — hex color inside a standalone inline SVG data-URI blur placeholder; self-contained SVG string, no CSS custom property access

Allowlist entry: `"Next/Image sizes media-descriptor strings + inline SVG blur placeholder color — neither can reference CSS custom properties"`

After adding: `check:design-tokens` no longer reports `appImageConfig.ts`.

---

## Group C — Duration harmonization + inline suppressions

### Duration harmonization (owner-approved 350ms→300ms)

`navigation-menu.tsx` lines 88, 112, 119 — all 3 occurrences of `duration-[0.35s]` → `duration-300`:
- `duration-300` = 300ms = `--duration-slow` (design token from globals.css)
- The element already had `group-data-[viewport=false]/navigation-menu:duration-300` (conditional), showing 300ms is the target
- Owner approved this as the ONLY intentional visual change in Task 403
- **Computed `transition-duration` before:** `0.35s` = `350ms`
- **Computed `transition-duration` after:** `0.3s` = `300ms`
- All other computed styles (`transition-property`, color, layout, position) unchanged

### Inline suppressions (4 bespoke values with reasons)

| File | Value | Marker (verbatim) |
|---|---|---|
| `checkbox.tsx:13` | `rounded-[4px]` | `// design-tokens-allow: rounded-[4px] — 4px corner on a 16px box; no scale radius token (radius-sm = 7.2px here)` |
| `tabs.tsx:30` | `p-[3px]` | `// design-tokens-allow: p-[3px] — tablist inset; off-scale (space-0.5=2px, space-1=4px)` |
| `button.tsx:26` | `text-[0.8rem]` | `// design-tokens-allow: text-[0.8rem] — 12.8px on size=sm button; off-scale (xs=12px, sm=14px)` |
| `switch.tsx:19` | `h-[18.4px]` | `// design-tokens-allow: h-[18.4px] — switch default track height; no scale token` |

---

## check:design-tokens before/after

**Before Task 403:** 140 violations across 8 areas (from Task 402 inventory)  
**UI area before:** 20 violations (all Group A/B/C items)  
**After Task 403:** 120 violations total | 0 stale-markers | 0 missing-reason errors  
**UI area after:** 0 violations (absent from report)  

```
Total: 120 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
📋  Report mode — 120 violation(s) listed above (inventory for Tasks 404–406).
```

---

## Negative flow proof

### Probe 1 — Selective suppression (two raws, one marked, one not)

Probe line added to `checkbox.tsx`:
```ts
const _probeSelective = "p-[3px] h-[14px]" // design-tokens-allow: p-[3px] — probe: only this value suppressed
```

Scanner output (UI section):
```
:32  [length:arbitrary px/rem utility]  "h-[14px]"
```
- `p-[3px]` → suppressed (marker present, reason provided) ✓
- `h-[14px]` → still reported (no marker) ✓

### Probe 2 — Stale marker (value not on line)

Probe line added to `checkbox.tsx`:
```ts
const _probeStale = "valid-class" // design-tokens-allow: w-[999px] — probe: stale marker (value not on line)
```

Scanner output:
```
:33  [stale-marker:stale inline suppression (value not detected on this line)]  "w-[999px]"
Total: 121 raw style-value violation(s) | 1 stale-marker(s) | 0 missing-reason error(s)
```
Stale marker detected ✓

### Probe 3 — Missing reason → exit 1 (both modes)

Probe line added to `checkbox.tsx`:
```ts
const _probeNoReason = "rounded-[5px]" // design-tokens-allow: rounded-[5px] —
```

Scanner output:
```
❌  check:design-tokens — 1 design-tokens-allow marker(s) with missing or empty reason.
    Every design-tokens-allow: marker MUST have a non-empty reason after the — separator.
EXIT: 1
```
Exit 1 in report mode (default) ✓

All probes deleted after testing.

---

## Mobile <640 gate verification

These primitives are in `src/components/ui/` and carry existing mobile full-width rules:
- **Button** (`button.tsx`): `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` — all text sizes carry this. NOT changed by Task 403 (Group C only adds a trailing `//` comment after the string).
- **Tabs** (`tabs.tsx`): `max-sm:flex max-sm:w-full max-sm:h-auto max-sm:justify-start` — preserved. Group C adds a trailing `//` comment; the class string is unchanged.
- **Sheet** (`sheet.tsx`): `data-[side=bottom]:inset-x-0 ... data-[side=bottom]:rounded-t-2xl` — mobile bottom-sheet pattern preserved. Group A swaps only affect the translate animation values (inert).
- **Switch** (`switch.tsx`): Not a popup/content control — exempt from full-width rule.

No mobile full-width class was removed or altered.

---

## Epic JJ / Task 407 strict semantics (carry forward to 404–407)

**Canonical success definition:**  
"zero unjustified / unsuppressed raw style-value violations"

- Strict-mode success = **0 unsuppressed violations**
- Path-allowlisted and inline-suppressed values are allowed **only with explicit justification**
- Reports must **never imply that no bespoke raw values exist** if suppressed values remain

**Escalation guardrail (Tasks 404–407):** if the **same** bespoke off-scale value is
inline-suppressed **3+ times** across areas 404–406, it MUST be **escalated as a token-candidate**
for owner/orchestrator review instead of being repeatedly suppressed. Do NOT create new tokens
inside 404–406 — only escalate.

---

## Validation transcript

```
npx tsc --noEmit       → 0 errors  (TSC EXIT: 0)
npm run lint           → 0 errors, 1 pre-existing warning (AdminTable.stories.tsx:647 — unrelated)
node scripts/check-file-integrity.mjs → 11 files checked, all PASS (INTEGRITY EXIT: 0)
node --check scripts/check-design-tokens.mjs → PASS (NODE CHECK EXIT: 0)
node -e "JSON.parse(fs.readFileSync('scripts/design-tokens-allowlist.json','utf8'))" → JSON valid
node scripts/check-design-tokens.mjs → 120 violations, 0 stale-markers, 0 missing-reason, exit 0
```

---

## AC self-audit

| AC | Status | Evidence |
|---|---|---|
| Part 0: exact-value suppression | ✅ | Probe 1 proves selective suppression; Probe 3 proves missing-reason exits 1 |
| Part 0: missing reason = error (both modes) | ✅ | Probe 3 → EXIT 1 in report mode (default) |
| Part 0: stale marker reported | ✅ | Probe 2 → stale-marker finding in output |
| Part 0: §23.2 documented | ✅ | §23.2.a + §23.2.b added to design-system.md |
| Part 0: `node --check` passes | ✅ | node --check EXIT: 0 |
| Group A: all 9 swaps applied | ✅ | grep confirms; tsc=0 |
| Group A: computed-value proof | ✅ | Token values verified from globals.css (see table above) |
| Group B: appImageConfig.ts allowlisted | ✅ | Entry added; file absent from report |
| Group C: duration-[0.35s]→duration-300 ×3 | ✅ | grep navigation-menu.tsx confirms all 3 lines use duration-300 |
| Group C: 4 suppressions with reasons | ✅ | grep confirms all 4 markers present in code |
| `check:design-tokens` unsuppressed UI violations = 0 | ✅ | UI area absent from report; total=120 (all non-UI areas) |
| `tsc=0` | ✅ | TSC EXIT: 0 |
| `lint=0 new` | ✅ | 0 new errors (1 pre-existing warning unrelated) |
| `check:file-integrity` green | ✅ | 11 files, all PASS |
| Mobile <640 full-width preserved | ✅ | max-sm:w-full / bottom-sheet classes untouched on button/tabs/sheet |
| No git add/commit from executor | ✅ | No git commands run; orchestrator emits on review |
| backlog.md + session log updated | ✅ | This file |
| No story files created/modified | ✅ | No *.stories.tsx touched |

**Self-validation verdict: COMPLETE ✅**

---

## Rendered matrix

This task is a **visually inert styling refactor** (Group A = same computed values; Group B/C = suppressions, no visual change). Browser-rendered evidence not available in this executor environment.

For Group A: primary inertness proof is token-value equality (see computed-value table above). The orchestrator should verify at review time that `translate-y-10`, `translate-x-10`, `ring-3`, `min-w-24`, `w-8`, `w-6`, `h-3.5` produce identical computed values to the raw arbitrary values in this project.

For Group C duration (350ms→300ms): this is an **owner-approved** non-inert change. Screenshots would prove absence of layout/color/position regression; the timing change is proven by the computed value change (350ms → 300ms). Owner visual verification recommended at review.

**OWNER QA REQUIRED gate:** The orchestrator should confirm computed-value equality for all Group A swaps natively (tsc=0 alone is not proof per agent-contract clause 12).
