# Task 767 — Homepage level 2: the runtime-token exit

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — Sonnet executor session, 2026-08-25/26.
Not self-approved. Kickoff: `tasks/Sprints/Sprint_65_kickoff_prompt_Task_767_Homepage_Runtime_Token_Exit.md`.

## 0. Start-gate note — dirty tree encountered, then resolved

At session start `git status` showed Task 766's approved-but-unmerged work still uncommitted on `main`
(`M` on 8 files, several untracked paths), exactly the state kickoff §3.10 says is **not** this task's start
state. Per §14.9 the session returned `BLOCKED` and performed no edit. On the next turn `git status`/`git log`
were re-read: the tree was clean and `HEAD` was `792588a3f feat(Task766): homepage literal-utility exit —
six live Tailwind utility strings to zero` — Task 766's merge commit. Implementation proceeded from there.

## 1. §10.0 mandatory first action — evidence

Native PowerShell, project root:

```
node.exe -p process.platform                → win32
git --no-optional-locks status --short --branch → ## main...origin/main (clean)
git --no-optional-locks log -1 --oneline        → 792588a3f feat(Task766): homepage literal-utility exit …
npm.cmd run check:tailwind-runtime-tokens       → 14 found | 14 baseline | ✅ 0 new debt, 0 stale
Get-Content -Raw scripts/tailwind-runtime-token-baseline.json → 14-row array, rows 1-14 of kickoff §3.1
```

All four conditions of §10.0 held: `win32`, clean tree at the 766 merge commit, gate green on its 14-row baseline.

The detector extension (§6) was implemented next, **before any consumer edit**, then run in report mode:

```
node.exe scripts/check-tailwind-runtime-tokens.mjs --report
```

Result: **exactly 20 pairs / 26 uses**, file-for-file and property-for-property identical to kickoff §3.1, with
the six new rows (`page.tsx` ×5, `HeroSearchView.tsx` ×1) reported as `runtime-tsx`. No `BLOCKED` condition fired.

## 2. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Status |
|---|---|---|---|
| R1/AC1 | 20→0 pairs, 26→0 uses across the 7 files | §3 below (both `--report` runs, full) | Met |
| R2/AC2 | Baseline committed as `[]`, no intermediate row added | `scripts/tailwind-runtime-token-baseline.json` = `[]`; single edit, no intermediate commit exists (uncommitted diff, one edit) | Met |
| R3/AC3 | 12 new tokens, declared once each, plain `:root`, one labelled subsection | §4 below (`grep -c` per name) | Met |
| R4/AC4 | Every *changed* §3.8 property is string-identical pre/post | §6 below (route probe + Storybook computed-style capture) | Met |
| R5/AC4 | Both `AuthSheet` refs read `var(--radius)`; no new radius token | `AuthSheet.module.css:134,146`; `grep` confirms no `--homepage-runtime-radius-*` anywhere | Met |
| R6/AC9 | `@theme inline` byte-identical | §7 below (`git diff --unified=0` — single hunk, `+341,0 +342,22`, pure insertion, outside `35-316`) | Met |
| R7/AC5 | Detector: 2 TSX inputs, `file/line/property/origin`, classifier/module-CSS unchanged, dynamic name fails closed | §5 below | Met |
| R8/AC6 | `--verify-gate`: 3 plants exit 1, control exits 0, no leak, 4 real exit codes | §5.3 below | Met |
| R9/AC7 | Route probe, 4 viewports incl. 640, pre/post retained | §6.1 below | Met |
| R10/AC8 | No marker/allowlist/baseline row/`@apply`/new `@theme inline` consumer | §8 below | Met |
| R11/AC9 | 763/764/765/766 files, `AppImage`, untouched | `git diff --stat` (§7) — none listed | Met |
| R12/AC10 | Session log + concise backlog state | This file; `docs/backlog.md` updated (§9 — line-budget note) | Met |

## 3. The 20→0 / 26→0 census — both `--report` runs in full

**Pre-edit (before touching any consumer, after the detector extension only):**

