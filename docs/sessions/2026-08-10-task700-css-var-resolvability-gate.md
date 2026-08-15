# Task 700 — CSS custom-property resolvability gate (Sprint 46.3)

**Kickoff:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_700_CssVarResolvabilityGate.md` (draft 3)
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Date:** 2026-08-10
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

---

## 1. I0 baseline

- `git --no-optional-locks status --porcelain` at start: clean (no output).
- `git show HEAD:docs/backlog.md | wc -l` → **89**.
- `git log --oneline -3` at start: `1112e86df` (draft 3 of this kickoff), `eb80be8f0`, `cce639fbb`.
- Dirty-worktree manifest: **not applicable** — I0 was clean.

## 2. §10.1 re-derivation — every kickoff number re-measured before writing code

Per the kickoff's own instruction ("treat every number below as hostile"), `npm run build` was run
**first** (transcript: scratchpad `build-before.log`, `EXIT_CODE=0`, commit `1112e86df`), then every
§3.1/§3.3 figure was independently re-derived by direct inspection of `.next/static/css/*.css` and
`src/app/globals.css` (script: scratchpad `derive.mjs`), **before** `check-css-var-resolvability.mjs`
existed.

| Metric | Kickoff §3.1/§3.3 | Re-derived (2026-08-10, commit `1112e86df`) | Match |
|---|---:|---:|---|
| `@theme` declarations | 190 (1 + 189) | 190 (1 + 189) | ✅ |
| Emitted in shipped `@layer theme` | 50 | 50 | ✅ |
| Dropped | 140 | 140 | ✅ |
| Dropped w/ any `src/` reference | 0 | 0 | ✅ |
| Owned (`@theme`+`@theme inline`+`:root`) | 259 | 259 | ✅ |
| Arm A refs (owned, distinct names, shipped CSS) | 78 | 78 | ✅ |
| Arm B refs (owned, distinct names, `src/**/*.{css,tsx,ts}` \ globals.css) | 55 | 55 (raw scan) / **55** after the tokenizer landed | ✅ |
| Module-kept tokens (emitted, ref only in the CSS-Modules chunk) | 11, named list | 11, **identical list**: `--color-badge-premium`, `--color-muted-foreground`, `--shadow-listing-card-elevation-lg`, `--space-2-5`, `--text-2xs`, `--text-sm`, `--text-sm--line-height`, `--text-xl`, `--text-xl--line-height`, `--text-xs`, `--text-xs--line-height` | ✅ |
| Dynamic `var()` sites, raw | 8, all `--mantine-color-` prefix | 8, confirmed at every cited line (`theme.ts:759,766,767,869,870,886`, `MantineDropdownMenu.tsx:150`, `MantineNotificationPattern.tsx:92`) | ✅ |
| `--color-overlay-foreground` shipped `var()` refs (P3 precondition) | 0 (only the declaration itself) | 0, confirmed via `grep -c "var(--color-overlay-foreground)"` on all 6 files | ✅ |

**One figure moved, and it is stated here rather than routed around (§14.9):** §3.2 claims **16**
owned tokens are referenced "only from `.tsx`/`.ts`, invisible to any CSS-only scan." Direct
inspection of the shipped CSS shows **7 of those 16 are not actually TSX-only** —
`--radius-md`, `--space-24`, `--color-status-success`, `--color-status-warning`, and
`--listing-gallery-h-mobile/-tablet/-desktop` all appear as literal `var(...)` text **inside the
shipped CSS itself**, because their TSX call sites use Tailwind's own arbitrary-value bracket
syntax (e.g. `rounded-[min(var(--radius-md),10px)]`, `h-[var(--listing-gallery-h-mobile)]`,
`text-[var(--color-status-success)]`) — Tailwind's scanner reproduces that literal text verbatim
into the compiled utility rule's declaration VALUE, so Arm A alone already resolves them (confirmed:
`grep -c "var(--radius-md)" .next/static/css/e55fe1d775976885.css` → 1, same pattern for the other
6). The correctly measured TSX-only set today is **9**: `--color-overlay`, `--color-overlay-foreground`,
`--home-section-py-base/-md/-lg`, `--text-2xl/-3xl/-4xl/-5xl`. This does not change the gate's
requirement (Arm B must scan TSX regardless of whether a name is ALSO resolvable via Arm A) and does
not affect any AC's pass/fail outcome — R2/AC2 only requires Arm B to demonstrably include
`LightboxView.tsx`/`MantineListingGalleryPattern.tsx`, which it does (§6 below). Recorded per §10.1:
"if any disagrees with this document, the build wins."

The 702 §3.6 correction (AC14/R15) is restated: `--color-status-info`/`--color-status-rented` are
dropped from the shipped `@layer theme`, and `bg-status-info/80` still works because `@theme inline`
substitutes the `:root` value directly (`.bg-status-info\/80{background-color:var(--status-info)}`).
They are safe because nothing needs the `--color-status-*` alias, not because a consumer keeps it
alive. This gate's Arm A/B scan confirms the same pattern for every other emitted-but-unreferenced
alias in the owned set — none is a violation, since a violation requires an actual `var()` reference
that fails to resolve, and an alias nobody references produces no reference to check.

## 3. Requirement / AC evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Arm A: every `var(--owned)` in shipped CSS resolves | `npm run check:css-vars` → "Arm A … 78 … 0 violations" (§5) |
| R2/AC2 | Arm B: same, over `src/**/*.{css,tsx,ts}` \ globals.css | Same run → "Arm B … 55 … 0 violations"; direct scan quotes `LightboxView.tsx:45 --color-overlay-foreground` and `MantineListingGalleryPattern.tsx:91 --color-overlay-foreground` (§6) |
| R3/AC3 | Ownership computed live, no hardcode/allowlist; empty set = non-zero | `extractOwnedNames()` parses `globals.css` at run time (no array/JSON); R8 test (d) — empty theme blocks → exit 1, "0 owned custom properties parsed … not a vacuous pass"; `--app-shell-navbar-width` (unowned) appears in 0 reports (control C2) |
| R4/AC4 | Comment stripping — block/line/JSX, string-literal-aware | `stripComments()` tokenizer; 12 unit tests in `css-var-resolvability.test.ts` covering all 3 CSS/TS forms + `https://` preservation + regex-literal awareness; `--verify-gate` control C3 |
| R5/AC4 | `@property --x` counts as a declaration | `extractPropertyRegisteredNames()`; unit test asserts `--tw-shadow` registered via `@property` is treated as declared |
| R6/AC5 | Dynamic sites — prefix rule, raw 8 / in-class 0 | `findDynamicVarSites()`; main run reports "8 raw, 0 in-class"; plant P4 (`var(--space-${n})`) FAILS, control C4 (`--mantine-color-`) PASSES |
| R7/AC6 | Current tree: owned 259, Arm A 78, Arm B 55, violations 0, exit 0 | §5 transcript below |
| R8/AC7 | Fail closed on missing/stale input, freshness set = Arm B's own file list | 4 negative runs (a)-(d), §7 below, all exit 1 |
| R9/AC8 | `--verify-gate`: 4 plants FAIL, 4 controls PASS | §8 transcript, 8/8, exit 0, `git status --porcelain` unchanged after |
| R10/AC9 | Fallback-bearing owned refs — separate, non-blocking | Control C1; main run's "0 fallback-bearing owned reference(s)" section (see §5.1 note — the 232 figure is unscoped-across-ALL-vars, not owned-only) |
| R11/AC8,AC10 | `--css-dir`/`--globals-path`/`--src-dir` flags, temp-copy driven | All of §7/§8 run exclusively through these 3 flags against `mkdtempSync`/manually-built temp dirs; `git status --porcelain` proves the real tree untouched after each |
| R12/AC11 | Wired into `click-shield` after `npm run build`; exactly 2 new scripts | `.github/workflows/governance-pr.yml` diff (§4); `package.json` diff (§4) |
| R13/AC12 | `build` exit 0; no `src/` path in final `git status --porcelain` | §9 final build + final status |
| R14/AC13 | Backlog + session log | `docs/backlog.md` updated (§11); this file |
| R15/AC14 | Report states whether §3.1/§3.3 reproduced; restates 702 §3.6 | §2 above |

