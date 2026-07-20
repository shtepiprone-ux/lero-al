# Task 632 — Right-align the wrapped `ViewAllLink` label (hug the row's right edge) and take ownership of all `ViewAllLink.tsx` product-code changes

- **Task number:** 632
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage "view all" tertiary control).
- **Parent / origin:** Task 631 review (2026-07-19). While reviewing Task 631's rendered proof, the owner spotted a real visual defect on the shared `ViewAllLink` control: at narrow widths where the localized label wraps to two lines (`uk` "Переглянути всі", `sq` "Shiko të gjitha" at 320), both lines render **center-aligned** inside the button. The owner wants the wrapped label **right-aligned**, bound to the row's right edge. This task also absorbs the out-of-scope `ViewAllLink.tsx` vertical-centering fix that Task 631 applied mid-session, so Task 631 can be committed **story-only** and all `ViewAllLink.tsx` product-code lives in one reviewable task.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine shared-component UI fix (tertiary link control rendered on the live homepage in two sections). Product code; not a critical flow.

## Objective

Make the shared `src/components/shared/ViewAllLink.tsx` control render its localized label **right-aligned** when it wraps to more than one line, so the text hugs the control's right edge (matching the `flex justify-between` row's right margin) instead of centering. Single-line labels keep their current position. The vertical-centering fix already applied in the worktree (label vertically centered against the sibling `<h2>`) must be **preserved**. The fix applies to both real consumers through the shared island with no consumer call-site edits.

## Verified context

Inspected in the repo on 2026-07-20.

- **Control:** `src/components/shared/ViewAllLink.tsx` is a `'use client'` island — `<Button component={Link} href={href} variant="transparent" size="sm" styles={{ root: { display:'inline-flex', alignItems:'center', justifyContent:'center' } }}>{label}</Button>`. The `styles.root` block is the Task 631 mid-session vertical-centering fix; it is currently **uncommitted in the worktree** and is hereby re-scoped to this task.
- **Consumers (2, identical row markup, shared island — no call-site changes needed):**
  - `src/app/[locale]/page.tsx` L48–51 — Latest section: `<div className="flex items-center justify-between mb-6"><h2 …>{tl('latest')}</h2><ViewAllLink href={`/${locale}/listings`} label={tl('view_all')} /></div>`.
  - `src/modules/listings/components/FeaturedListings.tsx` L41–48 — Featured section: same row, `href={`/${locale}/listings?premium=true`}`, guarded by `!loading && listings.length > 0`.
- **Observed defect (owner screenshots, Storybook `System/FeaturedListings` @320):** `en`/`it` labels fit on one line (correct, sit at the right); `uk` "Переглянути всі" and `sq` "Shiko të gjitha" wrap to two lines and both lines are **centered** within the button. No clip/overflow — this is an alignment defect, not an overflow defect.
- **Precedent / provenance:** `src/components/shared/AgentCtaButton.tsx` carries the same `styles.root` vertical-centering pattern (icon CTA); its labels are single-line and center-aligned by design, so its behavior is NOT a template for the right-align here. Right-alignment is specific to the "tertiary link beside a heading" pattern.
- **Canonical Button story** `src/stories/mantine/primitives/Button.stories.tsx` (§6a-link) does not cover `component={Link}` or a wrapping label; the transparent variant chrome itself is already CI-gated and is not re-proved here.
- **i18n:** no new key. `listing.view_all` exists in all four locales.

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Owner review 2026-07-20 | When the `ViewAllLink` label wraps to ≥2 lines, every line is **right-aligned** (text hugs the control's right edge, flush with the row's right margin) | P0 | Diff; rendered `uk@320` and `sq@320` show the wrapped label right-aligned |
| R2 | Task 631 owner-authorized fix | The label stays **vertically centered** against the sibling `<h2>` (the existing `styles.root` centering is retained, not regressed) | P0 | Diff retains the centering; rendered proof shows label vertical center == h2 center |
| R3 | Shared-island invariant | The fix lives entirely in `ViewAllLink.tsx`; **no** consumer call-site edit (`page.tsx`, `FeaturedListings.tsx`); both Latest and Featured sections show identical corrected behavior | P0 | `git diff` scoped to `ViewAllLink.tsx` (+ session log + backlog); rendered proof on both real consumers |
| R4 | Regression guard | `en`/`it` single-line labels unchanged; no clip/overflow at any required viewport; transparent hover-no-fill preserved | P1 | Rendered proof all 4 locales × required Q2 widths |
| R5 | Canonical provenance | The right-align is applied **locally** on `ViewAllLink` (pattern-specific); do NOT push `textAlign` into `theme.ts` (would wrongly right-align all buttons, e.g. `AgentCtaButton`). The universal vertical-centering `theme.ts` consolidation remains a separately-tracked follow-up, out of scope here | P2 | Diff shows no `theme.ts` change; decision recorded |

