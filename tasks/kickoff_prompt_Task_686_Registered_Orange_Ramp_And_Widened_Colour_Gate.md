# Task 686 — Register the TailAdmin `orange` ramp, close `ROLE_COLOR.agent`, and widen `check:stories` Check 15 to all of `src/` (forms A+B+C)

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** Storybook / visual governance — **gate extension** (`docs/rule-index.md` → "Storybook / Visual Proof").
- **Secondary types:** design-system conformance (cl. 16, 16a, 16b — a new registered colour ramp with TailAdmin
  provenance); production admin UI (current Mantine path); critical-flow-adjacent file edit (§3.9).
- **Origin:** Task 685 shipped Check 15 over three Mantine story/pattern directories and fixed the two literal
  `color="blue"` sites. Its review (`APPROVED WITH NOTES`, 2026-07-29, commit `ef05a92e5`) raised **F2** (the gate
  cannot see expression-valued props) and **F3** (latent false positives on legal CSS values), and D7 had already
  deferred the `orange` audit here. A fresh orchestrator sweep during this task's design found the residue is
  **larger in form but smaller in blast radius** than D7 assumed — see §3.2. Owner decisions **D11/D13**
  (2026-07-29) set this task's scope; **D12** is derived from standing **D4/D8**.

> **Read this first.** Task 685 is committed as `ef05a92e5` and the worktree is **clean**. This task is not a
> revision — it closes the unregistered-colour class repository-wide and retires the gate's three known blind spots.

---

## 2. Objective

1. **Register `orange`** in `src/design-system/mantine/theme.ts` from the authoritative TailAdmin §4 ramp (D11),
   so the five existing `orange` usages stop resolving to Mantine's stock palette.
2. **Fix `ROLE_COLOR.agent: 'blue'` → `'blueLight'`** (D12), restoring parity with the canonical story fixture that
   Task 685 already moved to `blueLight`.
3. **Widen Check 15** to all of `src/`, teach it the two forms it currently cannot see (**B** — `var(--mantine-color-*)`;
   **C** — colour maps), and add the CSS-value passthrough that a repository-wide scope requires (D13).