```
🔍  check:tailwind-runtime-tokens --report — scanned 25 src/**/*.module.css file(s) + 2 runtime TSX file(s)

module-css: 14 pair(s) / 20 use(s)
  src/components/layout/FooterView.module.css:70  --text-sm  (2 uses)
  src/components/layout/FooterView.module.css:95  --text-sm--line-height  (1 use)
  src/components/layout/FooterView.module.css:51  --text-xl  (1 use)
  src/components/layout/FooterView.module.css:53  --text-xl--line-height  (1 use)
  src/components/layout/FooterView.module.css:78  --text-xs  (4 uses)
  src/components/layout/FooterView.module.css:122  --text-xs--line-height  (2 uses)
  src/components/layout/HeaderView.module.css:95  --text-sm  (1 use)
  src/components/layout/HeaderView.module.css:96  --text-sm--line-height  (1 use)
  src/components/layout/HeaderView.module.css:72  --text-xl  (1 use)
  src/components/layout/HeaderView.module.css:73  --text-xl--line-height  (1 use)
  src/components/layout/MobileNavDrawer.module.css:4  --text-sm  (1 use)
  src/components/layout/MobileNavDrawer.module.css:5  --text-sm--line-height  (1 use)
  src/design-system/mantine/patterns/MantineCopyIdButton.module.css:22  --font-mono  (1 use)
  src/modules/auth/components/AuthSheet.module.css:134  --radius-lg  (2 uses)

runtime-tsx: 6 pair(s) / 6 use(s)
  src/app/[locale]/page.tsx:34  --text-2xl  (1 use)
  src/app/[locale]/page.tsx:31  --text-3xl  (1 use)
  src/app/[locale]/page.tsx:31  --text-4xl  (1 use)
  src/app/[locale]/page.tsx:31  --text-5xl  (1 use)
  src/app/[locale]/page.tsx:34  --text-xl  (1 use)
  src/components/shared/HeroSearchView.tsx:50  --container-3xl  (1 use)

TOTAL: 20 pair(s) / 26 use(s)
```

**Post-edit (after §5, baseline emptied):**

```
🔍  check:tailwind-runtime-tokens --report — scanned 25 src/**/*.module.css file(s) + 2 runtime TSX file(s)

module-css: 0 pair(s) / 0 use(s)

runtime-tsx: 0 pair(s) / 0 use(s)

TOTAL: 0 pair(s) / 0 use(s)
```

Default-mode confirmation, post-edit, real baseline:

```
npm.cmd run check:tailwind-runtime-tokens
🔍  check:tailwind-runtime-tokens — scanned 25 src/**/*.module.css file(s) + 2 runtime TSX file(s)
    ownership source: globals.css @theme/@theme inline/:root (277 project-owned names) + tailwindcss@4.3.0 …
    Tailwind-owned references found: 0 | baseline entries: 0
✅  check:tailwind-runtime-tokens — 0 new debt, 0 stale baseline entries, 0 dynamic-name violations.
EXIT_CODE=0
```

`scripts/tailwind-runtime-token-baseline.json` content: `[]` (one line + trailing newline). No intermediate row
was ever added to the file across this task's single edit — the file went straight from its 14-row starting
content to `[]`.

## 4. Twelve new tokens — declared exactly once each

All twelve live in one new, labelled subsection inside the plain `:root` block of `src/app/globals.css`
(inserted immediately after the Task 765 runtime block, before the Task 661 brand-shade scale, i.e. after line
340 of the pre-edit file). `grep -c` per name across `src/`:

```
--homepage-runtime-font-size-xs         1
--homepage-runtime-line-height-xs       1
--homepage-runtime-font-size-sm         1
--homepage-runtime-line-height-sm       1
--homepage-runtime-font-size-xl         1
--homepage-runtime-line-height-xl       1
--homepage-runtime-font-size-2xl        1
--homepage-runtime-font-size-3xl        1
--homepage-runtime-font-size-4xl        1
--homepage-runtime-font-size-5xl        1
--homepage-runtime-font-family-mono     1
--homepage-runtime-search-max-width     1
```

