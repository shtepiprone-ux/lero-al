# Sprint 35 — Task 406 — Token refactor: `src/components/admin/** + modules/cabinet/** + modules/notifications/** + lib/performance/** + StoryListingCard` (Epic JJ Phase 3, area 4 of 4 — FINAL inventory close)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> Implements **Epic JJ** Phase 3, area 4 (the final area). Replaces ALL remaining raw style-value literals reported by
> `check:design-tokens` outside the already-closed UI / shared+layout / listings+app areas (Tasks 403/404/405) with
> design tokens / named utilities / exact-value inline suppressions (policy A). Depends on **Task 405 committed**
> (`--text-2xs`, `--shadow-listing-card-ring` already landed). **After this task the unsuppressed inventory must be 0
> across the WHOLE `src/**`** — i.e. this task unblocks **Task 408** (detector hardening) → **Task 407** (strict-gate flip).
> Admin surfaces (AdminTable, AdminSidebar, AdminMobileHeader, the admin managers, StatusChangeControl) are
> **mobile-critical** → the **mobile <640 full-width gate applies in full**.

```
Type:        UI/styling refactor (admin components + remaining modules/lib + one story) — consume-the-tokens (policy A)
Priority:    HIGH — area 4 of 4 (final). Gates Task 408 → 407.
Depends on:  405 (committed). Re-run check:design-tokens before/after to prove the delta to a CLEAN (0 unsuppressed) tree.
Area:        src/components/admin/** + src/modules/cabinet/** + src/modules/notifications/** + src/lib/performance/** +
             src/stories/StoryListingCard.tsx + (globals.css ONLY if an owner-approved token is required — see Group E note;
             default expectation: NO new tokens needed, reuse existing) +
             docs/design-system.md (registry, only if a token/suppression class is added) + docs/backlog.md + docs/sessions/.
             scripts/design-tokens-allowlist.json: do NOT add path-level allowlist entries. Prefer Group A swap / Group C
             exact-value inline suppression. Any allowlist change must be exact-value, minimal, justified, last-resort.
NON-goal:    Any visual redesign. Creating ANY new design token unless escalated & owner-approved (default: reuse
             existing spacing scale + existing --text-2xs / --shadow-listing-card-ring; add NOTHING new).
             Flipping the gate to strict (407). Detector hardening (408). Touching listings/** or app/** again (405, done).
```

## Standing rules — Task 403/404/405 lessons (MANDATORY, verify each)
1. **Computed equality is the PRIMARY inertness proof.** For every Group A swap and every token consumption, before/after
   `getComputedStyle` of the target property must be identical (var-based CSS text need not be byte-identical). Where the
   swap is **definitional** (Tailwind v4 dynamic spacing `0.25rem×N`; `--text-2xs`=0.625rem=10px), the equality may be
   shown analytically (`token value == replaced raw`) AND corroborated by `screenshots:assert`. (This is the standard on
   which Task 403/405 were approved.) **Provide computed target-property evidence per changed utility/value FAMILY**
   (one proof per `raw → utility` family, covering all its call sites). **Grouped proof is allowed ONLY when the same raw
   value maps to the same generated utility AND the same CSS target property.** A single blanket "visually identical"
   claim across different value families is NOT acceptable proof — route back if the log offers only that.
2. **`screenshots:assert` is MANDATORY corroboration.** `npm run screenshots:assert` (full) must pass 0-FAIL. It renders
   real DOM across viewports × locales and is the rendered regression proof. `screenshots:responsive` is NOT required for
   inert swaps (no layout change).
3. **🔴 File-integrity (clause 14) — native is ground truth.** After ANY edit, the executor reads each file back and runs
   `npm run check:file-integrity` (0 NUL / no BOM) **natively**. NOTE: the Cowork sandbox mount has produced **phantom NUL
   fluctuations** on freshly-written files (Task 405 review: 9 files read as NUL-corrupted in the sandbox while native
   `tsc`/`ReadAllBytes` showed 0 NUL). The **native** check is authoritative; paste the native green transcript.
