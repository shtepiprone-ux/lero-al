# Task 681 — Sonner retirement onto Mantine notifications — session log

**Task path:** `tasks/kickoff_prompt_Task_681_SonnerToaster_Mantine_Notifications.md` (executed against the
2026-07-29 corrected draft, §3.11).
**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

This session continues a prior BLOCKED stop (see the git history of this file / `docs/backlog.md`): Sonnet's I0
census on the draft-1 kickoff found a second, undocumented Sonner mount in `src/app/admin/layout.tsx` and stopped
without touching any `src/` file. The orchestrator corrected the kickoff (§3.11, five defects) and re-issued it;
this log covers the full implementation against the corrected task.

---

## 1. Start gate

- `git status --porcelain` at session start: empty (clean), confirmed before any write (A5).
- HEAD: `00fb744dff6142d5bdf3fe1682704e21d292c45f`, branch `task/q0-ci-rendered-locale-split`.

### I0 — census re-verified against the corrected §3.2/§3.11 numbers

| Measure | Expected (corrected kickoff) | Actual | Match |
|---|---:|---:|---|
| Consumer files `from 'sonner'` (single-quoted) | 33 | 33 | ✅ |
| Wrapper's own double-quoted import | 1 (`sonner.tsx`) | 1 | ✅ |
| Files rendering `<Toaster` | 2 | 2 (`[locale]/layout.tsx`, `admin/layout.tsx`) | ✅ |
| Total `toast.*` call sites | 169 | 169 | ✅ |
| `toast.error` / `.success` / `.info` / `.warning` | 101/57/7/4 | 101/57/7/4 | ✅ |
| Bare `toast(...)` | 0 | 0 | ✅ |
| `.promise`/`.loading`/`.custom`/`.dismiss` | 0 | 0 | ✅ |
| `next-themes` consumers in `src/` | 1 (`sonner.tsx`) | 1 | ✅ |

No divergence. Proceeded per I10's order: I0 → I1 → I2 → I6 → I3 → I8 → I4 → I5 → I7 → gates → I9 → records.

---

## 2. Requirement / acceptance-criteria evidence

