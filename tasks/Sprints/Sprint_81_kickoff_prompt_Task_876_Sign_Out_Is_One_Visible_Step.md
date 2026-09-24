# Task 876 — sign-out is one visible step: the header holds its state and shows a pending control until the new page arrives

Sprint 81 · **P2** · QA profile **Q4** (Logout is a registered critical flow) · depends on 872 (landed) · owner actions
**O81-4, O81-5** · **Status: 📝 KICKOFF FILED 2026-09-24, READY FOR SONNET**

Sprint plan: [`Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md`](Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md)
(owner decisions **D81-2**, **D81-4** quoted verbatim there; D81-4 is also written into `docs/golden-rules.md` GR-1).

## 1. Mode and task type

`IMPLEMENTATION`, covering:
- client auth state in a non-visual provider (`AuthContext.tsx`);
- container logic (`Header.tsx`, 0 `className`);
- one optional prop on each of two enrolled Mantine components (`HeaderView`, `UserMenu`), each wired to a native
  Mantine `loading` prop;
- one Story **export** each in two existing canonical Story files;
- tests, `test:auth`, the critical-flow registry row, and one regenerated census baseline.

No new visual value, token, CSS rule, `className` or locale key. Bundles:
- **Auth / Session** (`docs/state-authority.md`, `docs/app-lifecycle-contract.md`);
- **Regression / Critical Flow Coverage**;
- **Mantine UI** (`docs/mantine-responsive-design-system.md`), for the `loading` states only;
- **Storybook governance**, for the two exports.

## 2. Objective

When a signed-in user signs out from the header:
1. the header **keeps showing the signed-in layout** (avatar and name on desktop, bell, no Login/Register) until the
   post-sign-out page has arrived;
2. during that window, the **sign-out control shows a pending state**. On desktop that is the `UserMenu` trigger; on
   mobile it is the hamburger, because the drawer still closes at once;
3. the header, the contact card and the rest of the page then **switch together**.

The routing outcome of 872 is unchanged: a public page stays and is refreshed, a guarded page goes to `/<locale>`.

## 3. Verified context — measured 2026-09-24 (re-measure at I0)

- **F1 (FACT, owner measurement 2026-09-24, production, Chrome DevTools Network).** Signing out on
  `/en/listings/apartament---11-…`:
  - `logout?scope=global` → 204 in **97 ms**;
  - the `_rsc` refresh of the listing page → 200 in **439 ms**;
  - everything done by ~0.56 s.

  The owner confirms the contact card changes right after ~0.5 s. Nothing takes multiple seconds; the complaint is
  the ~0.5 s in which the page looks stuck.
- **F2 (FACT).** `AuthController.signOut()` (`src/lib/auth/controller.ts:231-252`):
  - commits `{ status: 'signing_out', user: null }` **before** its first `await` (`:240`);
  - awaits `coreSignOut()`, the Supabase `auth.signOut()` with the default global scope (`src/lib/auth/browser.ts:61-63`);
  - then commits `unauthenticated`.
- **F3 (FACT).** `AuthProvider` reads the controller through `useSyncExternalStore` (`AuthContext.tsx:84-88`), so the
  `user: null` commit reaches every consumer synchronously on the click.

  `signOut` (`:104-117`):
  - uses the bare `startTransition` import, so it exposes **no pending state**;
  - calls `navigate?.()` **after** `await`, outside any transition scope.

  React documents that `useTransition` provides `isPending`, and that updates after `await` need another
  `startTransition` to belong to the transition. Next's `router.refresh()` / `router.push()` merge the new RSC
  payload inside a transition.
- **F4 (FACT).** The listing contact card is server-rendered from `getUser()`
  (`src/app/[locale]/listings/[slug]/page.tsx:144-148`), so it can change only when the refreshed RSC payload
  arrives. The header flips at the click (F3) and the card ~0.5 s later (F1): that mismatch is the visible defect.
- **F5 (FACT).** `Header.tsx` (`src/components/layout/Header.tsx:19`, `:56-67`) passes all of these to `HeaderView`,
  derived from the live `user`:
  - `isAuthenticated={!!user}`;
  - `user={user}`;
  - `notificationSlot={user ? <NotificationBell /> : undefined}`.

  `handleLogout` (`:48-54`) is 872's classifier call; keep it exactly.
