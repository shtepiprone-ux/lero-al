# Task 875 — the Turnstile captcha follows the app locale: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW

Kickoff: `tasks/Sprints/Sprint_81_kickoff_prompt_Task_875_Turnstile_Follows_App_Locale.md`

`GR-0 CANONICAL REUSE PREFLIGHT — request: Turnstile widget language follows the app locale; semantic queries: language, locale, useLocale, Turnstile, captcha; inspected candidates: @marsidev/react-turnstile options.language (native, verified in node_modules/@marsidev/react-turnstile/dist/index.js: language: d.language || 'auto'), CaptchaWidget.tsx, AuthSheet.stories.tsx Captcha export; decision: REUSE (the library's native options.language); selected canonical owner: src/components/auth/CaptchaWidget.tsx; Mantine/TailAdmin token path: NONE (no visual value; the widget is a Cloudflare iframe); new hardcoded visual values: NONE; rationale: the library already exposes the option, only the value was missing.`

`GR-3a STORY PREFLIGHT — CaptchaWidget × app-locale language; canonical candidates: Patterns/Mantine/AuthSheet → Captcha (verified at src/stories/patterns/mantine/AuthSheet.stories.tsx:134-140, direct import of the real CaptchaWidget); direct-import evidence: src/stories/patterns/mantine/AuthSheet.stories.tsx:5; toolbar coverage: locale=NextIntlClientProvider from globals.locale (.storybook/preview.tsx:105-111), viewport=toolbar; decision: REUSE; target: Patterns/Mantine/AuthSheet → Captcha; rationale: the export renders the real widget, the new state is only the toolbar locale.`

`GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story (CaptchaWidget, unchanged enrolment); tier2 0 imports removed; tier3 0.`

## I0 — no drift

| Check | Kickoff §10.1 expectation | This session | Result |
|---|---|---|---|
| `00-node-platform.txt` | `win32` | `win32 v22.22.3` | match |
| `02-census-I0.txt` | 1 node, `GR-1 CENSUS COMPLETE`, exit 0 | identical to F6 | match |
| F1/F2 re-read | `CaptchaWidget.tsx:62-73` no `language`; library `language: d.language \|\| 'auto'`; `TurnstileLangCode` has en/it/uk, no sq | confirmed by direct read of both files | match |

Pre-existing dirty tree (unrelated to this task, unchanged throughout): `docs/sessions/evidence/task861/storybook-dev.log`, `scripts/schema-drift-check.sql` (recorded in `01-status-before.txt`).

No `PREMISE DRIFT`. Proceeded to implementation.

## Requirement and acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R1 | Confirmed | `git diff` of `CaptchaWidget.tsx` (below) — `useLocale` import, `TurnstileLangCode` type import, `TURNSTILE_LANGUAGE_BY_LOCALE` constant (en/it/uk only), `language` computed with `?? 'auto'` fallback, `language` added inside `options`, short comment citing F3/D81-6. Nothing else changed. |
| R2 | Confirmed | New file `src/components/auth/__tests__/CaptchaWidget.language.test.tsx` — `it.each` over the four locales asserting the full `options` object, plus the dev-fallback case. `11-new-test.txt`: 5/5 pass. Plants P1/P2 below. |
| R3 | Confirmed | `29-status-after.txt` does not list `AuthSheet.stories.tsx` — no Story change. `check:story-coverage` and `build-storybook` both exit 0. |
| AC1 | Confirmed | Diff of `CaptchaWidget.tsx` adds exactly the five named elements (import, type import, constant, `language` key, comment); no other line changes (`git diff`, full hunk reproduced below). |
| AC2 | Confirmed | `11-new-test.txt`: 5/5 pass. `plant-p1-run.txt`: `EXIT_CODE=1`, all four locale cases fail (fallback case passes). `plant-p2-run.txt`: `EXIT_CODE=1`, only `sq` fails. Post-restore hashes (`plant-p1-post-hash.txt` = `plant-p2-post-hash.txt` = `5b4c223101153fac9a63470fabbc83ac54bf64b0`) equal the pre-plant hash and the `28-hash-object.txt` `CaptchaWidget.tsx` line. |
| AC3 | Confirmed | `12-test-auth.txt`: 9 files, 71 tests, exit 0. |
| AC4 | Confirmed | `29-status-after.txt` lists no `AuthSheet.stories.tsx` entry (tracked, clean at I0, so absence means unchanged). `15-story-coverage.txt` and `24-build-storybook.txt` both exit 0. |
| AC5 | Confirmed | `13-typecheck.txt`, `14-lint.txt` (0 errors), `17`/`18-rendered-scope*.txt`, `03-census-changed.txt` + `20-*-verify.txt`, `25-file-integrity.txt`, `26-mojibake.txt`, `27-build.txt` all exit 0. `03-census-changed.txt` maps only `src/components/auth/CaptchaWidget.tsx`, 0 new / 0 stale. `29-status-after.txt` lists no path outside §7 beyond the two pre-existing `01-status-before.txt` entries. |
| AC6 | `MISSING EVIDENCE` (owed by the owner, O81-6) | Storybook matrix in kickoff §13.3 — not an executor gate. |
| AC7 | Not yet applicable | Owed after deploy (O81-7). |

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none. AC1's "nothing else" names a fixed change set; AC5's "0 new / 0 stale" is measured (F7, confirmed live in 03-census-changed.txt).`

## Current versus required behavior

Matches §9 of the kickoff exactly:

| | Current (pre-875) | Required | Verified by |
|---|---|---|---|
| Captcha on `/en`, `/it`, `/uk` | browser language (`auto`) | `en`, `it`, `uk` | T1 `it.each` cases |
| Captcha on `/sq` | browser language (`auto`) | unchanged: `auto` (D81-6) | T1 `sq` case; plant P2 proves the mapping is intentional, not accidental |
| No `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | dev fallback note + `onSuccess('dev-noop-token')` | unchanged | T1 fallback case |
| Token callbacks, `reset()` handle, `aria-label`, full width | as today | unchanged | AC1 diff scope; T1 asserts `theme`/`size` unchanged within the same `options` object |
| Signup and password-recovery submission | token verified on the server | unchanged | `test:auth` (71/71 pass); `captcha.ts` untouched (`git status` confirms) |

