# Task 1038 — Review 3

Kickoff: [Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md) · OWASP record: [Task_1038.json](../security/owasp/reviews/Task_1038.json)

Review 3 of Revision 1 step 2 with Revision 2 (R1-1, R1-2, R2-1 to R2-5) on b4760c9fd, uncommitted — NEEDS REVISION
Scope: `git diff --stat b4760c9fd`: `eslint.config.mjs`, `src/__tests__/eslintConfig.test.ts`, `ImageUpload.test.tsx`, `ImageUpload.widgetOptions.test.tsx`, `photoPipeline.test.ts`, `photoPipeline.ts`, new `public/vendor/browser-image-compression-2.0.2.js` and `.LICENSE.txt` — the files of [Review 2](Task_1038_Review_2.md) "Revision 2"; plus Opus's `.claude/rules/quality-gates.md` and the Review 2 file.
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45556120214 success; 9 test files found by import (`photoPipeline`, `ImageUpload`, `eslint.config`) → 270 passed; `node --test scripts/quality/agent-settings.test.mjs scripts/quality/change-report.test.mjs` → 18 passed; `npm run typecheck` → exit 0; `npx eslint --no-warn-ignored --max-warnings 0` on the 34 changed and new code files → exit 0; V8 breaks below; the app dev server started once for F4 (below), stopped, `AGENTS.md` md5 unchanged (`80cf6ec568cd49fcec38f52a7f0e039a`); Storybook Worker check below.
Findings: Critical 0, High 0, Medium 1 (F4), Low 1 (F5)
Overall risk: the pipeline, its tests and the vendored copy hold; on the real site the Worker script is redirected to a 404, so every photo would be compressed on the main thread without a word.

## Checklist V

