# Sprint 35 — Task 411 — Make `screenshots:assert` a trustworthy rendered-proof gate: canonical 14 viewports + FAIL on Storybook error screens + global App Router mock + narrow the story ESLint ignore

**Type:** Storybook / visual-snapshot + governance-config (ESLint) — mixed
**Executor:** Sonnet 4.6
**Status:** OPEN (corrective follow-up; **blocks Task 410 approval**)
**Created by:** orchestrator review of Task 410, 2026-06-08 (HEAD `1e31dbb39`)

> **Why this exists.** Task 410 added 14 admin harness stories + 16 `ASSERT_STORIES` entries and is
> otherwise clean, but it CANNOT be approved on its current rendered proof for three reasons the
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
> 3. **🔴 `screenshots:assert` reports PASS for stories that did not render (owner-found, 2026-06-08).**
>    The owner ran the command and inspected the PNGs: several admin cells are **Storybook runtime
>    error screens**, yet they are counted PASS. Example — `admin-adminlocaleswitcher--default` at
>    `en × canonical-560/680/810/960/2560` shows **"invariant expected app router to be mounted"**.
>    Root cause in `scripts/check-stories-rendered.mjs`: the pass rule is
>    `cell.pass = noOverflow && (viewport.width >= 640 || fullWidthOk)`, and the `try/catch` only
>    catches Playwright navigation/evaluate throws — **never** a React/Storybook error boundary that
>    renders as ordinary DOM. So an error screen (no overflow, no select/tabs/input to measure) scores
>    PASS. **The gate currently validates "a PNG was produced," not "the story rendered." That makes
>    the whole rendered-proof gate untrustworthy** — a screenshot of an error boundary is a FAILED
>    render and MUST fail the gate. (This also proves Task 410's AdminLocaleSwitcher story never
>    actually rendered — its App Router context is missing — so 410 needs a real story/mock fix, not
>    just more viewports.)

> **🔴 GOVERNING PRINCIPLE FOR THIS TASK: a screenshot of a Storybook error boundary is NOT rendered
> proof — it is a failed render and must FAIL the gate.** Until `screenshots:assert` enforces this,
> every "0 FAIL" transcript it has ever produced is suspect. No code commits (410 or 411) until the
> hardened gate renders real UI at 14 viewports with 0 FAIL and zero error screens.

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

- `scripts/check-stories-rendered.mjs` — viewport matrix source **+ render-error detection (Part C)**.
- `eslint.config.mjs` — narrow the story status-literal exemption (Part B).
- `.storybook/preview.tsx` (and/or a `.storybook/**` decorator file) — global App Router /
  `next/navigation` mock (Part D) so router-dependent stories render. **Global infra only — do NOT
  edit real `*.stories.tsx` files.**
- `package.json` — only if Part A Option 2 is explicitly approved.
- `docs/responsive-screenshot-matrix.md` and/or `docs/storybook-governance.md` — document the
  canonical full-matrix acceptance command **and** the new render-success requirement (§14 gate).
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
  that is acceptable — but it MUST be proven by the negative-flow lint run below, not asserted.

---

## Part C — `screenshots:assert` must FAIL on a story that did not render (gate-validity fix) 🔴

This is the most important part: the gate must distinguish "story rendered correctly" from "Storybook
showed an error screen." A produced PNG is NOT proof.

Harden `scripts/check-stories-rendered.mjs` so each cell is marked **FAIL** (with a recorded reason in
the manifest) when ANY of these is true — in ADDITION to the existing overflow / full-width checks:

- **Playwright `pageerror` event** fired during the cell (attach `page.on('pageerror', …)` before
  `goto`; any uncaught exception ⇒ FAIL with the message).
- **Console error indicating render failure** (attach `page.on('console', …)`; treat `type==='error'`
  whose text matches the render-failure set below as FAIL — keep a small allowlist for known-benign
  noise if needed, documented).
- **Storybook / React error-boundary DOM is present**, detected by `page.evaluate` checking for, at
  minimum: the Storybook error display container (e.g. `#error-message`, `.sb-errordisplay`,
  `[data-test-id="sb-error"]` — confirm the actual selector Storybook 10 renders), and body text
  matching any of:
  - `expected app router to be mounted`
  - `The component failed to render properly`
  - `Couldn't find story matching` / `did not render`
  - `Missing Context` / missing provider
  - a generic `Error: ` / stack-trace block occupying the canvas.
- **Empty/blank canvas** where a story is expected (e.g. `#storybook-root` has no element children),
  which is the other shape a silent failure takes.

A cell that hits any of the above is `pass:false`, `error:"<reason>"`, and the run exits non-zero.
The summary must print failed cells with their reason (it already prints failed cells — extend it to
include the render-failure reason, not just the overflow/full-width hints).

**Negative-flow proof (mandatory, via the probe path from the clarification block):**
- Create a temporary `src/__lint-probes__/...`-style **broken** probe story (e.g. one that throws on
  render, or that calls `useRouter()` with no provider) under a path Storybook builds, build, and run
  `screenshots:assert` → the probe cell MUST be reported **FAIL** with the render-error reason.
  Equivalently, you may run the assert against the CURRENT broken `AdminLocaleSwitcher` state BEFORE
  Part D and show it FAILs. Either way, paste the FAIL transcript. Then remove the probe.
