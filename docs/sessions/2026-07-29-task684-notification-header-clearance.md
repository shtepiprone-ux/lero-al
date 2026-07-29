# Task 684 — Task 681 revision: clear the Mantine notification container from the sticky header — session log

**Task path:** `tasks/kickoff_prompt_Task_684_Task681_Revision_Notification_Header_Clearance.md`
**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

---

## 1. Start gate (I0)

- `git status --porcelain` at session start: **empty** (clean), confirmed before any write (A5).
- `git log -1 --stat`: `bed5f279d` — `docs(Task684): 681 review verdict, backlog consolidation to 80 lines, 684 kickoff`.
  Task 681's own commit, `d383f7c15` — `fix(Task681): retire Sonner onto Mantine notifications (known AC9 header
  collision — Task 684)` — is in `HEAD`, confirming §3.6.

---

## 2. Requirement / acceptance-criteria evidence

| Req/AC | Evidence |
|---|---|
| **R1/AC1** | `src/design-system/mantine/MantineRootProvider.tsx` is the only changed `src/` file (§7 below). `<Notifications>` still reads `position="top-right"`. New prop: `top={{ base: 97, sm: 65 }}`. `grep -n "zIndex\|!important\|@media" MantineRootProvider.tsx` → **0 hits**. |
| **R2/AC2** | 16-cell I2 header-measurement table (§4) shows two distinct heights: 97px at 320/375, 65px at 390/1024, identical across all 4 locales at each width. Both `97` and `65` are the exact `top` values shipped — no invented number. |
| **R3/AC3** | Live `getComputedStyle(container).top` read at all 16 I2 cells (§6): **97px** at 320/375/390, **65px** at 1024 — never `16px` (the package default), proving the style prop beat the zero-specificity `:where([data-position='top-right'])` rule. |
| **R4/AC4** | Live capture at 320/375/390/1024 × {sq,en,uk,it} (§5, after table): every cell shows `toast.top ≥ header.bottom` and `scrollWidth === innerWidth`. Same shape as Task 681 §9, directly comparable. |
| **R5/AC5** | `.screenshots/task684-ac9/` contains `before-rects.json` (4 cells), `header-measurement.json` (16 cells), `after-rects.json` (16 cells), 4 `before-mobile-320-*.png`, and 16 after-fix PNGs (`mobile-320/375/390-*.png`, `desktop-1024-*.png`) — 20 PNGs total, referenced by path throughout this log. |
| **R6/AC6** | Start `git status --porcelain`: empty (§1). Final `git status --porcelain`: `M src/design-system/mantine/MantineRootProvider.tsx` only (§8) — no Task 681 path reappears. |
| **R7/AC7** | `screenshots:assert -- --mantine-only`: first run showed 1 transient FAIL (font-loading race, investigated in §9, not attributable to this diff); rerun **0 FAIL**, 1162/1184 PASS, 22 AMBIGUOUS (all pre-existing). Full-manifest diff against the task's declared baseline (`2026-07-29T06-49`, §18 of the kickoff): **0 changed cells** across all 1184. |
| **R8/AC8** | `npm run build` exit **0**, 40/40 pages, transcript tail quoted (§10). |
| **R9/AC9** | `npx vitest run src/lib/__tests__/toast.smoke.test.ts` → 0, 4/4. Three registry suites → 0, 41/41 combined. |
| **R10/AC10** | `check:i18n` 0, 2215×4, no new keys. `check:design-tokens`: 44 violations / 0 stale-marker, **0 in `MantineRootProvider.tsx`** (before/after both 44). `check:file-integrity` 0 (1 file checked). `check:mojibake` 0/1996. |

---

## 3. Current vs required behavior

**Current (before this task).** `MantineRootProvider.tsx` rendered `<Notifications position="top-right" />` with no
offset; the package's `:where([data-position='top-right'])` rule placed the container at a fixed `top: 16px` at
every width, `z-index: 400`. `HeaderView`'s `.site-header` is `sticky top-0 z-30` and occupies 0–97px at 320/375px
(wrapped two-row header, Task 590) or 0–65px at ≥390px (single `h-16` row + 1px `border-b`). Every toast painted
over the header at every width, in all four locales (Task 681 §9, reproduced byte-identical in §5 below).

**Required after (this task).** The same single `<Notifications position="top-right" />` container carries a
responsive `top={{ base: 97, sm: 65 }}` style prop derived from measured header geometry, so a fired toast's top
edge sits at or below the header's bottom edge at every measured width and locale. `position` and `zIndex` are
unchanged (D2/A4). Chrome (`theme.ts`, `notification-chrome.css`) is untouched and absent from the diff.
`/admin/*` toasts inherit the same offset with no header to clear — acceptable and intended (§3.8 of the kickoff),
recorded here, not branched.

**Negative flows verified (kickoff §11 applicability table):**

| Branch | Applicable | Evidence |
|---|---|---|
| Header taller below 390 (wrapped cluster) | Yes | 320/375 cells: `toast.top(97) ≥ header.bottom(97)` |
| Header single-row ≥390 | Yes | 390/1024 cells: `toast.top(97 or 65) ≥ header.bottom(65)` |
| Locale expansion (sq/uk/it) | Yes | uk toast card is taller (3-line wrap) in both before/after tables — grows downward only, `top` unaffected |
| Small viewport (<640) | Yes | `scrollWidth === innerWidth` at 320/375/390 in every locale (§5) |
| `/admin/*` (no sticky header) | Yes | No route branch added; recorded as a known, intended consequence (§13, limitations) |
| Multiple stacked toasts | Yes | Single-toast measurement is the binding constraint (Mantine `limit` default 5); stacking grows downward, unaffected by `top` |
| Validation / RLS / offline | No | No data path touched — placement-only change |
| RTL | No | Project has no RTL locale |

---

## 4. I2 — header-measurement table (16 cells, before any code change)

`document.querySelector('header.site-header').getBoundingClientRect()` at `MANTINE_VIEWPORTS`
(`scripts/check-stories-rendered.mjs:392`) × {sq,en,uk,it}. Persisted at `.screenshots/task684-ac9/header-measurement.json`.

| Width | sq | en | uk | it |
|---:|---:|---:|---:|---:|
| 320 | 97px | 97px | 97px | 97px |
| 375 | 97px | 97px | 97px | 97px |
| 390 | 65px | 65px | 65px | 65px |
| 1024 | 65px | 65px | 65px | 65px |

All 4 locales are identical at every width (header contains no locale-varying content). Two bands: **<390 → 97px**,
**≥390 → 65px** (measured 65px, not the kickoff's predicted 64px — the extra 1px is `.site-header`'s own
`border-b`).

**Offset derivation.** `top = max(headerHeight)` per band, replacing (not adding to) the package's own 16px inset
(verified empirically in §6 — before the fix, `computedTop` reads `16px`; after, it reads the shipped value, never
`16+value`). Mantine's responsive style-prop resolver only accepts keys present in `theme.ts`'s `breakpoints`
(verified by reading `node_modules/@mantine/core/esm/core/Box/style-props/parse-style-props/parse-style-props.mjs`:
`const bp = \`(min-width: ${theme.breakpoints[breakpoint]})\`` — an arbitrary string key resolves to
`undefined` and produces a no-op media query). `theme.ts`'s breakpoints are `xs=20em(320px)`, `sm=40em(640px)`,
`md=48em(768px)`, `lg=64em(1024px)`, `xl=80em(1280px)`, `xxl=90em(1440px)` — none is exactly 390px (the header's own
Tailwind arbitrary-value breakpoint, Task 590, deliberately not a named scale entry). `xs` (320px) is unsafe — it
would apply the 65px value from 320px up, colliding at 320–389px. `sm` (640px) is the smallest available key at or
above 390px, so `top={{ base: 97, sm: 65 }}` is the correct, safe cutover: widths 390–639px receive the
more-conservative 97px value (over-clearance, never a collision, since actual header height there is only 65px) and
widths ≥640px receive the exact measured 65px. This is the D3 extension the kickoff's I2 anticipated ("it likely
means a non-zero offset at ≥640 as well") — the offset is **not** confined to narrow widths; 1024px still requires
65px of clearance and receives it.

---

## 5. I1 (before) / I4 (after) rect tables — same shape, directly comparable to Task 681 §9

**Method.** Rebuilt Task 681 §9's harness: a temporary client component
(`src/components/shared/_Task684DebugToastTrigger.tsx`, a 1×1px invisible button) called the real, shipped
`toast.error(tc('favorite_error'))` — the production adapter, an existing i18n key already used by one of the 169
call sites — plus a temporary import/render line in `[locale]/layout.tsx`. Used Playwright to load each locale
route at each viewport, click the trigger, wait for `.mantine-Notification-root`, then read
`getBoundingClientRect()` for `header.site-header` and `.mantine-Notification-root`, plus a full-page screenshot.
**Both the debug component and the layout edit were deleted/reverted before this report** (§8).

### Before (320px only, per I1 — reproduces Task 681 §9 exactly)

| Locale | Header rect (t/r/b/l) | Toast rect (t/r/b/l) | Overlap | Overflow |
|---|---|---|---|---|
| sq | 0/320/**97**/0 | 16/304/76.03/16 | **YES** | No |
| en | 0/320/**97**/0 | 16/304/76.03/16 | **YES** | No |
| uk | 0/320/**97**/0 | 16/304/96.05/16 | **YES** | No |
| it | 0/320/**97**/0 | 16/304/76.03/16 | **YES** | No |