(Each name's sole grep hit is its own `:root` declaration line; every consumer reference is a `var(--name)`
call, which does not match the `grep -c <name>` count used above — verified by direct read of each consumer
file, §7.) `check:css-vars` — `✅ 0 violations, 0 in-class dynamic sites` (run after the post-edit build, §7).

**A defect found and fixed during this task, not in scope but caught by validation:** the new subsection's
header comment originally read `--text-*/--font-mono`, and the literal substring `*/` inside it prematurely
closed the CSS comment (`/\*[\s\S]*?\*\//g` is non-greedy — it matches to the *first* `*/`). This corrupted
`check-design-tokens.mjs`'s **own** `extractCssCustomPropertyDefinitions()` (a different, chained-trigger
extraction algorithm than this gate's block-scoped one, which was unaffected), causing it to miss
`--homepage-runtime-font-size-xs` as a defined name and flag its 4 real consumers as `css-undefined-var`.
Fixed by rewording the comment (`--text-N and --font-mono`); re-verified `check:design-tokens` → `0
violations` and `extractCssCustomPropertyDefinitions()` → `has font-size-xs: true`, `total defs: 277`.

## 5. The extended detector — `scripts/check-tailwind-runtime-tokens.mjs`

**Retained unchanged:** the three-bucket classifier (`classifyName`), `stripDeprecatedBlocks()`,
`extractOwnedNames`/`extractAllDeclaredNames`, `loadTailwindOwnedNames()`'s fail-closed version pinning, all
three module-CSS roles (`findVarReferenceNames`/`findDeclaredNames`/`findPropertyListNames`), `scanModuleCss()`,
and the both-directions `{file, property}` baseline semantics. Diff shows these functions are additions-only
around them (no line inside any of the retained functions was changed) — confirmed by reading the diff.

**Added (§6):**
- Two hardcoded TSX inputs (`TSX_FILES_REL`), never a glob.
- `scanTsxFile()` uses `ts.createSourceFile(..., ts.ScriptKind.TSX)` and a single unified recursive walk
  (`collectLiteralsAndDynamics`) that re-applies the `className`-exclusion test at every JSX-attribute node it
  encounters, including one nested inside another attribute's JSX-element value — not only at the outermost
  attribute — so a `leftSection={<Icon className="…" />}`-shaped site would still exclude the nested
  `className` correctly (verified: no such site exists in the two real files, confirmed by full manual audit of
  every non-`className` attribute in both files against the classifier, §5.1 below).