4. **Task 408 (detector hardening) is a HARD dependency before Task 407.** Do not let 407 claim a strict raw-value gate.
5. **Detector blind spots must be logged for 408.** Carry forward the three already logged: (a) inline `zIndex: N`
   marker-parser limitation (404); (b) negative-offset upward shadows (404/405); (c) JSX `{/* … */}` comment content
   scanned as live violations (405). Add any new form this task encounters.
6. **Escalation guardrail (Epic JJ).** A bespoke value repeated 3+ times is a **token candidate**, not a repeat-suppress.
   If you find a 3+ repetition in this area that is NOT already a token, **STOP & ASK** the owner before either tokenizing
   or suppressing it. Do not invent a token unilaterally.

## Coverage requirements — Localization + Responsive (MANDATORY)
- Preserve behavior + visual layout in **sq / en / uk / it**. Do NOT edit `messages/*.json` (no new strings).
- **Full cross-product is the target for every affected RENDERED surface:**
  `sq/en/uk/it` × `320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560`.
  **`uk@320/375/390` is an ADDITIONAL stress subset, NOT a replacement** for full locale × breakpoint coverage. A proof
  that exercises only `uk` mobile is INCOMPLETE.
- `screenshots:assert` renders the **Storybook** matrix (7 viewports × 4 locales). Where it covers only a reduced viewport
  set, provide **supplemental targeted rendered proof for the missing canonical breakpoints** on the storied surfaces.
- **⚠️ Admin app-route surfaces are largely NOT in Storybook** (the 49 admin hits live in real admin pages, not stories,
  so `screenshots:assert` does NOT cover them). For those surfaces the **primary** proof is per-file computed equality
  (Standing Rule 1) PLUS **targeted rendered spot-checks at the mandatory stress breakpoints (uk@320/375/390 + one
  representative ≥1024 desktop) per affected admin surface**. If a full rendered cross-product is not feasible for an
  unstoried admin route, STOP & ASK rather than fabricating PASS cells — never report a cell you did not actually render.

## Scope — current `check:design-tokens` inventory (70 hits), classified
> **The listed `file:line` entries are the live baseline from the native 2026-06-07 run, NOT a closed list.** Before
> editing, re-run `check:design-tokens` and reconcile EVERY current unsuppressed hit in the in-scope paths. If line
> numbers moved, search by file / raw value / class — never by stale line number. Leave NO in-scope hit unresolved or
> undocumented. Verify each target spacing utility is actually generated & computed-identical in THIS project; if a value
> is **off the 4px grid** (not `0.25rem×integer`), do NOT invent a fractional utility — exact-suppress it (Group C).

### Group A — inert length swaps to the spacing-backed named utility (DO; prove computed-identical)
Mapping rule: `Npx = 0.25rem × (N/4)` → utility `*-{N/4}`. Swap ONLY where `N/4` is an integer the project generates.