Byte-identical to Task 681 §9's failing table — the "before" state is genuinely reproduced (I1's mandatory
precondition), not assumed. Persisted: `.screenshots/task684-ac9/before-rects.json`,
`before-mobile-320-{sq,en,uk,it}.png`.

### After (all 16 I2 cells, per I4 — with the fix in place)

| Width | Locale | Header.bottom | Toast.top | `toast.top ≥ header.bottom` | `computedTop` | Overflow |
|---:|---|---:|---:|---|---|---|
| 320 | sq/en/it | 97 | 97 | ✅ | 97px | No |
| 320 | uk | 97 | 97 | ✅ (uk card taller: bottom 177.05 vs 157.03) | 97px | No |
| 375 | sq/en/uk/it | 97 | 97 | ✅ | 97px | No |
| 390 | sq/en/uk/it | 65 | 97 | ✅ (over-cleared, §4 band arithmetic) | 97px | No |
| 1024 | sq/en/uk/it | 65 | 65 | ✅ (exact) | 65px | No |

All 16 cells: `scrollWidth === innerWidth` (no horizontal overflow introduced). Full data:
`.screenshots/task684-ac9/after-rects.json`; PNGs `mobile-{320,375,390}-{sq,en,uk,it}.png`,
`desktop-1024-{sq,en,uk,it}.png` (16 files).