## Recommended approach (verify exact selector with rendered proof; adjust if needed)

Add a `label` slot to the existing `styles` prop so the wrapped text right-aligns, keeping the current `root` centering:

```tsx
styles={{
  root: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'right' },
}}
```

If `textAlign` alone does not visibly right-align the wrapped lines (the Mantine `.mantine-Button-label` may not span the full control width), also set the label to fill and/or switch `root.justifyContent` to `'flex-end'`, e.g. `label: { textAlign: 'right', width: '100%' }`. Choose the minimal combination that produces the required rendered result and confirm it at `uk@320` and `sq@320`. Do not invent unrelated style keys.

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| `ViewAllLink` wrapped-label horizontal alignment | Opened both consumers (`page.tsx` L48–51, `FeaturedListings.tsx` L41–48) and `AgentCtaButton.tsx` (same root-centering precedent, single-line, center by design — not a right-align source); `Mantine/Primitives/Button` story §6a-link has no `component={Link}`/wrapping coverage | `src/components/shared/ViewAllLink.tsx` (the shared island is the correct owner for this pattern-specific alignment) | **extend (component-local)** | Add `styles.label` right-align on `ViewAllLink`; no `theme.ts` change; no new story (control chrome already gated) |

## Scope

1. In `src/components/shared/ViewAllLink.tsx`, add the `styles.label` right-align (per Recommended approach), preserving the existing `styles.root` vertical-centering.
2. Produce Q2 rendered evidence on the real homepage proof path for both sections across the required widths × all four locales, `uk@320` mandatory.
3. Write the session log + concise `docs/backlog.md` update; explicitly note that this task **owns the entire `ViewAllLink.tsx` diff vs committed HEAD** (both the centering fix and the new alignment fix) and that Task 631 is to be committed story-only.

## Out of scope

- Any consumer call-site edit (`page.tsx`, `FeaturedListings.tsx`), `theme.ts`, `globals.css`, `AgentCtaButton.tsx`, the `Button` story, `StoryListingCard`/fixtures, or `FeaturedListings.stories.tsx` (Task 631 owns the story).
- Sitewide `theme.ts` Button consolidation of the vertical-centering patch — remains a separate flagged follow-up.
- Any change to label text, i18n keys, wrapping behavior itself (wrapping stays; only its alignment changes), or the control's visibility/guard.

## Current and required behavior

- **Current:** wrapped `ViewAllLink` labels (`uk`/`sq` @320) render center-aligned inside the button; single-line labels sit at the right.
- **Required after:** wrapped labels render right-aligned, flush to the row's right edge; single-line labels unchanged; vertical centering against the `<h2>` preserved; identical on Latest and Featured.

## Positive and negative flows

**Positive:** open the homepage (or `System/FeaturedListings`) at 320 in `uk`/`sq` → the wrapped "view all" label is right-aligned against the section's right margin, vertically centered with the heading; at `en`/`it` and wider viewports the single-line label is unchanged.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Locale expansion / label wrap (`uk`/`sq` @320) | **Yes** | R1 | Wrapped lines right-aligned, no clip/overflow | Rendered `uk@320`, `sq@320`, both sections |
| Single-line locales (`en`/`it`) | **Yes** | R4 | Unchanged position and centering | Rendered `en`/`it` at required widths |
| Both consumers parity | **Yes** | R3 | Latest and Featured identical | Rendered homepage both sections |
| Vertical centering regression | **Yes** | R2 | Label center == h2 center | Rendered / DOM measure |
| Data-fetch / auth / RLS / hydration | No | Pure presentational style; no data path touched | N/A | — |

