# Task 694 — Brand single-source ΔE sync gate — session log

**Kickoff:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_694_Brand_Single_Source_Delta_E_Sync_Gate.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q4 — Release/Critical Flow (selected for the planted-violation failure proof requirement only; no
blast-radius or visual axis applies — comment-only product edit, no rendered surface).

---

## 1. Files changed

| Path | Reason |
|---|---|
| `scripts/__tests__/brand-single-source.test.ts` | **created** — the gate (R1–R7) |
| `src/app/globals.css` | **modified** — `--brand-950` comment text corrected `#180807` → `#0F0504` at both sites (block comment + trailing comment). The `oklch()` value is untouched. |
| `docs/backlog.md` | **modified** — concise state update, 694 row + Last Session header (net line count unchanged: 89 → 89) |
| `docs/sessions/2026-08-10-task694-brand-single-source-delta-e-gate.md` | **created** — this log |

Reconciled against `git status --porcelain` (final):

```
 M src/app/globals.css
?? scripts/__tests__/brand-single-source.test.ts
```

(`docs/backlog.md` and this session log are additional edits made after that snapshot, both in scope per §7.)
No `package.json`, `vitest.config.ts`, or `.github/` path appears — R8/AC7 satisfied.

---

## 2. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 | Gate fails when `theme.ts` stops consuming `brand.ts` by import identity | Assertion A; Plant P4 confirmed (§5) |
| R2 | Gate fails when a documented brand hex drifts (ΔE00) | Assertions B, C, D, E; Plants P1, P2 confirmed (§5) |
| R3 | Gate fails when the `globals.css` alias index mapping breaks | Assertion B (index sub-check); Plant P3 confirmed (§5) |
| R4 | `--brand-950` comment states its actual rendered colour | §10.5 edit applied; Assertion D passes post-edit; AC5 ΔE00 3.6446 → 0.0000 (§6) |
| R5 | `--brand-950` exemption is a declared, gate-read exemption | Assertion F; Plant P5 confirmed (§5) |
| R6 | Gate's own colour maths is self-validating | §10.3 block; Plant P7 confirmed — self-validation fails before any project assertion (§5) |
| R7 | Rewording a comment without changing its hex must not fail | Plant P6 control confirmed passing (§5) |
| R8 | Zero dependency/config/CI additions | `git status --porcelain` — no `package.json`/`vitest.config.ts`/`.github/` path (§1) |
| R9 | Zero rendered delta — comment-only product edit | `git diff -- src/app/globals.css` (§7); `npm run build` exit 0 (§8) |
| R10 | Concise backlog update + full session log | `docs/backlog.md` diff (§1); this log |

All ten requirements are evidenced. None are incomplete.

---

## 3. Current versus required behavior

**Current (pre-task):** `brand.ts` was the single authored brand source by convention and code comment only.
Nothing in `lint`, `typecheck`, `build`, `check:design-tokens`, or the vitest suite would notice `theme.ts` being
edited to inline a literal tuple, an alias row being repointed to the wrong Mantine index, or any documented hex
drifting. `--brand-950`'s comment stated `#180807` while its `oklch(0.132 0.022 23)` value has always rendered
`#0F0504` (ΔE00 3.6446), undetected since Task 661 (2026-07-23).

**Required (post-task):** All of the above now fail a named `it()` in `scripts/__tests__/brand-single-source.test.ts`
with a message stating the absolute file path, the token, both values, and the measured ΔE00 to 4 dp.
`--brand-950`'s comment now matches what it renders. Nothing about the rendered application changed (comment-only
diff, confirmed at §7).

**Negative-flow applicability** (per §11 of the kickoff):

| Branch | Applicable? | Evidence |
|---|---:|---|
| Validation | No | No form/action/schema touched |
| Authorization/RLS | No | No route/action/table touched |
| Offline/network | No | Gate reads the filesystem only |
| Concurrent writer | No | No data model touched |
| Gate false-negative | **Yes** | Every plant P1–P5 fails; control P6 does not (§5) |
| Gate self-blindness | **Yes** | Plant P7 — §10.3 self-validation fails first (§5) |
| Rendered regression | **Yes** | `git diff` shows comment-only change; `npm run build` exit 0 (§7, §8) |

