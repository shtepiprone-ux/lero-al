# Task 696 — Exclude `scripts/` from Tailwind's source scan

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** build-output correctness / design-system plumbing (`docs/rule-index.md` → design-system
  rules + "Storybook / Visual Proof" for the rendered comparator).
- **Secondary type:** none. No component, no style value, no rendered surface is edited.
- **Origin:** backlog reservation **696**, filed by Task 693 (`@source not "../../scripts"`, "the root fix").
  Escalated to active by the **Task 668 review, 2026-07-31**, and sequenced by an explicit **owner directive the
  same day**: isolate `scripts/` from Tailwind *first*, then consolidate the permanent invariants into one CI gate,
  and only then delete the one-off QA probes.

> **Read this first.** `src/app/globals.css` excludes `docs/` and `tasks/` from Tailwind's scan but **not**
> `scripts/`. Every Tailwind-looking string inside a build script — a regex literal in a linter, an example in a
> comment, a value in a governance baseline JSON — is therefore a live utility candidate. The reviewer measured the
> result: **21 utility classes ship in the production CSS whose only occurrence anywhere in the scanned tree is
> under `scripts/`.** Twenty of them come from **permanent** governance tooling that will never be deleted, so
> deleting the one-off probes cannot fix this. This task is the only fix.

---

## 2. Objective

1. Add `@source not "../../scripts";` to `src/app/globals.css`, alongside the existing `docs`/`tasks` exclusions.
2. Prove the exclusion took effect: the 21 measured utilities disappear from the built CSS, **exactly** those and
   nothing else.
3. Prove nothing rendered changes.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-31.

### 3.1 The current directive block — read in source

`src/app/globals.css`:

```
:1    @import "tailwindcss";
:11   @source not "../../docs";
:12   @source not "../../tasks";
```

The paths are relative to the CSS file, so `../../docs` resolves from `src/app/` to the repo-root `docs/`. The new
line must therefore read exactly `@source not "../../scripts";` and sit with the other two.

### 3.2 The 21 polluting utilities — measured, with provenance

Measured by extracting candidate-shaped tokens from `scripts/**` (`.mjs`/`.ts`/`.js`/`.json`/`.md`), intersecting
with the class selectors actually emitted in `.next/static/css/*.css` from the 2026-07-31 production build, and
subtracting every token occurring anywhere in `src/`, `.storybook/`, `messages/`, `public/`, or the root config
files:

| Utility | Originating script(s) |
|---|---|
| `bg-black` | `governance/baseline.json`, `governance/scan-tailwind.mjs`, `governance/tailwind-entropy.mjs` |
| `py-7`, `py-9`, `py-11`, `py-13`, `py-14`, `py-15` | `governance/scan-tailwind.mjs` |
| `py-10` | `governance/baseline.json`, `governance/scan-tailwind.mjs` |
| `text-green-500` | `governance/baseline.json`, `governance/scan-tailwind.mjs` |
| `text-[#...]` | `governance/scan-tailwind.mjs` |
| `max-w-[1800px]`, `max-w-screen-2xl` | `governance/tailwind-entropy.mjs` |
| `duration-[...]`, `duration-[1000ms]`, `shadow-[...]`, `w-[100%]` | `check-design-tokens.mjs` |
| `z-[100]` | `check-design-tokens.mjs`, `governance/tailwind-entropy.allowlist.json`, `governance/tailwind-entropy.latest.json` |
| `text-[20px]` | `__tests__/check-design-tokens.test.ts` |
| `rounded-b-2xl` | `check-stories-rendered.mjs` |
| `text-clip` | `check-stories-rendered.mjs`, `geometry-integrity.mjs` |
| `h-[76px]` | `task670-qa-hero-fallback-geometry.mjs`, `governance/tailwind-entropy.latest.json` |

**Twenty of the twenty-one come from permanent tooling.** Only `h-[76px]` has a one-off-probe origin, and even it
is also present in a governance baseline. This is why the owner's cleanup sequence puts this task first: deleting
`task*-qa-*.mjs` would not remove any of the other twenty.

`bg-black` is the same utility Task 693's planted control had to chase through `scripts/governance/` — its
recorded **M5** defect, where the census grepped the variable name rather than the utility candidate.

### 3.3 Why this is not merely cosmetic