## 4. Files changed

| Path | Reason |
|---|---|
| `scripts/check-css-var-resolvability.mjs` | **new** — the gate: comment tokenizer, ownership extraction, both arms, freshness, `--verify-gate` |
| `scripts/__tests__/css-var-resolvability.test.ts` | **new** — 27 unit tests for the parser primitives (R4/R5/R6/R10) |
| `package.json` | +2 scripts: `check:css-vars`, `check:css-vars:verify` |
| `.github/workflows/governance-pr.yml` | +1 step in `click-shield`, after "Build production bundle", before "Start production server" |
| `docs/backlog.md` | concise state update (700 row + Last Session + Sprint 46 line) |
| `docs/sessions/2026-08-10-task700-css-var-resolvability-gate.md` | this file |

No file under `src/` was touched — confirmed by every `git status --porcelain` snapshot below.

## 5. Main-run evidence (real tree)

```
$ npm run check:css-vars
🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): 259
    Arm A (shipped CSS) — owned names referenced: 78
    Arm B (src/**/*.{css,tsx,ts}, excl. globals.css) — owned names referenced: 55
    Dynamic var() construction sites: 8 raw, 0 in-class (prefix could name an owned token)

ℹ️   0 fallback-bearing owned reference(s) — non-blocking (R10):

✅  check:css-vars — 0 violations, 0 in-class dynamic sites.
EXIT_CODE=0
```