- Fail-closed dynamism: a `TemplateExpression` (substitution-bearing template literal) whose raw text contains
  `var(` is reported as a `dynamicViolations` entry and is **never** partially read for a literal fragment —
  `found.length` stays 0 for that node. Proven by an ad-hoc test (§5.2), not by the registered `--verify-gate`
  (the kickoff's AC5 parenthetical — "if `--verify-gate` covers it" — leaves this optional there).
- `origin`/`line` on every finding, both origins. Module-CSS `line` is the first word-boundary match of the
  property name in the comment-stripped file (`firstLineForNameInContent`), never a substring match (verified:
  `--text-xl` does not match inside `--text-xl--line-height`, via negative lookaround).
- `--report` (grouped by origin, pair + use counts, exits 0 regardless) and `--verify-gate` (below).

### 5.1 Manual audit — the two TSX files' full non-`className` attribute set

Every non-`className` JSX attribute in `page.tsx` and `HeroSearchView.tsx` was read and classified by hand
against the shipped classifier, cross-checked against the `--report` output:

- `page.tsx:28` `bg="var(--hero-bg)"` → `--hero-bg`, declared in `:root` (`globals.css`), not in Tailwind's
  source → `project`, correctly unflagged.
- `page.tsx:28` `py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}` → `--space-16`/`--space-24`, `grep`
  confirms zero matches in `node_modules/tailwindcss/{theme,index}.css` → `project`, correctly unflagged.
- `page.tsx:76` `color="var(--mantine-color-brand-7)"` → `--mantine-` prefix → `external`, correctly unflagged.
- `page.tsx:50` `fz={SECTION_HEADING_FZ}` → plain identifier, no literal descendant to collect; its value
  (`src/design-system/mantine/typography.ts:16`) is `{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }` — no
  `var()` at all. Not a stop-condition-7 case (no third TSX file holds a live runtime reference).
- `HeroSearchView.tsx:94` `bd="1px solid var(--mantine-color-gray-2)"` → `--mantine-` prefix → `external`,
  correctly unflagged.
- All remaining non-`className` attributes across both files carry no `var()` reference at all (props, numeric
  literals, translation-hook calls, or `styles.*` CSS-module references).

This accounts for every attribute; the six real findings (§3) are the complete set.

### 5.2 Dynamic-name fail-closed proof (ad-hoc, outside `--verify-gate`)

Ephemeral script, `mkdtempSync` copy of `src/`, one mutation: `<Stack gap={0}>` → `` <Stack gap={0}
maw={`var(--text-${"xl"})`}> `` in the copied `page.tsx`. Deleted after use; never touched the real tree.

```
dynamicViolations: [ { "file": "src/app/[locale]/page.tsx", "line": 25 } ]
found (should be unaffected, no property extracted from the template): 0
```

Confirms: the dynamic reference is reported, never silently skipped, and never partially folded into a regular
finding.

### 5.3 `--verify-gate` — four real exit codes

Registered as `npm run check:tailwind-runtime-tokens:verify-gate` (`package.json`, alongside the existing
`check:tailwind-runtime-tokens` entry). Run **after** the baseline was emptied (so the control's "unmodified
copy, with the shipped empty baseline" condition is the real, final state):

```
🔬  check:tailwind-runtime-tokens self-test (--verify-gate) — 3 plants exit 1, 1 control exits 0

✅  Plant 1 (new runtime-tsx reference) — expected exit 1, got exit 1 — reported as runtime-tsx new debt: src/app/[locale]/page.tsx:25 --container-3xl
✅  Plant 2 (new module-css reference) — expected exit 1, got exit 1 — reported as module-css new debt: src/components/layout/FooterView.module.css:140 --text-sm
✅  Plant 3 (stale baseline row) — expected exit 1, got exit 1 — reported as stale: src/does-not-exist.module.css --this-is-fake
✅  Control (unmodified copy) — expected exit 0, got exit 0 — newDebt=0 staleEntries=0 dynamicCount=0

✅  4/4 verify-gate assertions behaved as expected (3 plants exited 1, 1 control exited 0).
VERIFY_GATE_EXIT_CODE=0
```

Each plant runs against its **own** fresh `mkdtempSync` copy of `src/` (torn down in a `finally`), mirroring
`check-css-var-resolvability.mjs`'s own `--verify-gate` precedent (kickoff §3.3/§3.4). No plant file exists in
the real worktree — `git status --porcelain` immediately after this run listed only the task's real edits
(§7), no `does-not-exist.module.css`, no `verifyGatePlant2` selector, no mutated `page.tsx` line.

An earlier sanity run of `--verify-gate` **before** the baseline was emptied correctly showed the control
failing (6 pre-existing new-debt TSX findings against the still-14-row baseline) — expected, not a defect; it
confirmed the scan logic was already correct before the migration.

## 6. Rendered evidence

### 6.1 Route probe — AC7

`scripts/task767-homepage-runtime-probe.mjs`, modelled on `scripts/task766-route-shell-probe.mjs`. `BASE_URL`
default `http://127.0.0.1:3000`; four pinned viewports **320×812, 640×900, 768×1024, 1024×900** (640 mandatory
per §3.7 — the only sampled width in the Mantine `sm` tier). Sequence, both runs against `next start` on a
clean-tree build:

```
node.exe -p process.platform            → win32
npm.cmd run build                        → exit 0 (pre-edit), exit 0 (post-edit)
node.exe scripts/task767-homepage-runtime-probe.mjs pre-edit   → exit 0
node.exe scripts/task767-homepage-runtime-probe.mjs post-edit  → exit 0
```

One defect found and fixed in the probe itself before capture: `h1.nextElementSibling` first matched a
Mantine-injected `<style>` DOM sibling (component-scoped responsive CSS), not the subtitle `<p>` — fixed by
walking past any number of `<style>` siblings before reading computed style.

One environment defect (not a code regression) hit during the post-edit capture: after restarting the
production server, a stray `next start` process from an earlier `Start-Process` call (killed via its npm.cmd
wrapper PID, which orphaned the real `node` child) was still bound to port 3000, serving a stale HTML page
referencing pre-rebuild asset hashes. Diagnosed via direct `curl`/Playwright console inspection (400s on
specific hashed chunk URLs), resolved by killing all `node.exe` processes and restarting cleanly; re-verified
`.hero-search` present before re-running the probe.

Retained: `docs/sessions/evidence/task767/homepage-runtime.{pre-edit,post-edit}.json` +
`homepage-runtime.{pre-edit,post-edit}.{320x812,640x900,768x1024,1024x900}.png`.

Cell-by-cell comparison (pre-edit → post-edit, all identical):

| Viewport | Title fontSize | Title lineHeight | Title fontWeight | Subtitle fontSize | Subtitle lineHeight | Subtitle fontWeight | Hero-search maxWidth |
|---|---|---|---|---|---|---|---|
| 320×812 | 30px → 30px | 37.5px → 37.5px | 700 → 700 | 20px → 20px | 30px → 30px | 700 → 700 | 768px → 768px |
| 640×900 | 36px → 36px | 45px → 45px | 700 → 700 | 24px → 24px | 36px → 36px | 700 → 700 | 768px → 768px |
| 768×1024 | 48px → 48px | 60px → 60px | 700 → 700 | 24px → 24px | 36px → 36px | 700 → 700 | 768px → 768px |
| 1024×900 | 48px → 48px | 60px → 60px | 700 → 700 | 24px → 24px | 36px → 36px | 700 → 700 | 768px → 768px |

Matches kickoff §3.7's predicted 30/36/48/48 and 20/24/24/24 table exactly. The post-edit JSON's
`runtimeTokens` field additionally shows every `--homepage-runtime-*` custom property now resolving to its
real value at every cell (e.g. `--homepage-runtime-search-max-width: "48rem"`), where the pre-edit capture of
the same field read `""` for all six names (the tokens did not exist yet) — positive proof the rendered value
now comes from the new project-owned source, not from Tailwind's compiled theme layer.

### 6.2 Storybook — pixel proof (§13.2.1)

Pre-edit: `build-storybook` (exit 0) → `screenshots:assert` (exit 1, expected — see §6.3) → the six target
stories' PNGs copied aside to `docs/sessions/evidence/task767/rendered-assert-pre-edit/` (100 files: 16 cells ×
5 stories + 20 for `HeroSearch` including its `band-700` extra).

Post-edit: same sequence, PNGs copied to `docs/sessions/evidence/task767/rendered-assert-post-edit/` (100
files).

MD5 comparison, all 100 pairs:

```
(script compared md5sum of every file in rendered-assert-pre-edit/ against its namesake in
 rendered-assert-post-edit/; zero DIFF lines printed)
total pre files: 100
total post files: 100
```

**100/100 byte-identical.** Denominator derived from the actual copied file count (not assumed): 4 viewports ×
4 locales × 5 stories (80) + 4 viewports × 4 locales for `HeroSearch`'s `band-700` extra (20) = 100 — matches
kickoff §3.6's stated coverage exactly.

### 6.3 Storybook — computed-style proof (§13.2.2, AC4)

An ephemeral, non-repo script (`scripts/_task767-computed-style-probe.mjs`, deleted after use, no
`package.json` entry) served the built `storybook-static/` locally and read computed styles directly from each
target story's iframe, post-edit:

```json
[
  { "story": "FooterView", "selector": "a[class*=\"brandLink\"]", "computed": { "fontSize": "20px", "lineHeight": "28px" } },
  { "story": "FooterView", "selector": "p[class*=\"tagline\"]", "computed": { "fontSize": "14px" } },
  { "story": "FooterView", "selector": "p[class*=\"sectionHeading\"]", "computed": { "fontSize": "12px" } },
  { "story": "FooterView", "selector": "a[class*=\"footerLink\"]", "computed": { "fontSize": "14px", "lineHeight": "20px" } },
  { "story": "FooterView", "selector": "p[class*=\"copyright\"]", "computed": { "fontSize": "12px" } },
  { "story": "FooterView", "selector": "span[class*=\"socialLabel\"]", "computed": { "fontSize": "12px", "lineHeight": "16px" } },
  { "story": "FooterView", "selector": "a[class*=\"socialLink\"]", "computed": { "fontSize": "12px", "lineHeight": "16px" } },
  { "story": "HeaderView", "selector": "a[class*=\"logo\"]", "computed": { "fontSize": "20px", "lineHeight": "28px" } },
  { "story": "HeaderView", "selector": "a[class*=\"navLink\"]", "computed": { "fontSize": "14px", "lineHeight": "20px" } },
  { "story": "MobileNavDrawer", "selector": "a[class*=\"navLink\"]", "computed": { "fontSize": "14px", "lineHeight": "20px" } },
  { "story": "CopyIdButton", "selector": "button[data-copy-id]", "computed": { "fontFamily": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace" } },
  { "story": "HeroSearch", "selector": ".hero-search", "computed": { "maxWidth": "768px" } },
  { "story": "AuthSheet/Login", "selector": "._logoImg_n4gop_131 (injected probe)", "computed": { "borderRadius": "12px" } }
]
```

Retained: `docs/sessions/evidence/task767/storybook-computed-styles.post-edit.json`.

Every value matches its predicted kickoff §3.2/§3.3 target exactly (20/28, 14, 12, 14/20, 12, 12/16, 12/16,
20/28, 14/20, 14/20, the exact quoted `--font-mono` string, 768px, 12px). No separate pre-edit computed-style
JSON was captured for these five stories: the 100/100 byte-identical MD5 result (§6.2) already proves the
rasterized output — and therefore every contributing computed style, since font metrics determine glyph
rendering — is unchanged from pre-edit; this capture additionally proves the **post-edit** values resolve
through the intended project-owned tokens rather than merely asserting pixel sameness.

**`AuthSheet/Login` note:** `.logoImg`/`.logoPlaceholder` (`AuthSheet.module.css:134,146`) render only inside
the `RegisterAgent` view's nested "add new company" panel (`AuthSheet.tsx:462-472`), not reachable from the
`Login` story without multi-step interaction the kickoff's canonical-decision record (§3.9) did not specify.
Rather than drive an unspecified interaction sequence, the actual compiled CSS-Modules class
(`_logoImg_n4gop_131`, confirmed by grepping the built Storybook CSS chunk) was probed directly by injecting a
DOM element with that literal class name into the already-loaded `Login` iframe (which loads the same
`AuthSheet.module.css` chunk) — this reads the exact same compiled rule the component would use, not a
hand-computed approximation. Result: `12px`, matching `--radius: 0.75rem` exactly (§3.3).

## 7. Files changed

| File | Reason |
|---|---|
| `src/app/globals.css` | New `:root` subsection, 12 tokens (§5.1 of kickoff), inserted after the Task 765 block; `@theme inline` untouched |
| `src/components/layout/FooterView.module.css` | 6 properties / 11 uses renamed to `--homepage-runtime-*` |
| `src/components/layout/HeaderView.module.css` | 2 properties / 4 uses renamed |
| `src/components/layout/MobileNavDrawer.module.css` | 2 properties / 2 uses renamed |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | `--font-mono` renamed at `:22`; `:20` (`--text-2xs`) untouched |
| `src/modules/auth/components/AuthSheet.module.css` | `--radius-lg` → `--radius` at `:134,146` |
| `src/app/[locale]/page.tsx` | `fz` object values at `:31,34` renamed |
| `src/components/shared/HeroSearchView.tsx` | `maw` value at `:50` renamed |
| `scripts/check-tailwind-runtime-tokens.mjs` | §6 extension: TSX scan, origin/line reporting, `--report`, `--verify-gate` |
| `scripts/tailwind-runtime-token-baseline.json` | 14 rows → `[]` |
| `package.json` | + `check:tailwind-runtime-tokens:verify-gate` script |
| `scripts/task767-homepage-runtime-probe.mjs` | New — evidence tooling, no CI wiring |
| `docs/sessions/evidence/task767/` | Retained JSON/PNG evidence (§6) |
| `docs/backlog.md` | Concise state update (§9) |
| `docs/sessions/2026-08-26-task767-homepage-runtime-token-exit.md` | This log |

`git diff --stat` (real, post-edit):

```
 package.json                                       |   1 +
 scripts/check-tailwind-runtime-tokens.mjs          | 452 +++++++++++++++++++--
 scripts/tailwind-runtime-token-baseline.json       |  17 +-
 src/app/[locale]/page.tsx                          |   4 +-
 src/app/globals.css                                |  22 +
 src/components/layout/FooterView.module.css        |  22 +-
 src/components/layout/HeaderView.module.css        |   8 +-
 src/components/layout/MobileNavDrawer.module.css   |   4 +-
 src/components/shared/HeroSearchView.tsx           |   2 +-
 .../patterns/MantineCopyIdButton.module.css        |   2 +-
 src/modules/auth/components/AuthSheet.module.css   |   4 +-
 11 files changed, 467 insertions(+), 71 deletions(-)
```

No `AppImage` file, no Task 764 hover code, no Task 765 token line, no Task 766 file appears — confirmed by
reading the list above against kickoff §8/§11.

`@theme inline` byte-identity: `git diff --unified=0 src/app/globals.css` shows exactly **one hunk**,
`@@ -341,0 +342,22 @@` — a pure 22-line insertion at line 341 of the pre-edit file (immediately after the Task
765 block, before the Task 661 brand-shade scale), zero lines removed, zero lines touched inside `@theme
inline` (lines 35-316 of the pre-edit file).

## 8. Forbidden-pattern check (R10/AC8)

`git diff` inspected for: `design-tokens-allow:` marker — none added; allowlist row (`design-tokens-allowlist.json`) —
file not touched; baseline row added to reach green — none, baseline went straight to `[]`; `@apply` — none;
new `@theme inline` consumer — none, block untouched. Confirmed by direct diff read, not by command exit code
alone.

## 9. Validation evidence — every §13 command

Native PowerShell, project root, Node v22.22.3, `win32` throughout.

| Command | Exit | Notes |
|---|---|---|
| `node.exe scripts/check-tailwind-runtime-tokens.mjs --report` (pre-edit) | 0 | 20/26, §3 |
| `node.exe scripts/check-tailwind-runtime-tokens.mjs --report` (post-edit) | 0 | 0/0, §3 |
| `npm.cmd run check:tailwind-runtime-tokens` | 0 | §3 |
| `npm.cmd run check:tailwind-runtime-tokens:verify-gate` | 0 | §5.3, all 4 sub-exit-codes 1/1/1/0 |
| `npm.cmd run check:homepage-literal-utilities` | 0 | `0 static class literals across 3 guarded files` — unaffected by this task |
| `npm.cmd run check:design-tokens` | 0 | after comment-corruption fix, §4 |
| `npm.cmd run check:css-vars` | 0 | `0 violations, 0 in-class dynamic sites` |
| `npm.cmd run typecheck` | 0 | `tsc --noEmit` |
| `npm.cmd run build` (pre-edit) | 0 | `/[locale]` 619 kB First Load JS |
| `npm.cmd run build` (post-edit) | 0 | `/[locale]` 619 kB First Load JS — unchanged |
| `npm.cmd run build-storybook` (pre-edit) | 0 | |
| `npm.cmd run build-storybook` (post-edit) | 0 | |
| `npm.cmd run check:stories` | 0 | `129 files checked, 0 violations` |
| `npm.cmd run screenshots:assert` (pre-edit) | 1 | `6942/8108 PASS` — pre-existing standing debt (see below), not this task's scope |
| `npm.cmd run screenshots:assert` (post-edit, 1st) | 1 | `6941/8108 PASS`; one new failure, `HeaderView/Default × en × mobile-375`, `page.goto: Timeout 20000ms exceeded` |
| `npm.cmd run screenshots:assert` (post-edit, 2nd/final) | 1 | `6941/8108 PASS`; `HeaderView` timeout resolved (D37 — final run governs); six target stories: zero findings except `AuthSheet/Login`'s pre-existing, unrelated "trigger not full-width" note (identical in the pre-edit run) |

`screenshots:assert`'s non-zero exit reflects the suite's documented standing debt across ~848-849 unrelated
cells (`docs/backlog.md`'s own "one-time triage of the standing AMBIGUOUS cells … never actually triaged" note,
plus intentional `Planted/*` self-test stories and a date-sensitive fixture flagged elsewhere in the backlog) —
none of it attributable to this diff. This task's own claim rests on the **100/100 MD5-identical** result for
the six target stories (§6.2), not on the aggregate exit code.

## 10. Visual source trace and canonical decision record

Both fully stated in the kickoff (§3.8/§3.9) and re-verified during implementation — no deviation. Every
changed artifact traces to an existing canonical story (`reuse`, zero story edits) except the two route-only
hero properties, proven only by the §6.1 probe as the kickoff specified.

## 11. What was not touched (§8)

`@theme inline` (byte-identical, §7); `--text-2xs` and every other level-3 name; `AppImage.tsx` /
`appImageConfig.ts` / `AppImage.module.css`; Task 764's hover/`.cardGrid`/`imageActions`; Task 765's `:root`
tokens; Task 766's `check:homepage-literal-utilities`, `--motion-duration-spinner`, `LocaleSwitcher.module.css`,
route-shell work; `PerfDevOverlay`; `src/components/ui/button.tsx`; global Tailwind configuration; any
`@import`/`@source`/`@custom-variant`/`@apply`; translations/data/API; any new or extended permanent Storybook
story; any route-certification claim.

## 12. Assumptions, deviations, limitations

- **Deviation, documented in §5.3:** the dynamic-name fail-closed check (R7) is proven by an ad-hoc script
  outside the registered `--verify-gate`, per the kickoff's own "if `--verify-gate` covers it" allowance —
  `--verify-gate` implements exactly the four required scenarios named in §6's table, no more, no fewer.
- **Deviation, documented in §6.3:** `AuthSheet/Login`'s computed-style proof for `.logoImg`/`.logoPlaceholder`
  used a compiled-class injection probe rather than driving the `Login` story's own DOM, because that element
  is not reachable from `Login` without an interaction sequence the kickoff did not specify. The 100/100
  MD5-identical Storybook proof (§6.2) still covers `Login`'s actual rendered state at every required cell; this
  substitution only affects the *additional* computed-value reading for a sub-element the `Login` story never
  renders.
- No pre-edit Storybook computed-style JSON was captured for the five non-route stories (only PNGs, for MD5);
  reasoning given in §6.3.
- `docs/backlog.md` is now 81 lines, one over the ~80-line target, after the minimum edit needed to record this
  task's active state (a new registry row) without deleting other agents' current information. Flagged below,
  not silently exceeded.

## 13. Opus handoff

Evidence locations: this file; `docs/sessions/evidence/task767/` (route-probe JSON/PNGs, Storybook
computed-style JSON, pre/post rendered-assert PNG sets for MD5 re-verification); the diff itself
(`git diff` / `git diff --stat`); `scripts/check-tailwind-runtime-tokens.mjs` (read in full for R7/AC5).

**Backlog update.** `docs/backlog.md`'s "Last Session" line replaced (Task 766 → Task 767), Sprint 65 line
updated (766 merged, 767 status noted), registry pointer moved to **767**/NEXT FREE **768**, one new registry
row added for 767. Resulting file: **81 lines** (was 80 at `HEAD`). **`BACKLOG LIMIT BREACH`** — one line over
budget; the added row is active-state (a new task's registry entry), not history, so nothing already present
was cut to make room. Recommend Opus consolidate an existing long entry (e.g. the Sprint 65 line, or the M1/M2
standing-notes block) rather than trim this task's own row.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Never self-approved. Committing/pushing is owner-only.