These 21 selectors are shipped to every user in the main stylesheet and can never match any element, because no
rendered source references them. Removing them is a small, real payload reduction and — more importantly — it
removes a class of false signal: today a governance script can keep a utility alive in the bundle after its last
real consumer is gone, which is exactly the failure mode **Task 700** (the general `@theme`-dependency gate) is
being built to detect. Until `scripts/` is excluded, Task 700 would be measuring a polluted universe.

### 3.4 The hazard this task must also close — found during the Task 692 review

`scripts/__tests__/` is scanned as well. A gate that names a utility **literally** in its source or comments
becomes a synthetic consumer of that utility. `scripts/__tests__/overlay-dual-declaration.test.ts` (Task 692)
discusses `bg-overlay*`/`text-overlay-foreground*` in its header and is clear **today** only because it writes
them with `*` wildcards — it contributes none of the 21. Had it written `bg-overlay/60`, it would have kept that
utility alive in the bundle and masked precisely the disappearance Task 700 must catch. Excluding `scripts/`
closes this permanently; the task must record it so the reasoning is not lost.

### 3.5 Tailwind's behaviour — do not re-derive it, verify it

`@source not "<path>"` subtracts a path from automatic source detection. The existing `docs`/`tasks` lines are the
in-repo precedent and are known to work. Do **not** switch to `@source`-allowlisting, restructure the directive
block, or touch `.gitignore`-based detection. One added line.

### 3.6 Start state

`git status --porcelain` is expected to be **empty** (all review records committed). If the Task 668/669 review
records are still uncommitted, that is also acceptable — record whichever you find verbatim at I0. Any *other*
entry is a **stop and report**. Record md5 for `src/app/globals.css` at I0 and at the end.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | `src/app/globals.css` gains exactly one line, `@source not "../../scripts";`, adjacent to the existing two exclusions, with a short comment citing Task 696 and the 21-utility measurement. No other edit to the file. | P0 | AC1 | Confirmed |
| R2 | §3.2 | After a clean `rm -rf .next && npm run build`, **all 21** §3.2 utilities are absent from `.next/static/css/*.css`. | P0 | AC2 | Confirmed |
| R3 | §3.2 | The CSS selector-set diff against a pre-change baseline shows **exactly** those 21 selectors removed, **0** selectors added, and **0** other selectors changed. A 22nd removal is a **stop and report**, not a bonus. | P0 | AC2 | Confirmed |
| R4 | cl. 13 | Anti-no-op proof that the exclusion is what did it: **(a)** on the pre-change tree, add a unique throwaway utility (e.g. `mt-[7px]`, first confirmed absent repo-wide) to a comment in one `scripts/` file, clean-build, and show it **IS** emitted; **(b)** apply R1, clean-build with the same plant still present, and show it is **NOT** emitted; **(c)** remove the plant, verify `git status` clean for that file. | P0 | AC3 | Confirmed |
| R5 | §3.3 | Rendered proof of zero visual change: `build-storybook` + `screenshots:assert -- --mantine-only` vs a pre-change baseline captured in this session — **0 FAIL, 0 verdict changes**, and every md5-changed cell attributed under `docs/storybook-governance.md` §14.11 (D26) or the documented noise set. Record a same-tree stability control, which D26 condition 4 requires. | P0 | AC4 | Confirmed |
| R6 | §3.4 | The comment added by R1, or the session log, records the `scripts/__tests__/` synthetic-consumer hazard and that it is now closed. | P2 | AC5 | Confirmed |
| R7 | cl. 1 | No file under `scripts/` is edited, renamed or deleted by this task. No QA probe is removed here — that is step 3 of the owner sequence, after the gate consolidation. | P0 | AC5, AC6 | Confirmed |
| R8 | cl. 9, 14 | `typecheck` 0; `check:stories` 0 / 127 files; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:design-tokens` **28**/0/0 unchanged; `npx vitest run` no new failure; `check:file-integrity` / `check:mojibake` clean after the records exist; `npm run build` exits 0 with the full 54-row route table. | P0 | AC5 | Confirmed |
| R9 | cl. 10 | Session log + `docs/backlog.md` concise state, backlog staying at **80 lines**. | P1 | AC6 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — one line, nothing else.** The entire code change is a single `@source not` directive. If it appears to
  require restructuring the directive block, changing `@import "tailwindcss"`, or adding an `@source` allowlist,
  **stop and report**.
- **A2 — no script is edited.** The R4 plant is temporary, in a comment, and fully reverted. Any surviving plant in
  the final diff is a failure.
- **A3 — the 21 are a floor, not a ceiling, but 21 is the expected number.** §3.2 was measured against one build;
  token extraction is heuristic. If the real removal set differs, **report the exact difference with provenance**
  rather than adjusting the expectation silently. More than 21 removed → stop; fewer → stop.
- **A4 — no rendered change is expected at all.** Every removed selector is unmatched by construction. Any
  perceptual pixel change is a **stop and report**, not something to explain away.
- **A5 — do not delete any QA probe, and do not wire any gate.** Those are Tasks (step 2) and (step 3) of the owner
  sequence, deliberately separate.

**Open questions — none.**

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 9, 12, 13, 14.
2. `docs/rule-index.md` — design-system rules.
3. `docs/qa-profiles.md` — the **Q3** row.
4. `docs/storybook-governance.md` **§14.11** — D26, the comparator for md5-changed cells; and §8.1's noise set via
   the Task 698 session log.
5. `docs/backlog.md` — the numbering line; **exactly 80 lines**.

**Source pre-read**

6. `src/app/globals.css` `:1-15` — the directive block.
7. `docs/sessions/2026-07-30-task693-overlay-dual-declaration.md` §3 — the planted-control method (I5.1–I5.4) to
   reuse for R4, including its recorded trailing-newline restore trap.
8. `docs/sessions/2026-07-31-task692-overlay-dual-declaration-sync-gate.md` §10 — the `scripts/__tests__` hazard.

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/app/globals.css` | modify — **one line + comment** | R1 |
| `docs/backlog.md` | modify | R9. **Stay at 80 lines.** |
| `docs/sessions/2026-07-31-task696-exclude-scripts-from-tailwind-scan.md` | **create** | R9, session log |

