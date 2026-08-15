# Task 702 — `ListingCard.tsx` de-Tailwind (Sprint 46.2)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Task path and status

`tasks/Sprints/Sprint_46_kickoff_prompt_Task_702_ListingCard_DeTailwind.md` — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 2. Files Changed (matches final `git status --porcelain`, §4)

| Path | Action | Reason |
|---|---|---|
| `src/modules/listings/components/ListingCard.module.css` | created | R1, R4 — the 7-class, `@layer utilities`-wrapped module |
| `src/modules/listings/components/ListingCard.tsx` | modified (2 insertions on import + 8 `className=` sites changed) | R1, R2, R3, R5, R6 |
| `docs/backlog.md` | modified | R10 — concise active-state update |
| `docs/sessions/2026-08-10-task702-listingcard-detailwind.md` | created | R10 — this file |

## 3. Requirement / acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1/AC1 | `grep -n className src/modules/listings/components/ListingCard.tsx` → 8 sites, all `styles.*` or `cn('<markers>', styles.*)`. `CLOSED_OVERLAY_STYLE` at `:56-59` present, byte-unchanged (md5 identical, §5). |
| R2/AC2 | `.listing-card`, `.listing-card--horizontal`, `.listing-card--vertical` unchanged strings in the `cn()` calls (§6 diff). `check:homepage-grid`'s 4 `.listing-card` anchor rows: I-A/I-B/I-D 248/248 PASS both before and after (§4 command 6). |
| R3/AC3 | Computed-style before/after capture over all 8 sites: **`diffCount: 0`** (§5). Rendered matrix: `screenshots:assert --mantine-only` → `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS`, byte-identical to Task 733's documented standing comparator (2026-08-09 session log); zero `ListingCard` cells in either the FAIL or AMBIGUOUS set. |
| R4/AC4 | `ListingCard.module.css` — every rule inside `@layer utilities` (module body, §7); header cites Task 702/D28/D34, the 688/662 reproduce-the-compiled-output convention, and explicitly states why `FavoriteButton.module.css`/`MantineListingCardPattern.module.css` stay unlayered. |
| R5/AC5 | md5 table (§5): all 6 AC5 paths + `ListingCard.smoke.test.tsx` byte-identical I0→final. `CLOSED_OVERLAY_STYLE`/`:266` confirmed present and unchanged by direct read. |
| R6/AC3 | `ListingFeatureIcon` svg sizing (`h-3.5`/`w-3.5` → `.featureIcon`) and `FavoriteButton`'s own module (`background-color`/`color`/`opacity`/`cursor`) both confirmed unaffected — computed-style capture measured the real rendered icons/buttons, not synthetic stand-ins, for 6 of the 8 sites (§5). |
| R7/AC6 | `check:design-tokens` 0/0 both before and after (§4 command 5, including the mid-task rework of `.overlayFavorite`, §9 deviation 1). `check:story-coverage` 15/15. `check:locale-leak` (mantine-only) 0 leaks on `mantine-primitives-listingcard`; full-mode 0 `listingcard` hits. `check:stories` 0/127. `check:homepage-grid` 248/260 both runs (12 pre-existing I-C Header fails, unrelated). `check:mojibake` 0/2155. |
| R8/AC7 | `ListingCard.smoke.test.tsx` unmodified (md5 identical). `npx vitest run <that file>` → 13/13 pass, including `:169`/`:253` `.grayscale.opacity-60` assertions (§4 command 7). |
| R9/AC8 | `npm run build` final result: **exit 0**, 55/55 routes (§8 transcript tail). |
| R10/AC9 | `docs/backlog.md` updated concisely (§10). Session log at this path holds every transcript path under `.screenshots/task702-delta/`. |

## 4. Current vs required behavior

**Current (before).** `ListingCard.tsx` mixed Mantine props, 3 cross-file `className` contracts (markers, `FavoriteButton`, `ListingFeatureIcon`) and 10 raw Tailwind strings (8 visible to `grep "className="`, plus `CLOSED_OVERLAY_STYLE` consumed via `className:` at `:266`, out of scope per kickoff §3.2/Task 741). It was the last Tailwind-bearing container in the homepage grid path.