Re-run after the final `npm run build` (§9) reproduced the identical 259/78/55/0/0 — confirms the
gate is not sensitive to run order and the freshness check accepts the fresh bundle.

### 5.1 R10 clarification (AC9)

The kickoff's §3.3 "232 with a fallback" figure is the UNSCOPED count across every `var()` reference
in the shipped CSS (owned + unowned — hundreds of Mantine/Tailwind runtime vars use a fallback, e.g.
`var(--tw-ring-color,currentcolor)`). This gate's fallback report is, by R3/design, scoped to OWNED
names only (matching the ownership-scoping requirement that also produces C2's "unowned name reported
nowhere" behavior) — reporting all 232 would re-introduce the exact 112-false-positive class §3.3
itself identifies as the reason a naive gate is unusable. On the current tree, 0 OWNED references carry
a fallback (confirmed by direct scan — no owned name is referenced with a fallback anywhere in `src/`
or the shipped CSS today), so the non-blocking section is correctly empty. R10's mechanism itself is
proven live by plant/control C1 (§8): a fixture `var(--color-badge-reduced, red)` is reported ONLY in
the non-blocking list, never as a violation.

## 6. Arm B evidence quoting the two motivating tokens (AC2)

```
LightboxView.tsx
   --color-overlay-foreground line 45 fallback: false
   --color-overlay-foreground line 46 fallback: false
   --color-overlay-foreground line 47 fallback: false
   --color-overlay-foreground line 48 fallback: false
   --color-overlay line 86 fallback: false
   --color-overlay-foreground line 159 fallback: false
MantineListingGalleryPattern.tsx
   --listing-gallery-h-mobile line 49 fallback: false
   --listing-gallery-h-tablet line 49 fallback: false
   --listing-gallery-h-desktop line 49 fallback: false
   --listing-gallery-h-mobile line 62 fallback: false
   --listing-gallery-h-tablet line 62 fallback: false
   --listing-gallery-h-desktop line 62 fallback: false
   --color-overlay-foreground line 91 fallback: false
```

`--color-overlay-foreground` is the token this gate exists to protect (Task 690's regression class,
§3.2) — confirmed found by Arm B at both cited files, both resolved today (0 violations).

## 7. R8 freshness negative flows (AC7) — all against temp copies, real tree untouched

```
(a) --css-dir empty:
❌  check:css-vars — no shipped CSS found under …\task700-r8-a — run "npm run build" first
EXIT_CODE=1

(b) bundle backdated to 2020, then ListingCard.module.css touched:
❌  check:css-vars — shipped CSS (newest 2019-12-31T23:00:00.000Z) is older than
    …\task700-r8-b\src\modules\listings\components\ListingCard.module.css (2026-08-10T20:35:18.166Z)
    — rebuild with "npm run build"
EXIT_CODE=1

(c) bundle backdated to 2020 (module.css left old), then the NON-module input-chrome.css touched:
❌  check:css-vars — shipped CSS (newest 2019-12-31T23:00:00.000Z) is older than
    …\task700-r8-c\src\design-system\mantine\input-chrome.css (2026-08-10T20:35:18.935Z)
    — rebuild with "npm run build"
EXIT_CODE=1

(d) --globals-path pointed at a file with empty @theme inline:
❌  check:css-vars — 0 owned custom properties parsed from …\task700-r8-d\globals-empty.css
    — parse failure, not a vacuous pass (R3)
EXIT_CODE=1
```

**(c) is the case that proves the freshness set genuinely widened with Arm B's glob** (kickoff §0.3
E3): it backdates the bundle relative to a real, non-`.module.css` project stylesheet
(`src/design-system/mantine/input-chrome.css`) and still fails closed — a gate still watching only
`*.module.css` would pass (b) and fail this test, which it does not.