Nothing else. Everything under `scripts/` is **read-only** in this task (R7).

## 8. Out of scope

- **Consolidating the permanent invariants into a CI gate** — Featured/Latest column counts at 1440, the 16/12px
  gaps, the header geometry, and whatever `task420-qa-grid-step.mjs` already covers. **Step 2 of the owner
  sequence**, its own task.
- **Deleting any `task*-qa-*.mjs` probe** — step 3, after step 2. Includes `task670`.
- **Task 700** — the general `@theme`-dependency gate.
- **`docs/`/`tasks/` exclusions** — already present, untouched.
- **Any other `@source` behaviour, `.gitignore`, or the Tailwind version.**
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** Tailwind scans `scripts/` because only `docs/` and `tasks/` are excluded. Regex literals, comments,
governance baselines and allowlist JSON inside build tooling are treated as utility candidates, so 21 classes are
compiled into the production stylesheet that no rendered element can ever match. Twenty originate in permanent
tooling, so no cleanup of one-off probes can remove them. The same mechanism lets a governance script keep a
utility alive after its last real consumer disappears — the exact false signal Task 700 must not inherit.

**Required after.** One `@source not "../../scripts";` line. The 21 selectors are gone from the built CSS, exactly
those and nothing else, proven by a selector-set diff and by an anti-no-op plant. Nothing rendered changes. No
script is touched.

## 10. Implementation requirements

**I0 — start protocol.** `git status --porcelain`; record verbatim (§3.6). Record md5 of `src/app/globals.css`.
Do not touch `.git/index.lock`.

**I1 — baselines on the untouched tree.** `rm -rf .next && npm run build` (exit 0). Persist the full sorted
selector set from `.next/static/css/*.css` to `.screenshots/task696-delta/selectors-before.txt`. Confirm all 21
§3.2 utilities are **present**. Record `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens`. Then `build-storybook` + `screenshots:assert -- --mantine-only` as the R5 baseline, and a
**second** run on the identical tree as D26's same-tree stability control.

**I2 — anti-no-op, arm (a) (R4).** Pick a utility confirmed absent repo-wide (suggested `mt-[7px]`; verify with a
repo grep and against `selectors-before.txt`). Add it inside a comment in one `scripts/` file. `rm -rf .next &&
npm run build`. Show it **IS** now emitted. Quote the grep.

**I3 — apply the change (R1).** Add `@source not "../../scripts";` after the `tasks` line, with a brief comment
citing Task 696, the 21-utility measurement, and the §3.4 `scripts/__tests__` hazard (R6).

**I4 — anti-no-op, arm (b) (R4).** With the I2 plant **still in place**, `rm -rf .next && npm run build`. Show the
planted utility is **NOT** emitted. This is the proof that the directive, not chance, did the work.

