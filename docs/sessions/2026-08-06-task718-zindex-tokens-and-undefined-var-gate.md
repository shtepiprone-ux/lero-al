# Task 718 — Define the `--z-*` tokens + add the `css-undefined-var` blocking gate

**Task path:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_718_ZIndexTokens_And_UndefinedVarGate.md`
**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

---

## 1. Files changed

| File | Reason |
|---|---|
| `src/app/globals.css` | R1 — defined the seven `--z-*` tokens in `@theme inline` (`:279-285`) at §22.3 values; replaced the `:269-272` "no `--z-*` tokens exist" comment with an accurate one |
| `scripts/check-design-tokens.mjs` | R4/R5/R6 — new `css-undefined-var` blocking category (`extractCssCustomPropertyDefinitions`, `findUndefinedCssVarReferences`, `EXTERNAL_VAR_PREFIXES`/`EXTERNAL_VAR_EXACT_NAMES`), `scanContent`/`scanFile`/`run()` threading of `globalsDefinedProps`; R8 — corrected the two stale strings at the former `:783`/`:797` |
| `scripts/__tests__/check-design-tokens.test.ts` | 16 new arms (§H) covering every R4 branch + the D32 plant proof at the unit level; `REAL_GLOBALS_DEFINED_PROPS` threaded into `findingsOfCss`; 3 pre-existing arms using the fictitious `--x` placeholder scoped to `css-length` only so the new category doesn't corrupt their assertions |
| `docs/design-system.md` | R3/R10 — §22.3 z-index banner replaced (defined, not NOT-IMPLEMENTED), "Use via" corrected to the two real forms; new §23.6.c documents `css-undefined-var` |
| `docs/backlog.md` | Concise state update — 718 registry row, Sprint 52 line, Last Session header. Net line count unchanged (86 → 86) |
| `docs/sessions/2026-08-06-task718-zindex-tokens-and-undefined-var-gate.md` | This file |

Reconciled against `git diff --stat` (§11 below) and the pre-write `git status --porcelain` snapshot, which was empty (clean tree, no dirty-worktree manifest needed).

**Zero diff (R11, hash-verified via `git diff --stat`):** `package.json`, `.github/workflows/governance-pr.yml`, `scripts/design-tokens-allowlist.json`, `scripts/check-stories-rendered.mjs`, and every `.module.css` under `src/`.

---

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 | AC1 | ✅ 7 `--z-*` definitions confirmed via `grep -nE '^\s*--z-[a-z-]+\s*:' src/app/globals.css` — values `0/10/30/40/50/50/100`, inside `@theme inline`. Stale comment replaced. |
| R2 | AC2 | ✅ Re-proven at I8: `grep -rn "var(--z-" src --include=*.css --include=*.tsx --include=*.ts` — 1 hit, which is `globals.css`'s own explanatory comment (not a consumption); 0 real consumers. |
| R3 | AC3 | ✅ §22.3 "Use via" now states `var(--z-*)` + bare `z-30/40/50`; explains no `z-sticky` class is generated; ⚠️ banner replaced with a ✅ note. |
| R4 | AC4 | ✅ `css-undefined-var` implemented; all 6 branches (undefined / globals-defined / same-file-defined / external-prefix / in-comment / with-fallback) proven in §H, plus the path-allowlist short-circuit (A4) and the `.tsx` no-op (R9-style). |
| R5 | AC5 | ✅ File-level plant at `src/components/layout/__task718-plant__.module.css` (`z-index: var(--z-does-not-exist);`): gate exits 1 naming it (`i6-arm1...log`); removed, gate exits 0 (`i6-arm2...log`); `git status --porcelain` confirmed the plant is gone. |
| R6 | AC6 | ✅ `--tw-`/`--mantine-` prefixes and `--spacing`/`--default-transition-timing-function` exact names, each proven present in `.next/static/css/*.css` and/or `node_modules/tailwindcss` — see §4 below. `--z-` absent. |
| R7 | AC7 | ✅ `npm run check:design-tokens` exit 0 both pre- and post-token-definition (`i4-...log`, `i5-...log`). |
| R8 | AC8 | ✅ Both strings corrected — quoted in §8 below. |
| R9 | AC9 | ✅ 85/85 tests pass (69 pre-existing + 16 new §H arms); no pre-existing arm weakened — see §9 for the 3 fictitious-`--x` sites that needed category-scoping and why. |
| R10 | AC10 | ✅ New §23.6.c documents resolution sources, the external list with proof, A4/A5/A6 limitations. §22.3 definitions recorded. |
| R11 | AC11 | ✅ Zero diff confirmed — §1 above. |
| R12 | AC12 | ✅ `npm run build` — see §10, exit code recorded from the unpiped transcript. |
| R13 | AC13 | ✅ See §11 — counting gates run last, reconciled to `git status`. |

---

## 3. Current vs required behavior

**Current (before this task):** §22.3 tabled seven `--z-*` tokens; `globals.css` defined none and said so explicitly. A `.module.css` could consume any undefined custom property and every gate stayed green — the declaration becomes invalid at computed-value time and silently falls back to the property's initial value (`auto` for `z-index`, non-inherited). Task 715 shipped exactly that into a production build, caught only at review. Two `console.log` strings still described the CSS-declaration categories as report-only and 715 as pending, both false since 715 landed.

**Required after (delivered):** the seven tokens are defined at their documented values; §22.3 states the two real consumption forms; a `var(--x)` with no resolvable definition is a blocking finding, proven by a planted violation on the real gate; the remediated tree reports zero of the new category so the gate still exits 0; the two stale strings are corrected.

**Negative flows (§11 of the kickoff) — all applicable branches implemented and evidenced:** undefined / globals-defined / same-file-defined / external-prefix / in-comment / with-fallback / path-allowlist-short-circuited / baseline-not-zero (procedural stop condition, not triggered — baseline was 0) / consumer-exists-at-I8 (procedural stop condition, not triggered — 0 consumers). Locale/viewport/RLS: **N/A** — build-time script + 7 unconsumed custom properties, no strings, no rendering, no data access.

---

## 4. The inserted `--z-*` block (R1), traced to §22.3

```css
  /* ── 4. Z-index — see ui-rules.md §16 ─────────────────────────── */
  /* Named tokens for var(--z-*) access (Task 718, R1). Tailwind v4 has NO
     --z-index-* theme namespace (measured: 0 occurrences in tailwindcss's
     theme.css and dist/lib.js; z is a bare-value functional utility) — unlike
     --space-N, these do NOT back a z-{name} Tailwind utility class; defining
     --z-sticky cannot make a z-sticky class exist (docs/design-system.md
     §22.3). The working UTILITY scale stays the numeric core classes: z-30
     (chrome) / z-40 (scrim) / z-50 (floating), plus the allowlisted z-[9999]
     escape-hatch (Combobox mobile sheet, PerfDevOverlay). Values below mirror
     §22.3 / ui-rules.md §16 row-for-row. */
  --z-base:     0;      /* §22.3 row 1: --z-base = 0 */
  --z-dropdown: 10;     /* §22.3 row 2: --z-dropdown = 10 */
  --z-sticky:   30;     /* §22.3 row 3: --z-sticky = 30 */
  --z-overlay:  40;     /* §22.3 row 4: --z-overlay = 40 */
  --z-modal:    50;     /* §22.3 row 5: --z-modal = 50 */
  --z-popover:  50;     /* §22.3 row 6: --z-popover = 50 */
  --z-toast:    100;    /* §22.3 row 7: --z-toast = 100 */
