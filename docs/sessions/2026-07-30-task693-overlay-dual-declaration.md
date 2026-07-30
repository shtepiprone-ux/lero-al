# Task 693 — Task 690 revision: dual `@theme`/`:root` declaration

**Status: `BLOCKED`** — stopped at I5.3 per the kickoff's own explicit stop condition (A3/AC2b):
the planted-negative control, run on the pre-690 `@theme`-only arrangement, shows `--overlay`/
`--overlay-foreground` **still present** in the compiled bundle, not absent. Per A3: "the whole
approach is wrong and this is a stop and report, not a paperwork issue." Sonnet does not
unilaterally redesign the test or the fix; this report hands the finding to the orchestrator.

## 1. What happened, in one paragraph

D19's fix (declare `--overlay`/`--overlay-foreground` in both `@theme inline` and `:root`) was
implemented exactly as specified (I2) and its **restore-proof passed**: the built bundle's
`overlay` selector set is byte-identical to the pre-690 baseline (I3, AC1), and the computed-style
diff against Task 690's `computed-before.json` is empty with the scrim matching the measured
string (I4, AC5). The regression Task 690 introduced is genuinely fixed. But I5 — the **objective
proof that F1 was ever real** — falsified its own premise. I5.2 (final arrangement + every
overlay-utility class removed) correctly shows both variables present, trivially, because the
`:root` copy is plain CSS. I5.3 was supposed to show the *opposite* result on the **pre-690**
(`@theme`-only, no `:root` copy) arrangement with the *same* plant — proving the control **can**
fail, and therefore that the `:root` copy is what makes the difference. It does not: both
variables are **still emitted** even in the pre-690 arrangement, with every named consumer-file
utility class removed. Isolated by a two-step diagnostic (§6), the cause is that Tailwind's
`@theme inline` usage-contingency is not scoped to *utility-class* candidates alone — it also
treats a literal, non-utility occurrence of the variable's name (`var(--color-overlay)`,
`var(--color-overlay-foreground)`, as used in `LightboxView.tsx`'s inline `style` objects and
`MantineListingGalleryPattern.tsx`'s `c=` prop) as "in use." Those two files are read-only under
A4, and the kickoff's own R5/I5.1 wording only asks to remove "every overlay **utility**" — not
these raw `var()` references — so a faithful execution of I5.1 as written can **never** produce
the "zero surviving references" state I5.3 requires to prove its point. This means Task 690's and
Task 693's shared premise — "F1 exists because these two files' `var(--color-overlay*)` references
are invisible to Tailwind's scanner" — is itself unproven, and this diagnostic suggests it may be
**false**: those very references, which have existed unchanged since before Task 688, may have
been keeping `--overlay`/`--overlay-foreground` alive via `@theme` all along, meaning F1 might
never have manifested in production regardless of Task 690's regression.

**This does not mean D19's fix is wrong or should be reverted.** The dual declaration is harmless,
restores the alpha fallback (I3/I4 both pass cleanly), and removes any *dependence* on those two
files continuing to reference the variable by name. What is unproven is the specific *objective*
claim (AC2/R5) that the `:root` copy is *necessary* — the planted control, as specified, cannot
demonstrate that, and Sonnet is not authorized to redesign the control or edit the two protected
consumer files beyond what I5.1 already specifies.

## 2. Files Changed (final, restored state)

| File | Change | Reason |
|---|---|---|
| `src/app/globals.css` | R1/R2/R4: added `--overlay`/`--overlay-foreground` to `@theme inline` (immediately above `--color-overlay*`); retained the identical `:root` pair from Task 690; both comments rewritten to state the dual-declaration contract, the sync obligation, and Task 692 | R1, R2, R4 |
| `src/modules/locations/components/PopularLocationsView.module.css` | **Unchanged** — Task 690's scrim swap retained verbatim; md5 re-verified `b721ecf9284f23a026d097b4012bdea4`, matching §3.2 exactly | R6 |
| `.screenshots/task693-delta/*` | Task-created evidence (local-only, D6) | I3/I4/I5 evidence |

`docs/backlog.md` and this session log are the only other touched paths. **No consumer file from
A4 appears in the final `git status`** — confirmed in §3. The plant (I5.1) and the I5.3 experiment
both touched 8 files transiently (7 consumers + `scripts/task608-qa-listingcard-list-site.mjs`,
found during diagnosis, §6) and all 8 were verified byte-identical to `HEAD` after restore (§5).