- After Parts C+D, the same command on the real tree must be **0 FAIL** with no error screens.

---

## Part D — Provide the App Router / `next/navigation` context mock globally (Storybook infra)

The `invariant expected app router to be mounted` failure means router-dependent admin stories
(AdminLocaleSwitcher, AdminMobileHeader, AdminSidebar, … anything using `useRouter`/`usePathname`/
`useSearchParams`) have no App Router context in Storybook.

- Add the App Router mock at the **global** Storybook level — `.storybook/preview.tsx` parameters
  (with `@storybook/nextjs-vite` this is typically `parameters: { nextjs: { appDirectory: true,
  navigation: { … } } }`) and/or a shared decorator — so EVERY story gets a mounted router context.
  **Do this globally; do NOT edit individual real `*.stories.tsx` files.** Confirm the exact API for
  the installed Storybook/next adapter version before implementing; if the correct API is ambiguous,
  **STOP and ASK** rather than guess.
- This Part fixes the gate's environment. Any admin story that STILL renders an error after a global
  router mock (because it needs per-story data/session/params beyond what global infra can give) is
  **out of scope for Task 411** — it is routed to **Task 410 rework** (fix the individual story's
  mock, or reclassify it as a GAP back into `scripts/story-coverage-exempt.json` with justification).
  Task 411 must NOT fake a pass for such a story and must NOT silently re-exempt it; list it for 410.

---

## Positive flow (happy path)

1. Build Storybook: `npm run build-storybook` → `check:stories` passes, build completes.
2. Run the canonical acceptance command (Part A option 1: `npm run screenshots:assert`; option 2:
   the new full-matrix command).
3. The transcript header reads `Viewports: 14` (not 7) and the run ends **`N/N PASS, 0 FAIL`** with a
   manifest under `.screenshots/rendered-assert/<ts>/` containing every `storyId × {sq,en,uk,it} ×
   {14 widths}` cell.
4. **Every cell rendered real UI** — the hardened gate (Part C) found no error boundary, no
   `pageerror`, no render-failure console error, no blank canvas. AdminLocaleSwitcher (and every
   router-dependent admin story) shows its actual control, NOT "invariant expected app router to be
   mounted." Spot-confirm by opening a sample of the PNGs.
5. `npm run lint` passes with **0 new errors** on the real tree.
6. Post-conditions: every admin harness story has `uk@320`, `uk@375`, `uk@390` cells **and** at least
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
- **Render-failure detection (Part C) actually bites:** with a broken probe story (or the current
  pre-Part-D AdminLocaleSwitcher state), `screenshots:assert` must report that cell **FAIL** with a
  render-error reason in the manifest — NOT PASS. Paste this FAIL transcript. After Part D, the real
  tree is 0 FAIL with no error screens. This is the proof that the gate is no longer "PNG = PASS."

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
- **AC6 (Part C):** `scripts/check-stories-rendered.mjs` fails any cell with a Storybook/React error
  boundary, `pageerror`, render-failure console error, or blank canvas, and records the reason in the
  manifest — verifiable at the file:line of the new detection logic. (Positive flow step 4.)
- **AC7 (Part C):** negative-flow transcript pasted showing a broken probe (or pre-Part-D
  AdminLocaleSwitcher) cell reported **FAIL** with a render-error reason; and the real-tree run is
  0 FAIL with no error screens. (Negative flow: render-failure detection.)
- **AC8 (Part D):** the App Router / `next/navigation` mock is applied globally in `.storybook/**`
  (no real `*.stories.tsx` edited); router-dependent admin stories render real UI. Any story that
  still cannot render is listed for Task 410 rework (fix or GAP), NOT faked or silently re-exempted.
- **AC9:** if Option 2 chosen, `docs/storybook-governance.md` + `docs/responsive-screenshot-matrix.md`
  state the full-matrix command is the acceptance command and the smoke subset never closes a task.
  Either way, the docs record the new render-success requirement (an error-screen PNG is not proof).
- **AC10 (clause 14):** integrity transcript for every touched file (0 NUL, no BOM, `node --check` for
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

1. **Task 411 must pass and be approved first** — canonical-14 harness (Part A) + narrowed ESLint
   (Part B) + **render-failure detection (Part C)** + **global App Router mock (Part D)**, each
   proven (incl. the negative-flow FAIL transcript showing the gate catches an error screen).
2. **Then re-run / finish Task 410's rendered proof** on the now-trustworthy canonical-14
   `screenshots:assert` — full `sq/en/uk/it × 14`, `0 FAIL`, **no error screens**, `uk@320/375/390`
   per admin surface + ≥1 `≥1024` cell per admin surface. Every admin story listed by Part D as still
   broken must be **fixed (per-story mock) or reclassified as a GAP** in this 410 rework — the
   hardened gate will now surface them honestly instead of green-washing them.
3. **Only then can Task 410 be approved** and its commit emitted.
4. **Then continue Epic JJ: 408 → 407.**

> **No code commits (410 or 411) until the hardened gate renders real UI at all 14 viewports with
> 0 FAIL and zero Storybook error screens.** A screenshot of an error boundary is not proof.