Negative-flow applicability table (§11): unchanged from the kickoff — no branch added or removed. All five rows (sq, missing site key, locale switch while mounted, unsupported code, server verification failure) match their stated evidence.

## Files Changed

| File | Reason |
|---|---|
| `src/components/auth/CaptchaWidget.tsx` | R1 — `useLocale`, locale→Turnstile-code constant, `language` passed inside `options` |
| `src/components/auth/__tests__/CaptchaWidget.language.test.tsx` *(new)* | R2 — T1, the observable-assertion test |
| `docs/sessions/2026-09-24-task875-implemented.md` *(new)* | this session log |
| `docs/sessions/evidence/task875/**` *(new)* | full gate/plant evidence |
| `docs/backlog.md` | 875 state cell updated |

## Validation evidence

QA profile: **Q2** (existing surface, third-party iframe language only).

| Command | File | Exit |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | `00-node-platform.txt` | `win32 v22.22.3` |
| `node scripts/check-surface-census.mjs --surface .../CaptchaWidget.tsx` (I0) | `02-census-I0.txt` | 0 |
| `npx vitest run .../CaptchaWidget.language.test.tsx` | `11-new-test.txt` | 0 (5/5 pass) |
| `npm run test:auth` | `12-test-auth.txt` | 0 (9 files, 71 tests) |
| `npm run typecheck` | `13-typecheck.txt` | 0 |
| `npm run lint` | `14-lint.txt` | 0 (0 errors, pre-existing repo warnings only + 1 new stylistic warning, `_ref` unused param in the test's mock) |
| `npm run check:story-coverage` | `15-story-coverage.txt` | 0 |
| `node scripts/check-surface-census.mjs --surface .../CaptchaWidget.tsx` (post) | `16-census-captcha.txt` | 0 — unchanged: 1 node, tier1, className:0 |
| `npm run check:rendered-scope` | `17-rendered-scope.txt` | 0 (0 new edges) |
| `npm run check:rendered-scope:verify` | `18-rendered-scope-verify.txt` | 0 (5/5 arms) |
| `node scripts/check-surface-census-changed.mjs --base <HEAD>` | `03-census-changed.txt` | 0 — only `CaptchaWidget.tsx` mapped, 0 new, 0 stale |
| `npm run check:surface-census:changed:verify` | `20-census-changed-verify.txt` | 0 (12/12 arms) |
| `npm run build-storybook` | `24-build-storybook.txt` | 0 |
| `npm run check:file-integrity` | `25-file-integrity.txt` | 0 (31 files clean) |
| `npm run check:mojibake` | `26-mojibake.txt` | 0 (6604 files, 0 artifacts) |
| `npm run build` | `27-build.txt` | 0 (40/40 static pages) |
| `git hash-object` (final) | `28-hash-object.txt` | `CaptchaWidget.tsx`=`5b4c22310…`, new test=`d07b919aa…`, `AuthSheet.stories.tsx`=`96c734ae3…` |
| `git status --porcelain` (final) | `29-status-after.txt` | only §7 paths + the two pre-existing unrelated `M` entries |

**Plants** (Edit tool, pre/post `git hash-object` witnessed):
- P1 (remove `language` from `options`): `plant-p1-run.txt` — `EXIT_CODE=1`, all four locale cases fail, fallback case passes. Restore hash `5b4c22310…` = pre-plant hash = final hash.
- P2 (`sq → 'sq'`): `plant-p2-run.txt` — `EXIT_CODE=1`, only `sq` fails. Restore hash `5b4c22310…` = pre-plant hash = final hash.
- `11b-new-test.txt`: 5/5 pass after final restore.

One evidence-capture note: PowerShell's `Tee-Object`/`Out-File` write UTF-8 **with** BOM by default (per this environment's known PowerShell 5.1 behavior), which briefly made every evidence `.txt` file itself flag under `check:file-integrity`'s BOM check — never a source file. Stripped via Node `fs` (never via `Get-Content -Raw` without `-Encoding utf8`) before the final `check:file-integrity`/`check:mojibake` runs recorded above, which are clean.