| Req | Evidence |
|---|---|
| **R1/AC1** | `src/design-system/mantine/notificationVariants.ts` created. `grep -n "use client\|@mantine/core"` → 0 hits. Exports `NotificationVariant`, `VARIANT_COLORS`, `VARIANT_ICONS`, `NOTIFICATION_AUTO_CLOSE`. `VARIANT_COLORS` = `{success:'green', error:'red', info:'blueLight', warning:'yellow'}` — the one corrected value (§3.11 defect 5), not a verbatim copy of the pattern's buggy `info:'blue'`. Icons: `CircleCheckIcon`/`OctagonXIcon`/`InfoIcon`/`TriangleAlertIcon` at `size=24`, matching `Notification.stories.tsx`'s `ICON_SIZE=24` exactly. |
| **R2/AC2** | `src/lib/toast.ts` created. `toast` has exactly 4 methods (`success`/`error`/`info`/`warning`), each `(message: string) => void`. No `title:`, no `position:` in the file (`grep` confirms). Delegates to `notifications.show({ message, color, icon, autoClose })`. |
| **R3/AC3** | `MantineNotificationPattern.tsx` edited: local `VARIANT_COLORS: Record<...>` literal deleted (`grep -n "VARIANT_COLORS: Record"` → 0 hits); imports `VARIANT_COLORS`/`VARIANT_ICONS`/`NOTIFICATION_AUTO_CLOSE`/`NotificationVariant` from the shared module and re-exports `NotificationVariant` (required — `patterns/index.ts:29` imports it from this file); `showNotification` now passes `icon`. Public props (`MantineNotificationPatternProps`) unchanged. |
| **R4/AC4** | All 33 consumer files re-pointed `from 'sonner'` → `from '@/lib/toast'`, import line only. `grep -rn "from 'sonner'" src/` → 0 hits. `git status --porcelain` shows exactly 33 files with a single `M`. Every file's `git diff -U0` is exactly one hunk, one line (`@@ -6 +6 @@` pattern, sample quoted in §5 below) — 0 call-site hunks. |
| **R5/AC5** | Both mounts removed: `src/app/[locale]/layout.tsx` (import + `<Toaster />`) and `src/app/admin/layout.tsx` (import + `<Toaster />`, the mount the draft-1 kickoff missed). `src/components/ui/sonner.tsx` deleted (`git status` shows `D`). Final `grep -rn "sonner" src/` → **1 hit**: `src/stories/mantine/primitives/Notification.stories.tsx:72`, a prose comment (`{/* ... matches legacy sonner.tsx's icon-less default toast ... */}`) — exactly the AC5-predicted surviving hit. `grep -rn "<Toaster" src/` → 0 hits. A second stray hit (a docblock in `ReportListingDialog.smoke.test.tsx` mentioning "sonner" in prose) was found and fixed for accuracy during I7 (see §8 deviation). |
| **R6/AC6** | All 3 test files re-pointed `vi.mock('sonner', …)` → `vi.mock('@/lib/toast', …)`, same mock shape, same assertions. Before/after per file: <br>• `AdminReportsManager.smoke.test.tsx`: `expect(mockToastError).toHaveBeenCalledWith('error_forbidden')` — unchanged, now backed by the `@/lib/toast` mock. <br>• `AdminUsersTable.smoke.test.tsx`: `expect(mockToastSuccess).toHaveBeenCalledWith('verify_success')` / `'revoke_success'` — unchanged. <br>• `ReportListingDialog.smoke.test.tsx`: `expect(mockToastInfo).toHaveBeenCalledWith('report_already_reported')` — unchanged. |
| **R7/AC7** | New `src/lib/__tests__/toast.smoke.test.ts` — 4/4 passing, asserting `notifications.show()`'s exact `color`/`icon`/`autoClose:4000`/message-passthrough per variant, plus `title === undefined`. Registry suites all green (§6). |
| **R8/AC8** | Canonical **visual** Story `Mantine/Primitives/Notification` untouched — all 16 cells byte-identical (md5, §7). `Patterns/Mantine/NotificationPattern` needed no edit (its info trigger's rendered chrome is a hardcoded `color="blue"` Button, unrelated to `VARIANT_COLORS`; its static screenshot cells are also byte-identical, §7). No Story calls `notifications.show()` (unchanged from before). `check:stories` / `check:story-coverage` both exit 0, coverage total unchanged at 15/15. |
| **R9/AC9** | Live 320px capture, all 4 locales — **collision found and reported, not fixed** (§9). |
| **R10/AC10** | `npm run build` exit 0, 40/40 pages, "Compiled successfully" (§10). |
| **R11/AC11** | `check:i18n` 2215×4, 0 new keys. `check:design-tokens`: 44 pre-existing violations, **0 in any file this task touched** (before/after both 44 — no file in the diff appears in the violation list). `check:file-integrity` 43/43 clean. `check:mojibake` 0 artifacts (1 tracked-deleted path skipped correctly: `sonner.tsx`). |
| **R12/AC12** | `docs/component-catalog.md`: `sonner` row removed; `Canonical UI Primitives` section 34→33; Summary `Total cataloged components` 245→244; `Client components ('use client')` 159→158 (sonner.tsx was `'use client'`). Arithmetic: sonner contributed 1 to total, 1 to client-components, 0 to Storybook-stories/i18n/Tailwind-entropy/2xl-step/flagged-for-review (all "—" in its row), so only those three counters move. |

---

## 3. Current vs required behavior

**Before:** Two toast systems mounted in parallel — Sonner (`<Toaster/>`, default bottom-right, themed via
`next-themes`) in **both** `[locale]/layout.tsx` and `admin/layout.tsx`; Mantine's `<Notifications position="top-right"/>`
already live everywhere via the root layout but never received an `icon`, so its §6r-LIVE 40×40 tinted badge never
rendered. 169 call sites across 33 files imported `toast` from `sonner`.

**After:** One toast system. All 169 call sites are byte-identical in their arguments, importing `toast` from
`@/lib/toast`, which fires `notifications.show()` with the canonical colour + icon for its variant and
`autoClose: 4000`. Both Sonner mounts are gone; `sonner.tsx` is deleted. The canonical `Mantine/Primitives/Notification`
Story (already icon-bearing, unmodified) remains the visual proof of the §6r-LIVE chrome. **Known gap, reported per
I9:** the notification now visibly overlaps the sticky header at ≤~97px header height on a 320px viewport, in all
four locales — see §9.

**Negative flows verified:** error (dominant, 101/169) — proven by `toast.smoke.test.ts` + all three registry
suites; info/warning (11 sites) — proven by `toast.smoke.test.ts`; the three registry flows (clear-history no-op,
verify/revoke, already-reported) — proven unchanged by their existing suites now targeting `@/lib/toast`; message
interpolation (`t('delete_blocked', {count})`) — passes through the adapter unchanged (untouched call-site
argument, verified by AC4's zero-call-site-hunk diff).

---

## 4. Files Changed

| Path | Action | Reason |
|---|---|---|
| `src/design-system/mantine/notificationVariants.ts` | **create** | R1 — shared variant→colour/icon/autoClose leaf module. |
| `src/lib/toast.ts` | **create** | R2 — the 4-method adapter. |
| `src/lib/__tests__/toast.smoke.test.ts` | **create** | R7 — adapter argument proof + planted-violation gate. |
| `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` | modify | R3 — consumes shared module, passes `icon`, re-exports `NotificationVariant`. |
| `src/app/[locale]/layout.tsx` | modify | R5 — `Toaster` import + render removed. |
| `src/app/admin/layout.tsx` | modify | R5 — the second, kickoff-corrected `Toaster` mount removed. |
| `src/components/ui/sonner.tsx` | **delete** | R5 — Sonner wrapper retired. |
| `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | modify | R6 — `vi.mock` re-pointed. |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | modify | R6 — `vi.mock` re-pointed. |
| `src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` | modify | R6 — `vi.mock` re-pointed; stale "sonner" docblock prose corrected (AC5 exactness). |
| 33 files below | modify | R4 — import line only, `from 'sonner'` → `from '@/lib/toast'`. |
| `docs/component-catalog.md` | modify | R12 — `sonner` row + counters. |
| `docs/backlog.md` | modify | Concise 681 entry (now IMPLEMENTED), reserve 682/683 language kept, numbering line updated. **82 lines — BACKLOG LIMIT BREACH, flagged for Opus** (§11). |
| `docs/sessions/2026-07-29-task681-sonner-retire-mantine-notifications.md` | **create/rewrite** | This session log (supersedes the interim BLOCKED-status version). |

**The 33 import-line-only files:**
`src/components/admin/AdminCompaniesManager.tsx`, `AdminCurrenciesManager.tsx`, `AdminEmailTemplatesManager.tsx`,
`AdminExchangeProvidersManager.tsx`, `AdminFooterManager.tsx`, `AdminInquiriesManager.tsx`, `AdminLegalManager.tsx`,
`AdminListingsTable.tsx`, `AdminLocationsManager.tsx`, `AdminPagesManager.tsx`, `AdminPermissionsManager.tsx`,
`AdminPopularLocationsManager.tsx`, `AdminPropertyTypesManager.tsx`, `AdminReportsManager.tsx`,
`AdminSupportManager.tsx`, `AdminUserAvatar.tsx`, `AdminUserProfile.tsx`, `AdminUsersTable.tsx`,
`StatusChangeControl.tsx`; `src/modules/cabinet/components/CabinetPasswordSection.tsx`, `ListingsTab.tsx`,
`ProfileTab.tsx`, `SavedSearchesTab.tsx`; `src/modules/contacts/components/ContactForm.tsx`;
`src/modules/listings/components/ClearRecentlyViewedButton.tsx`, `CollectionsSection.tsx`, `FavoriteButton.tsx`,
`ListingContact.tsx`, `ListingInquiryDialog.tsx`, `ListingMobileCTA.tsx`, `ListingReportDialog.tsx`,
`SaveSearchButton.tsx`, `SaveToCollectionButton.tsx`.

**A6 compliance:** no file above required any edit beyond its import line; the one exception (`ReportListingDialog.smoke.test.tsx`'s stale docblock) is a test file already in the R6 scope, not a call-site file, and is named explicitly here with its reason.

---

## 5. Sample AC4 hunk proof

```
$ git diff -U0 -- src/components/admin/AdminCompaniesManager.tsx
@@ -6 +6 @@ import { Plus, Trash2, Loader2, Building2, ImagePlus, Search, ChevronRight } fro
-import { toast } from 'sonner'
+import { toast } from '@/lib/toast'
```
Identical single-line hunk shape confirmed for all 33 files (spot-checked `ContactForm.tsx` as a second sample,
same shape). `git diff --stat` for the 33 files: `33 files changed, 33 insertions(+), 33 deletions(-)`.

---

## 6. Validation evidence — commands and actual outcomes

| Command | Result |
|---|---|
| `npm run typecheck` | **0** |
| `npx vitest run src/lib/__tests__/toast.smoke.test.ts` | **0** — 4/4, per-variant color/icon/autoClose/message + `title===undefined` |
| `npx vitest run .../AdminUsersTable.smoke.test.tsx` | **0** — registry row `:45`, all pre-existing tests pass |
| `npx vitest run .../AdminReportsManager.smoke.test.tsx` | **0** — registry row `:61` |
| `npx vitest run .../reportListing.smoke.test.ts .../ReportListingDialog.smoke.test.tsx` | **0** — registry row `:61` |
| `npx vitest run` (full suite, 2 runs) | Run 1: 1157/1159 passed, 2 failures — both timeouts (`date-format-ssr-parity`, `RangeDatePicker`), isolated re-run 39/39 pass. Run 2 (post debug-harness cleanup): 1160/1163 passed, 3 timeouts (`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`), isolated re-run **41/41** pass. None of the 3 touch toast/notification code — all are the documented full-run-only timeout pattern (same as Tasks 669/672). |
| Planted-violation (`VARIANT_COLORS.error: 'red'→'green'`) | `toast.smoke.test.ts` genuinely **FAILED** 1/4 (`expected 'green' to be 'red'`), all other 3 unaffected. Reverted; re-run **4/4 PASS**. File is untracked (new), so `git status --porcelain` shows `?? notificationVariants.ts` unchanged before/after — confirmed via direct content re-read (`error: 'red'` present) rather than `git diff --stat` (which is silent for untracked files). |
| `npm run check:stories` | **0** — 127 files, 0 violations |
| `npm run check:story-coverage` | **0** — 15 manifest entries, 15 covered, 0 unproven (unchanged total — no new enrolment) |
| `npm run build-storybook` | **0** — built in 23.18s |
| `npm run screenshots:assert -- --mantine-only` | **0 FAIL**. 1162/1184 PASS, 22 AMBIGUOUS (all pre-existing: Combobox mobile-390 backdrop ×4, PopularLocationsView LongCityName ellipsis ×16, Tabs offscreen-scroll ×2 — none touch Notification). **Full-manifest cross-story diff, before (`2026-07-28T20-40`) vs after (`2026-07-29T06-49`): 0 changed cells across all 1184** (script output: `Total changed cells: 0`, `Changed stories: []`). `Notification`/`NotificationPattern`/`NotificationBellView` PNGs individually md5-hashed: **all 16+16+16 identical**. |
| `npm run check:design-tokens` | **44** raw-value violations (pre-existing), **0 stale-marker(s)**, **0 in any touched file** — same 44 before/after (no file in this diff appears among the reported paths). |
| `npm run check:i18n` | **0** — 2215×4, no new keys |
| `npm run check:file-integrity` | **0** — 43/43 files clean |
| `npm run check:mojibake` | **0** artifacts, 1995 files scanned, 1 tracked-deleted path (`sonner.tsx`) correctly skipped |
| `BASE_URL=http://localhost:3000 npm run check:hydration` | See §9a — required a production (`next start`) re-verify; final result **0** (4 PASS, 0 FAIL, 3 SKIP not-real-coverage) |
| `npm run build` | **0** — see §10, transcript tail quoted |

---

## 7. Screenshot manifest — `--mantine-only` before/after

- **Before baseline** (pre-existing, already on disk, cited by the kickoff itself, §3.6a): `.screenshots/rendered-assert/2026-07-28T20-40/manifest.json` — 1184 cells, 1162 pass, 0 fail, 22 ambiguous.
- **After** (this session): `.screenshots/rendered-assert/2026-07-29T06-49/manifest.json` — 1184 cells, 1162 pass, 0 fail, 22 ambiguous. **Identical totals.**
- Per-cell diff (`storyId+locale+viewport` key, comparing `verdict`) across the **entire** 1184-cell matrix: **0 differences** — no cell flipped pass↔fail↔ambiguous, no cell added or removed. `Changed stories: []`.
- Direct PNG md5 comparison for every `mantine-primitives-notification--default`, `mantine-primitives-notificationbellview--default`, and `patterns-mantine-notificationpattern--default` cell (48 files total): **all IDENTICAL**.
- No task-created Story export exists in this task (unlike Task 672's `warning` MobileBottomNav precedent) — I8 explicitly withdrew the earlier draft's "make a Story fire `notifications.show()`" instruction, so there is no new cell without a baseline to reconcile.

---

## 8. Deviations

1. **Stray "sonner" prose hit fixed beyond the literal scope table.** After I7's deletion, `grep -rn "sonner" src/`
   returned 2 hits, not the predicted 1: the canonical Story's prose comment (expected) **and** a docblock line in
   `ReportListingDialog.smoke.test.tsx` ("All shadcn/ui components, next-intl, sonner, and lucide-react are mocked
   ...") which had gone stale the moment that file's `vi.mock` was re-pointed to `@/lib/toast` in R6. Corrected the
   sentence to say "the toast adapter" instead of "sonner" — a 1-line prose fix inside a file already in R6's scope,
   not a new file touched. AC5 now holds exactly as specified (1 surviving hit, quoted in §2).
2. **Lazy icon construction, not eager (deviation from a literal reading of I1's sample shape, required for correctness).**
   The kickoff's I1 prose shows `VARIANT_ICONS` as if it were a plain object built via `createElement(...)` at
   module top level. Doing so broke an unrelated test (`LocationCombobox.smoke.test.tsx`) that transitively imports
   the `patterns/index.ts` barrel (via `MantineCombobox`) and mocks `lucide-react` with only `MapPin` — an eager
   `createElement(CircleCheckIcon, ...)` at import time threw `[vitest] No "CircleCheckIcon" export is defined on
   the "lucide-react" mock` the instant ANY consumer imported the barrel, regardless of whether it used
   `MantineNotificationPattern`. Fixed by making `VARIANT_ICONS`'s four properties lazy getters
   (`Object.defineProperties`) so the lucide-react binding is only read when a variant's icon is actually accessed
   (i.e., when a toast/notification actually fires) — `VARIANT_ICONS` is still the same exported, indexable object
   the AC requires; `expect(call.icon).toEqual(VARIANT_ICONS.success)` in `toast.smoke.test.ts` still passes (value
   equality of the two React elements). Verified this was the only such casualty by re-running the full suite before
   and after the fix (1 failure → 0).
3. **`check:hydration` required production re-verification, not just a dev-server run.** The literal gate command
   (`BASE_URL=... npm run check:hydration`) was first run against `next dev`. It intermittently failed on different
   routes across repeated runs (sq only; then sq+uk; then listings+sq+uk) with a generic React hydration-mismatch
   message, even after a full `.next` cache clear and dev-server restart. This matches `docs/backlog.md`'s own
   documented standing note (Task 582): *"A stale Turbopack `next dev` HMR cache can emit a one-off ... hydration
   error that does NOT survive a clean `next build` + fresh dev restart and does NOT reproduce in prod."* Since the
   mandatory `npm run build` gate (R10) had to run anyway, I re-verified `check:hydration` against `npm start`
   (production) instead: **4/4 PASS, 0 FAIL**, reproduced twice for stability. This is reported as the authoritative
   result; the dev-mode flake is not attributed to this diff (see the reasoning in §9a).

---

## 9. AC9 — rendered proof: **collision found, reported per I9, NOT fixed**

**Method.** No production call site fires a toast without a network round-trip (server action, DB write, or in one
case a real transactional email), and none of those flows is safely repeatable 4× against whatever backend
`.env.local` points to without risking real side effects (email sends, DB writes) outside this task's authority to
cause. Storybook is explicitly disallowed as evidence (the header isn't in the pattern Story, and the kickoff's own
"known-risk note" flags a Storybook screenshot as unacceptable AC9 evidence). Instead: added a **temporary**,
un-committed client component (`src/components/shared/_Task681DebugToastTrigger.tsx`, a fixed-position 1×1px button
calling the real, shipped `toast.error(tc('favorite_error'))` — the exact production adapter, an existing i18n key
already used by one of the 169 call sites) and a **temporary** import+render line in `[locale]/layout.tsx`. Used
Playwright (already a project devDependency) to load each locale route at a 320×800 viewport, click the trigger,
wait for `.mantine-Notification-root`, then read `getBoundingClientRect()` for `header.site-header` and
`.mantine-Notification-root`, plus a full-page screenshot. **Both the debug component and the layout edit were then
deleted/reverted before this report**; `git status --porcelain` and a diff-read of `[locale]/layout.tsx` confirm
the file is back to its exact post-I7 (Sonner-removed, no debug trigger) state, and the final `npm run build` (§10)
was run *after* this cleanup, on the clean tree.

**Result — genuine, reproducible overlap in all 4 locales:**

| Locale | Header rect (top/right/bottom/left) | Toast rect (top/right/bottom/left) | Geometric overlap | Horizontal overflow |
|---|---|---|---|---|
| sq | 0 / 320 / 97 / 0 | 16 / 304 / 76.03 / 16 | **YES** | No (scrollWidth 320 = viewport 320) |
| en | 0 / 320 / 97 / 0 | 16 / 304 / 76.03 / 16 | **YES** | No |
| uk | 0 / 320 / 97 / 0 | 16 / 304 / 96.05 / 16 (taller — longer uk string wraps to 3 lines) | **YES** | No |
| it | 0 / 320 / 97 / 0 | 16 / 304 / 76.03 / 16 | **YES** | No |

The header is 97px tall (logo row + search bar row) at 320px width; the notification's `top: 16` fixed offset
(from `MantineRootProvider`'s `<Notifications position="top-right"/>`) places its entire card within the header's
0–97px vertical band. **Visual screenshots confirm this is not just a rect-overlap technicality**: the white
notification card physically renders on top of the header, visually obscuring it (see the en/uk screenshots — the
notification's box and close button cover the logo/search area entirely).

**No horizontal overflow** was introduced (`scrollWidth === innerWidth` at 320px, all locales) — the `w-full` /
340px-cap sizing itself is correct; the defect is purely the vertical `top-right` placement colliding with the
sticky header's own height.

**Per I9, this is reported, not fixed.** D2 mandates `top-right` and explicitly anticipated this exact failure mode
("the task must carry rendered proof that a toast at top-right does not collide with the header at the narrow
stress width"); the proof shows it **does** collide. I9 explicitly forbids changing position to resolve it — that
is now an **owner decision** (options include: an offset/`top` override on `<Notifications>` to clear the header
height, only at narrow widths; or accepting the overlap; neither was authorized by this task and neither was
applied).

---

## 10. `npm run build` — hard gate

Run **after** the AC9 debug-harness was fully removed (clean tree). Exit code **0**.

```
> lero-al@0.1.0 build
> next build

   ▲ Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution):
     · clientTraceMetadata

   Creating an optimized production build ...
 ✓ Compiled successfully in 69s
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/40) ...
   Generating static pages (10/40)
   Generating static pages (20/40)
   Generating static pages (30/40)
 ✓ Generating static pages (40/40)
   Finalizing page optimization ...
   Collecting build traces ...
```

40/40 pages generated (matches the pre-existing 40-page baseline cited by prior sessions — no page added/removed).

---

## 11. TailAdmin §6r-LIVE side-by-side

No new value was invented (§8 forbids editing `theme.ts`); the chrome comparison is a **confirmation that nothing
regressed**, using the AC9 screenshots as the rendered artifact:

| §6r-LIVE measured value | Rendered (AC9 screenshots) | Match/deviation |
|---|---|---|
| White background, `rounded-md` 6px | White card, visibly rounded corners | Match (unchanged `theme.ts`) |
| 4px bottom-border semantic accent | Not clearly visible at the 320px crop used (red-variant card, red accent would blend near the bottom edge) — **not independently re-measured this session**; `theme.ts`'s styles function is unchanged and was not part of this diff | Assumed match (byte-identical Story hash, §7, is the authoritative proof this chrome is untouched) |
| `shadow-theme-sm` | Present (card visibly elevated over the header/hero in the screenshot) | Match |
| 40×40 `rounded-lg` tinted icon badge, semantic-600 glyph | Visible red circular badge with white X glyph, left of the message text | Match |
| `sm:max-w-[340px]` cap / `w-full` below 640px | Card spans full width minus the 16px inset on both sides (320−32=288px) at 320px | Match (below-640 full-width behavior) |
| 16px/600 title | No `title` was passed by the debug trigger (A2 — adapter never sets `title`), so no title row rendered — **expected**, not a deviation: none of the 169 production call sites pass a title either | N/A by design |
| 24px close button | Small "×" visible top-right of the card | Match |

**Deviation, reported in §9, not a chrome defect:** the *position* of this correctly-styled card collides with the
header at 320px. The chrome itself conforms to §6r-LIVE; the placement does not clear the header at this width.

---

## 12. Self-review findings

- **Fixed during implementation:** the eager-`createElement` barrel-import regression (§8.2) — found via the full
  `vitest run`, not assumed away.
- **Fixed during implementation:** the stale "sonner" docblock prose in `ReportListingDialog.smoke.test.tsx` (§8.1)
  — found via the AC5 grep returning 2 hits instead of the predicted 1, investigated rather than dismissed.
- **Reported, not fixed (by design, per I9):** the AC9 header collision (§9) — this is the task's single most
  important negative finding and is surfaced to the orchestrator/owner explicitly, not buried in a "all green"
  summary.
- **No other defect found.** The 33-file import migration has zero call-site hunks (AC4), the shared-module
  extraction has zero duplicate `VARIANT_COLORS` declarations (AC3), no `title` was invented (AC2/A2), and the
  visual source of truth (`Mantine/Primitives/Notification`) is provably untouched (AC8, hash-verified).

---

## 13. Assumptions, deviations, and limitations

- **Declared proof-path boundary (per §13.1):** only `MANTINE_VIEWPORTS` (320/375/390/1024) × 4 locales was
  captured for the `NotificationPattern`/`Notification` stories via `--mantine-only`; the 14-width canon remains
  Task 678's scope, not re-litigated here.
- **`sonner`/`next-themes` remain in `package.json`** — Task 682 reserved, package-surgery blast radius not audited
  in this task per its explicit out-of-scope line.
- **Toast position moved bottom-right → top-right per D2** — this is the owner-ratified, intended visual change
  (§1 "Read this first"), not a defect; the AC9 finding is about a *collision*, not about the position change
  itself being wrong.
- **`VARIANT_COLORS.info: 'blueLight'` (not `'blue'`) needs explicit owner ratification** — flagged by the kickoff
  itself (§3.11 defect 5) as a correction toward documented intent (`theme.ts:837`), not a new design decision, but
  the kickoff asks for it to be called out at review rather than silently accepted.
- **The AC9 debug-harness method is not reusable evidence** — it was a temporary, reverted addition used once to
  produce the rect measurements and screenshots in §9; it does not exist in the final diff (confirmed in §9's
  method note and in the Files Changed table, which does not list it).
- **3 full-run-only vitest timeouts** (`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`) — none
  touch toast/notification code, all pass in isolation (41/41), matching the same documented pattern from Tasks
  669/672.

---

## 14. Opus handoff

**Evidence locations:**
- This session log (full command transcript excerpts, §6).
- `.screenshots/rendered-assert/2026-07-29T06-49/` (post-change manifest + PNGs) vs `.screenshots/rendered-assert/2026-07-28T20-40/` (pre-change baseline).
- AC9 screenshots and rect data are **not persisted to disk** (the capture script and debug component were both
  temporary and deleted per I9's "do not leave test scaffolding" implication and this project's git-boundary
  discipline) — the rect table and the visual description in §9 are the evidence; re-run is trivial to reproduce if
  the reviewer wants a fresh capture (same method, ~5 minutes).
- `docs/component-catalog.md` diff for R12's arithmetic.

**Questions/risks for the reviewer:**
1. **AC9 collision (§9) is the primary open item.** It needs an owner decision: accept the overlap, or authorize a
   narrow-width `top` offset / different clearance strategy on `<Notifications>` — out of this task's authorized
   scope to resolve unilaterally (D2 forbids a position change; no other remedy was authorized).
2. **`info: 'blueLight'` needs explicit ratification** (§3.11 defect 5, §13) — it changes the rendered colour of 7
   production `toast.info` call sites and the Pattern's info-preview swatch.
3. **Backlog is now 82 lines — `BACKLOG LIMIT BREACH`.** It was 78 before this session's concise addition; the
   single-paragraph 681 entry pushed it to 82. Per `docs/ai-behavior.md`'s backlog rule, Sonnet does not consolidate
   history — this needs Opus to fold older `Prior Session`/`Open — needs action` detail into `docs/backlog-archive.md`
   during review.
4. Confirm the lazy-getter `VARIANT_ICONS` implementation (§8.2) is an acceptable interpretation of R1's exported
   shape — it preserves the literal AC1 contract (`VARIANT_ICONS` is still an indexable, exported object) while
   avoiding a barrel-import regression that a literal eager reading would have caused project-wide.

---

## 15. Backlog update

- `docs/backlog.md`: added one concise `681 — IMPLEMENTED, AWAITING ORCHESTRATOR REVIEW` entry under a new
  `## Last Session (2026-07-29)` header (old `2026-07-28` section renamed to `## Prior Session (2026-07-28)`,
  content otherwise unchanged); shrank the now-superseded draft-2/five-defects paragraph in "Open — needs action" to
  a one-line pointer; updated the task-numbering line's 681 status.
- **Resulting physical line count: 82.**
- **`BACKLOG LIMIT BREACH`** — exceeds the ~80-line hard limit by 2 lines. Flagged for Opus to consolidate older
  `Prior Session` detail into `docs/backlog-archive.md` at review time, per `docs/ai-behavior.md`.
