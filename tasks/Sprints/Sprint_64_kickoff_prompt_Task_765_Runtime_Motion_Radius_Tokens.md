# Task 765 — Materialize D63-F: runtime motion/radius tokens, and migrate `AppImage.module.css` onto them

**Sprint:** 64 — Runtime design tokens that survive Tailwind removal · **Phase:** 1 · **Priority:** P1
**Filed:** 2026-08-24 against `main` @ `5372e08a5`, worktree clean
**Status:** ready to execute. **Start at §9.0.**

---

## 1. Mode, task type, and the decision this implements

`IMPLEMENTATION` · **Design-system / global stylesheet contract change.** Touches `src/app/globals.css`, which every
surface reads, plus one CSS Module.

**Owner decision D63-F, 2026-08-24, quoted:** *"У `globals.css` створюємо project-owned runtime tokens у `:root`;
Tailwind `@theme inline` лишається лише alias-шаром для utility-класів. `AppImage.module.css` споживає тільки
runtime tokens. Phase 5 виконується окремою задачею, не в Task 764."*

**Owner decision D63-D, 2026-08-24, quoted:** *"Phase 5 — окремий спринт/окрема задача, бо змінюється глобальний
контракт `globals.css`. Task 764 не треба переоткривати."*

Both are **decided, not proposed**. This task implements exactly the shape below and invents nothing beyond it. The
executor does not add tokens, does not rename beyond the list, and does not migrate other consumers.

## 2. Objective

Declare the motion and radius values as `:root` custom properties, alias the existing `@theme inline` names to them,
and change `AppImage.module.css` to read the runtime names — with the rendered result proven identical and with
three separate proofs that the gates involved can actually fail.

On completion: `check:design-tokens` exits 0 with no marker and no allowlist entry, `check:css-vars` exits 0, and the
computed `border-radius`, `transition-duration` and `transition-timing-function` on the real `AppImage` are byte-equal
to their pre-edit values.

## 3. Verified context

Measured by the task author on `5372e08a5`, 2026-08-24. Facts marked **I0** are re-measured by the executor before
any write.

### 3.1 The two flagged declarations, and who owns them

| Where | Declaration | Gate category |
|---|---|---|
| `AppImage.module.css:125-127` — `.frameCircle` | `border-radius: 3.40282e38px` | `css-length` |
| `AppImage.module.css:154-161` — `.fade` | `transition-duration: 300ms` (`:160`) | `css-duration` |
| same rule, `:159` | `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)` | **not currently flagged** |

`:159`'s easing literal is migrated too, because D63-F's scheme names it. It is not a gate finding today; do not
report its migration as closing one.

**Consumers.** `.frameCircle` is used by exactly one variant — `appImageConfig.ts:116-117`, `avatar`. `.fade` is
applied by `AppImage.tsx:149` to every non-`priority` image.

### 3.2 Why the current tokens are unreadable — the measured cause

`@theme inline` opens at `globals.css:35`. `--duration-{fast,base,slow}` (`:267-269`) and `--ease-{standard,in,out}`
(`:273-275`) sit at **brace-depth 1 inside it**; `:root` does not open until `:327`. A repository-wide search for
`var(--duration-` and `var(--ease-` in `src/` returns **zero** references.

So the scale exists as Tailwind theme values only. This is why every module reproducing a duration inlines a literal
behind a marker. D63-F fixes the cause; this task does not re-litigate it.

### 3.3 `check:css-vars` — how it decides, and the trap that follows

`scripts/check-css-var-resolvability.mjs` (Task 700) parses `globals.css` live for every `--x:` declaration to build
an **owned set**, then checks that every `var(--owned)` resolves to a declaration that actually ships. Two arms: Arm A
over `.next/static/css/*.css`, Arm B over `src/**/*.{css,tsx,ts}` excluding `globals.css`.

Two consequences that decide how P3 must be built:

1. **`:468` — `if (!ownedSet.has(ref.name)) continue;`** An unowned reference is *never* reported by the ownership
   arm. So deleting a token from `globals.css` also removes it from the owned set, and a plain "delete the token"
   plant can go **silently green**.
