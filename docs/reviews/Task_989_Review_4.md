# Task 989 — Review 4

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) · OWASP record: [Task_989.json](../security/owasp/reviews/Task_989.json) · Previous: [Review 3](Task_989_Review_3.md)

Review 4 (V14) of pull request #85, head `debd90141` (branch `task/989-site-settings-reach-the-site`) — NEEDS REVISION
Scope: the CI run 46011294336 of the pull request; the failed jobs read with `gh run view 46011294336 --log-failed`
Tools: `gh pr checks 85`; `gh run view 46011294336 --json jobs`; `--log-failed`
Findings: Critical 0, High 0, Medium 0, Low 5 (F8-F12), all CI gates the review could not run locally (A5)
Overall risk: no security finding; the OWASP task gate, CodeQL, the authorization regression, Click-shield, the dependency audit, the secret scan and the Storybook build passed. The pull request cannot merge: `CI Required` fails on two jobs.

## Checklist V14

- `gh pr checks 85` → fail: `Lint, types and product checks` (step "Product checks (i18n, design system, UI contract, grants)"), `Unit and component tests` (step "Every changed product line runs in a test (quality-gates.md §8)"), `CI Required`; pass: the other 20 checks.
- `gh pr view 85` → head `debd901416cd20239d2f737392ee406f37ce110c` = local `HEAD`, `MERGEABLE`, `BLOCKED`.
- The `main` run 46010475487 (schedule, `8896ef0d7`) failed at Click-shield on a navigation timeout, not this diff; filed as Task 1074; the owner reran its failed job.

## Findings

### F8 — Low — the two forms newly enrolled in the Mantine scope have no UI contract

CI: `npm run check:ui-contract` → "FAIL registry newly enrolled component lacks an explicit UI contract: src/components/admin/AdminFooterManager.tsx" and the same for `src/components/admin/AdminSettings.tsx`. The diff adds both to `scripts/mantine-migration-scope.json`; `scripts/check-ui-contract.mjs:271` requires each newly enrolled path in `scripts/ui-contract-registry.json`.
Required correction: one entry each in `scripts/ui-contract-registry.json`, in the shape of the existing entries (`id`, `component`, `stories`, `tokenOwners`, `parity`): `admin-footer-manager` → `src/components/admin/AdminFooterManager.tsx`, Story `src/stories/patterns/mantine/AdminFooterManager.stories.tsx`, token owner `src/design-system/mantine/theme.ts`, parity `{ element: "admin footer form", storyExports: ["Default", "Empty", "NotInitialized", "Forbidden"] }`; `admin-settings` → `src/components/admin/AdminSettings.tsx`, Story `src/stories/patterns/mantine/AdminSettings.stories.tsx`, token owners `src/design-system/mantine/theme.ts` and `src/design-system/mantine/badgeTones.ts`, parity `{ element: "admin settings form", storyExports: ["Default", "Empty"] }`.

### F9 — Low — two new Stories style their own wrappers

