# Opus: inspect ready Mantine components before designing

## Owner decision, 2026-10-20

The owner confirms that the existing canonical Mantine Stories are adapted and ready for reuse:
"first check whether a ready component already exists and use it, instead of creating a duplicate."
If no suitable component exists, create a canonical component and add its direct Story.
This decision governs Opus task creation, every task revision, and implementation review. For these phases it takes
precedence over blanket GR-7 research, fresh mobile-pattern selection, and whole-library remeasurement of an
unchanged canonical component. Read this file before reference research or a new UI design decision.

## Owner decision, 2026-11-19: legacy in a changed file moves to Mantine in the same task

Owner (translated): "In tasks that concern front-end parts, legacy components and elements must be migrated to Mantine
right away, so that no additional work is needed later. We are giving up Legacy and moving to Mantine step by step."

- A task that changes a front-end file (a page, layout, component or Story that renders UI) migrates every legacy part
  of that file in the same task: imports from `@/components/ui/*`, Tailwind utility classes (the oracle is
  `scripts/check-enrolled-tailwind.mjs`), and the legacy admin page wrapper `<div className="p-6 lg:p-8 ...">`, which
  becomes `AdminPageFrame`. "No visible change" does not exempt the file; a dead file is deleted instead.
- The kickoff names each such file in Scope with its legacy parts and the canonical owners that replace them, and its
  UI and Mobile adaptation record cover the migrated surface.
- A legacy component the migrated file renders is replaced by its canonical owner where one exists (for example the
  shared `Combobox` by `MantineCombobox` or `MantineSelect`); otherwise it is allowlisted in
  `scripts/rendered-scope-allowlist.json` with the open task that migrates it; a legacy file left with no user is
  deleted.
- Proof: the migrated component is enrolled in `scripts/mantine-migration-scope.json` with no entry in
  `scripts/enrolled-tailwind-baseline.json` or `scripts/rendered-scope-baseline.json`, and `npm run
  check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` pass; a migrated page is
  listed in the admin page-frame test (new, created by the first task that migrates an admin page) or the task's own
  page test, and has no `className`.
- When an open task of another sprint already plans that migration, the changing task takes it over and the plan
  records the hand-over; two tasks that change the same legacy file run in order, the first migrates it.

## Required order

1. **Search first.** Search the component catalog, `src/design-system/mantine/`, production components, canonical
   `src/stories/`, and colocated Stories by semantic purpose and behavior. Open plausible candidates' source/API and
   direct Story; inspect the rendered Story in the relevant states and responsive presentation. A filename/title alone
   is insufficient. This happens before visiting external references, choosing geometry, or proposing a component.
2. **REUSE.** When a ready component covers the requirement, consume that exact canonical owner through its public
   API. Inherit its design, tokens, adapted behavior, and existing provenance. Do not copy its markup, create a parallel
   component/Story, redesign it, reselect its mobile pattern, re-audit external references, or measure its unchanged
   chrome again to justify reuse. Compose existing owners when their supported APIs already cover the composition.
3. **EXTEND.** When the same owner lacks a required state or capability, name that exact gap and extend the component
   and its existing direct Story. Preserve the covered design. Research and verify only a genuinely new decision or a
   reproduced defect; the gap does not reopen every settled visual decision.
4. **CREATE.** Only when the inspected candidates cannot cover the requirement by reuse, extension, or composition,
   create the smallest shared native Mantine component and its direct Story before consumer integration. Use existing
   tokens/patterns and applicable registration. A different route, filename, wrapper, locale, or viewport never
   justifies a duplicate. An existing component with no direct Story needs a Story, not a replacement component.
5. **Review the integration.** Independently confirm the selected owner is really consumed, no duplicate or local
   styling was introduced, and task behavior, changed states, integration, and relevant regressions work. Review is
   not a new design exercise. Reopen settled design only for a concrete reproduced defect or an explicit owner request.

## Research and proof scope

- For ready-component reuse, cite the inspected source, Story ID/state, token owner, and inherited mobile
  family/profile/mechanism. Reuse those fields in the Mobile adaptation record; do not invent a new adaptation.
  Existing primary-source catalogue links may be cited as inherited provenance without a fresh external audit.
- Record `Reference research (GR-7): inherited canonical design — owner decision 2026-10-20`, with the component and
  Story locators, when all in-scope UI decisions are covered. This is an explicit exception to the old mandatory live
  audit and receipt, not a claim that external pages were inspected in this session. For mixed scope, separate the
  inherited decisions from each named new decision/defect and research only those gaps under `reference-research.md`.
- Verify the changed surface and integration at applicable states/locales/viewports. Do not rerun a whole-library
  GR-12 census or reference pixel/corner/spacing measurements for nested canonical elements whose visual contract is
  unchanged. A changed shared visual contract or reproduced parity defect requires the affected cross-Story census;
  record its scope honestly. This exception does not suppress a failing repository gate or observed regression.
- Keep existing write receipts, token ownership, Story coverage, security, and applicable integration/runtime gates.
  Missing evidence of task behavior is still a gap; inheriting approved design does not claim runtime verification.

## Task and review record

Use the existing GR-0 decision record: semantic queries, inspected component paths and Story IDs/states,
`REUSE | EXTEND | COMPOSE | CREATE`, selected owner/token path, and rationale. For `EXTEND` name the missing capability;
for `CREATE` explain why each plausible owner cannot cover it. Keep the kickoff's single route aligned with that
decision, including during a `NEEDS REVISION` amendment. Reject a duplicate when a suitable canonical owner exists.