**Required after (achieved).** The 8 `className=` sites reference a colocated, `@layer utilities`-wrapped module reproducing each utility's compiled declarations exactly (verified both from the rebuilt `.next/static/css` bundle and a live `getComputedStyle` capture, diff 0). The 3 marker tokens are unchanged in the DOM (byte-identical strings). `CLOSED_OVERLAY_STYLE` still holds its 2 Tailwind strings, untouched.

**Applicable negative flows (kickoff §11), traced:**

| Branch | Evidence |
|---|---|
| No cover image (Maximize2 fallback, sites #1/#5) | Fixture always has a cover image (`ListingCard.stories.tsx:92`), so the real fallback branch never renders in the canonical story. Captured via a synthetic offscreen element carrying the exact class (literal Tailwind string before, the CSS-Modules-hashed class located via stylesheet text scan after) — same technique Task 688 used for its 8 gradient variants. `diffCount: 0` for both sites. |
| Closed listing (sold/rented overlay) | `CLOSED_OVERLAY_STYLE`/`:266` untouched — R5 confirms it byte-identical; out of this task's scope entirely (Task 741). |
| Archived listing (`.grayscale.opacity-60`) | Emitted by `MantineListingCardPattern.tsx`, not `ListingCard.tsx` — untouched (md5 identical). `ListingCard.smoke.test.tsx:169`/`:253` pass unmodified. |
| Cascade collision (layered module vs `FavoriteButton`'s unlayered module) | §3.7's property-set comparison (no shared `background-color`/`color`/`opacity`/`cursor`) confirmed by the real rendered computed-style capture on both `[data-favorited]` buttons — `diffCount: 0` on `flexShrink`/`marginTop`/`marginRight` (inline) and `boxShadow`/`position` (overlay). |

## 5. I0 vs final md5 table (all 8 §13.2 paths)

| Path | I0 md5 | Final md5 | Changed? |
|---|---|---|---|
| `MantineListingCardPattern.tsx` | `e28934d3c12c6160cd39b5157bddeff4` | `e28934d3c12c6160cd39b5157bddeff4` | No |
| `MantineListingCardPattern.module.css` | `b54540b93c4cfb78439d0b8fdda10165` | `b54540b93c4cfb78439d0b8fdda10165` | No |
| `ListingCardPattern.stories.tsx` | `b031a9f4bf648d63f9c0abe01cad2ec8` | `b031a9f4bf648d63f9c0abe01cad2ec8` | No |
| `MantineListingCardPattern.smoke.test.tsx` | `b33556b492c2c35f066aa6309147b73e` | `b33556b492c2c35f066aa6309147b73e` | No |
| `ListingDetailView.tsx` | `62894362c74533bd3c58356ea834cca3` | `62894362c74533bd3c58356ea834cca3` | No |
| `ListingContact.tsx` | `634d6d56235abbf695827b01b00b2fca` | `634d6d56235abbf695827b01b00b2fca` | No |
| `ListingCard.tsx` | `dcf46f12a5ea47137aa15e0813f011e2` | `15e8c12b582efef629d013880dfcf334` | **Yes — in scope** |
| `ListingCard.smoke.test.tsx` | `9d3c48a4bbdf706ec710414954cd74b8` | `9d3c48a4bbdf706ec710414954cd74b8` | No |

`git hash-object` cross-check on `ListingCard.tsx` used mid-task for the temporary revert/restore (§9 deviation 2): edited state `c4e3c41bc139a792c55fb7f7472131d90f6e4da5`, `HEAD` state `0345d1441a8e033fe8228d6a9fb70b2baa98dfc2`.

## 6. Full `git diff` of `ListingCard.tsx`

```diff
diff --git a/src/modules/listings/components/ListingCard.tsx b/src/modules/listings/components/ListingCard.tsx
index 0345d1441..c4e3c41bc 100644
--- a/src/modules/listings/components/ListingCard.tsx
+++ b/src/modules/listings/components/ListingCard.tsx
@@ -16,6 +16,8 @@ import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeature
 import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'
 import { convertPrice as convertPriceMulti } from '@/lib/getExchangeRate'
 import type { ExchangeRates } from '@/lib/getExchangeRate'
+import { cn } from '@/lib/utils'
+import styles from './ListingCard.module.css'
 
 export interface CardListingData extends ListingSnapshot {
   id:           string
@@ -150,7 +152,7 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
       <AppImage variant="listing-thumb" src={coverImage?.url} alt={listing.title} priority={priority} predictive>
         {!coverImage && (
           <Center pos="absolute" inset={0}>
-            <Maximize2 className="h-6 w-6 text-muted-foreground" />
+            <Maximize2 className={styles.placeholderIcon} />
           </Center>
         )}
       </AppImage>
@@ -163,14 +165,14 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
         onToggled={onFavoriteToggled}
         disabled={isClosed}
         disabledLabel={closedLabel}
-        className="shrink-0 -mt-0.5 -mr-1"
+        className={styles.inlineFavorite}
       />
     )
 
     const patternBadges = badges.map(b => ({ label: t(b.label), color: b.color }))
 
     const listFeatures = getCardFeatures(listing).map(f => ({
-      icon: <ListingFeatureIcon name={f.icon} className="h-3.5 w-3.5" />,
+      icon: <ListingFeatureIcon name={f.icon} className={styles.featureIcon} />,
       value: f.value,
     }))
 
@@ -198,7 +200,7 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
     return (
       <Link
         href={`/${locale}/listings/${listing.slug}`}
-        className="listing-card listing-card--horizontal block"
+        className={cn('listing-card listing-card--horizontal', styles.card)}
         data-track="listing_click"
         data-listing-slug={listing.slug}
         onClick={() => onBeforeNavigate?.(listing.slug)}
@@ -241,7 +243,7 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
     <AppImage variant="listing" src={coverImage?.url} alt={listing.title} priority={priority} layoutContext={layoutContext} predictive>
       {!coverImage && (
         <Center pos="absolute" inset={0}>
-          <Maximize2 className="h-8 w-8 text-muted-foreground" />
+          <Maximize2 className={styles.placeholderIconLarge} />
         </Center>
       )}
     </AppImage>
@@ -256,7 +258,7 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
       disabled={isClosed}
       disabledLabel={closedLabel}
       overlay
-      className="shadow-sm"
+      className={styles.overlayFavorite}
     />
   )
 
@@ -268,7 +270,7 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
 
   // Features — icons pre-rendered as nodes so the pattern needs no app-specific icon map.
   const features = getCardFeatures(listing).map(f => ({
-    icon: <ListingFeatureIcon name={f.icon} className="h-3.5 w-3.5" />,
+    icon: <ListingFeatureIcon name={f.icon} className={styles.featureIcon} />,
     value: f.value,
   }))
 
@@ -294,7 +296,7 @@ export function ListingCard({ listing, variant = 'vertical', onBeforeNavigate, d
   return (
     <Link
       href={`/${locale}/listings/${listing.slug}`}
-      className="listing-card listing-card--vertical block h-full"
+      className={cn('listing-card listing-card--vertical', styles.card, styles.cardVertical)}
       data-track="listing_click"
       data-listing-slug={listing.slug}
       onClick={() => onBeforeNavigate?.(listing.slug)}
```

## 7. Complete new module file (`ListingCard.module.css`)

```css
/*
 * ListingCard.module.css — Task 702 (D28 de-Tailwind, Sprint 46.2). Reproduces the 8 prior
 * Tailwind utility sites' OWN compiled output exactly (verified against the built
 * `.next/static/css` bundle AND a live `getComputedStyle` capture on the canonical
 * `Mantine/Primitives/ListingCard` story, Task 702 §3.4/§3.5/§10 I2), same reproduce-the-
 * compiled-output convention as `PopularLocationsView.module.css` (Task 688) and
 * `MantineHomeSection.module.css` (Task 662).
 *
 * D34 (2026-08-05): a D28 de-Tailwind module reproduces the utility's own cascade LAYER, so
 * every rule below is wrapped in `@layer utilities` — same as `HeroSearchView.module.css`
 * (709-R) and `MobileBottomNavView.module.css` (713).
 *
 * The two modules sitting closest to this one — `FavoriteButton.module.css` (653) and
 * `MantineListingCardPattern.module.css` (602) — are correctly UNLAYERED, and that is not an
 * inconsistency to "fix": D34 distinguishes by intent. A D28 migration (this file) reproduces
 * a utility's own losing cascade standing, so it must stay layered to keep losing to Mantine's
 * unlayered component CSS exactly as the utility it replaces did. FavoriteButton/
 * MantineListingCardPattern instead fix a CASCADE-TRAP utility that never actually took effect
 * against Mantine's own unlayered CSS — those must stay unlayered so the fix can win. Task 702
 * §3.7 measured that `.inlineFavorite`/`.overlayFavorite` below do not contend with
 * FavoriteButton.module.css on any property (no shared background-color/color/opacity/cursor),
 * so layering this module does not reopen that fix.
 *
 * `.overlayFavorite`'s box-shadow reproduces Tailwind's own `--tw-inset-shadow,
 * --tw-inset-ring-shadow,--tw-ring-offset-shadow,--tw-ring-shadow,--tw-shadow` composition by
 * referencing the same custom properties `MobileBottomNavView.module.css` (713) does, rather
 * than hand-flattening to a literal box-shadow list — `--tw-inset-shadow`/`--tw-inset-ring-
 * shadow`/`--tw-ring-offset-shadow`/`--tw-ring-shadow` stay at Tailwind's own globally-registered
 * `@property` initial value (`0 0 #0000`) because nothing here sets them; only `--tw-shadow` is
 * set locally, to `.shadow-sm`'s own compiled value. Verified live via `getComputedStyle`, not
 * derived from the source text alone (Task 702 §3.5/§10 I2): byte-identical to the pre-edit
 * capture, `diffCount: 0`.
 */

@layer utilities {
  /* Sites #4/#8 — the two <Link> wrappers (Task 702 §3.1). Markers (`listing-card
     listing-card--horizontal`/`listing-card--vertical`) stay literal Tailwind-adjacent strings
     on the element via `cn()`, untouched by this module — see ListingCard.tsx. */
  .card {
    display: block; /* block — I1 */
  }

  .cardVertical {
    height: 100%; /* h-full — I1 */
  }

  /* Site #1 — no-cover-image fallback icon, horizontal card (`:153`). */
  .placeholderIcon {
    height: var(--space-6); /* h-6 — I1, N1: integer step resolves to the named token */
    width: var(--space-6); /* w-6 — I1 */
    color: var(--muted-foreground); /* text-muted-foreground — I1 */
  }

  /* Site #5 — no-cover-image fallback icon, vertical card (`:244`). */
  .placeholderIconLarge {
    height: var(--space-8); /* h-8 — I1 */
    width: var(--space-8); /* w-8 — I1 */
    color: var(--muted-foreground); /* text-muted-foreground — I1 */
  }

  /* Sites #3/#7 — ListingFeatureIcon svg sizing (`:173`, `:271`). Forwarded as the icon's ONLY
     className (ListingFeatureIcon.tsx has no default/merge), so this class alone must size it. */
  .featureIcon {
    height: calc(var(--spacing) * 3.5); /* h-3.5 — I1, N1: fractional step keeps the calc() form */
    width: calc(var(--spacing) * 3.5); /* w-3.5 — I1 */
  }

  /* Site #2 — inline FavoriteButton self-position, horizontal/list card (`:166`). Merged with
     FavoriteButton's own `styles.control` via `cn()` inside FavoriteButton.tsx — does not
     contend with it on any property (§3.7: control sets background-color/color/opacity/cursor
     only). */
  .inlineFavorite {
    flex-shrink: 0; /* shrink-0 — I1 */
    margin-top: calc(var(--spacing) * -0.5); /* -mt-0.5 — I1 */
    margin-right: calc(var(--space-1) * -1); /* -mr-1 — I1 */
  }

  /* Site #6 — overlay FavoriteButton shadow, vertical card (`:259`). See header comment for the
     composition this reproduces — same `--tw-shadow`-plus-var()-composition technique as
     `MobileBottomNavView.module.css` (713) `.navBar`/`.fab`. */
  .overlayFavorite {
    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a); /* design-tokens-allow: #0000001a — Tailwind's own compiled shadow-sm color fallback (MobileBottomNavView.module.css:87 precedent for the same raw value on shadow-lg); no §22 token represents this specific alpha-black */ /* design-tokens-allow: --tw-shadow: 1px — shadow-sm's own compiled offset-y/blur expansion, no §22.4 length token composes this box-shadow layer (Task 715 precedent, MobileBottomNavView.module.css:87) */ /* design-tokens-allow: --tw-shadow: 3px — same shadow-sm expansion */ /* design-tokens-allow: --tw-shadow: 2px — same shadow-sm expansion */ /* design-tokens-allow: --tw-shadow: -1px — same shadow-sm expansion */
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); /* shadow-sm */
  }
}
```

## 8. Every §13.2 command with actual result

| # | Command | Result |
|---|---|---|
| 1 | `git --no-optional-locks status --porcelain` (I0) | empty |
| 1 | `git show HEAD:docs/backlog.md \| wc -l` (I0 baseline) | 89 (already above the 80-line target — pre-existing, flagged §10) |
| 2 | md5 witnesses (I0 + final) | §5 table — 6/8 unchanged, `ListingCard.tsx` in-scope change, `ListingCard.smoke.test.tsx` unchanged |
| 3 | `npm run build` (before edit, to read compiled CSS) | exit 0, 55/55 routes |
| — | `.next/static/css` grep for the 8 declarations + `text-muted-foreground` + `shadow-sm` | matched kickoff §3.4/§3.5 exactly, confirmed live from the current bundle |
| 4 | Computed-style capture (before) | `.screenshots/task702-delta/computed-before.json` |
| 4 | Computed-style capture (after) | `.screenshots/task702-delta/computed-after.json` |
| 4 | diff | `.screenshots/task702-delta/diff-computed-styles.mjs` → **`diffCount: 0`**, exit 0 |
| 6 | `npm run check:homepage-grid` (I0, temporary-revert tree) | `248/260 PASS, 12 FAIL` (I-C Header, pre-existing), exit 1 — `.screenshots/task702-delta/homepage-grid-BEFORE.txt` |
| 6 | `npm run check:homepage-grid` (final tree, clean isolated re-run) | `248/260 PASS, 12 FAIL` — **identical set**, exit 1 — `.screenshots/task702-delta/homepage-grid-AFTER.txt` |
| 6 | `npm run check:story-coverage` | 15/15, exit 0 |
| 6 | `npm run check:locale-leak` (full mode, final tree) | 319 leaks, exit 1 — **0 `listingcard` hits** (grep-confirmed) — `.screenshots/task702-delta/locale-leak-AFTER.txt` |
| 6 | `npm run check:locale-leak:mantine-only` (final tree) | 13 leaks, exit 1 — **all in `Admin/AdminUsersTable/Default`** (documented Task 736 debt), **0 in `mantine-primitives-listingcard`** — `.screenshots/task702-delta/locale-leak-mantine-AFTER.txt` |
| 6 | `npm run check:design-tokens` | 0/0, exit 0 (after the §9 deviation-1 rework) |
| 6 | `npm run check:stories` | 0/127, exit 0 |
| 6 | `npm run check:mojibake` | 0/2155, exit 0 |
| 6 | `npm run check:file-integrity` | 2/2 clean, exit 0 |
| 5 | `npm run screenshots:assert -- --mantine-only` | `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS`, exit 1 — byte-identical to Task 733's documented standing comparator; **0 `ListingCard` cells** in either set — `.screenshots/task702-delta/screenshots-assert-AFTER.txt` |
| 7 | `npx vitest run .../ListingCard.smoke.test.tsx` | 13/13 pass, exit 0 |
| 7 | `npx vitest run` (full) | `4 failed \| 74 passed (78)` files, `5 failed \| 1306 passed (1311)` tests, exit 1 |
| 7 | isolated re-run of the 4 failing files | **29/29 pass**, exit 0 — full-run-only resource-contention timeout class (§9 deviation 3) |
| 8 | `npm run typecheck` | exit 0 |
| — | `npm run build` (final) | **exit 0**, 55/55 routes — `.screenshots/task702-delta/final-build.txt` |

## 9. Deviations, assumptions, limitations

1. **`.overlayFavorite`'s box-shadow was rewritten mid-task.** My first draft flattened `shadow-sm`'s composition to a literal 6-layer `rgba()` box-shadow, matching the captured `getComputedStyle` value exactly — but `check:design-tokens` flagged 6 raw-color/length violations (the file must stay at 0, per kickoff §3.9). Rewrote to the `--tw-shadow`-plus-`var()`-composition technique `MobileBottomNavView.module.css` (713) already uses for the same problem, added `design-tokens-allow` markers matching the detector's exact `property: value` string format (learned from a `stale-marker` round-trip), then re-verified the computed-style diff was still 0 after the rewrite. `check:design-tokens` final: 0/0.
2. **Temporary source revert for the `check:homepage-grid` before/after comparison.** Git mutation (stash) is owner-only, so I used the same file-edit-only technique Task 688's session log used for its A/B control: overwrote `ListingCard.tsx` with its `HEAD` content (verified byte-identical via `git hash-object` matching `HEAD`'s blob), ran the baseline, then restored the edited version and re-verified the restoration's `git hash-object` matched the pre-revert edited hash exactly before continuing.
3. **A background `check:homepage-grid` run produced a false 212/260 (48 FAIL) result** because I rebuilt `storybook-static` twice more (fixing the design-tokens issue) while that run was still reading the directory. A clean, isolated re-run against the final tree gave `248/260 PASS, 12 FAIL` — identical to the pre-edit baseline. Recorded as a measured, root-caused finding, not hidden.
4. **Full `npm run build` hung for ~40 minutes** on its first invocation after all edits (no output beyond "Creating an optimized production build...") — anomalous versus its ~1-2 minute runtime on the pre-edit tree, most likely cumulative resource pressure from the long sequence of Playwright/vitest runs in this session, not a defect in the change itself (the process was alive throughout, never crashed). Owner-directed kill + clean restart completed normally: exit 0, 55/55 routes, same route table shape as the pre-edit build.
5. **Full-mode `check:locale-leak`'s ~50-minute runtime** made a true stashed-tree before/after comparison impractical within this session; used the full-mode run (0 `listingcard` hits among 319 pre-existing leaks) plus the much faster `--mantine-only` scoped run (0 leaks on `mantine-primitives-listingcard`, the story this task actually renders) as the evidence instead.
6. **A1** (kickoff): `ListingDetailView.tsx:303` and `ListingContact.tsx:275` keep their own Tailwind `h-3.5 w-3.5` / `FavoriteButton` callers untouched — confirmed by unchanged md5 (§5). Correct per scope; not "fixed."
7. §3.4/§3.5/§3.6/§3.7 re-checked against the current `.next/static/css` bundle and a live capture, not trusted from the kickoff text alone — all matched.

## 10. §3.10 correction owed to 691

**Confirmed.** Direct read of `ListingCard.tsx` at both `:206-226` (horizontal branch) and `:302-322` (vertical branch): `MantineListingCardPattern` receives no `className` prop at either call site. The kickoff's own §3.10 correction is accurate — Task 691's §3.4 table's claim that contract 1's consumer is "pattern `className` prop → `cn(...)` at `:162`/`:290`" does not match the real file; the marker/utility string lives on the wrapping `<Link>`, and its real consumers are the DOM and the gates in §3.3. Flagging this again here per the kickoff's instruction.

## 11. Critical-flow-registry scan

Two rows in `docs/critical-flow-registry.md` name `ListingCard.tsx`: "Listings display — price + date formatting (SSR/CSR parity)" (governs `formatPrice`/`formatCount`/`formatListingDate` — logic this task does not touch) and "Listing card rendering — Mantine pattern is the COMPLETE single source of truth" (governs the React composition/props contract with `MantineListingCardPattern` — unchanged, confirmed by §10 and the unchanged pattern md5). Neither flow's governed behavior is affected by an 8-site CSS-mechanism swap with a verified-zero computed-style diff. **No row is affected.**

## 12. Backlog update

`docs/backlog.md` updated: Task 702's registry row marked implemented, and the Sprint 46 line's "ready for `@executor`" note updated to reflect landing. Kept concise per the backlog rules; full evidence lives here, not in the backlog. Baseline was **89 lines** (from `git show HEAD:docs/backlog.md | wc -l`, already above the nominal 80-line target before this task touched it) — **`BACKLOG LIMIT BREACH`, pre-existing, not introduced by this edit.** Flagged for Opus consolidation per the standing rule; this task's own edit did not add net lines (see the diff Opus will review).
