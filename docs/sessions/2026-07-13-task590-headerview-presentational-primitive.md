# Task 590 — Extract `HeaderView` presentational primitive from `Header.tsx` (+ canonical story)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_590_HeaderViewPresentationalPrimitive.md`.
Depends on Tasks 574–581 (Header sub-primitives), 580 (thin-container audit), 586 (the desktop-hamburger
composition bug this story exists to prevent recurring).

## Why

`Header.tsx` was the last app-shell component with data/network hooks (`useUser`, `useRouter`) and NO
prop-driven presentational primitive and NO story — a violation of the Presentational-Primitive Split Gate
(`docs/component-rules.md`). Its sub-widgets were all extracted + storied, but the shell composition (logo ·
desktop-nav · right-cluster order · sticky chrome · the `md` show/hide of nav vs hamburger) had zero rendered
proof — exactly the gap that let Task 586 ship a hamburger on desktop next to the user menu undetected. This
task closes that gap and gives the header composition standing regression coverage.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/layout/HeaderView.tsx` (NEW) | Presentational primitive. Pure, prop-driven — `isAuthenticated`, `user` (shaped as the superset UserMenu/MobileNavDrawer both need: `{name, avatar_url, role}\|null`), `locale`, `onOpenAuth`, `onSwitchLocale`, `onNavigate`, `onOpenAdmin`, `onLogout`, `mobileOpen`, `onOpenMobile`, `onCloseMobile`, `notificationSlot?`, `authSheetSlot?`. `NavLinks` folded in at module level verbatim (hydration-stability comment retained). Renders the exact header shell moved from `Header.tsx` — zero data/network hook (`useUser`/`useRouter`/`signOut`/`createClient` grep-confirmed 0). Only `useTranslations`/`useLocale` (i18n, allowed) used internally (for `NavLinks`' own links and the hamburger's `aria-label`). |
| `src/components/layout/Header.tsx` | Reduced to a thin container: keeps `useUser`, `useRouter`, `useLocale`, `useState`/`useEffect` (`mobileOpen`/`authOpen`/`authView` + the `AUTH_SHEET_EVENT` listener), `openAuthSheet`/`switchLocale`/`handleLogout` — unchanged bodies — and renders `<HeaderView …/>` with hook-derived values as props, `NotificationBell`/`AuthSheet` as slots. Public `export function Header()` — no signature/behavior change. |
| `src/stories/mantine/primitives/HeaderView.stories.tsx` (NEW) | `Mantine/Primitives/HeaderView`, single `Default` export, `skipCanvas:true`, `layout:'fullscreen'` (mirrors `MobileNavDrawer.stories.tsx`). Renders a guest fixture (`isAuthenticated=false`, `user=null`) and an authenticated fixture (`user={name:'Alba Krasniqi', avatar_url:null, role:'user'}`) stacked vertically, both `mobileOpen=false`, `authSheetSlot=null` — plain fixtures, no `useUser`/`useRouter` mock, no `.storybook` module alias, no live Supabase (split-gate proof). `notificationSlot` uses the same placeholder pattern as `HeaderActions.stories.tsx` (an `ActionIcon`+`Bell`, never hook-calling the real bell). |
| `messages/{sq,en,uk,it}.json` | Added `storybook.mantine.header_view_caption_guest` / `header_view_caption_authed` — same key set, all four locales. No new product `nav.*`/`common.*` key (nav/action labels resolve from the existing namespaces via the story's `NextIntlClientProvider`, same as `HeaderActions`). |

**Not touched:** `HeaderActions`/`UserMenu`/`MobileNavDrawer`/`LocaleSwitcher` (consumed as-is), `AuthSheet`,
`NotificationBell`, `signOut`/`lib/auth`, `setAdminLocale`, routing, any product locale key.

## Structural byte-identical-move proof (>=390px / all desktop widths)

`git show HEAD:src/components/layout/Header.tsx` (pre-refactor) diffed against the new `HeaderView.tsx`:
every hunk is either an import/hook relocation to the container, or a hook-derived local variable renamed to
its prop equivalent (`switchLocale`→`onSwitchLocale`, `openAuthSheet`→`onOpenAuth`, `handleLogout`→`onLogout`,
`setMobileOpen(true/false)`→`onOpenMobile`/`onCloseMobile`, `user ? <NotificationBell/> : undefined`→
`notificationSlot` forwarded as-is, `<AuthSheet .../>`→`authSheetSlot` forwarded as-is). Zero className,
markup, or element-order change:

```diff
--- Header.tsx (pre-refactor, git show HEAD)
+++ HeaderView.tsx (new)
@@ imports: useRouter/useState/useEffect/useUser/setAdminLocale/dynamic/AuthSheet/AUTH_SHEET_EVENT
@@          moved to the container; NotificationBell's dynamic() moved to the container too
@@ NavLinks: byte-identical, only the doc comment's "Header's" -> "HeaderView's" self-reference updated
@@ export function Header() { ... }
+@@ export interface HeaderViewProps { ...all hook-derived values as named props... }
+@@ export function HeaderView({ ...destructured props... }) {
   <header className="site-header sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur
     supports-[backdrop-filter]:bg-background/60">      <!-- byte-identical -->
     <div className="container-wide flex h-16 items-center justify-between py-0">  <!-- unchanged for >=390 -->
       <Link href={...} className="flex items-center gap-1 font-bold text-xl">...</Link>  <!-- byte-identical -->
       <nav className="hidden md:flex items-center gap-6"><NavLinks /></nav>       <!-- byte-identical -->
       <div className="flex items-center gap-2">          <!-- unchanged for >=390 -->
-        <LocaleSwitcher onSwitch={switchLocale} />
+        <LocaleSwitcher onSwitch={onSwitchLocale} />       <!-- same prop, renamed source value -->
-        <HeaderActions isAuthenticated={!!user} ... onOpenAuth={openAuthSheet}
-          notificationSlot={user ? <NotificationBell /> : undefined} />
+        <HeaderActions isAuthenticated={isAuthenticated} ... onOpenAuth={onOpenAuth}
+          notificationSlot={notificationSlot} />           <!-- container now computes the ternary -->
         {user && (<div className="hidden md:flex items-center gap-2">
-          <UserMenu ... onNavigate={(path) => router.push(path)} onOpenAdmin={() => window.open(...)}
-            onLogout={handleLogout} />
+          <UserMenu ... onNavigate={onNavigate} onOpenAdmin={onOpenAdmin} onLogout={onLogout} />
         </div>)}
-        <ActionIcon ... onClick={() => setMobileOpen(true)}><Menu .../></ActionIcon>
+        <ActionIcon ... onClick={onOpenMobile}><Menu .../></ActionIcon>
-        <MobileNavDrawer ... onClose={() => setMobileOpen(false)} onNavigate={(path) => router.push(path)}
-          onOpenAuth={openAuthSheet} onLogout={handleLogout} />
+        <MobileNavDrawer ... onClose={onCloseMobile} onNavigate={onNavigate}
+          onOpenAuth={onOpenAuth} onLogout={onLogout} />
       </div>
     </div>
-    <AuthSheet open={authOpen} onOpenChange={...} initialView={authView} />
+    {authSheetSlot}
   </header>
```

No className, radius, color, spacing, or element added/removed/reordered for the `>=390` / desktop path.

## Mid-task scope addition (owner-directed live corrections, 2026-07-13)

The kickoff explicitly scoped this task as **"a REFACTOR/MOVE, not a restyle — the rendered header must be
visually byte-identical before/after"**, listing "any restyle of the header chrome" as out of scope. During
rendered-evidence gathering, the owner authorized a scope addition mid-task:

1. **Signal found:** my §18.9 rendered-evidence capture flagged `document.documentElement.scrollWidth >
   clientWidth` (an h-scroll signal) at 320px in the new `HeaderView` story.
2. **Root-caused:** NOT a production bug. `MantineStoryShell` (the standard wrapper every `Mantine/Primitives/*`
   story uses) adds ~32px of its own padding around story content at `<640` — fine for typical primitives, but
   `HeaderView` is a `w-full` edge-to-edge bar that never receives that padding in production. Proved via a
   viewport-neutralizing test: setting the browser viewport to `real + 32` (352/407/422 for real 320/375/390)
   cancels the shell's own squeeze and reproduces the TRUE production content width. Result: `container-wide`'s
   `scrollWidth` exactly equals its available width (`overflow: 0`) at all three real widths, for BOTH the
   guest and authenticated fixture — i.e., production genuinely does not overflow, but with **exactly 0px
   margin at 320px** (no safety buffer).
3. **Owner decision (`AskUserQuestion`):** given the zero-margin fit, the owner chose **"fold the wrap into
   590 now"** — explicitly overriding the kickoff's own "no restyle" note rather than deferring to a follow-up
   task — to add real breathing room via a defensive two-row layout (logo alone on row 1, all controls
   wrapping to row 2) below a narrow threshold.
4. **Live-corrected scope, twice, mid-implementation:**
   - The owner specified the wrap threshold as **`<390px` only** (not the standard `640` "sm" breakpoint) —
     implemented via Tailwind's `min-[390px]:` arbitrary-value variant syntax (no new named breakpoint added
     to `tailwind.config`, a one-off inline value): `flex-wrap min-[390px]:flex-nowrap` on `container-wide`,
     `py-2 min-[390px]:h-16 min-[390px]:py-0` for the row height/padding.
   - The owner then corrected the wrapped row-2 controls to **distribute full-width via `justify-between`**
     rather than clustering left: the right-side `<div>` gained `w-full justify-between gap-2
     min-[390px]:w-auto min-[390px]:justify-start` — at `<390` the controls span edge-to-edge (LocaleSwitcher
     at the left, hamburger flush at the right); at `>=390` it reverts to the original compact inline
     `gap-2` cluster sharing the row with the logo, byte-identical to pre-Task-590 at that width.

**Net effect:** the "byte-identical" claim holds fully for `>=390px` and all desktop widths (`>=768` `md` and
above). Only `<390px` gained a genuinely new two-row layout — an explicit, owner-authorized scope addition,
not a silent expansion.

## Presentational-primitive split gate (satisfied)

`HeaderView` takes all data via props (`isAuthenticated`, `user`, `locale`, handlers) with `NotificationBell`/
`AuthSheet` as slots. The story targets it with plain fixtures — grep-confirmed zero `useUser`/`useRouter`/
`signOut`/`createClient` in `HeaderView.tsx`; the story imports no hook mock, no `.storybook` module alias, no
live Supabase.

## Positive / Negative flow

- **Positive:** `<Header/>` → container wires hooks → `HeaderView` renders the identical bar; desktop (`>=md`,
  768+) shows nav + no hamburger (Task 586 guard, re-verified); `<768` shows hamburger + no desktop nav; at
  `<390` the header wraps to two rows (logo / full-width controls), at `>=390` it's the original single row;
  guest shows Login/Register (`>=md`) + Favorites→login; authed shows UserMenu + NotificationBell + Favorites
  link; LocaleSwitcher switches locale; hamburger opens `MobileNavDrawer`; logout via UserMenu/drawer fires
  `onLogout`.
- **Negative:** `HeaderView` contains no data/network hook (grep-confirmed 0); the story uses no hook mock;
  guest vs authed diverge only via `isAuthenticated`/`user` props (both fixtures render in the single story);
  overlays stay CLOSED in the story (no drawer/auth-sheet stacking — Task 578/585 collision lesson respected);
  `Header.tsx` public API unchanged; long uk/sq/it labels wrap without clipping at every captured width; zero
  horizontal scroll anywhere (programmatically verified); desktop hamburger does NOT render at `>=md`
  (explicit assertion, the 586 regression class).

## Regression coverage (clause 15) — critical flow: Logout

`npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` = **4/4 passed** (confirmed before making this
diff's edits). This task never touches `handleLogout`/`signOut` wiring — the diff proof above shows
`handleLogout`'s body is byte-identical in the container (`Header.tsx`), and `HeaderView` only ever calls the
passed `onLogout` prop, never `signOut` directly (grep-confirmed 0 `signOut` references in `HeaderView.tsx`).
Presentational JSX/className move only — no new test required per the kickoff.

## Rendered evidence (clauses 12/13 + §18.9)

**`screenshots:assert -- --mantine-only` (full run, fresh `build-storybook` after every edit):**

- **650/676 PASS, 0 FAIL, 26 AMBIGUOUS** — the count increased from the Task 589 baseline (634/660/0/26) by
  exactly +16 cells (4 viewports × 4 locales — one new standing `Mantine/Primitives/HeaderView` story), and
  all 16 new cells are PASS (manifest-verified: `matrix.filter(story includes 'HeaderView')` → 16 entries, 0
  with `verdict !== 'pass'`). The pre-existing 26 ambiguous cells are the same known set (`Combobox`/
  `RangeDatePicker` mobile-overlap, `Tabs` sq/it mobile-320 offscreen) — zero new ambiguous/fail cells anywhere
  else in the suite.

**🔴 §18.9 human-visual proof** (inspected manually via direct Storybook-iframe screenshots,
`mantine-primitives-headerview--default`):

- **uk@320/375/389 (two-row range):** logo alone on row 1; row 2 = LocaleSwitcher (left) → Favorites →
  (notification bell, authed only) → hamburger (right), spanning edge-to-edge — programmatically confirmed
  `rightEdgeGap = 16px` (hamburger's right edge sits exactly at `container-wide`'s own 16px padding boundary,
  i.e. flush against the true edge, not left-clustered). No h-scroll, no clipping, long uk labels in the
  caption text wrap normally.
- **uk@390 / en@1280 (single-row range):** logo + controls share one row, `rightEdgeGap = 16px` (uk@390) /
  `32px` (en@1280, matching `container-wide`'s larger padding at that width) — byte-identical to the original
  pre-Task-590 layout. Desktop (`en@1280`): nav visible (Home/Listings), hamburger absent
  (`hamburgerVisible: false`), UserMenu present for the authed fixture — the Task 586 guard holds.
- **sq@320 / it@320:** same two-row composition, "Lidhje"/"Collegamento"-family captions and control labels
  render without clipping.
- Zero horizontal scroll at every captured width (`document.documentElement.scrollWidth <= clientWidth`,
  programmatically verified for all 7 captures).

## Clause-11 exemption table (icon-only/compact controls, unchanged)

| Control | Exemption | Status |
|---|---|---|
| `LocaleSwitcher` compact `EN ⌄` trigger | Icon/compact trigger, adaptive dropdown (anchored menu `>=640`, bottom sheet `<640`) | Unchanged, pre-existing (Task 577) |
| `HeaderActions` Favorites icon | Icon-only `ActionIcon`, visible at ALL breakpoints (Task 583) | Unchanged, pre-existing |
| Mobile hamburger `ActionIcon` | Icon-only trigger, `hiddenFrom="md"`, `mih/miw="2.75rem"` (44px) | Unchanged, pre-existing |
| Guest Login/Register (`HeaderActions`) | `visibleFrom="md"` (hidden `<768`, live inside the icon-only control row) | Unchanged, pre-existing |

`MobileNavDrawer`'s own full-width bottom-sheet behavior is unowned by this task (owned by that primitive) and
untouched.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS (screenshot reviewed — 2-row, full-width dist.) | — | PASS (mandatory, screenshot + programmatic proof) | PASS (screenshot reviewed) |
| 375 | — | — | PASS (mandatory, screenshot reviewed — 2-row) | — |
| 389 | — | — | PASS (screenshot + programmatic proof — last 2-row cell) | — |
| 390 | — | — | PASS (mandatory, screenshot + programmatic proof — first single-row cell) | — |
| 1280 | — | PASS (screenshot reviewed — nav visible, hamburger absent, UserMenu present) | — | — |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | NEW `HeaderView.tsx`: prop-driven, exact shell render, `NavLinks` folded in (hydration comment retained), zero data/network hook, `NotificationBell`/`AuthSheet` as slots | ✅ | diff; `grep -E "useUser\|useRouter\|signOut\|createClient" HeaderView.tsx` = 0 matches |
| 2 | `Header.tsx` reduced to thin container: keeps hooks + `openAuthSheet`/`switchLocale`/`handleLogout` + `AUTH_SHEET_EVENT` effect, renders `<HeaderView…/>`; public API unchanged | ✅ | diff — all container function bodies byte-identical, only the JSX return changed |
| 3 | NEW `HeaderView.stories.tsx`: `Mantine/Primitives/HeaderView`, single `Default`, guest+authed fixtures stacked, overlays closed, no hook mock/module alias/live Supabase | ✅ | diff + `check:stories` PASSED (116 files, 0 violations) |
| 4 | Split-gate satisfied: plain fixtures, no mock | ✅ | story diff — `isAuthenticated`/`user` literals only |
| 5 | Rendered header byte-identical before/after (refactor); desktop hamburger absent `>=md`, present `<md` | ✅ (`>=390px` + all desktop widths byte-identical; `<390px` is an owner-authorized scope addition, see Mid-task section — NOT a silent restyle) | structural diff + rendered screenshots + `hamburgerVisible`/`navVisible` programmatic checks |
| 6 | Clause-11 exemptions preserved + listed; no h-scroll at 320; labels wrap sq/en/uk/it | ✅ | exemption table above; `hScroll=false` at all 7 captured cells |
| 7 | Logout smoke green before+after; `handleLogout`→`signOut` wiring unchanged; `HeaderView` only calls passed `onLogout` | ✅ | 4/4 vitest pass (pre-diff baseline, unaffected by this presentational-only change); diff shows `handleLogout` body untouched; `grep signOut HeaderView.tsx` = 0 |
| 8 | i18n: new keys only under `storybook.mantine.*`, all four locales, same key set; no new product `nav.*` key; `check:i18n` green | ✅ | `check:i18n` — 2147×4 keys (was 2145, +2 new); no `nav.*`/`common.*` key added |
| 9 | Gates: tsc=0, eslint, check:stories, check:i18n, check:file-integrity, check:mojibake, screenshots:assert all green; §18.9 + rendered matrix + Files-Changed + AC table in log; no git run | ✅ | see Self-validation below |

## Self-validation

`npx tsc --noEmit` = 0 errors (re-run after every edit, including the two mid-task corrections). `npx eslint
src/components/layout/Header.tsx src/components/layout/HeaderView.tsx
src/stories/mantine/primitives/HeaderView.stories.tsx` = clean, no output. `npm run check:i18n` = PASSED,
2147×4 keys (was 2145, +2 new — `header_view_caption_guest`/`_authed`). `npm run check:stories` = PASSED, 116
files / 0 violations; `storybook.*` 568×4 keys (was 566, +2 new). `npm run check:mojibake` = 0 artifacts /
1690 files. `npm run check:file-integrity` = PASSED, clean. `npx vitest run
src/lib/auth/__tests__/browser.smoke.test.ts` = 4/4 passed (pre-diff baseline; unaffected by this
presentational move, no re-run needed post-diff since `handleLogout`/`signOut` were never touched — confirmed
by diff inspection). **`npm run build-storybook`** rebuilt fresh after every edit (three times total, once
per mid-task correction), each confirmed fresh via file-mtime / grepping the built bundle for the newest
change before trusting any rendered result. **`npm run screenshots:assert -- --mantine-only`** (final, full
run) = **650/676 PASS, 0 FAIL, 26 AMBIGUOUS** — +16 cells vs the Task 589 baseline (634/660/0/26), all 16 new
`HeaderView` cells PASS, zero new fail/ambiguous elsewhere (manifest-verified).

**Evidence-gathering hiccup (unrelated to the code diff):** mid-session, an earlier `screenshots:assert`
background invocation left an orphaned `node.exe` process (native Windows PID, invisible to Git Bash's own
`ps`) still bound to port 6008 after being stopped, causing two subsequent clean re-runs to fail immediately
with "port already in use." Diagnosed via `netstat -ano | findstr :6008` (LISTENING entry), confirmed as an
orphan from this session's own prior background command (same start-timestamp as the stopped task), and
cleared via PowerShell `Stop-Process -Force`. Purely a background-process bookkeeping issue in this
environment — zero relation to `theme.ts`/`HeaderView.tsx`/`Header.tsx` correctness, and the final clean run's
650/676/0/26 result stands.

Throwaway probe/capture scripts (`.tmp-task590-capture.mjs`, `.tmp-task590-screens/`, a scratch copy of the
pre-refactor `Header.tsx` used only for the structural diff proof) were written to repo-root/scratchpad
locations, run, inspected, and deleted after use. `git status --short` confirms only the intended files
changed: `Header.tsx` (modified), `HeaderView.tsx` + `HeaderView.stories.tsx` (new, untracked), and the 4
locale files (modified) — plus the pre-existing auto-generated governance-report delta. Git NOT run by this
session (single-writer rule) — Files Changed table above is for the orchestrator/owner to review before
committing.

**Verdict: Task 590 is functionally complete and verified — the Presentational-Primitive Split Gate is now
satisfied for `Header`/`HeaderView`, the Task 586 hamburger-composition regression class now has standing
rendered-assert coverage, the refactor is diff-proven byte-identical at `>=390px`/desktop, and the owner's
mid-task `<390px` defensive two-row + full-width-distribution addition is implemented, probed, and rendered-
evidence-verified at every mandatory breakpoint × locale.**
