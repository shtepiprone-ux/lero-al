# Task 685 — Unregistered Mantine colour gate (`check:stories` Check 15) + the two `color="blue"` sites

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** Storybook / visual governance — **new gate** (`docs/rule-index.md` → "Storybook / Visual Proof").
- **Secondary types:** UI / current Mantine path (two changed colour props, authorized visual delta);
  design-system conformance (cl. 16, 16b).
- **Origin:** Task 681's review flagged `MantineNotificationPattern.tsx:81`'s `<Button color="blue">` as P3 and
  reserved **685** for it. Task 684's review re-confirmed it as still open. During this task's design an
  orchestrator sweep found the defect is **not** a single site — see §3.2. Owner decisions **D7/D8/D9**
  (2026-07-29) set this task's scope.

> **Read this first.** Task 684 is committed as `081c03e7f` and pushed; the branch is in sync with
> `origin/task/q0-ci-rendered-locale-split`. You therefore start from a **clean** worktree. This task is not a
> revision of anything — it is new work that closes a defect class.

---

## 2. Objective

1. Add **Check 15** to `scripts/check-stories.mjs`: fail on any Mantine colour prop whose value names a colour that
   is **not registered in `theme.ts`**, scoped to the Mantine story/pattern surface.
2. Prove the gate fails on the real defect **before** fixing it (the two `color="blue"` sites are a naturally
   occurring planted violation), then prove it fails on a synthetic plant **after** the fix.
3. Correct both `color="blue"` sites to the registered `blueLight`, and bound the resulting visual delta to exactly
   the two affected stories.

---

## 3. Verified context

Every fact below was read in the worktree on branch `task/q0-ci-rendered-locale-split` at commit `081c03e7f` on
2026-07-29. Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 Owner decisions

| ID | Question put to the owner | Owner ruling |
|---|---|---|
| **D4** (Task 681, standing) | `VARIANT_COLORS.info` was `blue`; `blue` is unregistered. | **`blueLight` RATIFIED.** Already applied in `notificationVariants.ts`. Precedent for this task's target value. |
| **D7** (this task) | The sweep found 5 unregistered-colour sites, 3 of them production `orange` in `AdminUsersTable.tsx`. Scope? | **685 = the two `blue` sites only.** The `orange` audit is deferred to **Task 686** — it needs a colour decision with no current provenance and touches production admin UI under a different rule bundle. |
| **D8** (this task) | `AdminSurfacePattern.stories.tsx:79`'s `<Badge color="blue">` labels a *role* ("Agent"), not an info signal. Target? | **`blueLight`.** Nearest registered blue; keeps the demo visually closest to today's rendering. The info-ramp semantics are accepted as a low cost on story fixture data. |
| **D9** (this task) | Fix the sites only, or also add a gate? | **Add the gate.** The class has produced 5 undetected sites and no existing check inspects colour-prop names. |

D7, D8 and D9 are the source of truth. **You may not fix the `orange` sites in this task** (§8).

### 3.2 The defect class — orchestrator sweep, 2026-07-29

`grep -rnE '(color|c|bg)="(dark|pink|grape|violet|indigo|blue|cyan|teal|lime|orange)([.][0-9])?"' src/ --include=*.tsx --include=*.ts`
returned **exactly five** hits:

| # | Site | Prop | In this task? |
|---|---|---|---|
| 1 | `src/design-system/mantine/patterns/MantineNotificationPattern.tsx:81` | `color="blue"` (Button, info trigger) | **YES** |
| 2 | `src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx:79` | `<Badge color="blue" variant="light" size="sm">` | **YES** |
| 3 | `src/components/admin/AdminUsersTable.tsx:224` | `c="orange.6"` | No — Task 686 |
| 4 | `src/components/admin/AdminUsersTable.tsx:264` | `c="orange.6"` | No — Task 686 |
| 5 | `src/components/admin/AdminUsersTable.tsx:475` | `color="orange"` | No — Task 686 |

Sites 3–5 are outside this task's **gate scope** as well (§3.6), so Check 15 will not fire on them and you will not
need an allowlist entry to keep the gate green. Task 686 widens the scope and fixes them together.

### 3.3 Why these render rather than fail — read from the installed package

`node_modules/@mantine/core/esm/core/MantineProvider/merge-mantine-theme/merge-mantine-theme.mjs` implements
`mergeMantineTheme` as `deepMerge(currentTheme, themeOverride)`. `validateMantineTheme` only asserts that
`theme.primaryColor` is a key of `theme.colors` — it does **not** validate consumer `color` props.

Consequence: `DEFAULT_COLORS` (keys `dark, gray, red, pink, grape, violet, indigo, blue, cyan, teal, green, lime,
yellow, orange`, read from `default-colors.mjs`) survives the merge. `color="blue"` therefore **resolves and paints
Mantine's stock blue** — it is a live visual defect, not a latent one and not a no-op.

`theme.ts:139` — `colors: { brand, gray, green, yellow, red, blueLight, purple, sale }`. `blue` is absent.

