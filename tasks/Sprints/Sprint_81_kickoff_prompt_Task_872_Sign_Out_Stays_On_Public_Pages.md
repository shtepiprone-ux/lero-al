# Task 872 — signing out from the header stays on a public page; the header's tier-1 nodes are proven

Sprint 81 · **P2** · QA profile **Q4** (Logout is a registered critical flow) · no dependencies · owner actions
**O81-1, O81-2** · **Status: 📝 KICKOFF FILED 2026-09-24 — READY FOR SONNET**

Sprint plan: [`Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md`](Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md)
(owner decisions **D81-1**, **D81-2** quoted verbatim there).

## 1. Mode and task type

`IMPLEMENTATION`, covering:
- client navigation logic in a container (`Header.tsx`, 0 `className`);
- a new pure helper plus tests;
- one Storybook **export** added to an existing canonical Story file;
- one manifest entry;
- two regenerated governance baselines.

**No visible chrome changes.** No JSX markup, `className`, style, token or locale key is added or changed in any
production component. Bundles: **Auth / Session** (`docs/state-authority.md`, `docs/app-lifecycle-contract.md`),
**Regression / Critical Flow Coverage**, **Storybook governance** (for the story export only).

## 2. Objective

1. A header sign-out, from the desktop `UserMenu` or the mobile `MobileNavDrawer`, **stays on the current URL** when
   that route is public, and re-renders it for a guest (`router.refresh()`). When the route needs a session, it goes
   to `/${locale}`, exactly as today.
2. "Needs a session" is decided by **one** helper, and a test binds that helper to the real guest guards in
   `src/app/[locale]/**/page.tsx`. A protected page added later without updating the helper fails the test.
3. GR-1 for the header tree, per **D81-2**:
   - `CaptchaWidget` gets its own story export and a manifest entry;
   - `Header` and `NotificationBell` are exempt as containers proven by their View Stories;
   - the tier-2 `PasswordRequirementsHint` edge is **873** and is not touched here.

## 3. Verified context — measured 2026-09-23/24 (re-measure at I0)

- **F1 (FACT).** `src/components/layout/Header.tsx:46-48` reads
  `function handleLogout() { signOut(() => router.push(\`/${locale}\`)) }`. It is passed as `onLogout` to
  `HeaderView` (`:59`), which forwards it to `UserMenu` (`HeaderView.tsx:176`, used at `UserMenu.tsx:33`) and to
  `MobileNavDrawer` (`HeaderView.tsx:204`). `MobileNavDrawer.tsx:35-38` calls `onLogout()` and then `onClose()`.
- **F2 (FACT).** `useUser().signOut(navigate?)` (`src/modules/auth/context/AuthContext.tsx:104-117`) runs
  `await controller.signOut()` and then `navigate?.()` inside one `startTransition`, so that the RSC fetch and the auth
  state update belong to the same transition. **Keep that shape:** the new navigation stays inside the callback.
- **F3 (FACT).** The routes that need a session are the four `[locale]` pages whose server component redirects a
  guest to `/${locale}/auth/login?next=…&session=lost`:
  - `cabinet/page.tsx:45`
  - `favorites/page.tsx:39`
  - `listings/create/page.tsx:20`
  - `listings/[slug]/edit/page.tsx:25`

  No shared list of protected routes exists. `src/middleware.ts` and `src/proxy.ts` only refresh the session and run
  i18n, and a search of `src/lib`, `src/modules/auth` and `src/components/layout` for a route list found none.
  Every other `[locale]` page renders for a guest: `/`, `/listings`, `/listings/[slug]`, `/contact`, `/[slug]`,
  `/auth/*` and `/ci/click-shield-modal`.
- **F4 (FACT).** `src/i18n/routing.ts` defines `locales: ['sq','en','uk','it']` with the default `always` prefix,
  so a `[locale]` pathname always starts with `/<locale>`.