---

## 4. Colour-maths implementation and independent verification

Before writing the gate, the oklch → sRGB and CIEDE2000 implementation specified in §10.3 was written and run
standalone (outside the repo, scratch script) against every anchor and reference value the kickoff names, to
confirm the maths before trusting it inside the gate:

```
--- Sharma reference pairs ---
2.0425 2.0425 OK
2.8615 2.8615 OK
3.4412 3.4412 OK
1.0000 1.0000 OK
1.2644 1.2644 OK
2.0373 2.0373 OK
--- oklch anchors ---
oklch(1 0 0) -> #FFFFFF expect #FFFFFF
oklch(0 0 0) -> #000000 expect #000000
oklch(0.628 0.2577 29.23) -> #FF0000 expect #FF0000
oklch(0.8664 0.2948 142.4953) -> #00FF00 expect #00FF00
oklch(0.452 0.3132 264.052) -> #0000FF expect #0000FF
--- brand-950 ---
oklch(0.132 0.022 23) -> #0F0504 expect #0F0504
ΔE00 vs #180807: 3.6446 expect 3.6446
ΔE00 vs #0F0504: 0.0000 expect 0.0000
--- brand drift pairs ---
#EC5447 vs #D25656 ΔE00: 6.8074 expect 6.8074
#EC5447 vs #ED5447 ΔE00: 0.1838 expect 0.1838
#EC5447 vs #EC5447 ΔE00: 0.0000 expect 0.0000
```

Every value matches the kickoff's §3.3 measurements exactly. The same functions were then embedded verbatim in
`scripts/__tests__/brand-single-source.test.ts` and re-verified in-repo by the `§10.3` `describe` block (AC1, AC2).

**Identity precondition verified before writing Assertion A:** a throwaway vitest file confirmed
`theme.colors.brand === brand` (`true`) under the `node` environment before committing to `toBe` as the assertion —
`createTheme` preserves the array reference rather than cloning it. That scratch file was deleted immediately after
(`git status --porcelain` clean before the real gate file was created).

---

## 5. All seven planted controls — verbatim failure/pass output, md5-witnessed restores

I0 md5 (before any plant):

```
9da4e21dd8fbdaa5b69ccbdb36cfae4d *src/design-system/brand.ts
7e1e779596ac7ac7ccf11f3ff1152671 *src/app/globals.css        (post-§10.5-fix state)
b026cba445b83c89f277c93e99941a3c *src/design-system/mantine/theme.ts
1e7aa1cc1a78ea24d80ca0a0d60fdba3 *src/modules/notifications/lib/emails/BaseEmail.tsx
743eddaa4b0b6820e888f0154a6804bd *scripts/__tests__/brand-single-source.test.ts   (pre-typecheck-fix)
```

### P1 — `brand.ts` `#EC5447` → `#D25656`

```
 × --brand-700's comment hex measures ΔE00 = 0 against brand[7]
AssertionError: ...--brand-700 comment hex #EC5447 vs brand[7] #D25656 measures ΔE00 6.8074 (tolerance 0)...
 × header comment hexes match brand[7] (BRAND_PRIMARY) and brand[8] (BRAND_HOVER) at ΔE00 = 0
AssertionError: ...header comment BRAND_PRIMARY hex #EC5447 vs brand[7] #D25656 measures ΔE00 6.8074 (tolerance 0)...
 Tests  2 failed | 29 passed (31)
```

Fails assertions **B** and **E**, ΔE00 `6.8074` exactly as the kickoff's §13.2 table specifies.