2. **`:530` — the prefix arm.** An unowned reference is still reported when some owned name shares its
   `--<prefix>`. This is what makes P3 viable: removing or renaming **only** `--motion-duration-slow` leaves
   `--motion-duration-fast` and `--motion-duration-base` owned, the prefix `motion-duration-` still matches, and the
   dangling reference is reported.

**Therefore P3 removes or renames exactly one name and leaves its two siblings in place.** If the executor removes
all three, the prefix arm goes quiet too and the plant proves nothing.

**Freshness trap.** Arm A reads the built CSS, and the gate compares the built file's mtime against the newest mtime
among all scanned inputs. A run after editing `globals.css` **without rebuilding** fails on staleness, not on the
planted defect — a non-zero exit that looks identical to success. Every `check:css-vars` run in this task is preceded
by a build, and every plant transcript must show the **specific violation class**, not merely a non-zero exit.

### 3.4 The retained capture approach to reuse

`docs/sessions/evidence/task763/capture-appimage-styles.mjs` already captures `borderRadius` among its container
properties and `transitionProperty` / `transitionDuration` / `transitionTimingFunction` among its state properties,
driving real Storybook stories. Its story list covers the `listing` / `listing-thumb` variants and does **not** cover
`avatar`. Extend the fixture only far enough to render the `avatar` variant; change nothing else about the approach.

### 3.5 Windows-native execution binds every command here

`docs/orchestrator-role.md:93-108`, `docs/orchestrator-procedures.md:363-374` and
`.claude/skills/review-task/SKILL.md:46-58` require every evidence-producing `node`/`npm`/`npx`/Playwright/Next/
Tailwind/Vite/Storybook command to run in native Windows PowerShell. Record `node.exe -p process.platform` as the
first retained artifact; only `win32` may proceed. Every retained transcript carries:

```
EXECUTION_PLATFORM=win32
NODE_VERSION=<node.exe -v>
CWD=<absolute repository path>
COMMAND=<exact command as typed>
```

and ends with `EXIT_CODE=<actual exit code>`. A transcript missing any of the five lines is not evidence.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D63-F | The seven `:root` names exist in `globals.css` with exactly the specified values | P0 | AC1 | Confirmed |
| R2 | D63-F | The existing `@theme inline` `--duration-*` / `--ease-*` entries alias the `--motion-*` names instead of owning literals | P0 | AC2 | Confirmed |
| R3 | D63-F | `AppImage.module.css` reads only the runtime names in the three migrated declarations | P0 | AC3 | Confirmed |
| R4 | D63-F, Sprint 64 rule 2 | No `design-tokens-allow` marker and no allowlist entry is added anywhere | P0 | AC4 | Confirmed |
| R5 | Sprint 64 rule 3, §3.1 | The rendered result is unchanged: computed `border-radius`, `transition-duration` and `transition-timing-function` equal their pre-edit values | P0 | AC5 | Confirmed |
| R6 | D63-F exit criteria | `check:design-tokens` exits 0 | P0 | AC6 | Confirmed |
| R7 | D63-F exit criteria | `check:css-vars` exits 0 | P0 | AC7 | Confirmed |
| R8 | Standing governance | `typecheck`, `build`, `build-storybook`, `check:stories` each exit 0 | P0 | AC8 | Confirmed |
| R9 | Sprint 64 rule 1 | Three planted violations, each observed failing with its specific violation class, then reverted | P0 | AC9 | Confirmed |
| R10 | §3.5 | Every retained transcript carries the five-line native header and a real exit code | P0 | AC10 | Confirmed |

## 5. Assumptions and open questions

- **A1 (`UNKNOWN`, resolved at Phase 1):** whether `3.40282e38px` survives the round trip through a custom property
  unchanged. It is a float at the edge of the representable range; a serialization difference would show up as a
  changed computed `border-radius`. If the post-edit computed value differs **at all**, report `BLOCKED` with both
  captures — do **not** substitute `9999px` or round the value (Sprint 64 rule 3).