- **F6 (FACT).** The two sign-out controls are native Mantine controls that already accept `loading` (Mantine
  `@mantine/core` **8.3.18**):
  - desktop: the `UserMenu` trigger is a Mantine `Button` (`src/components/layout/UserMenu.tsx:38-45`);
  - mobile: the hamburger is a Mantine `ActionIcon` (`src/components/layout/HeaderView.tsx:196-205`).

  `MobileNavDrawer.logout()` calls `onLogout()` and then `onClose()` (`MobileNavDrawer.tsx:36-39`), so on mobile the
  drawer is already closed during the wait.
- **F7 (FACT).** Other `useAuth()`/`useUser()` consumers read `user` and must keep today's semantics:
  - `FavoriteButton` (and its `status !== 'signing_out'` guard, `:80`);
  - `FavoritesShell`, `FeaturedListings`, `LatestListings`, `ListingsShell`, `RecentlyViewedGrid`;
  - `ProfileTab` (its own `signOut`), `VerifiedBridge`, `AuthRedirect`.

  Eight stories build an `AuthContextValue` literal through `AuthContext.Provider`:
  - `FavoriteButton`, `FavoritesShell`, `ListingCard`, `SaveToCollectionButton` (all in `src/stories/mantine/primitives/`);
  - `HomepageListingGrids`, `ListingCardPattern`, `ListingCardTrack`, `ListingDetailPattern` (all in
    `src/stories/patterns/mantine/`).

  A **required** new field would break all eight, so the new field is **optional**.
- **F8 (FACT).** `useNotifications` (`src/modules/notifications/hooks/useNotifications.ts:33-46`) never reads the user.
  It opens a Realtime channel on mount and removes it on unmount, and RLS filters the rows on the server. Keeping the
  bell mounted for the ~0.5 s hold exposes nothing.
- **F9 (FACT, GR-1 census 2026-09-24).** `node.exe scripts\check-surface-census.mjs --surface
  src/components/layout/Header.tsx` reports 21 nodes and exits 1 with exactly three FAIL lines:
  - `Header.tsx` — container-exempt, D81-2;
  - `NotificationBell.tsx` — container-exempt, D81-2;
  - `src/components/ui/PasswordRequirementsHint.tsx` — tier-2, owned by 873.

  `HeaderView` and `UserMenu`: manifest yes, own Story yes. `AuthContext.tsx` is **not** a node of this surface: the
  census skips context imports, and AuthContext is an ancestor of the layout, not a child of the header tree. It falls
  under **D81-4** (non-visual provider).
