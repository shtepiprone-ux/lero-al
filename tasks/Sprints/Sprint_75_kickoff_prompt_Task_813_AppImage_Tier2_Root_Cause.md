# Task 813 — `AppImage` leaves `src/components/ui/`: clear the tier-2 root cause that blocks Task 820

Sprint 75 · **P0** (raised from tier-3 filing by owner decision §17.6, 2026-09-11) · QA profile **Q4**

**Status: `READY FOR SONNET` — §5.1 was answered 2026-09-11, select **(C)** and **(B1)**, recorded verbatim in §5.1
below and in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md` per `agent-contract`
16d. Destination: `src/design-system/media/`. A blocking media-directory parity check lands in this same task (R12).
Scope is `AppImage` and its R1-proven co-located siblings only; `ListingFeatureIcon` and `FavoriteButton` moved to
Task 821. Task 820's R11 resumes as soon as this task is `APPROVED`.**

## 1. Mode and task type

`IMPLEMENTATION` — design-system / governance migration. Remove the `src/components/ui/` path classification from the
project's image primitive so that no enrolled surface reaches a `tier2-legacy-primitive` node through it. No
user-visible change is intended, and any is a defect.

## 2. Objective

Owner decision §17.6 on Task 820 (2026-09-11, quoted verbatim in
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md` §17.7):

> **Decision §17.6 — select (A2), 2026-09-11.** Task 813's AppImage migration is a blocking dependency of Task 820.
> Migrate `LightboxView.tsx` off `src/components/ui/AppImage.tsx` through Task 813; do not enrol `LightboxView`
> merely to hide the tier-2 hop, defer either pattern, add an exclusion, or baseline the tier-2 finding. After Task
> 813 is approved, re-run Task 820 §17.2 option (A) from the same base
> `02d975f945159df38c23a0caab43e1c7a96faa58` to the then-current fixed HEAD, with diff/surface limits re-measured
> and recorded. The reconciliation must remove the 20 now-false entries, list every baseline delta, and pass the
> gate plus its self-test. Any new tier-2 refusal remains a stop for a new owner decision.

And owner decision 1 (2026-09-11, `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`,
quoted verbatim there):

> This does not authorize allowlisting any non-pattern tier-1 target or any tier-2 `src/components/ui/*` path.
> AppImage and PasswordRequirementsHint remain tier 2.

Together those close every route except changing what `AppImage` *is* to the gates. There is no allowlist route, no
baseline route, and no "enrol the intermediate node" route.

## 3. Verified context — measured 2026-09-11 by the Task 820 review, re-measure at execution

### 3.1 The tier-2 classification is a path prefix, and nothing else

`FACT`, read this session — both gates classify tier 2 by one literal string constant:

```
scripts/check-rendered-scope.mjs:211   const TIER2_PREFIX = 'src/components/ui/';
scripts/check-surface-census.mjs:56    const TIER2_PREFIX = 'src/components/ui/';
```

`check-rendered-scope.mjs:18-19` states the intent: "`tier2-legacy-primitive` — resolves under `src/components/ui/*`;
the fix is 'stop importing it', not 'enrol the file' (16d tier 2)." Nothing inspects the file's contents, its
imports, its authorship or whether it is shadcn. **A file is tier 2 because of where it sits.**

`INFERENCE` from that, and it is the whole design of this task: moving `AppImage.tsx` out of `src/components/ui/`
removes the classification at its source for **every** consumer at once, without changing a line of its rendering
behaviour. Nothing else available to this task has that property.

### 3.2 `AppImage` is not a legacy shadcn primitive — it is the project's canonical `<img>` render site

`FACT`, `src/components/ui/AppImage.tsx` read in full this session. It imports only `react`, `react-dom`'s `preload`,
`@/lib/utils`'s `cn`, its own `./AppImage.module.css`, `./appImageConfig`, `./useAdaptiveImageConfig`,
`@/lib/imageDelivery`, `@/lib/performance/predictive` and `@/lib/performance/imageGuard`. **Zero shadcn imports, zero
Radix, zero Mantine.** Its own header comment, lines 3-6:

> `next/image` is NOT used here. All images are delivered via Cloudinary CDN with native `<img>` + manual srcset.
> Do not re-introduce next/image anywhere.

and at the render site, lines 132-133:

> AppImage is the canonical `<img>` render site; next/image is project-wide banned
> (`eslint.config.mjs` `IMAGE_RENDER_EXCEPTIONS`). This disable is intentional and approved.

