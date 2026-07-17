# Task 617 — `MantineListingCardPattern` legacy Badge → Mantine Badge, `filled` variant for photo-overlay legibility

Follow-up to Task 616's badge review, owner-directed 2026-07-17 (no formal kickoff file — direct
instruction, executed in-session). Scope: `MantineListingCardPattern` (and its Storybook story) still
imported the legacy `@/components/ui/badge` component and colored it via Tailwind `className` (the exact
cascade-layer defect fixed in Task 616's Detail pattern). Unlike Task 616's patterns, this component is
**already wired into the live site** (`ListingCard.tsx`, every listing card on the homepage/`/listings`),
so the fix had to cover the real production consumer too — confirmed with the owner via `AskUserQuestion`
before touching `ListingCard.tsx`.

## What changed

1. **`theme.ts`** — added a `purple` Mantine color (10-shade tuple, one authoritative stop cited to
   `tailadmin-style-reference.md §4` "theme-purple #7a5af8", the other 9 slots approximated from it —
   same derivation spirit already used for `brand`). Needed because `globals.css --status-rented:
   oklch(0.577 0.174 295)` (purple) had no existing Mantine color equivalent.
2. **`Mantine/Primitives/Badge` story** — added the two missing colors as swatches (`color="blueLight"`
   labeled "Info", `color="purple"` labeled "Purple") BEFORE using them anywhere else, per the "add a
   missing badge to the canonical primitive story first" rule.
3. **`MantineListingCardPattern.tsx`** — swapped `import { Badge } from '@/components/ui/badge'` for
   Mantine's own `Badge` (from `@mantine/core`); both render sites (`layout='grid'` corner overlay,
   `layout='list'` corner overlay) now render `<Badge color={b.color}>` — no more `className`-based
   coloring, no more manual `text-2xs px-1.5 py-0` Tailwind sizing (Mantine's own `size='sm'` theme
   default already renders 12px/500, matching the TailAdmin status-badge standard the theme's `Badge`
   `styles` callback already encodes).
4. **`ListingCard.tsx`** — `getBadges()` rewritten to emit `{label, color}` (Mantine theme color name)
   instead of `{label, variant, className}` (legacy shadcn variant + Tailwind class): `new`=green,
   `price_reduced`=brand (matches the literal `globals.css --badge-reduced: var(--brand-700)` token),
   `status_sold`=blueLight (matches `--status-info`), `status_rented`=purple (matches `--status-rented`,
   the new theme color), `status_archived`=gray, `status_expired`=yellow (matches `--status-warning`).
   Both `patternBadges` mapping sites (horizontal + vertical branch) updated to match. The centered
   rotated closed-overlay (`CLOSED_OVERLAY_STYLE`) is plain Tailwind-styled markup, not the `Badge`
   component — left untouched, out of scope.
5. **`ListingCardPattern.stories.tsx`** — `DemoCard`'s badge construction updated to the same
   `color`-only shape, mirroring `ListingCard.tsx`'s real mapping exactly.
6. **`MantineListingCardPattern.smoke.test.tsx`** — fixture updated (`{label:'New', variant:'default',
   className:'bg-badge-new'}` → `{label:'New', color:'green'}`) to match the new prop shape.

## Defect found and fixed mid-task (owner-caught from rendered screenshot)

First pass used the theme's default `variant='light'` (matching the Task 616 Detail-pattern decision).
Owner caught that this is wrong for THIS component: every badge here sits directly on top of the
listing photo (both layouts), and Mantine's `light` variant mixes a translucent tint — the photo
underneath bleeds through and kills legibility, visible in the rendered screenshot. The ORIGINAL legacy
design already understood this (`bg-badge-new text-primary-foreground` = solid opaque fill + white
text) — the correct native-Mantine equivalent is `variant="filled"`, not `variant="light"`.