| File:line | Raw | After (inert) | px → unit |
|---|---|---|---|
| `components/admin/AdminCurrenciesManager.tsx:126` | `max-w-[120px]` | `max-w-30` | 120→30 |
| `components/admin/AdminCurrenciesManager.tsx:140` | `min-w-[80px]` | `min-w-20` | 80→20 |
| `components/admin/AdminEmailTemplatesManager.tsx:234` | `min-h-[120px]` | `min-h-30` | 120→30 |
| `components/admin/AdminEmailTemplatesManager.tsx:371` | `min-w-[180px]` | `min-w-45` | 180→45 |
| `components/admin/AdminExchangeProvidersManager.tsx:140` | `min-w-[80px]` | `min-w-20` | 80→20 |
| `components/admin/AdminExchangeProvidersManager.tsx:245` | `max-w-[200px]` | `max-w-50` | 200→50 |
| `components/admin/AdminExchangeProvidersManager.tsx:258` | `max-w-[160px]` | `max-w-40` | 160→40 |
| `components/admin/AdminListingsTable.tsx:464` | `max-w-[200px]` | `max-w-50` | 200→50 |
| `components/admin/AdminPropertyTypesManager.tsx:334` | `max-w-[140px]` | `max-w-35` | 140→35 |
| `components/admin/AdminSupportManager.tsx:97` | `max-w-[120px]` | `max-w-30` | 120→30 |
| `components/admin/AdminSupportManager.tsx:102` | `max-w-[120px]` | `max-w-30` | 120→30 |
| `components/admin/AdminSupportManager.tsx:374` | `min-h-[60px]` | `min-h-15` | 60→15 |
| `components/admin/AdminSupportManager.tsx:572` | `min-h-[80px]` | `min-h-20` | 80→20 |
| `components/admin/AdminSupportManager.tsx:628` | `min-h-[80px]` | `min-h-20` | 80→20 |
| `components/admin/AdminSupportManager.tsx:790` | `max-w-[200px]` | `max-w-50` | 200→50 |
| `components/admin/AdminSupportManager.tsx:792` | `max-w-[200px]` | `max-w-50` | 200→50 |
| `components/admin/AdminUserAvatar.tsx:212` | `max-w-[140px]` | `max-w-35` | 140→35 |
| `components/admin/AdminUsersTable.tsx:236` | `max-w-[160px]` | `max-w-40` | 160→40 |
| `components/admin/AdminUsersTable.tsx:241` | `max-w-[160px]` | `max-w-40` | 160→40 |
| `components/admin/StatusChangeControl.tsx:123` | `min-h-[72px]` | `min-h-18` | 72→18 |
| `components/admin/StatusChangeControl.tsx:176` | `min-h-[44px]` | `min-h-11` | 44→11 (touch-target floor) |
| `components/admin/StatusChangeControl.tsx:195` | `min-h-[60px]` | `min-h-15` | 60→15 |
| `modules/cabinet/components/CabinetShell.tsx:122` | `min-w-[20px]` | `min-w-5` | 20→5 |
| `modules/notifications/components/NotificationBell.tsx:60` | `min-w-[1rem]` | `min-w-4` | 1rem=16px→4 |
| `modules/notifications/components/NotificationCenter.tsx:31` | `max-h-[480px]` | `max-h-120` | 480→120 |

For EACH: confirm the utility is generated and `getComputedStyle` (min/max width|height) is identical to the raw. If a
utility is **not generated** or **not computed-identical**, STOP & ASK (do not assume Tailwind defaults).

### Group C — off-grid / local-stacking / non-themeable → exact-value inline suppression (policy A)
Each: `// design-tokens-allow: <value> — <reason>` (or the CSS/JSX-appropriate marker form). Confirm `check:design-tokens`
shows **0 stale / 0 missing-reason** after.

| File:line | Raw | Suppress reason |
|---|---|---|
| `components/admin/AdminTable.tsx:152` | `z-[2]` | local sticky-cell stacking inside the admin table (sticky header/column over scrolling body); NOT a global elevation layer — no semantic `--z-*` token applies. Candidate `--z-table-sticky` token noted for Task 408 review. |
| `components/admin/AdminTable.tsx:168` | `z-[1]` | same local table stacking context |
| `components/admin/AdminTable.tsx:296` | `z-[1]` | same local table stacking context |
| `components/admin/AdminUserAvatar.tsx:203` | `max-w-[130px]` | 130px is **off the 4px grid** (130/4=32.5 → no integer spacing utility); exact value preserved |
| `components/admin/AdminUserAvatar.tsx:208` | `max-w-[130px]` | same off-grid value |
| `modules/cabinet/components/SavedSearchesTab.tsx:219` | `w-[90px]` | 90px off-grid (90/4=22.5) |
| `modules/notifications/components/NotificationBell.tsx:60` | `text-[10px]` → see Group D; `min-w-[1rem]` → Group A | (line has two hits; resolve each per its group) |
| `lib/performance/imageGuard.ts:101` | `#f97316` | dev/RUM performance-instrumentation status color (not a themeable user-facing UI surface; no semantic color-token layer exists in Epic JJ scope). If determined user-facing → STOP & ASK. |
| `lib/performance/predictive.ts:164` | `#818cf8` | same — perf instrumentation color |
| `lib/performance/reporter.ts:122,123,124` | `#22c55e` / `#f59e0b` / `#ef4444` | same — perf reporter status palette |
| `lib/performance/store.ts:83` | `#ef4444` / `#22c55e` / `#f59e0b` | same — perf store status palette |