It owns Cloudinary `srcset`/`sizes`, LQIP blur-up with a `loaded` fade, React 19 render-phase `preload`, LCP
`fetchPriority`, `imageGuard` priority-preload accounting with a documented hook-ordering guarantee (lines 97-115),
budget-capped predictive preloading, and a `layoutContext` contract tied to `MantineListingCardTrack`'s real grid
geometry (Task 807/809). `FACT` — Mantine ships no equivalent; `@mantine/core`'s `Image` has none of this.

`INFERENCE` — "migrate it to Mantine" in the sense the other Sprint 74/75 migrations used is not available here
without deleting documented, performance-critical behaviour and breaking the project's own `next/image` ban. That is
why §5.1 is an owner decision and not an executor's judgement.

### 3.3 What the tier-2 edge actually is, and how large it is

`FACT` — `scripts/rendered-scope-baseline.json` (version 1, 30 edges) holds exactly **two** `AppImage` frontier
edges, both recorded debt:

```
src/modules/listings/components/ListingCard.tsx            -> src/components/ui/AppImage.tsx
src/modules/locations/components/PopularLocationsView.tsx  -> src/components/ui/AppImage.tsx
```

`FACT` — `scripts/surface-census-baseline.json` (version 1, 690 blocks) holds **25** blocks of the form
`<surface> :: src/components/ui/AppImage.tsx :: tier2-legacy-primitive`, across 25 distinct surfaces — 12 of them
route surfaces:

```
src/app/[locale]/page.tsx                         src/modules/listings/components/FavoritesShell.tsx
src/app/[locale]/listings/page.tsx                src/modules/listings/components/FeaturedListingsView.tsx
src/app/[locale]/listings/[slug]/page.tsx         src/modules/listings/components/LatestListingsView.tsx
src/app/[locale]/favorites/page.tsx               src/modules/listings/components/ListingCard.tsx
src/app/[locale]/cabinet/page.tsx                 src/modules/listings/components/ListingDetailView.tsx
src/app/[locale]/ci/click-shield-modal/page.tsx   src/modules/listings/components/ListingFormShell.tsx
src/app/admin/companies/page.tsx                  src/modules/listings/components/ListingGallery.tsx
src/app/admin/listings/[id]/preview/page.tsx      src/modules/listings/components/ListingsShellView.tsx
src/app/admin/locations/page.tsx                  src/modules/listings/components/RecentlyViewedGridView.tsx
src/app/admin/popular-locations/page.tsx          src/modules/listings/components/SimilarListingsView.tsx
src/app/admin/users/[id]/page.tsx                 src/modules/listings/components/steps/StepPhotos.tsx
src/app/admin/users/new/page.tsx                  src/modules/listings/components/steps/StepPreview.tsx
                                                  src/modules/locations/components/PopularLocationsView.tsx
```

`FACT` — Task 820's Revision 3 added two more, refused by `--update-baseline`
(`docs/sessions/evidence/task820/Rev3_05_tier2-refusal-and-restore.txt`):

```
src/design-system/mantine/patterns/MantineListingDetailPattern.tsx  :: src/components/ui/AppImage.tsx
src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx :: src/components/ui/AppImage.tsx
```

`FACT` — neither pattern imports `AppImage` directly. Read this session:

```
MantineListingGalleryPattern.tsx:6   import { LightboxView, … } from '@/modules/listings/components/LightboxView'
LightboxView.tsx:6                   import { AppImage } from '@/components/ui/AppImage'   (rendered :133, :165)
MantineListingDetailPattern.tsx:6    import { MantineListingGalleryPattern, … } from './MantineListingGalleryPattern'
```

`MantineListingDetailPattern.tsx:116` states "Zero `@/components/ui/*` imports", and that is true of the file itself.
The per-surface census is transitive, so both surfaces reach `AppImage` through **one shared node,
`LightboxView.tsx`**. `INFERENCE` — this task has one blocking hop to clear for Task 820, not two, and the 25
pre-existing blocks ride on the same fix.

### 3.4 The contract says this is exactly one task, and this is it

`FACT` — `docs/agent-contract.md` 16d, tier 2 (lines 210-212):

> **Legacy primitives they import** (`@/components/ui/*`). The surface must **stop importing them** — that is in
> scope and asserted by a zero-hit grep. Migrating the primitive *files* is not, because they are consumed
> repo-wide; name the separate task.

`FACT` — `scripts/check-surface-census.mjs:534` prints the same to the executor at failure time: "Migrating the
primitive file itself is a separate, repo-wide task." Task 813 is that named task. §3.3's 25 surfaces are the
"consumed repo-wide" the clause refers to, now measured rather than asserted.

### 3.5 What is NOT established

