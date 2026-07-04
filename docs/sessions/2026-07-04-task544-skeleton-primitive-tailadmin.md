# Task 544 — Skeleton primitive → TailAdmin (Phase 1 · P1.24)

**Sprint 40 / Epic MM. Executor: direct execution, no orchestrator layer in this session.**

## Summary

New canonical Mantine `Skeleton` primitive + `Mantine/Primitives/Skeleton` story. Primitive + story only,
zero consumer migration (Phase 2), per the P1.21/P1.23 precedent.

**Step 0 extraction result: TailAdmin has NO dedicated skeleton/loading-placeholder component.** Checked
exhaustively, both sources:
- Offline zip (`demo_tailadmin_com.zip`): `css/style.css` has no skeleton/shimmer class or opacity-pulse
  keyframes (the only "pulse" hit is an unrelated Dropzone-widget `scale` animation); zero `animate-pulse`
  usage across all 19 bundled HTML pages; `bundle.js` contains "skeleton" once, inside an unrelated
  FullCalendar library comment.
- Live site (`demo.tailadmin.com`, same domain as every other "measured" row in the reference doc):
  `/skeleton`, `/loaders`, `/loader`, `/loading`, `/placeholder`, `/placeholders`, `/empty-state` all 404.
  `/spinners` exists (200) but is a fundamentally different UI idiom (rotating icons, zero skeleton/shimmer
  markup) — not a usable "closest loading placeholder."

**Decision (clause 16 fallback, zero invented values):** reuse already-cited TailAdmin tokens for the
closest semantic analog — base color = gray-200 `#e4e7ec` (same token as the Progress track); radius = 8px
(same generic control radius as Input/Pagination/Tabs) for line/block, full-round for circle (a geometric
certainty, not a design choice); animation = Mantine's own default (1500ms linear infinite pulse), kept
UNCHANGED as a zero-override decision (TailAdmin has zero cited animation timing for any loading state).
Full record: `docs/tailadmin-style-reference.md` §6n.

**Zero `MantineSkeleton` wrapper needed** — Mantine's raw `<Skeleton>` (height/width/radius/circle/visible/
animate props + all Box props) is a strict superset of the legacy `skeleton.tsx` contract (a plain div +
className), so the story imports `Skeleton` directly from `@mantine/core`.

**`theme.ts`:** no functional `Skeleton` block needed — radius is zero-override (global `defaultRadius:'lg'`
already resolves to 8px); the one real divergence (base color) is NOT reachable via `vars`/`styles` because
Mantine hardcodes it to `--mantine-color-gray-3` inside `::before`/`::after` pseudo-elements in its own
stylesheet, which React inline styles cannot target. Fixed via a new scoped stylesheet,
`skeleton-chrome.css` (same mechanism as `input-chrome.css`/`pagination-chrome.css`), imported in both
`src/app/layout.tsx` and `.storybook/preview.tsx`.

**Loader-allowlist: NOT needed (verified empirically, contradicting the kickoff's assumption).** Mantine's
`<Skeleton>` renders with none of `waitForStoryReady`'s 6 loader signals (`.animate-spin`,
`[data-slot="skeleton"]`, `[role="progressbar"]`, `[aria-busy="true"]`, `[data-loading="true"]`, exact-match
loading text) — confirmed both by reading the compiled `Skeleton.mjs` source and by live DOM inspection of
the built story (all 6 signals `false`, 9 real `.mantine-Skeleton-root` elements present). Unlike Progress
(`role="progressbar"` unconditional/permanent), there is nothing for Skeleton to trip. `LOADER_ALLOWLIST` is
UNCHANGED by this task. Full record: `docs/storybook-governance.md` §14.9.10.

## Consumer audit (migrate zero — Phase 2)

`grep -rl "@/components/ui/skeleton" src` (and the relative-path equivalent) → 6 consumers, none touched:
- `src/app/[locale]/favorites/loading.tsx`
- `src/app/[locale]/listings/[slug]/loading.tsx`
- `src/modules/listings/components/FeaturedListings.tsx`
- `src/modules/listings/components/LatestListings.tsx`
- `src/modules/listings/components/ListingsShell.tsx`
- `src/stories/AdminLayout.stories.tsx`

## Mobile <640 full-width gate (clause 11)