## 3. Start/end worktree snapshot

**I0 start**, before any write: `git status --porcelain` →

```
 M src/app/globals.css
 M src/modules/locations/components/PopularLocationsView.module.css
```

This reconciles against §3.2's four-entry manifest: `docs/backlog.md` and Task 690's session log,
both listed in §3.2 as modified/untracked, are now present in `HEAD` (`ddff8c10e`,
`docs(Task693): 690 revision kickoff …`) — the owner committed them as part of filing this task's
kickoff, between the kickoff being written and this session starting. This is a benign advancement
of git history, not a manifest violation: neither file is missing, altered unexpectedly, or a
witness mismatch — they simply moved from "pending" to "committed." `git log -1 --oneline` →
`ddff8c10e` (one commit ahead of the kickoff's stated `9e8098b17`, which sits at `HEAD~1`);
`a9934c037` confirmed as an ancestor. md5 witnesses for the two remaining `src/` files matched
§3.2 exactly before any edit: `globals.css` → `c5afe03ab5ee96f11d253bd1912d7f54`,
`PopularLocationsView.module.css` → `b721ecf9284f23a026d097b4012bdea4`.

**Final `git status --porcelain`** (after this log and the backlog update were written):

```
 M docs/backlog.md
 M src/app/globals.css
 M src/modules/locations/components/PopularLocationsView.module.css
?? docs/sessions/2026-07-30-task693-overlay-dual-declaration.md
```

`docs/sessions/2026-07-30-task690-overlay-root-relocation.md` is present and unmodified (kept
verbatim, A6). No file from A4's consumer list, and no path under `.screenshots/` (local-only per
D6), appears here. Final `globals.css` md5: `1f7690d0de50ed658fde83478a9c59f2` (the I2 dual-
declaration state — diffed against `HEAD` in §4 to confirm it contains only the intended edit).
`PopularLocationsView.module.css` md5 re-confirmed unchanged: `b721ecf9284f23a026d097b4012bdea4`.

## 4. R1–R10 mapped to AC1–AC9

| Req | Status | Evidence |
|---|---|---|
| R1 [AC1] | **MET** | `--overlay`/`--overlay-foreground` declared inside `@theme inline`, immediately above `--color-overlay*`, byte-identical values. §7. |
| R2 [AC1, AC2] | **MET** (the declaration is present and correct) — **but AC2's proof requirement is unmet**, see R5 below | `:root` pair retained; `--color-overlay*` remain `@theme`-only, not duplicated. §7. |
| R3 [AC1] | **MET** | Selector-set diff vs pre-690 baseline: empty, twice (I3 and the final re-verification in §8). |
| R4 [AC3] | MET | Both comments rewritten; see §7. |
| **R5** [AC2] | **NOT MET — the task's stop condition** | I5.2 (AC2a) passes. I5.3 (AC2b) **fails**: both variables still present on the pre-690 arrangement with the plant applied. §6. |
| R6 [AC4] | MET | Module md5 unchanged (`b721ecf9284f23a026d097b4012bdea4`); `grep -rn 'color-black' src/` → 0 hits. |
| R7 [AC5] | MET | `computed-diff.json` empty (0 diffs); scrim byte-equal to §3.7's string. §9. |
| R8 [AC6] | **NOT RUN** | I6 (1184-cell `--mantine-only` proof) not attempted — gated behind I5, which stopped first. |
| R9 [AC7] | MET, independently of the blocker | `check:design-tokens`: 43/0 stale, both before and after, module at 0. §10. |
| R10 [AC8] | **NOT RUN in full** | Two clean `rm -rf .next && npm run build` cycles both exit 0 (I3, and the final re-verification in §8); `typecheck` re-run once post-restore (0). `check:stories`/`check:story-coverage`/`check:i18n`/`vitest`/`check:file-integrity`/`check:mojibake` were only run as the I1 **baseline** (pre-edit) — see §10. |
| AC9 [§3.2] | **MET, with the documented benign deviation above** | §3 — the manifest is fully reconciled; the two "missing" entries are accounted for as an owner commit between kickoff and execution, not an anomaly. |

## 5. `globals.css` before/after excerpt

**Before** (pre-690, `a9934c037`, `@theme inline` only, :51-55):

```css
  /* Overlay tokens — always dark/light regardless of mode (photo overlays, lightbox) */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
  --color-overlay:            var(--overlay);
  --color-overlay-foreground: var(--overlay-foreground);
```