`UNKNOWN` — the complete list of files that import `AppImage` by any path (the baselines above record *rendered
frontier edges* and *transitive census blocks*, which is not the same set as "every importer"). The 25-surface and
2-edge figures are the governance-visible surface, not the import census. **R1 re-derives the real importer list at
execution; no count in §3.3 may be copied into the implementation.**

`UNKNOWN` — whether `AppImage` has a canonical Mantine Story today. `docs/backlog.md`'s Task 813 row (filed
2026-09-10 by Task 809's clause-16d census) states `AppImage` had "zero Story imports"; that is a dated claim by
another task and was not re-verified for this kickoff. R1 measures it.

`UNKNOWN` — the co-located sibling set that must move with it. `AppImage.tsx` imports `./AppImage.module.css`,
`./appImageConfig` and `./useAdaptiveImageConfig` as relative paths, and re-exports `ImageVariant` from
`./appImageConfig` (line 17). R1 enumerates every sibling and every external importer of each sibling separately —
`useAdaptiveImageConfig` and `appImageConfig` may have importers of their own that `AppImage.tsx` does not reveal.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.5 | Re-derive at execution, before any edit: every file importing `AppImage`, every file importing each co-located sibling, whether a canonical Mantine Story imports `AppImage`'s own path today, and the live counts for §3.3's 25 census blocks and 2 frontier edges. Report each against §3.3/§3.5 and explain every difference. §3's figures are a dated measurement to reconcile against, never to copy. | **P0** | AC1 | Confirmed |
| **R2** | §5.1 decision (C) | `AppImage.tsx` and every co-located file R1 proves must move with it no longer resolve under `src/components/ui/`. The destination is exactly `src/design-system/media/`. The decision forbids `src/design-system/mantine/patterns/` — the project's canonical non-Mantine image primitive is not a Mantine pattern. No other destination is available to the executor. | **P0** | AC2 | Confirmed — destination fixed by decision §5.1 (C) |
| **R3** | §3.2 | **Zero behaviour change.** The moved file's content is byte-identical apart from import specifiers that must change because a path moved. No prop, no CSS class, no hook order, no `preload` call, no `fetchPriority`, no `imageGuard` notification, no `layoutContext` semantic is altered. `git diff` on the moved file shows import-line changes and nothing else. | **P0** | AC3 | Confirmed |
| **R4** | §3.3 | Every importer R1 found is updated to the new path in the same change. No re-export shim, no barrel alias, and no `tsconfig` path mapping is added to avoid touching callers — a shim would leave the old specifier working and the rule unenforced. | **P0** | AC4 | Confirmed |
| **R5** | Decision §17.6 | After the move, `LightboxView.tsx` contains **zero** `@/components/ui/` matches, and `npm run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` and the same for `MantineListingDetailPattern.tsx` report **zero** `tier2-legacy-primitive` blocks. This is the exact condition Task 820 is blocked on. | **P0** | AC5 | Confirmed |
| **R6** | §5.1 decision | The moved component is governed, not merely relocated: enrolled in `scripts/mantine-migration-scope.json` **and** covered by a canonical Story that statically imports its new path (`src/design-system/media/AppImage.tsx`), so `check:story-coverage` counts it. Enrolment is additionally enforced from this task onward by R12. | **P0** | AC6, AC7 | Confirmed |
| **R7** | §3.3 | Both blocking baselines are brought to a true state in this change, each through its own `--update-baseline`, never by hand. `scripts/rendered-scope-baseline.json`: the 2 `AppImage` tier-2 edges are gone or re-keyed to the new path. `scripts/surface-census-baseline.json`: the 25 tier-2 blocks are gone. Report the before/after entry counts and list every entry added and removed. | **P0** | AC8 | Confirmed |
| **R8** | §3.2 | No `next/image` is introduced anywhere, and `eslint.config.mjs`'s `IMAGE_RENDER_EXCEPTIONS` is updated to the new path so the single approved `no-img-element` disable still resolves. `npm run lint` exits 0 with no new exception added for any other file. | **P0** | AC9 | Confirmed |
| **R9** | Q4 | The 12 route surfaces in §3.3 render identically. LCP behaviour on `/[locale]`, `/[locale]/listings` and `/[locale]/listings/[slug]` is unchanged — `priority`, `fetchPriority`, the `preload` hint and the `imageGuard` budget all still fire for the same images. | **P0** | AC10, AC11 | Confirmed |
| **R10** | 812 R9 precedent | `scripts/check-rendered-scope.mjs`, `scripts/check-surface-census.mjs`, `scripts/check-surface-census-changed.mjs`, `scripts/map-changed-surfaces.mjs`, `scripts/audit-design-system-patterns.mjs` and `scripts/check-pattern-enrolment.mjs` are **not modified** — decision §5.1 states "Do not weaken or alter the existing pattern-directory check". `TIER2_PREFIX` is not changed, widened, or made configurable — moving the file is the fix; editing the classifier is not. R12's check is a **new** script, never an arm added to an existing one. | **P0** | AC12 | Confirmed |
| **R11** | §5.1 decision | `docs/golden-rules.md`, `docs/design-system-pattern-ownership.md` and `docs/storybook-governance.md` record where the project's image primitive now lives and which gate governs it. No GR-n rule body, `Command` block or receipt string changes. | P1 | AC13 | Confirmed |
| **R12** | §5.1 decision (C) | A **blocking, CI-safe, self-tested media-directory parity check** lands in this same task: every `.tsx` directly under `src/design-system/media/` must be a `scripts/mantine-migration-scope.json` entry, and a manifest entry under that directory whose file no longer exists fails as a ghost entry. It derives the directory listing **at runtime** — never a hard-coded name list — prints its scope boundary and its cannot-see sentence on every run, takes its exit decision from one pure function the real run and the self-test both call, and carries a planted-failure proof. Wired into the `governance` job with no `continue-on-error`, no `\|\| true`, no `exit 0` and no wrapper, in the same shape as the four existing `*:verify` steps. Story coverage stays enforced by the existing `check:story-coverage`; this check does not duplicate it. | **P0** | AC14, AC15, AC16 | Confirmed |
| **R13** | §5.1 decision (B1) | This task is scoped to `AppImage` and its R1-proven co-located siblings only. `ListingFeatureIcon` and `FavoriteButton` are **out of scope** and are filed as **Task 821**; their two `scripts/rendered-scope-allowlist.json` entries stay in place and stay governed, and the `owner` field transfer from `"813"` to `"821"` belongs to Task 821, not here. This task must not touch `scripts/rendered-scope-allowlist.json`. The residual `owner: "813"` values in that file are a documented transitional snapshot under the owner amendment of 2026-09-11 (§5.1) — leaving them is required, not an oversight. | **P0** | AC17 | Confirmed |