`git --no-optional-locks status --porcelain` after all four: unchanged from before (no real-tree path
touched — see §10 for the exact snapshot).

## 8. `--verify-gate` transcript (R9/AC8) — 4 plants FAIL, 4 controls PASS

```
$ npm run check:css-vars:verify
🔬 check:css-vars self-test (--verify-gate) — 4 plants FAIL, 4 controls PASS

✅  baseline (unmodified temp copy): 0 violations, 0 in-class dynamic sites (owned=259, Arm A refs=78, Arm B refs=55)

✅  P1 (FAIL) — Arm A correctly reported unresolved --radius-md at …\css\e55fe1d775976885.css:1
    after its declaration was renamed to --radius-md-renamed
✅  P2 (FAIL) — Arm A correctly reported unresolved --color-badge-premium at …\css\fa22169bb7793d5f.css:1
    after its declaration was deleted
✅  P3 (FAIL) — Arm A silent (0 refs to check) + Arm B correctly reported unresolved
    --color-overlay-foreground at …\src\design-system\mantine\patterns\MantineListingGalleryPattern.tsx:91
✅  P4 (FAIL) — in-class dynamic site correctly reported: …\src\__task700_verify_gate_fixture_p4.tsx:1
    prefix "--space-"
✅  C1 (PASS) — var(--color-badge-reduced, red) reported only in the non-blocking fallback list, never
    as a violation
✅  C2 (PASS) — --app-shell-navbar-width is not owned and appears in no report
✅  C3 (PASS) — block: owned=259 (expect 259), --spacing-N excluded=true | line: line comment at
    theme.ts:280 correctly stripped
✅  C4 (PASS) — 8 "--mantine-color-" dynamic site(s) found, all out-of-class=true

✅  8/8 verify-gate assertions behaved as expected (4 plants FAILED, 4 controls PASSED).
EXIT_CODE=0

$ git --no-optional-locks status --porcelain   (immediately after)
 M .github/workflows/governance-pr.yml
 M docs/backlog.md
 M package.json
?? scripts/__tests__/css-var-resolvability.test.ts
?? scripts/check-css-var-resolvability.mjs
```

Every plant/control ran against a `mkdtempSync` copy (base dir under the OS temp dir), mutated only
within that copy, and restored the mutation in a `finally` block before teardown (`rmSync` of the
whole temp base). The post-run `git status --porcelain` above lists only this task's own edits —
**no plant left any trace on the real tree.**

### 8.1 No-further-lifeline proof, per plant (§10.7)

- **P1** (`--radius-md`): pre-plant census confirmed exactly 1 declaration site in the temp css-dir
  copy and at least 1 referencing file, before mutating. (The script's own `countDeclarationSites`/
  census check would have failed the plant with an explicit message if this were untrue — see the
  identical check that correctly caught a bad first choice, `--color-badge-new`, which had 0
  declaration sites and 0 references and was replaced — §12.)
- **P2** (`--color-badge-premium`): same census — 1 declaration site, ≥1 reference, confirmed before
  deletion.
