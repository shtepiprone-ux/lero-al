# Task 876 — sign-out is one visible step: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW

Kickoff: `tasks/Sprints/Sprint_81_kickoff_prompt_Task_876_Sign_Out_Is_One_Visible_Step.md` (executed from §16,
the amendment 1 re-entry, per the owner's explicit instruction after Opus's kickoff amendment).

`GR-0 CANONICAL REUSE PREFLIGHT — request: sign-out pending state on the UserMenu trigger and the mobile hamburger; semantic queries: loading, pending, Loader, isSigningOut, signing_out, spinner; inspected candidates: UserMenu.tsx trigger Button, HeaderView.tsx hamburger ActionIcon, Mantine Button/ActionIcon native loading prop; decision: REUSE (native Mantine loading prop on the existing controls); selected canonical owner: src/components/layout/UserMenu.tsx, src/components/layout/HeaderView.tsx; Mantine/TailAdmin token path: Mantine default Loader via the shared MantineProvider theme, no new value; new hardcoded visual values: NONE; rationale: both controls are already native Mantine controls with a built-in loading state.`

`GR-3a STORY PREFLIGHT — UserMenu × signing-out; canonical candidates: src/stories/mantine/primitives/UserMenu.stories.tsx (Mantine/Primitives/UserMenu, direct import of UserMenu); direct-import evidence: src/stories/mantine/primitives/UserMenu.stories.tsx:5; toolbar coverage: locale=storyT/context.globals.locale, viewport=Storybook toolbar; decision: EXTEND; target: Mantine/Primitives/UserMenu; rationale: canonical Story already directly imports the real production component — searched src/stories for SigningOut/isSigningOut/signing_out (0 hits) before writing.`

`GR-3a STORY PREFLIGHT — HeaderView × signing-out; canonical candidates: src/stories/mantine/primitives/HeaderView.stories.tsx (Mantine/Primitives/HeaderView, direct import of HeaderView); direct-import evidence: src/stories/mantine/primitives/HeaderView.stories.tsx:5; toolbar coverage: locale=storyT/context.globals.locale, viewport=Storybook toolbar; decision: EXTEND; target: Mantine/Primitives/HeaderView; rationale: same search, same result.`

`GR-3 STORY PROVEN — UserMenu ← src/stories/mantine/primitives/UserMenu.stories.tsx; HeaderView ← src/stories/mantine/primitives/HeaderView.stories.tsx`

`GR-1 CENSUS COMPLETE — 21 nodes; tier1 0 migrated+enrolled+story in this task (HeaderView, UserMenu already enrolled, extended) + 2 container-exempt (Header, NotificationBell — D81-2); AuthContext non-visual provider (D81-4, not a node of this surface); tier2 0 imports removed (none remain — PasswordRequirementsHint moved to design-system patterns and enrolled by 873); tier3 0.`

## I0 re-entry (§16.3) — no drift

| Check | Kickoff §16.1 expectation | This session | Result |
|---|---|---|---|
| `02b-census-I0.txt` | 21 nodes, exit 1, exactly the two F9′ FAIL lines (`Header.tsx`, `NotificationBell.tsx`) | identical | match |
| `02c-census-sim-I0.txt` | mapped surfaces `layout.tsx`/`HeaderView.tsx`/`UserMenu.tsx`; new blocks 0; baselined 8; 2 stale keys; updater removes 2 adds 0 | identical | match |
| `02d-baseline-keys-I0.txt` | exactly two matches, one per stale key | identical (lines 151, 991 of the pre-update baseline) | match |
| F2/F3/F5/F6 shape | unchanged since `b5074e624` | `git diff --stat b5074e624 HEAD` over the five cited files is empty | match, confirmed |

No `PREMISE DRIFT`. Proceeded to implementation.