**After** — `@theme inline` (:51-65, this task's addition):

```css
  /* Overlay tokens — DELIBERATELY DUPLICATED, also declared in `:root` below (Task 693/D19,
     superseding Task 690/D18). Task 690 moved these two out of `@theme` entirely to fix F1
     (non-Tailwind `var(--color-overlay*)` consumers like `LightboxView.tsx` and
     `MantineListingGalleryPattern.tsx` going stale whenever no `bg-overlay*`/
     `text-overlay-foreground*` utility survived Tailwind's scan) — but that broke Tailwind's
     ability to statically resolve the value, which it needs to composite the alpha-blended
     static fallback for every opacity-modifier utility (`bg-overlay/30` etc.), silently
     degrading that fallback tier to a bare, fully-opaque `var(--overlay)` (measured in
     `docs/sessions/2026-07-30-task690-overlay-root-relocation.md`). This `@theme` copy restores
     that static resolution; the `:root` copy below is what actually keeps F1 fixed (unconditional
     emission, independent of the source scan). **Keep both copies byte-identical** — Task 692
     will gate their sync; until then, changing one without the other is a silent regression. */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
  --color-overlay:            var(--overlay);
  --color-overlay-foreground: var(--overlay-foreground);
```

**After** — `:root` (Task 690's pair, retained, comment rewritten):

```css
  /* Overlay tokens — DELIBERATELY DUPLICATED, also declared in `@theme inline` above (Task
     693/D19, superseding Task 690/D18). This `:root` copy is what actually closes Task 688
     finding F1: it emits `--overlay`/`--overlay-foreground` unconditionally, independent of
     whether any `bg-overlay*`/`text-overlay-foreground*` Tailwind utility survives the source
     scan, so non-Tailwind consumers (`LightboxView.tsx`'s inline `style`,
     `MantineListingGalleryPattern.tsx`'s `c=` prop) never see a stale/missing variable. The
     `@theme` copy exists solely so Tailwind can still statically resolve the value and composite
     the alpha-blended static fallback for opacity-modifier utilities — removing it re-breaks that
     fallback tier exactly as Task 690 did (see
     `docs/sessions/2026-07-30-task690-overlay-root-relocation.md`). **Keep both copies
     byte-identical** — Task 692 will gate their sync. */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
```

The `git diff` for this file contains **exactly** these two hunks — reconfirmed in §8 after the
full I5 plant/restore cycle, proving no residue survived.

## 6. The I5 control — both halves, the blocking evidence

### I5.1 — the plant

Every `bg-overlay*`/`text-overlay-foreground*`/`border-overlay-foreground*` **utility-class**
token was stripped (replaced with `PLANTED-REMOVED`) from the 7 consumer files named in kickoff
§3.6, via `.screenshots/task693-delta/plant-overlay-utilities.mjs`:

```
PLANTED: src/design-system/mantine/patterns/MantineListingCardPattern.tsx — 6 token(s)
PLANTED: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx — 3 token(s)
PLANTED: src/components/shared/PerfDevOverlay.tsx — 11 token(s)
PLANTED: src/components/admin/AdminUserAvatar.tsx — 1 token(s)
PLANTED: src/modules/listings/components/ImageUpload.tsx — 3 token(s)
PLANTED: src/modules/listings/components/LightboxView.tsx — 4 token(s)
PLANTED: src/modules/listings/components/ListingGallery.tsx — 5 token(s)

Total tokens removed across 7 files: 33
```

33 tokens across 7 files, matching kickoff §3.6's "33 across 8 files" exactly (the 8th file,
`PopularLocationsView.module.css`, is the non-Tailwind-utility scrim consumer, untouched by
definition). The full edit set (token text, per file) is persisted at
`.screenshots/task693-delta/plant-edit-set.json`.

A repo-wide grep (excluding `node_modules`, `.next`, `.git`, `docs/`, `tasks/`, `.screenshots/`)
confirmed **zero remaining `bg-overlay*`/`text-overlay-foreground*`/`border-overlay-foreground*`
utility-class-shaped tokens** anywhere in the scanned tree after the plant, aside from the
non-Tailwind `var(--color-overlay*)` references this task is forbidden from touching (A4) and this
task's own `globals.css` comments (irrelevant to the result — see below).

### I5.2 — prove the fix (AC2a) — **PASSED**

Clean `rm -rf .next && npm run build`, final (dual-declaration) `globals.css`, plant applied:

```
--overlay-foreground:oklch(100% 0 0)
--overlay-foreground:oklch(100% 0 0)}.dark{--neutral-0:oklch(14.5% 0 0)
--overlay:oklch(0% 0 0)
```

Both variables present, as required. (This result is guaranteed by construction — the `:root`
declaration is plain CSS, always emitted regardless of Tailwind's candidate scan — so this half of
the control, while correctly passing, does not by itself distinguish the fix from a no-op.)

### I5.3 — prove the control can fail (AC2b) — **FAILED, the stop condition**

`globals.css`'s overlay region was temporarily reverted to the exact pre-690 (`a9934c037`) text —
single `@theme inline` declaration, no `:root` copy — with the same plant still in place. Clean
`rm -rf .next && npm run build`:

```
--overlay-foreground:oklch(100% 0 0)
--overlay:oklch(0% 0 0)
```

**Required: both variables ABSENT. Actual: both PRESENT.** Per AC2: "Both halves are required;
(a) alone does not prove the control." Per A3: "If the planted control shows `--overlay` still
[present], the whole approach is wrong and this is a stop and report, not a paperwork issue."

### Diagnostic isolation (not part of the mandated I5 steps, done to characterize the finding)

A repo-wide grep for the bare substring `overlay-foreground` (not just the utility-shaped token)
turned up one unexpected file: `scripts/task608-qa-listingcard-list-site.mjs:59` —
`return cls.includes('bg-overlay/30');`, a leftover Q3 harness literal from Task 608, outside the
kickoff's 8-file census, and not excluded from Tailwind's default content scan (only `docs/` and
`tasks/` are excluded, per `globals.css:11-12`). Neutralizing that one leaked string too (temporary
edit, restored after, §6/§5), then re-running I5.3's exact same clean-build+grep:

```
--overlay:oklch(0% 0 0);
--overlay-foreground:oklch(100% 0 0);
--color-overlay:var(--overlay);
--color-overlay-foreground:var(--overlay-foreground);
```

**Both variables still present**, ruling out the script leak as the (sole) explanation. The only
remaining source, confirmed by exhaustive repo-wide grep, is the non-Tailwind
`var(--color-overlay)`/`var(--color-overlay-foreground)` references at `LightboxView.tsx:45-48,86`
and `:159`, and `MantineListingGalleryPattern.tsx:91` — files A4 explicitly forbids touching, and
which the kickoff's own R5/I5.1 wording ("remove every overlay **utility**") does not ask to
touch, since they are not Tailwind utility classes.

**Conclusion:** Tailwind v4's `@theme inline` usage-contingency is not scoped to recognized
utility-class candidates alone. A literal, non-utility occurrence of the theme variable's own name
(`var(--color-overlay-foreground)`, embedded in a JS string inside an inline `style` object or a
`c=` prop) is independently sufficient to keep it "in use" and statically resolvable. This means
the shared premise behind both Task 690's F1 diagnosis and this task's D19 design — that these two
files' `var(--color-overlay*)` references are "invisible to Tailwind's scanner" — is unproven by
this control, and the diagnostic evidence points toward it being **false**: as long as
`LightboxView.tsx` and `MantineListingGalleryPattern.tsx` exist with these exact references (true
since before Task 688), `--overlay`/`--overlay-foreground` may have always stayed alive via
`@theme` regardless of any `bg-overlay*` Tailwind utility surviving elsewhere — meaning F1 may
never have manifested as an actual production defect.

## 7. `globals.css` diff, reconfirmed clean after the full I5 cycle

After I5.4's restore, `git diff -- src/app/globals.css` contains **exactly** the two hunks quoted
in §5 (the `@theme` addition and the `:root` comment rewrite) — no plant or I5.3-experiment residue
survived. Quoted verbatim in §5.

## 8. Restore verification (I5.4)

| Check | Result |
|---|---|
| `scripts/task608-qa-listingcard-list-site.mjs` restored from `git show HEAD:` | `git diff --stat` empty |
| 7 planted consumer files restored via `plant-overlay-utilities.mjs --mode=restore` | all 7 confirmed `RESTORED` |
| `git status --porcelain` | exactly the 2 expected `src/` files (§3) |
| md5 `PopularLocationsView.module.css` | `b721ecf9284f23a026d097b4012bdea4` — unchanged |
| `git diff --stat` on all 8 transiently-touched files (7 consumers + the script) | **empty** — byte-identical to `HEAD` |
| `npm run typecheck` | exit 0 |
| **Final re-verification** (beyond the kickoff's minimum): clean `rm -rf .next && npm run build` + selector-set diff vs the pre-690 baseline | **exit 0, 40/40 pages; diff empty** — confirms the restored I2 state still satisfies AC1 independently of the I5 excursion |

## 9. Computed-style capture (I4, unaffected by the I5 finding)

`computed-before.json` (Task 690's, read-only input) vs `computed-after.json`
(`.screenshots/task693-delta/computed-after.json`), diffed via
`.screenshots/task693-delta/diff-computed-styles.mjs`:

```json
{ "comparedAt": "2026-07-30T07:08:33.916Z", "diffCount": 0, "diffs": [] }
```

Scrim `backgroundImage`: `linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%,
rgba(0, 0, 0, 0) 100%)` — byte-identical to §3.7's target in both captures.

## 10. Commands actually run, with actual exit status

| Command | When | Result |
|---|---|---|
| `git status --porcelain` / `git log -1 --oneline` / ancestor check | I0 | as quoted §3 |
| md5 of the 2 dirty `src/` files | I0 | matched §3.2 exactly |
| `npm run check:design-tokens` | I1 baseline | 43/0 stale |
| `npm run check:stories` | I1 baseline | 0 violations, 127 files |
| `npm run check:story-coverage` | I1 baseline | 15/15 |
| `npm run check:i18n` | I1 baseline | 2215×4, 0 leaks |
| source edit (`globals.css` dual declaration) | I2 | — |
| `rm -rf .next && npm run build` (#1) | I3 | exit 0, 40/40 |
| selector-set diff vs pre-690 baseline | I3 | **empty** |
| `npm run build-storybook` | I4 | exit 0 |
| `capture-computed-styles.mjs --mode=after` | I4 | exit 0, `computed-after.json` written |
| `diff-computed-styles.mjs` | I4 | 0 diffs |
| `plant-overlay-utilities.mjs --mode=plant` | I5.1 | 33 tokens removed, 7 files |
| `rm -rf .next && npm run build` (#2) | I5.2 | exit 0; both vars present |
| globals.css temporarily reverted to pre-690 arrangement | I5.3 | — |
| `rm -rf .next && npm run build` (#3) | I5.3 | exit 0; **both vars present — the stop condition** |
| `scripts/task608-…mjs` leak neutralized (diagnostic) | §6 | — |
| `rm -rf .next && npm run build` (#4, diagnostic) | §6 | exit 0; both vars **still** present |
| script restored from `git show HEAD:` | §6/§8 | `git diff` empty |
| `plant-overlay-utilities.mjs --mode=restore` | I5.4 | all 7 files RESTORED |
| globals.css reverted to I2 dual-declaration state | I5.4 | — |
| `git status --porcelain` | I5.4 | exactly 2 expected files |
| `npm run typecheck` | I5.4 | exit 0 |
| `npm run check:design-tokens` (post-restore sanity) | §post-I5 | 43/0 stale, unchanged |
| `grep -rn 'color-black' src/` | §post-I5 | 0 hits |
| `rm -rf .next && npm run build` (#5, final re-verification) | §8 | exit 0, 40/40; selector diff still empty |

**Not run** (blocked before reaching them, per A3's stop instruction): I6's `--mantine-only`
1184-cell proof, I7's `check:stories`/`check:story-coverage`/`check:i18n`/`vitest` **re-run** (only
the I1 baseline pre-edit values are evidenced), I8's **final** `build` as the last-step completion
gate (five builds above prove the edit compiles and is stable, but are diagnostic/proof builds,
not offered as the I8 completion gate, which the kickoff places after every other gate passes),
I9's `check:file-integrity`/`check:mojibake` (deferred to this log's own creation, see below).

## 11. `check:design-tokens` — before/after (independently of the blocker)

**Before** (I1 baseline): 43/0 stale, module at 0. **After** (post I2, and re-confirmed post-I5.4
restore): 43/0 stale, module at 0, unchanged. R9/AC7 independently satisfied.

## 12. Deviations

1. **Stopped at I5.3, before I6.** Per A3's explicit instruction ("stop and report, not a paperwork
   issue"), the mandated order of operations halted once I5.3 showed presence instead of absence.
   R8 (I6's rendered proof) and R10's post-edit gate re-run were not attempted against a
   known-failing predecessor.
2. **Ran one diagnostic step beyond the kickoff's I5 minimum** (neutralizing
   `scripts/task608-qa-listingcard-list-site.mjs`'s leaked reference) to determine whether the
   failure was a simple stray-string artifact or a deeper mechanism. This is additive verification
   in the same spirit as Task 690's extra clean rebuild — it directly serves A3's "the whole
   approach is wrong" determination with a properly isolated result, not a vague one.
3. **Did not edit `LightboxView.tsx` or `MantineListingGalleryPattern.tsx`'s `var(--color-overlay*)`
   references**, even diagnostically, since A4 marks them read-only and neither the objective (R5)
   nor the plant (I5.1) asks for it. This means the diagnostic in §6 stops at "the cause is
   isolated to these two files' non-utility references" without further ability to prove it inside
   this task's authority.
4. **Restored every transient edit** (the plant across 7 files, the `globals.css` I5.3 experiment,
   and the diagnostic script edit) and independently re-verified the restore via `git diff --stat`
   (empty on all 8 touched-then-reverted files) and a fresh clean build reproducing I3's empty
   selector-set diff, before writing this report.
5. **Did not revert the I2 source edit itself.** Unlike the transient I5 plant/experiment, the
   `globals.css` dual-declaration change (I2) is left in place: its own two gates (I3's restore-
   proof, I4's computed-style proof) both pass cleanly, and reverting it would not resolve I5's
   finding, which concerns whether F1's *premise* was ever provable — not whether D19's fix causes
   harm. Sonnet has no git-write authority regardless.

## 13. Limitations

- The severity/interpretation in §1/§6 (F1 may never have manifested in production) is derived
  from a source-text/build-output analysis, not from a historical rendered-pixel regression test
  of the pre-688 or pre-690 codebase — no such capture exists to check against.
- **7-width proof path**, the **four non-enrolled overlay consumers**
  (`ListingGallery.tsx`/`ImageUpload.tsx`/`AdminUserAvatar.tsx`/`PerfDevOverlay.tsx`), and Tasks
  689/691/692's deferred scope are all still applicable exactly as the kickoff states — none of
  that changes based on this finding.
- **The Chromium QA harness cannot see the fallback tier at all** (kickoff §13.1) — this remains
  true regardless of the I5 finding and was never in question here.
- `.screenshots/` evidence, including this task's `overlay-selectors-after.txt`,
  `overlay-selectors-after-final.txt`, `computed-after.json`, `computed-diff.json`, the plant/
  restore scripts, and the diagnostic files, is local-only per D6/`.gitignore:55`.
- **This finding raises a design question outside Sonnet's authority:** should Task 692's planned
  gate (sync the two declarations) be redesigned, narrowed, or reconsidered in light of the
  possibility that the `:root` copy's necessity was never actually demonstrated? Should the D19
  fix ship anyway (harmless, restores the fallback tier, and removes a *dependency* on two
  specific files' wording even if that dependency was never exercised historically) with AC2
  re-scoped or waived? Or does the owner want a different, more surgical planted control — e.g.
  one that IS allowed to temporarily neutralize the two non-Tailwind `var()` references, which A4
  currently forbids even as a temporary/reverted test edit? None of these are Sonnet's to decide.

## Opus handoff

- **Primary question:** how should AC2/R5's objective-proof requirement be resolved given the
  control cannot demonstrate absence without touching files A4 protects? Options sketched in §13's
  last bullet.
- **Evidence to inspect directly:** §6's two build+grep results (I5.2 present as expected; I5.3
  present when it should be absent) and the diagnostic isolation (leaked script neutralized, result
  unchanged) that narrows the cause to the two protected files' `var()` references.
- **Verify independently:** re-run `.screenshots/task693-delta/plant-overlay-utilities.mjs
  --mode=plant`, temporarily apply the same `globals.css` pre-690 reversion described in §6, clean
  rebuild, grep — should reproduce presence, not absence. Then run `--mode=restore` and confirm
  `git status --porcelain` returns to just the 2 expected `src/` files.
- **What is NOT in question:** R1–R4, R6, R7, R9 all passed cleanly and independently of this
  finding — the dual-declaration mechanism itself works exactly as D19 intended for the
  regression Task 690 introduced. The open question is narrower and specific to AC2's proof
  design.