`theme.ts:138` sets `primaryShade: 7` as a plain **number**. Per the Task 619/620 comment block at `theme.ts:100+`
(verified there via `getPrimaryShade()` / `get-css-color-variables.mjs`), a numeric `primaryShade` makes Mantine
return 7 for **every** colour's `-light`/`-filled`/`-light-color` variables, not just `theme.primaryColor`. So both
in-scope sites read **index 7**:

| Site | Variant | Renders today | After this task |
|---|---|---|---|
| 1 — Button (no `variant` → Mantine default `filled`) | filled bg | `blue[7]` = **`#1c7ed6`** | `blueLight[7]` = **`#0086c9`** |
| 2 — Badge `variant="light"` | light text | `blue[7]` = **`#1c7ed6`** | `blueLight[7]` = **`#0086c9`** |

`blueLight[7]` is `#0086c9` (`theme.ts:74`), whose own comment records that Badge light/filled/outline reads this
index and that it is identical to index 6, so there is no rendered discrepancy inside the tuple.

### 3.4 No existing gate covers this

`grep -rn "registered\|theme.colors\|REGISTERED_COLORS\|colorProp" scripts/check-stories.mjs scripts/check-design-tokens.mjs`
→ **0 hits**. `check:design-tokens` catches raw hex/length/z-index values (44 pre-existing violations, 0
stale-marker) but not palette **names**. Nothing else inspects them.

### 3.5 `check-stories.mjs` mechanics — read at source

- **896 lines total.**
- `fail(file, line, rule, detail)` at **:135-138** pushes `{ file: rel, line, rule, detail }` into `violations`.
- **Check 14** ("Off-scale Mantine Button size", Task 520) occupies **:789-843** and is the structural precedent:
  its own scope-file list, a regex, an `@allow-button-size` escape-hatch comment, and multi-line opening-tag
  collection for props that wrap.
- The "Stale allowlist entry check" runs at **:844-871**.
- `runGate` returns `{ violations, storyFilesCount: STORY_FILES.length, checksRan: 14 }` at **:872**.
- The summary at **:882** prints `✅ check:stories PASSED — ${storyFilesCount} files checked, 0 violations.`;
  failure at **:885** and `process.exit(1)` at **:894**.
- `storyFilesCount` is `STORY_FILES.length` (currently **127**) and is **independent** of Check 14's/Check 15's own
  scope lists. Adding Check 15 must not change the reported file count.

### 3.6 Gate scope — and why Check 14's scope is not reusable as-is

Check 14's scope (`:793-796`) is:

```
src/stories/mantine/            +  src/design-system/mantine/patterns/
```

**`src/stories/patterns/mantine/` is missing from that list** — which is exactly where site 2 lives. A naive copy of
Check 14's scope would not catch the defect that motivated this task. Check 15's scope must be the **three**
directories:

```
src/stories/mantine/  +  src/stories/patterns/mantine/  +  src/design-system/mantine/patterns/
```

This scope deliberately excludes `src/components/`, which is why sites 3–5 (§3.2) stay green until Task 686.

### 3.7 False-positive survey — the real value distribution in the three scope dirs

`grep -rhoE '\b(color|c|bg)="[^"]+"' <3 scope dirs> | sort | uniq -c | sort -rn` returned **~360 occurrences across
27 distinct values**. Every one falls into four classes:

| Class | Examples observed | Must the gate allow it? |
|---|---|---|
| Registered theme colour, bare | `color="brand"` ×38, `color="gray"` ×20, `color="red"` ×13, `color="green"` ×10, `color="yellow"` ×6, `color="blueLight"` ×4, `color="sale"` ×2, `color="purple"` ×2, `c="brand"` ×7, `c="red"` ×1 | **Yes** |
| Registered theme colour, dot-shaded | `c="gray.5"` ×177, `c="gray.7"` ×32, `c="gray.8"` ×7, `color="gray.1"` ×2, `c="brand.7"` ×2, `color="gray.8"` ×1, `c="green.6"` ×1, `bg="gray.1"` ×1, `bg="gray.0"` ×1 | **Yes** |
| Mantine keyword | `c="dimmed"` ×28, `c="white"` ×1 | **Yes** |
| CSS-var passthrough | `c="var(--muted-foreground)"` ×3, `color="var(--mantine-color-green-6)"` ×1, `color="var(--mantine-color-gray-5)"` ×1, `c="var(--color-overlay-foreground)"` ×1, `bg="var(--primary)"` ×1 | **Yes** |
| **Unregistered palette name** | **`color="blue"` ×2** | **No — these are the only two violations** |

This survey is the gate's acceptance test: **a correct Check 15 reports exactly 2 violations against the current
tree, and 0 after the fix.** Any other count means the gate is wrong, not the codebase.

### 3.8 The two affected stories are both in the rendered manifest

Queried against `.screenshots/rendered-assert/2026-07-29T14-20/manifest.json` (1184 cells, 71 distinct stories):

| storyId | Cells | Current verdicts |
|---|---:|---|
| `patterns-mantine-notificationpattern--default` | 16 | all `pass` |
| `patterns-mantine-adminsurfacepattern--default` | 16 | all `pass` |

So the authorized visual delta is **at most 32 of 1184 cells**; the other **1152 must stay byte-identical**.

