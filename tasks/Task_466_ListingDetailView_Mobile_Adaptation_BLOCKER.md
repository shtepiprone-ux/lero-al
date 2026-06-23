# Task 466 — ListingDetailView mobile/tablet layout fix (Bucket‑1 hard defects)

> **Executor:** Sonnet 4.6. **Type:** Product / responsive layout fix (UI). **Priority:** P0.
> **Origin:** Task 467 repaired the Storybook geometry/visual harness and emitted an authoritative
> defect inventory. This task fixes ONLY the `ListingDetailView` (LDV) hard defects in that inventory.
> **Source of truth for scope:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
> → "Bucket 1: Hard defects" → the three `listings-listingdetailview--*` stories (96 failing cells).
> **Scope boundary (owner decision 2026-06-23):** LDV ONLY. Do NOT fix sibling surfaces here — those
> are filed separately (`Task_466_SIBLINGS_Bucket1_Product_Layout_Followups.md`). The full
> `screenshots:assert` run MAY still be red on sibling surfaces after this task; the LDV rows MUST be zero.

> ⚠️ **Dependency / sequencing.** Task 467 owner-native final rerun confirmed the repaired harness
> (2026-06-23T08-44; 6532 cells · 5326 PASS / 758 FAIL / 340 AMBIGUOUS / 108 OUT-OF-RANGE · exit=1;
> evidence: `docs/sessions/task467-owner-final-rerun.exit.txt`). Dispatch may proceed after these kickoff
> docs are committed. `screenshots:assert` is expected to exit 1 until product layout tasks are fixed.
> The defect rows below are taken from the 2026-06-23T08-44 owner-native run;
> re‑baseline against the committed‑tree run before fixing.

---

## Pre-read (rule-index: "UI / layout / component" + "Storybook / visual snapshot")

**Always required:** `docs/agent-contract.md` (clauses 1–15), `docs/backlog.md`, `docs/critical-flow-registry.md`
(scan for a listing‑detail render flow; if LDV public render is registered, the clause‑15 regression‑coverage rule is in scope).

**Required (UI/layout):**
- `docs/design-system.md` — read **§24 (forbidden hardcodes), §25 (control‑preservation), §26 (mobile <640 full‑width + bottom‑sheet gate), §27 (Storybook proof contract)** first.
- `docs/ui-rules.md` (incl. §15a mobile full‑width, §17 UI pre‑flight checklist).
- `docs/component-rules.md`.
- `docs/qa-rules.md`.

**Required (Storybook/visual):**
- `docs/storybook-governance.md` (§14 enforced gates, §MQ manual‑QA limits).
- `docs/storybook-visual-snapshots.md`.
- `docs/design-system.md §27` (what `screenshots:assert` does and does NOT prove).

**Only if relevant:** `docs/state-authority.md` (only if you touch the LDV client/SSR island boundary — avoid if not needed), `docs/responsive-screenshot-governance.md` (§MQ machine‑detection limits).

**Do NOT read** anything outside this list (rule-index discipline).

---

## Goal

Eliminate every Bucket‑1 hard defect attributed to the three LDV stories so the LDV rows of
`screenshots:assert` (full) are **0 failures across 320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 × sq / en / uk / it**,
with **no harness weakening** and **no regression** to desktop (≥1024) or to LDV behavior/controls.

## In-scope stories (exact story IDs — the ONLY cells this task must turn green)

| Story export | Story ID | Bucket‑1 cells |
|---|---|---|
| `PublicListing` | `listings-listingdetailview--public-listing` | 24 |
| `StaffPreviewPublished` | `listings-listingdetailview--staff-preview-published` | 36 |
| `StaffPreviewUnpublished` | `listings-listingdetailview--staff-preview-unpublished` | 36 |

Story file: `src/modules/listings/components/ListingDetailView.stories.tsx`.

## Concrete defects from the Task 467 inventory (what is actually broken)

All cells fail with `verdict=fail` under these reasons. The labels below are the harness‑emitted selectors/labels.