- **F5 (FACT, census 2026-09-24).** `node.exe scripts\check-surface-census.mjs --surface src/components/layout/Header.tsx`
  found 21 nodes and exited 1 with three FAILs, `[tier1-unenrolled-or-unstoried]`, on:
  - `Header.tsx` (0 `className`, a container);
  - `NotificationBell.tsx` (0 `className`, a container over `useNotifications`, which uses Supabase);
  - `CaptchaWidget.tsx` (0 `className`).

  It also found one tier-2 node, `src/components/ui/PasswordRequirementsHint.tsx`, imported by `AuthSheet.tsx:17`.
  All four are baselined in `scripts/surface-census-baseline.json` under `src/app/[locale]/layout.tsx`, the surface
  that `map-changed-surfaces.mjs` climbs to from `Header.tsx`. `CaptchaWidget` has two census baseline keys (under
  `layout.tsx` and under `AuthSheet.tsx`) and one `scripts/rendered-scope-baseline.json` edge
  (`AuthSheet.tsx -> CaptchaWidget.tsx`).
- **F6 (FACT, Story search).**
  - Canonical Stories exist for `HeaderView` (`Mantine/Primitives/HeaderView`, guest and authenticated),
    `NotificationBellView` (`Mantine/Primitives/NotificationBellView`) and `AuthSheet`
    (`Patterns/Mantine/AuthSheet`). All three are in the manifest.
  - **No Story imports `Header`, `NotificationBell` or `CaptchaWidget` directly.** `CaptchaWidget` renders only
    inside `AuthSheet`'s register views (`AuthSheet.tsx:259`, `:742`).
- **F7 (UNKNOWN).** Which `CaptchaWidget` branch Storybook renders is unknown. The component reads
  `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY`. With no key, it renders the `CaptchaDevFallback` note
  (`auth.captcha_not_configured`). With a key, it renders the Cloudflare Turnstile widget. The new story renders
  whatever the existing `AuthSheet` register stories already render. The executor records which one it is (§10.1).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Objective 1–2, F3, F4 | `src/lib/auth/postSignOut.ts` (new, pure, no React). It exports `SESSION_REQUIRED_ROUTE_PATTERNS`, exactly the four App-Router patterns of F3 (`/cabinet`, `/favorites`, `/listings/create`, `/listings/[slug]/edit`). It exports `resolvePostSignOutPath(pathname: string \| null, locale: string): string \| null`. **Contract:** strip a leading `/<l>` where `l ∈ routing.locales` (imported from `@/i18n/routing`, never re-listed), ignore one trailing `/`, and match the rest exactly against the patterns, where `[param]` matches one non-empty segment. **Returns:** `null` (stay) for a public path; `` `/${locale}` `` for a session-required path, for a `null`/empty pathname, and for a pathname with no locale prefix (the safe fallback). | P0 | AC1 | Confirmed |
