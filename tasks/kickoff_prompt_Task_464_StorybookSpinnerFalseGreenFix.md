# Task 464 — Fix Storybook screenshot false-green: spinner-only captures since Task 460

> **Executor:** Sonnet 4.6. **Type:** Storybook / visual-snapshot harness (tooling) + story anchors.
> **Orchestrator:** Opus 4.8. **Epic:** BB tooling (revalidates 460–463 proof). **Opened:** 2026-06-19.
> **Run order:** Task 464 MUST land and be approved BEFORE Task 465 (uk→ua migration) — 465's
> revalidation depends on a trustworthy rendered-proof gate, which is exactly what 464 repairs.

> ## 🔴 OWNER P0 AMENDMENT (2026-06-19) — empty / meaningless canvas is a HARD FAIL
> The owner has stated they do **not** trust the Storybook test results. This task is therefore **not only**
> about spinner-only screenshots. A screenshot is **not** proof of rendered content unless the gate verifies
> **all three layers** below — a cell may PASS only if **all three** are true. Any cell that proves only one or
> two of them is a FALSE GREEN and must FAIL.
>
> 1. **DOM readiness proof** — `#storybook-root` exists, has a non-zero bounding box, contains visible rendered
>    descendants, and is NOT merely the Storybook shell / a loader / an empty wrapper.
> 2. **Semantic story proof** — every `ASSERT_STORIES` entry declares ≥1 `anchors[]` marker; every declared anchor
>    is found AND visible. A missing anchor is a hard fail (`anchor-missing`); a story with **no** declared anchors
>    is a **config failure**, not a pass.
> 3. **Bitmap / screenshot sanity proof** — the captured PNG must not be visually empty (see "Required after
>    behavior" item 7). This is a smoke check that real visual content exists, **not** a visual-regression diff.
>
> The gate must **fail closed** (see "Guard integrity rule" below). No "best effort" passes are allowed.

---

## Pre-read (rule-index → "Storybook / visual snapshot task")

**Always required:** `docs/agent-contract.md` · `docs/backlog.md` · `docs/critical-flow-registry.md` (scan for the
"storybook-rendered-proof" / screenshot-gate flow — this task changes the gate that protects every UI task, so it
MUST add/own a registry row).

**Required:** `docs/storybook-governance.md` (§14 enforced gates, §14.3/§14.4 — the rendered-proof contract, §MQ
machine-detection limits) · `docs/storybook-visual-snapshots.md` · `docs/component-rules.md` · `docs/qa-rules.md` ·
`docs/design-system.md §27` (what `screenshots:assert` does and does NOT prove).

**Only if relevant:** `docs/responsive-screenshot-governance.md §MQ` · `docs/responsive-screenshot-matrix.md`.

**Editable docs (owner amendment):** `docs/critical-flow-registry.md` (new rendered-proof row + precondition rule)
and `docs/storybook-governance.md` (codify the 5-point rendered-proof contract). **Do not** read or edit anything
outside this list. Do **not** touch product UI (`src/components`, `app/`) other than adding the test-only semantic
anchors specified in §"Required after behavior" item 4.

---

## Problem statement (verified by orchestrator against the real harness)

The single accepted rendered-proof tool is `scripts/check-stories-rendered.mjs` (`npm run screenshots:assert`,
`:assert:fast`). Starting ~2026-06-18 18:00 it can score a cell **PASS while the captured PNG shows only the
Storybook loading spinner**, not the story content. This invalidates the mobile visual evidence on which Tasks
460–463 (and any later task) were approved.

**Root cause (confirmed by reading the harness, do not re-derive — fix it):**

1. `waitForStoryReady()` (lines ~275–297) has a spinner heuristic that only treats a cell as "not ready" when
   **ALL** of: an element carries `class="…animate-spin…"`, **AND** `#storybook-root` has `≤ 2` direct children,
   **AND** `root.textContent` is empty or starts with `loading`. Any spinner that does not match all three (different
   class, a wrapping element, a non-"loading" caption, more than two children) slips through as "ready".
2. On timeout (`timeoutMs = 5000`) `waitForStoryReady()` **silently returns** and the cell is captured and scored
   **normally** — a spinner-only canvas then passes every assertion: (a) no horizontal overflow ✓, (c) render-check
   is NOT "blank-canvas" because the spinner IS a child element of `#storybook-root` ✓, no `pageerror`, no
   `consoleError` ✓ → `cell.pass = true`. **False green.**
3. Assertion (c) render-failure detection (lines ~405–428) has **no spinner/loader branch** — it only catches
   error-display, known error text, and a truly empty root. A spinner-only root is "not failed".
4. There is **no semantic proof** that the *intended* story rendered. A blank-but-stable or spinner-but-stable
   canvas, or the wrong story, passes as long as it does not overflow.
5. `manifest.json` (line ~686) records `{ timestamp, matrix }` with per-cell assertions but **no story-anchor field**
   — so even a human auditor cannot tell from the manifest whether the real content was present.

The likely trigger for "since Task 460" is the slower-hydrating stories added around Tasks 460–463 (the nine
`admin-adminreportsmanager--*` cells, lines ~181–190) pushing first paint past the 5 s readiness window so the
harness captures the spinner — but **diagnosis item 1 below must confirm this on the real build, not assume it.**

---

## Current behavior to PRESERVE (do not regress)

- All five existing assertions (a)…(e) and their exact selectors/tolerances stay intact and keep failing on real
  defects (overflow, render error, non-full-width control/button, non-bottom-sheet popup).
- The transient-failure retry path (`isTransientFailure`, `MAX_ATTEMPTS = 3`) must keep retrying ONLY genuine
  blank-canvas / chunk-load flakes and must **never** retry a real defect (incl. the new spinner/anchor failures)
  into a pass.
- `--fast`, `--check`, the static-server lifecycle, port-6008 handling, and the `finally` browser/server teardown
  stay unchanged in contract.
- `manifest.json` stays backward-compatible: existing fields keep their names/shapes; new fields are additive.
- The `--check` mode (no browser) still exits 0 on a valid setup.

## Required after behavior (action by action — implement ALL)

1. **Diagnose first, then fix.** Build Storybook (`npm run build-storybook`) and run `screenshots:assert:fast`.
   Capture the actual failing/false-green cells (which stories, which locales, which viewports show spinner-only) and
   record the root cause in the session log with the offending PNG filenames. Confirm or correct the "Task 460+
   slow-hydration" hypothesis. Do not proceed to the fix without this evidence block.

2. **Readiness must wait for real content, not the shell/spinner.** Rework `waitForStoryReady()` so a cell is
   considered ready ONLY when the story's actual content is present — NOT when the canvas merely contains a spinner or
   the Storybook shell. Replace the brittle 3-part heuristic with a robust loader-presence check:
   - Treat the cell as **not ready** while ANY visible loading affordance is present in `#storybook-root`:
     `.animate-spin`, `[data-slot="skeleton"]`, `[role="progressbar"]`, `[aria-busy="true"]`, `[data-loading="true"]`,
     or a root whose entire visible text is empty / matches `/^\s*(loading|Загрузка|Завантаження|po ngarkohet|caricamento)/i`.
   - Keep the existing "rendered = non-empty `#storybook-root` with non-zero bbox OR error-display shown" condition as
     the positive signal, but it only counts once no loader affordance remains.
   - **Skeleton stories are legitimate content** (e.g. `primitives-skeleton--listing-card-skeleton`,
     `system-*` skeletons). Do NOT make every skeleton fail. Resolve this by an **allowlist of story-ids whose
     intended content IS a loading/skeleton state**, declared next to `ASSERT_STORIES`; for allowlisted ids the
     skeleton/spinner counts as content. For every other id a residual loader = not ready.

3. **Spinner-only at capture time is a HARD FAIL, never a silent pass.** When the readiness wait reaches its timeout
   AND a loader affordance is still present (and the id is not loader-allowlisted), set the cell to
   `pass = false` with `assertions.renderCheck.failReason = 'loader-only'` (+ a short `failDetail`). Add a matching
   branch to assertion (c) so a loader-only root scores FAIL exactly like `blank-canvas`/error-display. This failure
   is a **real defect → it must NOT be classified transient** by `isTransientFailure()` (guard added explicitly).
   Raise the readiness `timeoutMs` to a value that comfortably clears real first-paint (e.g. 15000) so we fail on
   genuinely-stuck spinners, not on slow-but-fine renders.

4. **Semantic proof anchors — prove the INTENDED story rendered.** Extend each `ASSERT_STORIES` entry with an
   `anchors` array: a list of `{ type: 'testid' | 'text' | 'role', value, label }` markers that MUST be found in the
   rendered DOM for the cell to PASS. After readiness, assert every declared anchor is present and visible; a missing
   anchor → `pass = false`, `failReason = 'anchor-missing'`, with the missing anchor labels in the cell. Anchors are
   **locale-independent** wherever possible — prefer stable `data-testid` / `data-slot` / `role` over translated text;
   when a text marker is unavoidable, source it from the locale messages, never a hardcoded English literal.

   The corresponding stories MUST expose these anchors (test-only `data-testid` is acceptable and is the ONLY product
   change authorised by this task). Minimum required anchors for the critical Task 463 surfaces:
   - **AdminReportsManager (Task 463 stories `admin-adminreportsmanager--*`):** the status-override Select+Apply
     section, the **Reopen** quick-action, the **Delete** action, and (for the delete-confirm stories) the confirm
     dialog — each with a stable `data-testid` (e.g. `report-status-override`, `report-reopen-action`,
     `report-delete-action`, `report-delete-confirm-dialog`).
   - **AdminPermissionsManager:** the `reports.status_override` row and the `reports.delete` row — `data-testid`
     `perm-row-reports-status-override` and `perm-row-reports-delete`. (Add a Storybook story for it to `ASSERT_STORIES`
     if one is needed to render those rows; if no suitable story/component exists, **STOP and ASK** — do not invent
     scope.)
   - Every other id in `ASSERT_STORIES` gets at least one anchor proving its headline content (re-use existing
     `data-slot`s where they already uniquely identify the surface; only add `data-testid` where none exists).

5. **Manifest must be self-describing.** Each manifest cell MUST include: `storyId`, `locale`, `viewport`,
   `screenshot` (path), the existing assertions, **plus** `anchorsExpected` (labels), `anchorsFound` (labels
   actually matched), **and** a `visualContentCheck` block carrying the bitmap-sanity verdict + metrics:

   ```json
   {
     "storyId": "...",
     "locale": "...",
     "viewport": "...",
     "screenshot": "...",
     "assertions": {},
     "anchorsExpected": [],
     "anchorsFound": [],
     "visualContentCheck": {
       "pass": true,
       "metrics": { "width": 0, "height": 0, "nonBackgroundRatio": 0, "variance": 0 }
     }
   }
   ```

   The top-level manifest keeps `timestamp` + `matrix` and ADDS a `summary` with **all** of these counters:

   ```json
   {
     "summary": {
       "total": 0,
       "passed": 0,
       "failed": 0,
       "loaderOnly": 0,
       "blankCanvas": 0,
       "emptyCanvas": 0,
       "blankScreenshot": 0,
       "anchorMissing": 0
     }
   }
   ```

   Keep all existing field names (additive only; backward-compatible). If the summary cannot be computed, the run
   FAILS (guard-integrity rule, item 8).

6. **Final report lists the proof-validity verdict for Tasks 460+.** The session log MUST contain a table of every
   task from 460 onward that had previous visual proof, stating for each: **was the prior proof invalid (spinner/no
   anchor)?** and **was it revalidated green under the fixed gate?** Re-run `screenshots:assert` (full, not just
   `--fast`) for the affected admin/report surfaces and paste the real PASS matrix.

7. **🔴 Bitmap / screenshot sanity proof — a blank or near-uniform PNG is a HARD FAIL.** After capturing each
   cell's screenshot, run a lightweight image-sanity smoke check (NOT a visual-regression diff). Add a dedicated
   function to `scripts/check-stories-rendered.mjs`, e.g.:

   ```js
   async function assertScreenshotHasMeaningfulPixels(screenshotPath, cellContext) {
     // Read the PNG. Verify width/height are valid (>0).
     // Sample pixels (or parse the full image) and compute:
     //   - nonBackgroundRatio : fraction of pixels differing from the dominant background colour
     //   - variance           : basic luma/colour variance across the crop
     //   - uniqueColorEstimate : rough distinct-colour count
     //   - (optional) edge/contrast count
     // Return:
     // {
     //   pass: boolean,
     //   failReason?: 'blank-screenshot' | 'empty-canvas',
     //   failDetail?: string,
     //   metrics: { width, height, uniqueColorEstimate, nonBackgroundRatio, variance }
     // }
   }
   ```

   **Failure conditions (the cell FAILS the bitmap layer):**
   - the screenshot file is **missing or 0 bytes** → `failReason = 'blank-screenshot'`;
   - **invalid dimensions** (width/height ≤ 0 or unparseable PNG) → `failReason = 'blank-screenshot'`;
   - the crop/viewport area is **visually blank / near-uniform** (almost entirely one flat colour, transparent,
     or shell-only) → `failReason = 'blank-screenshot'`;
   - meaningful non-background pixel variance is below threshold → `failReason = 'empty-canvas'` when DOM exists but
     no meaningful story content is visible, else `'blank-screenshot'`.

   **Threshold rule** — conservative enough not to fail legitimate simple UI, strict enough that a white/empty/
   transparent/shell-only capture cannot pass. Recommended initial rule (tune against the real corpus, record the
   chosen constants in the session log): **fail if `nonBackgroundRatio < 0.005` AND `variance < minimalVarianceThreshold`**;
   also fail if the image is almost entirely one flat colour. The chosen `minimalVarianceThreshold` MUST be justified
   with the metrics of a known-good simple cell vs a planted blank cell so the band between them is documented.
   **Loader-allowlisted skeleton stories** (item 2) may bypass the loader-only failure, but they STILL must have their
   declared skeleton anchor AND a non-empty bitmap — an allowlisted skeleton with a blank bitmap still FAILS.

8. **🔴 Guard integrity rule — the gate FAILS CLOSED.** Wire the bitmap check into the per-cell verdict alongside
   readiness + anchors, and make every degenerate/ambiguous condition a FAIL, never a silent pass:
   - a story with **no declared anchors** → FAIL (config error);
   - **malformed anchor config** → FAIL;
   - screenshot **cannot be parsed** → FAIL (`blank-screenshot`);
   - screenshot **path missing from the manifest** → FAIL;
   - `anchorsExpected` **empty** for any non-allowlisted story → FAIL;
   - `anchorsFound` **≠** `anchorsExpected` → FAIL (`anchor-missing`);
   - manifest summary **cannot be computed** → FAIL.

   **New hard-fail `renderCheck.failReason` branches (all are real defects — none may be retried as transient):**

   ```text
   loader-only       → spinner/progress/skeleton loader remains for a non-allowlisted story
   blank-canvas      → #storybook-root missing, empty, zero bbox, or no visible descendants
   empty-canvas      → DOM exists but no meaningful story content is visible
   blank-screenshot  → PNG missing, invalid, zero-size, or visually near-uniform
   anchor-missing    → intended story marker is absent
   ```

---

## Positive flow (happy path)

- **Actor:** CI / executor running `npm run build-storybook && npm run screenshots:assert`.
- **Preconditions:** Storybook built into `storybook-static/`; Playwright chromium installed.
- **Steps & system response:**
  1. Harness starts static server on 6008, readiness-pings `/iframe.html` → 200.
  2. For each story×locale×viewport: navigate, **wait for real content** (loader affordance gone AND root non-empty),
     run assertions (a)–(e) + **anchor presence**, screenshot.
  3. A story whose content + all declared anchors are present and which passes (a)–(e) → cell `pass = true`,
     written to manifest with `anchorsFound == anchorsExpected`.
  4. Console prints `✓` per pass; `manifest.json` + PNGs written; on all-pass prints `✅ All rendered assertions PASSED`,
     exit 0.
- **Success state / post-conditions:** manifest `summary.failed == 0`, `summary.loaderOnly == 0`,
  `summary.anchorMissing == 0`; every PNG shows real content; exit code 0.

## Negative flow (every off-happy-path branch — each must have a verifiable code path)

- **Spinner/loader still visible at timeout (non-allowlisted id):** cell `pass = false`,
  `failReason = 'loader-only'`; printed under "Failed cells"; NOT retried as transient; process `exitCode = 1`.
- **Declared anchor missing (wrong/blank/partial story):** cell `pass = false`, `failReason = 'anchor-missing'`,
  missing labels listed; exit 1.
- **Empty / shell-only canvas (DOM present, no meaningful content):** cell `pass = false`,
  `failReason = 'empty-canvas'` (or `blank-canvas` if root is missing/zero-bbox/no visible descendants); exit 1.
- **Blank / near-uniform / missing / zero-byte screenshot:** cell `pass = false`, `failReason = 'blank-screenshot'`,
  with the `visualContentCheck.metrics` recorded; exit 1.
- **Real render error / error-display:** unchanged — FAIL (assertion c).
- **Genuine transient (chunk-load flake with no error, no defect):** retried up to `MAX_ATTEMPTS`; only a clean pass
  counts. `loader-only`, `blank-canvas`, `empty-canvas`, `blank-screenshot`, and `anchor-missing` cells are ALL
  explicitly excluded from `isTransientFailure` (AC14) — they are real defects, never retried into a pass.
- **Loader-allowlisted skeleton story (e.g. Skeleton/ListingCard):** the skeleton counts as content → may PASS if its
  anchor is present; it must NOT be forced to fail by the new loader rule.
- **`storybook-static/` missing:** existing error + exit 1 (preserve).
- **Port 6008 in use:** existing message + exit 1 (preserve; harness never kills foreign processes).
- **Playwright not installed / `--check`:** existing behavior (preserve).
- **A story has no declared anchor:** treat as a config error — fail the run with a clear message (every
  `ASSERT_STORIES` entry must declare ≥1 anchor), so coverage cannot silently degrade.

---

## Mobile <640 full-width gate (OWNER P0)

This task changes the **harness that PROVES** the mobile gate; it does not change product layout. Requirements:
- The fixed gate MUST still enforce assertions (b)(d)(e) full-width/bottom-sheet at `<640` exactly as today, now on
  top of the new "real content present" precondition (so a spinner can no longer fake a `<640` pass).
- Any `data-testid` added to a product component for anchoring MUST NOT alter rendered layout/classes (test attribute
  only) — verify in the diff that no className/structure changed.
- Revalidation matrix below is the proof.

## Rendered verification matrix (REQUIRED in the session log — agent-contract clause 12)

Re-run `screenshots:assert` (full) after the fix and paste the real matrix for the affected report/admin surfaces:
rows = canonical viewports, columns = `sq · en · uk · it`, **`uk@320/375/390` mandatory stress cells must show
ACTUAL CONTENT (anchors found), not a spinner.** Attach the machine-produced `manifest.json` path and the
`anchorsFound` evidence per critical cell. A self-reported table, or any "no browser access" cell, is an auto-reject.

## Negative-gate proof (the gate must be REAL, not a no-op) — planted violations REQUIRED

Add each planted violation, run the gate, and paste the transcript into the session log proving the OLD gap and the
NEW hard-fail. Remove/restore each after capturing evidence:

1. **Spinner-only story:** a temporary story that renders only a spinner. The OLD gate would pass (or did pass) →
   the NEW gate FAILS with `loader-only`.
2. **Empty-canvas story:** a temporary story that renders `<div data-testid="empty-shell" />` or an empty wrapper
   that still has dimensions → the NEW gate FAILS with `empty-canvas` or `blank-screenshot`.
3. **Missing-anchor story:** a valid story whose `ASSERT_STORIES` anchor config points at a non-existent marker →
   the NEW gate FAILS with `anchor-missing`.
4. **Blank-bitmap story:** a temporary story that renders a white/transparent full-size block with no meaningful UI →
   the NEW gate FAILS with `blank-screenshot` / `empty-canvas`.
5. **Overflow still fails:** a planted horizontal-overflow violation on a story that DOES pass rendered-proof →
   the existing overflow assertion still FAILS (proves rendered-proof did not weaken the existing visual gates).
6. **Valid story:** the same story PASSES **only** after real visible content AND its required anchors are present.

Record the OLD vs NEW behaviour explicitly for items 1–4 (the OLD harness passes the degenerate cell — the bug; the
NEW harness fails it). None of these may be reclassified as transient (item 8 + AC14).

## Governance-doc updates (REQUIRED — owner P0 amendment)

Update **both** docs so the rendered-proof contract is codified, not just coded:

- **`docs/storybook-governance.md`** and **`docs/critical-flow-registry.md`** must state: *a screenshot is NOT proof
  of rendered Storybook content unless the gate verifies (1) no unresolved loader; (2) non-empty visible DOM;
  (3) required semantic anchors; (4) non-blank screenshot bitmap; (5) manifest evidence for anchors AND
  visual-content metrics.* **Horizontal-overflow (and all other visual) checks are valid only AFTER this
  rendered-proof precondition passes** (the layer-1-before-layer-2 ordering above).

These two governance files are explicitly IN SCOPE for this task (added by the owner amendment) — see the updated
"Likely files touched" list.

## Regression coverage (agent-contract clause 15)

`scripts/check-stories-rendered.mjs` is the proof gate protecting every UI task — add/own a row in
`docs/critical-flow-registry.md` for "storybook-rendered-proof (loader/empty/blank/anchor)" with: the command, the
happy path (real content passes), the failure paths (`loader-only`, `blank-canvas`, `empty-canvas`,
`blank-screenshot`, `anchor-missing` all FAIL), the rendered-proof-precedes-visual-gates rule, and the
planted-violation transcripts above as the standing proof the gate is not a no-op. Baseline note: the OLD harness
PASSES a spinner-only / blank cell (the bug); the NEW harness FAILS it — record both.

---

## OWNER P0 — Rendered-proof is a PRECONDITION for all visual gates (2026-06-19)

Horizontal-overflow, responsive, full-width, popup, and regression checks are **invalid** unless the story first
passes rendered-proof. The harness MUST evaluate each cell in this exact order, short-circuiting on the first layer
that fails:

1. **Rendered-proof — real story content is present:**
   - no unresolved loader (`loader-only`);
   - no empty canvas (`blank-canvas` / `empty-canvas`);
   - no blank screenshot (`blank-screenshot`);
   - all required anchors found (`anchor-missing` otherwise).
2. **Existing visual gates run (only if layer 1 passed):**
   - horizontal overflow;
   - mobile `<640` full-width controls;
   - popup / bottom-sheet placement;
   - existing assertions (a)–(e).
3. **Regression proof recorded:**
   - planted spinner-only violation fails;
   - planted empty-canvas violation fails;
   - planted missing-anchor violation fails;
   - planted overflow violation still fails;
   - valid story passes only with real content and anchors.

**A PASS is valid only when BOTH layers pass:** `renderedProof.pass === true` **AND** `visualAssertions.pass === true`.
A cell MUST NEVER pass overflow/regression checks if `renderedProof` failed — surface both sub-verdicts in the manifest
cell so the precedence is auditable.

## Acceptance criteria (every item verifiable in the diff / transcript)

- [ ] **AC1** — A deliberately spinner-only story FAILS the gate (`loader-only`). [Negative-gate proof 1]
- [ ] **AC2** — A story missing its expected anchor FAILS the gate (`anchor-missing`). [Negative-gate proof 2]
- [ ] **AC3** — Valid stories PASS only after the expected anchors are present. [Negative-gate proof 3]
- [ ] **AC4** — Each critical story exposes story-specific anchors: AdminReportsManager (status-override section,
      Reopen, Delete, confirm dialog) and AdminPermissionsManager (`reports.status_override`, `reports.delete` rows).
      [diff: stories + `ASSERT_STORIES.anchors`]
- [ ] **AC5** — Manifest includes per-cell `storyId`, `locale`, `viewport`, `screenshot` path, `anchorsExpected`,
      `anchorsFound`; top-level `summary{ total, passed, failed, loaderOnly, anchorMissing }`. [manifest sample in log]
- [ ] **AC6** — Final report table lists which Tasks 460+ had invalid prior visual proof and which were revalidated.
- [ ] **AC7** — Revalidated matrix covers `sq/en/uk/it × 320/375/390` for the affected task surfaces; **`uk@320/375/390`
      cells show actual content (anchors found), not spinner.** [Positive flow + matrix]
- [ ] **AC8** — Existing assertions (a)–(e), `--fast`/`--check`, retry/transient logic, server lifecycle preserved;
      loader-allowlisted skeleton stories still PASS. [Current-behavior section]
- [ ] **AC9** — Critical-flow-registry row added; planted-violation transcripts present (gate is real).
- [ ] **AC10** — Any added `data-testid` is attribute-only; no product layout/className change. [diff]
- [ ] **AC11** — An empty-canvas / shell-only story (`<div data-testid="empty-shell" />` or empty wrapper) FAILS with
      `empty-canvas` or `blank-canvas`. [Negative-gate proof 2]
- [ ] **AC12** — A blank or near-uniform screenshot (white/transparent full-size block, no meaningful UI) FAILS with
      `blank-screenshot`. [Negative-gate proof 4]
- [ ] **AC13** — Screenshot bitmap-sanity metrics (`width`, `height`, `nonBackgroundRatio`, `variance`) are recorded
      per cell in `manifest.visualContentCheck`; chosen thresholds justified in the log. [manifest sample + item 7]
- [ ] **AC14** — `isTransientFailure()` explicitly EXCLUDES `loader-only`, `blank-canvas`, `empty-canvas`,
      `blank-screenshot`, and `anchor-missing` — none of these is ever retried into a pass. [diff: guard]
- [ ] **AC15** — `docs/critical-flow-registry.md` states that horizontal-overflow proof (and every other visual gate)
      is INVALID unless the rendered-proof preconditions pass first (layer-1-before-layer-2 ordering). [diff: registry]
- [ ] **AC16** — Planted violations prove BOTH the old gap and the new hard-fail for: spinner-only, empty-canvas,
      blank-bitmap, and missing-anchor; plus the planted overflow violation still fails and the valid story passes only
      with real content + anchors. [Negative-gate proof 1–6]
- [ ] **AC17** — `summary` exposes `total, passed, failed, loaderOnly, blankCanvas, emptyCanvas, blankScreenshot,
      anchorMissing`; the gate fails closed on any degenerate/ambiguous condition (no-anchor story, malformed anchor
      config, unparseable screenshot, missing screenshot path, empty `anchorsExpected`, uncomputable summary).
      [manifest + guard-integrity item 8]

## 🔴 Approval blockers (orchestrator review gate — owner P0, do NOT waive)

This task is approved ONLY after diff-review + the evidence below. "All green" alone is an **auto-reject**:

1. **Real negative transcripts are mandatory** — the session log MUST paste the ACTUAL failing output for each
   planted violation, not a claim that they fail:
   ```
   loader-only ............ FAIL   (planted spinner-only story)
   empty-canvas/blank-canvas FAIL  (planted empty / shell-only story)
   blank-screenshot ....... FAIL   (planted white/transparent block)
   anchor-missing ......... FAIL   (anchor pointed at a non-existent marker)
   overflow violation ..... FAIL   (still fails on a story that passes rendered-proof)
   valid story ............ PASS   (only with anchors + real bitmap present)
   ```
   A run that only shows passes, or describes the failures in prose without the transcript, is INCOMPLETE → route back.
2. **Bitmap threshold must be empirically justified, not invented.** The log MUST record the measured metrics of a
   **known-good simple cell** vs a **planted blank cell** (`nonBackgroundRatio`, `variance`) and show the chosen
   `minimalVarianceThreshold` sits in the band between them. Reviewer checks this specifically: a threshold that is
   too loose (blank passes) OR too tight (legitimate simple UI flakes) = route back. No magic number without the
   side-by-side metrics.
3. **Manifest sample reviewed** — at least one real `visualContentCheck` cell + the top-level `summary` must be
   pasted and cross-checked against the PNGs.

## Hard contract (verified against the real diff on return)

No scope change; no invented architecture (STOP and ASK if AdminPermissionsManager has no renderable story, or if a
critical anchor cannot be added without restructuring a component). Run `npx tsc --noEmit` → 0 errors,
`node --check scripts/check-stories-rendered.mjs`, `npm run check:stories`. **File-integrity (clause 14):** read back
every written file; 0 NUL bytes, parses/compiles, not truncated; paste the green transcript. Update `docs/backlog.md`
+ add `docs/sessions/2026-06-19-task-464-storybook-spinner-false-green.md` with the AC-by-AC self-audit table (cite
Positive AND Negative flows by name), a **"Files Changed" table** (one row/path + rationale). **Do NOT run git / emit
`git add`/`git commit`** — the orchestrator emits commit commands after diff review (single-writer).

## Likely files touched (executor confirms in the Files Changed table)

- `scripts/check-stories-rendered.mjs` — readiness rework, loader-only FAIL, `assertScreenshotHasMeaningfulPixels`
  (bitmap sanity → `blank-screenshot`/`empty-canvas`), `blank-canvas`/`empty-canvas` branches, anchor assertion,
  rendered-proof-before-visual-gates ordering, manifest `visualContentCheck` + expanded `summary`,
  `isTransientFailure` exclusion guard (loader-only/blank-canvas/empty-canvas/blank-screenshot/anchor-missing),
  `ASSERT_STORIES.anchors`, loader-allowlist, fail-closed guard integrity.
- `src/components/admin/AdminReportsManager*.stories.tsx` (+ component, `data-testid` only) — Task 463 anchors.
- `src/components/admin/AdminPermissionsManager*.stories.tsx` (+ component, `data-testid` only) — permission-row
  anchors (STOP and ASK if no story exists).
- `docs/critical-flow-registry.md` — new rendered-proof row + "visual gates invalid until rendered-proof passes" rule.
- `docs/storybook-governance.md` — codified 5-point rendered-proof contract (loader/DOM/anchors/bitmap/manifest).
- `docs/backlog.md` + `docs/sessions/2026-06-19-task-464-…md`.

> **uk→ua note:** this kickoff uses the live `uk` locale token. Task 464 lands BEFORE Task 465; once 465 renames
> `uk → ua`, the matrix/anchor locale token follows 465 — do not pre-emptively rename here.
