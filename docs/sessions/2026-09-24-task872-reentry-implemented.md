# Session: Task 872 — re-entry at §17, implementation — 2026-09-24

Continues `docs/sessions/2026-09-24-task872-premise-drift-blocked.md` (the I0 `PREMISE DRIFT` stop). This session
executes the kickoff's Amendment 2 (`tasks/Sprints/Sprint_81_kickoff_prompt_Task_872_Sign_Out_Stays_On_Public_Pages.md`
§17), re-entering at §17.4. Evidence root: `docs/sessions/evidence/task872/` (files `06`–`30`; `01`–`05` are the
prior session's, kept unmodified).

## Precondition and re-entry checks

- **§17.4 step 1.** `git show HEAD:tasks/Sprints/Sprint_81_kickoff_prompt_Task_872_Sign_Out_Stays_On_Public_Pages.md`
  contains `## 17. Amendment 2` (`06-reentry-head.txt`) — precondition satisfied, not `BLOCKED`.
- **§17.4 step 3.** Re-ran the Header census (`08-census-reentry.txt`): same 5 tier-1 + 1 tier-2 FAIL set as
  `03-census-I0.txt` (§16.1). No `PREMISE DRIFT`.
- **§17.4 step 4.** Re-ran the F3 grep (`09-f3-grep-reentry.txt`): same 4 pages
  (`cabinet`, `favorites`, `listings/create`, `listings/[slug]/edit`). No `PREMISE DRIFT`.
- **§17.4 step 5 / F7.** Started Storybook (`npm run storybook`), opened
  `patterns-mantine-authsheet--register` with Playwright, and inspected the rendered DOM: a real
  `https://challenges.cloudflare.com/turnstile/v0/api.js` script tag and a `cf-chl-widget-*` Turnstile response
  input are present (`.env.local` supplies a real `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). **F7 resolved: the Turnstile
  widget branch renders, not `CaptchaDevFallback`.** The dev server was stopped after this check
  (`taskkill /PID 22148 /T /F`) before the build steps.

## Implementation (R1–R5)

- **R1.** `src/lib/auth/postSignOut.ts` (new) — pure helper, no React/Next/`window` import. Exports
  `SESSION_REQUIRED_ROUTE_PATTERNS` (the 4 F3 patterns) and `resolvePostSignOutPath(pathname, locale)` per the
  kickoff's exact contract (strip locale prefix from `routing.locales`, drop one trailing `/`, match `[param]`
  segments).
- **R2.** `src/components/layout/Header.tsx` — added `usePathname()` (`next/navigation`), imported
  `resolvePostSignOutPath`, and changed `handleLogout`'s callback to branch on the resolved target
  (`router.push(target)` or `router.refresh()`). Diff contains exactly these changes (`git diff` inspected,
  reproduced below).
- **R3.** `src/lib/auth/__tests__/postSignOut.test.ts` (new) — (a) classification table: 4 session-required routes
  × 4 locales (including a real slug `/en/listings/abc-123/edit`), the 5 listed public paths, and the 3 safe-fallback
  cases (`null`, `''`, `/listings`). (b) drift test: recursively walks `src/app/[locale]/**/page.tsx` from
  `process.cwd()` with Node `fs`, detects `redirect(` \`...auth/login?next=...\` guards, derives each page's route
  pattern from its path, and asserts the guarded set equals `SESSION_REQUIRED_ROUTE_PATTERNS`.
- **R4.** `package.json` → `test:auth` now also runs `postSignOut.test.ts`.
  `docs/critical-flow-registry.md` → the "Logout" row's happy path, required test and command now name the new
  file and behaviour (only those three cells changed, per R4).
- **R5.** `src/stories/patterns/mantine/AuthSheet.stories.tsx` gained one export, `Captcha`, importing
  `CaptchaWidget` by name from `@/components/auth/CaptchaWidget` and rendering it standalone inside the file's
  existing `MantineStoryShell`, with no-op `onSuccess`/`onError`/`onExpire`. `CaptchaWidget.tsx` itself is
  unchanged. `scripts/mantine-migration-scope.json` gained 3 entries: `CaptchaWidget.tsx`, `LocaleSwitcher.tsx`,
  `PhoneField.tsx` (§16.2).

## §17.2 — baseline regeneration (exact removal set)

Run **after** the `Header.tsx` edit and the 3 manifest entries (as required — the census updater only re-censuses
surfaces the diff maps to):

```
$base = git rev-parse HEAD   # 472e41977b4ff48f8a26aecd62d6f1c02caa8a27
npm run check:rendered-scope:update-baseline
node scripts/check-surface-census-changed.mjs --base $base --update-baseline
```

- `scripts/rendered-scope-baseline.json`: exactly 3 edges removed — `HeaderView.tsx -> LocaleSwitcher.tsx`,
  `AuthSheet.tsx -> CaptchaWidget.tsx`, `AuthSheet.tsx -> PhoneField.tsx` (26 → 23 baselined edges).
- `scripts/surface-census-baseline.json`: exactly 3 keys removed, all under `src/app/[locale]/layout.tsx ::` for
  `CaptchaWidget.tsx`, `LocaleSwitcher.tsx`, `PhoneField.tsx` (484 → 481 entries).
- No other key added or removed in either file (`23-baseline-diff.txt` — verified by direct inspection: exactly
  the 3+3 removal blocks, nothing else).

**Carried by design (F9/§17.2) — not retired here, never hand-edited:**
- `src/modules/auth/components/AuthSheet.tsx :: CaptchaWidget.tsx` and `:: PhoneField.tsx`
- `src/components/layout/HeaderView.tsx :: LocaleSwitcher.tsx`
- `src/app/admin/layout.tsx :: LocaleSwitcher.tsx`
- `PhoneField.tsx` under `src/app/[locale]/cabinet/page.tsx`, `src/app/admin/users/[id]/page.tsx`,
  `src/app/admin/users/new/page.tsx`, `src/components/admin/AdminUserCreate.tsx`

`GR-2 SCOPE STATED — check:surface-census:changed inspects only the surfaces the diff maps to (here
src/app/[locale]/layout.tsx); it cannot see the surfaces of the 8 carried rows, so it neither confirms nor retires
them; the three enrolments are closed by check:story-coverage (manifest entry + own Story each) and the Header
census (AC7b).`

## AC3 plant (`plant.txt`)

Pre-plant hash of `postSignOut.ts`: `b396685a918ca0dfd3d8a3c6c7708040cfbe5aac`. Removed `'/favorites'` from
`SESSION_REQUIRED_ROUTE_PATTERNS`. Re-ran the drift test: **FAILED**, `AssertionError: ... extra: [/favorites]`
(exit 1) — correctly names `/favorites`. Restored via the Edit tool. Post-restore hash: same
`b396685a918ca0dfd3d8a3c6c7708040cfbe5aac` — **MATCH, restoration verified**. `git status --porcelain` for the file
shows only `??` (new, untracked), no stray modification. Full test file re-run after restore: 25/25 pass.

## AC5 — manual sign-out observation

**MISSING EVIDENCE**, deferred to owner step O81-1 (`docs/sessions/evidence/task872/30-manual-signout.md`). No
test-account credentials are available to this executor session and the executor is not authorized to create or
sign in with a real account against the connected Supabase environment. Indirect evidence (the classification-table
tests exercising the exact routes O81-1 will check, and the `Header.tsx` diff) is recorded in that file.

## §17.4 gate block — every command and exit code

| # | Command | File | Exit |
|---|---|---|---|
| 10 | `node -p "process.platform + ' ' + process.version"` | `10-platform.txt` | 0 (`win32 v22.22.3`) |
| 11 | `npx vitest run postSignOut.test.ts` | `11-postSignOut-test.txt` | 0 (25/25 pass) |
| 12 | `npm run test:auth` | `12-test-auth.txt` | 0 (7 files, 53/53 pass) |
| 13 | `npm run typecheck` | `13-typecheck.txt` | 0 |
| 14 | `npm run lint` | `14-lint.txt` | 0 (0 errors, 81 pre-existing warnings, none in touched files) |
| 15 | `npm run check:story-coverage` | `15-story-coverage.txt` | 0 (98/98 covered) |
| 16 | `check-surface-census.mjs --surface Header.tsx` | `16-census-header.txt` | 1 (FAILs: `Header.tsx`, `NotificationBell.tsx`, `PasswordRequirementsHint.tsx` only — matches §16.4) |
| 17 | `npm run check:rendered-scope` | `17-rendered-scope.txt` | 0 (0 new, 0 stale) |
| 18 | `npm run check:rendered-scope:verify` | `18-rendered-scope-verify.txt` | 0 (5/5 arms pass) |
| 19 | `check-surface-census-changed.mjs --base $base` | `19-census-changed.txt` | 0 |
| 20 | `npm run check:surface-census:changed:verify` | `20-census-changed-verify.txt` | 0 (12/12 arms pass) |
| 21 | `npm run check:enrolled-tailwind` | `21-enrolled-tailwind.txt` | 0 |
| 22 | `npm run check:enrolled-tailwind:verify` | `22-enrolled-tailwind-verify.txt` | 0 (10/10 arms pass) |
| 23 | `git diff -- <2 baselines>` | `23-baseline-diff.txt` | — (exactly the §17.2 removals) |
| 24 | `npm run build-storybook` | `24-build-storybook.txt` | 0 |
| 25 | `npm run check:file-integrity` | `25-file-integrity.txt` | 0 (after removing an unrelated `.playwright-mcp/` scratch artifact from this session's F7 inspection — see below) |
| 26 | `npm run check:mojibake` | `26-mojibake.txt` | 0 (0 artifacts / 6456 files) |
| 27 | `npm run build` | `27-build.txt` | 0 |
| 28 | `git hash-object <9 changed paths>` | `28-hash-object.txt` | 0 |
| 29 | `git status --porcelain` | `29-status-after.txt` | — (§7 scope + the 2 pre-existing unrelated modified files already present in `07-status-before-reentry.txt`) |

**Deviation note (step 25):** the first `check:file-integrity` run failed on `.playwright-mcp/console-*.log`, a
scratch artifact this session's own Playwright inspection (F7) created outside any task path. Deleted (it was
untracked, not a deliverable, not in §7 scope); the check then passed clean on 31 files. No task-owned file was
affected.

## GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: CaptchaWidget story export; semantic queries: CaptchaWidget, captcha,
Turnstile, turnstile; inspected candidates: src/stories/patterns/mantine/AuthSheet.stories.tsx
(patterns-mantine-authsheet--register, --register-agent, --forgot-password render CaptchaWidget through AuthSheet);
decision: EXTEND; selected canonical owner: src/stories/patterns/mantine/AuthSheet.stories.tsx; Mantine/TailAdmin
token path: NONE (no new visual value); new hardcoded visual values: NONE; rationale: the component already renders
inside this canonical page; GR-3 needs a by-name import, GR-3a forbids a parallel page.`

`GR-3a STORY PREFLIGHT — CaptchaWidget × standalone; canonical candidates: patterns-mantine-authsheet--register,
--register-agent, --forgot-password (each renders CaptchaWidget through AuthSheet, not standalone); direct-import
evidence: NONE (no story imports CaptchaWidget directly before this task); toolbar coverage: locale=toolbar-driven,
viewport=toolbar-driven; decision: EXTEND; target: Patterns/Mantine/AuthSheet; rationale: extend the existing
canonical page file with a new export rather than create a new Story file/title.`

`GR-1 CENSUS COMPLETE — 21 nodes; tier1 3 migrated+enrolled+story (CaptchaWidget, LocaleSwitcher, PhoneField) + 2
container-exempt (Header, NotificationBell — D81-2); tier2 0 imports removed (PasswordRequirementsHint → 873);
tier3 0.`

`GR-4 AC AUDIT — AC1–AC8 (per §17.3's AC7a/AC7b replacement of AC7/AC8); each states an observable property; the
"exactly 3 + 3" set is measured (F9, F12) and has a stop branch if the regenerated set differs; absolutes: none.`

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 [R1, R3a] | `postSignOut.test.ts` classification describe blocks; `11-postSignOut-test.txt` | ✅ 25/25 |
| AC2 [R2] | `git diff src/components/layout/Header.tsx` — only `usePathname` import/read, `resolvePostSignOutPath` import, `handleLogout` body | ✅ |
| AC3 [R3b] | `plant.txt` — plant FAILs naming `/favorites`; restore hash matches | ✅ |
| AC4 [R4] | `12-test-auth.txt` exit 0; registry "Logout" row names the file (`docs/critical-flow-registry.md` diff) | ✅ |
| AC5 [R2, Assumption 1] | `30-manual-signout.md` | MISSING EVIDENCE — deferred to O81-1 per kickoff's own fallback |
| AC6 [R5] | `AuthSheet.stories.tsx` diff (import + `Captcha` export); manifest entry; `15-story-coverage.txt` exit 0; `16-census-header.txt` FAILs only `Header.tsx`/`NotificationBell.tsx`/`PasswordRequirementsHint.tsx` | ✅ |
| AC7a [R6] | `23-baseline-diff.txt` — exactly the 3+3 removals, no added key | ✅ |
| AC7b [R5, R6] | `17`–`22` all exit 0; `16` exits 1 with exactly the §16.4 FAIL lines | ✅ |
| AC8 [all] | `13` typecheck=0, `14` lint=0, `24` build-storybook=0, `25` file-integrity=0, `26` mojibake=0, `27` build=0; `29-status-after.txt` lists no path outside §7 beyond the 2 pre-existing files in `07-status-before-reentry.txt` | ✅ |

Self-validation: tsc=0 errors · build=passes · AC table=all green except AC5=MISSING EVIDENCE (sanctioned fallback)
· scope=clean (§7, verified against `29-status-after.txt`) · integrity=PASS (pass 2 below, reconciled)

## Counting gates — pass 2 (genuinely last, reconciled to `git status`)

Per `docs/ai-behavior.md` Note 18 step 5a: re-ran both gates after every artifact (implementation files,
`docs/backlog.md`, this session log, evidence files) existed and the path set was final.

- `check:file-integrity` final run (`i-final-file-integrity.txt`): **42 file(s) checked, all clean** —
  matches `git status --porcelain | wc -l` = **42** exactly. (An intermediate 41/41 reconciliation was
  superseded after §17.5's own instruction to amend the I0 session log's Files Changed table with
  `05-status-final.txt`, which added one more tracked-modified path; re-ran both gates once more to
  reconcile against the new final path set.)
- `check:mojibake` final run (`i-final-mojibake.txt`): **0 artifacts in 6464 files** (full-tree scan, not
  git-status-scoped — different semantics from the count above, not expected to match it 1:1).

## Files Changed

| File | Rationale |
|---|---|
| `src/lib/auth/postSignOut.ts` | new — R1, the pure post-sign-out routing helper |
| `src/lib/auth/__tests__/postSignOut.test.ts` | new — R3, classification table + drift test |
| `src/components/layout/Header.tsx` | R2 — `handleLogout` now resolves the post-sign-out destination |
| `src/stories/patterns/mantine/AuthSheet.stories.tsx` | R5 — new standalone `Captcha` story export |
| `scripts/mantine-migration-scope.json` | R5/§16.2 — 3 new enrolments (`CaptchaWidget`, `LocaleSwitcher`, `PhoneField`) |
| `scripts/rendered-scope-baseline.json` | §17.2 — regenerated, exactly 3 edges removed |
| `scripts/surface-census-baseline.json` | §17.2 — regenerated, exactly 3 keys removed |
| `package.json` | R4 — `test:auth` now also runs `postSignOut.test.ts` |
| `docs/critical-flow-registry.md` | R4 — "Logout" row's happy path/test/command name the new behaviour |
| `docs/backlog.md` | the 872 row's state cell only |
| `docs/sessions/2026-09-24-task872-premise-drift-blocked.md` | §17.5 — added `05-status-final.txt` to the I0 session log's evidence list and Files Changed row |
| `docs/sessions/evidence/task872/06`–`30`, `plant.txt`, `i-final-*.txt` | this re-entry's evidence |
| `docs/sessions/2026-09-24-task872-reentry-implemented.md` | this session log |

## Deviations and limitations

- AC5 is `MISSING EVIDENCE` (no test-account access) — sanctioned by the kickoff's own §13.2/§17.4 fallback,
  deferred to O81-1.
- A `.playwright-mcp/` scratch directory from this session's own F7 inspection tripped `check:file-integrity` once;
  removed (untracked, no task-owned content) and the gate re-run clean.
- Everything else in §17 completed as specified; no other deviation.

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. Never self-approved.
