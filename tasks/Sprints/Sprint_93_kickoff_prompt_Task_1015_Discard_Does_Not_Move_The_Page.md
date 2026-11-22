# Task 1015 — Discarding the listing form does not move the page

Sprint 93. Priority P3. Owner decisions: O957-12 2026-11-21 (the owner, translated: "it happens in Windows Chrome. Maybe it happens only in Storybook"). Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

After Discard in the listing form's confirmation the dialog closes and the page moves down a few pixels (the owner, 2026-11-21, Windows Chrome). After the task the page stays where it was.

## Cause

- The movement is reported by the owner and not reproduced in Chromium emulation (`docs/reviews/Task_957_Review_4.md:81`, F30); its cause is UNKNOWN. The confirmation is `MantineDeleteConfirmModal` in `src/modules/listings/components/ListingFormShellView.tsx:286`.
Fix: Sonnet measures `scrollY`, the `h1` position and the `html`/`body` styles before, while open and after Discard in Windows Chrome with its classic scrollbar, in the Story `CancelConfirmation` and on the edit page, names the cause from those values and fixes it at its owner (a Storybook decorator when only the Story moves).

## Scope

- The owner the measurement names: `src/modules/listings/components/ListingFormShellView.tsx`, `src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx` or the Storybook decorator; one of them, named in the report before the change.
- Test: `src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx`.
- State: the listing form on Mantine reaches `main` with Task 957; this task starts from `main` after that merge.
- Dependencies: none. Out of scope: every other part of the form.
- Kept as on `main` (checklist A2): the dialog's text, buttons, order and what Discard does.

## Attack surface

Unchanged: a layout fix of a dialog; no data, role or request changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- Cross_Site_Scripting_Prevention: not applicable — a layout fix of a dialog renders no new text or markup
- DOM_based_XSS_Prevention: not applicable — no DOM sink is added or changed by the layout fix
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter, regular expression or eval is added
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the code is written by Sonnet and its every claim is rerun by Opus — AC2
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC2
- Web_Frontend_Security: not applicable — no innerHTML or other markup sink is added by the fix
## UI

The fix sits in the owner the measurement names (U1); no new component, no local style (U3). States (U11): the dialog's open and closed states are the owner's; nothing else changes. U12: focus returns as the owner sets it.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/listings/components/ListingFormShellView.tsx — the Discard confirmation of the listing form
- Component families: overlay-and-disclosure
- Pattern IDs: overlay-adaptive
- Standards: w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the owner's bottom sheet; 640px transition to the owner's centred dialog
- Mobile order: title → message → confirm → cancel, as the owner sets it
- Required-content treatment: no semantic loss: nothing clamps
- Story and verification: Patterns/Mantine/ListingFormShellView CancelConfirmation at 320px and 390px and on both sides of the 640px transition, checked by the owner by hand (checklist U9)

## Acceptance criteria

- AC1 Discard does not move the page in Windows Chrome (Review 4 F30, O957-12) — test: `src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx` (extended), failing before the fix; the report gives the before, open and after values in Windows Chrome (Story and edit page) and the cause named from them.
- AC2 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Opus hands the owner the commands (checklist H): a branch `task/<n>` from `main` that takes the Scope files from `task/957-signed-listing-uploads`. Task 957 merges first; the measurement comes before the change.
2. Run: `npx vitest run src/modules/listings/components/__tests__/ListingFormShellView.controls.test.tsx`. CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
3. Report: each command, exit code, relevant output; one deliberate break per security test (named in its criterion), restored.

## Review
