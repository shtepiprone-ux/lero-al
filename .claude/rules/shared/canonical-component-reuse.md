# Canonical component reuse (checklist U1, U2)

Owner, 2026-10-20 (translated): "first check whether a ready component already exists and use it, instead of creating
a duplicate." Owner, 2026-11-19 (translated): "In tasks that concern front-end parts, legacy components and elements must
be migrated to Mantine right away, so that no additional work is needed later."

## U1 — choose the owner, in this order

- [ ] **Search.** `src/design-system/mantine/`, production components and the Stories, by purpose and behaviour; open
      each plausible candidate's source and direct Story. A file name alone is not enough.
- [ ] **REUSE** a component that covers the need, through its public API. Its design, tokens, mobile behaviour and
      provenance are inherited: no redesign, no new external research, no re-measurement of its unchanged chrome.
- [ ] **EXTEND** the same owner and its direct Story when one state or capability is missing; name that gap.
- [ ] **CREATE** the smallest shared Mantine component and its direct Story only when nothing can be reused, extended
      or composed; say why each candidate cannot. A route, wrapper, locale or viewport never justifies a duplicate.
- [ ] The kickoff records: the searched purpose, the inspected paths and Story IDs, `REUSE | EXTEND | COMPOSE | CREATE`,
      the owner and its token path; when everything is inherited, the line
      `Reference research (GR-7): inherited canonical design — owner decision 2026-10-20`.

## U2 — legacy in a file the Fix changes

- [ ] Only a file the Fix must change is migrated (checklist A1); its legacy parts are imports from
      `@/components/ui/*`, Tailwind classes (the oracle is `scripts/check-enrolled-tailwind.mjs`) and the legacy admin
      wrapper `<div className="p-6 lg:p-8 ...">`, which becomes `AdminPageFrame`. A dead file is deleted instead.
- [ ] **The migration keeps the behaviour of `main`** (owner, 2026-11-21): every control, input affordance, option,
      validation, position, colour and label. When the canonical owner's default drops something, the owner that keeps
      it is chosen. Example (Task 957 Review 3): Mantine `TextInput type="number"` hides the browser's step arrows
      (`node_modules/@mantine/core/styles.css:1550-1557`); the owner that keeps stepping is `NumberInput`.
- [ ] A legacy component the migrated file renders is replaced by its canonical owner where one exists; otherwise it is
      listed in `scripts/rendered-scope-allowlist.json` with the open task that migrates it.
- [ ] Proof: the component is enrolled in `scripts/mantine-migration-scope.json` with no entry in
      `scripts/enrolled-tailwind-baseline.json` or `scripts/rendered-scope-baseline.json`; the CI product checks run
      `npm run check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` on GitHub.
- [ ] Two tasks that change the same legacy file run in order; the first migrates it.

## Review

- [ ] The chosen owner is really consumed; no duplicate component or local styling was added; the changed states work.
      Settled design is reopened only for a reproduced defect or an owner request.