**Fix:** added a "Filled — opaque, safe on photo overlays" section to the canonical `Badge` primitive
story FIRST (demoing `variant="filled"` for all 7 colors on a gray swatch background, to make the
"sits on a photo" case visible even in the plain primitive story), THEN hardcoded `variant="filled"`
in `MantineListingCardPattern.tsx`'s two Badge render sites (every badge in this component is a
photo-overlay, so there is no legitimate `light`/`outline` case here — the `variant` field was dropped
from `MantineListingCardBadge` and from `getBadges()`'s return shape entirely, simplifying the API).
Verified via a scoped Playwright screenshot before committing to a full rebuild+gate cycle: all badges
now render fully opaque with white text (green/brand-coral/blue/gray), matching the legacy visual
intent and fixing the readability defect.

## New i18n keys (3, all 4 locales)

`storybook.mantine.badge_info`, `badge_purple`, `badge_filled_caption` — added to `messages/{en,sq,uk,
it}.json`, each read back + `JSON.parse`-verified inline.

## Verification

- `npx tsc --noEmit` → 0 errors (re-run after every edit).
- `npx vitest run` on both smoke suites → 17/17 tests PASS (`MantineListingCardPattern.smoke.test.tsx`
  + `ListingCard.smoke.test.tsx` — the latter mounts the REAL `ListingCard` under a real
  `NextIntlClientProvider`, proving the production consumer still renders every preserved content item:
  title, price, badges, favorite, features, copy-id, sold/archived states).
- `npm run check:i18n` / `check:mojibake` / `check:file-integrity` / `check:stories` → all clean.
- Scoped Playwright screenshots (throwaway, not committed) confirmed the fix visually before each full
  gate run: card badges opaque/readable; `Badge` primitive story's new "Info"/"Purple"/"Filled" swatches
  render correctly.
- **`npm run screenshots:assert -- --mantine-only`** (952 cells): `925/952 PASS, 0 FAIL, 27 AMBIGUOUS`
  (byte-identical pre-existing set). One transient flake surfaced on an UNRELATED, untouched story
  (`ResponsiveActionFooter × sq × mobile-375`, `blank-canvas` render-timing artifact) on the first
  post-badge-fix run — confirmed non-reproducing via a targeted isolated re-check (content rendered
  correctly: real Albanian labels present, not blank) AND a full clean re-run (0 FAIL). Matches this
  project's prior documented flake pattern (Task 615's `PasswordInput` false alarm).
- **Anti-regression proof (clause 13):** two independent plants, both reverted clean:
  1. Grep gate — reintroduced `import { Badge as PlantedLegacyBadge } from '@/components/ui/badge'` into
     `MantineListingCardPattern.tsx` → `grep -rn "@/components/ui/"` immediately flagged it → reverted.
  2. Rendered gate — planted `style={{minWidth: 900}}` on the grid-layout `Card` root → rebuilt →
     `925/952` became `909/952 PASS, 16 FAIL` — all 16 fails were
     `Patterns/Mantine/ListingCardPattern/Default` mobile cells (`horizontal overflow` + cascading
     `offscreen-control` on the favorite button); every other story unaffected → reverted → rebuilt →
     re-ran → `925/952 PASS, 0 FAIL` again, byte-identical to baseline.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | Added `purple` Mantine color (one TailAdmin-cited stop + 9 approximated, same methodology as `brand`) for `status_rented`. |
| `src/stories/mantine/primitives/Badge.stories.tsx` | Added missing `blueLight`("Info")/`purple`("Purple") swatches + a new `variant="filled"` (opaque) demo section, before either was used elsewhere. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Swapped legacy `@/components/ui/badge` import for Mantine's own `Badge`; both corner-overlay render sites now use native `color` + hardcoded `variant="filled"` (photo-overlay legibility fix); simplified `MantineListingCardBadge` type. |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | Updated badge fixture to the new `{label, color}` shape. |
| `src/modules/listings/components/ListingCard.tsx` | `getBadges()` + both `patternBadges` mappings rewritten to emit native Mantine `color` instead of legacy `variant`+`className`. |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | `DemoCard` badge construction updated to match `ListingCard.tsx`'s real mapping. |
| `messages/{en,sq,uk,it}.json` | 3 new `storybook.mantine.badge_*` keys each. |
| `docs/backlog.md` | Mark Task 617 done, tidy Last Session. |
| `docs/sessions/2026-07-17-task617-listingcardpattern-mantine-badge-migration.md` | This session log. |

No git commands run (single-writer rule — executor never runs git).