## 5. Assumptions and open questions

### 5.1 `OWNER DECISION — RECORDED VERBATIM, 2026-09-11`

> **Decision §5.1 — select (C) and (B1), 2026-09-11.** Move `AppImage.tsx` and only the co-located siblings proven by
> R1 to `src/design-system/media/`; do not place the project's canonical non-Mantine image primitive under
> `src/design-system/mantine/patterns/`. In the same Task 813, add a blocking, CI-safe, self-tested media-directory
> parity check: every `src/design-system/media/*.tsx` file must be enrolled in the manifest, while existing story
> coverage continues to require its canonical Story. The check must derive the directory at runtime, print its scope
> boundary, and prove a planted missing-enrolment failure. Do not weaken or alter the existing pattern-directory
> check.
>
> Task 813 is scoped to `AppImage` and its proven co-located siblings only. File `ListingFeatureIcon` and
> `FavoriteButton` as the next numbered task, transfer their allowlist ownership from `813` to that task in the same
> state update, and keep them governed by their explicit entries. Task 820 may resume immediately after the AppImage
> half is approved; it does not wait for the two unrelated components.

**What this settles, and what it creates.**

1. **Destination is `src/design-system/media/`** — R2. The Mantine-pattern directory is refused by name: the file is a
   bespoke `<img>` renderer (§3.2) and decision 5's "every current and future `.tsx`" must not come to cover a file
   that is not a Mantine pattern.
2. **The new directory does not ship ungoverned** — R12. This is the one thing option (B) would have left open, and
   the decision closes it inside the same task rather than as a follow-up: the media directory gets its own parity
   check, built to the same shape `check-pattern-enrolment.mjs` already proved, and blocking in CI from day one.
3. **Story coverage is not duplicated.** `check:story-coverage` already fails for any enrolled component with no
   canonical Story importing its own path; R12's check asserts enrolment only, and its own output must say so.
4. **The existing pattern-directory check is untouched** — R10, restated by the decision itself.
5. **Scope narrows to the critical path** — R13. `ListingFeatureIcon` and `FavoriteButton` become **Task 821**, and
   the owner amendment below settles exactly how and when their allowlist ownership follows.

> **Owner amendment, 2026-09-11 (quoted verbatim; also recorded in the sprint file).** Ownership of
> `ListingFeatureIcon` and `FavoriteButton` transfers to Task 821 in the sprint/backlog/task-design state now. Their
> `owner` fields in `scripts/rendered-scope-allowlist.json` remain `"813"` as a documented transitional snapshot
> until Task 820's final approved commit preserves AC6. Task 821 must make the field-level `813 → 821` transfer as
> its first tracked-file change after verifying that commit, then retain its own before/after hash and gate
> evidence. No further implementation work for those two components remains authorized under Task 813.