**I5 — remove the plant (R4c).** Restore the script file exactly; `git status --porcelain` must show no entry for
it; verify by md5 or exact-text comparison. Do **not** use a mutating git command — Task 693 §3 I5.4 records that
`$(...)` shell substitution silently strips trailing newlines; use a direct exact-text revert and verify.

**I6 — the selector-set diff (R2, R3).** `rm -rf .next && npm run build`; persist `selectors-after.txt`; diff
against `selectors-before.txt`. Required: **exactly the 21 §3.2 selectors removed, 0 added, 0 otherwise changed.**
Quote the full diff — it is short, so no elision.

**I7 — rendered proof (R5).** Fresh `build-storybook` + `screenshots:assert -- --mantine-only` against the I1
baseline. Required: 0 FAIL, 0 verdict changes. Partition every md5-changed cell under §14.11/D26 or the documented
noise set, recording "0 changed cells" rows rather than omitting a noise story.

**I8 — gate checks (R8).** `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens` (expect **28**/0/0 — this task changes no style value), `npx vitest run`.

**I9 — `npm run build` runs last**, exit 0, full 54-row route table quoted verbatim.

**I10 — records, then encoding gates.** Session log per §14; `docs/backlog.md` in place (**80 lines**). Then
`check:file-integrity` and `check:mojibake`; quote the counts. Re-record `globals.css` md5 and confirm the only
delta versus I0 is the single added line + comment.

**Order:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10.

## 11. Positive and negative flows

### Positive flow

A developer adds a regex like `/bg-red-500|p-4/` to a governance linter. Tailwind no longer sees it, so no phantom
utility enters the bundle. Later, when the last real `bg-overlay/60` consumer is migrated away, the utility
genuinely disappears from the CSS — and Task 700's gate can trust that signal, because no script is propping it up.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **The directive silently does nothing** | **Yes** | R4 | Plant is emitted before, absent after | AC3 |
| **More than the 21 selectors disappear** | **Yes** | R3, A3 | Stop and report with provenance | AC2 |
| **Fewer than 21 disappear** | **Yes** | R3, A3 | Stop and report — the measurement or the directive is wrong | AC2 |
| **A rendered cell moves** | **Yes** | R5, A4 | 0 verdict changes; any perceptual change is a stop | AC4 |
| **The plant survives into the final diff** | **Yes** | A2, R7 | `git status` shows no `scripts/` entry | AC5 |
| **A script is edited "while we're here"** | **Yes** | R7, A5 | `scripts/` read-only; deletions are step 3 | AC5, AC6 |
| **Relative path resolves wrongly** | **Yes** | §3.1 | `../../scripts` from `src/app/` = repo-root `scripts/`; proven by R4's two arms | AC3 |
| Localization | No | No user-facing string touched | N/A | — |
| RLS / authorization / data path | No | No data path touched | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers Tailwind source detection | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the diff, *then* `src/app/globals.css` differs by exactly one `@source not
  "../../scripts";` line plus its comment, and nothing else.
- **AC2 [R2, R3]** — *Given* `selectors-before.txt` vs `selectors-after.txt`, *then* exactly the 21 §3.2 selectors
  are removed, **0** added, **0** otherwise changed, with the full diff quoted.
- **AC3 [R4]** — *Given* the planted throwaway utility, *then* it **is** emitted on the pre-change tree and **is
  not** emitted after the directive is added, with the same plant in place both times; and it leaves no trace in
  the final `git status`.
- **AC4 [R5]** — *Given* the fresh `--mantine-only` run vs this session's baseline, *then* 0 FAIL, 0 verdict
  changes, every md5-changed cell attributed under §14.11/D26 or the documented noise set, and a same-tree
  stability control recorded.
- **AC5 [R6, R7, R8]** — the `scripts/__tests__` hazard is recorded; `git status` shows no `scripts/` entry;
  `typecheck` 0, `check:stories` 0/127, `check:story-coverage` 15/15, `check:i18n` 2215×4,
  `check:design-tokens` 28/0/0, `vitest` no new failure, `check:file-integrity`/`check:mojibake` 0 after the
  records exist, `npm run build` exit 0 with the full 54-row route table.
