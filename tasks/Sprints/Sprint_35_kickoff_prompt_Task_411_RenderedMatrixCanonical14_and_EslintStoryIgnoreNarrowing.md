# Sprint 35 — Task 411 — Rendered-proof harness → canonical 14 viewports + narrow the story ESLint ignore

**Type:** Storybook / visual-snapshot + governance-config (ESLint) — mixed
**Executor:** Sonnet 4.6
**Status:** OPEN (corrective follow-up; **blocks Task 410 approval**)
**Created by:** orchestrator review of Task 410, 2026-06-08 (HEAD `1e31dbb39`)

> **Why this exists.** Task 410 added 14 admin harness stories + 16 `ASSERT_STORIES` entries and is
> otherwise clean, but it CANNOT be approved on its current rendered proof for two reasons the
> orchestrator confirmed against the real files:
> 1. **`npm run screenshots:assert` renders only 7 viewports** (`VIEWPORTS_FULL` in
>    `scripts/check-stories-rendered.mjs` = 320·375·390·480·**640**·768·1280), but the project
>    canonical responsive matrix (agent-contract clause 12 + `docs/responsive-screenshot-matrix.md`)
>    is **14 viewports: 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560**. The "full"
>    run is a reduced smoke subset, so it cannot discharge the clause-12 rendered matrix.
> 2. **The `eslint.config.mjs` change is broader than needed and has a side effect.** Adding
>    `src/**/*.stories.tsx` + `src/stories/**` to the shared `LISTING_STATUS_IGNORES` constant —
>    which is **spread into the LAST, story-governance `no-restricted-syntax` block's `ignores`**
>    (eslint.config.mjs ~line 382) — makes that block's `files` and `ignores` both match every story,
>    which **excludes story files from the entire block**, silently disabling ESLint groups **A–H**
>    for stories (raw `<img>`, `window.location`, `suppressHydrationWarning`, AND the story-only bans:
>    `layout:'centered'/'padded'`, raw `<button>/<input>/<select>/<textarea>`, `/Ukrainian/` export
>    names, raw title literals). `scripts/check-stories.mjs` happens to re-cover E–H, so the build
>    stayed green — but the ESLint copy of story governance is now dead, which is not what the change
>    claimed ("status literals are fixture data, not mutations") and is not proven governance-safe.

---

## Pre-read (per `docs/rule-index.md` — Storybook/visual-snapshot + governance-config)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required:** `docs/storybook-governance.md` (§14 enforceable gate), `docs/storybook-visual-snapshots.md`,
`docs/responsive-screenshot-matrix.md` (canonical 14-viewport list), `docs/qa-rules.md`.
**Only if relevant:** `docs/responsive-screenshot-governance.md`, `docs/governance-enforcement.md`
(§5 mutation-gateway contract — needed to narrow the ESLint ignore correctly).

Do **not** read beyond this set.

---

## Scope (exactly these files — no others)

- `scripts/check-stories-rendered.mjs` — viewport matrix source.
- `eslint.config.mjs` — narrow the story status-literal exemption.
- `package.json` — only if you add a dedicated full-matrix script (Part A option 2).
- `docs/responsive-screenshot-matrix.md` and/or `docs/storybook-governance.md` — document whichever
  command is the canonical full-matrix acceptance command.
- `docs/backlog.md` + a new `docs/sessions/2026-06-08-task411-*.md` session log.

**Out of scope (do NOT touch):** any `src/**` product code, any **real** `*.stories.tsx`, any `app/**`,
`modules/**`, migrations, locale JSON, RLS/auth/data-access. This task changes only the harness,
the lint config, docs, and the backlog/session log. If you think a real story or component must
change, **STOP and ASK** — do not. The ONLY permitted `src/**` writes are the temporary, deleted-
before-report lint-probe files defined in "Clarification for negative-flow lint probes" below.

### Clarification for negative-flow lint probes (resolves the scope ↔ negative-flow tension)

The final diff MUST NOT include any change to a **real** `*.stories.tsx` file or any product code.