| **R2** | Objective 1, F1, F2 | `Header.tsx` reads `usePathname()` from `next/navigation`, and `handleLogout` becomes `signOut(() => { const target = resolvePostSignOutPath(pathname, locale); if (target) router.push(target); else router.refresh() })`. **Nothing else in `Header.tsx` changes**: no JSX, props, other handlers or imports beyond these two. | P0 | AC2, AC5 | Confirmed |
| **R3** | Objective 2 | `src/lib/auth/__tests__/postSignOut.test.ts` (new). **(a)** A classification table: every F3 route stays → home in all four locales, including a real slug for `/listings/abc-123/edit`. Every public route of F3 returns `null` (including `/en`, `/en/`, `/en/listings/abc-123`, `/en/privacy-policy`, `/en/auth/login`). `null`, `''` and `/listings` (no locale prefix) → `/<locale>`. **(b)** A **drift test**: read every `src/app/[locale]/**/page.tsx` with Node `fs`. A page is guarded when its source contains a `redirect(` whose target includes `/auth/login?next=`. Derive each page's route pattern from its path (drop `src/app/[locale]` and `/page.tsx`). Assert the set of guarded patterns **equals** the set in `SESSION_REQUIRED_ROUTE_PATTERNS`. The failure message names each missing or extra pattern. | P0 | AC1, AC3 | Confirmed |
| **R4** | Critical flow "Logout" | `package.json` → `test:auth` also runs `src/lib/auth/__tests__/postSignOut.test.ts`. `docs/critical-flow-registry.md` → the "Logout" row's happy path, required test and command name the new behaviour and the new file. No other row changes. | P0 | AC4 | Confirmed |
| **R5** | D81-2, GR-1, GR-3, GR-3a | `src/stories/patterns/mantine/AuthSheet.stories.tsx` gains **one** export, `Captcha`. It **imports `CaptchaWidget` by name** from `@/components/auth/CaptchaWidget` and renders it standalone inside the file's existing `MantineStoryShell`, with no-op `onSuccess`/`onError`/`onExpire`. No new Story file and no new title. `scripts/mantine-migration-scope.json` gains `"src/components/auth/CaptchaWidget.tsx"`. **No change to `CaptchaWidget.tsx` itself.** | P1 | AC6 | Confirmed |
| **R6** | Gates' own stale-entry rule, F5 | Enrolling `CaptchaWidget` makes its baseline entries stale. Regenerate `scripts/rendered-scope-baseline.json` with `npm run check:rendered-scope:update-baseline`, and `scripts/surface-census-baseline.json` with the `--update-baseline` form documented in `scripts/check-surface-census-changed.mjs`'s own usage header. Read that header first; do not guess the flags. Each baseline's `git diff` must be **exactly** the removal of the `CaptchaWidget` keys (2 census, 1 rendered-scope). Any other added or removed key is `SCOPE GUARD FAILED`: stop and report, do not commit a widened baseline. | P0 | AC7 | Confirmed |

## 5. Assumptions and open questions