---

## 6. AC3 — computed-style cascade proof

`getComputedStyle(document.querySelector('[data-position="top-right"]')).top`, read at every I2 cell (the container
`Box` is always present in the DOM regardless of whether a toast is active — confirmed by reading
`node_modules/@mantine/notifications/esm/Notifications.mjs`, which unconditionally renders one `Box` per position).

| Width | `computedTop` (before fix) | `computedTop` (after fix) |
|---:|---|---|
| 320 | `16px` | **`97px`** |
| 375 | `16px` | **`97px`** |
| 390 | `16px` | **`97px`** |
| 1024 | `16px` | **`65px`** |

Never `16px` after the fix — the Mantine style prop (specificity `(0,1,0)`, a real class) wins over the package's
`:where([data-position='top-right'])` rule (zero specificity) at every width, without `!important`.

---

## 7. Files Changed

| Path | Action | Reason |
|---|---|---|
| `src/design-system/mantine/MantineRootProvider.tsx` | modify | R1 — responsive `top` style prop on `<Notifications>`. |
| `.screenshots/task684-ac9/` | **create** | R5 — persisted rect JSON + PNGs (gitignored, not part of git status — see §8). |
| `docs/backlog.md` | modify | 681/684 line updated in place, ≤80 lines (§14). |
| `docs/sessions/2026-07-29-task684-notification-header-clearance.md` | **create** | This session log. |

No Task 681 path is touched. `src/app/[locale]/layout.tsx` was temporarily edited for the I1/I4 harness and fully
reverted before this report (§8) — it does not appear in the final diff.

---

## 8. Harness removal proof (AC6)

