# Task 989 — Review 6

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) · OWASP record: [Task_989.json](../security/owasp/reviews/Task_989.json) · Previous: [Review 5](Task_989_Review_5.md)

Review 6 of Revision 4: the working tree on 4acea0d58 (branch `task/989-site-settings-reach-the-site`, PR #85, uncommitted) — APPROVED
Scope: diff-based against `4acea0d58`; `src/components/admin/AdminFooterManager.tsx` (4 lines) and its test; the executor's report `docs/sessions/2026-11-27-task989-revision4-executor-report.md`
Tools: `owasp.mjs sync`, `check` → exit 0 (Review 5, same day, no upstream change); the 3 test files → 25 passed, exit 0; ESLint → exit 0; `vitest related` → 17 passed, exit 0; the break → 1 failed; the owner's Chrome on the dev server
Findings: Critical 0, High 0, Medium 0, Low 0. F13 of Review 5: fixed.
Overall risk: the drag handles hydrate with the server's description id; the CI gates of Review 4 run again on the push.

## Checklist V

- V1: as Review 5 (2026-11-27): `owasp.mjs sync` → "0 downloaded; added 0, changed 0, removed 0", `check` → "every quote verified", ruleset matches, `main` CI 46010475487 success; H1a repeats the upstream check before the push.
- V2: `git log --oneline -1` → `4acea0d58` (the prompt's base, the owner's Revision 3 commit); `git diff --stat HEAD -- src` → 2 files, 48+/6-; both belong to Revision 4.
- V3: claims rerun (Git Bash).
  - `npm test --` `AdminFooterManager.shared`, `adminFormsKit`, `footerPage` → `Test Files  3 passed (3)`, `Tests  25 passed (25)`, exit 0; the report's 14 of `AdminFooterManager.shared` and 8 of `adminFormsKit` are inside it.
  - ESLint over the 2 files → exit 0.
  - `npx vitest related --run src/components/admin/AdminFooterManager.tsx` → `Test Files  2 passed (2)`, `Tests  17 passed (17)`, exit 0 — as reported.
  - typecheck: the report's 0 errors in `src` (80 in the untracked `.next/types/validator.ts`); the change is an import and a prop of a typed component; CI runs it.
- V4: `useId()` in `LinkGroupEditor`, `<DndContext id={dndId}>`; nothing else in the component. The test renders the tree on the server twice (an earlier request advances @dnd-kit's module counter), hydrates the second HTML with `hydrateRoot`, records `console.error` and `onRecoverableError`, and checks the handles keep the server's ids, each naming the drag instructions.
- V5: no visible change.
- V5a: the owner's Chrome (extension), dev server, `/uk/admin/footer`, reloaded with console tracking on: 9 handles; the server HTML (`fetch(location.href)`) and the DOM hold the same `aria-describedby` for each (`_R_lmqq…_`, `_R_1bdddd…_`, `_R_1bdfdd…_`, one per list); each names an element whose text starts "Щоб перемістити посилання, натисніть Про…"; the console has no message matching `hydrat|did not match|didn't match|DndDescribedBy|Error`. The executor's BLOCKED step is done here.
- V6: no exemption in the diff.
- V7: no entry point, query or sink changes.
- V8: `id={dndId}` removed → `AdminFooterManager.shared` `Tests  1 failed | 13 passed (14)`, exit 1, with "hydrated but some attributes of the server rendered HTML didn't match the client properties"; restored (`git diff | sha1sum` identical).
- V9: `Patterns/Mantine/AdminFooterManager` Default: drag with the keyboard (Space, arrows, Space) and hear the instructions; Firefox too.
- V10: no new sheet trigger; the record is unchanged.
- V11: no finding.
- V12: this file, linked from the kickoff; `check-files.mjs` on both.
- V13: APPROVED. V14 follows the push: the CI of PR #85.

## After the merge (V14, H6, H7)

- PR #85 CI on `32bb87402`: 21 checks pass, `CI Required` pass, `MERGEABLE CLEAN`; `owasp.mjs sync --verify` exit 0 before the merge; the owner merged: `9b74f63a0` (2026-11-27T15:45:18Z); `main` CI 46027702079 success; Vercel status of the merge commit "Deployment has completed".
- Route step 5 on production (`curl` of `https://lero.al/{sq,en,uk,it}`, 200 each): exactly one `<link rel="icon">`, the saved Cloudinary favicon; the header logo is the saved Cloudinary logo (`h_84,c_fit`, alt "Lero.al"); the footer renders per language (uk: "Провідний маркетплейс нерухомості в Албанії", Навігація, Інформація), two `mailto:` links, Facebook and Instagram, no `tel:` link. The phone stays off (owner, 2026-11-27, translated: "we leave the phone off for now"; `footer_show_phone = false`). The titles and descriptions of the four languages were empty; at the owner's approval of the texts (2026-11-27, translated: "the main thing is that the SEO texts exist") Opus saved them on the admin settings page (dev server, the one Supabase project of D91); production then serves each language's own `<title>` and `<meta name="description">` (sq "Lero.al — Imobiliare në Shqipëri", en "Lero.al — Real estate in Albania", uk "Lero.al — Нерухомість в Албанії", it "Lero.al — Immobili in Albania"). Route step 5: done.
- Task 930 closed by AC1 (`TASK_930_KEYS` is empty); archived with the task.