For the planted-violation lint proofs, do NOT edit real stories. Instead create **temporary,
uncommitted probe files** under a clearly named scratch path that is matched by the same ESLint
rules, for example:
- `src/__lint-probes__/Task411Probe.stories.tsx` — matches the story-governance block
  (`src/**/*.stories.tsx`), so groups A/C/D/**E/F/G/H** apply: plant `layout:'centered'`, a raw
  `<button>`, an export named `…Ukrainian…`, and a raw title literal here.
- `src/__lint-probes__/task411-product-status-probe.ts` — matches the general `.ts` block, so the
  B status-mutation selectors apply: plant `.update({ status: 'active' })` here.
- (Optionally a story file containing `status: 'active'` fixture data to prove the narrow B
  exemption — this must lint **clean**.)

Create these ONLY for the negative-flow proof, run `npm run lint`, capture the FAIL/PASS transcript,
then **delete every probe file** before the final report. Final `git status` / `git diff --name-only`
MUST show **no** probe files and **no** real story changes. The session log pastes the transcript
AND explicitly confirms the probe files were removed (`ls src/__lint-probes__` → not found).

---

## Part A — Rendered-proof harness must cover the canonical 14 viewports

The canonical matrix (single source of truth: `docs/responsive-screenshot-matrix.md` + agent-contract
clause 12) is exactly these 14 widths:

```
320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560
```

**Use Option 1 by default — it is mandatory.** `npm run screenshots:assert` full mode MUST run the
canonical 14-viewport matrix. **Option 2 is allowed ONLY if** you first prove the full run is
operationally prohibitive AND receive **explicit owner/orchestrator approval** before implementing a
separate command — otherwise do NOT create a second mode (two modes is exactly the confusion this
task removes). If you think Option 2 is warranted, **STOP and ASK**; do not pick it unilaterally.

**Option 1 (DEFAULT, MANDATORY): make `screenshots:assert` full mode = the canonical 14.**
- Replace `VIEWPORTS_FULL` so the non-`--fast` run iterates all 14 canonical widths above
  (heights per `responsive-screenshot-matrix.md`; reuse its names: `mobile-320…`, `canonical-560`,
  `canonical-680`, `tablet-768`, `canonical-810`, `canonical-960`, `desktop-1024`, `canonical-1200`,
  `desktop-1440`, `desktop-1920`/large, `huge-2560`, etc. — match the doc's names).
- Keep `--fast` = the 3 mobile cells (320/375/390) for quick local loops.
- Drop the non-canonical `tablet-640` from the full set (640 is the `sm` boundary, not a canonical
  acceptance width) — or keep it ONLY as an extra, never as a substitute for a canonical width.

**Option 2 (only if option 1's full run is operationally too slow): dedicated full-matrix command.**
- Add e.g. `--matrix` / `screenshots:assert:full` that runs all 14; leave the default run as the
  smoke subset, **but** update `docs/storybook-governance.md` + `docs/responsive-screenshot-matrix.md`
  so final acceptance EXPLICITLY requires the full-matrix command, and the smoke run is named as a
  dev-loop convenience that NEVER closes a task.

Either way the **acceptance command must, in one run, produce a manifest covering all 14 canonical
widths × `sq/en/uk/it`** for every entry in `ASSERT_STORIES`.

---

## Part B — Narrow the ESLint story exemption (governance-safe)

Goal: stories may carry `status: 'active'`-style **fixture literals** (group B2/B1/B3 status-mutation
selectors) without lint errors, **WITHOUT** disabling groups **A, C, D, E, F, G, H** for stories.

- **Remove** `src/**/*.stories.tsx` and `src/stories/**` from the shared `LISTING_STATUS_IGNORES`
  constant (revert those two lines). That constant is spread into three blocks, including the
  story-governance block — adding stories there is what nukes A–H for stories.
- Instead, exempt stories from **only the B (listing-status mutation) selectors**, narrowly. The
  clean place is the dedicated story-governance block (the LAST `no-restricted-syntax` block,
  `files: ["src/**/*.stories.tsx", ...]`): keep groups A, C, D, E, F, G, H selectors active there,
  and **omit the three B selectors** (the `status === 'active'` BinaryExpression, the
  `{ status: 'active' }` Property, and the `.update({status})` CallExpression) from that block only.
  Stories then keep full story governance while their fixture status literals are allowed.
- If you find a cleaner equivalent that satisfies the same property (B off for stories, A/C/D/E–H on
  for stories) and is consistent with the flat-config LAST-WINS warning at the top of the file,
  that is acceptable — but it MUST be proven by the Part-C negative-flow lint run, not asserted.

---

## Positive flow (happy path)

1. Build Storybook: `npm run build-storybook` → `check:stories` passes, build completes.
2. Run the canonical acceptance command (Part A option 1: `npm run screenshots:assert`; option 2:
   the new full-matrix command).
3. The transcript header reads `Viewports: 14` (not 7) and the run ends **`N/N PASS, 0 FAIL`** with a
   manifest under `.screenshots/rendered-assert/<ts>/` containing every `storyId × {sq,en,uk,it} ×
   {14 widths}` cell.
4. `npm run lint` passes with **0 new errors** on the real tree.
5. Post-conditions: every admin harness story has `uk@320`, `uk@375`, `uk@390` cells **and** at least
   one `≥1024` desktop cell in the manifest; AdminTable and StatusChangeControl appear as asserted
   cells (not merely "pre-existing storied").

## Negative flow (every off-happy-path branch — implement/prove each)