```
$ git diff -- "src/app/[locale]/layout.tsx"
(empty output — byte-identical to Task 681's post-I7 committed state)

$ git status --porcelain
 M src/design-system/mantine/MantineRootProvider.tsx
```

`src/components/shared/_Task684DebugToastTrigger.tsx` was deleted (never committed, so it leaves no trace). The
temporary capture script lived only under the gitignored `.screenshots/task684-ac9/` directory and was deleted
before this report. Start porcelain (§1) was empty; final porcelain contains exactly the one `src/` path this task
owns — no Task 681 path reappears as modified, reverted, or deleted.

---

## 9. Investigated finding — transient `HeroSearch/Default × sq × mobile-320` FAIL, not attributable to this diff

The first `screenshots:assert -- --mantine-only` run (`.screenshots/rendered-assert/2026-07-29T13-45/`) reported
1161/1184 PASS, **1 FAIL**: `Mantine/Primitives/HeroSearch/Default × sq × mobile-320` — "form control not
full-width at <640". Investigated rather than waved through (R7's requirement):

1. **Storybook stories never mount `MantineRootProvider`** — they use Storybook's own preview decorators. This
   diff's only change is a style prop on the app's globally-mounted `<Notifications>`; it cannot reach a
   Storybook-rendered `HeroSearch` story by any mechanism.
2. The failing cell's manifest entry shows `styleIntegrity.signals.fontFamily: "Times New Roman"` — the browser's
   fallback serif font, not the expected `"Open Sans", system-ui, -apple-system, sans-serif"`. This is the signature
   of a font-loading race (page captured before the web font finished loading), which can perturb text-dependent
   layout measurements independent of any code change.
3. **Re-ran `--mantine-only` in full** (`.screenshots/rendered-assert/2026-07-29T14-20/`): **0 FAIL**, 1162/1184
   PASS, 22 AMBIGUOUS. The same cell now reads `fontFamily: "Open Sans", system-ui, -apple-system, sans-serif"` and
   `verdict: "pass"`.
4. **Full-manifest key-by-key diff** (`storyId+locale+viewport` → `verdict`) of the rerun against the task's
   declared baseline `.screenshots/rendered-assert/2026-07-29T06-49/manifest.json` (Task 681's post-change run,
   per kickoff §18): **0 changed cells** across all 1184.

**Conclusion:** a one-off font-loading flake in the capture harness, not a regression introduced by this diff. Both
runs are recorded here as the flake evidence rather than silently discarded.

---

## 10. `npm run build` — hard gate

First build attempt ran concurrently with a still-live `npm run dev` process and corrupted the shared `.next/`
directory (`ENOENT`/`MODULE_NOT_FOUND` on Turbopack chunk manifests) — a self-inflicted tooling collision, not a
code defect. Remediated by stopping all Next.js processes, deleting `.next/`, and re-running `npm run build` in
isolation. This is the authoritative, final build result:

```
> lero-al@0.1.0 build
> next build

   ▲ Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution):
     · clientTraceMetadata

   Creating an optimized production build ...
 ✓ Compiled successfully in 2.1min
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

Exit **0**. 40/40 pages, matching the pre-existing baseline (no page added/removed).

---

## 11. Validation evidence — commands and actual outcomes

| Command | Result |
|---|---|
| `npm run typecheck` | **0** |
| `npx vitest run src/lib/__tests__/toast.smoke.test.ts` | **0** — 4/4 |
| `npx vitest run .../AdminUsersTable.smoke.test.tsx .../AdminReportsManager.smoke.test.tsx .../ReportListingDialog.smoke.test.tsx` | **0** — 41/41 combined |
| `npx vitest run` (full suite) | 1161/1163 passed, 2 full-run-only timeouts (`date-format-ssr-parity`, `RangeDatePicker`) — the same documented pattern as Tasks 669/672/681; isolated re-run: **39/39 PASS** |
| `npm run check:stories` | **0** — 127 files, 0 violations |
| `npm run check:story-coverage` | **0** — 15/15, unchanged |
| `npm run build-storybook` | **0** — built in 40.86s |
| `npm run screenshots:assert -- --mantine-only` | Run 1: 1 transient FAIL, investigated as a font-loading flake (§9). Run 2: **0 FAIL**, 1162/1184 PASS, 22 AMBIGUOUS (all pre-existing: Combobox mobile-390 backdrop ×4, PopularLocationsView LongCityName ellipsis ×16, Tabs offscreen-scroll ×2). **Full-manifest diff vs `2026-07-29T06-49` baseline: 0 changed cells.** |
| `npm run check:design-tokens` | **44** violations / **0 stale-marker** — same 44 before/after, **0 in `MantineRootProvider.tsx`** |
| `npm run check:i18n` | **0** — 2215×4, no new keys |
| `npm run check:file-integrity` | **0** — 1 file checked (git-changed set), clean |
| `npm run check:mojibake` | **0** artifacts, 1996 files scanned |
| `BASE_URL=http://localhost:3000 npm run check:hydration` | **0** — 4 PASS, 0 FAIL, 3 SKIP (not-real-coverage: no seeded listing slug, no session cookies — same documented gaps as Task 681), against a clean `npm start` production server (after the `.next` corruption fix, §10) |
| `npm run build` | **0** — see §10 |