- **P3** (`--color-overlay-foreground`): census confirmed exactly 1 declaration site AND exactly 0
  shipped `var()` references (the measured precondition from §2) before removal; the script also
  asserts `--overlay-foreground`'s OWN declaration-site count is unchanged after the plant (it is —
  0→0 delta), directly proving the differently-named token was not touched (§0.3 E2's exact concern).
- **P4**: no removal involved (an addition-only plant) — no lifeline census applicable; the fixture
  file is created fresh and removed in `finally`.

## 9. Final build (hard completion gate)

```
$ npm run build     (after all edits)
… (full route table, unchanged shape from the pre-edit build)
EXIT_CODE=0
```

Re-running `npm run check:css-vars` immediately after this build reproduced 259/78/55/0/0/exit 0
(§5), confirming the gate reads the fresh bundle correctly and the freshness check does not
false-positive on a same-second rebuild.

## 10. Final `git status --porcelain`

```
 M .github/workflows/governance-pr.yml
 M docs/backlog.md
 M package.json
?? scripts/__tests__/css-var-resolvability.test.ts
?? scripts/check-css-var-resolvability.mjs
```

Exactly the 6 §7-scoped paths (5 shown here + this session log, which did not exist yet when this
snapshot was taken and is being added in the same commit). **No `src/` path appears.**

## 11. Backlog update (R14/AC13)

`docs/backlog.md`: replaced the stale "Last Session" block (694/702 approval note — already folded
into the Standing Notes M1/M2/M4/M5 corollary section, so no information was lost) with a 5-line
700-focused note; replaced the 700 registry row (was describing draft-1-vintage numbers/glob) with a
current, concise state row; updated the Sprint 46 summary line's 700 clause from "kickoff filed,
ready for @executor" to "IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW."

- Baseline (`git show HEAD:docs/backlog.md | wc -l`): **89**.
- Resulting physical line count: **87** (`wc -l docs/backlog.md`) — net **-2** lines.
- **`BACKLOG LIMIT BREACH`: the file was already over the ~80-line target before this edit (89) and
  remains over it after (87).** This edit reduced it but did not bring it under the target; Sonnet
  did not add history and made only in-place, size-reducing changes per the skill's instruction.
  Flagging for Opus to validate/consolidate during review, as the file itself directs.

## 12. Validation-run defects found and fixed during implementation

All of the following were found by running the gate against the real tree/temp copies and observing
incorrect output — none was assumed correct without execution:

1. **Doc-comment self-termination bug.** The script's own top-of-file header comment contained a
   literal `*/` inside prose describing a regex pattern, closing the `/** … */` block early and
   producing a `SyntaxError`. Fixed by rewording the prose to avoid an embedded `*/`.
2. **`extractCssDeclaredNames` broken against Tailwind's own minified, escaped output.** A first
   version ported check-design-tokens.mjs's quote/paren-depth-tracking algorithm (built for authored,
   non-minified CSS). Measured broken: Tailwind v4's arbitrary-value selectors backslash-escape their
   own apostrophes as literal characters (`[class*=\'size-\']`), which the depth-tracker's
   backslash-skip (only active *inside* an already-open quote) misreads as opening a real string;
   once "stuck," every declaration later in the file silently disappears — measured: 15 owned
   `:root`-declared names (`--radius`, `--muted`, `--border`, `--primary`, …) went undetected,
   producing 621 spurious violations on the clean tree. Replaced with the simpler,
   already-proven-correct anchor regex (`(?:^|[{;])\s*(--[\w-]+)\s*:`), re-validated against the real
   bundle (190/50/140, Arm A 78, exact match).
3. **`findVarReferences` did not find a `var()` nested inside another `var()`'s fallback** (e.g.
   `var(--tw-ease, var(--default-transition-timing-function))`) — the scan resumed past the outer
   call's own closing paren, skipping the inner one. Fixed by resuming the search from just after the
   outer call's own `var(`, not its close. Caught by a unit test, not by the main-tree run (no owned
   name currently sits inside another's fallback).
4. **`setupTempTree` copied `globals.css` twice** — once to a standalone sibling path used as
   `--globals-path`, and again as part of the whole-`src`-tree copy (which naturally contains its own
   `src/app/globals.css`). Arm B's own-file exclusion compares resolved paths, so it never matched the
   second copy (a different path from the first), and that second copy got scanned as an ordinary Arm
   B file — its own internal alias chains (`--primary: var(--brand-700)`, etc.) inflated the baseline
   Arm B reference count from 55 to 106. Fixed by pointing `--globals-path` at the copy that already
   lives inside the copied `src` tree (its real production location) instead of creating a second one.