- **F10 (FACT, simulation using the gate's own `runPipeline`/`compareToBaseline`, 2026-09-24, win32).** The changed
  files `Header.tsx`, `HeaderView.tsx`, `UserMenu.tsx` and `AuthContext.tsx` map to three surfaces:
  - `src/app/[locale]/layout.tsx`;
  - `src/components/layout/HeaderView.tsx`;
  - `src/components/layout/UserMenu.tsx`.

  The re-census set is empty and there are 0 new blocks. There is **1 stale key**:
  `src/components/layout/HeaderView.tsx :: src/components/shared/LocaleSwitcher.tsx :: tier1-unenrolled-or-unstoried`.
  It was carried by 872 (its §17.1 F9); `LocaleSwitcher` is now enrolled. Until the baseline is regenerated,
  `check:surface-census:changed` fails on it. The manifest does not change, so `check:rendered-scope` is unaffected.
- **F11 (FACT).** Existing tests:
  - `src/modules/auth/__tests__/AuthContext.test.tsx` (356 lines) already covers the sign-out flow (`:276-331`) with
    `@/lib/auth/browser` mocked. It is **not** in `test:auth`.
  - `src/components/layout/__tests__/header-hydration-id-parity.test.tsx:127-147` is the house pattern for rendering
    header components under `NextIntlClientProvider` + `MantineProvider theme env="test"`.
- **F12 (FACT).** `eslint-plugin-react-hooks` is **5.2.0**. It has no rule against React's documented "adjust state
  while rendering" pattern.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Objective, F3, D81-4 | `AuthContext.tsx`: replace the bare `startTransition` import with `const [isSigningOut, startSignOutTransition] = useTransition()`. `signOut` becomes `startSignOutTransition(async () => { await controller.signOut(); startSignOutTransition(() => { navigate?.() }) })`. `AuthContextValue` gains `isSigningOut?: boolean` (optional, per F7). The provider value sets it; the default context value sets `false`. Update the block comment so it describes the real mechanism. **No change** to `user`, `status`, `loading`, `refreshUser`, or to anything in `controller.ts`/`browser.ts`. The provider still renders only `AuthContext.Provider` + `children` (D81-4 condition). | P0 | AC1, AC2, AC3 | Confirmed |
| **R2** | Objective 1–3, F4, F5 | `Header.tsx`: read `isSigningOut` from `useUser()`. Keep a held header user with the "adjust state while rendering" pattern: `const [heldUser, setHeldUser] = useState(user)`; `if (!isSigningOut && heldUser !== user) setHeldUser(user)`; `const headerUser = isSigningOut ? heldUser : user`. `isAuthenticated`, `user` and `notificationSlot` use `headerUser`. `HeaderView` also receives `isSigningOut={!!isSigningOut}`. `handleLogout`, the 872 classifier call and every other handler stay unchanged. No new JSX beyond the one prop, so D81-2 condition 1 still holds. | P0 | AC4, AC5 | Confirmed |
| **R3** | Objective 2, F6 | `HeaderView.tsx`: new optional prop `isSigningOut?: boolean`, forwarded as `isSigningOut` to `UserMenu` and as `loading={isSigningOut}` on the hamburger `ActionIcon`. Nothing else changes. | P1 | AC4, AC6 | Confirmed |
| **R4** | Objective 2, F6 | `UserMenu.tsx`: new optional prop `isSigningOut?: boolean` → `loading={isSigningOut}` on the trigger `Button`. Nothing else changes. | P1 | AC4, AC6 | Confirmed |
| **R5** | GR-3, GR-3a, D81-4 | One new export in each existing canonical Story file, with no new file, title, caption or locale key: `src/stories/mantine/primitives/UserMenu.stories.tsx` → `SigningOut` (the regular-user fixture with `isSigningOut`, no `play`); `src/stories/mantine/primitives/HeaderView.stories.tsx` → `SigningOut` (the authenticated fixture with `isSigningOut`, same bell placeholder as `Default`). | P1 | AC6 | Confirmed |
| **R6** | Critical flow "Logout" | Tests. **T1** (in `AuthContext.test.tsx`) and **T2** (new `src/components/layout/__tests__/Header.signOut.test.tsx`), both as specified in §10.3. `package.json` → `test:auth` also runs both files. `docs/critical-flow-registry.md` → the Logout row names the pending/hold behaviour and both files. No other row changes. | P0 | AC2, AC3, AC5, AC7 | Confirmed |
| **R7** | F10 | Regenerate `scripts/surface-census-baseline.json` with the house updater (§13.2). Its diff removes **exactly** the one F10 key. Any other added or removed key is `SCOPE GUARD FAILED`: stop and do not keep the file. `scripts/rendered-scope-baseline.json` is not touched. | P0 | AC8 | Confirmed |

## 5. Assumptions and open questions

1. **INFERENCE (from F3 and the documented React/Next behaviour), proven by T1 and checked in the browser by O81-5.**
   With `navigate` re-wrapped after `await`, `isSigningOut` stays `true` until the navigation transition commits. T1
   models this with a Suspense-suspending transition update in jsdom. The real Next router is seen only in a browser
   with a signed-in account, which the executor does not have. That is why O81-5 is part of the review, not
   post-deploy.
2. **DECIDED (D81-4):**
   - `AuthContext` gets no Story or manifest entry; its `layout.tsx` baseline row stays;
   - the pending UI is proven in the existing `HeaderView` Story, plus `UserMenu`'s own Story (GR-3: `UserMenu` itself
     changes);
   - no new Story for `Header` or the provider.