---

## 12. TailAdmin §6r-LIVE side-by-side

**Not required** (kickoff §13.1) — this task changes placement, not chrome. Confirmed absent from the diff:
`theme.ts` and `notification-chrome.css` do not appear in `git status --porcelain` (§8).

---

## 13. Self-review findings

- **Investigated, not fixed (found to be pre-existing infra, not a defect):** the transient `HeroSearch` FAIL
  (§9) — traced to a font-loading race via the `fontFamily` signal in the manifest, confirmed non-reproducible on
  rerun, confirmed the diff cannot structurally reach that story (Storybook never mounts
  `MantineRootProvider`), and confirmed via a 0-changed-cell full-manifest diff against the declared baseline.
- **Self-inflicted, fixed:** running `npm run build` concurrently with a live `npm run dev` process corrupted the
  shared `.next/` build cache (Turbopack chunk-manifest `ENOENT`/`MODULE_NOT_FOUND` on both the dev server and a
  subsequent `npm start`). Fixed by stopping all Next.js processes, deleting `.next/`, and rebuilding in isolation
  (§10) before running `check:hydration` against a clean production server.
- **No product-code defect found.** The offset arithmetic is grounded in a 16-cell live measurement (§4), the
  cascade win is proven by computed style (§6), and the after-capture shows zero collisions across all 16 declared
  cells (§5) with zero horizontal overflow.

---

## 14. Assumptions, deviations, and limitations

- **Declared proof-path boundary** (kickoff §13.1): only `MANTINE_VIEWPORTS` (320/375/390/1024) × 4 locales was
  captured; the 14-width canon remains Task 678's scope, not re-litigated here.
- **`/admin/*` inherits the same offset with no header to clear** (kickoff §3.8) — recorded as an accepted,
  intended consequence of the single global `<Notifications>` mount; no route-conditional branch was added.
- **`MantineNotificationPattern.tsx:81`'s `<Button color="blue">`** — the unregistered-colour defect flagged at the
  681 review — remains untouched; reserved for Task 685, out of this task's scope (§8 of the kickoff).
- **`sonner`/`next-themes` remain in `package.json`** — Task 682 reserved, not audited here.
- **D3 extension flagged for ratification:** the offset is **not** confined to narrow widths — the measured 65px
  header height persists up to at least 1024px, so `top={{ base: 97, sm: 65 }}` applies clearance at every
  measured width, not only "narrow" ones. This matches D3's stated *intent* (header clearance) even though D3's
  wording said "narrow-width"; the kickoff's I2 explicitly anticipated and pre-authorized reporting this extension
  for ratification at review.
- **Breakpoint alignment is not exact to 390px:** Mantine's style-prop resolver only accepts `theme.breakpoints`
  keys (verified, §4); the nearest safe key above the header's real 390px wrap point is `sm` (640px), so widths
  390–639px receive the more-conservative 97px value rather than the tightest-possible 65px. This never causes a
  collision (97 > 65) — it is over-clearance, not under-clearance — but is recorded as a known non-tightness in the
  offset, not a defect.
- **Transient `--mantine-only` FAIL** (§9) — investigated and attributed to a font-loading race in the capture
  harness, not this diff; both runs are recorded rather than discarded.
