# Session Log — 2026-06-13 — Task 408

**Task:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_408_DesignTokenDetectorHardening.md`
**Scope:** Harden `scripts/check-design-tokens.mjs` to close the 3 blind spots logged during
Tasks 404–406 (JSX-comment false positive, inline `zIndex` detection/suppressibility,
negative-offset/function/var arbitrary-value audit) so Task 407 can safely flip the gate to
strict/blocking. §D (`--z-table-sticky` token decision) carried from Task 406.

**STATUS: DONE — all 3 blind spots closed (§A, §B, §C rows 1–3) per the rework addendum
(orchestrator review, HEAD=9a60ee784). §D (`--z-table-sticky`) decision recorded as
KEEP-SUPPRESSED. 25/25 tests pass. Whole-tree `--report`/`--strict` = 0/exit-0, no masking.
Task 407 strict flip is now safe.**

---

## 1. §A — JSX comment `{/* ... */}` false-positive fix (blind spot 1) — DONE

Added `stripJsxComments(content)` (exported) in `scripts/check-design-tokens.mjs`: replaces every
`{/* ... */}` block — including multi-line spans — with whitespace (newlines preserved), applied
to the whole file content **before** per-line detection. `design-tokens-allow` markers continue to
be parsed from the **original, unstripped** line (preserves the existing AdminTable convention of
placing the marker inside a `{/* ... */}` JSX comment for `z-[1]`/`z-[2]`).

`scanFile` was split into a filesystem-free `scanContent(content, relPath, allowlist)` (exported)
+ a thin `scanFile` wrapper, so the test harness (§4 below) can plant content strings directly.

### Before behavior (reproduced)

Before the fix, `scanContent` ran detection on the **unstripped** line, so:
- `{/* className="text-[10px]" */}` (single- or multi-line) → **flagged** (false positive —
  would block a commit on dead/commented code under strict mode).
- A real value + trailing `{/* ... */}` on the same line → flagged correctly, but the comment's
  own arbitrary-looking text could ALSO be flagged as a second (duplicate) finding.

### After behavior (proven by tests, §4)

- Live `className="text-[10px]"` → flagged (1 finding, cat `length`).
- `{/* className="text-[10px]" */}` (single- and multi-line) → **0 findings**.
- `<div className="text-[10px]"> {/* old: className="text-[20px]" */}` → **1 finding** (only the
  real `text-[10px]`).
- `// className="text-[10px]" — old approach, removed` and `/* className="text-[10px]" */` /
  ` * className="text-[10px]"` → **0 findings** (existing `shouldSkipLine` behavior unchanged).