Line/block skeletons use `width="100%"` in the story (span the full content width, no fixed px clip at
320). Circle skeleton stays its intrinsic size (avatar placeholders are not full-width by nature — same
documented exemption class as Progress's non-interactive-display exemption). `≥44px` tap-target rule is
N/A — Skeleton is non-interactive (no `role="button"`/focusable state), documented exemption.

## Gates

```
node --check (n/a, no .mjs script changed)
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 100 files, 0 violations
npm run check:i18n                   → PASSED, 4 locales, 2082 keys (zero new keys — no visible/aria label
                                        needed anywhere in the story; a skeleton placeholder has no real
                                        content to translate, by definition)
npm run check:mojibake               → 0 artifacts, 1561 files
npm run check:design-tokens --strict → 0 violations, 394 files scanned
npm run check:file-integrity         → PASSED, 9 files clean
npm run build-storybook              → built clean (3x: initial, planted, reverted)
npm run screenshots:assert -- --mantine-only → 398/416 PASS, 0 FAIL, 18 AMBIGUOUS (pre-existing Task 538
                                        set, unchanged — 16 documented ambiguous-overlap + 2 Tabs swipe)
```

## Planted-violation transcript (AC5)

Planted a `<Skeleton height={12} width={900} data-testid="task544-planted-overflow" />` at the top of the
story (temporary). Pre-check confirmed real document overflow at 320px viewport
(`scrollWidth=916` vs `clientWidth=320`). Full native gate:

```
Results: 386/416 PASS, 12 FAIL, 18 AMBIGUOUS
❌ Failed cells:
  Mantine/Primitives/Skeleton/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390}
    ✗ horizontal overflow detected
```

Exactly the expected 12 cells (4 locales × 3 mobile viewports); desktop-1024 correctly unaffected (900px
doesn't overflow at 1024px). Reverted (`grep -n "planted"` → 0 matches after revert), rebuilt, reconfirmed
green: **398/416 PASS, 0 FAIL, 18 AMBIGUOUS** (identical to the pre-plant baseline).

## Regression (clause 15)

No `docs/critical-flow-registry.md` entry references Skeleton (`grep -in skeleton` → 0 matches) — no
registered critical flow touched. Theme-only + new-file change scoped to `Skeleton`; no other primitive's
`theme.ts` block, story, or chrome CSS modified.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/theme.ts` | New comment block after `Progress` documenting the zero-override decision (no functional `Skeleton` entry) | Records why radius/animate need no config and why color can't be set here |
| `src/design-system/mantine/skeleton-chrome.css` | New file — `.mantine-Skeleton-root::after { background-color: var(--mantine-color-gray-2); }` | The one real §6n divergence (base color), fixable only via a pseudo-element CSS override |
| `src/app/layout.tsx` | Import `skeleton-chrome.css` | Wires the chrome into the real app |
| `.storybook/preview.tsx` | Import `skeleton-chrome.css` | Wires the chrome into Storybook |
| `src/stories/mantine/primitives/Skeleton.stories.tsx` | New file — `Default` story: text-line, block, circle, composite (avatar+lines), `visible={false}` passthrough | Required rendered-proof surface, AC2 |
| `docs/tailadmin-style-reference.md` | New `## 6n.` section | Step 0 extraction record (negative result + fallback reasoning), AC1 |
| `docs/storybook-governance.md` | New `§14.9.10` | Records the verified "no loader-allowlist needed" finding, AC3 |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.24 row updated ⬜ → 🟡 Task 544 | Tracker accuracy |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` (final clean run) | Standing auto-generated artifact |

No product/consumer file touched (the 6 legacy-skeleton consumers listed above are unmodified — grep-provable
via `git status --porcelain`, none of those 6 paths appear in the diff).

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | New §6n row extracted FIRST, every value cited, zero invented | ✅ | `tailadmin-style-reference.md` §6n — negative extraction result + documented token-reuse fallback |
| 2 | `theme.ts` block (+ wrapper only if justified) + story renders matching the reference at ≥640/320 × 4 locales | ✅ | Zero-override `theme.ts` note + `skeleton-chrome.css`; story renders line/block/circle/composite states; native gate 398/416 PASS across all cells; zero wrapper (justified — Mantine's raw Skeleton is a strict superset of the legacy contract) |
| 3 | `LOADER_ALLOWLIST` entry — narrow, documented | ✅ (as "not needed", verified not assumed) | §14.9.10 — empirically confirmed no loader signal ever fires; `LOADER_ALLOWLIST` correctly UNCHANGED |
| 4 | Consumer audit in session log (migrate zero); no other primitive regressed | ✅ | 6 consumers listed above, none touched; gate shows 0 new FAIL/ambiguous outside Skeleton's own cells |
| 5 | Rendered `--assert` matrix + planted-violation transcript; all light gates green | ✅ | Both transcripts above; all 6 light gates green |
| 6 | Session log: Files-Changed, AC self-audit, `Self-validation:` line; no git run | ✅ | This file; no `git` command executed |

## Self-validation

Self-validation: all 6 ACs met with rendered-gate evidence. Step 0 extraction produced a genuine negative
result (no TailAdmin skeleton component exists anywhere reachable) — documented honestly rather than
inventing a component to conform to, per clause 16's fallback path. One kickoff assumption (loader-allowlist
needed) was verified empirically and found FALSE — corrected rather than blindly implemented, avoiding an
unnecessary allowlist entry. Planted-violation transcript proves the gate still catches a real defect on
this surface (12/12 expected cells FAILed, reverted clean). Final native gate: 398/416 PASS, 0 FAIL, 18
AMBIGUOUS (all pre-existing from Task 538, unchanged by this task). Zero product/consumer file touched.
**HELD — no git commands run; awaiting review + explicit-path commit emission.**