- **A2 (`UNKNOWN`):** whether `@theme inline` accepts `var()` references to `:root` names in this Tailwind version
  and still emits the utilities that reference them. If the alias form breaks utility generation, stop and report
  `BLOCKED` with the compiled evidence; do not fall back to duplicating literals in both places.
- **A3 (`INFERENCE`, must be measured):** that P3 fails through the prefix arm described in §3.3. If the observed
  failure cannot be attributed to either the ownership arm or the prefix arm, the plant proved nothing — report
  `BLOCKED` rather than substituting a different mutation.

## 6. Scope

1. `src/app/globals.css` — the seven new `:root` declarations and the six `@theme inline` entries converted to
   aliases. **Nothing else in the file.**
2. `src/components/ui/AppImage.module.css` — exactly three declarations: `.frameCircle`'s `border-radius`, and
   `.fade`'s `transition-duration` and `transition-timing-function`, plus removal of the two now-unnecessary
   `design-tokens-allow` markers on the migrated lines.
3. `docs/sessions/evidence/task765/**` — the capture fixture extension, baseline and post captures, plant
   transcripts, gate transcripts.
4. `docs/sessions/2026-08-**-task765-*.md` and `docs/backlog.md`.

## 7. Out of scope

- Task 764, its ledger, evidence, source changes and acceptance criteria — **frozen** (Sprint 64 §6).
- Any other `design-tokens-allow` marker in `src/`, and any other `@theme inline` entry.
- Migrating other consumers onto `--motion-*`. This task creates the tokens and moves one file.
- Removing `--duration-*` / `--ease-*` from `@theme inline`. They stay, as aliases.

## 8. Current and required behaviour

| Behaviour | Today | Required after |
|---|---|---|
| `avatar` computed `border-radius` | `3.40282e38px` from a literal | **Identical**, from `var(--radius-pill)` |
| non-`priority` image computed `transition-duration` | `300ms` from a literal | **Identical**, from `var(--motion-duration-slow)` |
| the same rule's computed easing | `cubic-bezier(0.4, 0, 0.2, 1)` from a literal | **Identical**, from `var(--motion-ease-standard)` |
| `check:design-tokens --strict` | exit 1, two findings | **exit 0**, no marker, no allowlist |
| `check:css-vars` | exit 0 | **exit 0**, unchanged |
| Tailwind utilities generated from `--duration-*` / `--ease-*` | generated from literals | **Unchanged output**, generated through the aliases |

## 9. Implementation requirements

### 9.0 — I0 freshness and the platform gate

`git status --porcelain` (expect empty; non-empty → `docs/orchestrator-dirty-worktree-manifest-template.md` first);
`git rev-parse HEAD` (expect `5372e08a5` or later on `main`).

Open the evidence terminal and retain `docs/sessions/evidence/task765/platform-attestation.txt`:

```powershell
node.exe -p process.platform     # must print win32
node.exe -v
$PWD.Path
```

Not `win32` → **stop, report `BLOCKED`**. Re-read §3.1's three declarations and §3.2's line numbers at their current
positions; report drift before acting.

### 9.1 — Phase 1: the pre-edit baseline, before any source change

Extend `docs/sessions/evidence/task763/capture-appimage-styles.mjs`'s approach into
`docs/sessions/evidence/task765/capture-appimage-styles.mjs` — copy it, add a story that renders the `avatar`
variant, change nothing else about how it captures.

Build Storybook, run the capture, and persist `baseline-computed-styles.json` containing, at minimum:

- `avatar` variant: computed `border-radius`;
- non-`priority` image: computed `transition-duration` and `transition-timing-function`.

The artifact records the **source revision** (`git rev-parse HEAD`) and the run's real exit code. A baseline that
does not name the revision it was taken at cannot support AC5.

### 9.2 — Phase 2: the edit

`globals.css`, inside the existing `:root` block:

