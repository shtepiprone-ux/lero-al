# Task 989 — Review 5

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) · OWASP record: [Task_989.json](../security/owasp/reviews/Task_989.json) · Previous: [Review 4](Task_989_Review_4.md)

Review 5 of Revision 3: the working tree on debd90141 (branch `task/989-site-settings-reach-the-site`, PR #85, uncommitted) — NEEDS REVISION
Scope: diff-based against `debd90141`; 7 changed files and 2 new tests; the executor's report `docs/sessions/2026-11-27-task989-revision3-executor-report.md`; the owner's dev-server log of 2026-11-27 (hydration error on `/uk/admin/footer`)
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46010475487 (the owner's rerun) success; the Route's 7 files → 68 passed, exit 0; ESLint → exit 0; typecheck → 0 errors in `src`; `vitest related` → 7 passed, exit 0
Findings: Critical 0, High 0, Medium 1 (F13), Low 0. F8-F12 of Review 4: fixed in the tree (their gates run on GitHub, A5).
Overall risk: the CI fixes are in place; the drag handles of the Footer page hydrate with a description id the page does not hold, so the keyboard instructions of the drag are not announced after load.

## Checklist V

- V1: `owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified"; `check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 46010475487 success (the owner's rerun of the Click-shield timeout, Task 1074).
- V2: `git log --oneline -1` → `debd90141`; `git diff --stat debd90141 -- src scripts` → 7 files, 127+/102-, plus `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx` and `src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx`; each belongs to Revision 3; `AppImage.stories.tsx` equals `main` again.
- V3: claims rerun (Git Bash).
  - The Route's 7 files → `Test Files  7 passed (7)`, `Tests  68 passed (68)`, exit 0 — as reported.
  - ESLint over the 7 code and Story files → exit 0.
  - `npm run typecheck` → 0 errors in `src`; 80 in the untracked `.next/types/validator.ts`; exit 1.
  - `npx vitest related` over the 5 changed non-test files → `Test Files  2 passed (2)`, `Tests  7 passed (7)`, exit 0; the report's "5 files, 52 tests" ran over its own file set. The §8.1 text search over `ui-contract-registry`, `surface-census-baseline`, the two Story files → `scripts/__tests__/check-design-tokens.test.ts`, run by the executor (157 passed).
  - The census baseline: 268 → 256 keys, the 12 rows of Review 4 F12 removed, none added or changed; the three moved keys are the script's sort (`scripts/check-surface-census-changed.mjs:270`); answered to the executor 2026-11-27.
- V4: every changed file read. F8: two registry entries in the shape of the others, their Story exports exist. F9/F11: `BrandLogo` gone; `WithLogo` guest, `WithLogoSignedIn` signed-in, no wrappers; the caption keys stay in use by `Default` (`HeaderView.stories.tsx:60,81,126`). F10: `MantineBadge variant="tone" tone="brand" size="xs"`, `Badge` out of the core import. F12: `getSettings` tests (empty list, the exact keys, the error) and both page tests (props from the read; the guard before the read; removed keys kept out of the form).
- V5: the default-language mark: `main` drew a light brand chip (`bg-primary/10 text-primary`); the canonical `MantineBadge` tone `brand` is the filled brand badge, the one look of a tone badge (`MantineBadge.tsx:60-65`); the Mantine migration of the form is the kickoff's order. Not a finding.
- V5a:
  - Owner's Chrome (extension), dev server, `/uk/admin/settings`, tab "Локалізація", 1920px: the DEFAULT badge 69×24, background `rgb(236, 84, 71)`, text `rgb(255, 255, 255)`, radius 9999px, 12px 500, padding 2px 8px; no overflow. The executor's BLOCKED step is done here.
  - Storybook: the executor's measurements of `WithLogo` and `WithLogoSignedIn` (logo 28px, header height as `Default`) at four widths; not repeated.
  - Owner's dev-server log, `/uk/admin/footer`: "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up." on every link-row handle: server `aria-describedby="DndDescribedBy-1"`, client `"DndDescribedBy-2"` (and `-2`/`-4` in the second list) — F13.
- V6: no `eslint-disable`, `.skip`, `.only`, `@ts-*` or allowlist; the census baseline loses 12 rows and gains none.
- V7: below.
- V8: `getSettings` body replaced by `return {}` → `adminLib.test.ts` `Tests  2 failed | 32 passed (34)`, exit 1, restored (`git diff | sha1sum` identical); the executor's I9 on the badge swap is consistent with the test (it reads the source).
- V9: below.
- V10: no new sheet trigger; the record is unchanged.
- V11: one finding, below.
- V12: this file, linked from the kickoff; `check-files.mjs` on the kickoff and the review.
- V13: NEEDS REVISION.

## V7 — secure code review

- No entry point, query or output sink changes; the page tests pin the guard before the read on both admin pages (`requireStaffPage({ adminOnly: true })`, `requireStaffPage({ page: 'page.settings' })`).

## Findings

### F13 — Medium — the drag handles of the Footer page hydrate with a description id the page does not hold

Location: `src/components/admin/AdminFooterManager.tsx:172` (`<DndContext sensors collisionDetection modifiers …>` without `id`).
Fact: `@dnd-kit/core` names the hidden drag instructions with `useUniqueId("DndDescribedBy", id)` (`node_modules/@dnd-kit/core/dist/core.esm.js:2903`); without the context's `id` it takes a module-level counter (`node_modules/@dnd-kit/utilities/dist/utilities.esm.js:170-179`), which on the server keeps counting across requests and in the browser starts again. The owner's dev-server log of 2026-11-27 shows the mismatch on every handle (`DndDescribedBy-1` against `-2`, `-2` against `-4`), and React says the attributes "won't be patched up".
Impact: after load each handle's `aria-describedby` names the server's id, while the instructions element mounted in the browser carries the client's id: a keyboard or screen-reader user does not hear how to drag (the AC5 keyboard path); the console error on every load of the page. Owner, 2026-11-27, reported it from the dev server.
Required correction: each `LinkGroupEditor` passes a stable id to its `DndContext`: `const dndId = useId()` (React) and `<DndContext id={dndId} …>`; nothing else changes.

## Revision 4 (for the implementer)

1. F13 — `src/components/admin/AdminFooterManager.tsx`: `useId` from React in `LinkGroupEditor`, `<DndContext id={dndId} …>`.
   Test in `src/components/admin/__tests__/AdminFooterManager.shared.test.tsx` (a server render, then hydration, as the page does): `renderToString` the manager tree (the same providers as `renderManager`) twice — the second call stands for a later request on the same server — put the second HTML into a container, `hydrateRoot` the same tree into it inside `act`, with `console.error` and `onRecoverableError` recorded: no hydration-mismatch message; every handle's `aria-describedby` after hydration equals the server HTML's; once mounted, the element it names exists and holds the drag instructions text (`t.drag_instructions`). Without the `id` the test fails (the module counter differs between the server render and the hydration in the same process). A client-only `render` twice is not the test: React's `useId` on a client-only mount takes a global counter too.
2. The report quotes each command's printed summary lines and exit code and names the shell; the dev server's console on `/uk/admin/footer` after a reload shows no hydration error (or BLOCKED with its fact).

## Stories for the owner (V9)

- `Primitives/HeaderView` — WithLogo (guest), WithLogoSignedIn; `Patterns/Mantine/AdminSettings` — Localization tab, the DEFAULT badge; `Patterns/Mantine/AdminFooterManager` — drag with the keyboard (Space, arrows, Space) after Revision 4.

## Open for Opus and the owner

- The dev-server Sentry line in the same log ("Failed to register diagnostics-channel injection hooks … @sentry/server-runtime-injection") is Task 1073, filed 2026-11-27; not this task.
- After Revision 4: a local commit and a push to the branch of PR #85; Review 6 reads its CI.