- **Reduced-subset regression guard:** if the viewport source is ever reduced below the 14 canonical
  widths, acceptance must be impossible to pass off as full. Prove by temporarily trimming the list
  to 7 and showing the count/manifest reflects 7 (then restore) — document this as the planted check.
- **Planted layout violation (group E):** put `parameters:{layout:'centered'}` in the
  `src/__lint-probes__/Task411Probe.stories.tsx` probe → `npm run lint` must **FAIL** naming the E
  selector (proves Part B did NOT disable E). Repeat the planted-violation FAIL proof in the same
  probe for **F** (raw `<button>`), **G** (export named `…Ukrainian…`), and **H** (raw title
  literal) — each must FAIL under `npm run lint` after Part B. (See "Clarification for negative-flow
  lint probes" — use probe files, never real stories; delete before report.)
- **Status fixture literal (group B) lints clean in a story:** a `*.stories.tsx` probe containing
  `status: 'active'` as fixture data must **NOT** error under `npm run lint` (proves the narrow B
  exemption works).
- **Status mutation outside gateway still bites in product code:** plant `.update({status:'active'})`
  in `src/__lint-probes__/task411-product-status-probe.ts` (non-story) → `npm run lint` must still
  **FAIL** (proves you narrowed by rule for stories only, not globally). Delete the probe after.
- **`screenshots:assert` with no built Storybook:** the script already errors with
  "storybook-static/ not found" — leave that guard intact; confirm it still exits non-zero.

## Acceptance criteria (each maps to a flow + must be verifiable in diff/transcript)

- **AC1 (Part A):** `scripts/check-stories-rendered.mjs` (or the new command) iterates exactly the 14
  canonical widths in full mode — verifiable at the `VIEWPORTS_FULL`/matrix definition file:line.
  (Positive flow step 2–3.)
- **AC2 (Part A):** acceptance transcript shows `Viewports: 14` and `0 FAIL`, with manifest path.
  Paste the FULL transcript in the session log. (Positive flow step 3.)
- **AC3 (Part A):** session log's rendered matrix covers `sq/en/uk/it` × all 14 widths; `uk@320/375/390`
  per admin surface; ≥1 `≥1024` desktop cell per admin surface; AdminTable + StatusChangeControl
  asserted. (Positive flow step 5.)
- **AC4 (Part B):** `eslint.config.mjs` no longer lists stories in `LISTING_STATUS_IGNORES`; story
  governance groups A/C/D/E/F/G/H remain active for stories — verifiable at the story-block file:lines.
  (Negative flow: planted E/F/G/H FAIL.)
- **AC5 (Part B):** negative-flow lint transcript pasted: planted E,F,G,H each FAIL; planted product
  `.update({status})` FAILs; story fixture `status:'active'` does NOT error. (Negative flow.)
- **AC6:** if Option 2 chosen, `docs/storybook-governance.md` + `docs/responsive-screenshot-matrix.md`
  state the full-matrix command is the acceptance command and the smoke subset never closes a task.
- **AC7 (clause 14):** integrity transcript for every touched file (0 NUL, no BOM, `node --check` for
  `.mjs`, `JSON.parse` for `.json`, `tsc --noEmit` 0-new).

## Hard contract (verified against the diff on return)

No scope change; no architecture invention (STOP & ASK on ambiguity); literal AC; self-validate
before "complete" (tsc=0, AC-by-AC table, self-audit, git-diff review); preserve all existing
harness assertions and story governance; cover all four locales in any new doc strings; **do NOT
emit `git add`/`git commit`** — include a Files-Changed table; the orchestrator emits commits.

## Mobile <640 full-width gate

This task changes harness/config/docs only — no UI surface is added or modified, so there is no new
`max-sm` surface to enforce. The gate is satisfied *indirectly*: the whole point of Part A is to make
the rendered proof that enforces the <640 full-width gate actually cover the canonical widths. Do not
add or alter any rendered component. If you believe a component needs a `max-sm` change, STOP and ASK.

## Notes for the executor

- `scripts/task404-computed-proof.mjs` is **untracked scratch from Task 404/405**, unrelated to this
  task or Task 410 — do **not** stage it, reference it, or commit it.
- Heights/names for the canonical widths already exist in `docs/responsive-screenshot-matrix.md` and
  `.storybook/preview.tsx` canonical presets (Task 350-Fix) — reuse them, don't invent new names.

## Ordering (orchestrator-enforced)

1. **Task 411 must pass and be approved first** (canonical-14 harness + narrowed ESLint, both proven).
2. **Then re-run / finish Task 410's rendered proof** using the corrected canonical-14
   `screenshots:assert` — full `sq/en/uk/it × 14` matrix, `0 FAIL`, `uk@320/375/390` per admin
   surface + ≥1 `≥1024` cell per admin surface.
3. **Only then can Task 410 be approved** and its commit emitted.
4. **Then continue Epic JJ: 408 → 407.**