### 3.9 `MantineNotificationPattern` has no production consumer

`grep -rn "MantineNotificationPattern" src/ --include=*.tsx --include=*.ts` excluding the barrel, its own file and
`.stories.` files → **0 hits** (the only other mention is a prose comment at `theme.ts:217`). Site 1 is
**story-only**, which is why this task carries no production-route risk. Site 2 is a story fixture. Neither is a
critical-flow surface (§13.1).

### 3.10 `check:stories` is a build precondition

`package.json` — `prebuild-storybook` = `node scripts/prepare-storybook-next15.mjs && node scripts/check-stories.mjs`.
A broken Check 15 therefore blocks `npm run build-storybook` and every downstream rendered gate. Treat a
false-positive as a P0, not a cosmetic issue.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D9, §3.5 | `scripts/check-stories.mjs` gains **Check 15**, following Check 14's structural pattern (own scope list, multi-line opening-tag collection, `fail()` reporting). `checksRan` becomes `15`. `storyFilesCount` is unchanged at 127. | P0 | AC1 |
| R2 | §3.6 | Check 15's scope is exactly the three directories named in §3.6, including `src/stories/patterns/mantine/`. | P0 | AC2 |
| R3 | §3.3, §3.7 | The registered-colour set is **derived from `theme.ts`**, not hard-coded as a literal list, so it cannot drift when a colour is added or removed. | P0 | AC3 |
| R4 | §3.7 | The gate allows all four legal value classes (registered bare, registered dot-shaded, Mantine keyword, CSS-var/CSS-colour passthrough) and produces **zero** false positives across ~360 occurrences. | P0 | AC4 |
| R5 | cl. 13, `docs/qa-profiles.md` Q4 | **Natural planted-violation proof:** Check 15 run against the tree **before** §7's source fixes reports **exactly 2** violations, naming both §3.2 sites with correct line numbers. Transcript quoted. | P0 | AC5 |
| R6 | cl. 13, Q4 | **Synthetic planted-violation proof:** after the fix, adding one unregistered colour prop (e.g. `color="cyan"`) to an in-scope file makes `check:stories` exit **1**; reverting restores exit **0**. Both transcripts quoted; the plant is reverted. | P0 | AC6 |
| R7 | D4, D8, §3.3 | Both `color="blue"` sites become `color="blueLight"`. No other prop, variant, size or structure changes at either site. | P0 | AC7 |
| R8 | §3.8 | The `--mantine-only` manifest shows **0 FAIL** and **0 verdict changes**; PNG-byte changes are confined to the ≤32 cells of the two §3.8 stories. Every other cell stays md5-identical. Each of the 32 is named as changed or unchanged, with a reason for any that did not change. | P0 | AC8 |
| R9 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript. | P0 | AC9 |
| R10 | cl. 7, 14 | Zero new i18n keys (parity stays 2215×4); `check:design-tokens` gains no violation in any touched file and stays at **44 / 0 stale-marker**; `check:file-integrity` and `check:mojibake` exit 0 **after** the records are written. | P1 | AC10 |
| R11 | §3.2, D7 | The three `orange` sites are **untouched**; `AdminUsersTable.tsx` does not appear in the diff. | P0 | AC11 |

---

## 5. Assumptions and open questions

- **A1 — the 2-violation count is a gate on your gate.** If your Check 15 reports anything other than exactly 2
  violations against the pre-fix tree, your regex or scope is wrong. Do **not** add an allowlist entry to reach 2.
  Fix the check. Report the real number you first observed either way (§14).
- **A2 — derive the registered set, do not retype it.** §3.7's list is orchestrator survey data for *your*
  verification, not a literal to paste into the script. R3 requires reading the set from `theme.ts`. If you cannot
  parse it robustly, **stop and report** rather than hard-coding eight strings.
- **A3 — `dimmed`, `white`, `black`, `bright` are Mantine keywords, not theme colours.** They are legal and must
  pass. Confirm the full keyword set from Mantine's own source before encoding it; do not rely on this list alone.
- **A4 — the visual delta is authorized and expected.** Unlike Task 684, this task **does** change static Storybook
  cells. That is the point of R7. It is not a regression to be minimised, but it **is** to be bounded: ≤32 cells,
  named individually.
- **A5 — the worktree starts CLEAN.** Task 684 is committed (`081c03e7f`) and pushed. Snapshot
  `git status --porcelain` before your first write and record the empty result. If it is not empty, **stop and
  report**; do not reconcile foreign paths and do not run mutating Git.
- **A6 — site 2 lives in a `.stories.tsx` file.** Editing a story is in scope here (it is the defect location), but
  change only the `color` value on that one Badge. Do not restructure the fixture, rename the export, or touch
  `STATUS_COLOR` two lines above.
- **A7 — `MantineNotificationPattern`'s sibling triggers are already correct.** `color="red"` and the success
  trigger are registered. Change only the info trigger.

