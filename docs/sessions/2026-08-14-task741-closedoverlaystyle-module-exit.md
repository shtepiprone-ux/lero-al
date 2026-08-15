# Session — Task 741: Retire `CLOSED_OVERLAY_STYLE`'s Tailwind strings into `ListingCard.module.css`

**Task path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_741_ClosedOverlayStyleModuleExit.md`
(companion: `tasks/Sprints/Sprint_46_task741-preflight-ledger-and-contract.md`)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Executor: Sonnet, `.claude/skills/execute-task/SKILL.md`. This report is factual evidence only — not a review,
not a verdict, not self-approval. A separate Opus orchestrator session decides whether to run `review-task`.

---

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | AC | Evidence | Status |
|---|---|---|---|---|
| R1 | `CLOSED_OVERLAY_STYLE` maps to module classes, zero Tailwind strings in it | AC1 | `ListingCard.tsx:58-63` — `sold: styles.closedOverlaySold, rented: styles.closedOverlayRented` | VERIFIED |
| R2 | Rendered sold/rented overlay identical before/after, incl. `@supports`-off fallback | AC2 | Two-phase comparator, one story for both phases (64 property comparisons + 32 `className` observations, 96 recorded rows), `diffCount: 0`, real source plants (not in-memory), `--supports-off` mode with a strip-happened assertion plus its own real plant — see §12 (Revision 1) | VERIFIED (Revision 1, closes F1/F5/F6/F7) |
| R3 | Zero of the 4 utility strings remain anywhere in `src/**`, comments included | AC3 | Source census `9→0`; see §4 | VERIFIED |
| R4 | New rules inside `@layer utilities`, `var(--status-*)`, no hex, two-tier | AC4 | `ListingCard.module.css:35,101-120`; compiled census `6→0` for the 4 migrated selectors | VERIFIED |
| R5 | `MantineListingCardOverlay.className?: string` unchanged; arbitrary class still reaches element | AC5 | Type unchanged (`MantineListingCardPattern.tsx:36-41`); comparator captures `className` per cell; smoke test + story `play()` assert it directly | VERIFIED |
| R6 | Smoke test + story assert pass-through via non-Tailwind hook class, each shown failing | AC6 | New smoke test + story `play()`, both shown FAIL on a planted violation, then reverted; see §6 | VERIFIED |
| R7 | `ListingCard.stories.tsx` renders sold+rented through the real `ListingCard`; UI decision record | AC7 | `ListingCard.stories.tsx:110-111,121-122`; decision record §8; `check:stories` 0 violations | VERIFIED |
| R8 | `ListingCard.smoke.test.tsx` passes, unmodified | AC8 | 13/13 passed; absent from `git status --porcelain` | VERIFIED |
| R9 | Standing gates green; evidence retained | AC9 | See §7 — all gates green, evidence at `docs/reviews/artifacts/2026-08-14-task741/` | VERIFIED |

---

## 2. Current versus required behavior

**Current (before).** A closed listing's overlay label got its background/border from two Tailwind utility
strings (`bg-status-info/80 border-status-info` / `bg-status-rented/80 border-status-rented`) passed as
`overlay.className` from `ListingCard.tsx` through `MantineListingCardPattern`'s `cn()`.

**Required after (delivered).** Byte-identical rendering, sourced from `@layer utilities` rules in
`ListingCard.module.css`. The four utility strings exist nowhere in `src/**`. The pattern's
`overlay.className` contract is unchanged and re-proven with a neutral, non-Tailwind hook class
(`consumer-overlay-hook`).

**Negative flows:**

| Branch | Applicable? | Evidence |
|---|---|---|
| `@supports`-off (no `color-mix`) fallback | Yes | Module CSS's base tier (outside any `@supports` block) sets the bare `var(--status-*)` value, identical to the pre-migration D35-degraded compiled fallback (§5). Rendered proof (Revision 1, §12): the comparator's `--supports-off` mode strips the color-mix `@supports` tier from every served stylesheet in both phases and measures the base tier directly — clean run `failCount: 0`, plant B (base tier swapped info->rented) caught at exactly 16 `MOVED` cells |
| `layout='list'` renders no overlay | Yes | Unchanged — `MantineListingCardPattern.tsx:152`'s list branch untouched; existing smoke test assertion (unmodified logic, hook-class literal only) still passes |
| Critical-flow regression | Yes | `ListingCard.smoke.test.tsx` — 13/13 pass, file unmodified |

---

## 3. Files Changed

| Path | Reason |
|---|---|
| `src/modules/listings/components/ListingCard.tsx` | `CLOSED_OVERLAY_STYLE` values repointed from Tailwind strings to `styles.closedOverlaySold`/`styles.closedOverlayRented` |
| `src/modules/listings/components/ListingCard.module.css` | Added the two-tier `@layer utilities` rules reproducing the retired utilities' compiled output |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | JSDoc on `MantineListingCardOverlay.className` rewritten to prose (no scanner-visible utility string) |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | List-mode negative test's literal replaced with the hook class; new positive test added asserting the pass-through in `layout="grid"` |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | Sold-card `overlay.className` literal replaced with `consumer-overlay-hook`; `play()` added asserting the hook class reaches the rendered element |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | Extended with sold + rented `ListingCard` instances in the existing grid section (production rendered proof) |
| `docs/backlog.md` | Concise state update for Task 741 (line count unchanged: 80) |
| `docs/reviews/artifacts/2026-08-14-task741/` | Comparator script, results, and gate transcripts (new) |

---

## 4. Source and compiled census (R1/R3/R4, §13 of the kickoff)

Regex reused verbatim from the kickoff (trailing `(?![\w\/-])` load-bearing, excludes the 8 out-of-scope
`/20`/`/30` consumers).

| Point | Source census (4 strings) | Compiled census (4 selectors, `.next/static/css`) |
|---|---|---|
| I0 | **9** across 4 files (`ListingCard.tsx` 4 · `MantineListingCardPattern.tsx` 2 · `ListingCardPattern.stories.tsx` 2 · `MantineListingCardPattern.smoke.test.tsx` 1) | **6** (two `/80` two-tier pairs + two grouped bare-border rules) |
| Post step 4 | **0** | **0** (see defect note below — required a second clean rebuild) |
| Final | **0** | **0** |

Both I0 numbers match the kickoff's stated expectation exactly, confirming the census commands (rebuilt as
`.cjs` files due to shell-escaping of the compiled selector's literal backslash — the kickoff's own §13
commands hit the identical documented escaping failure when run verbatim) are measuring correctly.

---

## 5. Module CSS — reproduced compiled rules (R4/AC4)

Quoted verbatim from `.next/static/css/9da9f59077fdb31e.css` (I0 build):

```
.bg-status-info\/80{background-color:var(--status-info)}
@supports (color:color-mix(in lab,red,red)){.bg-status-info\/80{background-color:color-mix(in oklab,var(--status-info) 80%,transparent)}}
.border-status-info,.border-status-info\/20{border-color:var(--status-info)}
```

(`--status-rented` identical in shape.)

`ListingCard.module.css:101-120` reproduces this exactly: base tier `background-color: var(--status-info)` /
`border-color: var(--status-info)` inside `@layer utilities`, and the `color-mix` tier inside a nested
`@supports (color: color-mix(in lab, red, red)) { @layer utilities { ... } }` block — same condition string,
confirmed against the I0 bundle. No hex literal; the `#0000004d` idiom used by `.overlayCenter` in the same
file does **not** apply here (owner decision 2026-08-14, quoted in the kickoff §3.3) because `--status-info`/
`--status-rented` are runtime `var()` aliases (D35), unlike `--overlay`'s literal.

`.overlayLabel` (`MantineListingCardPattern.module.css:348-359`) re-measured at I0: sets `color`,
`font-weight`, `font-size`, `line-height`, padding, radius, `rotate`, `border-style`, `border-width` — **not**
`background-color` or `border-color`. No property contention; the stop condition in kickoff §10.8 does not
fire.

---

## 6. Pass-through contract — planted-violation proof (R6/AC6)

Planted violation: `MantineListingCardPattern.tsx:320` temporarily changed from
`cn(styles.overlayLabel, overlay.className)` to `cn(styles.overlayLabel)` (className dropped).

| Assertion | Result under plant | Evidence |
|---|---|---|
| `MantineListingCardPattern.smoke.test.tsx` new grid pass-through test | **FAIL** — `expect(element).toHaveClass("consumer-overlay-hook")` received `_overlayLabel_c737cc` only | `check-mojibake`-clean transcript retained: `smoke-test-planted-violation.log` is the console capture; vitest run exit 1, 1 failed / 4 passed |
| `ListingCardPattern.stories.tsx` `play()` | **FAIL** — `AssertionError: expected null not to be null` (`.consumer-overlay-hook` count 0) | **Superseded, Revision 1 (F2).** The original round captured this via a direct Playwright probe, not the real gate, and its claim that "any console error" fails the gate was false: `storybook/test` ships a project-level `throwPlayFunctionExceptions: false` annotation, so a failed `expect()` here was silently caught and never reached `check-stories-rendered.mjs`'s collectors — `screenshots:assert` was never run in the original round. Fixed by adding a story-local `parameters: { throwPlayFunctionExceptions: true }` (story annotations win over the project default), which lets the exception reach Storybook's `renderException`. Proven through the real gate, not a probe: `screenshots:assert` on the planted build reports this cell's manifest entry with `failReason: 'sb-show-errordisplay'`, `failDetail: 'expected null not to be null'`, and `consoleErrors: ["Error rendering story '...':"]` — both the DOM-level check and the console collector independently catch it. See §12 for transcripts. |

Plant reverted; `MantineListingCardPattern.tsx:320` confirmed back to
`cn(styles.overlayLabel, overlay.className)`. Re-ran the smoke test clean: **5/5 pass**
(`smoke-test-clean-final.log`).

---

## 7. Validation evidence (R9/AC9)

All transcripts retained at `docs/reviews/artifacts/2026-08-14-task741/`.

| Command | Result |
|---|---|
| `npm run build` (I0, before any edit) | Exit 0, `/[locale]` First Load JS **619 kB** |
| `npm run build` (final, after revert + all edits) | Exit 0, `/[locale]` First Load JS **619 kB** — delta 0 |
| `npm run typecheck` | Exit 0 |
| `npx vitest run` (full suite) | **1352/1352 passed**, 80 files |
| `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` (critical flow, unmodified) | **13/13 passed** |
| `npm run check:design-tokens` | 0 violations |
| `npm run check:css-vars:verify` | 8/8 self-test assertions correct |
| `npm run check:css-vars` (final, fresh build) | 0 violations, 0 in-class dynamic sites. `owned=257`, `Arm A=78`, `Arm B=57` |
| `npm run check:stories` | 127 files, 0 violations |
| `npm run check:mojibake` | 0 artifacts, 2380 files |
| `npm run check:file-integrity` | 9 changed files, all clean |
| `npm run check:review-ledger` | 3 pre-existing ledgers valid (unrelated to this task) |
| Two-phase rendered comparator (real, Revision 1 rebuild) | **96 recorded rows (64 property comparisons + 32 `className` observations), 0 property failures, 0 identity failures, 0 hard errors**, `COMPARATOR: PASS, diffCount: 0` — see §12 |
| Two-phase rendered comparator, real source plant A (color-mix tier 80%->60%) | **16/64 property failures**, all `*|sold|backgroundColor`, `COMPARATOR: FAIL` — reverted, clean re-run confirmed. Supersedes the original round's `--plant` in-memory mutation (removed, F1) |
| Two-phase rendered comparator, `--supports-off` mode (real) | Strips the color-mix `@supports` tier from every served stylesheet in both phases (2272/2256 blocks removed, assertion passes); clean `failCount: 0`; real plant B (base tier info->rented) caught at 16/64 property failures — reverted, clean re-run confirmed (closes F6) |
| Two-phase rendered comparator, fail-closed asset proof (F8) | AFTER witness's `ListingCard-*.css` chunk temporarily removed; comparator exits 1 on `requestfailed`/404 hard errors, not a passing colour comparison; restored, clean re-run confirmed |
| `npm run screenshots:assert` (F2/F3, planted `MantineListingCardPattern.tsx:320` violation) | Exit 1; `patterns-mantine-listingcardpattern--default` cells fail with `failReason: 'sb-show-errordisplay'`, `consoleErrors` matching `Error rendering story` |
| `npm run screenshots:assert` (F2/F3, clean, reverted) | `Patterns/Mantine/ListingCardPattern/Default` and `Mantine/Primitives/ListingCard/Default` — all 32 cells pass. Full-suite exit code stays 1 from ~950 pre-existing, unrelated failures (documented standing condition, `docs/storybook-governance.md:553/810`); `-- --mantine-only` (the actual CI-blocking gate, `.github/workflows/governance-pr.yml:181`) shows 18 pre-existing unrelated failures (AdminUsersTable/HeroSearch/NotificationBellView), zero involving ListingCard |

**Arm B +2 (kickoff §3.6 prediction).** Not directly re-measured against a captured I0 `check:css-vars` run
(that command was not executed before the edit). Reasoned from measured facts instead: an I0 grep confirmed
`var(--status-info)`/`var(--status-rented)` had **zero** references anywhere in `src/**` before this task: I
added exactly these two `var()` references in `ListingCard.module.css`, and no other file in the tree changed
that could add or remove an owned-name reference. The final run's Arm B = 57 is therefore consistent with the
predicted +2, but this is a deduction, not a direct before/after gate measurement — flagged here rather than
asserted as `Confirmed`.

---

## 8. Canonical UI decision record

| Visible artifact | Candidates inspected | Disposition | Consumed shared path | Registration |
|---|---|---|---|---|
| Sold/rented overlay background+border colour | `ListingCard.module.css` (existing D28 module, Task 702) · `MantineListingCardPattern.module.css` (rejected — unlayered, would change cascade standing per D34) | **extend** `ListingCard.module.css` | `.closedOverlaySold` / `.closedOverlayRented`, `@layer utilities` | None needed — extends an existing canonical module |
| `overlay.className` pass-through witness | `ListingCardPattern.stories.tsx` (existing sold card — becomes contract-only after migration) · `MantineListingCardPattern.smoke.test.tsx` (existing list-mode negative test) | **extend** both with a hook-class assertion; **create** one new positive smoke test (grid pass-through, previously untested) | `consumer-overlay-hook` literal, no token | New `describe` block in the smoke test |
| Sold/rented rendered colour proof (production path) | `ListingCard.stories.tsx` (existing `Default` export, only `active` status) · `ListingCardPattern.stories.tsx` (pattern-only, no longer production-faithful after migration) | **permanent extend** of `ListingCard.stories.tsx`'s single `Default` export — in-scope production consumer is `ListingCard.tsx`'s `isClosed` branch (`:267-269`); owner-authorised 2026-08-14 (kickoff §3.8, quoted) | Existing grid `SimpleGrid` section, two new `ListingCard` instances | None — single-export rule preserved, no new story file |

**Permanent-story-creation gate:** satisfied. The `ListingCard.stories.tsx` extension names its in-scope
production consumer and the quoted owner authorization; it is not a probe (the two new cards are a real,
permanent part of the story — "committed" here means permanent, not git-committed — exercised by the retained two-phase comparator's AFTER phase (96 recorded rows) and by
`check:stories`).

**Reversible probe used and restored (not part of the permanent diff):** a temporary `rented` prop was added
to `ListingCardPattern.stories.tsx`'s `DemoCard`, to let the two-phase comparator's BEFORE phase capture the
rented overlay's pre-migration colour (the pattern story had no rented demo). Restoration evidence:

- Pre-probe hash: `git hash-object` = `ed25ae3f5dc0b165190a7532e5581c0f1fb0767d`
- Post-restore hash (before the real Task 741 edits began): same, `ed25ae3f5dc0b165190a7532e5581c0f1fb0767d` — confirmed byte-identical
- Path absent from `git status --porcelain` at that point

---

## 9. Implementation validation notes — defects found and fixed in-round

1. **Storybook build artifact contaminating Tailwind's content scan.** The first BEFORE-phase Storybook
   build was placed at `storybook-static-before/` inside the repo root. `.gitignore`'s `storybook-static`
   pattern matches only that exact name, not `storybook-static-before`, so Tailwind v4's automatic
   content detection (which respects `.gitignore`) scanned its baked-in JS bundles and re-extracted the
   four retired utility strings as live candidates — the compiled census stayed stuck at `6`, not `0`,
   across two independent clean (`rm -rf .next`) rebuilds, even though the source census was already `0`.
   Root-caused by comparing a clean rebuild's result to the source census and finding they disagreed;
   fixed by relocating the BEFORE witness entirely outside the repo root (`LERO_BEFORE_STATIC_DIR` env var
   in the comparator script) — a `.gitignore` entry would not have been sufficient, since Tailwind must
   never scan that directory regardless of git tracking state. Documented in the comparator script's header.
   **Superseded, Revision 1 (F5 witness retention, §2.2 of the revision brief):** the out-of-repo path is no
   longer the default. `docs/` is already excluded from Tailwind's content scan
   (`src/app/globals.css:11`, `@source not "../../docs"`), so the BEFORE witness now lives at
   `docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/` (retained in-repo (untracked, lands with this task's commit), 14 MB / 371 files) —
   safe from the same resurrection hazard without needing a path outside the repo. `LERO_BEFORE_STATIC_DIR`
   remains as an override only. See §12.
2. **Fabricated i18n key in the reversible probe.** The first probe attempt used
   `storyT(l, 'storybook.mantine.card_overlay_rented')` without checking the key existed; only
   `card_overlay_sold` is defined under that namespace, so the probe's rented card threw at render time and
   the BEFORE capture silently returned 0 overlay elements for every cell (masked as a Playwright timeout,
   not a crash). Caught by directly inspecting the rendered page's console output rather than trusting the
   comparator's generic "found 0" error. Fixed by using a hardcoded `'RENTED'` label in the probe instead
   (the probe is temporary and reverted, so no i18n concern applies to it).

Both defects were in the *evidence apparatus*, not in the shipped migration; the final comparator, gates, and
build all reflect the corrected state.

---

## 10. Assumptions, deviations, and limitations

- **A1 (module reproduces compiled output verbatim) — confirmed**, not merely assumed: the two-phase
  comparator (96 recorded rows) measured 0 diffs, and the module CSS's declarations are quoted directly
  against the I0 bundle.
- **A2 (`twMerge` deletes nothing in either phase) — confirmed**: the comparator captures the resolved
  `className` string in both phases (`comparator-result.SUPERSEDED-generic-name-see-FINAL.json`, `*.className` INFO cells; the current equivalent is `comparator-result-FINAL.json`); BEFORE carries the
  raw Tailwind substrings, AFTER carries the hashed module class, `twMerge` performed no unexpected deletion
  in either.
- **A3 (`.overlayLabel` sets neither `background-color` nor `border-color`)** — re-measured at I0, unchanged
  from the kickoff's author-verified trace.
- **OQ1 (JSDoc form)** — resolved as prose, no scanner-visible utility-shaped string (695 precedent).
- **OQ2 (one class per status vs. shared base)** — resolved as one class per status
  (`.closedOverlaySold`/`.closedOverlayRented`), matching the kickoff's own illustrative snippet.
- **OQ3 (whether `overlay.className` becomes a `tone` prop)** — untouched, owner-only, correctly out of scope.
- **Arm B +2** — see §7, a reasoned deduction rather than a directly captured before/after gate delta.
- **HEAD moved during preflight**: kickoff's stated HEAD was `6ecfcf213`; actual start HEAD was `fc04a01c5`
  (one intervening commit, `docs(task-741): file the kickoff`, doc-only — no source delta). Reported per the
  kickoff's own "if the tree disagrees, the tree wins" instruction; all §3 facts were re-derived against the
  real tree regardless.

---

## 11. Opus handoff

Evidence root: `docs/reviews/artifacts/2026-08-14-task741/` (comparator script, real + planted JSON results,
and every gate/build/test transcript cited above). See §12 for the Revision 1 evidence-apparatus rebuild.

Report status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Not self-approved. Sprint 46 is not closed
by this report — that remains the owner's call.

---

## 12. Revision 1 (2026-08-15) — evidence-apparatus rebuild

**Scope: the evidence apparatus only**, per
`tasks/Sprints/Sprint_46_task741-revision-1-evidence-apparatus.md`. The migration itself (§1-§10 above) was
independently re-derived by the reviewer and left untouched; `.storybook/preview.tsx` was not touched. Finding
ids below are `docs/reviews/2026-08-14-task741-closedoverlaystyle-module-exit.review-ledger.json`'s.

### F2 — `play()` made genuinely gate-observable

`src/stories/patterns/mantine/ListingCardPattern.stories.tsx`'s `Default` export now sets
`parameters: { throwPlayFunctionExceptions: true }` (story-local; `.storybook/preview.tsx` untouched — story
annotations win over `storybook/test`'s project-level `false` per `prepareStory`'s `combineParameters`
precedence). The `play()` comment was rewritten to state the real mechanism, not the false "any console
error" claim.

Proof through the real gate (not a probe): source plant at `MantineListingCardPattern.tsx:320`,
`cn(styles.overlayLabel, overlay.className)` -> `cn(styles.overlayLabel)`.

| Run | Result | Evidence |
|---|---|---|
| `build-storybook` + `screenshots:assert`, planted | Exit 1; `patterns-mantine-listingcardpattern--default` cells: `failReason: 'sb-show-errordisplay'`, `failDetail: 'expected null not to be null'`, `consoleErrors: ["Error rendering story '...':"]` | `screenshots-assert-F2-PLANTED.log`, `screenshots-assert-F2-PLANTED-cells.json` |
| Plant reverted (`git diff` empty on that hunk); `build-storybook` + `screenshots:assert`, clean | Exit 0 for both stories in scope (32/32 cells pass). Full-run exit code is 1 from ~950 pre-existing, unrelated failures (`docs/storybook-governance.md:553/810` documents this as a standing condition of the non-scoped full run, not a regression) | `screenshots-assert-F2-CLEAN-full.log`, `screenshots-assert-F2-CLEAN-cells.json` |
| `screenshots:assert -- --mantine-only` (the actual CI-blocking gate, `.github/workflows/governance-pr.yml:181`), clean | Exit 1 from 18 pre-existing unrelated failures (AdminUsersTable, HeroSearch, NotificationBellView) — zero involve ListingCard/ListingCardPattern | `screenshots-assert-F2-CLEAN-mantineonly.log` |

### F1 + F5 + F6 + F7 — comparator rebuilt

`docs/reviews/artifacts/2026-08-14-task741/two-phase-comparator.mjs` rewritten:

- **Closes F7** — both phases now capture the same story, `mantine-primitives-listingcard--default`. BEFORE
  is built in a throwaway `git worktree add ../lero-al-741-before HEAD` (pre-migration base revision) with
  only the permanent `ListingCard.stories.tsx` sold/rented extension copied on top; `ListingCard.tsx`/
  `ListingCard.module.css` stay at HEAD there. Live-tree non-interference proven by `git hash-object`
  before/after (`c72fcd9a0…`/`f645043 1a…` unchanged) and the worktree's own diff (only the copied story file
  modified, matching hash `b65552e2…` = the live tree's).
- **Closes F5 (witness retention)** — BEFORE output (14 MB / 371 files) retained in-repo (untracked, lands with this task's commit) at
  `docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/`, safe from Tailwind's content scan
  (`docs/` excluded, `src/app/globals.css:11`). `requireBuild` now fail-closes if the directory, `iframe.html`,
  or its referenced CSS bundle is missing/empty, naming the exact path and rebuild recipe.
- **Closes F1 (real plant, color-mix tier)** — the in-memory `--plant` mutation is deleted entirely. Real
  plant: `.closedOverlaySold`'s color-mix tier `80%` -> `60%`, rebuilt, re-run.

  | Run | `failCount` | Evidence |
  |---|---|---|
  | Clean baseline | 0/64 | `comparator-result-CLEAN-baseline.json` |
  | Plant A (60%) | **16/64, all `*|sold|backgroundColor`** (4 viewports x 4 locales); `rented` and both `borderColor` sets untouched | `comparator-result-PLANT-A.json`, `comparator-PLANT-A.log` |
  | Reverted, rebuilt, re-run | 0/64 | `comparator-result-POST-PLANT-A-clean.json` |

- **Closes F6 (`@supports`-off mode + real plant B)** — `--supports-off` intercepts every served CSS response
  in both phases via `page.route()` and strips every `@supports (color: color-mix(in lab, red, red)) { ... }`
  block with balanced-brace removal, then fails closed if either phase's strip count is 0.

  | Run | Result | Evidence |
  |---|---|---|
  | Clean, `--supports-off` | `stripCounts: {before: 2272, after: 2256}` (both >0, assertion passes); base-tier colours, fully opaque, identical BEFORE/AFTER, `failCount: 0` | `comparator-supports-off-CLEAN-final.log`, `comparator-result-supports-off-CLEAN-final.json` |
  | Real plant B: base tier `.closedOverlaySold` `background-color` `var(--status-info)` -> `var(--status-rented)`, `--supports-off` | **16/64, all `*|sold|backgroundColor`** | `comparator-result-supports-off-PLANT-B.json`, `comparator-supports-off-PLANT-B.log` |
  | Reverted, rebuilt, re-run | `failCount: 0` | `comparator-result-POST-PLANT-B-clean.json` |

  R2's `@supports`-off arm is now rendered proof, not source comparison only.

### F8 — comparator server fails closed on a missing asset

The static server now serves a real 404 for any unresolved path that looks like an asset (has an extension in
its last path segment); the `index.html` SPA fallback applies only to extension-less navigation paths.
`page.on('requestfailed')` and `page.on('response')` collect any failed request or non-2xx response from
either origin as a hard error that forces exit 1 regardless of the colour comparison.

Proof: `storybook-static/assets/ListingCard-Co937xeB.css` (a dynamically-loaded per-component chunk, not the
top-level `iframe.html` stylesheet `requireBuild` checks — deliberately chosen so this proves the server's
runtime behavior, not the build precondition) temporarily removed. Comparator exits 1 with
`COMPARATOR: FAIL (hard errors — asset/network fault, not a colour comparison)` and 404/`requestfailed`/
bad-status entries naming the missing file — never a passing colour comparison. Restored; clean re-run
confirmed 0 failures, 0 hard errors. Evidence: `comparator-F8-missing-asset.log`,
`comparator-F8-restored-clean.log`, `comparator-result-F8-restored-clean.json`.

### F3 / F4 — bookkeeping

- **F3** satisfied by the F2 clean `screenshots:assert` run above; `Mantine/Primitives/ListingCard/Default`'s
  extended grid geometry (tripled card count) is exercised and passes at all 4 `MANTINE_VIEWPORTS`.
- **F4** — the comparator is **64 property comparisons + 32 `className` observations (96 recorded rows)**,
  corrected in this session log (§1 R2 row, §2, §7, §8, §10), the comparator script's own header, and
  `docs/backlog.md`'s Task 741 row (all three previously disagreed — "96-cell", "96/96 cells", and "128
  comparison points across 32 rendered cells per phase" respectively).

### Deviations from the revision brief

- **Route A worktree, `node_modules` reused via a Windows directory junction** rather than a fresh `npm ci`:
  `git diff --stat HEAD -- package.json package-lock.json` was empty (no dependency delta between the base
  revision and the live tree), so the junction points to an identical dependency tree at a fraction of the
  cost. The junction was removed before `git worktree remove`.
- **`screenshots:assert` exit code is scoped, not literal.** The revision brief's §1.3/§5 "exit 0" is read as
  "this story's cells pass", not "the whole-repo command's process exit code is 0" — the latter is
  structurally impossible on this tree today: a full run carries ~950 pre-existing failures across
  unrelated stories, documented as a standing condition (`docs/storybook-governance.md:553/810`), and the
  project's actual CI-blocking gate for this scope is `screenshots:assert -- --mantine-only`
  (`.github/workflows/governance-pr.yml:181`). Both the full run and the `--mantine-only` run are retained as
  evidence; neither shows a ListingCard/ListingCardPattern failure at any point in this revision.

### Files changed in this revision

| Path | Reason |
|---|---|
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | F2 — story-local `throwPlayFunctionExceptions: true`; `play()` comment rewritten to the real, gate-verified mechanism |
| `src/modules/listings/components/ListingCard.module.css` | Touched only transiently for plants A/B, reverted byte-identical each time (`git diff --stat` unchanged at 35 insertions throughout) |
| `docs/reviews/artifacts/2026-08-14-task741/two-phase-comparator.mjs` | Rebuilt: single story both phases, in-repo witness + fail-closed precondition, real plants only (no `--plant`), `--supports-off` mode, fail-closed server + hard-error collectors |
| `docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/` | New — BEFORE witness, retained in-repo (untracked, lands with this task's commit) (14 MB / 371 files) |
| `docs/reviews/artifacts/2026-08-14-task741/*.log`, `*.json` | New — every run's transcript and result cited above |
| `docs/sessions/2026-08-14-task741-closedoverlaystyle-module-exit.md` | This section, plus the §1/§2/§6/§7/§9/§10 corrections above |
| `docs/backlog.md` | Task 741 row updated — see final handoff |

Backlog update: `docs/backlog.md` edited in place (Sprint 46 summary line + Task 741 registry row), line
count unchanged at **80** (baseline `git show HEAD:docs/backlog.md | wc -l` = 80, no `BACKLOG LIMIT BREACH`).

---

## 13. Review 2 (Opus, 2026-08-15) — closure record

**Decision: `APPROVED WITH NOTES`.** Ledger `docs/reviews/2026-08-15-task741-revision1-evidence-apparatus.review-ledger.json`
— schema v4, `review.coverage` **12 total, 12 `VERIFIED`, 0 `UNVERIFIED`, 0 open P0/P1/P2**,
`handoff.commitPush: ALLOWED`. It supersedes `docs/reviews/2026-08-14-task741-closedoverlaystyle-module-exit.review-ledger.SUPERSEDED.json`
(review 1, `NEEDS REVISION`), which is named in its `review.supersedes` and retained unchanged apart
from two evidence paths repointed at artifacts renamed below.

**Finding-id canon.** Ids follow the ledger, not the revision brief's §2 subsection headings, which
were inverted for F5/F6 by the orchestrator when the brief was written. Corrected in place, in the
brief and in §12 above: **F5 = BEFORE witness retention (§2.2)**, **F6 = `@supports`-off rendered
arm (§2.4)**. F1 plant · F2 `play()` · F3 story geometry · F4 cell-count language · F7 one story per
phase · F8 fail-closed server (a required exit criterion, deliberately not a ledger row).

**Fail-set identity, at set level.** Review 1 reported the `--mantine-only` baseline by count and by
three story names. Review 2 supplies the D37 form: two independently captured runs in this task
(`screenshots-assert-F2-CLEAN-mantineonly.log`, `REVISION1-screenshots-assert-mantineonly-FINAL.log`)
both report `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` and a mechanical diff of their enumerated fail
cells gives **0 added / 0 removed**. All 18 are AdminUsersTable, HeroSearch or NotificationBellView;
zero involve ListingCard or ListingCardPattern. Enumerated set and method:
`docs/reviews/artifacts/2026-08-14-task741-review/screenshots-assert-mantineonly-failset-diff.txt`.
`-- --mantine-only` is verified as the CI-blocking invocation at `.github/workflows/governance-pr.yml:181`.

**Superseded artifacts renamed** so no discredited result can be mistaken for current evidence:

| Was | Now | Why |
|---|---|---|
| `comparator-result-PLANTED.json` | `comparator-result-PLANTED.SUPERSEDED-r1-synthetic-plant.json` | Review 1's in-memory plant; discredited by F1 |
| `comparator-plant-run.log` | `comparator-plant-run.SUPERSEDED-r1-synthetic-plant.log` | same run's console capture |
| `comparator-real-run.log` | `comparator-real-run.SUPERSEDED-r1-inmemory-plant-era.log` | clean run from the in-memory-plant era |
| `comparator-result.json` | `comparator-result.SUPERSEDED-generic-name-see-FINAL.json` | generic name overwritten by whichever run ran last |

**The only citable current comparator results** are `comparator-result-FINAL.json` (normal mode) and
`comparator-result-supports-off-CLEAN-final.json` (`--supports-off`).

**Three P3 notes, none blocking**, carried as `N1`–`N3` in the review-2 ledger: the mojibake-allowlist
exemption for the in-repo witness (verified warranted and tightly scoped — 7 hits, all intentional
U+FFFD literals in bundled vendor JS, 0 invalid-UTF-8 files — but still a standing-gate exemption
created to accommodate evidence); the comparator's generic output filename; and the unexplained
16-block `--supports-off` strip-count delta between phases.

