# Task 695 — Retire the `--color-overlay*` namespace and the `@theme inline` overlay copy

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Sonnet has no approval authority; this is a
factual handoff for the Opus orchestrator's own review, not a self-approval.

Kickoff: `tasks/Sprints/Sprint_46_kickoff_prompt_Task_695_OverlayNamespaceExit.md`.
Start state: `HEAD f42e9b855bcd119ad2041c0daf1c5b6d06d637c4` ("docs(task-695): file the overlay
namespace exit kickoff"), `git status --porcelain` empty at I0.

> **Post-review artifact reconciliation — 2026-08-14.** The Opus review found AC2's rendered proof
> captured at a single width (finding F8), so the comparator was parameterised over the canonical
> Mantine story matrix (320/375/390/1024) and both arms were re-run. **The 4-viewport rerun
> supersedes the 28-cell comparator transcripts**: every citation in this log now names
> `comparator-real-run-4vp.log` (112/112) and `comparator-planted-run-4vp.log` (2/112, plant pinned
> at `en` × `desktop-1024`), and the two 28-cell logs are retired as `*.SUPERSEDED-28cell.log`.
> `real-comparator-result.json` and `real-comparator-PLANTED.json` were overwritten by the rerun and
> hold the 112-cell data. The `--verify-gate` and standing-gate citations below likewise now name
> the post-review reruns rather than the intermediate ones. No transcript's contents were edited —
> only this log's references to them.

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Zero `var(--color-overlay*)` refs remain in `src/**` | `final-reference-census.log` → `TOTAL 0` |
| R2/AC2 | Every migrated site's computed value identical before/after, hover included, comparator shown to fail | `comparator-real-run-4vp.log` → 112/112 cells OK, 0 failures; `comparator-planted-run-4vp.log` → 2/112 FAIL with `--plant` (pinned at `en` × `desktop-1024`), exit 1 |
| R3/AC3 | Zero `bg\|text\|border-overlay*` rules generated in the built bundle | `final-generated-utility-census.log` → `TOTAL 0` (also re-verified at I0=5, post-comment-rewrite=0, final=0) |
| R4/AC4 | `@theme inline` overlay block gone; `:root` pair byte-unchanged; §3.4 consumers still resolve | `git diff src/app/globals.css` — only comments changed around the `:root` declarations; `final-check-css-vars.log` → 0 violations (all 8 `.module.css` consumers in §3.4 still resolve, confirmed by Arm A/B 0-violation scan) |
| R5/AC5 | 692's gate rewritten to invariants that hold now, each shown to fail | `step6-overlay-gate-test.log` → 6/6 (3 real-tree + 3 planted-violation assertions) |
| R6/AC6 | `check:css-vars -- --verify-gate` green, P3 re-pointed and justified | `final-check-css-vars-verify-gate.log` → 8/8; P3 re-pointed to `--text-3xl` (1 decl, 0 shipped refs, measured) |
| R7/AC7 | Comment keeps the Mantine `Paper` cascade-trap record, AC3 holds | `LightboxView.tsx` comment rewritten, cascade-trap explanation preserved in prose (no literal utility string); AC3 confirmed 0 |
| R8/AC8 | Critical-flow suite passes, unmodified | `step8-critical-flow-suite.log` → 4/4; `git diff --stat` on the test file → empty |
| R9/AC9 | D19 closed; both comment records rewritten; no "Keep both copies" text | `docs/backlog.md` D19 marked CLOSED; `grep "Keep both copies"` → 0 matches |
| R10/AC10 | Standing gates green; evidence committed under `docs/reviews/artifacts/<date>-task695/` | see §5 below |

## 2. Current versus required behavior

**Current (preserved):** the rendered scrim, ActionIcon rest/hover colors, active-thumbnail border,
and the gallery overflow badge text color are all pure black / pure white — unchanged. Nothing
visible moved; this is D28 (mechanism-only).

**Required (implemented):** the seven sites that read `var(--color-overlay*)` now read
`var(--overlay*)` directly; the `@theme inline` overlay copy (and its Tailwind-fallback purpose) no
longer exists because the last Tailwind-scanned overlay utility candidate is gone.

**Negative-flow applicability** (`docs/qa-profiles.md`):

| Branch | Applicable? | Evidence |
|---|---:|---|
| Validation | No | no form/input touched |
| Authorization/RLS | No | no data-access code touched |
| Offline/network | No | pure CSS/style-string change |
| Concurrent writer | No | no write path touched |
| Critical-flow regression | Yes | `LightboxView.tsx` is named in `docs/critical-flow-registry.md:105`; `ListingGallery.portal.smoke.test.tsx` 4/4, §1 R8 |

## 3. Files changed

| Path | Reason |
|---|---|
| `src/modules/listings/components/LightboxView.tsx` | Migrated 6 `var(--color-overlay*)` sites to `var(--overlay*)`; rewrote the `Modal.Content` comment to stop emitting a Tailwind-scannable overlay-utility string |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | Migrated the 1 remaining site (`Text c=`) |
| `src/components/shared/PerfDevOverlay.tsx` | **Not in the kickoff's §7 scope table** — its historical-note comment independently generated 2 of the 5 real overlay utility rules in the bundle (`.text-overlay-foreground\/70` static + color-mix forms); AC3 is unconditional, so this comment was also rewritten to stop matching the scanner. See §6 "Deviations" |
| `src/app/globals.css` | Deleted the 4-name `@theme inline` overlay block (comment + `--overlay`/`--overlay-foreground`/`--color-overlay`/`--color-overlay-foreground`); rewrote both comment records; `:root:455-456`'s two declaration lines are byte-unchanged (verified in the real diff) |
| `scripts/__tests__/overlay-dual-declaration.test.ts` | Rewritten from the (now-vacuous) dual-declaration invariant to 3 single-source invariants, each with an embedded planted-violation assertion |
| `scripts/check-css-var-resolvability.mjs` | `runPlantP3` re-pointed from `--color-overlay-foreground` (deleted) to `--text-3xl`; `runControlC3`'s hardcoded owned-count assertion updated `259 -> 257` |
| `scripts/__tests__/css-var-resolvability.test.ts` | **Not in the kickoff's §7 scope table** — a third hardcoded `owned.size === 259` assertion broke on the same owned-count change; fixed. See §6 |
| `docs/backlog.md` | Concise state update (695 row, Sprint 46 line, D19 decision, Last Session banner) — line count unchanged at 80 |
| `docs/reviews/artifacts/2026-08-13-task695/` | Comparator script + all transcripts (new) |
| `docs/sessions/2026-08-13-task695-overlay-namespace-exit.md` | This file (new) |

## 4. Validation evidence

All commands run from the repo root, transcripts retained unpiped with `EXIT_CODE`/`EXIT` appended
as a separate statement (`docs/reviews/artifacts/2026-08-13-task695/*.log`).

### 4.1 I0 baseline (before any edit)

- `git status --porcelain` — empty.
- Reference census (§13 command) — **8** raw hits, but grep-verified 1 of them (`globals.css:72`) is
  a multi-line-comment continuation the single-line stripper in that ad-hoc command can't see; the
  real live count is **7**, matching §3.2 exactly (`LightboxView.tsx` ×6, `MantineListingGalleryPattern.tsx` ×1).
- `npm run build` → exit 0, `/[locale]` First Load JS **619 kB** (`I0-build.log`).
- Generated-overlay-utility census → **5**, not the kickoff's predicted 3 — see §6 Deviations.
- `npm run check:css-vars -- --verify-gate` → 8/8 (`I0-verify-gate.log`), owned=259.

### 4.2 Two-phase comparator (AC2)

I0 export of `f42e9b855` built via `git archive | tar -x` into a sibling directory
(`../lero-al-i0-f42e9b8`, `node_modules` reused via a Windows junction — `package-lock.json`
byte-identical, nothing in this task touches dependencies), `npm run build-storybook` and
`npm run build` run there natively (both exit 0). AFTER = this worktree's own `storybook-static` +
`.next`, built post-migration.

`docs/reviews/artifacts/2026-08-13-task695/real-before-after-comparator.mjs` — real Storybook DOM,
structural (locale-independent) selectors, both `LightboxView.stories.tsx` (`Default`, multi-image
section) and `ListingGalleryPattern.stories.tsx` (`Default`, 6-image fixture, `play` opens the
lightbox). 4 sites × 4 locales:

- **modalScrim** — `Modal.Content` `backgroundColor` (color-mix over `--overlay`).
- **actionIconRest/Hover** — Close `ActionIcon`'s `backgroundColor`+`color` at rest and after a real
  Playwright pointer `.hover()` (proves the 4 `--ai-*` properties still feed Mantine's own `:hover`
  rule, A2).
- **thumbBorder** — active thumbnail's `borderColor`.
- **extraCountText** — the `+2` overflow badge `Text` color (6-image fixture, `MAX_THUMBNAILS=4`).

Real run: `comparator-real-run-4vp.log` → **112/112 cells OK, 0 failures**, `real-comparator-result.json`.
Planted run (`--plant` corrupts 2 AFTER-side cells at the pinned pair `en` × `desktop-1024`):
`comparator-planted-run-4vp.log` → **2/112 FAIL, exit 1**, `real-comparator-PLANTED.json` — the
comparator is shown able to fail.

### 4.3 Ordered implementation gates (§9)

1. Comment rewrite (`LightboxView.tsx` + `PerfDevOverlay.tsx`) → rebuild → generated-utility count
   **0** (`step3-post-comment-build.log`).
2. Seven references migrated → reference census **0** live hits remaining (only the not-yet-rewritten
   `globals.css` comment continuation, expected until step 5).
3. `@theme inline` block deleted, both comments rewritten → rebuild → generated-utility count **0**,
   `--color-overlay*` declared nowhere, `check:css-vars` 0 violations (`step5-post-deletion-build.log`,
   `step5-check-css-vars.log`); `--verify-gate` **red** as predicted, 2/8 (`step5-verify-gate-BROKEN.log`,
   P3 + C3, see §6).
4. 692's gate rewritten → `step6-overlay-gate-test.log` 6/6.
5. P3 re-pointed + C3 fixed → `--verify-gate` **8/8**
   (`docs/reviews/artifacts/2026-08-13-task695-review/postfix-verify-gate.log`).
6. Critical-flow suite → `step8-critical-flow-suite.log` 4/4, file unmodified.

### 4.4 Final standing gates (post-implementation, all commands run this session)

| Check | Result | Transcript |
|---|---|---|
| `npm run build` | exit 0, `/[locale]` First Load JS **619 kB** (unchanged from I0) | `final-build.log` |
| `npx tsc --noEmit` | exit 0, 0 output | `final-typecheck.log` |
| `npm run check:design-tokens` | 0 violations | `final-check-design-tokens.log` |
| `npm run check:css-vars` | 0 violations, 0 in-class dynamic sites | `final-check-css-vars.log` |
| `npm run check:css-vars -- --verify-gate` | **8/8** | `final-check-css-vars-verify-gate.log` |
| `npm run check:stories` | 127 files, 0 violations | `final-check-stories.log` |
| `npm run check:mojibake` | 0 artifacts in 2355 files | `final-check-mojibake-v2.log` |
| `npm run check:file-integrity` | 41/41 clean | `final-check-file-integrity-v2.log` |
| `npm run check:review-ledger` | 2/2 ledgers valid (pre-existing, untouched) | `final-check-review-ledger.log` |
| `npx vitest run` (full suite) | **1351/1351 passed**, 80/80 files | `final-vitest-full.log` |
| Generated-overlay-utility census | **TOTAL 0** | `final-generated-utility-census.log` |
| Reference census (`var(--color-overlay*)`) | **TOTAL 0** | `final-reference-census.log` |
| Tailwind-utility census (`bg\|text\|border-overlay*`) | **TOTAL 0** | `final-tailwind-census.log` |

`docs/backlog.md`: 80 physical lines (`wc -l`), unchanged from the `HEAD` baseline (`git show
HEAD:docs/backlog.md | wc -l` = 80) — content replaced in place, no growth. No `BACKLOG LIMIT BREACH`.

## 5. Visual source trace

| Visible artifact | Component/markup | Class/selector | Token path | Change | Evidence |
|---|---|---|---|---|---|
| Modal scrim (95% black wash) | `LightboxView.tsx` `Modal.Content` inline `style` | none (inline) | `--color-overlay` → `--overlay` (value-identical, `--color-overlay: var(--overlay)` alias) | changed (token name only) | comparator `modalScrim`, 4/4 locales OK |
| ActionIcon rest bg/color (10%/white) | `LightboxView.tsx` `LIGHTBOX_ACTION_ICON_STYLE` inline `style` | `--ai-bg`/`--ai-color` (Mantine's own CSS-module rule reads these) | `--color-overlay-foreground` → `--overlay-foreground` | changed (token name only) | comparator `actionIconRest`, 4/4 locales OK |
| ActionIcon hover bg/color (20%/white) | same, Mantine's own `:hover` rule reading `--ai-hover`/`--ai-hover-color` | same | same | changed (token name only) | comparator `actionIconHover` (real Playwright `.hover()`), 4/4 locales OK |
| Active thumbnail border (white) | `LightboxView.tsx` thumbnail `UnstyledButton` inline `style` | none (inline) | `--color-overlay-foreground` → `--overlay-foreground` | changed (token name only) | comparator `thumbBorder`, 4/4 locales OK |
| Gallery overflow badge text (white `+N`) | `MantineListingGalleryPattern.tsx` `Text c=` | Mantine `c` prop → inline `color` | `--color-overlay-foreground` → `--overlay-foreground` | changed (token name only) | comparator `extraCountText`, 4/4 locales OK |
| Every `.module.css` consumer in kickoff §3.4 (`AdminUserAvatar`, `PerfDevOverlay`, `ImageUpload`, `LightboxView`, `ListingGallery`, `MantineListingGalleryPattern`, `MantineListingCardPattern`, `PopularLocationsView`) | CSS Modules, `var(--overlay*)` | n/a | `--overlay`/`--overlay-foreground` in `:root` — **untouched** | preserved | `final-check-css-vars.log` 0 violations (every one resolves); `:root:455-456` byte-identical in `git diff` |

## 6. Deviations from the kickoff's own measured facts (§3 corollary — "if the tree disagrees, the tree wins")

1. **§3.3's generated-utility count was 3, not 5.** The kickoff named only `LightboxView.tsx`'s
   comment (`:74-84`) as the source of the two still-generated utilities (`bg-overlay`,
   `bg-overlay/95` two-tier = 3 rules). Measured at I0: **5** rules — the extra 2
   (`.text-overlay-foreground\/70` static + color-mix forms) came from `PerfDevOverlay.tsx:75-76`, a
   file **not named in the kickoff's §7 scope table**, whose RR1/748-REWORK historical-note comment
   contained the literal Tailwind-utility-shaped string `text-overlay-foreground/70` in a JSX
   comment — the same scanner-reads-comments hazard D35/748 already documented, just in a second
   file the kickoff's own re-derivation missed. AC3 is unconditional ("zero ... rules ... in the
   built bundle"), so this file's comment was also rewritten (§3, Files changed) to satisfy it.
   Judgment call: treated as in-scope-by-necessity (a mechanical, same-pattern comment rewrite
   required to meet a P0 acceptance criterion) rather than stopping for a
   `TASK SPECIFICATION CONTRADICTION` — the fix technique is identical to what the kickoff already
   authorizes for `LightboxView.tsx`, and no functional/visual behavior changed.
2. **Two more hardcoded `owned.size === 259` assertions broke**, beyond the kickoff's named P3
   target: `check-css-var-resolvability.mjs`'s own `runControlC3` (self-test control, same file
   already in §7 scope) and `scripts/__tests__/css-var-resolvability.test.ts`'s
   `'matches the real globals.css measured count (259)'` test (**not named in §7 scope**). Both are
   downstream references to the owned-property count that the `--color-overlay*` deletion legitimately
   changed (259 → 257); left unfixed, `--verify-gate` would stay red (violating AC6) and a previously
   green test file would regress (violating the "no unrelated regression" implicit bar). Both fixed;
   evidence in §4.4 (full vitest 1351/1351, `--verify-gate` 8/8).
3. **P3's replacement target.** `--overlay-foreground` was confirmed NOT reusable (per the kickoff's
   own instruction to read the comment first) — after migration it has live CSS Module `var()`
   consumers (§3.4's 8 files), so its shipped-CSS reference count is no longer 0. Searched the
   codebase for another token with the same shape (1 shipped declaration, 0 shipped `var()`
   references, live TSX consumer) and verified empirically against the real build:
   `--text-3xl` (`src/app/[locale]/page.tsx`'s `fz={{ base: 'var(--text-3xl)', ... }}`) — Tailwind's
   `.text-3xl` utility inlines the literal `1.875rem` rather than emitting `var(--text-3xl)`, so the
   declaration is genuinely the token's only appearance in shipped CSS. Confirmed via
   `grep -o -- "--text-3xl:[^;]*;" .next/static/css/*.css` → exactly one hit.

## 7. Assumptions, deviations, and limitations

- **A1/A2 (kickoff)** confirmed: the rename is value-identical by construction and the comparator
  measured it directly, hover states included (§4.2).
- **OQ1** resolved as prose (dropped the literal utility-class strings entirely rather than breaking
  them across a non-joining boundary) — simpler and avoids introducing non-ASCII characters that
  `check:mojibake` would need to re-clear.
- 692's gate rewrite proves its planted violations via literal in-memory fixture strings fed to the
  same counting functions the real-tree assertions use, not by mutating and restoring the real
  tracked file — the idiomatic pattern already used by the original 692 test and by
  `check-css-var-resolvability.mjs`'s own `--verify-gate` self-test.
- The `docs/reviews/artifacts/2026-08-13-task748-rework/` I0 export precedent used a machine-local
  sibling directory (`../lero-al-i0-d3ffd6`) with an `LERO_I0_EXPORT_DIR` override; this task's
  comparator follows the identical convention (`../lero-al-i0-f42e9b8`) for the same reproducibility
  reason.

## 8. Opus handoff

- Evidence root: `docs/reviews/artifacts/2026-08-13-task695/` (not yet committed — owner action).
- Please independently re-derive the §13 censuses against the current tree, not just read the logs.
- Please independently inspect `git diff src/app/globals.css` to confirm `:root:455-456`'s two
  declaration lines are byte-identical (only the comments changed) — this is the AC4 P0 claim.
- Please re-run `node docs/reviews/artifacts/2026-08-13-task695/real-before-after-comparator.mjs`
  (needs the I0 export at `../lero-al-i0-f42e9b8` or `LERO_I0_EXPORT_DIR`) to independently confirm
  the 112/112 PASS and the `--plant` 2/112 FAIL.
- Flagged for your judgment: §6.1's scope expansion to `PerfDevOverlay.tsx` (not in the kickoff's §7
  table) and §6.2's second undocumented hardcoded-count fix in
  `scripts/__tests__/css-var-resolvability.test.ts` — both were necessary to meet stated P0 ACs
  (AC3, AC6) and full-suite green, but neither was pre-authorized by the kickoff's scope table.
- `docs/reviews/artifacts/2026-08-13-task748-round3/` and this task's own artifact directory are
  both currently uncommitted (owner action, per standing git policy).

## 9. Backlog update

`docs/backlog.md` updated in place (Last Session banner, 695's registry row, Sprint 46 line, D19
decision) — **80 physical lines**, unchanged from the `HEAD` baseline (`git show HEAD:docs/backlog.md
| wc -l` = 80). No `BACKLOG LIMIT BREACH`.
