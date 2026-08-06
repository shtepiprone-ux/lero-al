# Task 718 — Define the z-index tokens the docs already promise, and make consuming an undefined custom property a blocking finding

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens).
**Depends on:** 715 (`APPROVED WITH NOTES`, committed `406470c47`) and 716 (`APPROVED WITH NOTES`, committed
`fe21978d5`). **Origin:** Task 715 review **F1/F2**, and Task 716 review **F3**.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — detector coverage** (`docs/rule-index.md` → Validation/QA tooling).
- **Secondary type:** **token definition** in `src/app/globals.css` (7 custom properties, zero current consumers).

> **Read this first.** This task exists because a token can be perfectly documented and completely absent.
> `docs/design-system.md` §22.3 tables seven `--z-*` tokens with values, tiers and a "Use via" column.
> `src/app/globals.css` defines **none** of them. Tasks 714 → 716 → 715 carried that fiction through two
> `APPROVED WITH NOTES` reviews and into a production build. **You are closing both halves: making the
> documentation true, and making the next occurrence impossible to ship silently.**

---

## 2. Objective

1. **Define** the seven `--z-*` tokens in `globals.css` at the §22.3 values, so `var(--z-sticky)` and its siblings
   resolve. **Owner decision, 2026-08-06** (§3.1).
2. **Correct §22.3's "Use via" column**, which promises a Tailwind utility form that Tailwind v4 structurally cannot
   generate (§3.4, A1) — and remove the ⚠️ NOT-IMPLEMENTED banner 715 added, which this task retires.
3. **Add a blocking gate:** a `var(--x)` reference in `src/**/*.css` that resolves to no definition is a finding.
   Prove it with a planted violation, both arms.
4. **Fold in Task 716 review F3:** two `console.log` strings in `check-design-tokens.mjs` that have been false since
   715 landed.

**Non-goals:** do **not** narrow the path-level allowlist (**717**); do **not** migrate any existing `z-30`/`z-40`/
`z-50` utility to the new tokens; do **not** add `@utility` definitions for `z-sticky` etc. (A1, rejected); do
**not** change any detection pattern 714/716 own.

---

## 3. Verified context

Every number, path and line below was measured in this worktree on **2026-08-06** with the real tool. Nothing is
inferred from a filename, a doc table, or a prior report — which is the failure mode this task exists to end.

### 3.1 The owner decision, quoted

Asked during the 715 review follow-up on **2026-08-06**: *"§22.3 таблиця z-index описує 7 токенів, яких немає. Що
718 робить з нею?"* — options offered were (a) delete the table and record the numeric scale, (b) **define the 7
tokens in globals.css**, (c) leave the ⚠️ banner and do gate-only.

**Owner chose (b): "Визначити 7 токенів у globals.css".**

This kickoff implements (b). The alternative of deleting the table is **closed** — do not re-open it.

### 3.2 What is missing, measured

`src/app/globals.css` defines **253** custom properties. A line-anchored grep for `^\s*--z-[a-z-]+\s*:` returns
**zero** matches. Instead, `:269-272` carries this comment:

```
  /* ── 4. Z-index — see ui-rules.md §16 ─────────────────────────── */
  /* The real, working scale is numeric core utilities: z-30 (chrome) /
     z-40 (scrim) / z-50 (floating), plus the allowlisted z-[9999] escape-hatch
     (Combobox mobile sheet, PerfDevOverlay). No --z-* named tokens exist here. */
```

That comment sits **inside the `@theme inline` block** (verified by brace-depth walk: lines 152, 180, 206, 258, 269
are all inside `@theme inline`). It is the correct insertion point, and its last sentence is what R1 makes false.

§22.3's table (`docs/design-system.md:659-667` before your edit, plus the ⚠️ banner 715 inserted above it):

| Token | Value | Tier | Defined in globals.css? |
|---|---|---|---|
| `--z-base` | `0` | base | **NO** |
| `--z-dropdown` | `10` | within-card | **NO** |
| `--z-sticky` | `30` | chrome | **NO** |
| `--z-overlay` | `40` | scrim | **NO** |
| `--z-modal` | `50` | floating | **NO** |
| `--z-popover` | `50` | floating | **NO** |
| `--z-toast` | `100` | highest | **NO** |