**What the amendment binds here.** The two `owner: "813"` values still present in
`scripts/rendered-scope-allowlist.json` are a **documented transitional snapshot**, not a live ownership claim and
not a defect: ownership already sits with Task 821 in this file, the sprint file and `docs/backlog.md`. A reviewer
who sees `"813"` in that JSON must read it against this amendment rather than filing a state mismatch. R13/AC17
stands unchanged and is now doubly binding — this task touches neither component and never opens that file — and no
further implementation work for `ListingFeatureIcon` or `FavoriteButton` is authorized under Task 813 at all.
6. **Task 820 resumes on this task's approval alone**, not on Task 821's.

### 5.2 Other assumptions

- **`ASSUMPTION` (reversible, stated)** — the move is a relocation, not a rewrite: R3 forbids any behavioural edit.
  Reason: §3.2's measured contract. If the owner picks a rewrite instead, this kickoff does not describe that work
  and must be replaced, not stretched.
- **Out of scope:** any visual or behavioural change to `AppImage` · migrating any other `src/components/ui/*` file ·
  `PasswordRequirementsHint` (the other tier-2 edge, owner decision 1) · Task 820's own baseline reconciliation,
  which re-runs after this task is approved · editing any gate's logic.

## 6. Pre-read rule bundle

`docs/golden-rules.md` in full, GR-1 · GR-3 · the `Enforcement status` table · `docs/agent-contract.md` clauses
**9, 13, 16a-16d** — 16d's three-tier block (`:205-217`) in full · `docs/qa-profiles.md` (Q4) ·
`docs/orchestrator-ui-task-design.md` · `src/components/ui/AppImage.tsx` in full, with
`./appImageConfig.ts`, `./useAdaptiveImageConfig.ts`, `./AppImage.module.css`, `@/lib/imageDelivery`,
`@/lib/performance/predictive` and `@/lib/performance/imageGuard` · `src/modules/listings/components/LightboxView.tsx`
in full · `scripts/check-rendered-scope.mjs` — `TIER2_PREFIX`, the root walk, the baseline writer and its tier-2
refusal · `scripts/check-surface-census.mjs` — `TIER2_PREFIX`, `countUiImports` (`:191-209`) and the block reason at
`:544` · `scripts/check-story-coverage.mjs` — the admission test the moved file must satisfy ·
`scripts/mantine-migration-scope.json` · `eslint.config.mjs`'s `IMAGE_RENDER_EXCEPTIONS` ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md` §17.1, §17.6 and §17.7 ·
this kickoff.

## 7. Scope

- **Moved:** `src/components/ui/AppImage.tsx` and every co-located file R1 proves must move with it, to the §5.1
  destination.
- **Edited:** every importer R1 found · `eslint.config.mjs` (`IMAGE_RENDER_EXCEPTIONS` path only) · `package.json` ·
  `.github/workflows/governance-pr.yml` ·
  `scripts/mantine-migration-scope.json` (+1) · `scripts/rendered-scope-baseline.json` and
  `scripts/surface-census-baseline.json` (each via its own `--update-baseline`) · `docs/golden-rules.md`,
  `docs/design-system-pattern-ownership.md`, `docs/storybook-governance.md`.
- **New:** the canonical Story for the moved component, if R1 proves none exists · `scripts/check-media-enrolment.mjs`
  and its two `package.json` entries (R12) · two blocking steps in `.github/workflows/governance-pr.yml` (R12).
- **Written:** `docs/sessions/evidence/task813/*` · `docs/sessions/2026-MM-DD-task813-*.md` · the concise
  `docs/backlog.md` state line.

## 8. Out of scope

Everything in §5.2. In particular: **no change to `AppImage`'s rendered output**, and **no edit to any existing gate
script** — R12 adds a new one, it never extends `check-pattern-enrolment.mjs` or any of R10's six. Also out of scope
by decision §5.1 (B1): `ListingFeatureIcon`, `FavoriteButton`, and `scripts/rendered-scope-allowlist.json` in any
form — those are **Task 821**. If clearing the tier-2 edge appears to require any of these, that is a
`BLOCKED — OWNER DECISION REQUIRED`, not a small fix.

## 9. Current and required behavior