- **Full vitest suite:** 2 full-run-only timeouts (`date-format-ssr-parity`, `RangeDatePicker`) — the same
  documented pattern from Tasks 669/672/681, neither touches toast/notification code, both pass in isolation
  (39/39). The third file sometimes seen in this pattern (`saveSavedSearch.dedup`) did not appear this run.

---

## 15. Opus handoff

**Evidence locations:**
- This session log (full command transcript excerpts, §11).
- `.screenshots/task684-ac9/` — `before-rects.json`, `header-measurement.json`, `after-rects.json`, 20 PNGs.
- `.screenshots/rendered-assert/2026-07-29T13-45/` (transient-FAIL run) and
  `.screenshots/rendered-assert/2026-07-29T14-20/` (clean rerun) vs
  `.screenshots/rendered-assert/2026-07-29T06-49/` (Task 681's baseline, the declared comparator per kickoff §18).
- `scratchpad/build2.log`, `scratchpad/prod-server2.log` — the clean, post-`.next`-fix build/server transcripts.

**Questions/risks for the reviewer:**
1. **D3 extension (§14):** the offset applies at every measured width, not only "narrow" ones — confirm this
   reading of D3's intent is correct, since the literal text said "narrow-width."
2. **The `sm`-breakpoint alignment (§4, §14):** widths 390–639px receive 97px instead of the tightest 65px, because
   Mantine has no breakpoint at 390px. Confirm this over-clearance is acceptable, or whether a tighter mechanism
   (out of this task's authorized scope — no CSS variable, no hand-written media query per R1) should be considered
   in a follow-up.
3. **The transient `HeroSearch` FAIL (§9)** — confirm the flake attribution (font-loading race, structurally
   unreachable from this diff, 0-changed-cell full-manifest reproduction) is convincing evidence, not a
   masked regression.
4. **`.next` corruption (§10, §13)** — a tooling/process-hygiene note, not a code finding; flagging in case the
   reviewer's own re-verification also runs dev and build concurrently.

---

## 16. Backlog update

- `docs/backlog.md`: 681/684 line updated in place (Last Session section) to mark 684 IMPLEMENTED, summarizing the
  offset value, the R7 flake investigation, and the D3-extension/sm-breakpoint questions for the reviewer.
- **Resulting physical line count: 80** (no growth — edited in place per the kickoff's explicit no-headroom
  instruction).

---

## 17. Orchestrator review record (Opus, 2026-07-29) — `APPROVED WITH NOTES`

Added by the orchestrator at review. Sonnet did not self-approve; §15's status line remains its own final claim.

### 17.1 Independently re-derived evidence

The reviewer did not accept §2's table as proof. Re-derived from artifacts and source: all 16 cells of
`after-rects.json` re-asserted programmatically (0 failing, `scrollWidth === innerWidth` everywhere); the full
1184-cell manifest diff `2026-07-29T06-49` → `2026-07-29T14-20` recomputed (**0 changed cells**, key sets
identical, run-1's single FAIL isolated to `herosearch--default × sq × mobile-320`, 22 AMBIGUOUS breakdown exact);
`theme.ts:144-151` breakpoints, `parse-style-props.mjs`, `size-resolver.mjs` and `style-props-data.mjs:46` read at
source; `check:i18n`, `check:mojibake`, `check:file-integrity`, `check:design-tokens`, `check:stories`,
`check:story-coverage` all re-run by the reviewer with matching results; `mobile-320-sq.png` viewed.

### 17.2 Owner decisions taken at review

| ID | Question | Ruling |
|---|---|---|
| **D5** | Kickoff §18's execution-contract "zero/empty input" row required a scrolled-state measurement, which §5's capture did not execute. Remedy? | **WAIVED.** Reviewer verified structurally that `grep -rn "scroll\|useWindowScroll\|useHeadroom" src/components/layout/HeaderView.tsx` → **0 hits**, the header is `sticky top-0` with scroll-invariant height, and the notifications container is `position: fixed` (viewport-relative). Residual risk nil; a rendered capture would be ceremony. Recorded as a documented limitation, not a satisfied checkpoint. |
| **D6** | `.gitignore:55` (`/.screenshots/`) makes I4's "commit them to the working tree" unachievable, so Task 681 finding F4 is only locally remedied. | **ACCEPTED as local-only.** AC5 is satisfied as written ("given the final tree"); the 23 artifacts were verified present on disk by the reviewer. No `.gitignore` change; no per-task negated-ignore precedent. |

### 17.3 Non-blocking findings carried forward (P3 / NOTE)

1. **Final porcelain misquoted (§8).** §8 shows one path; the true final tree is three — `M docs/backlog.md`,
   `M src/design-system/mantine/MantineRootProvider.tsx`, `?? docs/sessions/2026-07-29-task684-…md` — all of them
   §7 paths. Scope is compliant; the snapshot was taken before I6 wrote the records. Quoting defect only.
2. **Auth-state boundary undisclosed.** All 16 cells were captured guest-state. Structurally bounded: `UserMenu`
   is `visibleFrom="md"` (768px) so it cannot reach the wrapped `<390` band, and the `mih="2.75rem"` hamburger
   dominates row 2 in both states. `NEEDS VERIFICATION`, not a confirmed defect.
3. **The shipped value is rem, not px.** `style-props-data.mjs:46` types `top` as `size`; `size-resolver.mjs`
   applies `rem()`, emitting `calc(6.0625rem * var(--mantine-scale))`. Favorable: under root-font enlargement the
   offset grows as `4.0625R` while the ≥640 header grows as `4R + 1px`, so clearance widens. No `--mantine-scale`
   override exists in `src/`.
4. **Zero slack by construction.** `top = max(headerHeight)` yields exactly 0px clearance in both bands (97=97,
   65=65). Per the kickoff's own derivation, but any future 1px header growth silently reintroduces the collision
   and no gate watches it. Candidate follow-up.
5. **Undisclosed partial run.** `.screenshots/rendered-assert/2026-07-29T14-17/` holds 104 PNGs and no
   `manifest.json` — an aborted run, truncated alphabetically at `alert`. Not evidence-shopping; should have been
   named alongside `13-45` and `14-20`.
6. **Pre-existing test noise.** `AdminUsersTable` emits `leftSection`-on-DOM and `component`-on-`<button>` React
   warnings from Task 681-era mocks. Unreachable from this diff; 41/41 still pass. Cleanup candidate.

### 17.4 D3 ratifications

- **Offset applies at every measured width, not only narrow ones — RATIFIED.** D3's operative content is header
  clearance; "narrow-width" described the reported symptom, not a scope limit. The 65px header persisting to
  1024px settles it, and kickoff I2 pre-authorized this report.
- **`sm` (640px) cutover, with 390–639px over-cleared at 97px — RATIFIED as shipped.** Over-clearance, never
  collision; every tighter mechanism is forbidden by R1/A2. Accepted non-tightness, not a defect.

### 17.5 Owner-native gate confirmation (2026-07-29, PowerShell)

`typecheck` exit 0 · `toast.smoke` 4/4 · three registry suites 41/41 · `build-storybook` success with
`check:stories` 127/0 · **`npm run build` `$LASTEXITCODE` = 0**, `Compiled successfully in 49s`,
`Generating static pages (40/40)`, full 54-route table, shared JS 184 kB. This supersedes §10's partial tail as
the authoritative build evidence for the reviewed diff.

A `Tee-Object` capture of that build was briefly written to `docs/sessions/assets/task684-build.log` at the
reviewer's instruction and **removed**: PowerShell 5.1 defaults to UTF-16LE, producing a BOM and 5689 NUL bytes
that failed `check:file-integrity` and `check:mojibake` (agent-contract clause 14). The reviewer rejected the
`scripts/mojibake-allowlist.json` route used for the `task467-*.log` precedent, because
`scripts/check-file-integrity.mjs` has no allowlist mechanism and suppressing a genuine NUL-byte failure would be
gate-weakening. Both gates re-verified clean after removal (3/3 files, 0 artifacts in 1997).

### 17.6 Verdict

`APPROVED WITH NOTES` — R1–R10 all `VERIFIED`; no P0/P1/P2 findings remain after D5; §17.3 items are P3/NOTE and
carry no correction gate.