## Acceptance criteria

- `AC1 [R1]` Given the fixed control at `uk@320` and `sq@320`, when rendered, then the wrapped label's lines are right-aligned to the control's right edge (flush with the row's right margin).
- `AC2 [R2]` Given any locale, when rendered, then the label is vertically centered against the sibling `<h2>` (no regression of the retained `styles.root` centering).
- `AC3 [R3]` Given the diff, when inspected, then only `ViewAllLink.tsx` (+ session log + backlog) changed; both Latest (`page.tsx`) and Featured (`FeaturedListings.tsx`) show the corrected behavior with no call-site edit.
- `AC4 [R4]` Given `en`/`it` and the required Q2 widths, when rendered, then single-line labels are unchanged and no cell clips/overflows.
- `AC5 [R5]` Given the diff, when inspected, then `theme.ts` is untouched and the right-align is local to `ViewAllLink`.

## QA profile and verification plan

**Profile: Q2 Standard UI** (shared Mantine surface on the homepage; user-facing text wraps per locale → check all four locales at every required width). Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0 (no new violation).
3. `npm run check:i18n` → unchanged parity (no new key).
4. `npm run check:mojibake` → 0 artifacts.
5. **Rendered (Q2 matrix):** capture both homepage sections (Latest + Featured), or the `System/FeaturedListings` story, at `320 / 390 / 768 / 1024 / 1440`, all four locales at `320` and `1440`, `uk@320` and `sq@320` mandatory. Confirm: wrapped label right-aligned (AC1), vertical centering intact (AC2), single-line locales unchanged (AC4), both sections identical (AC3). Paste the wrapping cells + a single-line cell + a desktop cell.
6. `git status --short` / `git diff --stat` → only `ViewAllLink.tsx` (+ session log + `docs/backlog.md`). Any other path (e.g. the auto-regenerated `docs/governance-reports/2026-06-19-task467-*.md` harness side-effect) → classify `EXCLUDED AS UNRELATED`, do not fold into this task.

If a required check cannot run in the sandbox, record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd run …` / `npx.cmd …`) + expected result; never substitute a confidence claim.

## Completion report contract

Write `docs/sessions/2026-07-20-task632-viewalllink-wrapped-label-right-align.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R5 each with evidence; typecheck/check:stories/check:i18n/mojibake results; the rendered cells (locations) incl. `uk@320`/`sq@320`; the canonical decision (local `ViewAllLink` extend, no `theme.ts`); explicit confirmation that no consumer call-site, `theme.ts`, `AgentCtaButton.tsx`, or the story was touched; and an explicit note that this task owns the full `ViewAllLink.tsx` diff vs HEAD (centering + alignment) and that Task 631 is committed story-only. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 14 file integrity).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/mantine-responsive-design-system.md` (Mantine styling authority) and `docs/tailadmin-style-reference.md` (visual chrome) as needed.
- `docs/component-rules.md` (i18n, no-duplicate, container/presentational).
- `docs/qa-profiles.md` (Q2 evidence).
- Source: `src/components/shared/ViewAllLink.tsx` (target), `src/app/[locale]/page.tsx` (Latest consumer), `src/modules/listings/components/FeaturedListings.tsx` (Featured consumer), `src/components/shared/AgentCtaButton.tsx` (precedent, do not edit), `src/stories/mantine/primitives/Button.stories.tsx` (canonical chrome, reference), `package.json` (commands).

## Task quality gate

- A fresh Sonnet session can execute this without chat context: exact target file + current markup, both consumers named with lines, the observable defect + required after-state, a recommended approach with a verify-and-adjust fallback, the provenance decision (local, not `theme.ts`), and the Q2 proof matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope names what must not change (consumers, `theme.ts`, `AgentCtaButton`, the story, i18n keys). ✅
- Current/legacy boundary explicit (current Mantine); Q2 profile + locale/viewport matrix stated. ✅
- Negative flows selected by applicability. ✅
- Resolves the Task 631 scope entanglement by taking ownership of the whole `ViewAllLink.tsx` diff. ✅