4. Prove the widened gate with a **three-stage natural planted-violation ladder — 7 → 1 → 0** — and add the
   `Check 15` unit-test block that `scripts/__tests__/check-stories.test.ts` has never had.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` at commit
`ef05a92e5` on 2026-07-29. Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 Owner decisions

| ID | Question put to the owner | Ruling |
|---|---|---|
| **D4** (Task 681, standing) | `VARIANT_COLORS.info` was `blue`; `blue` is unregistered. | **`blueLight` RATIFIED.** |
| **D7** (Task 685, standing) | The three `orange` sites in `AdminUsersTable.tsx`. | **Deferred to 686** — needs a colour decision with no provenance at that time. Discharged by D11. |
| **D8** (Task 685, standing) | Role Badge "Agent" target value. | **`blueLight`.** Applied to the story fixture in 685. |
| **D10** (Task 685 **review** ruling, orchestrator, 2026-07-29) | AC8's byte-level clause "no cell outside the two stories changed" was not met (84 cells). | **Re-scoped.** The clause is unsatisfiable in this harness; three zero-code-diff control pairs differ by 75/91/98 cells across the same animated/async story set. The binding comparator is **0 verdict changes**, plus per-story attribution of target cells. This task inherits that comparator. |
| **D11** (this task) | `orange` is unregistered and carries two semantics (role `moderator`; the `location_request` signal). Remap or register? | **Register `orange` in `theme.ts`** from TailAdmin §4. Both semantics stay orange; the change is legalisation, not re-design. |
| **D12** (derived, not new) | `ROLE_COLOR.agent: 'blue'`. | **`blueLight`**, by direct application of standing **D4/D8**. No new owner ruling is claimed. Flag it in the report; the owner may override at review. |
| **D13** (this task) | How far to widen Check 15? | **All of `src/`, plus forms B and C, plus the F3 passthrough fix.** A wide scope without the passthrough fix would turn legal CSS values into build-blocking false positives (§3.10). |

D11 and D13 are the source of truth for scope.

### 3.2 The complete defect surface — orchestrator sweep, 2026-07-29

A survey replicating the *widened* Check 15 logic was executed over **all 611 `.ts`/`.tsx` files under `src/`**
(registered set derived from `theme.ts:139` = `brand, gray, green, yellow, red, blueLight, purple, sale`). Result —
**7 violations, every one of them in a single file**:

| Form | # | Site | Value | Seen by today's Check 15? |
|---|---:|---|---|---|
| **A** — literal colour prop | 1 | `src/components/admin/AdminUsersTable.tsx:224` | `c="orange.6"` | No — scope excludes `src/components/` |
| **A** | 2 | `AdminUsersTable.tsx:264` | `c="orange.6"` | No — same |
| **A** | 3 | `AdminUsersTable.tsx:475` | `color="orange"` (Button `variant="light"`) | No — same |
| **B** — `var(--mantine-color-*)` | 4 | `AdminUsersTable.tsx:223` | `style={{ color: 'var(--mantine-color-orange-6)' }}` on `<MapPin>` | **No — the `var(` passthrough legalises it** |
| **B** | 5 | `AdminUsersTable.tsx:263` | same | **No — same** |
| **C** — colour map | 6 | `AdminUsersTable.tsx:29` | `ROLE_COLOR.agent: 'blue'` | **No — value is an expression at the consumer (F2)** |
| **C** | 7 | `AdminUsersTable.tsx:29` | `ROLE_COLOR.moderator: 'orange'` | **No — same** |

`ROLE_COLOR` is consumed at `:197` and `:278` as `<Badge color={ROLE_COLOR[u.role] ?? 'gray'} variant="light" size="sm">`.
No other file in `src/` contains an unregistered Mantine colour in any of the three forms. `CaptchaWidget.tsx:15`
(`theme?: 'light' | 'dark' | 'auto'`) is a widget-theme union, **not** a colour prop — excluded by the Form-C rule
(§3.7), verified as a non-hit in the survey.

**This 7 is the acceptance test for the widened gate** (§10 I2, AC5). Any other first-observed number means the
scope or a form-rule is wrong — fix the check, never the count.

### 3.3 Why registering `orange` is legal, not invention (cl. 16a)

`docs/tailadmin-style-reference.md` §4, **line 46**, is an authoritative ramp row:

```
| orange | #fff6ed | — | — | — | #fd853a | #fb6514 | — | — | — | — | — |
```

Header row: `| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |`. So exactly **three**
authoritative stops exist: **50 = `#fff6ed`**, **400 = `#fd853a`**, **500 = `#fb6514`**.

A sparse TailAdmin ramp already has a registered precedent in this file: `blueLight` (`theme.ts:66-77`) has four
authoritative stops and fills the remaining six indices with the nearest §4 stop, each annotated
`UNUSED (placeholder = nearest §4 stop, not consumed)`. **Follow that convention exactly.** Do not invent
intermediate shades and do not label a placeholder as authoritative.

`scripts/design-tokens-allowlist.json:2` path-allowlists `src/design-system/mantine` because "theme.ts requires raw
hex colors … as createTheme() inputs". Adding a tuple therefore **must not** change the `check:design-tokens`
baseline of **44 / 0 stale-marker**.

### 3.4 Which indices are actually consumed, and the exact rendered delta

`theme.ts:138` sets `primaryShade: 7` as a plain number, which (Task 619/620, commentary at `theme.ts:100+`) makes
Mantine return index **7** for every colour's `-light`/`-filled`/`-light-color` variables — not just `primaryColor`.
So of the five `orange` sites, exactly two indices are consumed:

| Index | Consumers | Renders today (Mantine stock) | After registration |
|---:|---|---|---|
| **6** | `c="orange.6"` ×2 (`:224`, `:264`), `var(--mantine-color-orange-6)` ×2 (`:223`, `:263`) | `#fd7e14` | `#fb6514` |
| **7** | `color="orange"` Button `variant="light"` (`:475`), `ROLE_COLOR.moderator` Badge `variant="light"` (`:197`/`:278`) | `#f76707` | `#fb6514` |

Stock values read from `node_modules/@mantine/core/esm/core/MantineProvider/default-colors.mjs`
(`orange: [#fff4e6, #ffe8cc, #ffd8a8, #ffc078, #ffa94d, #ff922b, #fd7e14, #f76707, #e8590c, #d9480f]`).

Both shifts are small and confined to `/admin/users`. Indices 1, 2, 3, 8, 9 are **not consumed by anything** —
verified by the §3.2 sweep — so their placeholder values carry no rendered risk. Where an index is equidistant
between two authoritative stops (index 2 sits two steps from both 0 and 4), **resolve downward** and say so in the
comment; do not agonise over an unconsumed slot.

### 3.5 `check-stories.mjs` mechanics — read at source

- **964 lines total.**
- `collectFiles(dir, exts)` at **:54-65** — recursive, skips `node_modules`/`.next`/`storybook-static`, returns `[]`
  for a missing directory.
- `fail(file, line, rule, detail)` at **:140**.
- **Check 15** occupies **:849-910**: `COLOR_SCOPE_FILES` (:853), `loadRegisteredColorNames()` (:861),
  `REGISTERED_COLORS` (:875), `MANTINE_COLOR_KEYWORDS` (:879), `COLOR_PROP_RE` (:881),
  `isRegisteredColorValue()` (:883), the scan loop (:891-910).
- The "Stale allowlist entry check" runs at **:912-935**.
- `runGate` returns `{ violations, storyFilesCount: STORY_FILES.length, checksRan: 15 }` at **:940**.
- `storyFilesCount` is `STORY_FILES.length` (**127**) and is independent of any check's own scope list.
  **Widening Check 15 must not change it, and `checksRan` stays 15** — this task extends a check, it does not add one.

### 3.6 The `makeRoot()` hazard — read this before writing a single test

`scripts/__tests__/check-stories.test.ts:36-47` builds every test root with `makeRoot()`, which creates
`src/stories/fixtures`, `src/components`, `src/modules` and `messages/*.json` — **and no
`src/design-system/mantine/theme.ts`**.

Today that is harmless: Check 15's three scope directories do not exist in a test root, so `collectFiles` returns
`[]` and nothing is scanned. **The moment the scope becomes all of `src/`, that changes.**
`loadRegisteredColorNames()` returns an **empty Set** when `theme.ts` is missing, so every colour value in every
test fixture — including a deliberately-legal `color="brand"` — becomes a violation, and the existing
count-asserting tests break.

**Required resolution:** extend `makeRoot()` to write a minimal real
`src/design-system/mantine/theme.ts` containing a `colors: { … }` object with the project's eight registered names
plus `orange`. **Do not** make Check 15 skip when the registered set is empty — a check that silently no-ops when
its input is missing is indistinguishable from one that never ran, which is exactly the failure mode the Task 685
contract forbade. An underivable registered set must stay loud (§10 I2.6).

### 3.7 Form rules — precise, deterministic, derived not typed

The Mantine **stock palette set** must be derived at runtime from
`node_modules/@mantine/core/esm/core/MantineProvider/default-colors.mjs` (keys of `DEFAULT_COLORS`), minus the
registered set. Do **not** retype the fourteen names (A2 discipline, inherited from Task 685 R3). If that set cannot
be derived, `fail()` loudly with its own rule name — never fall back to an empty set (§10 I2.6).

| Form | Rule | Reports |
|---|---|---|
| **A** | `\b(color\|c\|bg)="value"` on a non-comment line, where `value` is not legal per §3.10 | file, line, prop, value |
| **B** | `var(--mantine-color-<name>-<digit>)` where `<name>` is a stock-palette key absent from the registered set | file, line, the full `var()` text |
| **C** | a `const <IDENT>` object literal whose identifier matches `/COLOR/i`, containing a string-literal value (optionally `.<digit>`-shaded) that is a stock-palette key absent from the registered set | file, line, map name, value |

Form C is deliberately narrowed to `*COLOR*`-named maps and to *known stock palette names*, not "any unregistered
string" — colour maps also hold keys, CSS values and unrelated strings. The survey confirms this rule yields
**zero** false positives across `src/` while still catching `ROLE_COLOR` (and it also covers
`notificationVariants.ts`'s `VARIANT_COLORS`, the map form of the original Task 681 defect, which is currently clean).

### 3.8 Form C does not make the gate an expression analyser

Form C closes the *map* shape, which is where every real instance of F2 lives in this repository. Free-form
expressions (`color={cond ? 'teal' : 'gray'}`, `color={props.color}`) remain outside the gate. State that as a
declared boundary in the session log; do not claim the gate is now total.

### 3.9 Critical flow — the file is registry-listed, the changed behaviour is not

`docs/critical-flow-registry.md:45` — "Verify / revoke agent (table action)", `toggleUserVerified` ←
`AdminUsersTable.tsx` (Task 483). Its authoritative automated coverage is
`npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` (**14 tests**, including a
`location_request badge` case).

This task edits that file but changes **no** behaviour in that flow — only colour values. cl. 15 therefore requires
the existing coverage to be **run and reported green as regression evidence**, and the negative to be stated
explicitly. The smoke test's Badge mock at **`:98-99`** renders `data-color={color}`, which makes the role-colour
value directly assertable — use it (R9).

### 3.10 The passthrough set (F3) — mandatory once the scope is repository-wide

Today's `isRegisteredColorValue()` accepts only `var(`, `#`, `rgb`, `hsl` prefixes. Under a repository-wide scope
these legal values would become build-blocking failures — `check:stories` is a `prebuild-storybook` precondition
(`package.json`), so a false positive is a **P0**, not a cosmetic issue. Verified by planting each into an in-scope
file during the Task 685 review: `bg="transparent"`, `color="currentColor"`, `c="oklch(0.6 0.2 20)"` and
`bg="linear-gradient(90deg, #fff, #000)"` each produced exit 1.

Replace the prefix list with: value starts with `#`; **or** matches a CSS function call `/^[a-z-]+\(/` (this
subsumes `var()`, `rgb()`, `rgba()`, `hsl()`, `oklch()`, `lab()`, `color()`, every `*-gradient()`); **or** is one of
the CSS-wide keywords `transparent`, `currentColor`, `inherit`, `initial`, `unset`, `revert`, `none`; **or** is a
Mantine keyword (`dimmed`, `bright`, `white`, `black`); **or** is a registered name, optionally `.0`–`.9` shaded.

Note the interaction: Form A's `var()` passthrough stays, and **Form B is what re-catches an unregistered ramp
smuggled in through a CSS variable**. The two rules are complementary by design; do not remove the `var()`
passthrough from Form A.

The §3.2 survey also measured the false-positive surface of the widened scope directly: across all 611 files,
**0** colour-prop values would fail that are not one of the 7 real violations.

### 3.11 Rendered-coverage boundary — `Admin/AdminUsersTable` is not in the manifest

`scripts/check-stories-rendered.mjs` enrols stories **purely by title prefix** (`Mantine/Primitives/*` and
`Patterns/Mantine/*`, `:290-302`; the constant now lives in `scripts/lib/mantine-story-scope.mjs`). Its CLI accepts
only `--fast`, `--check`, `--mantine-only` (`:76-82`) — there is **no** story-filter flag.

`src/components/admin/AdminUsersTable.stories.tsx` exists, is titled **`Admin/AdminUsersTable`**, sets
`skipCanvas: true`, and renders the **real production component** with real fixtures
(`FIXTURE_USERS`, `FIXTURE_VERIFIED_AGENTS`). It is therefore **not** among the 71 enrolled stories / 1184 cells,
and no verified command can render it into the manifest.

**Consequence, and it must be declared, not papered over:** this task ships a real (small) production visual change
with **no pixel-level rendered gate**. Enrolling that story — by retitling it into a `Patterns/Mantine/*` prefix,
which would auto-add 16 cells to a hard-blocking CI gate for a complex admin table — is a governance change with its
own blast radius and is **reserved as Task 687**. Do not attempt it here, and do not claim manifest coverage for
`/admin/users`.

### 3.12 Story ↔ production parity, currently broken by 685

`src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx:79` renders the role Badge fixture as
`<Badge color="blueLight" variant="light" size="sm">Agent</Badge>` (changed by Task 685, D8). Production
`ROLE_COLOR.agent` is still `'blue'`. The canonical pattern story and the production surface are therefore
**divergent right now**; D12 closes that. Verify the parity explicitly (AC7) rather than assuming it.

Note for cl. 16c: the pattern story renders a **fixture stand-in**, not `AdminUsersTable`. The story that renders
the real component is `Admin/AdminUsersTable` (§3.11). Neither requires a Story edit in this task — the fixture is
already at the target value and the real-component story carries no colour props (verified: zero
`(color|c|bg)="…"` matches in `AdminUsersTable.stories.tsx`).

### 3.13 Manifest baseline

`.screenshots/rendered-assert/2026-07-29T16-29/` — Task 685's post-change run, independently re-derived during that
task's review (1184 cells, `passed: 1162`, `failed: 0`, `ambiguousOnly: 22`). **This is the baseline**, not `14-20`.

No enrolled story uses `orange` in any form (§3.2), so registering the ramp is expected to change **zero** enrolled
cells beyond the documented capture-noise set.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D11, §3.3 | `theme.ts` gains an `orange: MantineColorsTuple` built from TailAdmin §4's three authoritative stops, with every non-authoritative index annotated as a placeholder in the `blueLight` style, and `orange` added to the `colors: { … }` object at `:139`. Indices 6 and 7 are `#fb6514`. | P0 | AC1 |
| R2 | D13, §3.2 | Check 15's scope becomes all of `src/` (`.ts`/`.tsx`), replacing the three-directory list. `checksRan` stays **15**; `storyFilesCount` stays **127**. | P0 | AC2 |
| R3 | D13, §3.7 | Check 15 detects **Form B** — `var(--mantine-color-<stock-but-unregistered>-<digit>)`. | P0 | AC3 |
| R4 | D13, §3.7 | Check 15 detects **Form C** — a `*COLOR*`-named object literal whose string value is a stock-but-unregistered palette name. | P0 | AC4 |
| R5 | §3.2 | **Natural planted-violation ladder.** Against the untouched tree the widened check reports **exactly 7** violations at the §3.2 sites; after R1 only **1** remains (`ROLE_COLOR.agent`); after R6, **0**. All three transcripts quoted. | P0 | AC5 |
| R6 | D12, D4/D8, §3.12 | `ROLE_COLOR.agent` becomes `'blueLight'`. `moderator` stays `'orange'` (now registered). No other map entry changes. | P0 | AC6 |
| R7 | §3.10 | The passthrough set accepts `#`, any CSS function call, the CSS-wide keywords, the Mantine keywords, and registered names with an optional `.0`–`.9` shade — with **zero** false positives across all 611 `src/` files. | P0 | AC7 |
| R8 | §3.6, cl. 13 | `scripts/__tests__/check-stories.test.ts` gains a `Check 15` describe block with BAD **and** GOOD cases for forms A, B and C plus the F3 keyword/function classes, and `makeRoot()` writes a real `theme.ts` stub. The existing 91 tests still pass. | P0 | AC8 |
| R9 | cl. 15, §3.9 | `AdminUsersTable.smoke.test.tsx` passes unchanged in behaviour and gains assertions that the role Badge's `data-color` is `blueLight` for an agent row and `orange` for a moderator row. | P1 | AC9 |
| R10 | §3.13, D10 | `--mantine-only` shows **0 FAIL** and **0 verdict changes** vs `2026-07-29T16-29`. Any PNG-md5 delta is attributed per story; a changed cell outside the documented capture-noise set is a stop-and-report. | P0 | AC10 |
| R11 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript. | P0 | AC11 |
| R12 | cl. 7, 14, 16 | Zero new i18n keys (parity stays 2215×4); `check:design-tokens` stays **44 / 0 stale-marker** with 0 violations in any touched file; `check:file-integrity` and `check:mojibake` exit 0 **after** the records are written. | P1 | AC12 |

---

## 5. Assumptions and open questions

- **A1 — the 7/1/0 ladder is a gate on your gate.** Report the **first** number you observe at each stage, before any
  adjustment, even if it is not 7/1/0 (§14 item 5). If it differs, fix the check — never the count, and never reach
  the number with an allowlist entry.
- **A2 — derive both sets, do not retype them.** The registered set comes from `theme.ts` (already implemented); the
  stock palette set comes from Mantine's `default-colors.mjs`. If either cannot be derived, that is a loud `fail()`,
  not a silent empty set, and not a hard-coded literal (§3.7, §10 I2.6).
- **A3 — `theme.ts` is in scope this time.** Unlike Task 685 (§8 of which forbade it), D11 explicitly puts the
  `orange` tuple in scope. Nothing else in `theme.ts` changes: no `primaryShade` edit, no other tuple, no
  `Component.defaultProps`.
- **A4 — the visual delta is authorised, bounded, and ungated.** Two hexes shift on `/admin/users` (§3.4). That
  surface has no rendered gate (§3.11). Report it as a declared limitation; do not invent a capture command.
- **A5 — the worktree starts CLEAN.** Task 685 is committed (`ef05a92e5`). Snapshot `git status --porcelain` before
  your first write and record the empty result. If it is not empty, **stop and report**; do not reconcile foreign
  paths and do not run mutating Git.
- **A6 — `checksRan` stays 15.** This task extends Check 15; it does not add Check 16. The
  `checksRan === 15` assertion must **not** move.
- **A7 — do not retitle any story.** Story enrolment is Task 687 (§3.11, §8).
- **A8 — D12 is derived, not newly granted.** It applies standing D4/D8 to a third site. Say so in the report so the
  reviewer can confirm or override it.

**Open questions — none.** D11 and D13 are decided; D12 follows from standing precedent; the ramp's provenance is
fixed by §3.3 and the consumed indices by §3.4.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 7, 9, 12, 13, 14, 15, 16, 16a, 16b, 16c.
2. `docs/rule-index.md` — "Storybook / Visual Proof" **and** "Current Mantine path".
3. `docs/qa-profiles.md` — the **Q4** row (planted-violation clause) and the Q3 row it inherits.
4. `docs/storybook-governance.md` — gate authorship conventions.
5. `docs/tailadmin-style-reference.md` — **§4 only**, lines 39-46 (the ramp table incl. the `orange` row).
6. `docs/mantine-responsive-design-system.md` — colour/token resolution rules.
7. `docs/critical-flow-registry.md` — **row `:45` only**.
8. `docs/qa-rules.md` — validation and encoding rules.
9. `docs/backlog.md` — the numbering line; the file is at exactly **80 lines** and must not grow.

**Source pre-read**

10. `scripts/check-stories.mjs` — **:54-65** (`collectFiles`), **:140** (`fail`), **:849-910** (Check 15, the block
    you are rewriting), **:912-940** (stale-allowlist check and the `runGate` return).
11. `scripts/__tests__/check-stories.test.ts` — **:36-63** (`makeRoot` and the write helpers), **:736-794**
    (Check 13 as your describe-block model, and `gate completeness`).
12. `src/design-system/mantine/theme.ts` — **:66-77** (`blueLight`, your tuple template), **:100-139** (the
    `primaryShade` commentary and the `colors` object).
13. `src/components/admin/AdminUsersTable.tsx` — **:25-33** (`ROLE_COLOR`/`STATUS_COLOR`), **:195-200** and
    **:275-280** (the Badge consumers), **:218-228**, **:258-268**, **:468-480** (the five `orange` sites).
14. `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` — **:95-105** (the Badge mock exposing
    `data-color`).
15. `node_modules/@mantine/core/esm/core/MantineProvider/default-colors.mjs` — the `DEFAULT_COLORS` keys you derive
    the stock set from.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/theme.ts` | modify | R1 — add the `orange` tuple and register it at `:139`. |
| `scripts/check-stories.mjs` | modify | R2–R4, R7 — widen Check 15's scope, add forms B and C, replace the passthrough set. |
| `scripts/__tests__/check-stories.test.ts` | modify | R8 — `Check 15` describe block; `makeRoot()` theme stub. |
| `src/components/admin/AdminUsersTable.tsx` | modify | R6 — one map value. |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | modify | R9 — two `data-color` assertions. |
| `docs/backlog.md` | modify | Update 686's state. **Stay at 80 lines.** |
| `docs/sessions/2026-07-29-task686-registered-orange-widened-colour-gate.md` | **create** | Session log per §14. |

`.screenshots/` output is local-only by project policy (`.gitignore:55`, owner decision **D6**). Persist evidence
there and reference it by path; it will not appear in `git status`.

---

## 8. Out of scope

- **Enrolling `Admin/AdminUsersTable` into the rendered manifest**, by retitling or any other means — **Task 687**
  (§3.11). Do not touch the story's `title`, `skipCanvas`, or `scripts/lib/mantine-story-scope.mjs`.
- **Free-form expression analysis** in Check 15 (`color={cond ? … : …}`, `color={props.x}`) — §3.8 declares this a
  boundary, not a requirement.
- **`primaryShade`, any other `theme.ts` tuple, and every `Component.defaultProps` block.**
- **Re-designing either orange semantic.** D11 keeps `moderator` and `location_request` orange. Do not split them,
  do not introduce a second ramp.
- **Checks 1–14** — do not refactor them to share your new helpers, and do not renumber anything.
- **`scripts/story-realmode-allowlist.json`** — the widened Check 15 must need no entry (§3.2, §3.10).
- **The `STATUS_COLOR` map** in `AdminUsersTable.tsx:32` — already fully registered.
- **Any mutating Git command.**

---

## 9. Current and required behavior

**Current.** `check:stories` runs 15 checks over 127 story files; Check 15 inspects colour-prop **names** in three
Mantine story/pattern directories only. `src/components/` is unscanned, `var()` values are unconditionally passed
through, and colour maps are invisible. Consequently seven unregistered-colour sites survive in
`AdminUsersTable.tsx` (§3.2): `orange` resolves to Mantine's stock ramp (`#fd7e14` at index 6, `#f76707` at index 7)
on the role Badge, the location-request icon/label, and the location-request filter Button; and `ROLE_COLOR.agent`
still says `'blue'`, rendering stock `#1c7ed6` while the canonical pattern story already renders `blueLight`
`#0086c9` for the same "Agent" badge. Four legal CSS value classes (`transparent`, `currentColor`, CSS colour
functions, gradients) would be reported as violations if the scope were widened. `check-stories.test.ts` has no
Check 15 coverage at all.

**Required after.** `theme.ts` registers `orange` from TailAdmin §4; indices 6 and 7 are `#fb6514`. Check 15 scans
all of `src/`, still as the 15th check over the same 127-file report count, and fails on all three forms — literal
prop, `var(--mantine-color-*)`, and `*COLOR*` map value — while passing every legal CSS value class. Both remaining
unregistered names are gone: `orange` because it is now registered, `blue` because `ROLE_COLOR.agent` reads
`blueLight`, which restores story↔production parity. The gate exits 0 on the fixed tree and 1 on any planted
violation of any form, with unit tests proving each. The `/admin/users` role and location-request signals shift by
the two hexes in §3.4 — authorised, and declared as having no pixel gate.

---

## 10. Implementation requirements

**I0 — clean-start protocol (before any write).** `git status --porcelain`; expect **zero** entries and record the
empty snapshot. Confirm Task 685 is in `HEAD` with `git log -1 --oneline` and quote the subject. Any non-empty start
state → **stop and report** (A5).

**I1 — reproduce the blind spots first.** Run `npm run check:stories` on the untouched tree and record it:
**15 checks, 127 files, 0 violations, exit 0**. That is the "before": seven real violations exist (§3.2) and the
current gate sees none of them. A blind spot you never demonstrated is not a proven blind spot.

**I2 — widen Check 15, then run it BEFORE any source or theme fix.** This ordering is mandatory and is the first
rung of the natural planted-violation ladder (R5). The rewritten check must:

1. Scope to `collectFiles(join(root, 'src'), ['.ts', '.tsx'])` — one directory, replacing the three-entry list.
2. Keep the `theme.ts`-derived registered set exactly as Task 685 built it (`loadRegisteredColorNames`).
3. Derive the Mantine **stock palette set** from `default-colors.mjs` at runtime (§3.7).
4. Implement Form A with the §3.10 passthrough set, Form B, and Form C, each reporting through `fail()` with its own
   stable rule name and a detail string naming the offending value and the registered set.
5. Keep the `isComment` guard on every form.
6. **Fail loudly on an underivable set.** If either the registered set or the stock set comes back empty, emit a
   `fail()` with a dedicated rule name rather than scanning with an empty set or skipping the check (§3.6).

Then run `npm run check:stories`. **Expected: exit 1, exactly 7 violations**, at the seven §3.2 sites. Quote the
transcript verbatim. If the count is not 7, fix the check — never the count (A1).

**I3 — register `orange` (R1).** Add the tuple per §3.3/§3.4 and extend `colors: { … }` at `:139`. Re-run
`npm run check:stories`: **expected exit 1, exactly 1 violation** — `ROLE_COLOR.agent: 'blue'` at
`AdminUsersTable.tsx:29`. Quote it. This rung proves the registered set really is derived at runtime: five of the
seven violations disappear with **zero** edits to the check.

**I4 — fix `ROLE_COLOR.agent` (R6).** `'blue'` → `'blueLight'`. Nothing else on that line or in that map. Re-run
`npm run check:stories`: **exit 0, 15 checks, 127 files, 0 violations.** Quote it, and confirm the Check 15 header
still prints (a check that silently no-ops when clean is indistinguishable from one that never ran).

**I5 — synthetic plants, one per form (R3, R4, R7).** After the fix, plant and revert each of these separately,
quoting the exit code for each plant and each revert:

1. Form A — `color="cyan"` on any `src/` component.
2. Form B — `style={{ color: 'var(--mantine-color-teal-6)' }}`.
3. Form C — a `const DEMO_COLOR = { x: 'grape' }` map.
4. Negative control — `bg="transparent"`, `color="currentColor"`, `c="oklch(0.6 0.2 20)"`,
   `bg="linear-gradient(90deg, #fff, #000)"` and `c="gray.5"` must each keep the gate at **exit 0**.

Prove every revert with `git diff` on the touched file.

**I6 — unit tests (R8).** Extend `makeRoot()` with the `theme.ts` stub (§3.6) **first**, confirm the existing 91
tests still pass, then add the `Check 15` describe block with BAD/GOOD pairs for forms A, B, C and the F3 classes,
following the Check 13 block's shape. Report the new total.

**I7 — critical-flow regression (R9, cl. 15).** Run
`npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` and record the count **before** your
edit (expect 14) and after adding the two `data-color` assertions. State explicitly that registry row `:45`'s
behaviour is unchanged.

**I8 — rendered proof and the bounded delta (R10).** Run `npm run build-storybook`, then
`npm run screenshots:assert -- --mantine-only`, and compare against `.screenshots/rendered-assert/2026-07-29T16-29/`
(§3.13). Required: 0 FAIL, **0 verdict changes**. Then compare PNG md5s cell-by-cell. Expected: **no** enrolled
story uses `orange`, so any changed cell should fall inside the documented capture-noise set
(`Button`, `HeroSearch--fallback`, `Skeleton`, `LocaleSwitcher`, `EmptyLoadingErrorState`,
`HomepageListingGrids--loading`, `MobileBottomNavView`, `RangeDatePicker`, `FiltersPanelShell`, `CopyIdButton`).
Per **D10**, attribute every changed cell by story; a changed cell in a story outside that set is a **stop and
report**, not an acceptance. Persist the comparison under `.screenshots/task686-delta/`.

**I9 — gates.** §13.3, in order. `npm run build` runs **last**.

**I10 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**, flag
`BACKLOG LIMIT BREACH` if you cannot). Then run `check:file-integrity` and `check:mojibake` **after** the records
exist, so their changed-set includes them, and quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10.

---

## 11. Positive and negative flows

### Positive flow

A developer adds `<Badge color="teal">` to an admin table, or writes `style={{ color: 'var(--mantine-color-teal-6)' }}`,
or adds `moderator: 'teal'` to a role-colour map. `npm run check:stories` — a `prebuild-storybook` precondition —
exits 1 naming the file, line, form and offending value, and the Storybook build never starts. Changing the value to
a registered colour, or registering the ramp in `theme.ts` with TailAdmin provenance, makes the gate pass with no
script edit.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Registered colour, bare and dot-shaded** (`c="gray.5"` ×177 etc.) | **Yes** | §3.10 | passes | AC7 |
| **Mantine keyword** (`dimmed`/`bright`/`white`/`black`) | **Yes** | §3.10 | passes | AC7 |
| **CSS-wide keyword** (`transparent`, `currentColor`, `inherit`, `none`) | **Yes** | §3.10, F3 | passes | AC7, I5.4 |
| **CSS function** (`var()`, `rgba()`, `oklch()`, `linear-gradient()`) | **Yes** | §3.10, F3 | passes | AC7, I5.4 |
| **`var(--mantine-color-<unregistered>-N)`** | **Yes** | §3.7 Form B | **fails** — the one `var()` case that must not pass | AC3, I5.2 |
| **`var(--mantine-color-brand-7)` / framework vars** (`--mantine-color-white`, `-body`, `-error`) | **Yes** | §3.7 | passes — registered, or not a `<name>-<digit>` palette var | AC7 |
| **Colour map with a registered value** (`STATUS_COLOR`, `VARIANT_COLORS`, `BADGE_TONE_COLOR`) | **Yes** | §3.7 Form C | passes — zero false positives on the three live maps | AC4, AC7 |
| **Colour map with an unregistered value** (`ROLE_COLOR`) | **Yes** | §3.2 | **fails** | AC4, AC5 |
| **Non-colour string union that looks colour-ish** (`CaptchaWidget.tsx:15` `'light' \| 'dark' \| 'auto'`) | **Yes** | §3.2 | passes — not a `*COLOR*` map, not a colour prop | AC7 |
| **Colour prop in a comment** | **Yes** | Check 14/15 precedent | comment lines skipped | AC7 |
| **Registered set or stock set underivable** | **Yes** | §3.6, A2 | loud `fail()`, never a silent skip or empty-set scan | AC2 |
| **Test-root without `theme.ts`** | **Yes** | §3.6 | `makeRoot()` supplies a stub; the 91 existing tests stay green | AC8 |
| **Zero violations** (post-fix tree) | **Yes** | §3.2 | exit 0, `checksRan: 15`, 127 files, header printed | AC2, AC5 |
| **Critical-flow regression** (verify/revoke) | **Yes** | cl. 15, §3.9 | 14 tests stay green; behaviour unchanged | AC9 |
| **Small viewport — for the visual delta** | **Yes** | cl. 12 | the role Badge and location-request row render in the <640 card layout; no pixel gate exists (§3.11), state the boundary | AC10 |
| Validation / authorization / RLS | No | Build-time script, one theme tuple, one map value; no data path or permission boundary | N/A | — |
| Locale expansion | No | No user-facing string added or changed; colour values are not localized | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final `theme.ts`, *then* an `orange: MantineColorsTuple` exists whose indices 0/4/5 carry
  the TailAdmin §4 authoritative hexes (`#fff6ed`/`#fd853a`/`#fb6514`), whose indices 6 and 7 are `#fb6514`, whose
  every non-authoritative index is annotated as a placeholder in the `blueLight` style, and `colors:` at `:139`
  includes `orange`. No other line of `theme.ts` changed.
- **AC2 [R2]** — *Given* the final `check-stories.mjs`, *then* Check 15's scope is `src/` (code quoted),
  `runGate` returns `checksRan: 15`, `npm run check:stories` prints 15 check headers including Check 15's, reports
  `127 files checked, 0 violations`, and exits **0**.
- **AC3 [R3]** — *Given* a planted `var(--mantine-color-teal-6)` in any `src/` file, *then* the gate exits 1 naming
  that line and form; reverting restores exit 0.
- **AC4 [R4]** — *Given* a planted `const DEMO_COLOR = { x: 'grape' }`, *then* the gate exits 1 naming it; reverting
  restores exit 0. *And* the three live maps (`STATUS_COLOR`, `VARIANT_COLORS`, `BADGE_TONE_COLOR`) produce no
  violation.
- **AC5 [R5]** — *Given* the widened check run before any fix, *then* it exits 1 with **exactly 7** violations at the
  §3.2 sites; after R1 exactly **1** (`AdminUsersTable.tsx:29`); after R6 **0**. All three transcripts quoted
  verbatim, plus the first number actually observed at each rung.
- **AC6 [R6]** — *Given* the final diff, *then* `ROLE_COLOR.agent` reads `'blueLight'`, `moderator` still reads
  `'orange'`, and `grep -rn "'blue'" src/components/admin/AdminUsersTable.tsx` returns 0 hits.
- **AC7 [R7]** — *Given* the post-fix tree, *then* Check 15 reports **0** violations across all 611 `src/` files, and
  each of `bg="transparent"`, `color="currentColor"`, `c="oklch(…)"`, `bg="linear-gradient(…)"`, `c="gray.5"`,
  `c="dimmed"`, `var(--mantine-color-brand-7)` is individually demonstrated to keep the gate at exit 0.
- **AC8 [R8]** — *Given* `npx vitest run scripts/__tests__/check-stories.test.ts`, *then* all pre-existing 91 tests
  pass, a `Check 15` describe block adds BAD **and** GOOD cases for forms A, B, C and the F3 classes, the
  `checksRan === 15` assertion is unchanged, and the new total is reported.
- **AC9 [R9]** — *Given* `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`, *then* the
  pre-existing 14 tests pass and two added assertions confirm `data-color` is `blueLight` for an agent row and
  `orange` for a moderator row. The report states that critical-flow row `:45`'s behaviour is unchanged.
- **AC10 [R10]** — *Given* a fresh `build-storybook` + `--mantine-only` run compared to `2026-07-29T16-29`, *then*
  0 FAIL and **0 verdict changes**; every PNG-md5-changed cell is attributed by story; every changed story is inside
  the §I8 capture-noise set, or the run is stopped and reported.
- **AC11 [R11]** — `npm run build` exits 0 on a fresh post-change transcript. Report the page count and quote the
  transcript tail **including the route table**; do not cite `.next/BUILD_ID`.
- **AC12 [R12]** — `check:i18n` exits 0 at 2215×4 with no new keys; `check:design-tokens` shows **44 / 0
  stale-marker** with 0 violations in any touched file (`theme.ts` included — it is path-allowlisted, §3.3);
  `check:file-integrity` and `check:mojibake` exit 0 **and** their scanned set includes the session log and
  `docs/backlog.md` (run after I10 — quote the file counts).

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, selected for three converging reasons: `docs/qa-profiles.md` requires
planted-violation failure proof whenever a gate is claimed (cl. 13); the task edits a file carrying a
`docs/critical-flow-registry.md` row (`:45`, §3.9); and it ships a real production visual change (§3.4). Q4 inherits
Q3's visual obligations and Q1's gates including the zero-exit build.

**Critical flow.** Row `:45` (verify/revoke agent) lives in the edited file. Its behaviour is **not** changed — only
colour values. cl. 15 is satisfied by running its authoritative automated coverage and reporting the result, plus the
two added `data-color` assertions. State the negative explicitly; do not imply broader critical-flow coverage.

**Declared proof path and its boundary.** `--mantine-only` covers the 71 enrolled stories / 1184 cells and is the
comparator for regression (R10). The changed production surface `/admin/users` is **not** enrolled (§3.11) and no
verified command can render it into the manifest; enrolment is **Task 687**. Report this as a limitation, never as
satisfied coverage. The remaining canonical widths beyond 320/375/390/1024 stay **Task 678's** scope.

**TailAdmin side-by-side:** **required for the new ramp only** — quote the §4 line-46 row against your tuple and
mark each index authoritative or placeholder (AC1). No other visual value is introduced.

### 13.2 Worktree

Start state expected **clean** — Task 685 committed `ef05a92e5`. Snapshot `git status --porcelain` before the first
write and record the empty result. If it is not clean, **stop and report**. No dirty-worktree manifest is required.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run check:stories` (pre-widening) | 0 — 15 checks, 127 files, 0 violations (the I1 "before") |
| `npm run check:stories` (widened, pre-fix) | **1 — exactly 7 violations** (AC5 rung 1) |
| `npm run check:stories` (after registering `orange`) | **1 — exactly 1 violation** (AC5 rung 2) |
| `npm run check:stories` (after `ROLE_COLOR` fix) | 0 — 15 checks, 127 files, 0 violations (AC5 rung 3) |
| `npm run check:stories` (four synthetic plants + reverts, four negative controls) | 1/0 per plant; 0 for every negative control (AC3, AC4, AC7) |
| `npm run typecheck` | 0 |
| `npx vitest run scripts/__tests__/check-stories.test.ts` | 0 — 91 pre-existing + the new Check 15 block (AC8) |
| `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | 0 — 14 pre-existing + 2 added (AC9) |
| `npx vitest run` (full suite) | 0 new failures attributable to this diff; report any pre-existing full-run-only timeout with its isolated re-run (documented set: `date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`) |
| `npm run check:story-coverage` | 0, total unchanged at 15/15 |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL; 0 verdict changes vs `2026-07-29T16-29`; every PNG-md5 delta attributed by story (AC10) |
| `npm run check:design-tokens` | **44 / 0 stale-marker**; 0 in touched files |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I10**, scanned set must include the session log and backlog |
| `npm run build` | **0 — hard gate**, transcript tail **including the route table** quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-29-task686-registered-orange-widened-colour-gate.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7's paths only.
2. The empty start snapshot and the **true final** `git status --porcelain`, taken *after* the records are written.
3. R1–R12 mapped to AC1–AC12 with evidence.
4. The Check 15 rewrite rationale: how the stock palette set is derived, how each of the three forms is matched, how
   the §3.10 passthrough set is built, and how the underivable-set failure path behaves.
5. **The first violation count you observed at each of the three ladder rungs**, before any adjustment — even if it
   was not 7/1/0 (A1). State what you changed and why.
6. All `check:stories` transcripts: pre-widening, the 7-violation failure, the 1-violation failure, the clean pass,
   and every synthetic plant/revert and negative control.
7. The TailAdmin §4 side-by-side for the `orange` tuple: each index marked authoritative or placeholder.
8. The PNG-md5 attribution table per story, with the explicit statement that no enrolled story uses `orange`.
9. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim including the
   route table.
10. Proof that every synthetic plant is reverted (`git diff` on each touched file).
11. Deviations, each with a reason.
12. Limitations — at minimum: `/admin/users` has **no pixel-level rendered gate** and enrolment is Task 687 (§3.11);
    free-form expression props remain outside the gate (§3.8); the declared 4-width proof path (§13.1); that D12 is
    derived from standing D4/D8 rather than newly granted (A8); and that `.screenshots/` evidence is local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_686_Registered_Orange_Ramp_And_Widened_Colour_Gate.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, hex, count, command and owner ruling is inline |
| Every primary requirement has a binary AC | **Yes** — R1–R12 → AC1–AC12 |
| Scope names what must not change | **Yes** — §8, incl. story enrolment, expression analysis, `primaryShade`, the other tuples, Checks 1–14, and the allowlist |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4 with the critical-flow positive **and** its behaviour-unchanged negative; §17 |
| Canonical-source search performed before proposing a style | **Yes** — §17; the search found an authoritative TailAdmin §4 `orange` row, so the disposition is `register`, not `invent` (cl. 16a satisfied) |
| Owner-only exceptions traceable | **Yes** — D4/D7/D8/D10 standing with dates, D11/D13 new, D12 explicitly marked **derived** rather than granted (§3.1, A8) |
| Baselines account for task-created artifacts | **Yes** — §3.13 names `16-29` and marks `.screenshots/task686-delta/` as task-created evidence with no prior baseline |
| Worktree handling | **Yes** — clean start asserted against `ef05a92e5` with a stop condition (§13.2, A5) |
| Gates prove the changed behavior | **Yes** — a three-rung natural ladder (7→1→0) where rung 2 proves the registered set is genuinely runtime-derived, plus one synthetic plant per form and four negative controls, plus the first unit tests Check 15 has ever had |
| Single active owner route | **Yes** — the only forks are A5's non-empty-start stop, A1's wrong-count stop, and A2's underivable-set stop |
| API claims verified, not assumed | **Yes** — §3.2 is a real 611-file survey; §3.3/§3.4 quote the TailAdmin row and the installed `default-colors.mjs`; §3.5/§3.6 cite real line numbers; §3.11 quotes the enrolment mechanism and the actual CLI flag list |

**Known-risk note for the reviewer.** Six likely defects. First, **the `makeRoot()` empty-registered-set trap**
(§3.6) — a widened scope plus a test root without `theme.ts` turns legal fixtures into violations; AC8 detects it.
Second, **hard-coding the fourteen stock palette names** instead of deriving them from `default-colors.mjs` — A2
makes that a stop. Third, **removing the `var()` passthrough from Form A** to make Form B work, which would break
every legal CSS-variable value; AC7's negative controls detect it. Fourth, **fixing the sites before running the
widened gate**, destroying the ladder; I2's ordering is mandatory and AC5 requires all three transcripts. Fifth,
**mislabelling placeholder indices as TailAdmin-authoritative** in the `orange` tuple — AC1 requires the
side-by-side. Sixth, **claiming rendered coverage for `/admin/users`** — §3.11 proves no such gate exists, and the
report must declare the boundary instead.

---

## 16. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Role Badge — `agent` | `AdminUsersTable.tsx:197`/`:278` `<Badge color={ROLE_COLOR[…]} variant="light">` | `--badge-color`, light variant reads index 7 (`primaryShade: 7`, Task 620) | stock `blue[7]` `#1c7ed6` → `blueLight[7]` `#0086c9` (`theme.ts:74`) | **changed — D12** | AC6, AC9 |
| Role Badge — `moderator` | same | same | stock `orange[7]` `#f76707` → registered `orange[7]` `#fb6514` (TailAdmin §4 500) | **changed — D11** | AC1, AC9 |
| Location-request label | `AdminUsersTable.tsx:224`/`:264` `<Text c="orange.6">` | `--mantine-color-orange-6` | stock `#fd7e14` → registered `#fb6514` | **changed — D11** | AC1 |
| Location-request icon | `AdminUsersTable.tsx:223`/`:263` `<MapPin style={{ color: 'var(--mantine-color-orange-6)' }}>` | inline `color` | same ramp swap | **changed — D11** | AC1, AC3 |
| Location-request filter Button | `AdminUsersTable.tsx:475` `<Button color="orange" variant="light">` | `--button-bg`, light variant reads index 7 | stock `#f76707` → `#fb6514` | **changed — D11** | AC1 |
| `STATUS_COLOR` badges | `AdminUsersTable.tsx:32` | unchanged | `green`/`red` — registered | **out of scope, untouched** | §8 |
| Role Badge fixture in the pattern story | `AdminSurfacePattern.stories.tsx:79` | unchanged | already `blueLight` (Task 685) | **reuse, not in diff** | §3.12, AC6 |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| `orange` ramp | 611-file survey (§3.2); read `docs/tailadmin-style-reference.md` §4 lines 39-46; read `theme.ts:66-77` (`blueLight` sparse-ramp precedent) and `:118-139`; read `default-colors.mjs` | No story renders a palette; the consuming surface's story is `Admin/AdminUsersTable` (real component, **not** manifest-enrolled, §3.11) | **register** — authoritative TailAdmin row exists, so cl. 16a is satisfied by provenance, not invention | `theme.ts` new `orange` tuple + `colors:` at `:139`; `scripts/design-tokens-allowlist.json:2` already covers raw hex in this directory |
| Role Badge colour (`agent`) | `grep -n ROLE_COLOR src/components/admin/AdminUsersTable.tsx` → def `:29`, consumers `:197`/`:278`; read `AdminSurfacePattern.stories.tsx:70-85` | `Patterns/Mantine/AdminSurfacePattern` renders a **fixture stand-in** already at `blueLight`; `Admin/AdminUsersTable` renders the real component | **reuse** — consume the registered `blueLight` ramp; restores story↔production parity | `theme.ts:66-77`; already registered; no catalog or coverage change |
| The gate extension | read Check 15 at `:849-910`; read `check-stories.test.ts:36-63`, `:736-794`; read `check-stories-rendered.mjs:76-82`, `:290-302` | No story renders a lint gate — it is a Node script | **extend** — rewrite Check 15 in place; do not add Check 16 | `scripts/check-stories.mjs`; both name sets derived at runtime (§3.7) |

**Clause 16c note.** Neither canonical story needs an edit: the pattern-story fixture is already at the target value
and the real-component story carries no colour props (verified). Enrolling the real-component story into the rendered
gate is **Task 687** (§3.11) — declared, not silently dropped.

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 7 sites, all in one file; gate + theme + tests | Exactly 5 `src`/`scripts` files changed; no story retitled | AC6, §7, §8 | required |
| cl. 7 (four locales) | Colour change affects all locales | Zero new keys; parity 2215×4 | AC12 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table | AC11 | required |
| cl. 12 (rendered evidence follows risk) | Q4/Q3, real production visual delta | `--mantine-only` 0 verdict changes + per-story md5 attribution; ungated surface declared | AC10, §13.1 | required |
| cl. 13 (Storybook + no-hardcode gates enforceable) | **A gate extension is claimed** | Three-rung natural ladder + one synthetic plant per form + four negative controls + unit tests | AC3–AC5, AC7, AC8 | required |
| cl. 14 (file integrity) | 6 modified + 1 created text file | UTF-8 no BOM, no mojibake, scanned set includes the records | AC12 | required |
| cl. 15 (critical flows) | **Row `:45` is in the edited file** | Run its authoritative coverage, report green, state the behaviour-unchanged negative | AC9 | required |
| cl. 16 (TailAdmin visual source) | A new ramp is registered | Side-by-side against §4 line 46; each index marked authoritative or placeholder | AC1 | required |
| cl. 16a (missing reference → provenance) | New registered colour | Authoritative TailAdmin row quoted; no invented stop labelled authoritative | AC1, §3.3 | required |
| cl. 16b (canonical provenance before code) | Five visible artifacts | Canonical search recorded; dispositions `register` and `reuse` | §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Migrated Mantine artifacts change | Both candidate stories inspected; neither needs an edit; enrolment gap declared and reserved | §3.11, §3.12, §17 | required |
| cl. 10 (git ownership) | Task 685 committed `ef05a92e5` | Clean start; diff limited to §7; no mutating Git by the executor | A5, §14 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 686 |
| Active route / owner decision | Single route: register the TailAdmin `orange` ramp in `theme.ts`, widen Check 15 to all of `src/` with forms B and C and the F3 passthrough, prove the ladder 7→1→0, then set `ROLE_COLOR.agent` to `blueLight` (owner **D11/D13**, 2026-07-29; **D12** derived from standing D4/D8; **D10** from the Task 685 review sets the visual comparator) |
| Decision source, date, scope | Owner, 2026-07-29, following the Task 685 review; scope = the `orange` registration + one map value + the gate extension + its tests; **no** story enrolment, **no** expression analysis, **no** other `theme.ts` change |
| Starting worktree mode | **clean** — Task 685 committed `ef05a92e5`; §13.2 sets the stop condition |
| Producer of each checkpoint | clean-start snapshot → pre-widening `check:stories` baseline → widened Check 15 authored → **7-violation natural failure** → `orange` registered → **1-violation failure** → `ROLE_COLOR` fixed → 0-violation pass → four synthetic plants + four negative controls → unit tests → critical-flow regression → storybook + manifest + md5 attribution → gates → build → records → post-records encoding gates |
| Persisted result | start/end porcelain snapshots; nine+ `check:stories` transcripts; `.screenshots/task686-delta/` md5 comparison; manifest verdict diff; build transcript tail with route table; session log |
| Comparator | **exactly 7 → exactly 1 → 0** violations; each synthetic plant exit 1 → revert exit 0; each negative control exit 0; `checksRan` **15** and `storyFilesCount` **127** unchanged; manifest **0 verdict changes** vs `2026-07-29T16-29`; every md5-changed cell attributed to a story inside the documented capture-noise set; `design-tokens` 44/0 |
| Failure path | Non-empty start state → stop (A5); any ladder rung reports an unexpected count → fix the check, never the count, and report the first observed number (A1); registered or stock set underivable → loud `fail()`, never an empty-set scan or a hard-coded list (A2); a changed cell in a story outside the capture-noise set → stop and report (D10); `makeRoot()` change breaks any of the 91 existing tests → stop, do not weaken an assertion |
| Zero/empty input case | The post-fix tree is the zero case: Check 15 must report **0** violations and still print its header and count. Separately, the **empty registered/stock set** is an explicit non-silent case: it must `fail()` loudly, never scan with an empty set and never skip (§3.6, I2.6) |
| Task-created artifacts in baselines | `.screenshots/task686-delta/` is task-created with **no** pre-change baseline — evidence, not a regression surface. The `--mantine-only` baseline is `2026-07-29T16-29` (Task 685's reviewed post-change run), **not** `14-20` |