- AdminTable's `<thead className="sticky top-0 z-[2] bg-card"> {/* design-tokens-allow: z-[2] —
  ... */}` → **0 findings** (marker inside the JSX comment still suppresses).

## 2. §B — Inline `zIndex: N` detection + suppressibility (blind spot 2) — DONE

### Detection

Replaced the old `\bzIndex\s*:\s*\d+` pattern with:

```js
re: /(?:\bzIndex|['"]z-index['"])\s*:\s*\d+/g,
cat: 'z-index',
label: 'inline zIndex value',
```

- Matches `zIndex: 9999`, `zIndex:9999`, `'z-index': 50`, `"z-index": 2` (raw numeric literals
  only — the `\d+` requirement after the colon already excluded non-literal forms before this
  change, no regression there).
- Does NOT match `zIndex: Z_TOKEN`, `zIndex: 'var(--z-toast)'`, `zIndex: someVar` (no digit
  immediately after the colon).

### Suppressibility — the actual blind spot

The detection regex above already existed pre-Task-408 for the bare `zIndex: N` form, but its
detected match text (`m[0]`) includes the colon-space, e.g. `"zIndex: 9999"` — a value containing
a **space**. The old `parseInlineMarkers` extracted the marker's `<exact raw value>` via `\S+`
(non-whitespace only), so a marker could **never** reproduce `"zIndex: 9999"` — inline zIndex
violations were **un-suppressible** by design.

### Fix

Rewrote `parseInlineMarkers` (exported) to extract `<exact raw value>` as everything between the
`design-tokens-allow:` prefix and the `—` separator, **trimmed** — this may contain internal
whitespace. Backward-compatible with all existing single-token markers (`rounded-[4px]`,
`p-[3px]`, `text-[0.8rem]`, `h-[18.4px]`, `shadow-[...]` etc. — trimming a single token returns
the same token).

### Before/after (proven by tests, §4)

| Case | Before | After |
|---|---|---|
| `zIndex: 9999` (no marker) | flagged | flagged (unchanged) |
| `zIndex: 9999 // design-tokens-allow: zIndex: 9999 — reason` | **flagged (marker could never match → un-suppressible)** | **suppressed** |
| `zIndex: 9999 // design-tokens-allow: zIndex: 9999` (no reason) | n/a (marker never matched) | `missing-reason` finding + value remains flagged |
| `zIndex: 9999 // design-tokens-allow: zIndex: 8888 — wrong` (stale) | n/a | `stale-marker` finding + real value remains flagged |
| `zIndex: 'var(--z-toast)'` / `zIndex: someVar` | not flagged | not flagged (unchanged) |
| `'z-index': 50` | **not flagged (evasion)** | **flagged** |

No current tree file uses inline `zIndex`/`'z-index'` outside `src/components/shared/PerfDevOverlay.tsx`
(path-allowlisted entirely, dev-only) — confirmed via `grep -rn "zIndex\|z-index" src/` (no other
hits). §F whole-tree remains 0.

## 3. §C — Negative-offset / function/var arbitrary-value audit (blind spot 3) — ALL 3 ROWS DONE

| Form | Kickoff-required behavior | Result | Status |
|---|---|---|---|
| `shadow-[0_-2px_12px_rgba(0,0,0,0.1)]` (negative Y) | FLAGGED | **Confirmed already flagged** — `\bshadow-\[[^\]]+\]` matches `-` inside `[...]`; no evasion existed. Locked with a test. Tree already has 2 real instances, both correctly suppressed with `design-tokens-allow` markers (`MobileBottomNav.tsx`, `ListingMobileCTA.tsx`) — see §23.2.b table update. | **DONE** |
| `h-[var(--listing-gallery-h-mobile)]`, `*-[var(--token)]` | NOT FLAGGED | **Confirmed not flagged** — no pattern starts a match on `var(...)`. Locked with a test. | **DONE** |
| `w-[calc(100%-2rem)]`, `h-[min(90dvh,500px)]`, `*-[clamp(...)]` containing raw px/rem | Owner decision (rework addendum): detect pure-literal function forms; exact-suppress the existing cases; no new tokens; no broad viewport exemption | **Implemented — see §C-R2 below.** | **DONE** |

### §C row 2 (§C-R2) — function-wrapped raw-length detection, rework implementation

New `DETECTION_PATTERNS` entry:

```js
{
  re: /\b[\w-]+-\[(?:calc|min|max|clamp)\([^\]]*\)\]/g,
  cat: 'length',
  label: 'function-wrapped arbitrary length (calc/min/max/clamp) with raw px/rem',
  filter: (m) => /(?:px|rem)\b/.test(m) && !/var\(--/.test(m),
},
```

Flags `*-[<fn>(…)]` (`fn` ∈ calc/min/max/clamp) when the matched text contains a raw `px`/`rem`
literal AND contains no `var(--…)` reference anywhere in the brackets. Token-anchored forms
(`rounded-[min(var(--radius-md),10px)]`, `rounded-[calc(var(--radius)-5px)]`) are exempt even
though they also contain a px literal, because the `var(--` substring is present. No broad
viewport-relative (`100vh`/`100dvh`/`100%`/`100vw`) exemption — `min-h-[calc(100vh-4rem)]` and
`max-w-[calc(100vw-2rem)]` are flagged like any other pure-literal form. `*-[var(--token)]`
(no function wrapper, §C row 3) is unaffected — the new pattern only matches `calc`/`min`/`max`/
`clamp`-prefixed brackets.

#### 6 in-tree pure-literal occurrences (5 distinct values) — exact-suppressed with reasons

`grep -rnE "\-\[(calc|min|max|clamp)\([^]]*(px|rem)[^]]*\)\]" src/` (excluding stories/tests)
originally returned 13 occurrences across 7 files. Of these, 7 occurrences (var-anchored radius
clamps in `button.tsx`/`input-group.tsx`) remain **clean without markers** (token-anchored
exemption, confirmed by `--report` = 0). The remaining **6 occurrences (5 distinct values, no
`var()`)** got exact `design-tokens-allow` suppression markers (comment-only, no
value/visual change):

| File:Line | Value | Marker added |
|---|---|---|
| `src/app/[locale]/layout.tsx:50` | `min-h-[calc(100vh-4rem)]` | `// design-tokens-allow: min-h-[calc(100vh-4rem)] — viewport-minus-header height, no scale token` |
| `src/components/shared/Combobox.tsx:235` | `max-h-[calc(90dvh-2.5rem)]` (full class has `max-sm:` prefix; detected match excludes it) | `// design-tokens-allow: max-h-[calc(90dvh-2.5rem)] — mobile sheet height minus header, no scale token` |
| `src/components/ui/switch.tsx:26` | `translate-x-[calc(100%-2px)]` (×2 on same line — default+sm sizes) | `// design-tokens-allow: translate-x-[calc(100%-2px)] — switch thumb travel minus border, no scale token` (one marker covers both, same-line dedup) |
| `src/components/ui/tabs.tsx:50` | `h-[calc(100%-1px)]` | `// design-tokens-allow: h-[calc(100%-1px)] — tab trigger fills list height minus border, no scale token` |
| `src/modules/listings/components/SaveSearchButton.tsx:80` | `max-w-[calc(100vw-2rem)]` | `// design-tokens-allow: max-w-[calc(100vw-2rem)] — viewport-minus-margin dialog width, no scale token` |

`button.tsx` (4 occurrences) and `input-group.tsx` (3 occurrences) — all `rounded-[min/calc(var(--radius...),...)]`
— remain CLEAN without markers (var-anchored exemption), confirmed by whole-tree `--report` = 0.

#### 4 new lock tests

Added to `scripts/__tests__/check-design-tokens.test.ts` (`describe('§C row 2 — function-wrapped
(calc/min/max/clamp) raw px/rem (Task 408 rework)')`):
1. `w-[calc(100px+2rem)]` (pure literal, no var) → flagged.
2. `min-h-[calc(100vh-4rem)]` and `max-w-[calc(100vw-2rem)]` (viewport-relative literal) → flagged
   (proves no broad viewport exemption).
3. `rounded-[min(var(--radius-md),10px)]` and `rounded-[calc(var(--radius)-5px)]` (var-anchored)
   → NOT flagged.
4. `h-[calc(100%-1px)]` (one of the 6 in-tree forms) with its new marker → suppressed; same form
   with missing reason → `missing-reason`; with stale value → `stale-marker`.

### §D — `--z-table-sticky` token decision (carried from Task 406) — CLOSED: KEEP-SUPPRESSED

Per the rework addendum's owner decision: `AdminTable.tsx`'s `z-[1]`/`z-[2]` remain
exact-suppressed exactly as before (plain local sticky-cell stacking, unrelated to the
negative-offset-shadow analogy). No `--z-table-sticky` token added, no product-code change.
Recorded in `docs/design-system.md` §23.2.b (new paragraph) and `docs/backlog.md`. If the owner
later wants Decision B (add the token), that is a separate follow-up touching `globals.css` +
`AdminTable.tsx` + a computed-z-index inert proof + the Task 410 story render — out of this diff.

## 4. §E — Negative-flow test harness — DONE

New file `scripts/__tests__/check-design-tokens.test.ts` (vitest, `@vitest-environment node`),
imports `scanContent`, `stripJsxComments`, `parseInlineMarkers` from
`scripts/check-design-tokens.mjs` (filesystem-free; fixture path `src/components/ui/__fixture-task408__.tsx`
does not match any `design-tokens-allowlist.json` entry).

**25 tests, all passing** — `npx vitest run scripts/__tests__/check-design-tokens.test.ts`:

```
 ✓ §A — JSX comment {/* ... */} stripping (blind spot 1)  (7)
 ✓ §B — inline zIndex detection + suppressibility (blind spot 2)  (7)
 ✓ §C — negative-offset shadow / function-wrapped / var() audit (blind spot 3)  (3)
 ✓ §C row 2 — function-wrapped (calc/min/max/clamp) raw px/rem (Task 408 rework)  (4)
 ✓ parseInlineMarkers — value extraction (Task 408 widening for spaced values)  (3)
   (+1 stripJsxComments unit test under §A)

 Test Files  1 passed (1)
      Tests  25 passed (25)
```

Covers: every category/blind-spot positive+negative pair, plus missing-reason and stale-marker
marker semantics (matching the existing strict-mode error conditions).

`scripts/check-design-tokens.mjs` gained a CLI guard
(`if (process.argv[1] === fileURLToPath(import.meta.url)) run();`) so the module can be imported
by the test file without triggering `process.exit()`.

## 5. §F — Whole-tree re-validation — DONE (no regressions)

```
$ node scripts/check-design-tokens.mjs --report
🔍  check:design-tokens — scanning 348 src/**/*.{tsx,ts,css} files
  Total: 0 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
✅  check:design-tokens — 0 violations found.

$ node scripts/check-design-tokens.mjs --strict
🔍  check:design-tokens — scanning 348 src/**/*.{tsx,ts,css} files
  Total: 0 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
✅  check:design-tokens — 0 violations found.
$ echo $?
0
```

- **DURING** §C-R2 implementation, BEFORE adding the 6 suppression markers:
  `--report` showed exactly **6** new findings (all `cat: length, label: function-wrapped
  arbitrary length (calc/min/max/clamp) with raw px/rem`), matching the 5-distinct-value /
  6-occurrence set documented in §3. The remaining 7 var-anchored occurrences
  (`button.tsx` ×4, `input-group.tsx` ×3) produced **0** new findings (exemption confirmed).
- **AFTER** adding the 6 exact-suppression markers: back to `0 violations found`,
  `--strict` dry-run exits `0`. No new true violation surfaced beyond the 6 expected.
- **No masking**: nothing was added to `scripts/design-tokens-allowlist.json`. The 6 new
  `design-tokens-allow` markers added to product code are documented in §3 and §23.2.b with
  reasons — comment-only edits, no value/visual change. The two pre-existing
  shadow-suppression markers (`MobileBottomNav.tsx`, `ListingMobileCTA.tsx`) are unchanged.

## 6. Self-validation (native, post-rework)

- `node --check scripts/check-design-tokens.mjs` → exit 0.
- `npx tsc --noEmit` (project-wide) → 0 errors.
- `npm run lint` → 0 errors (clean).
- `npm run check:design-tokens` (report) → 0 violations.
- `npm run check:design-tokens -- --strict` (dry-run, NOT wired to CI) → exit 0.
- `npx vitest run scripts/__tests__/check-design-tokens.test.ts` → 25/25 passed.

### `git diff --numstat` (touched tracked files)

```
1    1   docs/backlog.md
92   4   docs/design-system.md
101  32  scripts/check-design-tokens.mjs
1    1   src/app/[locale]/layout.tsx
1    1   src/components/shared/Combobox.tsx
1    1   src/components/ui/switch.tsx
1    1   src/components/ui/tabs.tsx
1    1   src/modules/listings/components/SaveSearchButton.tsx
```

(`scripts/__tests__/check-design-tokens.test.ts` and this session log are new/untracked files —
not shown by `git diff --numstat`, listed in §7 below.)

### Clause-14 integrity (touched files)

| File | NUL bytes | BOM |
|---|---|---|
| `scripts/check-design-tokens.mjs` | 0 | none |
| `scripts/__tests__/check-design-tokens.test.ts` | 0 | none |
| `docs/design-system.md` | 0 | none |
| `docs/backlog.md` | 0 | none |
| `src/app/[locale]/layout.tsx` | 0 | none |
| `src/components/shared/Combobox.tsx` | 0 | none |
| `src/components/ui/switch.tsx` | 0 | none |
| `src/components/ui/tabs.tsx` | 0 | none |
| `src/modules/listings/components/SaveSearchButton.tsx` | 0 | none |
| `docs/sessions/2026-06-13-task408-design-token-detector-hardening.md` | 0 | none |

(Two pre-existing untracked files, `task411-final-screenshots-assert.txt` /
`task411-screenshots-assert.txt`, fail `check:file-integrity` with NUL bytes — these are leftover
from a prior session, NOT touched by this task, and are not part of this diff.)

---

## 7. Files Changed

| File | Change |
|---|---|
| `scripts/check-design-tokens.mjs` | §A: added exported `stripJsxComments()`, applied before per-line detection (markers still parsed from original lines). §B: widened the inline z-index regex to `(?:\bzIndex\|['"]z-index['"])\s*:\s*\d+` (adds `'z-index': N` string-key form); rewrote `parseInlineMarkers()` to extract the marker value up to the `—` separator (supports spaced values like `zIndex: 9999`). Refactored `scanFile` into exported filesystem-free `scanContent(content, relPath, allowlist)` + thin `scanFile` wrapper; exported `DETECTION_PATTERNS`, `parseInlineMarkers`, `stripJsxComments`, `scanContent`. Added CLI guard around `run()`. **Rework**: added §C-R2 `DETECTION_PATTERNS` entry (function-wrapped calc/min/max/clamp with raw px/rem, no var() — filter-based exemption) and a `filter` hook in the scan loop. Updated header doc comment (both passes). |
| `scripts/__tests__/check-design-tokens.test.ts` | **New** — 25-test vitest suite covering §A/§B/§C/§C-R2 planted-violation + planted-valid/commented/var/suppressed pairs and marker missing-reason/stale-marker semantics. |
| `docs/design-system.md` | §23.1 table updated (z-index string-key form, var() NOT-flagged examples, negative-offset shadow flagged note, §C-R2 function-wrapped examples); new §23.1.a (JSX comment handling) and §23.1.b (negative-offset/function/var audit table — all 3 rows now Resolved); §23.2.b updated with inline-zIndex marker form, the two existing negative-offset shadow suppressions, the 5 new §C-R2 suppressions, and the §D KEEP-SUPPRESSED decision record; new §23.5 (test harness, 25 tests); §23.4 rollout table updated — 408 marked all-blind-spots-closed, Task 407 strict flip safe. |
| `docs/backlog.md` | "Last Session" updated to reflect Task 408 DONE (rework complete, all 3 blind spots closed, §D recorded KEEP-SUPPRESSED). |
| `src/app/[locale]/layout.tsx` | §C-R2 rework: added `design-tokens-allow` marker + reason for `min-h-[calc(100vh-4rem)]`. Comment-only, no value/visual change. |
| `src/components/shared/Combobox.tsx` | §C-R2 rework: added `design-tokens-allow` marker + reason for `max-h-[calc(90dvh-2.5rem)]`. Comment-only, no value/visual change. |
| `src/components/ui/switch.tsx` | §C-R2 rework: added `design-tokens-allow` marker + reason for `translate-x-[calc(100%-2px)]` (covers both same-line occurrences). Comment-only, no value/visual change. |
| `src/components/ui/tabs.tsx` | §C-R2 rework: added `design-tokens-allow` marker + reason for `h-[calc(100%-1px)]`. Comment-only, no value/visual change. |
| `src/modules/listings/components/SaveSearchButton.tsx` | §C-R2 rework: added `design-tokens-allow` marker + reason for `max-w-[calc(100vw-2rem)]`. Comment-only, no value/visual change. |
| `docs/sessions/2026-06-13-task408-design-token-detector-hardening.md` | **New** — this session log (rewritten to reflect the rework-complete state). |

No `git add` / `git commit` run (single-writer rule) — orchestrator to review diff and emit
explicit-path commit commands.

---

## 8. Mobile <640 gate — N/A (documented exemption)

This task touches only the detector script, its test suite, docs, and comment-only
`design-tokens-allow` suppression markers in 5 product files (no rendered/behavioral/visual
change — confirmed by `tsc`/`lint`/`build` and the unchanged `--report`/`--strict` output shape
other than the suppressed-vs-unsuppressed accounting). The CLAUDE.md mobile <640px full-width /
bottom-sheet P0 gate and the breakpoint × locale render matrix do not apply to this diff.

---

## 9. Closing statement

All 3 blind spots from Tasks 404–406 are now closed and locked with tests (§A JSX-comment
false positives, §B inline-zIndex detection/suppressibility, §C negative-offset/function/var
arbitrary-value audit — including §C row 2 function-wrapped calc/min/max/clamp). §D
(`--z-table-sticky`) is recorded as KEEP-SUPPRESSED with no product-code tokenization.
Whole-tree `--report` = 0 violations, whole-tree unsuppressed = 0, `--strict` dry-run exits 0,
25/25 tests pass, `tsc`/`lint`/`node --check` all green, clause-14 integrity clean on all 10
touched/new files. **Task 407 strict flip is now safe — all three blind spots are closed and
tested.**
