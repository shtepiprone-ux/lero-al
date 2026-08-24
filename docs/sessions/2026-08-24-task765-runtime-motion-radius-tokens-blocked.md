# Task 765 — Runtime motion/radius tokens, `AppImage.module.css` migration

**Status: `BLOCKED`.** Requirements R1–R8 and R9's P1/P2 arms are implemented and evidenced clean.
R9's P3 arm cannot be produced as specified — a measured, structural defect in the kickoff's §3.3
claim about `check:css-vars`'s "prefix arm", not an implementation gap. Per A3's own escape hatch
("If the observed failure cannot be attributed to either the ownership arm or the prefix arm, the
plant proved nothing — report `BLOCKED` rather than substituting a different mutation"), no
alternative mutation was substituted. The source edit (§9.2) is applied, verified byte-identical at
render, and left in the repository in its clean post-edit state — nothing is reverted except the
three plants and the reversible fixture probe.

## 1. I0 — start-state

- `git status --porcelain` at session start: empty (worktree clean).
- `git rev-parse HEAD` at session start: `5372e08a5` (task's own filed-against revision). An owner
  commit (`d2dd47ad7`, docs-only — Sprint 64 plan + Task 765 kickoff + `docs/backlog.md`) landed
  mid-session on top of it; no `src/` file was touched by that commit. Re-verified via `git show
  --stat d2dd47ad7`.
- Platform: `docs/sessions/evidence/task765/platform-attestation.txt` — `EXECUTION_PLATFORM=win32`,
  `NODE_VERSION=v22.22.3`, native PowerShell, `EXIT_CODE=0`.

## 2. Requirement / acceptance-criteria evidence

| Req | AC | Status | Evidence |
|---|---|---|---|
| R1 | AC1 | ✅ | `globals.css` `:root` (opens `:327`) gained the 7 named declarations verbatim — diff below. |
| R2 | AC2 | ✅ | `@theme inline`'s 6 `--duration-*`/`--ease-*` entries now read `var(--motion-*)` — diff below. |
| R3 | AC3 | ✅ | `AppImage.module.css` — exactly 3 declarations changed (`.frameCircle` border-radius, `.fade` transition-duration/timing-function); no other declaration touched. |
| R4 | AC4 | ✅ | `git diff` contains no `design-tokens-allow` marker; `scripts/design-tokens-allowlist.json` untouched (`git diff --stat` confirms 0 changes to that path throughout the session). |
| R5 | AC5 | ✅ | 111/111 captured image cells (listing, listing-thumb, avatar) string-equal baseline↔post on `containerComputed.borderRadius`, `imgState.transitionDuration`, `imgState.transitionTimingFunction`. 0 mismatches. `docs/sessions/evidence/task765/phase3/comparison-result.json`. |
| R6 | AC6 | ✅ | `check:design-tokens` exit 0, clean post-edit and again after full revert (`phase3-check-design-tokens.txt`, `phase5-final-check-design-tokens.txt`). |
| R7 | AC7 | ✅ | `check:css-vars` exit 0, run after a build, clean post-edit and again after full revert (`phase3-check-css-vars.txt`, `phase5-final-check-css-vars.txt`). |
| R8 | AC8 | ✅ | `typecheck`/`build`/`build-storybook`/`check:stories` all exit 0, both immediately post-edit and again as the final clean re-run (`phase3-*`, `phase5-final-*`). |
| R9 | AC9 | ❌ **BLOCKED** | P1 and P2 both genuinely fail with their named category and are reverted (proof below). P3 does not fail as specified — see §4. |
| R10 | AC10 | ✅ | Every retained transcript in `docs/sessions/evidence/task765/` carries the 5-line native header + real `EXIT_CODE`. |

## 3. Current vs. required behaviour

| Behaviour | Before | After (measured) |
|---|---|---|
| `avatar` computed `border-radius` | `3.35544e+07px` (Chromium's Blink `LayoutUnit` clamp of the `3.40282e38px` literal — see §5 A1) | **Identical**: `3.35544e+07px`, now via `var(--radius-pill)` |
| non-`priority` image computed `transition-duration` | `0.3s` | **Identical**: `0.3s`, now via `var(--motion-duration-slow)` |
| same rule's computed easing | `cubic-bezier(0.4, 0, 0.2, 1)` | **Identical**, now via `var(--motion-ease-standard)` |
| `check:design-tokens --strict` | exit 1, 2 findings (`css-length` `:126`, `css-duration` `:160`) | exit 0, 0 findings |
| `check:css-vars` | exit 0 | exit 0, unchanged |
| Tailwind utilities from `--duration-*`/`--ease-*` | generated from literals | generated through the `var(--motion-*)` aliases — build succeeded (N1, negative flow) |

Negative flows: N1 (Tailwind utility generation through the alias) — `npm run build` succeeded both
post-edit and final, no webpack/PostCSS error once the comment-terminator defect (§6) was fixed. N3
(`prefers-reduced-motion`) — untouched, no media guard in the diff. N4 (`priority` image, no `.fade`)
— untouched, `.fade` only gained `var()` references. N5 (dark theme) — untouched, no `.dark` rule
touches any of the 7 new names.

## 4. R9/AC9 — the P3 finding (why this task is `BLOCKED`)

**Measured, not assumed.** `scripts/check-css-var-resolvability.mjs`'s own header comment
(lines 26–32) states the scope of what it calls the "prefix arm" precisely: it is the resolution
rule for **dynamically-constructed** variable names — `var(--<prefix>${…})` template-literal sites
in `.tsx`/`.ts` files, found by `findDynamicVarSites` (`:351-360`, regex `var\(\s*--([\w-]*)\$\{`).
That function is only ever invoked under `if (!isCss)` (`:528`), i.e. **never for `.css` files**.

A static, literal `var(--motion-duration-slow)` reference — the actual shape of P3's plant, in both
`AppImage.module.css:159` and `globals.css`'s `@theme inline` alias — is a "literal (static)
reference" per `findVarReferences` (`:317-344`), which both arms run through the SAME
`classifyReferences` function. Its first line, `:468`, is `if (!ownedSet.has(ref.name)) continue;`
— an unowned static reference is skipped unconditionally, on **both** Arm A and Arm B, regardless
of whether a sibling name sharing its `--motion-duration-` prefix is still owned. There is no code
path in this script that reports a static CSS `var()` reference as a violation merely because a
sibling shares its prefix — that logic exists only for the dynamic-template case, which does not
apply to CSS files at all.

**Reproduced natively, twice** (once from a fresh state, once after the full P1/P2/fixture-probe
cycle had already exercised the harness): removing only `--motion-duration-slow` from `:root`
(leaving `--motion-duration-fast`/`--motion-duration-base` in place), rebuilding
(`phase4-p3-build.txt`, exit 0 — the build itself does not fail on a dangling CSS custom property,
confirming the freshness-trap warning in §3.3 is real and orthogonal to this finding), then running
`check:css-vars` (`phase4-p3-plant.txt`):

```
🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): 263
    Arm A (shipped CSS) — owned names referenced: 83
    Arm B (src/**/*.{css,tsx,ts}, excl. globals.css) — owned names referenced: 66
    Dynamic var() construction sites: 8 raw, 0 in-class (prefix could name an owned token)
✅  check:css-vars — 0 violations, 0 in-class dynamic sites.
EXIT_CODE=0
```

`263` (down from `264`) confirms the removal registered in the live-computed owned set; `0
violations` confirms neither arm reported the now-dangling reference in either `AppImage.module.css`
or `globals.css`'s own alias.

**A3 answer:** neither arm reported P3. The ownership arm structurally cannot (it skips unowned
names by design, `:468`); the "prefix arm" structurally cannot (it only exists for `.tsx`/`.ts`
dynamic-template sites, never `.css` static references). Per A3's routing rule quoted in the kickoff
and restated in its own quality-gate table ("A1, A2 and A3 all fail to `BLOCKED`, never to a second
route"), no substitute mutation was attempted. This contradicts the kickoff's §3.3 claim and the
`docs/backlog.md` Sprint 64 line's identical parenthetical about the "prefix arm" — both describe a
mechanism that does not exist for this input shape.

P3 was reverted immediately after this one measurement; the revert diff is byte-identical to the
pre-plant clean-post-edit diff (`diff` exit 0 between `phase4/clean-post-edit.diff` and the
post-revert re-capture — see §6).

## 5. A1/A2 answers

**A1 (float round-trip).** The specified literal `3.40282e38px` does **not** survive
`getComputedStyle` unchanged in either state — Chromium (Blink) internally clamps a `border-radius`
this large to its `LayoutUnit` maximum (~2²⁵, printed as `3.35544e+07px`) at layout time, for both a
raw literal and a `var()`-resolved value alike. Both are the SAME clamped output, measured
byte-identical across baseline and post at all 111 captured cells (0 mismatches) — so AC5's actual
requirement (byte-equal computed values, not equal-to-the-source-literal) is met. Full baseline/post
values: `docs/sessions/evidence/task765/phase3/comparison-result.json`.

**A2 (alias vs. utility generation).** `npm run build` succeeded (`phase3-build.txt`,
`phase5-final-build.txt`, both `EXIT_CODE=0`) with `--duration-*`/`--ease-*` aliased to
`var(--motion-*)` inside `@theme inline`. Not separately diffed at the compiled-CSS-utility level
beyond the successful build and the byte-identical rendered capture (§9.3's own AC5 comparison is
the direct evidence that whatever Tailwind emitted did not change the rendered `.fade`/`.frameCircle`
result — N1 in §3 covers this as the negative flow).

## 6. Full command log

All commands run in native Windows PowerShell (`docs/sessions/evidence/task765/*.txt`, each with the
5-line header and a real `EXIT_CODE`):

| Phase | Command | Result |
|---|---|---|
| Platform | `node.exe -p process.platform` | `win32`, EXIT_CODE=0 |
| 1 | `npm.cmd run build-storybook` | EXIT_CODE=0 |
| 1 | `node.exe docs/sessions/evidence/task765/capture-appimage-styles.mjs baseline phase1` | EXIT_CODE=0 |
| 2 | (edit) `src/app/globals.css`, `src/components/ui/AppImage.module.css` | — |
| 3 | `npm.cmd run typecheck` | EXIT_CODE=0 |
| 3 | `npm.cmd run build` — **first attempt** | **EXIT_CODE=1**, `Unknown word` PostCSS syntax error at `globals.css:329:74` — the new `:root` comment's `--duration-*/--ease-*` text contained a literal `*/` (block-comment terminator), closing the comment early. Fixed by inserting spaces (`--duration-* / --ease-*`); not a scope change, no declaration touched. |
| 3 | `npm.cmd run build` — **after fix** | EXIT_CODE=0 |
| 3 | `npm.cmd run build-storybook` | EXIT_CODE=0 |
| 3 | `node.exe docs/sessions/evidence/task765/capture-appimage-styles.mjs post phase3` | EXIT_CODE=0 |
| 3 | `npm.cmd run check:stories` | EXIT_CODE=0 |
| 3 | `npm.cmd run check:design-tokens` | EXIT_CODE=0 |
| 3 | `npm.cmd run check:css-vars` | EXIT_CODE=0 |
| 4/P1 | plant literal `300ms` in `.fade`; `npm.cmd run check:design-tokens` | **EXIT_CODE=1**, `[css-duration] "transition-duration: 300ms"` at `:158`. Reverted. |
| 4/P2 | plant literal `3.40282e38px` in `.frameCircle`; `npm.cmd run check:design-tokens` | **EXIT_CODE=1**, `[css-length] "border-radius: 3.40282e38px"` at `:124`. Reverted. |
| 4/P3 | remove `--motion-duration-slow` from `:root`; `npm.cmd run build` | EXIT_CODE=0 (build does not fail on a dangling custom property — confirms the freshness-trap warning is real) |
| 4/P3 | `npm.cmd run check:css-vars` | **EXIT_CODE=0, 0 violations — does not fail.** See §4. Reverted. |
| 5 | `npm.cmd run typecheck` | EXIT_CODE=0 |
| 5 | `npm.cmd run build` | EXIT_CODE=0 |
| 5 | `npm.cmd run build-storybook` | EXIT_CODE=0 |
| 5 | `npm.cmd run check:stories` | EXIT_CODE=0 |
| 5 | `npm.cmd run check:design-tokens` | EXIT_CODE=0 |
| 5 | `npm.cmd run check:css-vars` | EXIT_CODE=0 |
| 5 | `npm.cmd run check:mojibake` | EXIT_CODE=0 |

**Revert proof:** `git diff src/app/globals.css src/components/ui/AppImage.module.css` after the
final revert is byte-identical to `docs/sessions/evidence/task765/phase4/clean-post-edit.diff`
(captured immediately after Phase 3, before any plant) — `diff` between the two exits 0.

## 7. Visual source trace (avatar variant — new coverage)

| Visible artifact | Component/markup | Class/selector | Token path | Change | Evidence |
|---|---|---|---|---|---|
| Circular avatar corner radius | `AppImage` container `<div>` (variant `avatar`) | `.frameCircle` (`AppImage.module.css:123-125`) | literal → `var(--radius-pill)` (`globals.css:333`) | Changed (provenance only) | `phase3/comparison-result.json`, 0 mismatches |
| Non-priority image fade-in duration/easing | `AppImage`'s `<img>` | `.fade` (`AppImage.module.css:152-159`) | literal → `var(--motion-duration-slow)`/`var(--motion-ease-standard)` | Changed (provenance only) | same |

**Preserved siblings (out of scope, confirmed untouched):** `appImageConfig.ts` (no edit — `git diff
--stat` confirms), `listing`/`listing-thumb`/`gallery-*`/`lightbox`/`preview`/`upload` variants
(same `.fade` rule, covered by the existing `listing`/`listing-thumb` capture cells, also 0
mismatches), Task 764's `MantineListingCardPattern.module.css` scope (frozen, untouched — confirmed
via `git diff --stat`).

## 8. Canonical UI decision record — the `avatar` variant capture probe

No new production UI was created. The only production consumer of `variant="avatar"` is
`AdminCompaniesManager.tsx:283`, already covered by an existing, real production story
(`Admin/AdminCompaniesManager` `Default`, `src/components/admin/AdminCompaniesManager.stories.tsx`).
That story's fixture (`FIXTURE_COMPANIES`, `src/stories/fixtures/admin.fixtures.ts`) ships
`logo_url: null` for all three rows, so no `<img>` (and no `.frameCircle`/`.fade` pair) ever renders
in that story as authored — confirmed by reading `AppImage.tsx:76` (`hasImage = Boolean(src)`).

Per the execute-task skill's reversible-probe protocol: `FIXTURE_COMPANIES[0].logo_url` was
temporarily set to `https://res.cloudinary.com/demo/image/upload/sample.jpg` (the same
`res.cloudinary.com/demo` pattern already used by `src/stories/fixtures/listing.fixture.ts:52`),
solely to exercise the existing story's real `<AppImage variant="avatar">` render for measurement.
Confirmed single consumer via repo-wide grep (`FIXTURE_COMPANIES` used only in
`admin.fixtures.ts`/`AdminCompaniesManager.stories.tsx` — no vitest test imports it).

- Pre-edit hash: `git hash-object src/stories/fixtures/admin.fixtures.ts` = `03c4f43f2b7d8c42090d69362b9f305dc08162d7`.
- Post-revert hash: identical, `03c4f43f2b7d8c42090d69362b9f305dc08162d7` — verified after the final
  gate run.
- `git status --porcelain src/stories/fixtures/admin.fixtures.ts` after revert: empty.

No permanent story/fixture change; no catalog/coverage registration required (no new canonical
primitive, pattern, or story was added — an existing production story was used as-is).

## 9. Files changed (final diff — after all plants reverted)

| Path | Reason |
|---|---|
| `src/app/globals.css` | R1/R2 — 7 new `:root` runtime tokens; `@theme inline`'s 6 `--duration-*`/`--ease-*` entries converted to `var(--motion-*)` aliases. |
| `src/components/ui/AppImage.module.css` | R3 — `.frameCircle`'s `border-radius` and `.fade`'s `transition-duration`/`transition-timing-function` now read the runtime tokens; stale explanatory comments updated to match (no declaration beyond the 3 named ones changed). |
| `docs/sessions/evidence/task765/**` | New — capture fixture, baseline/post captures, all gate/plant transcripts, this session's supporting artifacts. |

`src/stories/fixtures/admin.fixtures.ts` — touched during Phase 1/3 captures, byte-identical to its
pre-task state at session close (hash-verified, §8). Not in the final diff.

## 10. Assumptions, deviations, limitations

- **Deviation from §9.1's literal instruction** ("add a story that renders the avatar variant"): no
  new Storybook story was added. The existing `Admin/AdminCompaniesManager` `Default` story already
  renders the real production `variant="avatar"` consumer; only its fixture data needed a temporary,
  reversible probe to populate `logo_url` so the `<img>` actually mounts. This satisfies the
  underlying intent (render the avatar variant for capture) via the skill's reversible-probe
  protocol rather than the skill's disfavored "add permanent story markup" path, since a
  suitable canonical story already existed.
- **Deviation from §9.4's literal instruction** ("re-run the full §9.3 gate set clean" after the
  last revert, implying all three plants succeeded first): P3 did not produce the required failure.
  §9.3's gate set was still re-run clean after the full revert (§6, Phase 5) as positive evidence
  that the implementation itself is sound; this does not close AC9.
- **No commit created.** Per project git policy, mutating git is owner-only; this handoff includes
  no commit/push instruction pending Opus review of the `BLOCKED` disposition and a decision on how
  to construct a P3 that the actual `check:css-vars` mechanism can detect (or whether AC9's P3 arm
  needs a different gate, a different mutation shape reachable by the existing dynamic-site
  mechanism, or a kickoff correction).

## 11. Opus handoff — questions for review

1. Does the R1–R8 implementation (source diff in §9, byte-identical render proof in §3/§5) stand on
   its own merit independent of AC9/P3, or does AC9's P0 status block the entire task regardless?
2. §4's `check-css-var-resolvability.mjs` finding — the "prefix arm" only covers dynamic
   `.tsx`/`.ts` template-construction sites, never static `.css` `var()` references — is itself a
   possibly-reportable gate gap (a single-token deletion leaving a dangling reference in a CSS
   Module is invisible to this gate, mirroring the shape of the already-tracked Task 743 finding
   about deletion-based un-ownership, but for a *sibling-preserved* deletion rather than a
   *last-reference* deletion). Worth its own backlog entry?
3. If AC9/P3 is re-scoped (e.g., to a `.tsx`/`.ts` dynamic-construction-site mutation, which the
   actual prefix arm can detect), does that satisfy D63-F's intent, or does the acceptance criterion
   need to target a different file/shape entirely to test the CSS-Module deletion case §3.3
   described?

## 12. Backlog update

See `docs/backlog.md` Sprint 64 line — updated to record 765 `BLOCKED` on AC9/P3, R1–R8 clean.
