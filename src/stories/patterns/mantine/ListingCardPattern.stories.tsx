import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleGrid, Stack, Divider, Title, Group, Text } from '@mantine/core';
import { BedDouble, Bath, Building2, Maximize2 } from 'lucide-react';
import { theme } from '@/design-system/mantine/theme';
import { expect } from 'storybook/test';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineListingCardPattern, type MantineListingCardBadge, type MantineListingCardOverlay } from '@/design-system/mantine/patterns/MantineListingCardPattern';
import { MantineCopyIdButton } from '@/design-system/mantine/patterns';
import { AppImage } from '@/design-system/media/AppImage';
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton';
import { AuthContext } from '@/modules/auth/context/AuthContext';
import { StoryPageGutter } from '@/stories/_StoryPageGutter';
import { LISTING_STATUS_COLOR } from '@/modules/listings/lib/listingStatusTone';
// Production's own favourite-chrome classes, so the Story writes no value of its own (Task 741 R3).
import styles from '@/modules/listings/components/ListingCard.module.css';
import { TITLE_FZ } from '@/design-system/mantine/typography';
import type { User } from '@/types/database';

const meta: Meta<typeof MantineListingCardPattern> = {
  title: 'Patterns/Mantine/ListingCardPattern',
  component: MantineListingCardPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Complete listing card (Task 605) — single source of truth for the real ListingCard. `layout="grid"` (default, Grid/Latest surfaces) and `layout="list"` (Task 606, List view — structural port of the legacy horizontal branch) both demoed below. Task 656: the favorite slot renders the REAL `FavoriteButton` and the footer copy-id control renders the REAL canonical `MantineCopyIdButton` — no demo stand-ins. Grid cols adapt via SimpleGrid responsive cols. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingCardPattern>;

const DEMO_IMAGE_URL = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop';

// The real `FavoriteButton` needs an authenticated `useAuth()`. Mirrors `ListingCard.stories.tsx`'s own
// `AuthContext.Provider` fixture technique — bypasses `AuthProvider`'s live Supabase mount
// (forbidden in stories) while still exercising the real button in its signed-in state.
const FIXTURE_USER: User = {
  id: 'story-user-001',
  public_id: 1,
  name: 'Story User',
  last_name: null,
  phone: null,
  whatsapp: null,
  avatar_url: null,
  role: 'user',
  user_type: 'private',
  status: 'active',
  block_reason: null,
  suspended_until: null,
  company_name: null,
  company_logo_url: null,
  company_id: null,
  website: null,
  is_verified: true,
  social_provider: null,
  location_id: null,
  position: null,
  year_started: null,
  deleted_at: null,
  location_request: null,
  preferred_currency: 'EUR',
  pending_email: null,
  last_seen_at: null,
  inactivity_warning_sent_at: null,
  preferred_locale: 'en',
  created_at: '2026-01-01T00:00:00.000Z',
};

const MOCK_SIGNED_IN_AUTH = {
  user: FIXTURE_USER,
  status: 'authenticated' as const,
  loading: false,
  signOut: () => {},
  refreshUser: () => {},
};

// Card feature chips — MUST mirror the live `getCardFeatures` output for an apartment,
// the COMPLETE metric set the real card shows (src/modules/listings/domain: schema
// `showInCard` fields, in `order`, with their CARD icons):
//   rooms → bed-double · bathrooms → bath · area → area(Maximize2) · floor → building
// (floor uses `iconInCard: 'building'`, NOT layers). Do NOT drop, reorder, or swap icons —
// this is the schema's authoritative, full card metric set.
function demoFeatures(l: string) {
  const iconSize = theme.other!.iconSize!.compact
  return [
    { icon: <BedDouble size={iconSize} />, value: storyT(l, 'storybook.mantine.listing_feature_rooms') },
    { icon: <Bath size={iconSize} />, value: storyT(l, 'storybook.mantine.listing_feature_bathrooms') },
    { icon: <Maximize2 size={iconSize} />, value: storyT(l, 'storybook.mantine.listing_feature_area') },
    { icon: <Building2 size={iconSize} />, value: storyT(l, 'storybook.mantine.listing_feature_floor') },
  ];
}

// Footer actions — the REAL canonical `MantineCopyIdButton` + date cluster. One node for both layouts, exactly as
// `ListingCard.tsx` builds it (Task 741 Revision 3h: grid and list card share every part).
function DemoFooterActions({ locale, id }: { locale: string; id: string }) {
  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap" fz="xs" c="dimmed">
      <MantineCopyIdButton
        id={id}
        label={`#${id}`}
        copyLabel={storyT(locale, 'storybook.mantine.copy_id_button_aria_copy')}
        copiedLabel={storyT(locale, 'storybook.mantine.copy_id_button_aria_copied')}
      />
      <Text component="span" size="xs" c="dimmed" miw="max-content">{storyT(locale, 'storybook.mantine.card_footer_date')}</Text>
    </Group>
  );
}