## Visual source trace

Not applicable in the design-source-of-truth sense required for a chrome/token change: the only rendered artifact is a Cloudflare-hosted iframe whose text Cloudflare itself localizes server-side from the `language` parameter — there is no local visual value, className, or token to trace. The single prop passed (`options.language`) is fully traced in F1/F2/F3 (kickoff §3) and reconfirmed live in I0.

## Canonical UI decision record

| Changed visible artifact | Search evidence | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| Turnstile widget language | GR-0 preflight above | `@marsidev/react-turnstile`'s native `options.language` | REUSE | `CaptchaWidget.tsx` `options={{ theme, size: 'flexible', language }}` |
| Storybook proof | GR-3a preflight above | `Patterns/Mantine/AuthSheet` → `Captcha` (renders real `CaptchaWidget`) | REUSE, no change | `src/stories/patterns/mantine/AuthSheet.stories.tsx:134-140` |

## Implementation validation notes

No defects found during implementation. `matchMedia` had to be stubbed in the new test (Mantine's `MantineProvider` reads it on mount) — same house pattern already used in `header-hydration-id-parity.test.tsx`; not a kickoff gap, a standard jsdom test-environment requirement.

## Assumptions, deviations, and limitations

- No deviations from the kickoff. AC6 (owner Storybook matrix) and AC7 (post-deploy live check) are explicitly owner-owed per §12/§13.3 and are reported as outstanding, not implemented or assumed.
- The BOM-stripping step above is new evidence-hygiene detail not spelled out in the kickoff; it only affected this session's own evidence artifacts, never a source file, and is fully re-verified clean in the final gate run.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task875/`.
- Please independently inspect: the `CaptchaWidget.tsx` diff (AC1), the plant transcripts and hash witnesses (AC2), and `03-census-changed.txt` (AC5/F7).
- Outstanding, not blocking this handoff: AC6 (owner Storybook matrix, O81-6) and AC7 (post-deploy live check, O81-7), both explicitly owner-owed by the kickoff.

## Backlog update

`docs/backlog.md` line 41 (Sprints 80/81 combined row) updated: 875 marked `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, execution order note updated to reflect 875 done, 878 next. Physical backlog line count unchanged (single-line edit within the existing merged row) — no `BACKLOG LIMIT BREACH`.

## Orchestrator review

- **Review 1 (2026-09-24): `PARTIALLY VERIFIED`.** Reviewer-checked: the diff matches AC1 exactly. P1 failed 4 of 5 tests and P2 failed 1 of 5, both `EXIT_CODE=1`. The pre, post and final hashes are all `5b4c22310…` and match the file on disk. `AuthSheet.stories.tsx` equals its HEAD blob. The build (40/40) is current, and every gate exits 0. The only open item was AC6 (O81-6), which is owner-owed before approval.
- **Review 2 (2026-09-24): `APPROVED WITH NOTES`.** The owner accepted all 8 O81-6 tuples (*"Все ок"*). NOTE: the test mock adds one lint warning (`_ref` unused), and the platform file is `00-node-platform.txt` rather than the kickoff's `10-platform.txt`. Neither affects behaviour. AC7 / O81-7 is owed after deploy.