1. **ASSUMED, measured at I0:** `router.refresh()` inside the sign-out transition re-renders a `ƒ` public page as a
   guest (for example, the listing owner card turns into the sign-in prompt, as in 870's O80-3). The executor proves
   it with the dev-server check in §13.2 step 3. If the page still shows the signed-in owner card after the refresh,
   stop and report `REFRESH DOES NOT RE-RENDER`. Do not add a hard reload.
2. **DECIDED:** Header and NotificationBell get no Story of their own (D81-2).
3. **DECIDED:** the tier-2 `PasswordRequirementsHint` edge is 873. This task neither moves nor edits it.
4. **Out of the report, and out of scope:** the other sign-out paths, which the owner did not report and which run on
   surfaces that need a session or on their own flows:
   - `AdminSidebar.tsx:92`
   - `ResetPasswordClient.tsx:93,108`
   - `CabinetPasswordSection.tsx:50`
   - `cabinet/actions/index.ts:566`

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0, GR-1 (**including the 2026-09-23 container addendum**), GR-2, GR-3, GR-3a, GR-4,
  GR-5, GR-6.
- `docs/agent-contract.md`: clauses 3, 5, 9, 10, 14, 15, 16b–16d.
- `docs/component-rules.md` → "Container / Presentational Primitive Split" and "Storybook-First Implementation".
- `docs/state-authority.md`, `docs/app-lifecycle-contract.md`: the sign-out and session sections.
- `docs/critical-flow-registry.md`: the "Logout" row.
- `docs/qa-profiles.md`: the Q4 row.
- `docs/storybook-governance.md`: only the sections on adding a story export and manifest enrolment.
- The sprint plan (D81-1, D81-2).

## 7. Scope

Files the executor may create or change:
- `src/lib/auth/postSignOut.ts` *(new)*
- `src/lib/auth/__tests__/postSignOut.test.ts` *(new)*
- `src/components/layout/Header.tsx`: R2 only
- `src/stories/patterns/mantine/AuthSheet.stories.tsx`: the `Captcha` export and its import only
- `scripts/mantine-migration-scope.json`: one entry
- `scripts/rendered-scope-baseline.json` and `scripts/surface-census-baseline.json`: regenerated per R6
- `package.json`: `test:auth` only
- `docs/critical-flow-registry.md`: the "Logout" row only
- `docs/sessions/2026-09-2?-task872-*.md` and `docs/sessions/evidence/task872/**`
- `docs/backlog.md`: the 872 row's state cell only

## 8. Out of scope

- Any file under `src/components/ui/`, including `PasswordRequirementsHint.tsx` (873).
- `HeaderView.tsx`, `UserMenu.tsx`, `MobileNavDrawer.tsx`, `NotificationBell*.tsx`, `CaptchaWidget.tsx`,
  `AuthSheet.tsx` and `AuthContext.tsx`: no edits.
- Every sign-out path in §5.4.
- Any locale key or message text.
- Any new Story file or title.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Sign out on `/<l>/listings/<slug>` | goes to `/<l>` | stays; re-rendered as a guest (sign-in prompt instead of the owner card) |
| Sign out on `/<l>`, `/<l>/listings`, `/<l>/contact`, `/<l>/<cms-slug>` | goes to `/<l>` | stays on the same URL (query string kept) |
| Sign out on `/<l>/cabinet`, `/<l>/favorites`, `/<l>/listings/create`, `/<l>/listings/<slug>/edit` | goes to `/<l>` | goes to `/<l>` (unchanged) |
| Sign out from the mobile drawer | drawer closes and page changes | drawer closes; public page stays |
| Session cleared, header shows guest | yes | yes (critical flow, unchanged) |
| `CaptchaWidget` Story / manifest | none | `Patterns/Mantine/AuthSheet` → `Captcha`; enrolled |

## 10. Implementation requirements

### 10.1 I0

1. Record `node.exe -p "process.platform + ' ' + process.version"`, which must print `win32`. Save
   `git --no-optional-locks status --porcelain`, and a `git hash-object` of every ` M` path, as `01-status-before.txt`.
2. Re-run the F5 census and save it. It must show the same three FAIL nodes. A different set means `PREMISE DRIFT`:
   stop.
3. Re-run the F3 grep: every `src/app/[locale]/**/page.tsx` containing `auth/login?next=`. It must return the same
   four pages. A different set means `PREMISE DRIFT`: stop.
4. Open Storybook (`Patterns/Mantine/AuthSheet` → `Register`) and record which `CaptchaWidget` branch renders:
   the fallback note, or the Turnstile widget (F7).

### 10.2 GR receipts the executor must emit before the related write

- **GR-0.** The receipt expected, per this design:
  `GR-0 CANONICAL REUSE PREFLIGHT — request: CaptchaWidget story export; semantic queries: CaptchaWidget, captcha,
  Turnstile, turnstile; inspected candidates: src/stories/patterns/mantine/AuthSheet.stories.tsx
  (patterns-mantine-authsheet--register, --register-agent render CaptchaWidget through AuthSheet); decision: EXTEND;
  selected canonical owner: src/stories/patterns/mantine/AuthSheet.stories.tsx; Mantine/TailAdmin token path: NONE
  (no new visual value); new hardcoded visual values: NONE; rationale: the component already renders inside this
  canonical page; GR-3 needs a by-name import, GR-3a forbids a parallel page.`
- **GR-3a.** Re-run the search before writing: CaptchaWidget × standalone; direct-import evidence NONE; decision
  EXTEND; target `Patterns/Mantine/AuthSheet`.
- **GR-1.** At the end: `GR-1 CENSUS COMPLETE — 21 nodes; tier1 1 migrated+enrolled+story (CaptchaWidget) + 2 exempt
  under D81-2 (Header, NotificationBell); tier2 0 imports removed (PasswordRequirementsHint → 873); tier3 0.`

### 10.3 Rules

- The helper is pure: no React, no Next import, no `window`. `Header.tsx` stays a container and adds no JSX.
- The drift test reads files with Node `fs` and UTF-8. It must not depend on the executor's working directory:
  resolve from the repository root through `process.cwd()`, the same way the other `__tests__` in `src/lib` do.
  Check one of them first.
- The story export passes no-op callbacks and no fixture data.
- UTF-8 without BOM everywhere. `check:file-integrity` and `check:mojibake` are in the gate.

## 11. Positive and negative flows

**Positive.** A signed-in user on `/en/listings/<slug>` signs out from the desktop menu. The URL stays the same, the
header shows the guest state, and the owner card becomes the sign-in prompt.

| Branch | Applicable | Source | Expected | Evidence |
|---|---:|---|---|---|
| Sign out on a session-required page | Yes | R1 | `/<l>` | AC1 table + §13.2 step 3 |
| Sign out from the mobile drawer | Yes | F1 | drawer closes; same routing as desktop | §13.2 step 3 (390px) |
| `usePathname()` returns `null` / empty | Yes | R1 | `/<l>` | AC1 |
| A protected page added later without the list | Yes | R3(b) | the drift test fails | AC3 plant |
| `controller.signOut()` throws | No — behaviour unchanged, the callback runs after it exactly as today | F2 | unchanged | — |
| Locale switch, validation, concurrency | No | not touched | — | — |

## 12. Acceptance criteria

- **AC1 [R1, R3a]** Given `postSignOut.test.ts`, when run, then every classification row passes. This includes the
  four session-required patterns in all four locales, the listed public paths, and the `null`, `''` and no-prefix
  fallbacks.
- **AC2 [R2]** Given `git diff src/components/layout/Header.tsx`, when read, then the only changes are the
  `usePathname` import and read, the `resolvePostSignOutPath` import, and the `handleLogout` body of R2.
- **AC3 [R3b]** The drift test passes on the real tree. **Plant:** with a `git hash-object` witness taken first,
  remove `'/favorites'` from `SESSION_REQUIRED_ROUTE_PATTERNS`. The drift test must fail, naming `/favorites`.
  Restore through Node `fs` or the Edit tool; the hash after restore must equal the hash before. Record everything in
  `plant.txt`.
- **AC4 [R4]** `npm.cmd run test:auth` runs the new file and exits 0. The registry "Logout" row names it.
- **AC5 [R2, Assumption 1]** On a local dev server, signing out on a listing page keeps the URL and shows the guest
  sign-in prompt. Signing out on `/favorites` lands on `/<l>`. Signing out from the mobile drawer at 390px closes it
  and keeps a public URL. Record each observation with the URL before and after (§13.2 step 3).
- **AC6 [R5]** `AuthSheet.stories.tsx` has an `import { CaptchaWidget } from '@/components/auth/CaptchaWidget'`
  line and a `Captcha` export. The manifest lists `src/components/auth/CaptchaWidget.tsx`. `npm.cmd run
  check:story-coverage` exits 0. After the change, the F5 census FAILs only `Header.tsx` and `NotificationBell.tsx`.
- **AC7 [R6]** Each regenerated baseline's `git diff` removes exactly the `CaptchaWidget` keys (2 + 1) and nothing
  else. `check:rendered-scope`, `check:rendered-scope:verify`, `check:surface-census:changed` and
  `check:surface-census:changed:verify` exit 0.
- **AC8 [all]** `typecheck`, `lint`, `build-storybook` and `npm run build` all exit 0, and so do `check:file-integrity`
  and `check:mojibake`. The final `git status` shows no path outside §7 beyond those in `01-status-before.txt`.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: none. AC7's "exactly" names a fixed key set measured at design time (F5), with a stop branch if the regenerated set differs.`

## 13. QA profile and verification plan

**Q4.** Logout is in `docs/critical-flow-registry.md`, so the regression suite, a changed-behaviour test, a planted
failure (AC3), rendered/manual evidence (AC5) and the build are required. The owner visual matrix covers the new
story export (O81-2).

### 13.1 Re-entry

From scratch. Evidence root: `docs/sessions/evidence/task872/`.

### 13.2 Gate block (executor, Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task872"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\02-platform.txt"
npx.cmd vitest run src/lib/auth/__tests__/postSignOut.test.ts *>&1 | Tee-Object "$ev\03-postSignOut-test.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\04-test-auth.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\05-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\06-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\07-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/components/layout/Header.tsx *>&1 | Tee-Object "$ev\08-census-header.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\09-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\10-rendered-scope-verify.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\11-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\12-census-changed-verify.txt"
git --no-optional-locks diff -- scripts/rendered-scope-baseline.json scripts/surface-census-baseline.json *>&1 | Tee-Object "$ev\13-baseline-diff.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\14-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\15-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\16-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\17-build.txt"
git --no-optional-locks hash-object src/lib/auth/postSignOut.ts src/lib/auth/__tests__/postSignOut.test.ts src/components/layout/Header.tsx src/stories/patterns/mantine/AuthSheet.stories.tsx scripts/mantine-migration-scope.json *>&1 | Tee-Object "$ev\18-hash-object.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\19-status-after.txt"
```

Expected results:
- `02` prints `win32`.
- `03` and `04` pass. `05`–`07` exit 0.
- `08` exits 1, with FAIL lines for `Header.tsx` and `NotificationBell.tsx` **only** (D81-2).
- `09`–`12` exit 0.
- `13` shows only the three `CaptchaWidget` key removals.
- `14`–`17` exit 0.

Record every exit code in the session log. Stop the dev server before running `build`.

**Step 3 (AC5), not a command:**
1. Run the app locally (`npm.cmd run dev`) and sign in with a test account.
2. Sign out on a listing page, on `/favorites`, and from the mobile drawer at a 390px viewport.
3. For each, record the URL before, the URL after, and what the page shows (text notes or screenshots in
   `$ev\20-manual-signout.md`).

If the local environment cannot sign in, record `MISSING EVIDENCE` and leave AC5 to O81-1.

### 13.3 Owner steps (after the approved review is deployed)

1. **O81-1.** On the live site: sign out on a listing page (it stays and shows the sign-in prompt), on `/favorites`
   or `/cabinet` (it goes to the homepage), and from the mobile menu (the drawer closes).
2. **O81-2. OWNER VISUAL QA REQUIRED:** Storybook `Patterns/Mantine/AuthSheet` → `Captcha` × locales `sq`, `en`,
   `uk`, `it` (toolbar) × viewports 320 and 1440 (toolbar) = 8 tuples. Record accepted or returned for each.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.
Report:
- changed files with their hashes (`18`);
- R1–R6 and AC1–AC8 status;
- every §13.2 command with its exit code;
- the I0 census and grep results;
- the Storybook branch observed (F7);
- the plant record (AC3);
- the manual observations (AC5) or `MISSING EVIDENCE`;
- the GR-0, GR-3a and GR-1 receipts;
- deviations and limitations.

Update the 872 backlog row's state cell. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — facts with file:line, decisions quoted in the sprint plan, and commands in §13.2 |
| Two-armed control | the drift test plant (AC3); the classification table covers both arms (stay / home) |
| Detector blind spot stated | The drift test sees only guards shaped `redirect(… /auth/login?next= …)` in `[locale]` `page.tsx`. A guard implemented another way (for example in a layout, or client-side) is invisible to it. Today none exists (F3). |
| GR-1 | census run at design time (F5); every node placed: 1 enrolled here, 2 exempt by D81-2, 1 tier-2 filed as 873 |
| Owner exceptions quoted | D81-1, D81-2 verbatim in the sprint plan and in GR-1 |
| Dirty worktree | I0 snapshot + hash witnesses; AC8 comparator |

## Appendix — rule-compliance ledger (condensed)

| Rule | Outcome | Result |
|---|---|---|
| GR-1 / 16d | all 21 nodes placed; no silent exclusion | COMPLIANT (D81-2 for the containers; 873 filed) |
| GR-3 | `CaptchaWidget` ← `AuthSheet.stories.tsx`, importing it by name | COMPLIANT |
| GR-3a | EXTEND, no parallel page | COMPLIANT |
| component-rules container split | no hook-mocking Story | COMPLIANT |
| agent-contract 15 (critical flow) | `test:auth` + a new test + the registry row | COMPLIANT |
| agent-contract 9 (build) | `17-build.txt` | COMPLIANT |
| agent-contract 14 (encoding, multi-file write) | the baselines are written by their own tools; diff limited by R6 | COMPLIANT |