type DemoStatus = 'active' | 'inactive' | 'pending' | 'sold' | 'rented' | 'archived' | 'expired'

interface DemoCardOpts {
  l: string
  id: string
  layout?: 'grid' | 'list'
  status?: DemoStatus
  isNew?: boolean
  reduced?: boolean
  premium?: boolean
  noImage?: boolean
  favorited?: boolean
  photoCount?: number
}

function DemoCard({ l, id, layout = 'grid', status = 'active', isNew = false, reduced = false, premium = false, noImage = false, favorited = false, photoCount = 5 }: DemoCardOpts) {
  const sold = status === 'sold';
  const rented = status === 'rented';
  const archived = status === 'archived';
  // Tone -> Mantine theme color (Task 617 — matches ListingCard.tsx's real getBadges() mapping):
  // new=green, reduced=sale (Task 619 — dedicated owner-provided crimson #dd0939, replacing
  // brand; matches the detail pattern's reduced badge so the signal reads the same color across
  // the whole product). Every non-active status reads LISTING_STATUS_COLOR, as production does.
  // Pattern always renders these variant="filled" (opaque, safe over the photo) — no `variant`
  // field needed on the badge data itself.
  const badges: MantineListingCardBadge[] = [];
  if (status === 'active') {
    if (isNew) badges.push({ label: storyT(l, 'listing.new'), color: 'green' });
    if (reduced) badges.push({ label: storyT(l, 'listing.price_reduced'), color: 'sale' });
  }
  if (sold) {
    badges.push({ label: storyT(l, 'listing.status_sold'), color: LISTING_STATUS_COLOR.sold });
  }
  // Task 886 R40 — rented, as production `ListingCard.tsx` maps it (`status_rented` -> `purple`).
  if (rented) {
    badges.push({ label: storyT(l, 'listing.status_rented'), color: LISTING_STATUS_COLOR.rented });
  }
  if (archived) {
    badges.push({ label: storyT(l, 'listing.status_archived'), color: LISTING_STATUS_COLOR.archived });
  }
  // Task 741 R3b (R40, owner D46-4): expired, inactive and pending are labelled from the same map.
  if (status === 'expired') {
    badges.push({ label: storyT(l, 'listing.status_expired'), color: LISTING_STATUS_COLOR.expired });
  }
  if (status === 'inactive') {
    badges.push({ label: storyT(l, 'listing.status_inactive'), color: LISTING_STATUS_COLOR.inactive });
  }
  if (status === 'pending') {
    badges.push({ label: storyT(l, 'listing.status_pending'), color: LISTING_STATUS_COLOR.pending });
  }

  // Task 741 — `overlay.className` is a pass-through, proven with a non-Tailwind hook class the scanner
  // cannot resolve to a utility; the colour itself comes from `overlay.tone` (Task 886 R40).
  // Task 886 R40 — the pattern now owns the sold/rented overlay COLOUR (`overlay.tone`), so this Story shows the
  // same coloured overlay as production. `consumer-overlay-hook` stays on the sold card: the Task 741 play
  // assertion below proves the `overlay.className` pass-through contract.
  const overlay: MantineListingCardOverlay | undefined = sold
    ? { label: storyT(l, 'storybook.mantine.card_overlay_sold'), tone: 'sold', className: 'consumer-overlay-hook' }
    : rented
      ? { label: storyT(l, 'listing.status_rented').toUpperCase(), tone: 'rented' }
      : undefined;

  return (
    <MantineListingCardPattern
      layout={layout}
      data={{
        id,
        title: storyT(l, 'storybook.mantine.card_title_1'),
        location: storyT(l, 'storybook.mantine.card_location_tirana'),
        price: storyT(l, 'storybook.mantine.card_price_1'),
        priceOld: reduced ? storyT(l, 'storybook.mantine.card_price_old_1') : undefined,
      }}
      // Task 886 R29: the real `AppImage`, as production `ListingCard.tsx` renders it (`listing` in the grid,
      // `listing-thumb` in the list). The no-image card shows the canonical `MediaPlaceholder`.
      image={<AppImage variant={layout === 'list' ? 'listing-thumb' : 'listing'} src={noImage ? null : DEMO_IMAGE_URL} alt={storyT(l, 'storybook.mantine.card_title_1')} />}
      favorite={
        <FavoriteButton
          listingId={id}
          isFavorited={favorited}
          overlay={layout === 'grid'}
          className={layout === 'grid' ? styles.overlayFavorite : undefined}
        />
      }
      typeLabel={storyT(l, 'storybook.mantine.card_type_label')}
      badges={badges}
      overlay={overlay}
      photoCount={noImage ? 0 : photoCount}
      features={demoFeatures(l)}
      pricePerSqmStr={storyT(l, 'storybook.mantine.card_price_per_sqm_1')}
      footerActions={<DemoFooterActions locale={l} id={id} />}
      isPremium={premium}
      isArchived={archived}
    />
  );
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <StoryPageGutter>
        <Stack gap="xl">
          <Stack gap="sm">
            <Title order={4} fz={TITLE_FZ.h4}>{storyT(l, 'storybook.mantine.card_section_grid')}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {/* The same eleven states as `Mantine/Primitives/ListingCard` (Task 741 R3b, R40), in the same order. */}
              {/* 1 Active + New badge — favorite (unfavorited), photo counter */}
              <DemoCard l={l} id="1" isNew photoCount={5} />
              {/* 2 Active, no badge */}
              <DemoCard l={l} id="14" photoCount={5} />
              {/* 3 New + reduced-price — old price struck through + new price, both badges */}
              <DemoCard l={l} id="3" isNew reduced photoCount={3} />
              {/* 4 Premium — brand ring/stripe + brand-tinted hover elevation, favorite already favorited, no badge */}
              <DemoCard l={l} id="2" premium favorited photoCount={8} />
              {/* 5 Inactive — gray status badge (owner D46-4) */}
              <DemoCard l={l} id="15" status="inactive" photoCount={4} />
              {/* 6 Pending — yellow status badge (owner D46-4) */}
              <DemoCard l={l} id="16" status="pending" photoCount={4} />
              {/* 7 Sold — badge + centered rotated overlay, still shows favorite + photo counter */}
              <DemoCard l={l} id="4" status="sold" photoCount={4} />
              {/* 8 Rented — purple badge + the same coloured centered overlay, as production (Task 886 R40) */}
              <DemoCard l={l} id="13" status="rented" photoCount={4} />
              {/* 9 Archived — grayscale/dimmed whole card + archived badge */}
              <DemoCard l={l} id="6" status="archived" photoCount={2} />
              {/* 10 Expired — yellow status badge, no overlay */}
              <DemoCard l={l} id="17" status="expired" photoCount={4} />
              {/* 11 No-image fallback — Maximize2 placeholder, no photo counter (count=0) */}
              <DemoCard l={l} id="5" noImage />
            </SimpleGrid>
          </Stack>

          {/* List layout is not used below 640px (owner D46-3, 2026-10-04): hidden below `sm`, as
              `ListingsSortBar.tsx` hides its List toggle (`visibleFrom="sm"`). */}
          <Stack gap="xl" visibleFrom="sm">
            <Divider />

            <Stack gap="sm">
              <Title order={4} fz={TITLE_FZ.h4}>{storyT(l, 'storybook.mantine.card_section_list')}</Title>
              <Stack gap="sm">
                {/* The sold/rented overlay renders in list too (Task 741 R63): it is part of the shared photo chrome */}
                {/* 1 Active + New badge — favorite inline (unfavorited), photo counter bottom-right */}
                <DemoCard l={l} id="7" layout="list" isNew photoCount={5} />
                {/* 2 Active, no badge */}
                <DemoCard l={l} id="18" layout="list" photoCount={5} />
                {/* 3 New + reduced-price — old price struck through + new price, both badges */}
                <DemoCard l={l} id="9" layout="list" isNew reduced photoCount={3} />
                {/* 4 Premium — brand ring + brand-tinted hover elevation, favorite already favorited */}
                <DemoCard l={l} id="8" layout="list" premium favorited photoCount={8} />
                {/* 5 Inactive */}
                <DemoCard l={l} id="19" layout="list" status="inactive" photoCount={4} />
                {/* 6 Pending */}
                <DemoCard l={l} id="20" layout="list" status="pending" photoCount={4} />
                {/* 7 Sold — badge + centered rotated overlay, as in grid */}
                <DemoCard l={l} id="10" layout="list" status="sold" photoCount={4} />
                {/* 8 Rented — purple badge + the same coloured centered overlay */}
                <DemoCard l={l} id="21" layout="list" status="rented" photoCount={4} />
                {/* 9 Archived — grayscale/dimmed whole row + archived badge */}
                <DemoCard l={l} id="12" layout="list" status="archived" photoCount={2} />
                {/* 10 Expired */}
                <DemoCard l={l} id="22" layout="list" status="expired" photoCount={4} />
                {/* 11 No-image fallback */}
                <DemoCard l={l} id="11" layout="list" noImage />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
        </StoryPageGutter>
      </AuthContext.Provider>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement, globals }) => {
    // Task 741 R6/AC6 — proves the `overlay.className` pass-through CONTRACT: an arbitrary
    // consumer-supplied class (`consumer-overlay-hook`, not a Tailwind-resolvable utility) must
    // reach the rendered overlay label element.
    //
    // Gate-observability (Revision 1, F2): `storybook/test`'s project-level preview annotation
    // sets `throwPlayFunctionExceptions: false`, which makes Storybook's play-function runner
    // swallow a failed `expect()` into a bare `console.error` that matches none of
    // `check-stories-rendered.mjs`'s four `consoleErrors` patterns — the gate would be blind. This
    // story sets `throwPlayFunctionExceptions: true` locally (story annotations win over the
    // project-level default per `prepareStory`'s `combineParameters` precedence), so a failed
    // `expect()` here rethrows instead of being caught. Storybook's `renderException` then both (a)
    // sets `sb-show-errordisplay` on `document.body`, which `check-stories-rendered.mjs`'s render
    // check evaluates first and reports as `failReason: 'sb-show-errordisplay'`, and (b)
    // independently logs `Error rendering story '<id>':`, one of the four patterns its
    // `consoleErrors` collector matches — either signal alone fails the gate, so the assertion is
    // real and gate-observable, not cosmetic. Verified through the real gate at
    // `docs/reviews/artifacts/2026-08-14-task741/` (source plant at
    // `MantineListingCardPattern.tsx:320`, `cn(styles.overlayLabel, overlay.className)` ->
    // `cn(styles.overlayLabel)`; `screenshots:assert` exits non-zero, this cell's manifest entry
    // carries `failReason: 'sb-show-errordisplay'`, `failDetail: 'expected null not to be null'`,
    // and `consoleErrors: ["Error rendering story '...':"]`).
    //
    // Adjacent hazard, stated plainly and not papered over: `waitForStoryReady` (a separate,
    // earlier readiness wait) returns `{ ready: true }` once `document.body` carries
    // `sb-show-errordisplay`, so THAT layer alone treats an errored story as ready. It is the
    // later render-failure check — not the readiness wait — that actually catches this failure.
    const locale = (globals?.locale as string) ?? 'en';
    const hookEl = canvasElement.querySelector('.consumer-overlay-hook');
    expect(hookEl).not.toBeNull();
    expect(hookEl?.textContent).toBe(storyT(locale, 'storybook.mantine.card_overlay_sold'));
  },
};