> **Color note (STOP & ASK trigger):** the 8 `lib/performance/**` hex colors are dev/RUM instrumentation, not user-facing
> theme surfaces, and Epic JJ added NO color-token layer (only spacing/type/elevation/z/motion/breakpoints). Default
> resolution = exact-value suppression with the reason above. **If ANY of these is actually rendered in a user-facing UI
> surface, STOP & ASK** — do not invent a color token and do not silently recolor.

### Group D — `text-[10px]` per-occurrence: swap → `text-2xs` (micro-label) OR exact-suppress (interactive/critical)
`--text-2xs` (0.625rem / line-height 0.75rem) already exists (Task 404, §22.2) and is computed-identical to `text-[10px]`
for `font-size` (10px). Apply the **same Task 404/405 rules**:
- **Swap → `text-2xs` ONLY** for genuine micro-labels (badge, counter, metadata, helper/compact status, mono ID text).
- **Do NOT swap** primary readable copy, form labels, button labels, filter chips, or **mobile-critical interactive
  control text** — exact-suppress those with reason instead.
- **Per swap proof:** computed `font-size` identical (10px); introduced `line-height: 0.75rem` documented; rendered
  before/after shows **no visible shift**. Any shift/clip → revert that one to suppressed `text-[10px]` and note it.

Evaluate EACH; record swapped-vs-suppressed + reason in the per-occurrence log:
`AdminCompaniesManager.tsx:192` · `AdminCurrenciesManager.tsx:199,203,401,407` · `AdminEmailTemplatesManager.tsx:422` ·
`AdminExchangeProvidersManager.tsx:248,253` · `AdminLocaleSwitcher.tsx:25` · `AdminMobileHeader.tsx:56` ·
`AdminSettings.tsx:263` · `AdminSidebar.tsx:106,127` · `AdminSupportManager.tsx:102,120,122,129,232,235` ·
`AdminUserAvatar.tsx:203,208` · `AdminUserProfile.tsx:890` · `modules/cabinet/components/SavedSearchesTab.tsx:179` ·
`modules/notifications/components/NotificationBell.tsx:60` · `modules/notifications/components/NotificationItem.tsx:106`.

**Final allowed states:** NO unsuppressed `text-[10px]` may remain in any in-scope file. Each ends as exactly ONE of:
(a) swapped to `text-2xs` with proof; (b) kept `text-[10px]` with exact inline suppression + reason; (c) reported as a
STOP & ASK blocker (then the task is NOT done — never report a false green).

### Group E — tokens (DEFAULT: none new)
- **Expectation: add NO new token.** All length swaps use the existing dynamic spacing scale; all `text-[10px]` use the
  existing `--text-2xs`; the StoryListingCard ring reuses the existing `--shadow-listing-card-ring` (Task 405).
- If you believe a NEW token is warranted (e.g. a 3+ repeated off-grid value, or a `--z-table-sticky`), **STOP & ASK** —
  do not add it unilaterally. (`--z-table-sticky` is explicitly deferred to Task 408 evaluation; suppress z-[1]/z-[2] now.)

### Group F — StoryListingCard (stories file — extra storybook gate applies)
| File:line | Raw | After |
|---|---|---|
| `stories/StoryListingCard.tsx:86` | `shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)]` | `shadow-listing-card-ring` (reuse the Task 405 token) |
| `stories/StoryListingCard.tsx:117,122,127,212,220` | `text-[10px]` | `text-2xs` (micro-labels) |

- **BEFORE editing `StoryListingCard.tsx`, capture the current `check:stories` baseline.** If it is ALREADY red, STOP &
  ASK — do not mix a pre-existing Storybook-governance failure into Task 406 (a red baseline must be triaged separately,
  not silently inherited or "fixed" inside this token task).
- Editing a `*.stories.tsx` triggers the **Storybook no-hardcode gate (clause 13)**: after the swap, `npm run
  check:stories` MUST stay green (no raw user-facing string introduced, no `layout:'centered'|'padded'`, no
  `/Ukrainian/` export, no raw `<button>`), and `screenshots:assert` (which renders the 29 stories × 7 vp × 4 locales)
  MUST stay 0-FAIL. Confirm `shadow-listing-card-ring` renders the identical ring on the story card.