## Requirement and acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R1 | Confirmed | `git diff` of `AuthContext.tsx` (below) — `useTransition` replaces the bare `startTransition` import; `signOut` re-wrapped with a re-entrant `startSignOutTransition`; `isSigningOut?: boolean` added to the interface, default context, and provider value; comment rewritten; JSX unchanged (`AuthContext.Provider` + `children` only) |
| R2 | Confirmed | `git diff` of `Header.tsx` — `heldUser`/`headerUser` adjust-state-while-rendering pattern; `isAuthenticated`/`user`/`notificationSlot` use `headerUser`; `HeaderView` gets `isSigningOut={!!isSigningOut}`; `handleLogout` and the 872 classifier call untouched |
| R3 | Confirmed | `git diff` of `HeaderView.tsx` — one new optional prop, forwarded to `UserMenu` as `isSigningOut` and to the hamburger `ActionIcon` as `loading` |
| R4 | Confirmed | `git diff` of `UserMenu.tsx` — one new optional prop, wired to the trigger `Button`'s `loading` |
| R5 | Confirmed | `UserMenu.stories.tsx` → new `SigningOut` export (regular-user fixture, `isSigningOut`, no `play`); `HeaderView.stories.tsx` → new `SigningOut` export (authenticated fixture, `isSigningOut`, same bell placeholder as `Default`) |
| R6 | Confirmed | T1 in `AuthContext.test.tsx` (new `describe('isSigningOut pending state')`); T2 `Header.signOut.test.tsx` (new file); `package.json` `test:auth` includes both; `docs/critical-flow-registry.md` Logout row names the pending/hold behaviour and both files |
| R7′ | Confirmed | `03a-census-update-baseline.txt` exit 0, "no tier-2 refusals"; `03-baseline-diff.txt` removes exactly the two F10′ keys (`layout.tsx :: ui/PasswordRequirementsHint.tsx`, `HeaderView.tsx :: LocaleSwitcher.tsx`), adds none; `rendered-scope-baseline.json` does not appear in the diff |
| AC1 | Confirmed | `AuthContext.tsx` diff matches all five bullets exactly (see below) |
| AC2 | Confirmed | T1 passes (18/18 in the two-file run); P1 (drop the inner `startSignOutTransition` wrapper) makes T1 fail on the "still true after coreSignOut resolves" assertion; restored, hash-witnessed byte-identical |
| AC3 | Confirmed | All 16 pre-existing `AuthContext.test.tsx` tests pass unchanged alongside the new T1 (17/17 in that file) |
| AC4 | Confirmed | Each of `Header.tsx`/`HeaderView.tsx`/`UserMenu.tsx` carries only its R2/R3/R4 change (diffs inspected, see below) |
| AC5 | Confirmed | T2 passes; P2 (pass `user` instead of `headerUser`) makes T2 fail on `getByText('Dritan Gjoka')`; restored, hash-witnessed byte-identical |
| AC6 | Confirmed | Both Story files carry one new `SigningOut` export each rendering the real component with `isSigningOut`; `check:story-coverage` exit 0; `build-storybook` exit 0 |
| AC7 | Confirmed | `npm run test:auth` — 9 files, 71 tests, exit 0, includes both new files; critical-flow-registry Logout row names them |
| AC8′ | Confirmed | `03-baseline-diff.txt` shows exactly the two F10′ keys removed, none added; `03a` reports no refused tier-2 block; `check:surface-census:changed` (`--base`) exit 0 with 0 new/0 stale; its `:verify` exit 0 (12/12 arms); `check:rendered-scope` exit 0 (0 new edges); its `:verify` exit 0 (5/5 arms) |
| AC9′ | Confirmed | `typecheck`/`lint`/`check:enrolled-tailwind`(`:verify`)/`check:file-integrity`/`check:mojibake`/`build` all exit 0; header census (`16`) exits 1 with exactly the two F9′ FAIL lines; final `git status --porcelain` (`29-status-after.txt`) lists no path outside §7 beyond `01b-status-before.txt`'s two pre-existing unrelated `M` paths |
| AC10 | `MISSING EVIDENCE` | Executor has no signed-in browser session — expected per the kickoff; O81-5 collects this at review |

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none. AC8′'s "exactly two keys" is measured (F10′, gate's own functions) with a stop branch and an I0 re-measure (§16.3 02c/02d).`

## Current versus required behavior

Matches §9 of the kickoff exactly; re-verified against the actual diff and T1/T2:

| | Current (pre-876) | Required | Verified by |
|---|---|---|---|
| Click "Logout" (desktop) | header flips to Login/Register at once | header keeps avatar+name, trigger shows a Mantine loader; header and page switch together | T2 (name shown + `data-loading` while pending, Login shown after) |
| Click "Logout" in the mobile drawer | drawer closes; header flips at once | drawer closes (unchanged — `MobileNavDrawer.tsx` untouched); hamburger shows a loader; header and page switch together | T2 asserts `data-loading` on the "Open menu" button; `MobileNavDrawer.logout()` unchanged |
| Route after sign-out | 872 classifier: public stays + refresh, guarded → `/<l>` | unchanged | T2: `refresh` called once, `push` not called, for `/en/listings/abc-123` |
| Second click during the wait | controller guard ignores it | trigger is `loading` (Mantine disables it); controller guard unchanged | Mantine's native `disabled: disabled \|\| loading` (verified in `Button.mjs`/`ActionIcon.mjs`); no new test (controller guard already covered by `AuthContext.test.tsx`'s existing "already signing out" path via `controller.signOut()`'s own guard) |
| `coreSignOut()` throws | ends unauthenticated | unchanged; header releases the hold when the transition ends | pre-existing test `:321-331` in `AuthContext.test.tsx`, unmodified and passing; `controller.signOut()`'s `try/catch` (unchanged, out of scope) still always resolves |
| Other `useAuth` consumers | see `user: null` at the click | unchanged | `isSigningOut` is optional; the eight AuthContext-mocking stories are untouched; `typecheck`/`build` exit 0 |
| Sign-out from `ProfileTab` (cabinet) | header flips at once | header holds and shows the loader too (same provider) | inherent in R2 (same `AuthProvider`/`Header` instance); not separately tested, matches kickoff §11 |

Negative-flow applicability table (§11): unchanged from the kickoff — no branch added or removed.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/auth/context/AuthContext.tsx` | R1 — `isSigningOut` via `useTransition`, re-entrant `signOut` |
| `src/components/layout/Header.tsx` | R2 — held-user pattern, `isSigningOut` passthrough |
| `src/components/layout/HeaderView.tsx` | R3 — `isSigningOut` prop, forwarded to `UserMenu` and the hamburger `loading` |
| `src/components/layout/UserMenu.tsx` | R4 — `isSigningOut` prop wired to the trigger `Button`'s `loading` |
| `src/stories/mantine/primitives/UserMenu.stories.tsx` | R5 — new `SigningOut` export |
| `src/stories/mantine/primitives/HeaderView.stories.tsx` | R5 — new `SigningOut` export |
| `src/modules/auth/__tests__/AuthContext.test.tsx` | R6 — T1 added (new `describe` block); all prior tests untouched |
| `src/components/layout/__tests__/Header.signOut.test.tsx` *(new)* | R6 — T2 |
| `package.json` | R6 — `test:auth` includes both new files |
| `docs/critical-flow-registry.md` | R6 — Logout row names the pending/hold behaviour and both files |
| `scripts/surface-census-baseline.json` | R7′ — regenerated, removes exactly the two F10′ keys |
| `docs/sessions/evidence/task876/01b-*, 02b-*, 02c-*, 02d-*, 03-*, 03a-*, 10-*, 11-*…29-*, plant.txt` | I0 re-entry and §13.2 gate-block evidence (this session) |
| `docs/sessions/evidence/task876/plant-p1-pre-hash.txt`, `plant-p1-run.txt`, `plant-p1-post-hash.txt` | review 1 §17.1 — kept P1 run transcript (was missing from `plant.txt`) |
| `docs/sessions/evidence/task876/plant-p2-pre-hash.txt`, `plant-p2-run.txt`, `plant-p2-post-hash.txt` | review 1 §17.1 — kept P2 run transcript (was missing from `plant.txt`) |
| `docs/sessions/evidence/task876/11b-new-tests.txt` | review 1 §17.1 — clean 18/18 re-run after both restores |
| `docs/sessions/evidence/task876/28b-hash-object.txt` | review 1 §17.1 — full 10-path hash-object, identical to `28-hash-object.txt` |
| `docs/sessions/2026-09-24-task876-implemented.md` | this session log (new; updated again for review 1 §17.1) |
| `docs/backlog.md` | 876 state cell → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (updated again for review 1 §17.1) |