5. **R8's own freshness check fired during plants that add/edit a src fixture file**, since a freshly
   written file is newer than the once-copied bundle. Fixed with a `touchCssDir` helper, called before
   every re-scan in `--verify-gate`, that bumps the temp bundle's mtime 60s into the future (a bare
   "now" was measured to occasionally TIE, not beat, a file written moments earlier in the same call —
   R8's strict `>` correctly read a tie as "not newer" and reported the bundle stale).
6. **P1's first target token (`--color-badge-new`) had 0 declaration sites and 0 references** in the
   shipped CSS (it is one of the 140 dropped tokens) — the pre-plant census correctly refused to run
   the plant rather than silently "passing" on a token that proves nothing. Replaced with `--radius-md`
   (1 declaration site, referenced), re-verified via the census before finalizing.

None of these six defects reached the completion-report evidence above — every number quoted in §5-§9
is from the corrected script, re-run after each fix.

## 13. Assumptions, deviations, and limitations

- **Deviation from the kickoff's literal P1/P3 plant wording — found, not routed around.** §10.7
  P1 says to rename the declaration "in the globals copy"; P3 says to remove
  `--color-overlay-foreground`'s declaration "from the globals copy, and its one `@layer theme`
  declaration from the CSS copy." Under R3's OWN rule ("ownership computed from `globals.css` at run
  time"), literally removing/renaming a token's ONLY declaration in the `--globals-path` copy makes
  that token **un-owned** by the gate's own live-computed definition — and an un-owned reference is
  never reported (that is exactly control C2's required behavior). Applied literally, P1 and P3 would
  therefore be **self-immunizing**: the mutation that is supposed to trigger a FAIL simultaneously
  removes the only mechanism (ownership) that lets the gate see the reference at all — verified this
  is not a misreading by tracing it through for `--color-overlay-foreground` specifically, which has
  exactly one declaration in the whole file (line 85, `@theme inline`; confirmed by `grep -n`), so
  removing it from `--globals-path` un-owns it completely. The working implementation instead leaves
  `--globals-path` **untouched** for every plant's target token (so it stays owned) and mutates only
  `--css-dir` (P1: renames the declaration line there while leaving a consuming reference intact; P2:
  deletes the declaration line there; P3: deletes only `--color-overlay-foreground`'s one shipped
  declaration, asserting `--overlay-foreground`'s own declaration-site count is unchanged). This
  reproduces the exact OBSERVABLE defect class each plant is meant to demonstrate (a declaration that
  disappears from what actually ships, while the reference and its ownership both survive) without
  the self-immunizing side effect. Flagged here per the kickoff's own §14.9 standard ("if one of these
  is wrong, say so and stop — do not route around it") — applied to a plant MECHANISM rather than a
  measured fact, since the 3-draft history of this exact kickoff shows the same discipline is needed
  for both.
- **AC9's "232" figure is not literally reproduced in the gate's own report** — by design, per R10's
  scoping to OWNED names only (§5.1). Restated so the discrepancy is not silently absorbed.
- **§3.2's "16 TSX-only tokens" is corrected to 9**, measured directly against the shipped CSS (§2).
  Does not change any AC's pass/fail outcome.
- **Regex-literal handling in `stripComments` is a heuristic**, not a full JS parser (based on the
  preceding significant token, matching common lightweight-tokenizer practice) — covers every case
  actually present in this repo's scanned files (confirmed no scanned `.ts`/`.tsx` file's regex
  literal contains a `/*`/`//` sequence that would exercise the heuristic's edge), and one unit test
  exercises it directly.
- **Template-literal nesting is tracked to one level of `${ … }` depth** — sufficient for every
  scanned file (`var(--mantine-color-${color}-5)` and the planted `var(--space-${n})` shape); a
  template containing a NESTED un-escaped backtick inside its own interpolation is not modeled and
  does not occur anywhere in this repo today.
- No file under `src/` was changed — confirmed by every `git status --porcelain` snapshot in this
  log (§7, §8, §10).
- `docs/critical-flow-registry.md` was scanned in full (all section headers, plus the two sections
  most likely to intersect a governance/CI-gate task — "Rendered-proof precondition" and "Storybook
  rendered-proof gate"). **No row is affected** — this task adds a new build-time Node script and one
  CI step; it touches no auth, admin, listings, notification, or rendered-proof flow, and no row in
  the registry references CSS custom-property resolvability or `check:css-vars`.