CI: `npm run check:ui-contract` → `[story-wrapper-presentation]` and `[raw-palette]` at `src/stories/mantine/primitives/AppImage.stories.tsx:147,148,151` (`<Stack gap>`, `<Text size c="gray.5" fw>`, `<Box h>`) and `src/stories/mantine/primitives/HeaderView.stories.tsx:184-192` (`<Stack gap>`, `<Text size c="gray.5" fw>` captions in `WithLogo`). The gate checks the changed lines of a changed Story and has no baseline (`check-ui-contract.mjs:23`).
Required correction:
- `AppImage.stories.tsx`: the `BrandLogo` Story leaves (with its `DEMO_LOGO` constant and the imports only it uses). The `brand-logo` variant takes its height from its one consumer (`HeaderView.tsx:121`, `theme.other.boxSize.siteLogo`; `AppImage.module.css:162` `.frameLogo { height: 100% }`), so a Story of `AppImage` alone can show it only through a sized wrapper, which the gate refuses; its Stories are those of `HeaderView`. The kickoff's Story list is amended by Opus in the Revision 3 block.
- `HeaderView.stories.tsx`: `WithLogo` renders the guest state only, with no `Stack` or `Text`; a new export `WithLogoSignedIn` renders the signed-in state (the props of today's second block); `Default` and `SigningOut` stay as they are.

### F10 — Low — the settings form imports `Badge` from `@mantine/core`

CI: `node scripts/check-badge-canonical.mjs` → "FAIL src/components/admin/AdminSettings.tsx:5 [badge-import] imports `Badge` from '@mantine/core' (use MantineBadge)".
Required correction: `AdminSettings.tsx` imports `MantineBadge` from `@/design-system/mantine/patterns/MantineBadge` and renders the default-language mark as `<MantineBadge variant="tone" tone="brand" size="xs">DEFAULT</MantineBadge>` (`main` drew it in the brand colour, `git show main:src/components/admin/AdminSettings.tsx:263`); `Badge` leaves the `@mantine/core` import; a test in `src/components/admin/__tests__/adminFormsKit.test.ts` (or the file that already reads the source) asserts no `Badge` import from `@mantine/core`.

### F11 — Low — the AppImage Story writes an English `alt`

CI: `npm run check:stories` → "src/stories/mantine/primitives/AppImage.stories.tsx:152 [jsx-prop-literal] Hardcoded English literal in JSX prop alt="Lero.al". Use storyT(locale, 'storybook.*') instead (§14.7)."
Required correction: the line leaves with the `BrandLogo` Story (F9).

### F12 — Low — the census baseline holds debt the diff paid, and three changed files have lines no test runs

CI: `npm run check:surface-census:changed` → "FAIL 12 stale baseline entr(ies) — no matching block exists": the `tier1-unenrolled-or-unstoried` and `tier2-legacy-primitive` rows of `src/app/[locale]/admin/footer/page.tsx` and `src/app/[locale]/admin/settings/page.tsx` (the forms left `@/components/ui` and are enrolled). Its fix line: "run `npm run check:surface-census:changed:update-baseline` to drop paid-off debt from the baseline".
CI: `node scripts/quality/changed-lines-coverage.mjs --base 8896ef0d7` → 581/618 covered; failures: `src/app/[locale]/admin/footer/page.tsx` lines 22, 32; `src/app/[locale]/admin/settings/page.tsx` line 34; `src/modules/admin/lib/settings.ts` lines 37-41 (`getSettings`, mocked by every test that reaches it).
Required correction:
- `node scripts/check-surface-census-changed.mjs --base main --update-baseline` (the command CI's fix line names, with the base given); the baseline diff removes exactly those 12 rows and adds none.
- `src/modules/admin/lib/__tests__/adminLib.test.ts`, `describe('getSettings')`: an empty key list returns `{}` without creating a client; rows map to `{ key: value }` and the query asks for exactly the keys given; a read error throws.
- `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx` (new): `requireStaffPage`, `getAdminLocale`, `getTranslations` and `getAllFooterContent` mocked; the page's element tree hands `AdminFooterManager` `initialData`, `initialShared`, `initialized` and `serverError` from `getAllFooterContent`; `requireStaffPage` runs before `getAllFooterContent`.
- `src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx` (new): `getAllSettings` mocked; `AdminSettings` gets `initialSettings` with exactly the keys of `SETTINGS_FORM_KEYS`, the stored value where one exists, else the default, else `''`; a removed key in the store does not reach the form.

## Revision 3 (for the implementer)

1. F8 — the two registry entries above.
2. F9 — `AppImage` `BrandLogo` leaves; `HeaderView` `WithLogo` (guest) and `WithLogoSignedIn` without wrappers.
3. F10 — `MantineBadge` in `AdminSettings.tsx`, and its test.
4. F11 — removed with item 2.
5. F12 — the census baseline update and the three tests.
6. The report quotes each command's printed summary lines and exit code and names the shell.

A5: the CI checks named in F8-F12 are not run locally; the gates' results come from the pull request's CI after the owner's push. The census baseline update in item 5 is the command CI's own fix line orders.

## Open for Opus and the owner

- Owner: after the revision, a local commit and a push to the same branch; the pull request #85 reruns its CI (H5).
- Opus: Review 5 reads the new CI run; the OWASP record is unchanged unless the revision adds a sheet trigger.
