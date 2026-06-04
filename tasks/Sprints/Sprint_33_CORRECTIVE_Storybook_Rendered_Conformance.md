# Sprint 33 — CORRECTIVE: Storybook Rendered Conformance + Enforced Anti-Hardcode Gates

> # 🔴 WHY THIS SPRINT EXISTS
> The Sprint 32 correctives (372–376, 379) were implemented and several were orchestrator-"approved" from the
> diff — yet the owner rendered every story (sq/en/uk/it × all breakpoints) and **almost all FAIL**. Root cause:
> the rules lived only in prose + self-reported greps, and approval happened from the diff without rendered
> evidence. Full diagnosis: `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md`.
> **This sprint makes the rules machine-enforced and the proof machine-produced, then re-certifies every story
> on the rendered canvas.** Task 377 (the un-run sweep) is superseded by Task 383.

## Two systemic root causes this sprint kills GLOBALLY (not pointwise)
1. **RC-1 Canvas defeats full-width.** `layout:'centered'/'padded'` shrink-wraps stories, so correct
   `max-sm:w-full` primitives still render content-width/centred at <640. Fixed once, globally, in the canvas.
2. **RC-2 Hardcoded fixtures.** Raw English (and one raw Ukrainian) string literals in `*.fixture.ts` and inline
   story arrays leak across locales. Fixed by a single locale-aware fixture/i18n layer + a lint/CI gate that
   makes raw user-facing literals **un-committable**.

Plus: RC-3 redundant `Ukrainian*` stories deleted; RC-4 component-layout defects (Tabs/Select/AdminLayout/
RVS/Skeleton) fixed; RC-5 enforcement + orchestrator rendered-approval gate.

## OWNER P0 — carried into EVERY task in this sprint (non-negotiable)
- **<640px = FULL WIDTH, EVERYWHERE.** Every text Button/control/Tabs list/Select/Combobox trigger/PhoneField/
  toolbar/CTA spans full available width below 640. ALL popups = full-width bottom sheet at <640. ≥44px, labels
  wrap (sq/en/uk/it), no h-scroll at 320. (`agent-contract.md` clauses 11–12.) The owner re-stated this for
  Button/Tabs/Dialog/Badge: **all breakpoints must be considered because full-width must hold on every screen <640.**
- **NO HARDCODE.** Zero raw user-facing string literals in stories/fixtures/helpers; everything via the locale
  layer with full sq/en/uk/it parity. This is now lint-enforced (Task 380).
- **Rendered proof only.** tsc/lint/build-storybook exit 0 is NOT proof. Every UI cell needs a machine-produced
  screenshot. uk@320/375/390 mandatory.

## Execution order (strictly sequential; each gated on rendered orchestrator review of the previous)
`380 → 381 → 382 → 383`
- **380** lands the canvas + i18n infra + the enforceable gates FIRST (so 381–383 inherit enforcement).
- **381** de-hardcodes all content + deletes redundant uk stories (gates from 380 must already be green-on-violation).
- **382** fixes the component-layout defects (some primitive edits).
- **383** is the FINAL rendered 26×9 sweep — runs only after 380–382 are implemented AND I have reviewed the
  rendered artifacts of each. It produces the certification matrix from machine screenshots, not prose.

## Definition of done for the sprint
- `npm run lint` + `node scripts/check-stories.mjs` + `npm run check:i18n` FAIL on any reintroduced hardcode /
  `layout:'centered'|'padded'` / `Ukrainian*` story / raw control — proven by a deliberately-planted violation
  in the session log (then removed).
- The automated rendered assertion passes for all 26 stories at all required breakpoints × 4 locales, with
  artifacts checked into the evidence folder and referenced cell-by-cell.
- Every owner FAIL item from `Stories_fails.zip` is re-rendered and shown PASS, including the "delete Ukrainian
  story" items.
- I approve only from the rendered artifacts. Then I emit explicit-path commit commands; the owner runs them.

## The 26 story files in scope (none skipped)
admin: AdminCardList, AdminPageShell, AdminTable, StatusChangeControl, StatusChangeHistory ·
layout: FilterBar, PageHeader, PageShell, Section · shared: Combobox · ui: Badge, Button, Checkbox, Command,
Dialog, DropdownMenu, Input, PasswordInput, PasswordRequirementsHint, Popover, Select, Sheet, Skeleton, Tabs ·
system: AdminLayout, Containers, EmptyState, ListingGrid, RecentlyViewedSection. Plus helpers/fixtures:
`src/stories/StoryListingCard.tsx`, `src/stories/fixtures/**`.
