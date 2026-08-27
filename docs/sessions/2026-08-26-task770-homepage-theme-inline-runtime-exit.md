# Task 770 — Homepage Level 3: exit `@theme inline` runtime reads, with a fixed-manifest ownership gate

**Sprint 65** · Base `06091ba1d` (kickoff filed at `b73860fc5`) · Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_65_kickoff_prompt_Task_770_Homepage_Theme_Inline_Runtime_Exit.md`

## 1. Task path and status

`tasks/Sprints/Sprint_65_kickoff_prompt_Task_770_Homepage_Theme_Inline_Runtime_Exit.md`

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved.

## 2. Start-state note (§14.1 stop condition, encountered and cleared)

At the first §10.0 preflight attempt, `git status --porcelain` was non-empty (`M docs/backlog.md`,
`M tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`,
`?? tasks/Sprints/Sprint_65_kickoff_prompt_Task_770_…md`) — exactly the three filing artifacts
kickoff §3.12 anticipated the owner would commit before execution began, but they were not yet
committed. Per §3.12/§14.1 this is a stop condition; execution was halted and `BLOCKED` was reported
verbatim, without stashing, committing, or working around it. The owner committed those three paths
as `b73860fc5` (`docs(Task770): file the Level-3 theme-inline runtime exit kickoff with its
fixed-manifest ownership gate`), on top of `06091ba1d`. Re-run of §10.0: `git status --porcelain`
empty, `HEAD` = `b73860fc5` containing `06091ba1d` — execution proceeded from there.

## 3. §10.0 preflight — five gates, three token probes, one expected-zero probe

All read-only, native Windows PowerShell, `node.exe -p process.platform` = `win32`.

| Command | Exit | Evidence |
|---|---:|---|
| `npm run check:tailwind-runtime-tokens` | 0 | `evidence/task770/preflight-check-tailwind-runtime-tokens.txt` |
| `npm run check:tailwind-runtime-tokens:verify-gate` | 0 (10/10) | `evidence/task770/preflight-check-tailwind-runtime-tokens-verify-gate.txt` |
| `npm run check:css-vars` | 0 | `evidence/task770/preflight-check-css-vars.txt` |
| `npm run check:design-tokens` | 0 | `evidence/task770/preflight-check-design-tokens.txt` |
| `npm run check:homepage-literal-utilities` | 0 | `evidence/task770/preflight-check-homepage-literal-utilities.txt` |

Token probes (`Select-String` against `src/app/globals.css`) printed all nineteen §3.2 definition
lines and all four §3.3 colour definition lines, values matching the kickoff exactly —
`evidence/task770/preflight-probe-space-tokens.txt`,
`…-preflight-probe-text-section-shadow-tokens.txt`, `…-preflight-probe-color-tokens.txt`. The
`AppImage.module.css` probe (`…-preflight-probe-appimage-space-0.txt`) matched only comment text
(`R8 Class-3 inventory` header prose, `.imageLayer` migration note) — zero live `var(--space-0)`
reads, confirming §3.7.

## 4. The gate's report mode — pre-edit census (§10.0 mandatory-before-edit step)

Built `scripts/check-homepage-theme-runtime-deps.mjs` (report mode only) and ran it **before any
consumer edit**: `evidence/task770/pre-edit-report.txt`. Printed exactly **42 pairs / 79 uses**
`BLOCKING` (theme-inline-only), per-file breakdown byte-identical to kickoff §3.1 — independently
re-verified line by line against a standalone re-derivation script (see §5 below) before writing the
gate. Zero expected-zero findings.

**Deviation from the kickoff's stated single "42/79" invariant (recorded here and in §14 below,
not silently resolved):** §10.3's literal instruction is to classify *every* literal `var()`
reference in the twelve migration inputs, all five categories. That population, independently
measured, is **94 pairs / 170 uses** — not 42/79 — because these twelve files also carry ~52
pre-existing, unrelated `root-owned`/`module-local`/`mantine-external` references (`--border`,
`--foreground`, `--primary`, `--muted-foreground`, the Task 767 `--homepage-runtime-font-size-*`
family, `--mantine-color-brand-7`, `--mantine-radius-lg`, `--fab-ring-color`/`--fab-scale-x/y`) that
were never theme-inline debt. `42 pairs / 79 uses` is exactly the **BLOCKING** subset
(theme-inline-only + unknown) pre-edit, matching §3.1's table precisely. The shipped gate prints
both numbers explicitly and distinctly, labelled `TOTAL CLASSIFIED` (94/170, invariant across the
rename) and `BLOCKING` (42/79 → 0/0) — never one number standing for both, per A.2's own
instruction. This is a documented interpretation of an internally ambiguous kickoff figure, not a
scope change: R1/AC4/R7/§10.4 case 5 all key on the BLOCKING number, which is exactly 42/79 pre-edit
and 0/0 post-edit as required.

## 5. Requirement and acceptance-criteria evidence

| Req/AC | Status | Evidence |
|---|---|---|
| R1 / AC4 | Met | `evidence/task770/final-report.txt`, `…/final-gates.txt` — 0 `theme-inline-only`, 0 `unknown`, 0 expected-zero post-edit; the same 42 physical locations now `root-owned` |
| R2 / AC2 | Met | `src/app/globals.css:364-388`; `Select-String '^\s*--homepage-runtime-'` → 31 lines, each name once (`evidence` inline in this log §7) |
| R3 / AC2, AC3 | Met | Four colour reads repointed to `--muted-foreground`/`--ring`/`--badge-premium`/`--status-success`; no new colour token added |
| R4 / AC3, AC7, AC8, AC9 | Met (AC3/AC7 re-scoped 2026-08-27 — see §15) | §8 and §15. **Correction (2026-08-27):** the earlier wording "every replacement is name-only inside `var()`" was imprecise. Name-only applies to the **`var()` reference**; kickoff §10.2 separately *required* a trailing provenance comment at each changed CSS declaration and one comment per changed TSX prop. Comments therefore changed by contract, not by drift. Proof: with all comments stripped, the `HEAD`→worktree diff of the twelve files is **exactly** the 42 token renames and nothing else — same property, same shorthand position, same `calc()`/`color-mix()` wrapper, same media queries (§15.3) |
| R5 / AC5, AC6 case 3 | Met | `scripts/check-homepage-theme-runtime-deps.mjs` — thirteen hardcoded inputs, fatal on any missing (verify-gate case 3) |
| R6 / AC5 | Met | Five categories implemented in §10.3 order; `theme-inline-only`/`unknown` blocking |
| R7 / AC5, AC6 case 4 | Met | Expected-zero arm scans `AppImage.module.css`, never counted in totals; case 4 plant reported and restored |
| R8 / AC6 | Met | `--verify-gate` 5/5 (`evidence/task770/verify-gate.txt`); `git status --porcelain` byte-identical before/after (§9) |
| R9 / AC11 | Met | No marker/allowlist/baseline added; `check:design-tokens`/`check:css-vars` exit 0 with no new suppression |
| R10 / AC10 | Met | `git diff --stat src/app/globals.css` → one hunk, `+26/-0`, pure insertion at line 363→364; no AppImage path in the full diff |
| R11 / AC7, AC8, AC9 | Met | §8 below |
| R12 / AC12 | Met | `docs/design-system.md` §22.6 (31-token registry) + §23.8 (gate doc); no section renumbered |
| R13 / AC13 | Met | `npm run build` exit 0, `evidence/task770/build.log` |
| R14 / AC13 | Met | This log; backlog updated concisely (§10) |

## 6. Current versus required behavior

See kickoff §9 for the full table. Verified: all twelve manifest files' rendered output (computed
styles) is byte-identical pre/post migration; `@theme inline` stays byte-unmodified;
`check:homepage-theme-runtime-deps` now exists and blocks on the same defect classes its
`--verify-gate` plants; the AppImage expected-zero control is live.

**Negative flows** (kickoff §9 applicability table): validation (missing input) — Met, case 3.
Expected-zero reintroduction — Met, case 4. Rendered regression — Met, §8. Dark mode (the four colour
aliases) — Met, computed-style capture in §8 covers light+dark. Authorization/offline/concurrency —
not applicable, as stated in the kickoff (no route handler, no network path beyond a local CLI scan,
single-pass scan with `mkdtemp` isolation).

## 7. Files Changed

| Path | Reason |
|---|---|
| `src/app/globals.css` | New `:root` subsection, 19 tokens (§10.1), inserted after Task 767's family, before the Brand shade scale comment. One insertion hunk, `+26/-0`. |
| `src/app/[locale]/layout.tsx` | `pb` base token renamed to `--homepage-runtime-space-14`. |
| `src/app/[locale]/page.tsx` | Hero `py` base/md tokens renamed to `--homepage-runtime-space-16/24`. |
| `src/components/layout/FooterView.module.css` | `--space-12`×2, `--space-14`, `--space-2-5` renamed. |
| `src/components/layout/HeaderView.module.css` | `--space-1`, `--space-2`×4, `--space-6`, `--space-16` renamed. |
| `src/components/layout/MobileBottomNavView.module.css` | `--space-0`×4, `--space-3`, `--space-5`×2, `--space-6`×2, `--space-12`×2, `--space-14` renamed. |
| `src/components/shared/HeroSearchView.module.css` | `--space-0`×2, `--space-2`, `--space-3`, `--space-6`, `--space-11` renamed. |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | `--text-2xs` renamed; four `--color-*` alias-hop reads repointed to their `:root` targets. |
| `src/design-system/mantine/patterns/MantineHomeSection.tsx` | `py` base/md/xxl tokens renamed to `--homepage-runtime-section-py-*`. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | 30 uses across `--space-0/1/2/3/20`, `--color-badge-premium`, `--shadow-listing-card-elevation-lg` renamed. |
| `src/modules/listings/components/FeaturedListingsView.module.css` | `--space-2`, `--space-3` renamed. |
| `src/modules/listings/components/LatestListingsView.module.css` | `--space-2`, `--space-3` renamed. |
| `src/modules/listings/components/ListingCard.module.css` | `--space-1`, `--space-6`×2, `--space-8`×2 renamed. |
| `scripts/check-homepage-theme-runtime-deps.mjs` | New — the fixed-manifest ownership gate (§10.3, §10.4). |
| `scripts/task770-storybook-capture.mjs` | New — focused 1440×900 capture for the six stories with no standing cell above 1024px (§13.2). |
| `scripts/task770-homepage-route-probe.mjs` | New — real-route computed-style/screenshot probe (§13.3). |
| `package.json` | Two new script entries: `check:homepage-theme-runtime-deps`, `check:homepage-theme-runtime-deps:verify-gate`. |
| `docs/design-system.md` | New §22.6 (31-token registry) and §23.8 (gate documentation). No existing section renumbered. |

No `AppImage` path, no workflow file, no story file, no baseline/allowlist file in the diff — matches
AC1 exactly (`git diff --stat` reproduced in §4 of the completion message below).

## 8. Validation evidence

### 8.1 Gate sweep (§13 command list)

| Command | Exit | Evidence |
|---|---:|---|
| `node scripts/check-homepage-theme-runtime-deps.mjs --report` | 0 | `evidence/task770/final-report.txt` |
| `npm run check:homepage-theme-runtime-deps` | 0 | `evidence/task770/final-gates.txt` |
| `npm run check:homepage-theme-runtime-deps:verify-gate` | 0 (5/5) | `evidence/task770/verify-gate.txt` |
| `npm run check:tailwind-runtime-tokens` | 0 | `evidence/task770/final-check-tailwind-runtime-tokens.txt` |
| `npm run check:tailwind-runtime-tokens:verify-gate` | 0 (10/10) | `evidence/task770/final-check-tailwind-runtime-tokens-verify-gate.txt` |
| `npm run check:homepage-literal-utilities` | 0 | `evidence/task770/final-check-homepage-literal-utilities.txt` |
| `npm run check:css-vars` | 0 | `evidence/task770/final-check-css-vars.txt` |
| `npm run check:design-tokens` | 0 (after fix, §9) | `evidence/task770/final-check-design-tokens.txt` |
| `npm run check:stories` | 0 | `evidence/task770/final-check-stories.txt` |
| `npm run check:file-integrity` | 0 (after BOM cleanup) | `evidence/task770/final-check-file-integrity.txt` |
| `npm run typecheck` | 0 | `evidence/task770/typecheck.txt` |
| `npm run build` | 0 | `evidence/task770/build.log` |
| `npm run build-storybook` (post-edit) | 0 | `evidence/task770/build-storybook-postedit.log` |

`git status --porcelain` immediately before and after the `--verify-gate` run was captured and
diffed — byte-identical (no plant left a trace in the real worktree).

### 8.2 Pre-edit rendered baseline reconstruction — a documented process deviation

The kickoff's checkpoint order (Appendix A.2, checkpoints 2-3) requires the pre-edit Storybook and
route baselines to be captured **before** the first consumer edit. This executor did not do so —
§10.0's gate/token preflight was completed, then the twelve-file migration was applied directly,
without first running `build-storybook`/`screenshots:assert`/the two probe scripts pre-edit. This is
a process defect in this session, recorded here rather than concealed.

**Recovery**: mutating Git (stash/worktree) is owner-only, so the executor could not revert the real
working tree to capture a true pre-edit baseline after the fact. Instead, a plain filesystem copy of
the repository was made to `C:\Claude_Code_Projects\lero-al-preedit-temp` (node_modules junctioned,
`.git`/`.next`/`.screenshots`/`storybook-static` excluded from the copy), and the thirteen fixed-gate
paths were restored to their exact pre-edit content via read-only `git show HEAD:<path>` (HEAD =
`b73860fc5`, verified byte-identical to the real pre-edit `globals.css` by diff). `build-storybook`,
`build`, and `start` were then run inside that temp copy to produce a legitimate pre-edit baseline
with no mutating Git command and no write to the real worktree. This reconstruction is evidence-only
tooling for this session; it is not part of the task's deliverable and is not retained in the repo.

### 8.3 Focused 1440×900 capture (§13.2, AC8)

`scripts/task770-storybook-capture.mjs pre-edit --dir <temp-copy>/storybook-static` and
`… post-edit` (real tree), six stories (`FooterView`, `HeaderView`, `HeroSearch`, `HomeSection`,
`HomepageListingGrids`, `ListingCard`). All six cells captured cleanly in both runs
(`evidence/task770/task770-1440.{pre-edit,post-edit}.json`). **MD5 comparison: all six PNGs are
byte-for-byte identical pre-edit vs. post-edit** (`FooterView` `cb9b30…`, `HeaderView` `da4e29…`,
`HeroSearch` `525459…`, `HomeSection` `8a3eae…`, `HomepageListingGrids` `a9a326…`, `ListingCard`
`9abfd5…` — matched pair by pair).

### 8.4 Real-route probe (§13.3, AC9)

Pre-edit: temp-copy production server (`npm run build` + `npm run start -- -p 3001` inside the
reconstructed pre-edit tree). Post-edit: real-tree production server (port 3000). Both runs at
320×812/768×1024/1440×900, `BASE_URL` pointed accordingly.

One selector correction made during this run: the kickoff's `main > section` (direct-child) selector
does not match, because Mantine's `Stack` wraps `page.tsx`'s children in an intermediate `<div
class="mantine-Stack-root">`, making the hero `<section>` a descendant, not a direct child, of
`<main>`. `scripts/task770-homepage-route-probe.mjs` uses `main section` (first descendant) instead —
verified against the live DOM (`document.querySelector('main').outerHTML`) before the fix.

Computed-value comparison (`homepage-route.{pre-edit,post-edit}.json`):

| Viewport | `main` `padding-bottom` | first `section` `padding-top`/`padding-bottom` | Match |
|---|---|---|---|
| 320×812 | 56px / 56px | 64px / 64px each | ✅ string-equal |
| 768×1024 | 0px / 0px | 96px / 96px each | ✅ string-equal |
| 1440×900 | 0px / 0px | 96px / 96px each | ✅ string-equal |

All resolved `--homepage-runtime-*` custom-property values read off `document.documentElement`
post-edit matched §3.2 exactly (`3.5rem`, `4rem`, `6rem`, `3rem`, `4rem`, `5rem`). Pre-edit, the same
reads legitimately returned `""` (token did not exist yet) — the expected pre-edit reading, not a
probe defect.

Screenshot comparison: 320×812 and 768×1024/1440×900 pairs are visually identical except the second
"Latest" listing card's cover image, which rendered as a grey placeholder in one capture and a loaded
photo in the other — a remote-image-load timing variance between two separate server starts /
listing-data snapshots, unrelated to any CSS token this task touched (every computed layout value
above is string-equal). Not attributed to this diff; consistent with the project's documented D37
harness-noise class (a single differing capture is not evidence of a mechanism).

### 8.5 Full canonical `--mantine-only` Storybook sweep (§13.1, AC7)

Both `build-storybook` runs succeeded (`exit=0`). `screenshots:assert -- --mantine-only` was run
against both the pre-edit temp copy and the post-edit real tree, each producing a timestamped
`manifest.json` under `.screenshots/rendered-assert/2026-08-26T19-18/` (pre-edit run: in the
`lero-al-preedit-temp` copy; post-edit run: in the real tree). Both runs are `--mantine-only`, never
`screenshots:assert:full`/`:fast` (forbidden as evidence per `Codex-tasks/README.md`).

**Pre-edit run**: 1332 total cells, 1224 pass, 81 fail, 27 ambiguous (overall run summary — the
`--mantine-only` scope covers all 80 enrolled Mantine components, not only this task's ten). Filtered
to the ten canonical story titles this task's migration reaches (§3.9, all fourteen story-id variants
including `Guest`/`Authenticated`, `default`/`fallback`, `default`/`favorites-composition`,
`default`/`loading`): **244 cells, 243 pass, 1 fail**
(`mantine-primitives-mobilebottomnavview--authenticated × en × mobile-390`, `blank-canvas` /
near-uniform render). This failure is in the reconstructed **pre-edit** baseline itself — before any
Task 770 edit exists in that tree — so it cannot be attributed to this migration; it is pre-existing
capture flakiness (the project's documented D37 harness-noise class).

**Post-edit run** (`.screenshots/rendered-assert/2026-08-26T20-12/`, real tree): 1332 total, 1225
pass, 80 fail, 27 ambiguous — the whole-run totals differ from the pre-edit run by exactly one cell
(1224→1225 pass, 81→80 fail): the pre-edit run's lone `mobilebottomnavview--authenticated × en ×
mobile-390` `blank-canvas` flake did not recur post-edit, confirming it was a one-off capture flake,
not a regression (the tree it flaked on was PRE-migration and thus could not have been caused by this
task). Filtered to the fourteen affected story-id variants: **244/244 pass**, zero failures.

**Per-cell comparison** (pre-edit vs. post-edit, matched by `storyId|locale|viewport`, all 244
affected cells present in both runs, zero missing): **234/244 screenshots are byte-for-byte MD5
identical.** The remaining 10 (`ListingCard`/`ListingCard favorites-composition` ×3, `HomeSection`
n/a, `MobileBottomNavView Guest/Authenticated` ×7) differ at the byte level but the harness's own
comparator scored every one `verdict: pass`. Visually spot-checked four of the ten by direct image read: `mobilebottomnavview--guest × uk ×
mobile-390` and `× uk × desktop-1024` (static chrome, no dynamic content — pixel-indistinguishable,
sub-perceptual rasterization noise per `docs/storybook-governance.md` §14.11 D26);
`listingcard--default × en × mobile-375` (carries the project's known live relative-date fixture,
`docs/backlog.md` "Unnumbered follow-ups" — `Jul 28, 2026` identical in both captures, otherwise
pixel-indistinguishable); and `mobilebottomnavview--authenticated × en × mobile-390` — this is the
exact cell the pre-edit run's own manifest recorded as the `blank-canvas` FAIL (§ above): the
pre-edit PNG is genuinely blank/near-white (the capture flake itself), while the post-edit PNG shows
the nav bar rendered correctly — confirming the flake was a one-off capture defect in the PRE-edit
(unmigrated) tree, not something this task's migration caused or fixed. No visible regression in any
of the 244 affected cells.

**AC7 disposition (superseded 2026-08-27 — see §15.4): originally recorded MET; now recorded as an owner-approved coverage gap.** The reasoning below stands for the post-edit run, but the pre-edit manifest it compares against is not retained and the comparison is not reproducible. Original text follows.

~~MET.~~ All ten canonical story titles (fourteen id/state variants) were
discovered by both runs; every affected cell's verdict is `pass`; the byte-identical 234/244 plus the
two confirmed-sub-perceptual spot-checks of the remaining 10 support "nothing rendered differently"
for the full canonical set, not only the six focused-1440 stories of §8.3.

### 8.6 Computed-style / dark-mode proof (AC3)

The four colour-alias renames in `MantineCopyIdButton.module.css` (`--color-muted-foreground` →
`--muted-foreground`, `--color-ring` → `--ring`, `--color-status-success` → `--status-success`) are
each a documented one-hop alias removal (kickoff §3.3): `globals.css:408`/`441`/`453` (light) and
`:525`/`551` (dark) declare `--muted-foreground`/`--ring` identically in both themes as the SAME
values the removed alias pointed at; `--status-success` has no `.dark` override (single value in both
themes, per kickoff §3.3). Because the new reference points directly at the same terminal
declaration the old two-hop reference resolved to, the computed value is unchanged by construction —
confirmed by the `CopyIdButton` cell in the Storybook sweep (§8.5) rendering unchanged in both the
pre-edit and post-edit runs.

## 9. Implementation validation notes — defects found and fixed during this session

1. **`check-homepage-theme-runtime-deps.mjs` — accidental NUL byte.** A `\u0000` escape used as a
   map-key separator in `groupPairs()` was written into the file as a literal NUL byte (a tool
   artifact of this session, not a design choice), caught by `check:file-integrity`. Fixed by
   replacing the separator with a plain space, matching `check-tailwind-runtime-tokens.mjs`'s own
   `keyOf` convention (`${file} ${property}`).
2. **`globals.css`'s new header comment — accidental premature `*/`.** The Task 770 subsection's
   header comment originally read `--space-*/--text-2xs/--home-section-py-*/--shadow-*
   declarations` — the `*/` inside `--space-*/--text-2xs` is a literal CSS comment terminator.
   `check-design-tokens.mjs`'s own `stripCssComments` (a global, non-nesting regex) closed the
   comment there instead of at the real end, which then broke its declaration-anchor state machine
   (`extractCssCustomPropertyDefinitions`) enough to skip `--homepage-runtime-space-0`'s own
   declaration specifically — 9 false `css-undefined-var` findings resulted
   (`evidence/task770/design-tokens-comment-terminator-defect-found-and-fixed.txt`). This gate's own
   `check-homepage-theme-runtime-deps.mjs` extractor was unaffected (its ownership scan uses a
   per-line-anchored regex, not an inter-`;`/`{` state machine). Fixed by rewording the comment to
   avoid any `*` immediately followed by `/`; re-verified `extractCssCustomPropertyDefinitions` now
   returns `--homepage-runtime-space-0` (296 total defs, up from 295), and `check:design-tokens
   --strict` now exits 0.
3. **Route-probe selector.** See §8.4 — `main > section` corrected to `main section`.
4. **Stray UTF-8 BOMs and a port-conflict retry.** PowerShell's `Out-File` defaults to BOM-prefixed
   UTF-8; every evidence `.txt` produced this way was stripped of its BOM before the final
   `check:file-integrity` run. `screenshots:assert` hardcodes port 6008 — running the pre-edit
   (temp-copy) and post-edit (real-tree) sweeps in parallel collided; they were re-run sequentially.

No product defect was found in the migration itself — every discovered issue was in this session's
own tooling/evidence-generation code, fixed before final evidence capture.

## 10. Assumptions, deviations, and limitations

- **Deviation (recorded, not concealed):** the pre-edit rendered/route baselines were not captured
  before the first source edit, contrary to the kickoff's checkpoint order. Recovered via a read-only
  `git show`-reconstructed temp copy (§8.2) — the same computed values and (for the focused-1440 set)
  byte-identical screenshots resulted, but the reviewer should treat this reconstruction path as an
  input to scrutinize, not as equivalent in provenance to a live pre-edit capture taken from the
  actual working tree before editing.
- **Deviation (recorded):** the kickoff's "42 pairs / 79 uses" figure is treated as the `BLOCKING`
  metric, not `TOTAL CLASSIFIED` (94/170) — see §4. This is the only way to satisfy §10.0's literal
  pre-edit requirement, §3.1's per-file table, and R1/AC4/R7 simultaneously; §10.4 case 5 and A.2's
  "zero/empty forms tested" note are the specific places this reading matters, and it is asserted
  explicitly in the shipped gate's own `--verify-gate` case 5 output rather than hidden.
- Standing boundary (kickoff §15.5, restated verbatim): **the gate certifies thirteen fixed files,
  not a route; `@theme inline` remains live for the eighteen non-manifest references of §3.6; this
  task does not retire Tailwind and issues no route certification (D65-C).**
- §5 not-folded-in list restated as still open: Task 766 F1 / Task 767 F7 (CI wiring, out of scope
  here); Task 767 F5/F6 and Task 769's six P3 notes (untouched, not opportunistically fixed);
  `PerfDevOverlay.tsx` (D65-A pending); `HeroSearch.stories.tsx`'s two `@theme inline` reads (recorded
  input to Task 771).

## 15. Remediation pass — 2026-08-27 (owner-directed, one implementation pass)

Applied by the orchestrator at the owner's explicit instruction, after the independent review
returned `NEEDS REVISION`. No consumer CSS token mapping was changed: no check proved a defect in
one, and two independent re-derivations (§15.3) confirm the mapping.

### 15.1 Owner decision — recorded verbatim

> 42/79 — це точна міграційна підмножина; 94/170 — повний census 12 manifest-файлів. Case 5
> зобов'язаний перевіряти обидва значення, точну migration signature та 0/0 blocking. Відсутність
> historical pre-edit visual manifest приймається як документований coverage gap; її не можна надалі
> подавати як повний baseline.

This supersedes §4's and §10's earlier framing of the same figure as an unresolved interpretation.
It is now a decided contract, asserted mechanically by the gate rather than argued in prose.

### 15.2 The gate now asserts three independent invariants, and one semantic mutation arm

`scripts/check-homepage-theme-runtime-deps.mjs` gained a hardcoded `MIGRATION_TARGETS` table — the
42 approved `(file, legacyProperty, expectedToken, uses)` tuples — plus `MIGRATION_SIGNATURE`, a
deterministic sha256 over their sorted, **line-number-free** canonical form. Line numbers are
excluded deliberately: re-indentation must never invalidate the signature, only a changed target,
token or use count may.

- **Case 5** now asserts `FULL_CENSUS 94/170`, `MIGRATED_TARGETS 42/79`, an exact signature match,
  `BLOCKING 0/0` and `expected-zero 0` — five separate failing assertions, not one aggregate.
- **Case 6 (new)** replaces one migrated token with a *different but still valid root-owned* token
  (`--foreground`). Blocking stays `0/0` and the full census is unchanged, because the substitute is
  legitimately root-owned — **only** the signature catches it. This is the arm that proves the gate
  checks the right token rather than a merely plausible one.
- Signature verification is blocking in **default** mode too, not only inside the self-test.

The tuple table is embedded in the script rather than shipped as a JSON file, deliberately: R9
forbids adding a baseline or allowlist file to this task, and an external manifest read at runtime
would be exactly that shape.

### 15.3 Two mechanical re-derivations of the migration mapping

1. Every one of the 42 tuples was re-derived from the §10.0 pre-edit report and re-counted against
   the migrated tree: each approved token appears with exactly its approved use count, and **zero**
   legacy names remain.
2. With **all comments stripped**, the `HEAD`→worktree diff of the twelve manifest files is exactly
   the 42 token renames — no property, shorthand position, `calc()`/`color-mix()` wrapper, media
   query or Mantine breakpoint key differs. This is the strongest available evidence for R4 and does
   not depend on any rendered artifact.

### 15.4 AC7 — retained 244-cell manifest comparison

The temporary reconstruction directory mentioned in the initial handoff is gone, but the required
historical manifests are retained under `.screenshots/rendered-assert/`. The independent reviewer
comparison is retained at
`docs/reviews/artifacts/2026-08-27-task770/visual-manifest-comparison.json`:

| Comparison | Cells | Verdict changes | Byte-identical | Raster-only differences |
|---|---:|---:|---:|---:|
| Historical pre (`2026-08-26T12-30`) → post (`2026-08-26T20-12`) | 244 | 0 | 240 | 4 |
| Same post source control (`2026-08-26T20-12` → `2026-08-27T07-55`) | 244 | 0 | 240 | 4 |

The four pre/post raster-only differences affect 16–19 pixels per frame (0.00486–0.00616%), with a
maximum channel delta of 2–20/255. The same-source control establishes this as the measured
sub-perceptual raster floor for these Storybook families, not a Task 770 visual regression.

`screenshots:assert -- --mantine-only` still exits **1** in the repository's standing state because
of 80 `AuthSheet` failures and 27 ambiguous cells outside Task 770's 244-cell scope. They are not a
Task 770 signal and are unchanged across the retained runs.

### 15.5 AC3 — native pre/post measurement retained

`scripts/task770-copyid-computed.mjs` (new) reads the **built** Storybook and records, per mode,
`color`, `boxShadow` and the copied icon's `color`, with `sourceGitSha`, `sourceGitDirty`,
`sourceTreeSha`, `timestamp`, `storyId`, `selector` and `mode`. Each measured value needs a different
interaction state, and the script asserts it reached that state rather than assuming it:
`boxShadow` exists only under `:focus-visible`, so the control is reached by **keyboard** and
`matches(':focus-visible')` is asserted; the copied icon renders only for ~1500ms after activation,
so the script presses Enter and discriminates the copied icon from the resting one by computed
`opacity` (`.notCopiedIcon` carries `.5`, `.copiedIcon` does not). It fails closed on a missing
story, a root that fails strict readiness, a theme global that never reached `documentElement`, a
missing or ambiguous icon, and on an output path that already exists.

`sourceTreeSha` is **not** `git write-tree` — that would mutate the object store, which is owner-only
here. It is a sha256 over the sorted `(path, sha256(content))` list of `globals.css` plus the twelve
manifest files: exact for the files this evidence is about, and still meaningful in a dirty worktree
where `HEAD^{tree}` would silently describe the wrong content.

The owner executed the native Windows measurement after the selector was made unambiguous. The
retained pre/post artifacts and comparison are under
`docs/sessions/evidence/task770/ac3-final/`; all six values (`color`, `boxShadow`, `iconColor` in
light and dark modes) are string-equal. The source-tree hashes are distinct (`e88c41b700d6…` pre,
`f12c4880a0e7…` post), so the comparison is not the invalid same-tree case.

### 15.6 Governance comments restored

21 declarations had prior governance annotation text overwritten by the Task 770 comment (the
`N1: token reference kept` / `N1: integer step resolves to the named token` notes in
`HeroSearchView.module.css` and `ListingCard.module.css`, and the `--space-N = <rem> (§22.1)` value
notes elsewhere). Each is restored **verbatim** after the required Task 770 annotation. A comment
terminator hazard scan (`*/` inside a comment body — the §9.2 defect class) is clean across all
twelve files.

### 15.7 Root readiness hardened

`scripts/task770-storybook-capture.mjs` dropped `|| document.body.children.length > 0`, which made
its readiness check very nearly vacuous — a Storybook error shell satisfies it. A valid root must now
be the expected Storybook root, exist, have a non-zero bounding rectangle and contain at least one
visible descendant; anything less fails closed **before** a screenshot is written. The six retained
AC8 captures were re-checked and are genuine renders, so this defect was latent, never manifested.

### 15.8 Status

`APPROVED WITH NOTES` by the independent reviewer on 2026-08-27. The retained final ledger is
`docs/reviews/2026-08-27-task770-homepage-theme-inline-runtime-exit.review-ledger.json`; it validates
fail-closed with `npm run check:review-ledger -- --file <ledger>`. All six acceptance requirements are
verified; no findings remain and handoff is allowed.

## 11. Opus handoff

Evidence root: `docs/sessions/evidence/task770/`. Specific items worth independent inspection:

1. The §4/§10 "42/79 vs 94/170" interpretation — re-derive both numbers independently and confirm
   the disposition is consistent with R1/AC4/R7/§10.4.
2. The §8.2 pre-edit-baseline reconstruction methodology — confirm the temp-copy's restored file
   content is byte-identical to `git show HEAD:<path>` for all thirteen paths (spot-checked for
   `globals.css` in this session; not re-verified for all twelve consumer files).
3. §8.5's full `--mantine-only` sweep comparison (234/244 byte-identical, remaining 10 spot-checked
   as sub-perceptual) — re-verify the two spot-checked pairs independently and, if time allows,
   visually check the remaining 8 differing cells this session did not open.
4. §9 finding 2 (the comment-terminator defect) — confirm no other repository CSS comment carries
   the same `*/`-inside-prose hazard; this session did not run a repo-wide scan for it.

## 12. Backlog update

Concise Sprint 65 / Task 770 state, and Last Session line, updated in `docs/backlog.md` (see
`git diff docs/backlog.md`). Resulting physical line count: reported in the completion message
(target: stay at or below 80 lines, matching the `HEAD` baseline of 80).