**Defect A — Gallery photo‑count button overflows / is pushed offscreen.**
- Reasons: `outside-container` and `offscreen-control` on `[data-slot="button"]("3 фото" / "3 photos" / "3 foto")`.
- Viewports: concentrated at **mobile‑320/375/390/480** and **canonical‑560**.
- Likely source: the gallery button placeholder / `GalleryStaticFrame` / `GalleryIsland` photo‑count control
  (`ListingDetailView.tsx` ~L262–L269, `#gallery-btn-placeholder`). It sits outside the gallery's clipping
  container or extends past the viewport's right edge at narrow widths.

**Defect B — Contact CTAs overlap each other and the gallery "All photos (N)" button.**
- Reason: `element-overlap` between the two contact buttons —
  `button("Call"/"Telefono"/"Зателефонувати"/"Chiama")` ↔ `button("Write on WhatsApp"/"Scrivi su WhatsApp"/"Написати в WhatsApp"/"Shkruani në WhatsApp")` —
  and overlap of those CTAs with `[data-slot="button"]("All photos (3)"/"Всі фото (3)"/"Të gjitha fotot (3)"/"Tutte le foto (3)")`.
- Viewports: **320 → tablet‑768 / canonical‑810 / canonical‑960** (the action row does not stack/wrap; the two
  CTAs collide and the sticky/contact column compresses).
- Likely source: `src/modules/listings/components/ListingContact.tsx` (contact action buttons; note the sticky
  mobile contact bar in `ListingDetailView.tsx` ~L188–L193 and the right‑column `LazyListingContact` ~L374).

> These are the EXACT failing cells to drive against. Re‑run the committed‑tree harness first to confirm the
> identical set (re‑baseline), then fix until every LDV row reports `verdict=pass`. If the committed‑tree run
> surfaces ADDITIONAL LDV rows not listed here, they are in scope too (LDV‑only); a row that drops out is fine.

## Current behavior to preserve (do NOT regress)

- LDV renders for all three story states (public, staff‑preview‑published, staff‑preview‑unpublished) at every breakpoint.
- All existing controls stay present and functional: gallery open/all‑photos button, photo‑count indicator,
  Call CTA, WhatsApp CTA, Favorite, Save‑to‑collection, back‑to‑listings link, share, staff‑preview banner/actions,
  sticky mobile contact bar. **No control may be removed or turned into a read‑only label** (agent‑contract clauses 3–4).
- Desktop (≥1024) layout, the SSR/LCP gallery preload path, and the `ListingContact` client island contract are unchanged.

## Required after-behavior (per the Task 466 spec, made concrete)

1. 320 / 375 / 390 / 480 / 560 mobile layouts are readable; no text collapses into vertical single‑character stacks.
2. The gallery photo‑count button stays **inside its container and on‑screen** at every breakpoint (Defect A resolved).
3. The Call and WhatsApp CTAs **stack or wrap predictably** and never overlap each other or the "All photos (N)"
   button at any breakpoint 320→960 (Defect B resolved).
4. Sticky mobile contact bar does not cover content (content has bottom padding equal to the bar height; verify last item reachable).
5. No image placeholder exposes broken `alt` text as visible UI.
6. Buttons required full‑width by the project rule are full‑width at <640 (see Mobile gate below).
7. All four locales (sq / en / uk / it) pass — including the long‑label stress (uk/sq are the worst case here).
8. Desktop / tablet (≥1024) does not regress.
9. No horizontal overflow at any breakpoint (`noHorizontalOverflow` green at 320).

## 🔴 Mobile <640 full-width gate (OWNER P0 — agent-contract clause 11, design-system §26)

For every LDV surface touched below 640px:
- The Call CTA, WhatsApp CTA, "All photos (N)" button, back‑to‑listings, and share are **full‑width** (`max-sm:w-full`)
  OR stacked in a full‑width column with ≥44px touch targets — never content‑width side‑by‑side that overlaps.
- The sticky mobile contact bar spans full viewport width edge‑to‑edge.
- Labels wrap (`whitespace-normal break-words`), never clip/overflow, in all four locales.
- Touch targets ≥44px (`min-h-11`).
- **Exemptions:** icon‑only controls (e.g. favorite/share icon buttons) are the ONLY exempt class and MUST be
  listed explicitly with justification in the session log. **If the correct mobile pattern for any surface is
  genuinely ambiguous (e.g. should the contact CTAs become a bottom‑sheet vs an inline stacked column), STOP and ASK
  the orchestrator — do not guess** (clause 11).

