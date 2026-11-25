# Task 1038 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md) · OWASP record: [Task_1038.json](../security/owasp/reviews/Task_1038.json)

Review 2 of Revision 1 step 1 (item R1-3 only) on b6de0f8ab, `ImageUpload.tsx` uncommitted — NEEDS REVISION (R1-1 and R1-2 of [Review 1](Task_1038_Review_1.md) are open; R1-3 is fixed)
Scope: `src/modules/listings/components/ImageUpload.tsx`, the one file the pre-commit hook refused (Review 1 "Order"); its whole diff against b6de0f8ab is the version Review 1 reviewed plus R1-3: `openFileChooser` (line 115), `triggerButton` without an argument and `onClick={disabled ? undefined : openFileChooser}` on both buttons (lines 150-160), `{canUploadMore && triggerButton()}` (line 246).
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45556120214 success; `npx eslint --no-warn-ignored --max-warnings 0` on `ImageUpload.tsx` → exit 0 and on the 29 code files of `git diff --name-only a44708037` → exit 0; `npm run typecheck` → exit 0; the seven test files that import `ImageUpload` → 144 passed, 42 failed (the two files of F2, 35 + 7, as in Review 1); V8 break below; Storybook measurement below.
Findings: Critical 0, High 0, Medium 0 new; Review 1 F3 fixed; Review 1 F1 and F2 open
Overall risk: unchanged from Review 1; the form now passes ESLint, so the file can be committed.

## Checklist V

- V1: as above; `main` green.
- V2: `git diff --stat b6de0f8ab` → `ImageUpload.tsx` only (95 insertions, 173 deletions); in the Scope; the R1-3 hunks are the three places above, the rest is Review 1's reviewed version.
- V3: every claim of the report reproduced: ESLint exit 0 on the file and on the 29 files, typecheck exit 0, the failing-first `react-hooks/refs` at 242:39 (V8). Tests found by import (`grep -rlE "components/ImageUpload|\bImageUpload\b" src --include=*.test.ts --include=*.test.tsx`, 7 files): `listingFormMantine.test.ts`, `ListingFormShell.submitError.test.tsx`, `ListingFormShellView.controls.test.tsx`, `ListingFormShellView.price.security.test.tsx`, `src/__tests__/eslintConfig.test.ts` green; `ImageUpload.test.tsx` and `ImageUpload.widgetOptions.test.tsx` fail as F2.
- V4: read the whole diff of `ImageUpload.tsx` once; R1-3 removes F3's cause: the ref is read only in `openFileChooser`, given directly to each `Button`'s `onClick`.
- V5: on `main` the helper got `openWidget` from the widget and was called without an argument while saving (`git show main:src/modules/listings/components/ImageUpload.tsx`, lines 221, 286, 321); now each button's `onClick` is `undefined` while saving and `openFileChooser` otherwise, the value the reviewed version passed through the argument; look, label, position and disabled state unchanged.
- V5a: Stories `Patterns/Mantine/ImageUpload` Empty, WithPhotos, SinglePhoto, LimitReached, Saving, Processing, Uploading, Failed, Partial, LimitWithPending at 320, 640, 1024, 1440 px (en): the trigger is 44px high, radius 8px, border 1px rgb(228, 231, 236), padding 0 16px 0 10.67px, 14px/500, rgb(52, 64, 84) on white, shadow rgba(16, 24, 40, 0.05) 0 1px 2px, widths 288, 592, 960, 1376; one click calls the file input's `click` once; Saving: border transparent, rgb(102, 112, 133) on rgb(228, 231, 236), disabled, a click calls nothing; LimitReached and LimitWithPending: no button, the limit text; no horizontal overflow in any of the 40 renders; console: only the Storybook `favicon.ico` 404. Equal to the executor's values before and after the change and to Review 1's "Add more" values. The listing form pages: BLOCKED — no app dev server on port 3000, and starting `next dev` rewrites `AGENTS.md` (`project-facts.md`, Local machine); carried to the next review, with Review 1's. Firefox: no Firefox in this session; the owner's look.
- V6: no `eslint-disable`, `skip`, `only`, `ts-expect-error` or `ts-ignore` added (grep of the added lines → 0).
- V7: below.
- V8: R1-3 undone once (the three places restored to Review 1's version) → ESLint "246:39 error Error: Cannot access refs during render" (and `openFileChooser` unused), exit 1; the file restored from its copy, md5 `c153b13a1fee11c98ee667940a00f998` before and after.
- V9: Stories for the owner: Empty, WithPhotos, SinglePhoto, LimitReached, Saving, Processing, Uploading, Failed, Partial, LimitWithPending (measurements in V5a).
- V10: `owasp.mjs review <kickoff> --base main`: the diff against `main` now holds the rule commit b6de0f8ab (`.claude/rules/`), which triggers AI_Agent_Security, LLM_Prompt_Injection_Prevention and MCP_Security; each is `not applicable` in the record with its reason.

## V7 — secure code review

Six steps on the R1-3 delta: no control weakened; no new entry point, outbound call, trust boundary or package; no test deleted.
- Authorization; authentication and sessions; requests and redirects; data exposure, errors, logging; files; dependencies and configuration: not touched by the delta (`git diff b6de0f8ab` changes only the trigger's click wiring in `ImageUpload.tsx`); Review 1's answers stand.
- Input and output: not touched; the file input and `chooseFiles` are unchanged.
- Next.js entry points: not touched; the file stays a client component.
- Business logic: not touched; the limit and `disabled` gate are unchanged (`ImageUpload.tsx:150-160`).
- JavaScript and TypeScript: touched — `ImageUpload.tsx:115`, the ref is read in an event handler only (React `useRef`: refs are not read during render).
- Agent and tool output: the report was rerun (V3), not taken as given.
- Tests: touched — R1-3 is held by the pre-commit and CI ESLint step (V8); the click and disabled assertions come with R1-2.

## Revision

No new item. Review 1 R1-1 (F1) and R1-2 (F2) are the next step, from the commit that holds this tree.