```

Every value matches §22.3's table row-for-row (`0/10/30/40/50/50/100`).

**The external-prefix list, each entry with proof (A2/R6):**

| Entry | Kind | Proof |
|---|---|---|
| `--tw-` | prefix | `.next/static/css/{7a656919e984544b,e55fe1d775976885,fad9e7e06b1bbcf3}.css` all contain `--tw-*` declarations; generated by every Tailwind utility class |
| `--mantine-` | prefix | `.next/static/css/{9dc1e6f1b8f5941a,e35dfb38818993df,e55fe1d775976885}.css` contain `--mantine-*`; every `node_modules/@mantine/core/styles/*.css` file defines `--mantine-*` vars |
| `--spacing` | exact name | `node_modules/tailwindcss/theme.css:325` (`--spacing: 0.25rem;`); also `.next/static/css/e55fe1d775976885.css` (`--spacing:.25rem;`). 3 real consumption sites forced this: `MobileBottomNavView.module.css:74,138`, `HeroSearchView.module.css:87` (all `calc(var(--spacing) * N)`) |
| `--default-transition-timing-function` | exact name | `node_modules/tailwindcss/theme.css:493` and `index.css:502`; also in `.next/static/css/e55fe1d775976885.css`. 1 real consumption site: `MobileBottomNavView.module.css:92` — `var(--tw-ease, var(--default-transition-timing-function))`, discovered by the real gate run at I4, not by the pre-implementation research grep (see §12, limitation) |

`--z-` is absent from both lists, per the requirement.

---

## 5. A5 fallback decision + A4/A6 limitations

**A5 (decided):** `var(--x, fallback)` is treated as **resolved** even when `--x` is undefined — a fallback means the declaration can never silently compute to the property's initial value, which is the exact failure mode this category exists to catch. Detected via a top-level comma inside the `var(...)` call (paren-depth-scoped), so a `var()` used *as another var()'s own fallback* (the real `MobileBottomNavView.module.css:92` shape) is still independently checked for its own resolution — proven in §H ("a var() used as ANOTHER var()'s fallback is still independently resolved").

**A4 (limitation, not closed here):** the path-level allowlist (`scripts/design-tokens-allowlist.json`) short-circuits a whole file via `scanContent`'s first line (`if (isAllowlisted(...)) return [];`), so `src/design-system/mantine/**` is exempt from `css-undefined-var` too, same as every other category. Narrowing that allowlist is **717**'s blast radius — not touched here.

**A6 (limitation, not closed here):** `globals.css` is excluded from the scanner entirely (`SKIP_FILES`, unchanged). A self-referential mistake inside `globals.css` (e.g. a token defined in terms of a misspelled sibling) is not caught by this category.

---

## 6. The gate's two arms (R5, D32)

**Arm 1 — plant present.** `src/components/layout/__task718-plant__.module.css`:
```css
.plant {
  z-index: var(--z-does-not-exist);
}
```
`node scripts/check-design-tokens.mjs --strict` → exit **1**, naming `var(--z-does-not-exist)` at `:2` under category `css-undefined-var`. Transcript: `.screenshots/task718-evidence/i6-arm1-plant-nonzero-exit.log`.

**Arm 2 — plant removed.** Same command → exit **0**, `✅ 0 violations found`. Transcript: `.screenshots/task718-evidence/i6-arm2-plant-removed-exit-zero.log`. `git status --porcelain` immediately after removal showed only the 5 intended edits (`docs/backlog.md`, `docs/design-system.md`, `scripts/__tests__/check-design-tokens.test.ts`, `scripts/check-design-tokens.mjs`, `src/app/globals.css`) — the plant file is gone, not merely reverted.

Unit-level equivalent (§H, first arm): `var(--z-does-not-exist)` plants a `css-undefined-var` finding with `match: 'var(--z-does-not-exist)'` — passing.

**D32 sequencing note:** the failing-arm proof was captured by temporarily restoring the pre-Task-718 `scripts/check-design-tokens.mjs` (via `git show HEAD:scripts/check-design-tokens.mjs`, read-only) over the implemented version and re-running the test suite — `extractCssCustomPropertyDefinitions is not a function`, whole suite fails, exit 1 (`.screenshots/task718-evidence/i2-failing-arms-pre-implementation.log`). The implemented version was then restored byte-for-byte (diffed against a scratch backup to confirm) and the suite re-run: 84/85 passing, the one failure being the R1 regression-lock arm (`--z-*` tokens not yet defined in `globals.css` at that point) — exactly the expected pre-I5 state (`.screenshots/task718-evidence/i2-arms-post-implementation-pre-token-def.log`).

---

## 7. The I8 zero-consumer re-proof (R2)

Command: `grep -rn "var(--z-" src --include=*.css --include=*.tsx --include=*.ts`

Output: one hit — `src/app/globals.css:270`, which is the explanatory comment this task added (`/* Named tokens for var(--z-*) access ... */`), not a consumption. `globals.css` is excluded from the detector's scan entirely. Excluding that file: **0** real consumers. Full transcript: `.screenshots/task718-evidence/i8-zero-consumers-reproof.log`.

Conclusion: defining the seven tokens changed **zero** rendered pixels — no `.module.css` diff (R11), no consumer exists to be affected.

---

## 8. R8's two strings, before/after

**Before** (`:783`/`:797` in the pre-Task-718 file):
```js
console.log(`  ── CSS DECLARATION LITERALS — report-only, not blocking (Task 714)  (${cssDeclFindings.length} finding${cssDeclFindings.length === 1 ? '' : 's'}) ──`);
...
console.log(`  715 owns the strict flip + remediation of this inventory. Docs: docs/design-system.md §23.6.`);
```

**After:**
```js
console.log(`  ── CSS DECLARATION LITERALS — legacy report-only heading, always 0 since Task 715  (${cssDeclFindings.length} finding${cssDeclFindings.length === 1 ? '' : 's'}) ──`);
...
console.log(`  715 flipped css-length/css-duration/css-zindex to blocking; they report above with every other category now. Docs: docs/design-system.md §23.6.b.`);
```

Neither claims report-only status or pending-715 ownership. `REPORT_ONLY_CATEGORIES` has been an empty set since Task 715, so `cssDeclFindings` is structurally always `[]` — the heading is kept for output-shape stability only.

---

## 9. Test-suite note (R9) — the fictitious `--x` sites

Adding `css-undefined-var` as a real detection category meant every pre-existing CSS fixture containing a `var(--realToken)` (`--space-6`, `--border`, `--foreground`, `--primary`, `--space-2`/`--space-4`, `--tw-shadow-color`) would, under a naive empty-default resolution set, spuriously trip the new category and break `toHaveLength` assertions that were never about it. Fix: `findingsOfCss`/`regularCss` now default to `REAL_GLOBALS_DEFINED_PROPS` — the actual `src/app/globals.css` definitions, read once via `extractCssCustomPropertyDefinitions(readFileSync(...))` — so every fixture using a **real** token resolves exactly as it does in production. This fixed 12 of 15 initially-impacted assertions for free, honestly (those tokens really are defined).

The 3 remaining sites use `--x`, a fictitious placeholder with no real-world counterpart (`calc(var(--x) * 2)`, `calc(var(--x) + 2px)` — testing the *shorthand/function-wrapped css-length* exemption, not var-resolution). These were scoped to `.filter(f => f.cat === 'css-length')` before their `toHaveLength(0)` check, following this suite's own established precedent (see the pre-existing `--tw-shadow` shorthand test's "not this test's concern — scope to css-length only" comment). No pre-existing assertion's *meaning* changed; each now isolates the category it was actually testing.

Totals: 69 pre-existing (unweakened) + 16 new §H arms = **85**, all passing (`.screenshots/task718-evidence/i5-post-token-definition-vitest.log`).

---

## 10. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (I1) | empty | pre-write snapshot |
| 2 | `npm run check:design-tokens` (I1, before any edit) | exit 0, 0 violations | `i1-baseline-check-design-tokens.log` |
| 3 | `npx vitest run .../check-design-tokens.test.ts` (I1) | 69/69 passing | `i1-baseline-vitest.log` |
| 4 | Test suite with new arms, implementation reverted (I2, D32) | **whole suite fails** (`extractCssCustomPropertyDefinitions is not a function`), exit 1 | `i2-failing-arms-pre-implementation.log` |
| 5 | Test suite, implementation restored, tokens not yet defined | 84/85 passing (1 expected fail: R1 regression lock) | `i2-arms-post-implementation-pre-token-def.log` |
| 6 | `node scripts/check-design-tokens.mjs --strict` (I4, pre-token-definition) | exit 0, 0 findings — after adding the 2 measured external exact-names | `i4-baseline-zero-pre-token-definition.log` |
| 7 | Same, after defining the 7 tokens (I5) | exit 0, unchanged | `i5-post-token-definition-check-design-tokens.log` |
| 8 | Test suite, after token definition | **85/85 passing** | `i5-post-token-definition-vitest.log` |
| 9 | Planted `var(--z-does-not-exist)`, gate run (I6 arm 1) | **exit 1**, names the plant | `i6-arm1-plant-nonzero-exit.log` |
| 10 | Plant removed, gate run (I6 arm 2) | exit 0 | `i6-arm2-plant-removed-exit-zero.log` |
| 11 | `git status --porcelain` after plant removal | 5 intended files only, plant gone | inline in §6 |
| 12 | `grep -rn "var(--z-" src ...` (I8) | 1 hit = own comment; 0 real consumers | `i8-zero-consumers-reproof.log` |
| 13 | `npx tsc --noEmit` | exit 0 | `tsc-check.log` |
| 14 | `npm run build` | **[see §10a below]** | `npm-build.log` |

### 10a. Production build (R12, hard gate)

`npm run build` → **exit 0**. Full unpiped transcript at `.screenshots/task718-evidence/npm-build.log` (89 lines, `EXIT_CODE=0` on the final line). Compiled successfully; all admin/API/auth routes listed with unchanged First Load JS shared baseline (184 kB). No new warnings introduced.

---

## 11. Counting gates (I9) — run last, after scratch cleanup

Scratch state before the counting gates: `git status --porcelain` showed the 5 modified files (§1) plus this session log as the sole untracked file — the plant file had already been deleted (§6, arm 2) and confirmed gone; no other untracked/scratch files existed.

| Gate | Result | Reconciliation |
|---|---|---|
| `npm run check:file-integrity` | ✅ PASSED — 6 file(s) clean (NUL bytes · BOM · JSON parse · `node --check` · truncation) | 6 = the 5 `git status` `M` entries + 1 `??` entry (this session log) — exact match |
| `npm run check:mojibake` | ✅ 0 artifacts in 2076 files scanned | Repo-wide scan, not diff-scoped; 0 findings against the touched files |

Both exit 0. Transcripts: `.screenshots/task718-evidence/i9-file-integrity.log`, `.screenshots/task718-evidence/i9-mojibake.log`.

---

## 12. Standing findings not acted on

- **717** — the `src/design-system/mantine` path-level allowlist still short-circuits `css-undefined-var` (and every other category) for that whole directory. Not this task's blast radius (A4).
- **711** — `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` re-anchoring onto Mantine DOM. Unrelated to this task.
- **700** — the general `@theme`-dependency gate (fail when a `.module.css` consumes an `@theme` var whose last utility consumer disappears) is adjacent to this task's territory but not the same mechanism — `css-undefined-var` catches an undefined reference, not an orphaned-but-defined one. Not closed here.
- **702/691 (Sprint 46)** — `ListingCard`/`MantineListingCardPattern` de-Tailwind. Unrelated.

---

## 13. Assumptions, deviations, limitations, unresolved issues

- **Deviation from kickoff sequencing (D32):** the gate implementation (I3) was written before the failing-arm test file was authored (I2), inverting the kickoff's stated order. This was corrected retroactively by reverting the real implementation file (via `git show HEAD:...`, read-only) and re-running the test suite to capture a genuine failing transcript before restoring the implementation — see §6's "D32 sequencing note". The end evidence satisfies D32 (a real failing run exists, captured and persisted), but the work was not done in the prescribed order. Flagging this honestly for the reviewer rather than describing it as sequential.
- **A5, A4, A6** — see §5, decided/documented as required, not left silent.
- **The external-prefix list grew by one entry mid-implementation** (`--default-transition-timing-function`) beyond what the pre-implementation research grep found — the research script's naive regex could not correctly parse a `var()` nested inside another `var()`'s fallback (a regex limitation in the *throwaway measurement script*, not in the shipped detector, which uses proper paren-balance walking and found it correctly on the first real gate run). Documented in §4/§12 rather than hidden.
- No known unresolved issues against R1–R13.

---

## 14. Backlog update

`docs/backlog.md` updated: Last Session header/bullet, Sprint 52 line, and the 718 task-registry row all updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a concise summary. **Line count held at 86 → 86 (net zero)** — edits replaced existing content rather than appending. The file remains above the ~80-line target and in **BACKLOG LIMIT BREACH** (unchanged from before this session) — re-flagging per the kickoff's instruction; Opus consolidation is still needed, this session did not add to the problem but also did not resolve it.