No file outside this list or §7's scope was touched. The two pre-existing unrelated `M` paths
(`docs/sessions/evidence/task861/storybook-dev.log`, `scripts/schema-drift-check.sql`) are untouched by any
session on this task (present in `01-status-before.txt` before the block and `01b-status-before.txt` before this
re-entry, both hash-witnessed, unchanged in `29-status-after.txt`).

## Validation evidence (§13.2 gate block, run this session, in order)

| Step | Command | Result | Evidence |
|---|---|---|---|
| 03a | `check-surface-census-changed.mjs --base <HEAD> --update-baseline` | exit 0, "no tier-2 refusals" | `03a-census-update-baseline.txt` |
| 03 | `git diff -- surface-census-baseline.json rendered-scope-baseline.json` | exactly 2 keys removed, 0 added; rendered-scope file absent | `03-baseline-diff.txt` |
| 10 | platform | `win32 v22.22.3` | `10-platform.txt` |
| 11 | `vitest run` (T1 + T2 files only) | 2 files, 18 tests, **PASS**, exit 0 | `11-new-tests.txt` |
| 12 | `npm run test:auth` | 9 files, 71 tests, **PASS**, exit 0 | `12-test-auth.txt` |
| 13 | `npm run typecheck` | exit 0 | `13-typecheck.txt` |
| 14 | `npm run lint` | exit 0 (81 pre-existing warnings in unrelated files; none in any file this task touched) | `14-lint.txt` |
| 15 | `npm run check:story-coverage` | exit 0, 101/101 covered | `15-story-coverage.txt` |
| 16 | `check-surface-census.mjs --surface Header.tsx` | exit **1**, exactly the two F9′ FAIL lines (expected) | `16-census-header.txt` |
| 17 | `npm run check:rendered-scope` | exit 0, 0 new edges | `17-rendered-scope.txt` |
| 18 | `npm run check:rendered-scope:verify` | exit 0, 5/5 arms | `18-rendered-scope-verify.txt` |
| 19 | `check-surface-census-changed.mjs --base <HEAD>` | exit 0, 0 new, 0 stale | `19-census-changed.txt` |
| 20 | `npm run check:surface-census:changed:verify` | exit 0, 12/12 arms | `20-census-changed-verify.txt` |
| 21 | `npm run check:enrolled-tailwind` | exit 0 (2 pre-existing enrolled findings, both baselined, neither in a file this task touched) | `21-enrolled-tailwind.txt` |
| 22 | `npm run check:enrolled-tailwind:verify` | exit 0, 10/10 arms | `22-enrolled-tailwind-verify.txt` |
| 24 | `npm run build-storybook` | exit 0 | `24-build-storybook.txt` |
| 25 | `npm run check:file-integrity` | exit 0, 34 files clean | `25-file-integrity.txt` |
| 26 | `npm run check:mojibake` | exit 0, 0 artifacts in 6570 files | `26-mojibake.txt` |
| 27 | `npm run build` | exit 0 | `27-build.txt` |
| 28 | `git hash-object` (10 changed paths) | recorded | `28-hash-object.txt` |
| 29 | `git status --porcelain` | matches §7 scope + the two pre-existing unrelated paths | `29-status-after.txt` |