**Open questions — none.** D4/D7/D8/D9 are decided; the target value is fixed by §3.3; the gate's scope is fixed by
§3.6 and its correctness criterion by §3.7.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 7, 9, 12, 13, 14, 16, 16b.
2. `docs/rule-index.md` — "Storybook / Visual Proof" **and** "Current Mantine path".
3. `docs/qa-profiles.md` — the **Q4** row (planted-violation clause) and the Q3 row it inherits.
4. `docs/storybook-governance.md` — gate authorship conventions.
5. `docs/mantine-responsive-design-system.md` — colour/token resolution rules.
6. `docs/tailadmin-style-reference.md` — **§4 (colour ramps) only**; confirm `blueLight` is the registered info ramp.
7. `docs/qa-rules.md` — validation and encoding rules.
8. `docs/backlog.md` — the numbering line; the file is at exactly **80 lines** and must not grow.

**Source pre-read**

9. `scripts/check-stories.mjs` — **:110-140** (allowlist load + `fail()`), **:789-843** (Check 14, your structural
   model), **:844-896** (stale-allowlist check, `runGate` return, summary/exit).
10. `src/design-system/mantine/theme.ts` — **:66-77** (`blueLight` tuple), **:100-139** (the `primaryShade`
    commentary and the `colors` object).