- V1: as above; `main` green.
- V2: every changed file is in Review 2's "Revision 2" Files; `photoPipeline.test.ts:13` changes `const lib = vi.hoisted` to `const lib =vi.hoisted`, a hunk no item needs (F5).
- V3: every claim of the report reproduced: 110 + 160 tests, 18 `node --test` cases, typecheck, ESLint on 34 files, the breaks (V8). The report's warning about `src/proxy.ts` reproduced on the app (F4).
- V4: read `photoPipeline.ts`, `eslint.config.mjs`, `eslintConfig.test.ts` and the `photoPipeline.test.ts` diff, and both ImageUpload test files in full. Every grid, cover, order, delete and disabled assertion of `main` is kept; each widget assertion has its file-input counterpart; the widget's `language`/`text` options have none because the widget is gone. R2-1 to R2-4 remove F1's cause in the pipeline.
- V5: `photoPipeline.ts` keeps `useWebWorker: true`, the sizes and quality of AC1; no visible element changed in this step (`ImageUpload.tsx` unchanged since b4760c9fd).
- V5a: Storybook `Patterns/Mantine/ImageUpload` Empty, a 2400×1800 JPEG (161 601 bytes) put into the file input with `window.Worker` wrapped first (Chrome DevTools, the window's minimum width 500 px): 2 Workers, 2 result messages, 14 progress messages, 0 `error` events; `GET http://localhost:6006/vendor/browser-image-compression-2.0.2.js` 200 twice (from the blob Workers); 0 requests to `cdn.jsdelivr.net` or any other host; then `POST /api/listings/upload-url` 404 (Storybook has no route), the tile "failed". The executor measured the same at 320, 640, 1024, 1440 px; the trigger is unchanged since Review 2's V5a. The real app: F4. The listing form pages with a session: BLOCKED — no owner session in this session's browser. Firefox: the owner's look.
- V6: one ignore added, `"public/vendor/**"` (`eslint.config.mjs:141`): `eslintConfig.test.ts` proves it with planted paths through ESLint itself (`isPathIgnored`): `public/vendor/…` ignored, `public/other.js`, `public/vendorish/other.js` and `photoPipeline.ts` not; quality-gates.md §2 and §7 (third-party code, not authored; owner decision O1038-6).
- V7: below.
- V8: `libURL` back to `'/vendor/…'` → 2 failed ("both calls … carry libURL", "the WebP-then-JPEG second pass"); the ignore entry removed → 1 failed; both files restored, md5 `a7d6cfcef08bfce26ac72484df8f9a79` and `14b25bc470fee6ba9e75524015f7f382` before and after. The executor's other breaks (`useWebWorker: false`, a byte of each copy, the lockfile version, the banner, `public/**`) stand as reported.
- V9: no Story changed in this step; Review 2's list stands.
- V10: `owasp.mjs review <kickoff> --base main`: the diff (70 files) newly triggers XS_Leaks (the word `postMessage` in the vendored copy); `not applicable` written in the record with its reason → exit 0.

## V7 — secure code review

Six steps: no control weakened (the ESLint ignore covers third-party copies only, held by sha256 and lockfile tests); no new entry point; the Worker now loads a same-origin file instead of a third-party host; trust boundary browser → own origin; no new package; no test deleted.
- Authorization; authentication and sessions; input and output; business logic; data exposure, errors, logging; files: not touched (`git diff --name-only b4760c9fd` shows no file of them).
- Requests and redirects: touched — F4: the proxy redirects `/vendor/*` to `/sq/vendor/*`.
- Next.js entry points: touched — `src/proxy.ts:98-100`, the matcher (F4).
- JavaScript and TypeScript: touched — `photoPipeline.ts:44`, the address is built from `window.location.origin` with `new URL`, no host in the code.
- Dependencies and configuration: touched — the vendored copy, its licence and version held by `photoPipeline.test.ts` (R2-2, R2-3); `eslint.config.mjs` (V6).
- Agent and tool output: the report was rerun (V3); its proxy warning was checked on the app, not taken as given.
- Tests: touched — the breaks of V8.

## Findings

F4 — The site redirects the Worker script to a page that does not exist
Severity: Medium      Category: Requests and redirects      CWE: —
Location: src/proxy.ts:98-100
Description: the proxy matcher leaves out only images, `favicon.ico`, `robots.txt` and the sitemap files, so `/vendor/browser-image-compression-2.0.2.js` goes through next-intl, which adds the default language (the cause Task 964 fixed for `robots.txt`).
Impact: on every page the Worker's `importScripts` gets a 404 and the library compresses on the main thread without a word: AC1's Worker and owner decision O1038-6 ("the compression runs in the Worker and not silently on the main thread") do not hold on the site; Storybook does not show it because it serves `public/` without the proxy.
Reproduction: the app dev server on this tree: `curl -D - http://localhost:3000/vendor/browser-image-compression-2.0.2.js` → `307`, `location: /sq/vendor/browser-image-compression-2.0.2.js`; followed → `404`; the same for `…LICENSE.txt`; `/robots.txt` → `200`.
Recommendation: R3-1.
References: Task 964 (the proxy comment at `src/proxy.ts:91-96`); owner decision O1038-6.
Status: open

F5 — A whitespace change no item needs
Severity: Low      Category: Scope      CWE: —
Location: src/modules/listings/lib/__tests__/photoPipeline.test.ts:13
Description: `const lib = vi.hoisted(` became `const lib =vi.hoisted(`.
Impact: a hunk outside every revision item (A1).
Recommendation: R3-2.
Status: open

## Revision 3 (for the implementer)

Owner decision 2026-11-25 (translated): "Yes, add" `src/proxy.ts` and `src/lib/auth/__tests__/middlewareScope.security.test.ts` to the files of this revision.

- R3-1 (F4): `src/proxy.ts` `config.matcher` also leaves out the files directly under `/vendor/` whose name ends in `.js` or `.txt`, and nothing else; the comment above it names Task 1038 and the reason (the Worker script and its licence read no session, and a language prefix sent them to a 404). `middlewareScope.security.test.ts` gets a case in the form of Task 964 AC1: `/vendor/browser-image-compression-2.0.2.js` and `/vendor/browser-image-compression-2.0.2.LICENSE.txt` are left out; `/vendor`, `/vendor/`, `/vendor/a/b.js`, `/vendorx/a.js`, `/vendor/x.json`, `/sq/vendor/browser-image-compression-2.0.2.js`, `/sq/listings` and `/admin` are still matched (fails without the change, and with a wider exclusion such as `vendor`). On the app dev server: `curl -D -` of both files → 200, `content-type` JavaScript and text, no `location`.
- R3-2 (F5): `photoPipeline.test.ts:13` back to `const lib = vi.hoisted(`.
- Files: only `src/proxy.ts`, `src/lib/auth/__tests__/middlewareScope.security.test.ts` and `photoPipeline.test.ts`.