## 🔴 No harness weakening (hard rule — non-negotiable)

- Do **NOT** edit `scripts/check-stories-rendered.mjs`, `scripts/geometry-integrity.mjs`, the Task 467
  thresholds, the intentional‑overlap allowlist, or any gate config to make LDV pass.
- Do **NOT** add LDV stories/cells to any allowlist or exemption.
- Do **NOT** change the story fixtures to hide real content (no shrinking text, no removing buttons from the story,
  no `layout:'centered'/'padded'`, no locale pin) to dodge a geometry check.
- The ONLY permitted changes are **product layout/styles** in the LDV component tree (+ the story file ONLY if a
  story is genuinely missing a required responsive‑proof variant, with orchestrator sign‑off).
- If a flagged cell is a genuine **false positive** of the harness (not a real product defect), do NOT fix it and do
  NOT allowlist it — STOP and report it to the orchestrator as a Task 467 harness follow‑up. Harness correctness is 467's job.

## Positive flow (happy path)

- **Actor:** any visitor (Public) and staff (Staff‑preview) viewing a listing detail page.
- **Preconditions:** listing with ≥1 image and an owner with phone + WhatsApp (matches the story fixtures).
- **Steps & system response:**
  1. Page renders at 320px (uk) → gallery shows cover + photo‑count button **fully inside the frame**, on‑screen.
  2. User scrolls to contact area → Call and WhatsApp CTAs render **stacked full‑width**, no overlap, ≥44px each, labels wrapped.
  3. "All photos (N)" button is reachable and does not overlap the CTAs.
  4. Sticky mobile contact bar is visible at the bottom, full‑width, and content above it is fully scrollable (not covered).
  5. Tapping a CTA still triggers the existing `handleContactClick` flow (phone/WhatsApp) unchanged.
- **Success state:** all LDV `screenshots:assert` cells `verdict=pass` at 320–960 × sq/en/uk/it; no geometry reason emitted.
- **Post-conditions:** desktop ≥1024 visually unchanged; no control removed; no new console error/warning.

## Negative flow (every off-happy-path branch)

- **Owner has NO contact info** (`!has_phone && !has_whatsapp`): contact CTA block is absent (existing behavior) →
  layout must still be overlap‑free and no empty full‑width ghost button is rendered.
- **Owner‑deleted / guest‑CTA / data‑unavailable states** in `ListingContact` (existing branches at the
  owner‑deleted notice / guest sign‑in CTA): these must remain full‑width, centered, non‑overlapping at <640.
- **Archived listing** (`isListingArchived`): sticky mobile contact bar is intentionally NOT rendered — confirm no
  layout shift/overlap and content bottom‑padding adjusts so nothing is clipped.
- **Long‑label locale (uk/sq):** the longest CTA + photo labels wrap, never clip, never force horizontal scroll at 320.
- **Single image / no image:** photo‑count button reflects count or is absent; no broken `alt` text shows as visible UI.
- **Staff‑preview‑unpublished vs ‑published:** the preview banner/actions must not overlap the gallery or contact area at any breakpoint.
- For each branch the diff must contain the responsive class/structure change that makes it pass — not just the happy path.

## Validation (run before claiming complete — paste transcripts into the session log)

1. `npx tsc --noEmit` → 0 errors.
2. `npm run lint` → 0 new errors/warnings.
3. `npm run check:stories` → green (no new violations; gate UNCHANGED).
4. `npm run check:i18n` → green (any new/changed key present in all four locales).
5. **Rendered proof (authoritative):** run the repaired Task 467 / Task 464 `screenshots:assert` **full** (not `--fast`)
   on the committed tree and attach the machine‑produced PNG/JSON matrix for the three LDV stories. **LDV rows = 0 failures.**
   (Sibling surfaces may still be red — that is expected and out of scope.)