**Plant record** (`plant.txt`, both hash-witnessed pre-plant → post-restore):
- **P1** (`AuthContext.tsx`): removed the inner `startSignOutTransition(() => navigate?.())` re-entry wrapper.
  T1 failed on "isSigningOut is still true after coreSignOut resolves" (`false` received). Restored;
  `git hash-object` before plant = after restore = `60ff6ee00fdb03a99ba514c9c8281d5d61af1da1`.
- **P2** (`Header.tsx`): passed `user` instead of `headerUser` to `HeaderView`. T2 failed on
  `getByText('Dritan Gjoka')` (element removed from the DOM once `coreSignOut` committed `user: null`, well
  before the plant's target assertion should have still shown it). Restored; `git hash-object` before plant =
  after restore = `9ecbd53554cb0c53cf79ce9e849f9cee233583ac`.

Both files re-ran clean (18/18) after restoration, confirmed by the final `11-new-tests.txt` capture (run
after both plants were reverted).

### Plant record — re-run with kept output (review 1, §17.1)

Review 1 (`PARTIALLY VERIFIED`, kickoff §17) found `plant.txt` held only hash witnesses, no run output. Re-ran
both plants with the exact §17.1 procedure (pre-hash → Edit-tool plant → run, unpiped, real `$LASTEXITCODE` →
Edit-tool restore → post-hash), this time keeping each run's full transcript. No implementation file differs
from the reviewed diff — only evidence files were added.

- **P1** (`AuthContext.tsx`, `startSignOutTransition(() => { navigate?.() })` → `navigate?.()`):
  - pre-hash `plant-p1-pre-hash.txt` = `60ff6ee00fdb03a99ba514c9c8281d5d61af1da1` (matches the original).
  - `plant-p1-run.txt`: `npx vitest run AuthContext.test.tsx` → **1 failed, 16 passed**, `EXIT_CODE=1`. The one
    failure is the new T1 case, on `expect(screen.getByTestId('is-signing-out')).toHaveTextContent('true')`
    (received `'false'`) — exactly the "still true after coreSignOut resolves" assertion. Every pre-existing
    `AuthContext` test passes.
  - post-hash `plant-p1-post-hash.txt` = `60ff6ee00fdb03a99ba514c9c8281d5d61af1da1` — equals pre-hash.
- **P2** (`Header.tsx`, only `user={headerUser}` → `user={user}`; `isAuthenticated={!!headerUser}` left as-is,
  per §17.1's exact instruction — narrower than this session's original P2, which also touched
  `isAuthenticated`):
  - pre-hash `plant-p2-pre-hash.txt` = `9ecbd53554cb0c53cf79ce9e849f9cee233583ac` (matches the original).
  - `plant-p2-run.txt`: `npx vitest run Header.signOut.test.tsx` → **1 failed**, `EXIT_CODE=1`, failing at
    `expect(screen.getByText('Dritan Gjoka')).toBeInTheDocument()` (line 159) — the "while pending" name
    assertion, exactly as expected. (`isAuthenticated` staying `true` while `user` goes `null` still empties
    `HeaderView`'s `{user && (...)}` `UserMenu` block, so the name disappears from the DOM.)
  - post-hash `plant-p2-post-hash.txt` = `9ecbd53554cb0c53cf79ce9e849f9cee233583ac` — equals pre-hash.
- **11b** (`11b-new-tests.txt`, both files after both restores): **18/18 pass**, `EXIT_CODE=0`.
- **28b** (`28b-hash-object.txt`, all 10 changed paths): `diff 28-hash-object.txt 28b-hash-object.txt` —
  **identical**. The reviewed `27-build.txt` production build still describes the shipped bytes; not re-run.

All results matched §17.1's expectations exactly — no `BLOCKED` condition, no implementation change.

## Visual source trace

No new visual value, token, CSS rule, or `className` anywhere in this task (§8). Both changed states reuse the
native Mantine `loading` mechanism already built into the two touched controls.

| Visible artifact/state | Component/markup | Class/selector | Token/mechanism path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| UserMenu trigger, pending | `Button` (`UserMenu.tsx:39-46`) | Mantine's own `mod={{loading}}` → `data-loading`; internal `.mantine-Button-loader` | Native Mantine `Loader` via the shared `MantineProvider` theme — no new token | change (new `loading` prop only) | `node_modules/@mantine/core/esm/components/Button/Button.mjs` inspected: `disabled: disabled \|\| loading`, `mod: [{loading, ...}]` |
| Mobile hamburger, pending | `ActionIcon` (`HeaderView.tsx:187-197`) | same `mod`/`data-loading` mechanism | same native `Loader`, same theme | change (new `loading` prop only) | `ActionIcon.mjs` inspected: identical `mod`/`disabled` pattern |
| Header signed-in shell (avatar/name/bell, no Login/Register) while pending | `HeaderView`/`HeaderActions`/`UserMenu`, unchanged JSX and CSS classes | `.rightCluster`/`.trailingCluster`/`.userMenuSlot` (`HeaderView.module.css`, untouched) | unchanged — same classes/tokens as before this task | preserve | `Header.tsx`'s `headerUser` substitutes only the *data* passed into already-existing markup; no className/style edit in `HeaderView.tsx` beyond the two additive props (`isSigningOut`, `loading`) |
| Contact card / rest of the page | out of scope — server-rendered elsewhere | n/a | n/a | preserve (switches via `router.refresh()`/`push()` per 872, unchanged) | F4; `postSignOut.ts` untouched (§8) |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story / source | Decision | Consumed style or token path |
|---|---|---|---|---|
| UserMenu trigger pending state | Searched `src/stories` for `SigningOut`/`isSigningOut`/`signing_out` — 0 hits; inspected `UserMenu.stories.tsx` (direct import of `UserMenu`) and Mantine `Button`'s native `loading` prop | `src/stories/mantine/primitives/UserMenu.stories.tsx` (`Mantine/Primitives/UserMenu`) | `extend` (new export on the existing canonical Story) | Mantine `Button`'s built-in `loading` → theme `Loader`, no new token |
| Mobile hamburger pending state | Same search; inspected `HeaderView.stories.tsx` (direct import of `HeaderView`) and Mantine `ActionIcon`'s native `loading` prop | `src/stories/mantine/primitives/HeaderView.stories.tsx` (`Mantine/Primitives/HeaderView`) | `extend` (new export on the existing canonical Story) | Mantine `ActionIcon`'s built-in `loading` → theme `Loader`, no new token |

## Implementation validation notes

- T1's design (a `<Suspense>` child gated on a `show` state, reading `use(navPromise)` only once
  `navigate()` fires) worked on the first run — no debugging cycle needed. It correctly reproduces the
  documented React behavior the kickoff's §5.1 INFERENCE describes: a state update scheduled *after* an
  `await` inside a `startTransition` callback does not inherit that transition unless re-wrapped, and a
  Suspense-suspending update inside a transition keeps the previously committed UI (no fallback) until the
  suspended promise resolves.
- T2 also passed on first run. Clicking the Mantine `Menu.Target`-wrapped trigger with `fireEvent.click` opened
  the desktop dropdown reliably under `stubMatchMedia(false)`, matching the `useResponsiveDropdown` SSR-safe
  default documented in `MantineDropdownMenu.tsx`.
- No defect found or fixed beyond the task's own scope. No gap remains against R1–R7/AC1–AC9′.

## Assumptions, deviations, and limitations

- AC10 is `MISSING EVIDENCE` — no signed-in browser session available to the executor, exactly as the kickoff
  anticipates (§12 AC10, §5.1). O81-5's three observations and O81-4's 12-tuple visual matrix remain owed to
  the owner before approval.
- T1 mirrors Next's transition-merging behavior with a Suspense-suspending `use()` promise in jsdom, not a real
  Next router — the kickoff's own stated detector blind spot (§15), unchanged by this session.
- No deviation from the kickoff's §16 amendment. R1–R6 were implemented exactly as specified; R7′ ran exactly
  as §16.2/§16.4 describe.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task876/` (all files listed above).
- Please verify independently: the `AuthContext.tsx`/`Header.tsx`/`HeaderView.tsx`/`UserMenu.tsx` diffs against
  AC1/AC4 (both quoted in full in this log); the plant restorations via `28-hash-object.txt` against
  `plant.txt`'s witnessed hashes; and the baseline diff (`03-baseline-diff.txt`) against F10′.
- Open risk for review: T2's `fireEvent.click` on the Mantine `Menu.Target` trigger is the first vitest
  coverage in this repo that opens a `MantineDropdownMenu` — worth an independent look at whether this
  interaction pattern should become the house convention for future Menu-based tests.
- Owner items still owed before approval: O81-4 (12-tuple Storybook visual matrix), O81-5 (three live
  sign-out observations), and AC10.

## Backlog update

`docs/backlog.md` → 876 state cell updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, pointing at this
session log. Resulting `docs/backlog.md` physical line count: unchanged at 80 lines (cell content edited in
place, no line added). No `BACKLOG LIMIT BREACH`.