### 3.3 The bridging pattern you follow, read in source

`globals.css:145-192` establishes the repo's two-layer convention, and states its own rule:

```
  /* Named tokens --space-N mirror the Tailwind spacing step N.
     --spacing-N: var(--space-N) wires each p-N / m-N / gap-N / h-N
     utility to resolve through the named token, not the formula
     (satisfies "NOT a parallel definition" rule). */
```

So: a **named** token for `var()` access, plus a **bridge** into Tailwind's theme namespace so the utility resolves
through the same value. R1 supplies the named layer. §3.4 explains why the bridge layer has no counterpart here.

### 3.4 Tailwind v4 has no z-index theme namespace — measured, not assumed

| Probe | Result |
|---|---|
| `tailwindcss` version in `package.json` | `^4` |
| `z-index` occurrences in `node_modules/tailwindcss/theme.css` | **0** |
| `--z-index-` occurrences in `node_modules/tailwindcss/dist/lib.js` | **0** |
| how the `z` utility is declared in the lib | `"z",{supportsNegative:!0…}` — a **bare-value** functional utility |
| `.z-30` rule present in the production build | **yes** |
| `.z-modal` / `.z-popover` / `.z-toast` rules present in the production build | **no — the classes are inert** |

There is no `--z-index-*` namespace to bridge into, unlike `--spacing-N`. **Defining `--z-sticky` makes
`var(--z-sticky)` work; it cannot make a `z-sticky` utility class exist.** §22.3's "Use via" column currently
promises `z-sticky` — R3 corrects it. See A1 for the rejected `@utility` alternative.

### 3.5 Live consumers: zero

After 715's F1 correction, **no `.css` file under `src/` consumes any `--z-*` token.** Measured across 19 `.css`
files (excluding `globals.css`), 214 total `var(--x)` references, block comments stripped. The two former
consumers (`HeaderView.module.css:35`, `MobileBottomNavView.module.css:55`) now carry `z-index: 30` with a
`design-tokens-allow` marker citing this task.

**Consequence for R2/AC2:** defining seven custom properties that nothing reads cannot change a rendered pixel.
That is why this task does not run the 1184-cell matrix — and why I8 makes you **re-prove** the zero-consumer
count rather than inherit it from this paragraph.

### 3.6 The undefined-var baseline, measured — the tree is already clean

Same scan. Resolution sources: `globals.css` definitions · definitions local to the same file · custom properties
supplied by Tailwind/Mantine and verified present in the production build.

| Metric | Value |
|---|---:|
| `.css` files scanned under `src/` (excl. `globals.css`) | 19 |
| total `var(--x)` references | 214 |
| **unresolved** | **0** |

A first pass that did **not** strip multi-line block comments reported 6 false positives (`--sc-label-color`,
`--tab-bg`, `--tab-color`, `--tabs-color` — all inside explanatory comments in `input-chrome.css`; `--spacing` and
`--color-gray-200` — both Tailwind-supplied, confirmed defined in `.next/static/css/*.css`). **Both mistakes are
yours to avoid:** reuse the detector's existing comment-stripped source, and derive the external-prefix list from
measurement, not from a hand-written guess (A2).

**Because the baseline is 0, this gate can land blocking immediately** — no report-only staging, unlike 714 → 715.

### 3.7 Task 716 review F3 — two strings that are now false

`scripts/check-design-tokens.mjs`:

```js
:783  console.log(`  ── CSS DECLARATION LITERALS — report-only, not blocking (Task 714)  (${cssDeclFindings.length} …) ──`);
:797  console.log(`  715 owns the strict flip + remediation of this inventory. Docs: docs/design-system.md §23.6.`);
```

Both categories became blocking when 715 emptied `REPORT_ONLY_CATEGORIES`; 715 is closed. The 716 review assigned
F3 to 715, but 715's own scope froze that file at one line, so it could not absorb it. **It lands here.**

### 3.8 Worktree state