- If swapping introduces ANY `check:stories` failure, STOP & ASK (do not weaken the gate).

## Positive flow
1. Re-run `check:design-tokens`; reconcile the full current in-scope hit list (paste BEFORE — expect ADMIN/MODULES/OTHER).
   **Out-of-scope edge case:** if the fresh BEFORE run shows NEW unsuppressed violations OUTSIDE this task's scope (e.g.
   in `listings/**` or `app/**`, already closed by 405, or anywhere else), do NOT edit those files and do NOT hide them
   with allowlist/suppression. Report them as a **STOP & ASK blocker** — UNLESS the violation is directly caused by a file
   this task touched (then fix it here and document why). The "0 across ALL `src/**`" milestone must be reached by genuine
   resolution, never by masking out-of-scope hits.
2. Apply **Group A** inert length swaps; computed-equality proof **per `raw → utility` value family** (analytical
   `0.25rem×N` + a real `getComputedStyle` reading per family), not one blanket claim.
3. Apply **Group C** exact-value suppressions (AdminTable local z; off-grid 130px/90px widths; lib/performance colors)
   each with reason; confirm 0 stale / 0 missing-reason.
4. **Group D:** per-occurrence evaluate each `text-[10px]` → swap to `text-2xs` (with font-size-identical + line-height
   delta + no-shift proof) OR exact-suppress (interactive/critical) with reason. Record per-occurrence.
5. **Group F:** StoryListingCard shadow → `shadow-listing-card-ring`; `text-[10px]` → `text-2xs`; keep `check:stories`
   green.
6. (Group E) Add NO new token unless an escalation was explicitly owner-approved.
7. Re-run `npm run check:design-tokens` → **unsuppressed = 0 across ALL `src/**`** (paste BEFORE/AFTER; 0 stale / 0
   missing-reason; 0 new violations). This is the "whole-tree clean" milestone that unblocks 408→407.
8. `npm run check:file-integrity` (native, 0 NUL/BOM on all touched files), `npx tsc --noEmit` → 0, `npm run lint` → 0 new.
9. `npm run check:stories` → pass (Group F). `npm run screenshots:assert` → 0-FAIL (rendered corroboration).
10. Update `docs/backlog.md` + session log: Files-Changed table, AC self-audit, computed/analytical proofs, native
    integrity transcript, four-part token-resolution report, per-occurrence Group-D log, Group-C suppression list, the
    Group-F story note, and any NEW detector blind spots for Task 408. **No `git add`/`commit` from the executor.**

## Negative flow (must be proven — per change type, NOT one blanket "identical")
- **Group A swaps:** before/after computed target property identical at each call site; off-grid values are NOT swapped
  (they go to Group C). A utility that is not generated / not computed-identical → STOP & ASK (do not guess).
- **Group C suppressions:** each marker suppresses ONLY its value; `check:design-tokens` shows 0 stale / 0 missing-reason;
  no value is altered (130px stays 130px, colors unchanged).
- **Group D `text-2xs` swaps:** computed `font-size` stays 10px; line-height delta documented; rendered before/after no
  visible shift. Any shift/clip → revert that occurrence to suppressed `text-[10px]`.
- **Group F story:** `shadow-listing-card-ring` renders identical ring; `check:stories` stays green; `screenshots:assert`
  0-FAIL. A new hardcode/gate failure → STOP & ASK.
- **🔴 Mobile <640 full-width gate (OWNER P0):** token swaps must NOT alter any mobile layout/stacking. Admin
  toolbars/tables/managers, AdminSidebar, AdminMobileHeader, StatusChangeControl controls stay full-width with ≥44px
  targets and wrapping labels at <640. Confirm in after-shots at 320/375/390 (uk mandatory). A non-full-width
  text/container surface at <640 without a documented exemption = REJECT. (Inert swaps should leave this unchanged; the
  proof is that the after-shots match the before at <640.)
- **File integrity (native):** `check:file-integrity` green on every touched file after ALL edits. Sandbox NUL readings
  are NOT authoritative (Task 405 lesson) — paste the NATIVE transcript.
- **Blind spots logged:** any raw form the detector missed recorded for Task 408; carry forward the three prior blind
  spots (inline `zIndex:N`; negative-offset shadow; JSX `{/* */}` comment scanning).