**Before.** The project's image primitive sits at `src/components/ui/AppImage.tsx`. Two gates classify anything under
that prefix as `tier2-legacy-primitive`. 25 census blocks and 2 frontier edges record it as debt; two newly enrolled
design-system patterns reach it transitively through `LightboxView.tsx`, and `--update-baseline` refuses to record
those, which is what blocks Task 820.

**After.** The same component, byte-identical in behaviour, lives outside `src/components/ui/`, is enrolled and has a
canonical Story of its own, every importer points at the new path, both baselines are true, and
`check:surface-census --surface` on both patterns reports zero tier-2 blocks.

## 10. Implementation requirements

1. **Order is load-bearing.** R1's census → the move → importer rewrite → `eslint.config.mjs` → Story → enrolment →
   the R12 parity check and its CI wiring → both baselines → docs. Enrolling before the Story exists makes
   `check:story-coverage` red; updating a baseline before the importers are rewritten records a half-migrated state;
   adding the parity check before the move means it has an empty directory to assert against.
1a. **The parity check reads the directory, not a list** — decision §5.1's own words. A hard-coded set of names
   would pass while the rule it enforces silently stops applying to the next file added there. Build it to the shape
   `scripts/check-pattern-enrolment.mjs` already proved — a pure `evaluate…` classifier, a pure
   `evaluateGateExitCode`, a printed scope boundary, and a `--verify-gate` self-test whose arms include a
   ghost-entry arm and an exit-code-wiring arm — **without importing from or modifying that file**.
2. **Never hand-edit a baseline.** Both are written by their own `--update-baseline`, which is also what keeps the
   tier-2 refusals intact. If either writer refuses something, stop and report — do not narrow the window.
3. **No shim.** R4 forbids a re-export at the old path, a barrel alias and a `tsconfig` path mapping. The old
   specifier must stop resolving, or the rule is not enforced and the next importer re-introduces the edge.
4. **Read and write through Node for every plant-and-restore probe**, never PowerShell `Get-Content -Raw` without
   `-Encoding utf8` — it has corrupted a script and a data file in this sprint already (818/816).
5. **Transcripts record platform, Node version, working directory, exact command and actual exit code in the same
   file**, and the final gate block records the `git hash-object` of every changed file.
6. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`. Task 820's Revision 2 lost a validation pass to exactly this.

## 11. Positive and negative flows

**Positive.** A developer opens `/[locale]/listings/[slug]`, clicks the main photo, and the lightbox opens with the
same images, the same blur-up, the same srcset and the same LCP timing as before — while
`check:surface-census --surface` on the two patterns now reports zero tier-2 blocks.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| An importer is missed | Yes | `npm run typecheck` fails on the unresolved specifier — R4/AC4 |
| A shim is added at the old path | Yes | AC4 fails: a `src/components/ui/AppImage*` file still exists |
| The moved component has no Story of its own | Yes | `check:story-coverage` fails once it is enrolled — R6, and why the Story comes first |
| A co-located sibling is left behind and still imported across the boundary | Yes | R1's sibling census catches it; a rendered sibling left under the prefix keeps the tier-2 edge alive |
| `--update-baseline` refuses a new tier-2 edge | Yes | `BLOCKED — OWNER DECISION REQUIRED`; never narrow the window or hand-edit |
| A route's LCP image stops being preloaded | Yes | R9/AC11 — the `preload` hint and `fetchPriority` must be unchanged for the same images |
| A new `.tsx` is added under `src/design-system/media/` without enrolment | Yes | R12's check fails naming it — the reason the directory is not left ungoverned |
| A manifest entry points at a `src/design-system/media/` path that no longer exists | Yes | R12's check fails naming it as a ghost entry |
| Authorization / RLS / network / concurrent writer | **No** | a file move, import rewrites, one manifest entry, one Story, one new check, two baselines and three docs |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the census re-derived at execution, then every importer of `AppImage` and of each co-located
  sibling is listed, the own-Story status is stated, and the live tier-2 counts are reconciled against §3.3's 25
  blocks / 2 edges with every difference explained. Quote the totals and the commands that produced them.
- **AC2 [R2]** — Given the final tree, then no file named `AppImage*` resolves under `src/components/ui/`, and the
  moved files sit at the §5.1 destination. Quote `git status --short` for both paths.
- **AC3 [R3]** — Given `git diff -M` on the moved file, then it is detected as a rename and the only content changes
  are import specifiers. Quote the diff in full; any other changed line is a defect.
- **AC4 [R4]** — Given the final tree, then a repo-wide search for `components/ui/AppImage` returns **zero** hits in
  `src/`, and no re-export, barrel alias or `tsconfig` path mapping was added. Quote the zero-hit search.
- **AC5 [R5]** — Given the final tree, then `LightboxView.tsx` has zero `@/components/ui/` matches, and
  `check:surface-census --surface` reports **zero** `tier2-legacy-primitive` blocks for both
  `MantineListingGalleryPattern.tsx` and `MantineListingDetailPattern.tsx`. Quote both censuses.
- **AC6 [R6]** — Given `scripts/mantine-migration-scope.json`, then it holds the moved component's new path and no
  other entry changed. Quote the before/after counts and the added path.
- **AC7 [R6]** — Given `npm run check:story-coverage`, then it exits 0 with the moved component counted as covered,
  and the Story's `meta.title` satisfies `isCanonicalMantineTitle`. Quote the title, the static import line and the
  coverage totals.
- **AC8 [R7]** — Given both baselines after their own `--update-baseline`, then `check:rendered-scope` and
  `check:surface-census:changed` both exit 0 with 0 new and 0 stale, the `AppImage` tier-2 entries are gone, and
  every entry added and removed is listed. Quote both scope blocks and both before/after counts.
- **AC9 [R8]** — Given `npm run lint`, then it exits 0, `IMAGE_RENDER_EXCEPTIONS` names only the moved file's new
  path, and no `next/image` import exists anywhere in `src/`. Quote the exception hunk and the zero-hit search.
- **AC10 [R9]** — Given `npm run build`, then it exits 0, and the route table's First Load JS for
  `/[locale]`, `/[locale]/listings` and `/[locale]/listings/[slug]` is compared against the pre-change build with any
  difference explained. Quote both route tables.
- **AC11 [R9]** — `OWNER VISUAL QA REQUIRED`. Given the moved component's Story and the affected routes, then the
  owner reviews and records accepted/returned for each tuple: the new Story's `Default` at `390` and `1440` in `en`;
  `Patterns/Mantine/ListingGalleryPattern → Default` lightbox **closed** and **open** at `390` and `1440` in `en`.
  Name the six tuples in the completion report; no automated screenshot verdict substitutes for this review.
- **AC12 [R10]** — Given the final tree, then `git diff --stat` is **empty** for the six scripts named in R10, and
  `TIER2_PREFIX` is byte-identical in both gates. Quote both.
- **AC13 [R11]** — Given the three documents, then each records the new location and its governing gate, and GR-1's
  `Command` block, its receipt string and every GR-n rule body are byte-identical. Quote the changed rows and the
  byte-identity check.

- **AC14 [R12]** — Given `npm run check:media-enrolment` on the final tree, then it exits **0**, prints what it
  scanned, what it does **not** scan, and its cannot-see sentence, and states the live `src/design-system/media/`
  file count and the manifest entry count. Its output must also state that canonical-Story coverage is
  `check:story-coverage`'s job, not this check's. Quote the output.
- **AC15 [R12]** — Given a planted unenrolled file under `src/design-system/media/` — add a scratch `.tsx`, or
  temporarily remove the moved component's path from the manifest; name which — then the check exits non-zero naming
  it, and `npm run check:media-enrolment:verify` passes every arm including an exit-code-wiring arm and a
  ghost-entry arm. Restore, and retain **one** witness transcript carrying the `git hash-object` before, the same
  value after, and the explicit `git --no-optional-locks status --porcelain -- <path>` output.
- **AC16 [R12]** — Given `.github/workflows/governance-pr.yml` after the change, then the check and its self-test
  are two steps in the `governance` job with no `continue-on-error`, no `|| true`, no `exit 0` and no wrapper. Quote
  the hunk with the job name and the neighbouring steps.
- **AC17 [R13]** — Given the final tree, then `git diff --stat scripts/rendered-scope-allowlist.json` is **empty**,
  both `owner: "813"` entries are byte-identical to their pre-task content, and no work on `ListingFeatureIcon` or
  `FavoriteButton` appears in this diff. Quote the empty diff.

**GR-4 AC AUDIT — 17 criteria; each states an observable property; absolutes: AC4's and AC9's "zero hits" and
AC12's / AC17's "empty diff" are this task's defined outcome, scoped to named paths this task deliberately does not
otherwise change.**

## 13. QA profile and verification plan

**`Q4 Release/Critical Flow`** — `docs/qa-profiles.md` selects Q4 for release-affecting work and for any task
claiming a gate result. This task moves the image primitive behind **12 route surfaces** including `/[locale]`,
`/[locale]/listings` and `/[locale]/listings/[slug]`, all LCP-sensitive, and it moves two blocking gates' baselines.
The claim is zero behavioural change, which under Q4 requires a regression baseline rather than an assertion.

### 13.1 Baseline — capture before any edit

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task813"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
node.exe -e "const{execSync}=require('child_process');console.log(execSync('git grep -l AppImage -- src',{encoding:'utf8'}))"
npm.cmd run check:rendered-scope
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingDetailPattern.tsx
npm.cmd run check:story-coverage
npm.cmd run build
```