**Deviation from the kickoff table:** §13.2 lists P1's "must fail" set as **B, C, E**. Assertion **C** checks only
`--accent` against `brand[0]` (`#FDEEED`), which P1 does not touch (P1 edits index 7). C correctly did **not** fail
under this plant — the kickoff table appears to be in error on this one cell. Requirement R2 ("gate fails when any
documented brand hex drifts") is still fully evidenced by B and E both failing with the exact expected ΔE00.
Restoring C to react to an unrelated index would have been the wrong fix, so the gate was not changed. Restore
confirmed: `md5sum src/design-system/brand.ts` = `9da4e21dd8fbdaa5b69ccbdb36cfae4d` (matches I0);
`git status --porcelain -- src/design-system/brand.ts` empty.

### P2 — one alias comment `#EC5447` → `#ED5447`

```
 × --brand-700's comment hex measures ΔE00 = 0 against brand[7]
AssertionError: ...--brand-700 comment hex #ED5447 vs brand[7] #EC5447 measures ΔE00 0.1838 (tolerance 0)...
 Tests  1 failed | 30 passed (31)
```

Fails assertion **B** only, ΔE00 `0.1838` — matches §13.2 exactly. Restore confirmed:
`md5sum src/app/globals.css` = `7e1e779596ac7ac7ccf11f3ff1152671` (matches post-§10.5-fix state).

### P3 — `--brand-700: var(--mantine-color-brand-8)` (wrong index)

```
 × --brand-700 maps to --mantine-color-brand-7 (index mapping, not a ΔE)
AssertionError: ...--brand-700 declares var(--mantine-color-brand-8), expected var(--mantine-color-brand-7).
This is an index mapping defect, not a colour drift.: expected 8 to be 7
 Tests  1 failed | 30 passed (31)
```

Fails assertion **B**'s index sub-check with an index-mapping message, not a ΔE message — matches §13.2. The
ΔE00 sub-check for the same row did not fail (comment hex `#EC5447` still equals `brand[7]` `#EC5447`), correctly
isolating the two defect classes. Restore confirmed: `md5sum src/app/globals.css` =
`7e1e779596ac7ac7ccf11f3ff1152671` (matches).

### P4 — `theme.ts` inline literal tuple, identical values

```
 × theme.colors.brand is the same array reference as the brand.ts export
AssertionError: ...theme.colors.brand is not the same array identity...: expected [ '#FDEEED', '#FBDDDA', …(8) ]
to be [ '#FDEEED', '#FBDDDA', …(8) ] // Object.is equality
Compared values have no visual difference.
 Tests  1 failed | 30 passed (31)
```

Fails assertion **A** on identity — vitest's own diff explicitly states "Compared values have no visual
difference," proving `toEqual` would have passed and only `toBe` (identity) catches it, per R1's requirement.
Restore confirmed: `md5sum src/design-system/mantine/theme.ts` = `b026cba445b83c89f277c93e99941a3c` (matches I0).

### P5 — delete `intentionally NOT tuple-derived` from the `--brand-950` block comment

```
 × the block comment still states the exemption and cites Task 661
AssertionError: ...the --brand-950 block comment no longer contains the literal substring
"intentionally NOT tuple-derived"...: expected false to be true
 Tests  1 failed | 30 passed (31)
```

Fails assertion **F** with the missing-exemption message — matches §13.2. Restore confirmed:
`md5sum src/app/globals.css` = `7e1e779596ac7ac7ccf11f3ff1152671` (matches).

### P6 — control: reword an alias comment, hex unchanged

Comment changed from `/* #EC5447 — primary */` to `/* #EC5447 — the primary CTA colour */` (hex untouched).

```
 Test Files  1 passed (1)
      Tests  31 passed (31)
```

**Must still pass — confirmed.** All 31 tests green; R7 evidenced. Restore confirmed:
`md5sum src/app/globals.css` = `7e1e779596ac7ac7ccf11f3ff1152671` (matches).

### P7 — alter one oklch → sRGB coefficient (self-blindness control)

Changed `4.0767416621` → `4.1767416621` in the R-channel matrix row inside the gate file itself.

```
 × oklch → sRGB conversion matches five exact anchors
AssertionError: oklch(0.8664 0.2948 142.4953) → #41FF00, expected #00FF00
 × the proven #180807 round trip: oklch(0.132 0.022 23) renders #0F0504, not its own comment hex
AssertionError: oklch(0.132 0.022 23) → #100504, expected #0F0504
 (cascading) × assertion D ×2 — --brand-950's oklch() renders #100504 vs comment #0F0504, ΔE00 0.4494
 Tests  4 failed | 27 passed (31)
```

The **§10.3 self-validation block fails first**, before the project assertions that depend on the same broken
conversion cascade into unrelated-looking failures — exactly the ordering R6/AC2 requires. Restore confirmed:
`md5sum scripts/__tests__/brand-single-source.test.ts` = `743eddaa4b0b6820e888f0154a6804bd` (matches the
pre-plant, pre-typecheck-fix snapshot taken immediately before P1); `git status --porcelain` at that point showed
only the intended `M src/app/globals.css` + `?? scripts/__tests__/brand-single-source.test.ts`, no stray plant.

---

## 6. Measured ΔE00 — before and after the `--brand-950` correction

| Pair | ΔE00 before §10.5 | ΔE00 after §10.5 |
|---|---:|---:|
| All 10 `globals.css:356-365` alias comment hexes vs `brand[N]` | 0.0000 (unaffected by §10.5) | 0.0000 |
| `globals.css` `--accent` comment `#FDEEED` vs `brand[0]` | 0.0000 (unaffected) | 0.0000 |
| `BaseEmail.tsx` `#EC5447` vs `brand[7]` · `#BD4339` vs `brand[8]` | 0.0000 (unaffected) | 0.0000 |
| `--brand-950` block comment vs its `oklch()` render | **3.6446** | **0.0000** |
| `--brand-950` trailing comment vs its `oklch()` render | **3.6446** | **0.0000** |

Matches AC5 exactly: pre-edit `3.6446`, post-edit `0.0000` at both sites.

---

## 7. `git diff -- src/app/globals.css` (full, AC6)

```diff
diff --git a/src/app/globals.css b/src/app/globals.css
index e9fe1f92d..76589d1a7 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -366,9 +366,9 @@
   /* --brand-850 removed (Task 661 OQ1): no Mantine index and grep-confirmed zero
      consumers (only ever self-defined, never referenced). */
   /* --brand-950 intentionally NOT tuple-derived (Task 661 OQ2): renders near-black
-     (#180807), not a red tint of the brand scale — kept hand-authored. Live consumers:
+     (#0F0504), not a red tint of the brand scale — kept hand-authored. Live consumers:
      HeroSearch.stories.tsx, PopularLocationsView.tsx gradient stops. */
-  --brand-950: oklch(0.132 0.022 23);   /* #180807 — intentionally NOT brand-scale-derived */
+  --brand-950: oklch(0.132 0.022 23);   /* #0F0504 — intentionally NOT brand-scale-derived */
 
   /* ── Neutral scale — all surfaces use these ── */
   --neutral-0:   oklch(1 0 0);          /* Pure white */
```

Only characters inside CSS comments changed. `--brand-950: oklch(0.132 0.022 23);` is byte-identical before and
after — R9 evidenced.

---

## 8. §13.3 commands — actual results

1. **`git status --porcelain` at I0**, and backlog baseline: worktree clean at start (task-file read confirmed no
   pending changes). `git show HEAD:docs/backlog.md | wc -l` → **89** (already over the ~80-line target before
   this task's own edit — see §9 BACKLOG LIMIT BREACH).
2. **md5 witnesses** — see §5's I0 table and the final table below.
3. **`npx vitest run` — full suite, before and after §10.5:**
   - *Before* (globals.css comment reverted to `#180807` via file edit, not git): `Test Files 1 failed | 77 passed
     (78)`, `Tests 2 failed | 1309 passed (1311)` — the 2 failures are exactly the known unfixed `--brand-950`
     defect (assertion D, both sites). No occurrence of the known flaky trio
     (`date-format-ssr-parity`/`RangeDatePicker`/`saveSavedSearch.dedup`).
   - *After* (§10.5 reapplied): `Test Files 78 passed (78)`, `Tests 1311 passed (1311)`. Zero failures, flaky trio
     absent again.
4. **`npx vitest run scripts/__tests__/brand-single-source.test.ts`** — clean run: `Test Files 1 passed (1)`,
   `Tests 31 passed (31)`. Once per plant: see §5 (each plant's exact fail/pass count recorded there).
5. **`npm run typecheck`** — first run found one real defect this gate introduced:
   `scripts/__tests__/brand-single-source.test.ts(385,7): error TS18048: 'theme.colors' is possibly 'undefined'.`
   Fixed by asserting `theme.colors!.brand` (the value is known-defined at runtime — `createTheme` was called with
   an explicit `colors` object two lines above the import). Re-run: **exit 0, zero errors.** All plant re-runs
   after this fix continued to pass/fail exactly as before (P6, P7 re-verified post-fix).
6. **`npm run check:design-tokens`** — `✅ check:design-tokens — 0 violations found` (437 files scanned,
   `globals.css` excluded per its own header — confirms the file stays untouched by this gate).
7. **`npm run check:mojibake`** — `check:mojibake: 0 artifacts in 2152 files`.
   **`npm run check:file-integrity`** — `✅ check:file-integrity PASSED — all 2 file(s) clean` (the 2 changed
   files: `globals.css` + the new test file).
8. **`npm run build`** — unpiped, exit code captured as a separate statement: `BUILD_EXIT_CODE=0`. 40/40 static
   pages generated, "Compiled successfully in 56s". **Exit 0 — mandatory gate satisfied.**
9. **`git diff -- src/app/globals.css`** — quoted in full at §7.

**Final md5 table** (I0 vs final; `globals.css` is expected to differ, the other three are not):

| File | I0 | Final | Changed? |
|---|---|---|---|
| `src/app/globals.css` | `df3173aea2cc8d1b61b59fd24ec61b1d` | `7e1e779596ac7ac7ccf11f3ff1152671` | **Yes** (expected — §10.5) |
| `src/design-system/brand.ts` | `9da4e21dd8fbdaa5b69ccbdb36cfae4d` | `9da4e21dd8fbdaa5b69ccbdb36cfae4d` | No |
| `src/design-system/mantine/theme.ts` | `b026cba445b83c89f277c93e99941a3c` | `b026cba445b83c89f277c93e99941a3c` | No |
| `src/modules/notifications/lib/emails/BaseEmail.tsx` | `1e7aa1cc1a78ea24d80ca0a0d60fdba3` | `1e7aa1cc1a78ea24d80ca0a0d60fdba3` | No |

---

## 9. Assumptions, deviations, limitations, unresolved issues

- **Deviation from §13.2's P1 row (recorded in full at §5):** the kickoff's table lists P1's expected failing set
  as "B, C, E". Assertion C only compares `--accent` against `brand[0]`, which P1's edit (index 7) cannot affect.
  Measured result: P1 fails **B and E only**; C correctly stays green. R2 remains fully evidenced by B+E. This is
  the kickoff's own kind of measured-fact defect the standing notes warn about (M1/M2 corollaries) — recorded here
  rather than silently "fixed" by making C react to an unrelated token.
- **Typecheck defect introduced by the gate itself, found and fixed within this task:** `theme.colors` is typed
  optional by Mantine's `MantineThemeOverride`. Fixed with a non-null assertion (`theme.colors!.brand`) rather than
  an optional chain, because assertion A's identity check requires a concrete value to pass to `toBe`, not
  `undefined`. Re-verified with a full plant re-run (P6, P7) after the fix — no behavior change to the gate's pass/
  fail outcomes.
- **BACKLOG LIMIT BREACH (unresolved, per R10):** `docs/backlog.md` was **89 lines at `HEAD`**, already above the
  ~80-line target, before this task made any edit. This task's edits kept the line count at 89 (no growth), but did
  not reduce it — that requires Opus consolidation, which is out of executor scope.
- **`docs/critical-flow-registry.md`:** scanned per §6 of the kickoff. No entry references brand colour, CSS
  custom properties, or `globals.css`; the closest hits were the magic-link auth-flow rows, unrelated. **No
  critical flow is affected by this task** — confirmed explicitly per item 9 below.
- No other gap, contradiction, or unresolved item was found. §3's measured facts (the ΔE00 table, the brand-chain
  provenance, the D35 overlay-exclusion rationale, the 692 structural precedent) were all re-derived independently
  during implementation (§4) and matched exactly.

---

## 10. Confirmation — no critical flow affected

`docs/critical-flow-registry.md` was scanned for any reference to brand colour tokens, `globals.css`, or CSS custom
properties. None exists; the file's rows cover auth/magic-link, listing, and payment/moderation flows only. This
task is Docs/Governance with a comment-only CSS edit and does not touch any registered critical flow.