## Acceptance criteria (machine-proven)
- Group A: every listed length swapped to a computed-identical generated utility; off-grid values correctly routed to
  Group C (NOT swapped to a fractional utility).
- Group C: AdminTable z-[1]/z-[2] + off-grid widths (130px/90px) + 8 lib/performance colors each exact-value suppressed
  with reason; 0 stale / 0 missing-reason; no value altered.
- Group D: every `text-[10px]` in scope ends swapped (proof) / exact-suppressed (reason) / reported as blocker;
  per-occurrence log present; font-size-identical + line-height-delta + no-shift proof per swap; NO swap on
  interactive/mobile-critical text.
- Group F: StoryListingCard shadow → `shadow-listing-card-ring` + `text-[10px]` → `text-2xs`; `check:stories` green;
  `screenshots:assert` 0-FAIL; identical rendered ring.
- Group E: NO new token added (unless an escalation was owner-approved and documented).
- `check:design-tokens`: **unsuppressed = 0 across ALL `src/**`** (before/after pasted); 0 stale / 0 missing-reason; 0 new
  violations. (Whole-tree-clean milestone → unblocks 408 then 407.)
- `tsc=0`, `lint=0 new`, NATIVE `check:file-integrity` green (post-edit), `check:stories` green, `screenshots:assert`
  0-FAIL.
- Mobile <640 full-width preserved (rendered evidence at 320/375/390, uk mandatory); after-shots match before at <640.
- Coverage: full `sq/en/uk/it` × 14-breakpoint cross-product for storied surfaces (via `screenshots:assert` + supplemental
  shots for any missing canonical breakpoints); for unstoried admin routes, per-file computed equality + targeted rendered
  spot-checks (uk@320/375/390 + one ≥1024 desktop per surface). `uk@320/375/390` is additional, not a substitute.
  `messages/*.json` untouched. No fabricated PASS cells (STOP & ASK if a surface can't be rendered).
- Four-part token-resolution report present (fixed swaps / tokens-added=0 / path-allowlisted=0 / inline-suppressed),
  headline **"unsuppressed src/** violations = 0"**.
- New detector blind spots (if any) logged for Task 408; the three prior blind spots carried forward.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff.

## Pre-read (mandatory — Admin-control + UI/styling + Storybook bundles, per `docs/rule-index.md`)
- `docs/agent-contract.md` (1–14) · `docs/rule-index.md` · `docs/backlog.md`
- `docs/design-system.md` (§22 token registry — §22.2 type / §22.3 elevation+z-index; §12a/§12b mobile contract; §9 admin
  layout / §10 `tableAt`) — first
- `docs/ui-rules.md` · `docs/component-rules.md` · `docs/component-governance.md` (§11 canonical `AdminTableRow`) ·
  `docs/ai-behavior.md` → Note 22 "Admin Table Preservation Rule" · `docs/tailwind-governance.md` · `docs/qa-rules.md`
- For Group F only: `docs/storybook-governance.md` (§14 no-hardcode gate) · `docs/storybook-visual-snapshots.md`
- `scripts/check-design-tokens.mjs` · `scripts/design-tokens-allowlist.json` · the committed Task 403/404/405 diffs (pattern reference)

## Out of scope
- listings/** + app/** (Task 405, done). Flipping the gate to strict (407). Detector hardening (408). Any visual
  redesign. Creating any new design token (unless an escalation is owner-approved). Editing `messages/*.json`.
- Refactoring admin table structure/behavior (this is a pure value→token swap; preserve every admin control, row action,
  status switcher, sidebar entry, filter chip — agent-contract clauses 3–5 + Note 22).

> **Note for the orchestrator (Epic-table reconciliation, carried from Task 405):** `Epic_JJ_…` §Sequencing lists
> 405=admin / 406=listing+remaining, but `docs/backlog.md` (authoritative) sets 405=listings+app / 406=admin+remaining.
> This kickoff follows the backlog (406 = admin + all remaining). Reconcile the Epic_JJ table to match in the next
> governance edit (with its commit). After 406 lands clean (whole-tree 0), the JJ queue is **408 → 407**.