- **AC6 [R7, R9]** — no file under `scripts/` is added, edited, renamed or deleted; session log exists and
  `docs/backlog.md` is updated in place at exactly 80 lines.

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`.** This task changes the production CSS payload, so the rendered axis must be proven
even though the expected visual delta is zero by construction. The decisive artifact is not the screenshot matrix
but the **selector-set diff** (R3) — an exact, falsifiable count — with the matrix serving as the independent
confirmation that no element was relying on a removed class. D26 (`docs/storybook-governance.md` §14.11) governs
any md5-changed cell, and its condition 4 requires the same-tree stability control that I1 captures.

**Not Q4.** No gate is authored here. R4's plant is an anti-no-op proof for a build-config change, not a
planted-violation proof for a new gate.

### 13.2 Gates

| Command | Expected |
|---|---|
| selector-set diff (I6) | **exactly 21 removed / 0 added / 0 changed** |
| anti-no-op plant (I2/I4) | emitted before, **not** emitted after |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 0 verdict changes; changed cells attributed under D26 |
| `npm run typecheck` | 0 |
| `npm run check:stories` | 0 — 127 files |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4 |
| `npm run check:design-tokens` | **28** / 0 / 0, unchanged |
| `npx vitest run` | no new failure |
| `check:file-integrity` / `check:mojibake` | 0 / 0 — after I10 |
| `npm run build` | **0 — hard gate**, full 54-row route table, run last |

## 14. Completion report contract

Session log at `docs/sessions/2026-07-31-task696-exclude-scripts-from-tailwind-scan.md`:

1. `Files Changed` table matching the real `git diff`. If a file is modified, say **modified** (Task 693 review F3).
2. I0 snapshot with `globals.css` md5, and the true final `git status --porcelain` with the same md5.
3. R1–R9 mapped to AC1–AC6 with evidence.
4. The one-line diff of `globals.css`, in full.
5. **The complete selector-set diff**, unelided, with the 21 removals named.
6. **Both arms of the anti-no-op plant**, with the verbatim grep output for each.
7. The rendered comparison with the full changed-cell partition, including "0 changed cells" rows.
8. Every command with its **actual** exit code; the `npm run build` tail verbatim with the full 54-row route table.
9. Deviations, each with a reason.
10. Limitations — at minimum: that §3.2's 21 were measured by heuristic token extraction against one build; that
    this task does not consolidate or delete any QA probe (owner sequence steps 2 and 3); and that `.screenshots/`
    evidence is local-only per **D6**.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_696_Exclude_Scripts_From_Tailwind_Source_Scan.md` — under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — the directive block with line numbers, the full 21-utility table with per-script provenance, the plant method, the baseline commands and the expected counts are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC6 |
| Scope protects existing behavior and names what must not change | **Yes** — §8 plus R7's read-only `scripts/`, gated by AC5/AC6; the owner sequence's steps 2 and 3 are explicitly excluded |
| QA profile + rationale present | **Yes** — §13.1 Q3, with the selector-set diff named as the decisive artifact and Q4 explicitly declined with a reason |
| Negative flows selected by applicability | **Yes** — §11, including both the >21 and <21 directions, the silent-no-op branch, and the surviving-plant branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 quotes the real directive lines; §3.2 is a measurement executed against the current build with per-script provenance; §3.4 cites a finding from the Task 692 review; §3.5 relies on the two existing in-repo `@source not` lines |
| Gates prove the changed behavior | **Yes** — an exact 21/0/0 selector diff plus a two-armed anti-no-op plant; neither can pass if the directive does nothing |
| Single active owner route | **Yes** — forks are only stop conditions: unexpected I0 status, a removal count ≠ 21, any perceptual pixel change, a surviving plant, or the directive appearing to need a restructure |
| Baselines account for task-created artifacts | **Yes** — `.screenshots/task696-delta/` is task-created with no prior baseline; the R5 baseline and its stability control are both captured in-session on the pre-change tree |
| Dirty-worktree handling | **Yes, declared** — §3.6 expects empty but accepts the uncommitted 668/669 review records, with md5 witnesses either way |

**Known-risk note for the reviewer.** Three likely defects. First, **an unproven directive** — adding one line and
observing that 21 selectors vanished is *correlation*; only R4's two-armed plant, with the same planted utility
present on both builds, proves the directive caused it. Second, **quietly accepting a removal count other than 21**
— the number is exact and derived from a real measurement; adjusting the expectation to match the outcome would
destroy the only falsifiable claim this task has. Third, **scope creep into `scripts/`** — the executor will be
looking at 13 obviously-unwired QA probes while editing the file that makes them harmful, and deleting even one
here would conflate two effects in a single diff and break the owner's sequence.