3. **Security (owner, D81-4):** `isSigningOut` is a UX and anti-double-submit signal only. Protected routes and APIs
   stay authorised on the server. No code may gate access on it.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`:
  - GR-0 to GR-6;
  - **GR-1's container exemption (D81-2) and non-visual provider exemption (D81-4)**.
- `docs/agent-contract.md`: clauses 3, 5, 9, 10, 14, 15, 16b–16d.
- `docs/component-rules.md`: "Container / Presentational Primitive Split" and "Storybook-First Implementation".
- `docs/state-authority.md`, `docs/app-lifecycle-contract.md`: the sign-out sections.
- `docs/critical-flow-registry.md`: the "Logout" row.
- `docs/qa-profiles.md`: the Q4 row.
- `docs/mantine-responsive-design-system.md`: native props before custom styling.
- The sprint plan: D81-2 and D81-4.

## 7. Scope

Files the executor may create or change:
- `src/modules/auth/context/AuthContext.tsx`: R1 only
- `src/components/layout/Header.tsx`: R2 only
- `src/components/layout/HeaderView.tsx`: R3 only
- `src/components/layout/UserMenu.tsx`: R4 only
- `src/stories/mantine/primitives/UserMenu.stories.tsx` and `src/stories/mantine/primitives/HeaderView.stories.tsx`:
  one `SigningOut` export each
- `src/modules/auth/__tests__/AuthContext.test.tsx`: T1 added; existing tests untouched
- `src/components/layout/__tests__/Header.signOut.test.tsx` *(new)*: T2
- `package.json`: `test:auth` only
- `docs/critical-flow-registry.md`: the Logout row only
- `scripts/surface-census-baseline.json`: regenerated per R7
- `docs/sessions/2026-09-2?-task876-*.md` and `docs/sessions/evidence/task876/**`
- `docs/backlog.md`: the 876 state cell only

## 8. Out of scope

- The following files get no edits:
  - `controller.ts`, `browser.ts`;
  - `MobileNavDrawer.tsx` (the drawer keeps closing at once);
  - `postSignOut.ts` (872's routing);
  - every other `useAuth` consumer of F7, and all eight AuthContext-mocking stories.
- The sign-out scope stays `global`.
- No new locale key, token, CSS or `className`.
- No new Story file or title.
- `scripts/mantine-migration-scope.json` and `scripts/rendered-scope-baseline.json`.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Click "Logout" (desktop) | header flips to Login/Register at once; page/card change ~0.5 s later | header keeps avatar+name, trigger shows a Mantine loader; header and page switch together when the page arrives |
| Click "Logout" in the mobile drawer | drawer closes; header flips at once | drawer closes (unchanged); hamburger shows a loader; header and page switch together |
| Route after sign-out | 872 classifier: public stays + refresh, guarded → `/<l>` | unchanged |
| Session cleared, header ends as guest | yes | yes (critical flow) |
| Second click during the wait | controller guard ignores it | the trigger is `loading` (Mantine disables it); controller guard unchanged |
| `coreSignOut()` throws | ends unauthenticated | unchanged; the header releases the hold when the transition ends |
| Other `useAuth` consumers | see `user: null` at the click | unchanged |
| Sign-out from `ProfileTab` (cabinet) | header flips at once | header holds and shows the loader too (same provider) — expected |

## 10. Implementation requirements

### 10.1 I0

1. Record `node.exe -p "process.platform + ' ' + process.version"` (`win32`). Save
   `git --no-optional-locks status --porcelain`, plus a `git hash-object` of every ` M` path, as `01-status-before.txt`.
2. Re-run the F9 census → `02-census-I0.txt`. It must show exactly the three FAIL lines of F9. A different set means
   `PREMISE DRIFT`: stop.
3. Re-read F2, F3, F5 and F6 at their cited lines. If any has moved or changed shape, `PREMISE DRIFT`: stop.

### 10.2 GR receipts before the related write

- **GR-0.** `GR-0 CANONICAL REUSE PREFLIGHT — request: sign-out pending state on the UserMenu trigger and the mobile hamburger; semantic queries: loading, pending, Loader, isSigningOut, signing_out, spinner; inspected candidates: UserMenu.tsx trigger Button, HeaderView.tsx hamburger ActionIcon, Mantine Button/ActionIcon native loading prop; decision: REUSE (native Mantine loading prop on the existing controls); selected canonical owner: src/components/layout/UserMenu.tsx, src/components/layout/HeaderView.tsx; Mantine/TailAdmin token path: Mantine default Loader via the shared MantineProvider theme, no new value; new hardcoded visual values: NONE; rationale: both controls are already native Mantine controls with a built-in loading state.`
- **GR-3a.** Two receipts, each re-running the search before the write:
  - UserMenu × signing-out → `EXTEND` `Mantine/Primitives/UserMenu`;
  - HeaderView × signing-out → `EXTEND` `Mantine/Primitives/HeaderView`.
- **GR-3.** `GR-3 STORY PROVEN — UserMenu ← src/stories/mantine/primitives/UserMenu.stories.tsx; HeaderView ← src/stories/mantine/primitives/HeaderView.stories.tsx`.
- **GR-1**, at the end: `GR-1 CENSUS COMPLETE — 21 nodes; tier1 0 migrated+enrolled+story in this task (HeaderView, UserMenu already enrolled, extended) + 2 container-exempt (Header, NotificationBell — D81-2); AuthContext non-visual provider (D81-4, not a node of this surface); tier2 0 imports removed (PasswordRequirementsHint → 873); tier3 0.`

### 10.3 Tests — observable assertions

**T1 — `AuthContext.test.tsx`, new case: "isSigningOut stays true until the post-sign-out navigation commits".**
1. Render `AuthProvider` (MOCK_USER) with a consumer that prints `isSigningOut`. Give it a `<Suspense>` child whose
   `Target` reads `use(navPromise)` only when a `show` state is true.
2. `mockCoreSignOut` returns a deferred promise. `signOut(navigate)` is called with `navigate = () => setShow(true)`.

Assertions:
- after the click: `isSigningOut` is `true`;
- after `coreSignOut` resolves: `isSigningOut` is **still** `true`, and the Suspense **fallback is not shown** (the
  old UI stays);
- after `navPromise` resolves: `isSigningOut` is `false` and `Target` renders;
- the existing sign-out tests (`:276-331`) still pass unchanged.

**T2 — new `Header.signOut.test.tsx`.** Render the real `Header` inside the real `AuthProvider` (MOCK_USER):
- use the F11 providers;
- mock `@/lib/auth/browser` as `AuthContext.test.tsx` does;
- mock `next/navigation`: `useRouter` → `push`/`refresh` spies; `usePathname` → `'/en/listings/abc-123'`;
- stub `NotificationBell`, `AuthSheet` and `@/modules/admin/actions/locale`.

`coreSignOut` returns a deferred promise. Open the `UserMenu` trigger and click the Logout item. Assertions:
- while `coreSignOut` is pending:
  - the user's name is still in the header;
  - the `UserMenu` trigger and the hamburger both carry `data-loading`;
  - no Login button is rendered;
- after it resolves:
  - `refresh` was called once and `push` was not (the public path, 872);
  - the header shows the Login button, and neither control carries `data-loading`.

**Plants** (each with a `git hash-object` witness before the plant and after the restore; restore through Node `fs`
or the Edit tool):
- **P1.** Remove the inner `startSignOutTransition(() => …)` wrapper around `navigate?.()`. T1 must fail.
- **P2.** In `Header.tsx`, pass `user` instead of `headerUser` to `HeaderView`. T2 must fail on the "name still
  shown" assertion.

Record both in `plant.txt`.

### 10.4 Rules

- No new `className`, style, CSS, token or locale key anywhere.
- `loading` is the only visual mechanism.
- The Story exports use the file's existing `MantineStoryShell` and fixtures, with no-op callbacks.
- UTF-8 without BOM. Read and write through Node `fs` or the Edit tool; never through `Get-Content -Raw` without
  `-Encoding utf8`.

## 11. Positive and negative flows

**Positive.** A signed-in user on `/en/listings/<slug>` clicks Logout (desktop):
1. the avatar button shows a loader;
2. ~0.5 s later, the header becomes guest **at the same moment** as the contact card becomes the sign-in prompt;
3. the URL is unchanged.

| Branch | Applicable | Source | Expected | Evidence |
|---|---:|---|---|---|
| Sign out on a guarded page | Yes | 872 | loader, then `/<l>` with a guest header | T2 variant not required; O81-5 |
| Mobile drawer sign-out | Yes | F6 | drawer closes, hamburger loader, then switch | T2 (`data-loading` on the hamburger); O81-5 at 390px |
| `coreSignOut()` throws | Yes | F2 | ends unauthenticated; hold released | existing test `:321-331` + T2's release assertion |
| Double click | Yes | F6 | trigger disabled while `loading`; controller guard | Mantine `loading`; no new test (controller guard already tested) |
| Sign-out from `ProfileTab` | Yes | F7 | header holds + loader until the navigation ends | inherent in R2; O81-5 optional |
| Other `useAuth` consumers | No — unchanged by construction (R1 leaves `user`/`status` alone) | F7 | unchanged | typecheck + the eight stories build |
| RSC fetch fails | No — Next falls back to a hard navigation, and the transition ends either way | — | — | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given `git diff src/modules/auth/context/AuthContext.tsx`, when read, then:
  - the changes are the `useTransition` import and hook;
  - the re-wrapped `signOut` body;
  - the optional `isSigningOut` field with its value and the `false` default;
  - the updated comment;
  - the JSX is still only `AuthContext.Provider` + `children`.
- **AC2 [R1, R6]** Given T1, when run, then all its assertions pass, and **P1** makes it fail.
- **AC3 [R6]** Given `AuthContext.test.tsx`, when run, then every pre-existing test passes unchanged.
- **AC4 [R2, R3, R4]** Given `git diff` of `Header.tsx`, `HeaderView.tsx` and `UserMenu.tsx`, when read, then each
  file carries only its R2/R3/R4 change.
- **AC5 [R2, R6]** Given T2, when run, then all its assertions pass, and **P2** makes it fail.
- **AC6 [R3, R4, R5]** Given the two Story files, when read, then:
  - each has one new `SigningOut` export rendering the real component with `isSigningOut`;
  - `npm.cmd run check:story-coverage` exits 0;
  - `build-storybook` exits 0.
- **AC7 [R6]** Given `npm.cmd run test:auth`, when run, then it includes both test files and exits 0, and the Logout
  row names them.
- **AC8 [R7]** Given `03-baseline-diff.txt`, when read, then it shows exactly the one F10 key removed, and
  `check:surface-census:changed` (with `--base`), its `:verify`, `check:rendered-scope` and its `:verify` exit 0.
- **AC9 [all]** Given the §13.2 block, when run, then:
  - `typecheck`, `lint`, `check:enrolled-tailwind` (and `:verify`), `check:file-integrity`, `check:mojibake` and
    `npm run build` all exit 0;
  - the Header census prints exactly the three F9 FAIL lines;
  - the final status lists no path outside §7 beyond those in `01-status-before.txt`.
- **AC10 [Objective] — owner, before approval (O81-5).** On a local dev server or production, signed in:
  - on a listing page, the avatar button shows a loader, then the header and the contact card switch together;
  - on `/favorites`, the loader shows, then the homepage renders with a guest header;
  - at 390px, the drawer closes, the hamburger shows a loader, then the page switches.

  The executor records `MISSING EVIDENCE` here if it cannot sign in. That is expected; the review collects O81-5.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none. AC8's "exactly one key" is measured (F10) with a stop branch; AC4's "only" names a fixed change set per file.`

## 13. QA profile and verification plan

**Q4.** Logout is in `docs/critical-flow-registry.md`, so this task needs:
- the regression suite;
- a changed-behaviour test with a failing plant (T1/P1, T2/P2);
- the owner's rendered check (O81-5) and visual matrix (O81-4);
- the build.

### 13.1 Re-entry

From scratch. Evidence root: `docs/sessions/evidence/task876/`.

### 13.2 Gate block (executor, Windows PowerShell, project root)

Run the census baseline writer **after** the four source edits. The diff must contain `HeaderView.tsx` for the
updater to census that surface.

```powershell
$ev = "docs\sessions\evidence\task876"
$base = git --no-optional-locks rev-parse HEAD
node.exe scripts\check-surface-census-changed.mjs --base $base --update-baseline *>&1 | Tee-Object "$ev\03a-census-update-baseline.txt"
git --no-optional-locks diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json *>&1 | Tee-Object "$ev\03-baseline-diff.txt"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
npx.cmd vitest run src/modules/auth/__tests__/AuthContext.test.tsx src/components/layout/__tests__/Header.signOut.test.tsx *>&1 | Tee-Object "$ev\11-new-tests.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\12-test-auth.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\15-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/components/layout/Header.tsx *>&1 | Tee-Object "$ev\16-census-header.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\17-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\18-rendered-scope-verify.txt"
node.exe scripts\check-surface-census-changed.mjs --base $base *>&1 | Tee-Object "$ev\19-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\20-census-changed-verify.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\21-enrolled-tailwind.txt"
npm.cmd run check:enrolled-tailwind:verify *>&1 | Tee-Object "$ev\22-enrolled-tailwind-verify.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\24-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\27-build.txt"
git --no-optional-locks hash-object src/modules/auth/context/AuthContext.tsx src/components/layout/Header.tsx src/components/layout/HeaderView.tsx src/components/layout/UserMenu.tsx src/stories/mantine/primitives/UserMenu.stories.tsx src/stories/mantine/primitives/HeaderView.stories.tsx src/modules/auth/__tests__/AuthContext.test.tsx src/components/layout/__tests__/Header.signOut.test.tsx package.json docs/critical-flow-registry.md scripts/surface-census-baseline.json *>&1 | Tee-Object "$ev\28-hash-object.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
```

Expected results:
- `03a` exits 0.
- `03` removes exactly the F10 key; the rendered-scope file does not appear.
- `10` prints `win32`.
- `11` and `12` pass. `13`–`15` exit 0.
- `16` exits 1 with exactly the three F9 FAIL lines.
- `17`–`22` exit 0. `24`–`27` exit 0.

Record every exit code in the session log. Run the plants P1/P2 after `27`, with hash witnesses, and save
`plant.txt`.

### 13.3 Owner steps (collected by the review, before approval)

1. **O81-4. OWNER VISUAL QA REQUIRED** — toolbar locales `sq`, `en`, `uk`, `it`:
   - `Mantine/Primitives/UserMenu` → `SigningOut` × 4 locales × viewport 1440 = 4 tuples;
   - `Mantine/Primitives/HeaderView` → `SigningOut` × 4 locales × viewports 320 and 1440 = 8 tuples.

   Record accepted or returned for each.
2. **O81-5.** The three AC10 observations, with the URL before and after.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

Report:
- changed files with their hashes (`28`);
- R1–R7 and AC1–AC10 status (AC10 = `MISSING EVIDENCE` unless signed in);
- every §13.2 command with its exit code;
- the I0 census and premise checks;
- the plant record;
- the GR-0, GR-3a, GR-3 and GR-1 receipts;
- deviations and limitations.

Update the 876 backlog state cell. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — facts with file:line, owner decisions quoted in the sprint plan and GR-1, commands in §13.2 |
| Two-armed control | P1 (post-await wrapper) fails T1; P2 (no hold) fails T2 |
| Detector blind spot stated | T1 models Next navigation with a Suspense-suspending transition in jsdom; the real router is covered only by O81-5 (§5.1). `check:surface-census:changed` sees only surfaces the diff maps to (F10). |
| GR-1 | census at design time (F9): 21 nodes; 2 container-exempt (D81-2); tier-2 → 873; AuthContext under D81-4, not a surface node |
| Owner exceptions quoted | D81-2, D81-4 verbatim in the sprint plan and GR-1 |
| Dirty worktree | I0 snapshot + hash witnesses; AC9 comparator |
| Security | pending state is UX only; server authorisation unchanged (§5.3) |