11. `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` — **:70-95** (the three trigger Buttons).
12. `src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx` — **:70-85** (the `meta` fixture rows).
13. `src/design-system/mantine/notificationVariants.ts` — all lines (D4's precedent and its comment).
14. `node_modules/@mantine/core/esm/core/MantineProvider/merge-mantine-theme/merge-mantine-theme.mjs` — the
    `deepMerge` + `validateMantineTheme` pair quoted in §3.3.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `scripts/check-stories.mjs` | modify | R1–R4 — add Check 15; bump `checksRan` to 15. |
| `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` | modify | R7 — site 1, one prop value. |
| `src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx` | modify | R7 — site 2, one prop value. |
| `docs/backlog.md` | modify | Update the numbering line + add 685 state. **Stay ≤80 lines.** |
| `docs/sessions/2026-07-29-task685-unregistered-colour-gate.md` | **create** | Session log per §14. |

`.screenshots/` output is **local-only** by project policy (`.gitignore:55`, owner decision **D6** at the Task 684
review). Persist your evidence there and reference it by path; it will not appear in `git status`.

---

## 8. Out of scope

- **The three `orange` sites** (`AdminUsersTable.tsx:224`, `:264`, `:475`) — **Task 686**, per D7. If they look
  wrong, that is because they are; report, do not edit.
- **Widening Check 15's scope beyond §3.6's three directories** — Task 686 does that. A wider scope here would
  fail the gate on the orange sites and force an allowlist entry, which D7 explicitly avoids.
- **`theme.ts`** — no new colour tuple, no `blue` registration, no `primaryShade` change. The fix is to stop using
  an unregistered name, not to register it.
- **`notificationVariants.ts`, `src/lib/toast.ts`, `MantineRootProvider.tsx`** — all correct as shipped by Tasks
  681/684.
- **`STATUS_COLOR` and every other fixture row** in `AdminSurfacePattern.stories.tsx`.
- **Check 14 and the other 13 checks** — do not refactor them to share your new helper. Add Check 15 alongside.
- **`scripts/story-realmode-allowlist.json`** — Check 15 must need no entry (§3.6).
- **Any mutating Git command.**

---

## 9. Current and required behavior

**Current.** `check:stories` runs 14 checks over 127 files and reports `0 violations`; no check inspects Mantine
colour-prop names, so two unregistered `color="blue"` props pass silently. Both render Mantine's stock
`blue[7]` = `#1c7ed6` (§3.3) — a colour absent from the project palette — one as a filled Button background in
`Patterns/Mantine/NotificationPattern`, one as light Badge text in `Patterns/Mantine/AdminSurfacePattern`. Three
further sites (`orange`) exist in production admin code and are equally undetected.

**Required after.** `check:stories` runs **15** checks over the same 127 files. Check 15 fails on any Mantine
colour prop naming a colour absent from `theme.ts`'s registered set, across the three §3.6 directories, with zero
false positives against the four legal value classes in §3.7. Both `blue` sites read `blueLight`, rendering
`#0086c9`. The gate exits 0 on the fixed tree and exits 1 on a planted violation. The three `orange` sites remain
untouched and outside the gate's scope, reserved for Task 686.

---

## 10. Implementation requirements

**I0 — clean-start protocol (before any write).** `git status --porcelain`; expect **zero** entries and record the
empty snapshot. Confirm Task 684 is in `HEAD` with `git log -1 --oneline` and quote the subject. Any non-empty
start state → **stop and report** (A5).

**I1 — reproduce the gap first.** Run `npm run check:stories` on the untouched tree and record it: **14 checks, 127
files, 0 violations**. That is the "before" state — the gate you are adding does not yet exist, and the defect is
invisible. A gate whose blind spot you never demonstrated is not a proven gate.

**I2 — write Check 15, then run it BEFORE fixing the sites.** This ordering is mandatory and is the natural
planted-violation proof (R5). The check must:

1. Derive the registered set from `theme.ts` (R3) — parse the `colors: { … }` object at `:139`.
2. Scope to the three directories in §3.6 (R2).
3. Match colour-bearing props (`color`, `c`, `bg`) on Mantine elements, handling opening tags that wrap across
   lines exactly as Check 14 does at `:806-821`.
4. Accept: registered name bare; registered name with `.0`–`.9` shade suffix; Mantine keywords (A3); any value
   starting `var(`, `#`, `rgb`, `hsl`.
5. Reject anything else, reporting via `fail()` with the real file, line, a stable rule name, and a detail string
   naming the offending value and the registered set.

Then run `npm run check:stories`. **Expected: exit 1, exactly 2 violations**, at
`MantineNotificationPattern.tsx:81` and `AdminSurfacePattern.stories.tsx:79`. Quote the transcript verbatim. If the
count is not 2, fix the check — never the count (A1).

**I3 — fix both sites.** `color="blue"` → `color="blueLight"` at both locations. Nothing else on either line.
Re-run `npm run check:stories`: **exit 0, 15 checks, 127 files, 0 violations.** Quote it.

**I4 — synthetic plant (R6).** Add one unregistered colour prop (e.g. `color="cyan"`) to any in-scope file; run
`npm run check:stories` and confirm **exit 1** naming that line; revert the plant; re-run and confirm **exit 0**.
Quote all three transcripts and prove the revert with `git diff` on that file.

**I5 — rendered proof and the bounded delta.** Run `npm run build-storybook`, then
`npm run screenshots:assert -- --mantine-only`. Compare the full manifest against the declared baseline
`.screenshots/rendered-assert/2026-07-29T14-20/` (Task 684's approved post-change run — **not** `06-49`). Required:
0 FAIL, **0 verdict changes**. Then compare **PNG md5s** cell-by-cell against that same baseline and produce a
table: every changed cell must belong to one of the two §3.8 stories; name which of the 32 changed and give a
concrete reason for any that did not (e.g. the Badge is not visible at that viewport). Persist the md5 comparison
under `.screenshots/task685-delta/`.

**I6 — gates.** §13.3, in order. `npm run build` runs **last**.

**I7 — records.** Session log per §14. Update `docs/backlog.md`: the numbering line (`last used: 685`,
`NEXT FREE: 687` once 686 is filed) and 685's state. The file is at exactly **80 lines**; edit in place, do not
grow it. Flag `BACKLOG LIMIT BREACH` if you cannot.

**I8 — re-run the encoding gates after I7.** `check:file-integrity` and `check:mojibake` must run **after** the
session log and backlog edit exist, so their changed-set includes them. (Task 684's review found these had run
before the records were written and therefore never covered them.)

**I9 — order of operations.** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8.

---

## 11. Positive and negative flows

### Positive flow

A developer adds `<Badge color="teal">` to a Mantine pattern and pushes. `npm run check:stories` — already a
`prebuild-storybook` precondition (§3.10) — exits 1 naming the file, line and offending value, and the Storybook
build never starts. The developer changes it to a registered colour and the gate passes.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Registered colour, dot-shaded** (`c="gray.5"` ×177) | **Yes** | §3.7 | passes — shade suffix stripped before lookup | AC4 |
| **Mantine keyword** (`c="dimmed"`, `c="white"`) | **Yes** | §3.7, A3 | passes — keyword set, not theme lookup | AC4 |
| **CSS-var passthrough** (`c="var(--muted-foreground)"`) | **Yes** | §3.7 | passes — `var(`/`#`/`rgb`/`hsl` prefix escape | AC4 |
| **Multi-line opening tag** | **Yes** | §3.5 (`:806-821`) | prop on a wrapped tag is still matched — site 1 is exactly this shape | AC5 (site 1 must be found) |
| **Colour prop in a comment** | **Yes** | Check 14 precedent `:809` | comment lines skipped, no violation | AC4 |
| **Out-of-scope file with a real violation** (`AdminUsersTable.tsx` `orange` ×3) | **Yes** | §3.6, D7 | **not** reported — proves the scope boundary holds | AC11 |
| **Colour added to / removed from `theme.ts`** | **Yes** | R3 | the registered set follows automatically; no script edit needed | AC3 |
| **Zero violations** (post-fix tree) | **Yes** | §3.7 | exit 0, `checksRan: 15`, 127 files | AC1, AC5 |
| Validation / authorization / RLS | No | No data path; a build-time script and two prop values | N/A | — |
| Locale expansion | No | No user-facing string added or changed; colour props are not localized | N/A | — |
| Small viewport | No — for the *gate* | Node script, no rendered surface | N/A | — |
| Small viewport — for the *visual delta* | **Yes** | cl. 12 | the 32 affected cells include mobile-320/375/390 | AC8 |
| RTL | No | Project has no RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final `scripts/check-stories.mjs`, *then* `runGate` returns `checksRan: 15`,
  `storyFilesCount` is unchanged, `npm run check:stories` prints `15` check headers and
  `✅ check:stories PASSED — 127 files checked, 0 violations.`, and exits **0**.
- **AC2 [R2]** — *Given* Check 15's scope list, *then* it names exactly the three §3.6 directories, and
  `src/stories/patterns/mantine/` is present. Quote the code.
- **AC3 [R3]** — *Given* the implementation, *then* the registered set is read from `theme.ts` at runtime, not
  written as a literal array of colour names. Demonstrate by describing what the check would do if a colour were
  added to `theme.ts:139` — no script edit required.
- **AC4 [R4]** — *Given* the post-fix tree, *then* Check 15 reports **0** violations across ~360 colour-prop
  occurrences, with all four §3.7 value classes present in the scanned files. Zero false positives.
- **AC5 [R5]** — *Given* Check 15 run on the tree **before** §7's source fixes, *then* it exits **1** with
  **exactly 2** violations, at `MantineNotificationPattern.tsx:81` and `AdminSurfacePattern.stories.tsx:79`.
  Transcript quoted verbatim. This is the natural planted-violation proof.
- **AC6 [R6]** — *Given* a synthetic unregistered colour prop added post-fix, *then* `check:stories` exits **1**
  naming it; *and* after revert it exits **0**. All three transcripts quoted; `git diff` proves the revert.
- **AC7 [R7]** — *Given* the final diff, *then* both sites read `color="blueLight"`;
  `grep -rn 'color="blue"' src/` returns **0 hits**; and neither line changed in any other respect.
- **AC8 [R8]** — *Given* a fresh `build-storybook` + `--mantine-only` run compared to the `2026-07-29T14-20`
  baseline, *then* 0 FAIL, **0 verdict changes**, and the PNG-md5 delta is a subset of the 32 cells of
  `patterns-mantine-notificationpattern--default` and `patterns-mantine-adminsurfacepattern--default`. Every one of
  the 32 is listed as changed or unchanged-with-reason, and **no** cell outside those two stories changed.
- **AC9 [R9]** — `npm run build` exits 0 on a fresh post-change transcript. Report the page count and quote the
  transcript tail **including the route table**; do not cite `.next/BUILD_ID`.
- **AC10 [R10]** — `check:i18n` exits 0 at 2215×4 with no new keys; `check:design-tokens` shows **44 / 0
  stale-marker** with 0 violations in any touched file; `check:file-integrity` and `check:mojibake` exit 0 **and
  their scanned set includes the session log and `docs/backlog.md`** (run them after I7 — quote the file count).
- **AC11 [R11]** — *Given* the final `git status --porcelain`, *then* `AdminUsersTable.tsx` is absent; *and*
  `grep -rn 'orange' src/components/admin/AdminUsersTable.tsx` still returns the three §3.2 hits unchanged.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, selected for the **gate claim**, not for a critical flow: `docs/qa-profiles.md`
requires "planted-violation failure proof when a gate is claimed", and cl. 13 requires machine-produced evidence
that a new gate asserts observable behavior. Q4 inherits Q3's visual obligations, which this task genuinely needs
(§3.8's authorized 32-cell delta), and Q1's gates including the zero-exit build.

**No `docs/critical-flow-registry.md` row is touched.** Rows `:43`/`:61` run through `src/lib/toast.ts`
(untouched); row `:45` is `AdminUsersTable.tsx` (explicitly out of scope, D7). Site 1 is story-only (§3.9) and site
2 is a story fixture. State this explicitly in the log rather than implying critical-flow coverage.

**Declared proof path.** `MANTINE_VIEWPORTS` (320/375/390/1024) × sq/en/uk/it, the same 4-width boundary declared
by Tasks 675 and 684. The remaining canonical widths are **Task 678's** scope and must be reported as a boundary,
never as satisfied full-matrix coverage.

**TailAdmin side-by-side:** **not required** — no new visual value is introduced. `blueLight` is an existing
registered ramp traced to `docs/tailadmin-style-reference.md` §4. Confirm `theme.ts` is absent from the diff.

### 13.2 Worktree

Start state expected **clean** — Task 684 is committed (`081c03e7f`) and pushed. Snapshot `git status --porcelain`
before the first write and record the empty result. If it is not clean, **stop and report**. No dirty-worktree
manifest is required.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run check:stories` (pre-Check-15) | 0 — 14 checks, 127 files, 0 violations (the I1 "before") |
| `npm run check:stories` (post-Check-15, pre-fix) | **1 — exactly 2 violations** (AC5) |
| `npm run check:stories` (post-fix) | 0 — 15 checks, 127 files, 0 violations |
| `npm run check:stories` (synthetic plant / revert) | 1 then 0 (AC6) |
| `npm run typecheck` | 0 |
| `npx vitest run src/lib/__tests__/toast.smoke.test.ts` | 0 — 4/4 |
| `npx vitest run` (full suite) | 0 new failures attributable to this diff; report any pre-existing full-run-only timeout with its isolated re-run (documented set: `date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`) |
| `npm run check:story-coverage` | 0, total unchanged at 15/15 |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL; 0 verdict changes vs `2026-07-29T14-20`; PNG-md5 delta ⊆ the 32 cells of the two §3.8 stories |
| `npm run check:design-tokens` | **44 / 0 stale-marker**; 0 in touched files |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I7**, scanned set must include the session log and backlog |
| `npm run build` | **0 — hard gate**, transcript tail **including the route table** quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-29-task685-unregistered-colour-gate.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7's paths only.
2. The empty start snapshot and the **true final** `git status --porcelain` — taken *after* the records are written,
   so it includes them. (Task 684's log quoted a pre-records snapshot as "final"; do not repeat that.)
3. R1–R11 mapped to AC1–AC11 with evidence.
4. The Check 15 implementation rationale: how the registered set is derived from `theme.ts`, how each of §3.7's four
   legal classes is accepted, and how multi-line tags are handled.
5. **The first violation count you observed** from your own Check 15, before any adjustment — even if it was not 2
   (A1). State what you changed and why.
6. All `check:stories` transcripts: before-Check-15, post-Check-15-pre-fix (the 2-violation failure),
   post-fix, and the synthetic plant/revert pair.
7. The PNG-md5 delta table: all 32 candidate cells, each marked changed or unchanged-with-reason, plus explicit
   confirmation that no cell outside the two stories changed.
8. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim including the
   route table.
9. Proof the synthetic plant is reverted (`git diff` on that file).
10. Deviations, each with a reason.
11. Limitations — at minimum: the declared 4-width proof path (§13.1); that Check 15's scope deliberately excludes
    `src/components/` so the three `orange` sites stay green until **Task 686**; that no critical-flow row is
    touched (§13.1); and that `.screenshots/` evidence is local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_685_Unregistered_Mantine_Colour_Gate_And_Blue_Fix.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Info-trigger Button fill | `MantineNotificationPattern.tsx:81` `<Button color>` | `--button-bg` via Mantine `variantColorResolver` | `blue[7]` `#1c7ed6` (DEFAULT_COLORS, survives `deepMerge`) → `blueLight[7]` `#0086c9` (`theme.ts:74`) | **changed — D4/D9** | AC7, AC8 |
| Role Badge text | `AdminSurfacePattern.stories.tsx:79` `<Badge color variant="light">` | `--badge-color`, light variant reads index 7 (`primaryShade: 7`, Task 620) | same ramp swap as above | **changed — D8** | AC7, AC8 |
| Sibling trigger Buttons (`red`, success) | same file `:73-79` | unchanged | registered ramps | **reuse, untouched** | A7 |
| Status Badge in the same fixture row | `AdminSurfacePattern.stories.tsx:72` `STATUS_COLOR[...] ?? 'gray'` | unchanged | registered ramps | **out of scope** | A6 |
| Badge geometry/typography | `theme.ts:443-461` `Badge.styles` | `root` | §6b/§6l — 12px/18px, `radius: pill` | **reuse, not in diff** | §13.1 |
| Button geometry/typography | `theme.ts:238-239` `Button.defaultProps` | `root` | §6a — `radius: lg`, `size: sm` | **reuse, not in diff** | §13.1 |

## 16. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Info-trigger Button colour | `grep -rnE '(color\|c\|bg)="(dark\|pink\|…\|orange)"' src/` → 5 hits (§3.2); read `theme.ts:66-77,139`; read `notificationVariants.ts`; read `merge-mantine-theme.mjs` | `Patterns/Mantine/NotificationPattern` (`src/stories/patterns/mantine/NotificationPattern.stories.tsx`), 16 manifest cells, currently all `pass` | **reuse** — consume the registered `blueLight` ramp; no new value, no local style | `theme.ts:66-77` `blueLight`; already registered at `:139`; no catalog/coverage change |
| Role Badge colour | same sweep; read `AdminSurfacePattern.stories.tsx:70-85`; confirmed `STATUS_COLOR` is a separate, already-registered map | `Patterns/Mantine/AdminSurfacePattern`, 16 manifest cells, currently all `pass` | **reuse** — same registered ramp, per D8 | as above |
| The gate itself | `grep -rn "registered\|theme.colors\|colorProp" scripts/check-stories.mjs scripts/check-design-tokens.mjs` → 0 hits; read Check 14 at `:789-843` as the structural model | No Story renders a lint gate — it is a Node script | **extend** — add Check 15 to the existing `check-stories.mjs` rather than a new script | `scripts/check-stories.mjs`; registered set derived from `theme.ts:139` (R3) |

**Clause 16a is not triggered:** no new visual value is invented. Both changed props adopt an already-registered
ramp whose TailAdmin provenance is `docs/tailadmin-style-reference.md` §4.

## 17. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 5 sites found, 2 authorized | Exactly 3 `src`/`scripts` files changed; `AdminUsersTable.tsx` absent | AC7, AC11 | required |
| cl. 7 (four locales) | Colour change affects all locales | Zero new keys; all 4 locales in the 32-cell delta | AC8, AC10 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table quoted | AC9 | required |
| cl. 12 (rendered evidence follows risk) | Q4/Q3, real visual delta | Live manifest comparison, PNG-md5 delta bounded and itemised | AC8 | required |
| cl. 13 (Storybook + no-hardcode gates enforceable) | **A new gate is claimed** | Planted-violation failure proof, natural **and** synthetic | AC5, AC6 | required |
| cl. 14 (file integrity) | 3 modified + 1 created text file | UTF-8 no BOM, no mojibake, scanned set includes the records | AC10 | required |
| cl. 16 (TailAdmin visual source) | Colour ramp in scope | `blueLight` traced to §4; `theme.ts` absent from diff | §13.1 | required |
| cl. 16b (canonical provenance before code) | Two visible artifacts | Canonical search recorded; disposition `reuse` for both | §16 | required |
| cl. 15 (critical flows) | **No registry row touched** | State the negative explicitly; do not imply coverage | §13.1 | required |
| cl. 10 (git ownership) | Task 684 committed + pushed | Clean start; diff limited to §7; no mutating Git by the executor | AC11 | required |

## 18. Execution contract

| Field | Value |
|---|---|
| Task | 685 |
| Active route / owner decision | Single route: add Check 15 to `check-stories.mjs` with a `theme.ts`-derived registered set over the three §3.6 directories, prove it fails on the 2 real sites **before** fixing them, then set both to `blueLight` (owner D7/D8/D9, 2026-07-29; D4 standing) |
| Decision source, date, scope | Owner, 2026-07-29 at the Task 684 review follow-up; scope = the two `blue` sites + the gate; **no** `orange` fix, **no** `theme.ts` change, **no** scope widening |
| Starting worktree mode | **clean** — Task 684 committed `081c03e7f` and pushed; §13.2 sets the stop condition |
| Producer of each checkpoint | clean-start snapshot → pre-gate `check:stories` baseline → Check 15 authored → **2-violation natural failure** → both sites fixed → 0-violation pass → synthetic plant/revert → storybook + manifest + md5 delta → gates → build → records → post-records encoding gates |
| Persisted result | start/end porcelain snapshots; four+ `check:stories` transcripts; `.screenshots/task685-delta/` md5 comparison; manifest verdict diff; build transcript tail with route table; session log |
| Comparator | **exactly 2** violations pre-fix and **0** post-fix; synthetic plant exit 1 → revert exit 0; manifest **0 verdict changes** vs `2026-07-29T14-20`; PNG-md5 delta ⊆ 32 named cells with 0 outside; `AdminUsersTable.tsx` absent from the diff |
| Failure path | Non-empty start state → stop (A5); Check 15 reports ≠2 pre-fix → fix the check, never the count, and report the first observed number (A1); cannot derive the registered set from `theme.ts` → stop, do not hard-code (A2); a cell outside the two stories changes → stop and report, do not accept |
| Zero/empty input case | The post-fix tree is the zero case: Check 15 must report **0** violations and still print its header and count — a check that silently no-ops when clean is indistinguishable from one that never ran. Confirm the header appears in the passing transcript. |
| Task-created artifacts in baselines | `.screenshots/task685-delta/` is task-created with **no** pre-change baseline — evidence, not a regression surface. The `--mantine-only` manifest baseline is `2026-07-29T14-20` (Task 684's **approved** post-change run), **not** `06-49` and **not** `13-45` (the flake run) |

## 19. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, count, command, hex value and all four owner rulings are inline |
| Every primary requirement has a binary AC | **Yes** — R1–R11 → AC1–AC11 |
| Scope names what must not change | **Yes** — §8, incl. the `orange` sites, `theme.ts`, Check 14, the allowlist, and the gate's own scope width |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4 (selected for the gate claim, with the critical-flow negative stated); §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; the search found `blueLight` already registered, so both dispositions are `reuse` and no new value is invented |
| Owner-only exceptions traceable | **Yes** — D4 standing, D7/D8/D9 new, each with question, ruling, date and scope (§3.1) |
| Baselines account for task-created artifacts | **Yes** — §18 row 9 names the correct manifest baseline and marks the delta directory as evidence |
| Worktree handling | **Yes** — clean start asserted against a named commit with a stop condition (§3, §13.2, A5) |
| Gates prove the changed behavior | **Yes** — the gate is proven by a **natural** 2-violation failure before the fix (AC5) *and* a synthetic plant after (AC6); the visual delta is bounded by md5 rather than eyeballed (AC8) |
| Single active owner route | **Yes** — the only forks are A5's non-empty-start stop, A1's wrong-count stop, and A2's cannot-derive stop |
| API claims verified, not assumed | **Yes** — §3.3 quotes the installed `merge-mantine-theme.mjs` and `default-colors.mjs`; §3.5 cites real line numbers in `check-stories.mjs`; §3.7 is a real `uniq -c` survey; §3.8 is a real manifest query |

**Known-risk note for the reviewer.** Six likely defects. First, **copying Check 14's scope verbatim** and thereby
missing `src/stories/patterns/mantine/` — §3.6 calls this out and AC5 detects it, because a wrong scope yields 1
violation, not 2. Second, **hard-coding the eight colour names** instead of deriving them from `theme.ts` — A2 makes
that a stop and AC3 tests it. Third, **false positives on `c="gray.5"` (177 occurrences) or `c="dimmed"`** — §3.7
gives the full real distribution and AC4 requires zero. Fourth, **fixing the sites before running the gate**, which
destroys the natural planted-violation proof — I2's ordering is mandatory and AC5 requires the 2-violation
transcript. Fifth, **accepting an unexplained manifest delta** — AC8 requires every changed cell to be named and
every cell outside the two stories to be unchanged. Sixth, **quietly adjusting the check until it reports 2** rather
than fixing a genuine scope/regex error — §14 item 5 requires reporting the first observed count.