715 and 716 are committed. Two paths were modified after the 715 approval and may still be uncommitted when you
start: `docs/backlog.md` and `docs/orchestrator-procedures.md` (the 718 registry row and the "A documented token is
not an implemented token" rule). **Take your own pre-write `git status --porcelain` snapshot before your first
edit.** If it is not empty, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, §3.2 | The seven `--z-*` tokens are defined in `globals.css`'s `@theme inline` block at exactly the §22.3 values (`0/10/30/40/50/50/100`). The "No `--z-*` named tokens exist here" sentence is replaced by an accurate one. | P0 | AC1 | Confirmed |
| R2 | §3.5, D28 | **Zero rendered delta.** Re-prove that no `.css` under `src/` consumes any `--z-*` token; a defined-but-unconsumed custom property changes nothing. If a consumer exists, **stop and report**. | P0 | AC2 | Confirmed |
| R3 | §3.4 | §22.3's "Use via" column no longer promises `z-sticky`-style utilities. It states the two real forms: `var(--z-*)` in CSS/inline style, and the bare-value `z-30`/`z-40`/`z-50` utilities. The ⚠️ NOT-IMPLEMENTED banner 715 added is removed, replaced by a note recording that 718 defined the tokens. | P0 | AC3 | Confirmed |
| R4 | §3.6, F1 | **A `var(--x)` reference in `src/**/*.css` that resolves to no definition is a finding**, in a new category, **blocking** from the start. Resolution sources are: `globals.css`, the same file, and a measured external-prefix list. | P0 | AC4 | Confirmed |
| R5 | R4, D32 | **Planted-violation proof, both arms:** a `var(--z-does-not-exist)` planted in a scanned `.css` makes the gate exit **non-zero** naming it; removing it restores exit **0**. Capture both unpiped. | P0 | AC5 | Confirmed |
| R6 | §3.6, A2 | The external-prefix list is **derived by measurement** — every prefix on it is proven present in the production build or in `node_modules`. No prefix is added to silence a finding without that proof. | P0 | AC6 | Confirmed |
| R7 | §3.6 | On the remediated tree the new category reports **0** findings, so `npm run check:design-tokens` still exits **0**. | P0 | AC7 | Confirmed |
| R8 | §3.7 | `check-design-tokens.mjs:783` and `:797` no longer assert report-only status or pending 715 ownership. | P1 | AC8 | Confirmed |
| R9 | 716/715 | The existing detector suite still passes, plus new arms for R4 (resolves / does-not-resolve / comment-only / locally-defined / external-prefix). No pre-existing arm weakened. | P0 | AC9 | Confirmed |
| R10 | §22 | `docs/design-system.md` records the new category in §23 alongside the other detectors, and the `--z-*` definitions in §22.3. | P1 | AC10 | Confirmed |
| R11 | scope | Zero diff in `package.json`, `.github/workflows/governance-pr.yml`, `scripts/design-tokens-allowlist.json`, `scripts/check-stories-rendered.mjs`, and every `.module.css` under `src/`. Verify by hash. | P0 | AC11 | Confirmed |
| R12 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC12 | Confirmed |
| R13 | cl. 14, N6 | Counting gates run **last, after scratch cleanup**, numbers **reconcile to `git status`**. | P1 | AC13 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the owner's decision is implementable for `var()`, not for utilities, and that gap is a fact, not a
  re-litigation.** §3.4 measured that Tailwind v4 has no z-index theme namespace and declares `z` as a bare-value
  utility. Defining `--z-sticky` therefore delivers `var(--z-sticky)` and **cannot** deliver a `z-sticky` class.
  **Rejected alternative: add `@utility z-sticky { z-index: var(--z-sticky); }` × 7.** It would work, but it
  invents seven utilities with **zero** consumers (§3.5) on the same commit that adds a blocking gate — new
  surface area, no demand. R3 corrects the column instead. If the owner later wants the utilities, that is a
  separate task with its own migration of the existing `z-30/40/50` sites.
- **A2 — the external-prefix list is where this gate will be wrong if it is wrong.** Too narrow and CI goes red on
  `--tw-*`/`--mantine-*`; too broad and it re-admits exactly the phantom-token class this task exists to catch.
  Derive it from what the tree actually references, prove each entry, and keep it as small as the measured
  baseline allows. `--z-` must **not** be on it.
- **A3 — comment stripping is not optional.** §3.6 records that skipping multi-line block comments produced 4 false
  positives on the first pass. Reuse the detector's existing CSS-comment-stripped source (`codeOnlyCss`), do not
  write a second stripper.
- **A4 — the path-level allowlist still short-circuits whole files.** `scanContent`'s first line is
  `if (isAllowlisted(relPath, allowlist)) return [];`, so `src/design-system/mantine/**` is exempt from the new
  category too. That is **717's** blast radius, not yours. State the coverage limitation in the session log; do
  **not** narrow the allowlist here.
- **A5 — a `var()` fallback is still a reference.** `var(--maybe, 30)` resolves at runtime even when `--maybe` is
  undefined. **Decide and document** whether a fallback exempts the reference. Recommendation: treat a reference
  **with** a fallback as resolved (it cannot silently fall back to the initial value), and say so in §23. Either
  answer is defensible; silence is not.
- **A6 — `globals.css` is excluded from the scanner** (`check-design-tokens.mjs` header: "excludes globals.css").
  So the file defining the tokens is not itself scanned. That is correct and unchanged — but it means R4 cannot
  catch a self-referential mistake inside `globals.css`. State the limitation; do not widen the scan here.

### 5.1 Naming — decided, do not re-litigate

Extend `check-design-tokens.mjs` with **one** new category. No new script, no new npm script, no new CI step. No
task number in any identifier (Task 701 F2). Suggested category name: `css-undefined-var`.

### 5.2 Rejected alternatives — do not re-open

- **Delete §22.3's table instead of defining the tokens.** Rejected by the owner, §3.1.
- **`@utility z-sticky` × 7.** Rejected by A1 — zero consumers.
- **Land the new category report-only first**, mirroring 714 → 715. Rejected: §3.6 measured the baseline at **0**,
  so the staging that 714 needed has nothing to stage.
- **Add a CSS parser dependency.** Rejected, same as 714 §5.2 and 716 §5.2 — this is regex over comment-stripped
  source text. If you conclude regex genuinely cannot express it, **stop and report**; do not add the dependency.
- **Narrow the `src/design-system/mantine` path allowlist.** Rejected by A4 — **717**.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 1, 2, 9, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because this is a detector change:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** and → **"A documented token is not an implemented token — grep the definition, never the table"**
(the rule this task's origin produced) · `docs/design-system.md` **§22.3** and **§23.5–23.6/23.6.a/23.6.b`**.

**Because this defines tokens:** `src/app/globals.css` **`:145-192`** (the bridging convention and its
"NOT a parallel definition" rule) and **`:269-272`** (the comment R1 replaces) · `docs/ui-rules.md` **§16** (the
enforced numeric scale that stays authoritative for utilities).

**Task-specific — read, and note which you may not edit:**

- `scripts/check-design-tokens.mjs` — `scanContent`, its CSS-comment stripping, `DETECTION_PATTERNS`,
  `REPORT_ONLY_CATEGORIES` (now empty), and **`:783`/`:797`** (R8). **Do not touch any detection pattern.**
- `scripts/__tests__/check-design-tokens.test.ts` — 69 arms; add yours in the same style.
- `scripts/design-tokens-allowlist.json` — read for A4. **Do not edit.**
- `docs/sessions/2026-08-06-task715-…md` **§5.3** — the F1 evidence table this task closes.
- `.screenshots/task714-evidence/…inventory.md` and `.screenshots/task716-evidence/…inventory.md` — both carry a
  🛑 correction banner. **Read the banner; do not trust the rows it corrects.**

---

## 7. Scope

- `src/app/globals.css` — the seven `--z-*` definitions and the replaced comment (R1). **Nothing else in this file.**
- `scripts/check-design-tokens.mjs` — the new category + R8's two strings.
- `scripts/__tests__/check-design-tokens.test.ts` — new arms.
- `docs/design-system.md` — §22.3 (R3) and §23 (R10).
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-0X-task718-zindex-tokens-and-undefined-var-gate.md`.

## 8. Out of scope

- **Every `.module.css` under `src/`.** **Zero diff.** No migration of any `z-index: 30` to the new token — the
  markers 715 placed stay exactly as they are until a task explicitly owns that migration.
- **`package.json`, `governance-pr.yml`, `design-tokens-allowlist.json`, `check-stories-rendered.mjs`.** Zero diff.
- Every existing detection pattern — 714/716 own them.
- `@utility` definitions (A1) · narrowing the path allowlist (**717**) · 711's assertions.

---

## 9. Current and required behavior

**Current:** `docs/design-system.md` §22.3 tables seven `--z-*` tokens; `globals.css` defines none and says so at
`:269-272`. A `.module.css` may consume any undefined custom property and every gate stays green: the declaration
becomes invalid at computed-value time and silently falls back to the property's initial value. 715 shipped exactly
that into a production build. Two `console.log` strings still describe the CSS categories as report-only and 715 as
pending.

**Required after:** the seven tokens are defined at their documented values; §22.3 states the two forms that
actually exist; a `var(--x)` with no resolvable definition is a **blocking** finding proven by a planted violation;
the remediated tree reports zero of them so the gate still exits 0; and the two stale strings tell the truth.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`. Persist `check:design-tokens` (exit 0) and the current suite pass.
- **I2 — Failing arm first (D32).** Add the R4 arms and the planted `var(--z-does-not-exist)` case **before**
  implementing. They must fail. Persist that run.
- **I3 — Implement the gate**, reusing the comment-stripped source (A3) and deriving the external-prefix list by
  measurement (A2/R6). Decide A5's fallback question and document it.
- **I4 — Prove the baseline is 0** on the untouched tree (R7). If it is not, **stop and report** — do not add a
  prefix to make it zero.
- **I5 — Define the seven tokens** in `@theme inline` (R1), replacing the `:269-272` comment.
- **I6 — Planted proof (R5).** Both arms, unpiped, plant removed before the final gates; verify with `git status`.
- **I7 — R8's two strings; docs §22.3 + §23** (R3/R10).
- **I8 — Re-prove zero `--z-*` consumers** (R2) with the grep, and state the result. A consumer means **stop**.
- **I9 — Counting gates last, after deleting every scratch file**, so the numbers reconcile.

---

## 10. Implementation requirements

1. **The failing arm comes first** (I2) — D32.
2. **Never add an external prefix to silence a finding** (A2/R6). Every prefix is proven present.
3. **`--z-` is never on the external list.** It is the token family this task defines; if it needed exempting, R1
   failed.
4. **Reuse the existing comment stripping** (A3). A second stripper is a second blind spot.
5. **The plant is removed before the final gates run** (I6). Verify with `git status`.
6. **Zero diff in every `.module.css`** (R11) — hash-verify.
7. **Capture every transcript unpiped** (Task 710 R10).
8. **No task number** in any identifier (Task 701 F2).
9. **Counting gates LAST, after scratch cleanup, reconciled to `git status`** — 714, 716 and 715 all did this
   exactly; **a regression is a `P1`.**

---

## 11. Positive and negative flows

**Positive flow:** the seven tokens are defined; `var(--z-sticky)` resolves; §22.3 states the real forms; an
undefined `var()` is a blocking finding; the planted arm fails and its removal restores exit 0; the tree reports 0
of the new category; no `.module.css` changed; the suite passes; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `var(--x)` with no definition anywhere | **Yes** | R4 | **finding**, blocking | AC4, AC5 |
| `var(--x)` defined in `globals.css` | **Yes** | R4 | not a finding | AC4 |
| `var(--x)` defined in the same file | **Yes** | R4 | not a finding | AC4 |
| `var(--tw-…)` / `var(--mantine-…)` | **Yes** | A2/R6 | not a finding, prefix **proven** | AC6 |
| `var(--x)` inside a block comment | **Yes** | A3 | not a finding | AC4 |
| `var(--x, fallback)` | **Yes** | A5 | decided and documented | AC4 |
| A file the path allowlist short-circuits | **Yes** | A4 | not scanned; limitation stated, **717** | AC4 |
| Baseline is not 0 at I4 | **Yes** | R7 | **stop and report** — never widen the prefix list to reach 0 | AC7 |
| A `--z-*` consumer exists at I8 | **Yes** | R2 | **stop and report** — the render argument no longer holds | AC2 |
| Defining a token changes rendering | **Yes** | R2/§3.5 | it cannot — zero consumers, re-proven at I8 | AC2 |
| Locale / viewport / RLS | **No** | build-time script + 7 unconsumed custom properties; no strings, no rendering, no data access | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `globals.css`, then `^\s*--z-[a-z-]+\s*:` returns **7** matches inside `@theme inline`, with
  values `0/10/30/40/50/50/100` matching §22.3 row-for-row, and the "No `--z-* named tokens exist here" sentence is
  gone. Quote the inserted block.
- **AC2 [R2]** Given a grep for `var(--z-` across `src/**/*.css` and `src/**/*.tsx`, then the count is **0** and it
  is stated in the log; therefore no rendered evidence is required and the reason is written out, not assumed.
- **AC3 [R3]** Given §22.3, then the "Use via" column names `var(--z-*)` and the bare-value `z-30/z-40/z-50`
  utilities, states that a `z-sticky` class is not generated by Tailwind v4 and why, and the ⚠️ banner is replaced
  by a note that 718 defined the tokens.
- **AC4 [R4]** Given each §11 branch (undefined / globals-defined / same-file-defined / external-prefix /
  in-comment / with-fallback), then the category reports exactly the expected result. Show the arms.
- **AC5 [R5]** Given one `var(--z-does-not-exist)` planted in a scanned `.css`, then the gate **exits non-zero**
  naming it; given its removal, then exit 0. Show **both** transcripts and `git status` proving the plant is gone.
- **AC6 [R6]** Given the external-prefix list, then every entry is quoted with the evidence that it is externally
  supplied (a build-output or `node_modules` grep). `--z-` is absent.
- **AC7 [R7]** Given the untouched tree, then the new category reports **0** findings and
  `npm run check:design-tokens` exits **0**. Persist the transcript with the exit code inside it.
- **AC8 [R8]** Given `check-design-tokens.mjs:783`/`:797`, then neither claims report-only status nor pending 715
  ownership. Quote both before and after.
- **AC9 [R9]** Given the detector suite, then the pre-existing arms pass unchanged and the new arms pass. State
  totals before and after and confirm no pre-existing arm was weakened.
- **AC10 [R10]** Given `docs/design-system.md`, then §23 documents the new category with its resolution sources and
  the A4/A5/A6 limitations, and §22.3 records the definitions.
- **AC11 [R11]** Given `git diff`, then `package.json`, `governance-pr.yml`, `design-tokens-allowlist.json`,
  `check-stories-rendered.mjs` and every `.module.css` under `src/` are **empty**. Verify by hash.
- **AC12 [R12]** Given the final state, `npm run build` exits **0**, transcript at a stated path with the exit code
  inside it.
- **AC13 [R13]** Given the counting gates run **last and after scratch cleanup**, then both pass and their numbers
  **reconcile to `git status`**. State the reconciliation.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A CI-blocking gate gains a new blocking category, and `globals.css` — the
single source of every design token — is edited. Q4 compels the planted-violation proof (R5). A green gate run is
explicitly **not** sufficient.

**Rendered evidence is not required, and the reason is structural, not a waiver:** the task adds seven custom
properties with **zero** consumers (§3.5) and changes no `.module.css` (R11). I8 re-proves the zero-consumer count;
if it is not zero, the argument fails and the task **stops**.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | `npm run check:design-tokens` (I1) | exit 0 — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | current total passes — persisted |
| 4 | **New arms, pre-implementation** (I2) | **FAIL** — persisted; the D32 proof |
| 5 | Implement + green (I3/I4) | new arms pass |
| 6 | `npm run check:design-tokens` (I4, pre-token-definition) | new category **0 findings**, exit 0 |
| 7 | Define the tokens (I5) + re-run | exit 0, unchanged finding counts |
| 8 | **Planted `var(--z-does-not-exist)`** (I6) | **non-zero exit**; removal → exit 0; plant gone from `git status` |
| 9 | `grep -rn "var(--z-" src/` (I8) | **0** — or **stop and report** |
| 10 | `npx tsc --noEmit` | 0 errors |
| 11 | **`npm run build`** | **exit 0 — hard gate** |
| 12 | `check:file-integrity` · `check:mojibake` — **last, after cleanup** | pass; reconcile to `git status` |

A failed or unrun step 11 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.
Evidence under `.screenshots/task718-evidence/` (local-only, **D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task718-zindex-tokens-and-undefined-var-gate.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R13, each with its AC verdict.
3. **The inserted `--z-*` block**, quoted, with each value traced to its §22.3 row.
4. **The external-prefix list**, each entry with its proof (A2/R6).
5. **The A5 fallback decision and the A4/A6 limitations**, stated plainly.
6. **The gate's two arms** — planted violation failing, removal restoring exit 0, and `git status` proving cleanup.
7. **The I8 zero-consumer re-proof** — the command and its actual output.
8. **R8's two strings**, before and after.
9. **Commands run and actual results** — real exit codes, including the step-11 build transcript.
10. **Evidence locations** — every artifact, named.
11. **A real counting-gates section** with the numbers **and their reconciliation to `git status`**.
12. **Standing findings not acted on** — 717 (path allowlist), 711, 700 (the `@theme`-dependency gate this task is
    adjacent to but does not close), 702/691 (Sprint 46).
13. **Assumptions, deviations, limitations, unresolved issues.**
14. Concise current state in `docs/backlog.md` — **state only**. The file is at **86** lines against an ~80 target
    and already in `BACKLOG LIMIT BREACH`; **do not add net lines**, and re-flag the breach if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ the seven values, the exact insertion point (`@theme inline`, `:269-272`), the bridging convention it must match, the two stale strings with line numbers, the measured baseline, and every command are named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R13 → AC1–AC13 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC11 covering every `.module.css`, and §5.2's five rejected alternatives |
| **The owner decision is quoted, not inferred** | ✅ §3.1 quotes the question, the three options offered, and the chosen answer with its date. The task implements only the chosen route |
| **No number is asserted that was not measured with the real tool** | ✅ 253 defined properties · 19 files · 214 references · 0 unresolved · 0 `--z-*` consumers · Tailwind `theme.css` z-index count 0 · `--z-index-` count 0 · `.z-modal`/`.z-popover`/`.z-toast` absent from the build while `.z-30` is present — all run in this worktree on 2026-08-06 |
| **The owner's decision was pressure-tested against implementation reality** | ✅ §3.4 measured that Tailwind v4 cannot generate `z-sticky`; A1 records that the decision is implementable for `var()` only, keeps the chosen route, and corrects the doc column instead of quietly shipping a half-true table |
| The gate proves the changed behavior, not merely procedure | ✅ R5 is a two-armed plant on the new category itself; I2 requires the arms to fail first; §13 declares a green run insufficient |
| No new blind spot is created silently | ✅ A4 (path allowlist), A5 (`var()` fallback) and A6 (`globals.css` unscanned) each force a documented decision or limitation rather than a default |
| Zero/empty input covered | ✅ I4 requires the new category to be **0** before the tokens are defined, and §11 makes a non-zero baseline a **stop**, not a prefix-widening exercise |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I2's mandatory failure + I4's stop condition + I6's plant-and-remove + I8's stop condition + I9's cleanup-then-count |
| Owner exceptions have traceable authorization | ✅ §3.1's quoted decision; D6 for the evidence dir; D32 cited with its source |
| Exactly one active executable route | ✅ §3.1 closes the table question, §5.1 fixes naming, §5.2 closes five alternatives, A1/A2/A5 require decisions to be made and recorded |
| Prior-review corrections folded in | ✅ 715 **F1** (this task's origin) and **F2** (§22.3) · 716 **F3** (§3.7, R8) · 713 F3 → 714/716/715 **AC13** (§10.9 makes a regression a `P1`) · 710 **R10** (unpiped capture) · **701 F2** (no task numbers) · and the rule the whole episode produced: `orchestrator-procedures.md` → "A documented token is not an implemented token", now in the pre-read bundle |
| Sprint assigned before creation | ✅ Sprint 52, already open; row added to its Tasks table |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.** The §22.3 table question was decided on 2026-08-06 (§3.1). A1's utility gap
is a measured implementation constraint, not a second decision — it changes the documentation column, not the
chosen route. Whether to add `@utility z-sticky` definitions later is a separate task with its own migration.
