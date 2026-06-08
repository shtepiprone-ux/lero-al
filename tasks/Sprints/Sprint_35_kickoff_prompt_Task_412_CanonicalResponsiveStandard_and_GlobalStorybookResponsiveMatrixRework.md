# Sprint 35 — Task 412 — Canonical lero-al Responsive Standard + Global Storybook Responsive Matrix Rework (Phase 0: standard + global inventory + phased-slice plan)

**Type:** Governance / Design-System docs + Storybook-inventory (NO product code) — mixed
**Executor:** Sonnet 4.6
**Status:** OPEN
**Created by:** orchestrator, 2026-06-08 (HEAD `8b2b70303`), after owner directive + Task 411 rendered run (2459/2520 PASS, 61 FAIL)
**Reviewer:** Opus 4.7 orchestrator (diff + inventory review only; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST.** For ambiguity, follow **P0 Addendum A7**: do not invent, but do not halt the global inventory unless continuing would require an out-of-scope edit or weakening an existing P0 rule.

---

## 🔴 P0 Addendum — hardcode / invention / pseudo-responsive loophole closure (owner, 2026-06-08) — BINDING, OVERRIDES ANY WEAKER WORDING BELOW

This addendum is binding and **overrides any weaker wording elsewhere in this task**. Where it is stricter or more global than another clause, the addendum wins.

### A1. Exact canonical viewport list
The canonical responsive matrix is **exactly**: `320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560`.
- Do **not** replace this with generic labels (mobile/tablet/desktop).
- Do **not** validate a reduced subset.
- Do **not** treat `uk` as the only stress locale; `uk` may be a stress case, but **`sq/en/uk/it` are ALL mandatory**.
- The Phase-1 standard MUST contain this **exact 14-number list** verbatim in `docs/design-system.md`.

### A2. No responsive hardcode / arbitrary-value loophole
The Phase-1 standard MUST include a dedicated **"Forbidden responsive hardcodes and pseudo-fixes"** clause that explicitly forbids local responsive fixes based on:
- raw pixel widths/heights/min-width/max-width;
- arbitrary Tailwind values — `w-[…]`, `min-w-[…]`, `max-w-[…]`, `h-[…]`, `text-[…]`, `gap-[…]`, `p-[…]`, `m-[…]`, `z-[…]` — unless already a documented approved design-system exception;
- inline `style={{ … }}` layout fixes;
- component-local magic breakpoints;
- component-local media queries that bypass the canonical breakpoint system;
- `overflow-hidden` used to hide a responsive defect;
- `whitespace-nowrap` on localized labels unless paired with an approved truncation/wrap/accessibility rule;
- shrinking text/buttons below the canonical touch/readability rules to "make it fit";
- removing labels, actions, columns, filters, row actions, pagination, validation, or empty/loading/error states to pass a screenshot;
- locale-specific hacks for `uk`/`it`/`sq`/`en`;
- story-only hardcoded text or layout fixtures that make screenshots pass while product behavior remains non-canonical.

If an exception is genuinely required, it goes in an **"Approved exception proposal"** table with: surface · reason · affected locales · affected viewports · why canonical tokens/classes cannot solve it · owner approval status. **Unapproved exceptions are FAIL.**

### A3. No invented tokens / APIs / components
The standard may reference **only existing, documented** design-system tokens, classes, components, and component APIs. Sonnet must **not** invent new token names, Tailwind aliases, component props, responsive APIs, wrappers, decorators, or helper utilities and document them as if they already exist. If a new token/API/helper is needed, record it as a **proposed future slice or open decision** — never present it as canonical in Task 412.

### A4. Control & capability preservation applies globally
The Phase-1 standard and Phase-2 inventory MUST include a **global control-preservation rule**: any existing user capability/control/action must either (a) remain reachable + usable at **every** canonical viewport and **every** locale; (b) move to a specified new location/pattern with the same capability preserved; or (c) be explicitly listed as removed **with owner approval**. **Silent removal is forbidden.** A read-only label is **not** a replacement for an editable control. A collapsed/hidden action is **not** PASS unless there is an approved, discoverable replacement pattern.
For every story/surface with controls, the inventory must record: columns · row-click behavior · row actions · inline controls · filters · search · sort · pagination · bulk actions (if present) · empty · loading · error · validation states · submit/save/cancel/destructive actions · mobile/tablet/desktop behavior.

### A5. Story inventory must be story- AND surface-complete
A single story row may **not** hide multiple independent responsive risks. If one story renders multiple independent surfaces, use either **one story-level row + nested surface rows**, or **one row per story-surface**. Each surface row includes: surface type · components rendered · locales covered · viewport risk · current pattern · required canonical pattern · needs-fix (yes/no/GAP) · governing Phase-1 contract.

### A6. Story-discovery evidence is mandatory
Before the final inventory, the session log MUST contain a **story-discovery transcript** showing: all discovered story files; all generated story ids/names from Storybook metadata or current scripts; which are in `ASSERT_STORIES`; which are NOT; which are docs/demo/product-rendering; which are Locale-Stress; which cannot be evaluated and why. **No manual cherry-picking. No silent omission.**

### A7. STOP & ASK must not be used to avoid the global inventory
If one surface is ambiguous, do **not** halt the whole task. Instead: complete all non-blocked doc + inventory work; mark the ambiguous surface `OPEN DECISION` or `GAP`; include the recommended canonical decision; name the exact future slice needing owner approval. **Halt immediately only** if continuing would require editing an out-of-scope product/story/harness file or weakening an existing P0 rule.

### A8. No weakening of existing governance
Do **not** weaken, delete, narrow, or reword existing stricter P0 rules. On any conflict, the **stricter/more-global rule wins**; record the conflict in the session log. Any proposed weakening needs owner approval and must **not** be applied in Task 412.

### A9. Required validation additions (in the session log)
- `git diff --name-only` proving **only** allowed docs/backlog/session/inventory files changed.
- `git diff --stat` for reviewability.
- A **forbidden-path check** proving zero changes under `src/**`, `app/**`, `modules/**`, `.storybook/**`, `*.stories.tsx`, harness scripts, lint config, or locale JSON.
- The **story-discovery transcript** (A6) proving the inventory was generated from the full story set, not manually narrowed.
- A check that `docs/design-system.md` contains the **exact 14-viewport list** (A1) **and** the **"Forbidden responsive hardcodes and pseudo-fixes"** clause (A2).

---

## Why this task exists (and why it is bounded the way it is)

The owner reviewed the Task 411 rendered PNG matrix and ruled that the responsive failures are **systemic, not isolated defects**. The standing pattern of narrow per-component follow-up fixes (point-fixing AdminCurrenciesManager, AdminSettings, etc.) is **no longer acceptable**. There must be **one canonical lero-al responsive standard**, applied identically to **every** rendered Storybook story, every visible component/control inside them, **all four locales** (`sq/en/uk/it`), and **all 14 canonical viewports**.

**Two owner P0 rules govern this work and BOTH must be honored — this task is the reconciliation:**

1. **Owner directive (2026-06-08):** GLOBAL coverage is mandatory. Do **not** narrow to the 3 currently-failing managers; do **not** create a one-off "411-Fix"; the 61 FAIL cells are **evidence/examples only, NOT the scope**.
2. **`docs/design-system.md §18` (owner P0, standing):** migration is **phased** — "a kickoff that migrates public + admin + cabinet at once is FORBIDDEN," and the all-at-once Task 343 is on record as **frozen: too large, loop-prone, low-verifiability.**

**Reconciliation (the shape the owner approved, 2026-06-08):**

1. **First** write/normalize the canonical responsive standard + the global Storybook responsive contract (this task, Phase 1).
2. **Then** inventory **every** rendered Storybook story and every affected surface globally (this task, Phase 2).
3. **Based on that full inventory**, split implementation into **owner-approved phased slices** (this task produces the *proposed* plan; the owner approves slice-by-slice).
4. Each slice references the **same** canonical standard and **must not invent local responsive rules**.
5. The **first** implementation slice is already owner-pre-approved: the 3 overflowing managers (`AdminCurrenciesManager`, `AdminPropertyTypesManager`, `AdminCompaniesManager`) migrate from raw `<table>` to the **`AdminTable` / `AdminCardList` `tableAtLg` pattern (cards `<1024`, table `≥1024`)** — `docs/design-system.md §10`, with `AdminListingsTable` as the shipped reference.

**Therefore Task 412 itself ships NO product code.** It delivers the standard (docs), the global inventory, and the proposed phased-slice plan. Implementation slices are SEPARATE follow-up tasks, filed one at a time after the owner approves this task's standard + inventory + plan.

**Disposition of adjacent tasks (owner-confirmed 2026-06-08):**
- **Task 411 = harness hardening ONLY.** The 14-viewport / 4-locale `screenshots:assert` now correctly reports the 60 overflow failures instead of green-washing them — that is its success. It does **not** prove responsive correctness. The single `AdminMobileHeader/Default × uk × huge-1920 → net::ERR_NO_BUFFER_SPACE` cell is an **infra/resource flake, not a layout defect** — record + reclassify, do not block 411 on it.
- **Task 410 remains NOT APPROVED** until the global Storybook responsive matrix is green against the canonical standard.

---

## Pre-read (per `docs/rule-index.md` — UI/layout + admin-table + Storybook + docs-governance; load ONLY these)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required:**
- `docs/design-system.md` — **the canonical home of the responsive standard** (read in full: §2 mobile-first, §3 14-viewport canon, §4 containers, §6 typography/wrapping, §9 admin layout, §10 `tableAt`, §11 filters/search/tabs/actions, §12/§12a/§12b/§12c controls, §13 cards/grids, §14 overlays, §15 forbidden patterns, §16 inventory, §17 grep, §18 phasing, §19–21 QA/PASS/FAIL).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md` (canonical `AdminTableRow`/`AdminTable` pattern).
- `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`.
- `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md` (canonical 14-viewport list).
- `docs/qa-rules.md`.
- `docs/orchestrator-role.md` + `docs/rule-index.md` (this is a governance/docs task).
**Only if relevant:** `docs/governance-checklists.md`, `docs/governance-enforcement.md`.

Do **not** read beyond this set. Do **not** "read all docs."

---

## Scope — EXACTLY these file classes, no product code

**You MAY write/edit:**
- The responsive-standard governance docs (Phase 1) — primarily **`docs/design-system.md`** (the canonical home). Cross-link, do **not** duplicate, from: `docs/component-rules.md`, `docs/component-governance.md`, `docs/storybook-governance.md`, `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md`, `docs/qa-rules.md`, and add the pointer in **`docs/rule-index.md`** so future responsive/Storybook tasks land on the canonical section.
- A new **global Storybook responsive inventory** doc (Phase 2): `docs/responsive-storybook-inventory.md` (story-by-story table + risk class + proposed slice).
- `docs/backlog.md` (active-state update — orchestrator may also edit this at review; coordinate via the session log).
- A new session log: `docs/sessions/2026-06-08-task412-canonical-responsive-standard-and-global-inventory.md`.

**OUT OF SCOPE — do NOT touch in Task 412:** any `src/**` (components, stories, fixtures), `app/**`, `modules/**`, migrations, locale JSON, `*.stories.tsx`, harness scripts (`scripts/check-stories-rendered.mjs`, `scripts/check-stories.mjs`), `eslint.config.mjs`, `.storybook/**`. **If you believe a single product/harness file must change to make the standard enforceable, STOP & ASK** — do not edit it; record it as a proposed slice instead.

> Rationale: keeping Task 412 to docs+inventory makes it fully reviewable and keeps the §18 phasing intact. The actual responsive code changes are the phased slices that come after.

---

## Phase 1 — Canonical lero-al responsive design standard (concrete + enforceable)

The standard's canonical home is **`docs/design-system.md`** (already titled "Global Responsive Design System Contract — v1"). **Do NOT create a competing standard doc or duplicate rules across files** — strengthen/normalize the existing sections, fill gaps, and add cross-links + a `rule-index.md` pointer. Every other governance doc references the canonical section rather than restating it.

The standard MUST be **concrete and enforceable** — never abstract ("make it responsive"). It must define, with exact Tailwind fragments / structural rules, the following contracts (consolidate where they already exist; add where missing). Where a contract already exists in `design-system.md`, cite the section and only fill gaps — note in the session log "existing / extended / new" per contract:

1. **Global layout contract** — mobile-first mandatory; no accidental desktop shrinkage; deliberate mobile/tablet/desktop/wide-desktop behavior; no horizontal clipping; no off-screen controls; nothing hidden behind sticky/fixed layers; no unexpected overflow; fixed widths replaced by responsive constraints unless justified; containers use safe `min-w-0` + wrap/grid/flex/scroll; wide desktop (1440/1920/2560) not stretched/sparse/broken.
2. **Buttons & action groups contract** — primary actions never overflow/clip; secondary/destructive always reachable; action groups have explicit behavior (wrap / stack / full-width / approved overflow menu); no forced single row at narrow widths; icon+label wrap/truncate/hide/stack rule; ≥44px touch targets; save/cancel/destructive visible at every viewport; `sq/en/uk/it` labels never break layout. (Anchor to §12a/§12b canonical fragments.)
3. **Forms & settings contract** — labels/helper/validation/inputs/textareas/selects/submit readable+usable; long localized labels wrap; cards never clip actions; footer actions have predictable mobile/tablet/desktop placement; textareas have safe min-heights and never force parent overflow; validation/error states never break layout. (Anchor §12.)
4. **Tables & data views contract** — desktop tables are NOT squeezed onto mobile/tablet; every table/data view declares a deliberate pattern: canonical mobile/card layout **or** an explicitly-approved, contained, discoverable horizontal-scroll **or** a documented responsive-table variant; horizontal scroll only when intentional+contained+discoverable and never clips controls; sticky columns/z-index never hide content; badges/status/dates/prices/row-actions/pagination never clip; search/filter/sort + row actions remain reachable; empty/loading/error states follow the same rules; **768/810/960 tablet widths are intentionally designed, not a broken hybrid.** (Anchor §10 `tableAt`; restate `tableAtLg` as the admin default.)
5. **Toolbars / filters / search contract** — canonical stacking/wrapping order; predictable wrap; no reliance on one-line desktop layout at all widths; filter rows never push actions off-screen; long localized labels never break the toolbar; sticky filters/headers never hide content. (Anchor §11 + FilterBar fragment.)
6. **Navigation & shell contract** — shells/sidebars/mobile drawers/headers/tabs/nav fit every viewport; drawers/dialogs never create inaccessible controls; sticky/fixed never overlap interactive content; nav labels wrap/truncate/reflow by rule.
7. **Overlays contract** — Dialog/Sheet/Select/Combobox/DropdownMenu/Popover/Command fit the viewport; internal scroll when needed; footer actions reachable; never clipped; focus-visible never breaks layout. (Anchor agent-contract clause 11 mobile bottom-sheet rule + §14.)
8. **Localization stress contract** — `uk`+`it` long strings are required stress cases; `sq`+`en` must also pass; no story passes only in English; no hardcoded text fixes; no locale-specific hacks unless documented+approved; wrap/truncate preserves meaning+usability.
9. **Storybook responsive-proof contract** — proof stories render fullscreen/canvas via the global `withCanvas` decorator (or equivalent); `layout:'centered'|'padded'` is NOT responsive proof; a screenshot of a Storybook error boundary is a FAILED render, not proof; a screenshot with clipped/inaccessible controls is not proof; `screenshots:assert` is necessary but **not sufficient** — PNGs are visually reviewed against this standard; owner screenshots are examples, not scope.

Each contract states the **definition of PASS and FAIL** for that surface class (tie into §20/§21). The standard must be specific enough that a future slice references a clause and knows the exact required classes/structure — with **no room to invent local behavior**.

---

## Phase 2 — Global Storybook story inventory + proposed phased-slice plan

Create `docs/responsive-storybook-inventory.md`. Inventory **every** rendered Storybook story under `.storybook/**`, `src/**/*.stories.tsx`, `src/stories/**` — including docs/demo stories that render product/demo UI and Locale-Stress stories, and stories NOT currently in `ASSERT_STORIES`. Do **not** omit any; if a story cannot be evaluated, mark it **GAP** with the exact reason — never silently skip.

Inventory table (one row per story):

| Story file | Story id/name | Area/category | Components/surfaces rendered | Locales covered | Responsive risk | Needs fix? | Reason / which Phase-1 contract |
|---|---|---|---|---|---|---|---|

Categories to label and cover: **Admin, Layout, Shared, Primitives, System, Listing, Public/product UI, Docs/demo, Locale Stress**, and any other rendered category present.

Then produce a **Proposed Phased-Slice Plan** (for owner approval, honoring §18 — small, reviewable, one area at a time). Each proposed slice = {slice name, stories/components in it, the Phase-1 contract(s) it enforces, the `tableAt`/pattern decision per surface, estimated diff size, dependencies}. Seed the plan with:

- **Slice 1 (owner-pre-approved):** `AdminCurrenciesManager`, `AdminPropertyTypesManager`, `AdminCompaniesManager` → migrate raw `<table className="w-full">` to `AdminTable`/`AdminCardList` `tableAtLg` (cards `<1024`, table `≥1024`). **Preserve every column, row action, inline control, filter/search/sort, pagination, empty/loading/error state — no capability removal; contained horizontal-scroll is NOT the primary fix.** This slice fixes the 60 known overflow cells (`sq/en/uk/it × 320/375/390/480/560`).
- Subsequent slices: grouped by area from the inventory (e.g. remaining admin managers, then Layout/Shell, then Shared/Primitives, then Listing/Public), each its own future task.

Also document, per the directive's "Phase 4" intent, a **machine-detection assessment**: which failure classes the current `screenshots:assert` geometry check CAN reliably catch (e.g. `scrollWidth > innerWidth`) vs. which require **manual visual QA** (clipped-but-not-overflowing controls, inaccessible columns, broken wide-desktop sparsity). Record the manual-visual-QA requirement in `docs/storybook-governance.md` / `docs/responsive-screenshot-governance.md`. **Do NOT modify the harness scripts in this task** — if a harness improvement is warranted, propose it as a named slice.

---

## Positive flow (happy path for this docs+inventory task)

1. Sonnet reads the pre-read set.
2. Phase 1: strengthens/normalizes the 9 contracts in `docs/design-system.md`; cross-links the other governance docs; adds the `rule-index.md` pointer. For each contract records "existing / extended / new."
3. Phase 2: writes `docs/responsive-storybook-inventory.md` with the full story table + categories + GAP rows + the proposed phased-slice plan (Slice 1 seeded) + the machine-detection assessment.
4. Updates `docs/backlog.md` (Last Session + Last-used → 412) and writes the session log with: the contracts diff summary, the inventory, the proposed plan, the file-integrity transcript, and the Files-Changed table.
5. Self-validates (below) and writes the "complete, pending orchestrator review" line — does NOT emit git commands.

## Negative flow (every off-happy-path branch)

- **A contract would require a product decision not yet made** (e.g. a surface where card-vs-scroll is genuinely ambiguous, or a component lacking any documented responsive pattern) → follow **P0 Addendum A7**: complete all non-blocked docs + inventory work, mark the surface **OPEN DECISION/GAP** with a recommendation, and only halt if continuing would require out-of-scope edits or weakening an existing P0 rule. Do NOT invent a local rule.
- **A story cannot be rendered/evaluated** (missing mock/session/router/provider) → mark **GAP** with exact reason in the inventory; do NOT silently skip; do NOT fix mock infra here (propose it as a slice).
- **The global inventory reveals the scope is larger than the proposed plan anticipates** → that is expected; record ALL stories anyway and propose MORE slices — do NOT narrow, do NOT drop stories from the inventory.
- **Temptation to edit a `src/**` / `*.stories.tsx` / harness / lint file** to "just fix it" → forbidden in 412; STOP and record as a slice instead.
- **A contract already fully exists in `design-system.md`** → do not duplicate it into other docs; cite + cross-link only.
- **Markdown link/anchor would point at a non-existent section** → fix the anchor; do not leave dead cross-links.

---

## Mobile <640 full-width gate (this task DEFINES it, does not render it)

Task 412 produces no UI, so there is no rendered matrix to attach. But the **standard it writes MUST encode the gate verbatim** as the binding rule for all future slices: every text Button / Tabs list / FilterBar control / Select·Combobox trigger / PhoneField / CTA / toolbar / action row is **full-width at `<640`**; **every popup (Dialog/Sheet/Select/Combobox/DropdownMenu/NavigationMenu/Popover/Command) is a full-width bottom sheet at `<640`** (edge-to-edge, rounded-top, slide-up, ≤90dvh internal scroll, drag-handle, closes on backdrop+Esc); ≥44px touch targets; labels wrap in `sq/en/uk/it`; no h-scroll at 320; icon-only/compact controls are the only exemption and each must be listed. (Anchor agent-contract clauses 11–12 + `design-system.md §12a/§12b/§14`.) Each future slice's kickoff will carry the rendered matrix; this task makes sure the rule they enforce is unambiguous.

---

## Required validation (paste transcripts in the session log)

Because 412 touches only `docs/**`:
- `npx tsc --noEmit` → 0 new errors (sanity; no TS touched).
- `npm run check:stories` → still PASS (no story files changed).
- `npm run check:i18n` → still PASS (no locale text added; if any user-facing string is introduced anywhere, full `sq/en/uk/it` parity is mandatory — but none is expected).
- `npm run build-storybook` → still builds (regression sanity).
- **File-integrity (agent-contract clause 14) on every touched file:** `0` NUL bytes (`tr -cd '\000' < f | wc -c` = 0), no stray BOM, every Markdown file ends with its intended final line (re-read the tail), and every internal cross-link/anchor resolves. Paste the GREEN integrity transcript.
- **P0 Addendum A9 proofs (mandatory):** `git diff --name-only` (only allowed docs/backlog/session/inventory paths) · `git diff --stat` · a **forbidden-path check** proving zero changes under `src/**`, `app/**`, `modules/**`, `.storybook/**`, `*.stories.tsx`, harness scripts, lint config, locale JSON · the **story-discovery transcript** (A6) · a grep proving `docs/design-system.md` contains the exact 14-viewport list (A1) and the "Forbidden responsive hardcodes and pseudo-fixes" clause (A2).

> No `screenshots:assert` run is required from 412 (no UI changed). The authoritative rendered matrix is produced by the implementation slices.

---

## Acceptance criteria

- Canonical lero-al responsive standard is **documented, concrete, and enforceable** in `docs/design-system.md` (all 9 contracts present; each marked existing/extended/new), cross-linked (not duplicated) from the other governance docs, and pointed to from `docs/rule-index.md`.
- **P0 Addendum satisfied:** `design-system.md` carries the exact 14-viewport list (A1) and the "Forbidden responsive hardcodes and pseudo-fixes" clause (A2); the standard + inventory carry the global control-preservation rule (A4); no invented tokens/APIs/components are presented as canonical (A3); the inventory is story- AND surface-complete (A5) and backed by the story-discovery transcript (A6); no existing P0 rule is weakened (A8); the A9 validation proofs are in the session log.
- `docs/responsive-storybook-inventory.md` exists and inventories **every** rendered Storybook story across **all** categories (Admin, Layout, Shared, Primitives, System, Listing, Public/product, Docs/demo, Locale Stress, any other), with locale coverage, responsive-risk, needs-fix, and the governing Phase-1 contract per row; every non-evaluable story is a documented GAP.
- A **proposed phased-slice plan** exists, §18-compliant (small, area-scoped, one at a time), with **Slice 1 = the 3 managers → `AdminTable tableAtLg`** seeded, and the 60 known overflow cells mapped to it.
- The 61 FAIL cells are treated as **evidence/examples only** — the inventory/scope is global, not narrowed to them.
- Machine-detection assessment documented; manual-visual-QA requirement recorded in storybook/responsive-screenshot governance.
- NO `src/**` / `app/**` / `modules/**` / `*.stories.tsx` / harness / lint / `.storybook` / locale changes in this task.
- `tsc=0 new`, `check:stories`/`check:i18n`/`build-storybook` still green; file-integrity GREEN (0 NUL, no BOM, no truncation, no dead cross-links).
- `docs/backlog.md` + the session log updated; session log includes the **Files-Changed table** (one row/touched path + rationale).
- Executor does **NOT** emit `git add`/`git commit` — the orchestrator emits commit commands at review.

## Final report required from Sonnet

1. The 9 contracts: which were existing / extended / new, with section anchors.
2. Full Storybook story inventory (or its path) + category list covered.
3. The proposed phased-slice plan + Slice-1 seed.
4. GAP stories with reasons.
5. Machine-detection assessment + manual-QA-required note location.
6. Validation transcripts + file-integrity transcript.
7. Files-Changed table.
8. Confirmation: no product/story/harness/lint/locale code touched; no story deleted/duplicated; no governance gate weakened; no git commands emitted.

---

## Ordering (owner-confirmed 2026-06-08)

1. Task 411 = **approved as harness hardening only** (not responsive proof); 1920 `ERR_NO_BUFFER_SPACE` logged as infra flake.
2. Task 410 = **NOT APPROVED** until the global Storybook responsive matrix is green against the canonical standard.
3. **Task 412 (this task)** — standard + global inventory + proposed phased-slice plan — completes first; owner approves the standard + inventory + plan.
4. Then execute the phased slices one at a time (Slice 1 = the 3 managers → `AdminTable tableAtLg`), each with its own kickoff + rendered matrix, owner-approved between each, until the global matrix is green.
5. Re-run the Task 410 rendered proof on the corrected global matrix; only then consider Task 410 for approval.
6. Then resume Epic JJ: **408 → 407**.