```css
:root {
  --radius-pill: 3.40282e38px;
  --motion-duration-fast: 100ms;
  --motion-duration-base: 200ms;
  --motion-duration-slow: 300ms;
  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

`globals.css`, inside the existing `@theme inline` block — the six entries become aliases, keeping their names:

```css
--duration-fast: var(--motion-duration-fast);
--duration-base: var(--motion-duration-base);
--duration-slow: var(--motion-duration-slow);
--ease-standard: var(--motion-ease-standard);
--ease-in: var(--motion-ease-in);
--ease-out: var(--motion-ease-out);
```

`AppImage.module.css` — exactly three declarations, and delete the `design-tokens-allow` markers that defended them:

```css
border-radius: var(--radius-pill);
transition-duration: var(--motion-duration-slow);
transition-timing-function: var(--motion-ease-standard);
```

No allowlist entry. No marker. No approximation of the radius value.

### 9.3 — Phase 3: the post-edit comparison and the gate set

Rebuild, re-run the capture, and persist `post-computed-styles.json`. AC5 passes only when all three values are
**equal to the baseline**, compared as strings, not as "visually the same".

Then, in this order — the build must precede `check:css-vars` (§3.3's freshness trap):

`npm.cmd run typecheck` · `npm.cmd run build` · `npm.cmd run build-storybook` · `npm.cmd run check:stories` ·
`npm.cmd run check:design-tokens` · `npm.cmd run check:css-vars`. Each transcript retained, each `EXIT_CODE=0`.

### 9.4 — Phase 4: three planted violations

Each plant starts from the **clean post-edit state**, records a real non-zero exit code **and the specific violation
class**, and is reverted before the next one begins.

| Arm | Mutation | Required observation |
|---|---|---|
| **P1** | Restore `transition-duration: 300ms` as a literal in `.fade` | `check:design-tokens` fails, and the transcript names the **`css-duration`** category on that line |
| **P2** | Restore `border-radius: 3.40282e38px` as a literal in `.frameCircle` | `check:design-tokens` fails, and the transcript names the **`css-length`** category on that line |
| **P3** | Remove **or** rename **only** `--motion-duration-slow` in `:root`, leaving `--motion-duration-fast` and `--motion-duration-base` in place; rebuild | `check:css-vars` fails on the dangling `var(--motion-duration-slow)` reference |

P3's transcript must show the reported reference, not merely a non-zero exit — §3.3 explains why a stale build and a
planted defect produce indistinguishable exit codes. If the failure cannot be attributed to the ownership arm or the
prefix arm, report `BLOCKED` (A3).

After the last revert: `git diff` on `globals.css` and `AppImage.module.css` must equal their pre-plant diffs
exactly; persist that proof. Then re-run the full §9.3 gate set clean.

## 10. Positive and negative flows

**Positive.** A user loads a listing page. The avatar renders fully round, the non-priority images fade in over 300ms
on the standard curve — identical to before — and nothing in the CSS carries a literal or a marker for those values.

| # | Flow | Applicable | Required |
|---|---|---|---|
| N1 | Tailwind utilities built from `--duration-*` / `--ease-*` | **Yes** | Compiled output unchanged; the aliases must not change what Tailwind emits |
| N2 | A surface reading `--motion-*` from a TSX inline style | No | None exists yet; this task adds no consumer |
| N3 | `prefers-reduced-motion` | **Yes** | Unaffected — this task changes value provenance, not any media guard |
| N4 | `priority` image (no `.fade`) | **Yes** | Unchanged; no transition applies |
| N5 | Dark theme | **Yes** | Motion and radius are theme-independent; `.dark` introduces no new name (`check-css-var-resolvability.mjs:55`) |
| N6 | RLS / auth / i18n | No | No data, policy or copy in scope |

## 11. Acceptance criteria

- **AC1 [R1]** — The seven `:root` names exist in `globals.css` with exactly the §9.2 values, inside the `:root`
  block that opens at `:327`, not inside `@theme inline`.
- **AC2 [R2]** — The six `@theme inline` entries keep their names and their values are `var(--motion-*)` references.
- **AC3 [R3]** — `AppImage.module.css` contains exactly the three §9.2 declarations at the migrated lines; no other
  declaration in that file changed.
- **AC4 [R4]** — `git diff` contains no added `design-tokens-allow` marker, and
  `scripts/design-tokens-allowlist.json` is unchanged.
- **AC5 [R5]** — `post-computed-styles.json` equals `baseline-computed-styles.json` on all three values, string-for-
  string, and the baseline names the revision it was captured at.
- **AC6 [R6]** — `npm.cmd run check:design-tokens` exits 0.
- **AC7 [R7]** — `npm.cmd run check:css-vars` exits 0, run after a build.
- **AC8 [R8]** — `typecheck`, `build`, `build-storybook`, `check:stories` each exit 0, transcripts retained.
- **AC9 [R9]** — P1, P2 and P3 each observed failing with the required violation class named in the transcript and a
  real non-zero exit code, each reverted, with the revert proof and a final clean gate run retained.
- **AC10 [R10]** — Every retained transcript carries `EXECUTION_PLATFORM=win32`, the Node version, the cwd, the exact
  command and a real `EXIT_CODE`.

## 12. QA profile and verification plan

**Profile: `Q3`.** A global stylesheet contract change with rendered consequences, verified by computed-style capture
plus four gates and a three-armed plant. **Not Q4:** `docs/critical-flow-registry.md`'s registered card flow is not
edited by this task — `AppImage.module.css` changes value provenance only, and `ListingCard`/`MantineListingCardPattern`
are untouched. If the I0 scan of the registry shows otherwise, escalate and add automated regression evidence.

Every command runs in native Windows PowerShell with the §3.5 header. A result from any other platform is not
evidence and must not be reported as one.

## 13. Completion report contract

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

1. Changed files vs §6. 2. R1-R10 completed and not. 3. Every command with its five-line header and real exit code.
4. **The A1 answer:** the three baseline values and the three post values, verbatim, and whether `3.40282e38px`
survived the round trip unchanged. 5. **The A2 answer:** evidence that the aliased `@theme inline` entries still
produce the same compiled utilities. 6. **The A3 answer:** which arm of `check:css-vars` reported P3, quoted from the
transcript. 7. The revert proof and the final clean gate run. 8. I0 drift. 9. Deviations and limitations.
10. `docs/backlog.md` updated concisely, narrative in the session log.

## 14. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | ✅ every value, line, command and owner quote is in the file |
| Every requirement has a binary AC and a verification method | ✅ R1-R10 → AC1-AC10 |
| Scope names what must not change | ✅ §7; §8 gives a before/after per behaviour |
| Exactly one active route | ✅ D63-F's shape verbatim. A1, A2 and A3 all fail to `BLOCKED`, never to a second route |
| Every gate claim carries a planted-violation proof | ✅ P1/P2 for `check:design-tokens`, P3 for `check:css-vars` |
| Each plant is shown able to fail for the right reason | ✅ each requires its violation class named, not just a non-zero exit — §3.3 documents why an exit code alone is ambiguous here |
| Known traps surfaced before the executor hits them | ✅ §3.3's unowned-reference skip, the prefix arm that rescues P3, and the build-staleness false red; §3.1's easing literal that is not a current finding |
| Comparator measures the invariant | ✅ AC5 compares computed strings from a real render, not the source text |
| Prior work fenced off | ✅ §7 and Sprint 64 §6 freeze Task 764 entirely |

---

## Handoff

Execute from `tasks/Sprints/Sprint_64_kickoff_prompt_Task_765_Runtime_Motion_Radius_Tokens.md` following
`.claude/skills/execute-task/SKILL.md`. Read the Sprint 64 plan and this file. Start at §9.0, and stop immediately if
`node.exe -p process.platform` is not `win32`.

**FACTS:** §3.1, §3.2, §3.3, §3.4, §3.5 — each with its file and line.
**INFERENCES:** A3 — the arm P3 fails through. Routed to a measurement; may not be reported as a result.
**UNKNOWNS:** A1 (the float round trip), A2 (alias form vs utility generation).
**CONFLICTS:** none at filing.

**QA profile:** `Q3`. **Ambiguous requirements:** none.
**Owner decisions still needed:** none. D63-F and D63-D are quoted verbatim in §1 and recorded in
`tasks/Sprints/Sprint_63_Homepage_Exits_Tailwind.md`.