Expected: `win32`; the Node version; the project root; the worktree state; the full importer list (R1/AC1); the
rendered-scope gate at exit 0; both per-surface censuses each naming one `tier2-legacy-primitive` block on
`AppImage`; `check:story-coverage` exit 0; and a zero-exit build whose route table is retained as AC10's before-half.
**Return all of it before changing any tracked file.**

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
node.exe -e "const{execSync}=require('child_process');try{console.log(execSync('git grep -n components/ui/AppImage -- src',{encoding:'utf8'}))}catch(e){console.log('zero hits — expected')}"
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingDetailPattern.tsx
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment
npm.cmd run check:media-enrolment:verify
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: typecheck 0 · lint 0 · the `components/ui/AppImage` search at **zero hits** · both per-surface censuses at
**zero** tier-2 blocks · `check:rendered-scope` exit 0 with 0 new / 0 stale · all four self-tests passing every arm ·
`check:story-coverage` exit 0 with the moved component covered · `check:stories` 0 violations · `build` **exit 0**,
mandatory under `agent-contract` clause 9 · both hygiene gates clean. **Record every exit code inside its own
transcript and the `git hash-object` of every changed file in this block.**

### 13.3 Owner visual review

AC11's six tuples, opened in Storybook and in the running app by the owner. `screenshots:assert` and every alias are
retired (owner decision 2026-09-03) and must not be run or cited.

### 13.3a The planted arm

AC15's probe, run and restored under §10.5's one-transcript witness rule, touching a scratch path under
`src/design-system/media/` or the manifest only — never the moved component's source.

### 13.4 Owner-native rule

Native Windows PowerShell throughout. A result from WSL, a Linux VM or a mounted Linux view is an environment screen,
not evidence; record it as `MISSING EVIDENCE` with the exact native command.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's baseline including the full importer census and the before-half
route table · AC1's reconciliation against §3.3's 25 / 2 · AC2's `git status` for both paths · AC3's full rename diff ·
AC4's and AC9's zero-hit searches · AC5's two per-surface censuses · AC6's manifest counts · AC7's title, import and
coverage totals · AC8's two scope blocks with every baseline entry added and removed · AC10's two route tables ·
AC11's six `OWNER VISUAL QA REQUIRED` tuples · AC12's empty diffs and the `TIER2_PREFIX` byte-identity check ·
AC13's quoted rows · AC14's output · AC15's probe and its single witness · AC16's workflow hunk · AC17's empty
allowlist diff · every command with its real exit code and transcript path · the `git hash-object` of every
changed file · assumptions · deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED — OWNER DECISION REQUIRED`.
Do not self-approve; Sonnet runs, emits and suggests no mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Is the tier-2 finding fixed or hidden? | **Fixed at the path.** `TIER2_PREFIX` is a literal prefix in both gates (§3.1); moving the file out clears all 27 blocks/edges at once. R10 forbids touching the classifier; R4 forbids a shim. |
| Is `AppImage` being rewritten? | **No.** §3.2 measured why: it is the project's canonical `<img>` render site with a documented `next/image` ban, Cloudinary srcset, LQIP, React 19 `preload`, `imageGuard` and LCP handling, and Mantine has no equivalent. R3 makes any behavioural edit a defect. |
| How much does Task 820 depend on? | **Only the `AppImage` half** — §5.1 half B is exactly that question, and the answer changes when 820 unblocks. |
| Is the blocking hop one or two? | **One.** Both patterns reach `AppImage` through `LightboxView.tsx` (§3.3), which is also the single tier-1 edge Task 820 baselined. |
| Are the figures in §3 safe to copy? | **No** — R1/AC1 re-derives them, and §3.5 states what was never measured at all. |
| Is the destination an executor choice? | **No** — decision §5.1 (C) fixes it at `src/design-system/media/` and refuses the Mantine-pattern directory by name. |
| Does the new directory ship ungoverned? | **No** — R12 lands its parity check in this same task, blocking in CI with a planted-failure proof, reading the directory at runtime. That was the one cost of choosing a new namespace, and the decision closed it here rather than deferring it. |
| Does this task touch the allowlist? | **No** — R13/AC17, and the 2026-09-11 owner amendment in §5.1 makes the residual `owner: "813"` values a documented transitional snapshot. The field transfer is Task 821's first tracked-file change, after it verifies Task 820's commit. No further work on those two components is authorized under this task. |
