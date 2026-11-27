# Task 989 — Revision 2, executor report (Sonnet)

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) ·
Review: [Task_989_Review_2.md](../reviews/Task_989_Review_2.md), "Revision 2 (for the implementer)" · Base commit `75a9be6a8` ("Task 989: Revision 1 as
reviewed in Review 2, before Revision 2"). No Git command that writes was run. Every command below ran in **Git Bash** (the Bash tool); none ran in PowerShell.

## I1, A0

- `git status --short` → only Opus's documents (`.claude/rules/`, `docs/`, `tasks/`); `git log --oneline -1` → `75a9be6a8 Task 989: Revision 1 as reviewed in Review 2, before Revision 2`.
- `node scripts/quality/owasp.mjs sync` → `owasp sync: 142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0`, exit 0;
  `node scripts/quality/owasp.mjs plan <kickoff>` → exit 0. Rules read for the files changed: `.ts`/`.tsx` — parse, ESLint, `tsc` (`quality-gates.md` §1, §2);
  `.md` — relative links resolve (§1).

## `git diff --stat 75a9be6a8 -- src`

```
 src/components/admin/AdminFooterManager.tsx        | 27 +++++++-----
 .../__tests__/AdminFooterManager.shared.test.tsx   | 49 +++++++++++++++++++++-
 src/modules/admin/lib/settingKeys.ts               | 10 +++--
 3 files changed, 69 insertions(+), 17 deletions(-)
```

## Item 1 — F7

- a. `settingKeys.ts`: `SETTING_MAX_LENGTH` (5000), `FOOTER_LINKS_MAX` (50), `FOOTER_LINK_LABEL_MAX` (200), `FOOTER_LINK_URL_MAX` (2048) exported; values
  unchanged; `withinFooterBounds` uses them as before. `FOOTER_LINK_ID_MAX` stays private (the form makes the id, nobody types it).
- b. `AdminFooterManager.tsx`: the link label input `maxLength={FOOTER_LINK_LABEL_MAX}`, the link address input `maxLength={FOOTER_LINK_URL_MAX}`; the six text
  fields of a language tab (brand title, footer text, copyright, social, navigation and information section titles) `maxLength={SETTING_MAX_LENGTH}`; "add link"
  `disabled={disabled || links.length >= FOOTER_LINKS_MAX}` (one `LinkGroupEditor` serves the social, navigation and information lists). `showResult` takes the
  message for `validation`: `handleSave` passes `'error_save'`, `handleSaveShared` passes `'error_invalid_contact'`; every other mapping is unchanged; no message key added.
- c. `AdminFooterManager.shared.test.tsx`: `renderManager` takes optional fields of the sq row (the existing calls pass none); four cases — the `maxlength`
  attributes (label 200, address 2048, the six text fields 5000); "add link" `[disabled, enabled, disabled]` for lists of 50, 49, 50 links, and all three disabled
  after the 49-link list gets its 50th; a language-tab save answered `{ error: 'validation' }` toasts `error_save` and not `error_invalid_contact`; the shared
  save answered `validation` toasts `error_invalid_contact`.

## I4 — failing first (Git Bash)

`npm test -- src/components/admin/__tests__/AdminFooterManager.shared.test.tsx` on the unchanged product code → `EXIT=1`

```
     × the link label, link address and the six text fields of a language tab carry the bounds of the actions as maxLength
     × "add link" is disabled in a list of 50 links and enabled in a list of 49
     × a language-tab save refused with validation shows the save error, not the contacts message
AssertionError: ,: expected false to be true // Object.is equality
AssertionError: expected [ false, false, false ] to deeply equal [ true, false, true ]
AssertionError: expected "vi.fn()" to be called with arguments: [ 'Save failed. Please try again.' ]
 Test Files  1 failed (1)
      Tests  3 failed | 10 passed (13)
```

The fourth new case (the shared save keeps `error_invalid_contact`) passes on the base commit: it pins behaviour the revision keeps.

## Commands on the final tree (all Git Bash)

| Command | Printed summary | Exit (printed) |
|---|---|---|
| `npm test -- src/components/admin/__tests__/AdminFooterManager.shared.test.tsx src/__tests__/security/staffActions.test.ts src/components/admin/__tests__/adminFormsKit.test.ts src/modules/admin/actions/__tests__/settingsReach.test.ts src/modules/admin/__tests__/adminOrphans.test.ts` | ` Test Files  5 passed (5)` / `      Tests  308 passed (308)` | `tests EXIT=0` |
| `npm run typecheck` | 80 errors, all in `.next/types/validator.ts` (untracked, gitignored, built 2026-11-21); 0 in `src` | `typecheck EXIT=2` |
| `npx eslint --no-warn-ignored --max-warnings 0 src/components/admin/AdminFooterManager.tsx src/components/admin/__tests__/AdminFooterManager.shared.test.tsx src/modules/admin/lib/settingKeys.ts` | no output | `eslint EXIT=0` |
| `npx vitest related --run --reporter=verbose` the same three files | ` Test Files  44 passed (44)` / `      Tests  917 passed (917)` | `related EXIT=0` |
| §8.1 text search: `grep -rlE` over `src scripts` (`*.test.ts`, `*.test.tsx`, `*.test.mjs`) for `components/admin/AdminFooterManager`, `__tests__/AdminFooterManager.shared`, `modules/admin/lib/settingKeys`, `FOOTER_LINKS_MAX`, `FOOTER_LINK_LABEL_MAX`, `FOOTER_LINK_URL_MAX`, `SETTING_MAX_LENGTH` | 3 files (`adminFormsKit.test.ts`, `adminOrphans.test.ts`, `settingsReach.test.ts`), all in the graph's run | — |

`[SEC-T1-SRV-BUILT-PROXY]` (`proxyFile.test.ts`): not reached by this change (not in the graph's run, no text match; `src/proxy.ts` unchanged), so it did not run.

## I8a — measured (Storybook dev server, Playwright)

`Patterns/Mantine/AdminFooterManager` Default at 320, 640, 1024, 1440: no page overflow at any width; `input[maxlength]` — 5 × `200` (labels), 5 × `2048`
(addresses), 6 × `5000` (the language tab's text fields); the three "add link" buttons 105×44, enabled (the Story's lists hold 2, 1 and 2 links), at 1440 radius
8px, 14px/500 — the same as before the change. The disabled state at 50 links is rendered in no Story; it is checked only by the unit test above. Console: the
known 404 for `/api/presence` on the Storybook server.

BLOCKED: the dev server `/uk/admin/footer` in the owner's session — the Claude-in-Chrome extension is not connected (checked again in this session), so no
signed-in admin page could be opened.

## I9

The revision adds no security control (the server bounds are Revision 1's and unchanged); no break was run.