6. File‑integrity (clause 14) on every touched file: 0 NUL bytes, no BOM, parses/compiles, not truncated — paste the green transcript.
7. **No‑weakening proof:** `git diff --stat` shows NO change to `scripts/check-stories-rendered.mjs`,
   `scripts/geometry-integrity.mjs`, or any allowlist/threshold; confirm in the session log.

## 🔴 Rendered verification matrix (OWNER P0 — agent-contract clause 12; REQUIRED in the session log)

Rows = breakpoints **320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 · 1024 · 1440 · 2560**;
columns = **sq · en · uk · it**. Each in‑scope cell marked **PASS** with concrete per‑cell evidence
(full‑width <640? labels wrapped? CTAs not overlapping? photo button inside container/on‑screen? sticky bar not covering content? no h‑scroll?).
**uk@320 / 375 / 390 are mandatory stress cells.** Evidence is the `screenshots:assert` PNG/JSON for the three LDV
story IDs — a self‑reported table or any "OWNER QA REQUIRED / NOT CHECKED / no browser access" cell is an auto‑reject.
≥1024 columns prove the no‑desktop‑regression requirement.

## AC-by-AC validation (the session log MUST contain this table — every row ✅ with file:line OR rendered cell)

| # | Acceptance criterion | Flow | Evidence required |
|---|---|---|---|
| AC1 | Defect A gone: photo‑count button inside container + on‑screen at 320/375/390/480/560 ×4 locales | Positive step 1 | screenshots:assert LDV cells `verdict=pass`; file:line of the layout fix |
| AC2 | Defect B gone: Call ↔ WhatsApp never overlap each other 320→960 ×4 | Positive step 2 | no `element-overlap` reason on LDV cells; file:line |
| AC3 | CTAs never overlap "All photos (N)" 320→960 ×4 | Positive step 3 | no `element-overlap` reason; file:line |
| AC4 | Sticky mobile contact bar does not cover content; archived‑listing branch safe | Pos step 4 / Neg archived | rendered cell + file:line of bottom‑padding handling |
| AC5 | Mobile <640 full‑width gate met (CTAs/photos/back/share full‑width or stacked; ≥44px; labels wrap); icon‑only exemptions listed | Mobile gate | diff `max-sm:w-full`/stack + PNG fills <640 frame |
| AC6 | All four locales pass incl. uk/sq long‑label stress; no h‑scroll at 320 | Neg long‑label | uk@320/375/390 PASS cells |
| AC7 | No control removed / no read‑only‑label swap (before/after control inventory) | Preserve | inventory table in log |
| AC8 | Desktop ≥1024 not regressed | Pos post‑cond | 1024/1440/2560 PASS cells |
| AC9 | Harness NOT weakened (no script/allowlist/threshold/fixture‑hiding change) | No‑weakening | `git diff --stat` proof |
| AC10 | Gates green: tsc=0, lint=0, check:stories, check:i18n; file‑integrity clean | Validation | pasted transcripts |

Final line required: `Self-validation: tsc=0 · lint=0 · check:stories=green · check:i18n=green · LDV screenshots:assert=0 fail · harness unchanged · AC table=all green · scope=LDV-only clean`.

## Hard contract (verified against the diff on return)

- No scope change beyond the LDV component tree (`ListingDetailView.tsx`, `ListingContact.tsx`,
  `GalleryStaticFrame.tsx`/`GalleryIsland.tsx` as needed) + locale files if a string changes. No drive‑by refactors.
- No invented architecture; if ambiguous (esp. the mobile pattern choice) → STOP and ASK.
- Implement BOTH the positive flow and EVERY negative branch above.
- Update `docs/backlog.md` (Last Session) + add `docs/sessions/2026-…-task466-listingdetailview-mobile-fix.md`
  with a **Files Changed** table (one row per path + rationale). **Do NOT run git** — the orchestrator emits commit commands.

## Acceptance

Task 466 is complete when the three LDV stories report **0 Bucket‑1 hard defects** in a full
`screenshots:assert` run on the committed tree, the rendered matrix + AC table are in the session log, no harness
file/allowlist/threshold was changed, and no LDV control or desktop behavior regressed. Sibling surfaces remaining
red does NOT block this task (they are tracked in `Task_466_SIBLINGS_Bucket1_Product_Layout_Followups.md`).
