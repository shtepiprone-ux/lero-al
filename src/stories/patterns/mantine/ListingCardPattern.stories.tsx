import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleGrid, Image, Stack, Divider, Title } from '@mantine/core';
import { BedDouble, Bath, Building2, Maximize2 } from 'lucide-react';
import { expect } from 'storybook/test';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingCardPattern, MantineCopyIdButton, type MantineListingCardBadge, type MantineListingCardOverlay } from '@/design-system/mantine/patterns';
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton';
import { SaveToCollectionButton } from '@/modules/listings/components/SaveToCollectionButton';
import { AuthContext } from '@/modules/auth/context/AuthContext';
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

// Task 764 Revision 1 (R23/AC23) — the real `SaveToCollectionButton` needs an authenticated
// `useAuth()` (§3.6: it returns `null` for a guest). Mirrors `ListingCard.stories.tsx`'s own
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

// Demo photo element — a plain Mantine `Image`, standing in for the real app's `AppImage`.
// The pattern's `.imageSection img` tag-selector hover-zoom targets this the same way it
// targets AppImage's inner <img> (Task 602 CSS-cascade note).
function DemoImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    // Explicit height — this fallback has no intrinsic size of its own (unlike the real
    // `AppImage`, whose container class reserves frame height to avoid CLS even with no photo).
    return (
      <div className="h-[180px] flex items-center justify-center bg-muted">
        <Maximize2 className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  return <Image src={src} alt={alt} h={180} fit="cover" />;
}

// Card feature chips — MUST mirror the live `getCardFeatures` output for an apartment,
// the COMPLETE metric set the real card shows (src/modules/listings/domain: schema
// `showInCard` fields, in `order`, with their CARD icons):
//   rooms → bed-double · bathrooms → bath · area → area(Maximize2) · floor → building
// (floor uses `iconInCard: 'building'`, NOT layers). Do NOT drop, reorder, or swap icons —
// this is the schema's authoritative, full card metric set.
function demoFeatures(l: string) {
  return [
    { icon: <BedDouble className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_rooms') },
    { icon: <Bath className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_bathrooms') },
    { icon: <Maximize2 className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_area') },
    { icon: <Building2 className="h-3.5 w-3.5" />, value: storyT(l, 'storybook.mantine.listing_feature_floor') },
  ];
}

// Footer actions — the REAL canonical `MantineCopyIdButton` + date cluster. Structurally
// mirrors ListingCard.tsx exactly: grid layout wraps in the same flex div; list layout is a
// bare fragment (the pattern's own `layout="list"` footer row already supplies the flex
// wrapper), so the story is a truthful rendering of production markup, not an approximation.
function DemoFooterActions({ locale, id, layout }: { locale: string; id: string; layout: 'grid' | 'list' }) {
  const copyButton = (
    <MantineCopyIdButton
      id={id}
      label={`#${id}`}
      copyLabel={storyT(locale, 'storybook.mantine.copy_id_button_aria_copy')}
      copiedLabel={storyT(locale, 'storybook.mantine.copy_id_button_aria_copied')}
    />
  );
  const dateLabel = <span className="whitespace-nowrap">{storyT(locale, 'storybook.mantine.card_footer_date')}</span>;

  if (layout === 'list') {
    return (
      <>
        {copyButton}
        {dateLabel}
      </>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
      {copyButton}
      {dateLabel}
    </div>
  );
}

interface DemoCardOpts {
  l: string
  id: string
  layout?: 'grid' | 'list'
  reduced?: boolean
  premium?: boolean
  archived?: boolean
  sold?: boolean
  noImage?: boolean
  favorited?: boolean
  photoCount?: number
  /** Task 764 Revision 1 — renders the real `SaveToCollectionButton` in the new `imageActions` slot (R23). `layout='grid'` only (Q2). */
  withImageActions?: boolean
}

function DemoCard({ l, id, layout = 'grid', reduced = false, premium = false, archived = false, sold = false, noImage = false, favorited = false, photoCount = 5, withImageActions = false }: DemoCardOpts) {
  // Tone -> Mantine theme color (Task 617 — matches ListingCard.tsx's real getBadges() mapping):
  // new=green, reduced=sale (Task 619 — dedicated owner-provided crimson #dd0939, replacing
  // brand; matches the detail pattern's reduced badge so the signal reads the same color across
  // the whole product), sold=blueLight (globals.css --status-info), archived=gray. Pattern always
  // renders these variant="filled" (opaque, safe over the photo) — no `variant` field needed on
  // the badge data itself.
  const badges: MantineListingCardBadge[] = [];
  if (!sold && !archived) {
    badges.push({
      label: reduced ? storyT(l, 'storybook.mantine.card_badge_reduced') : storyT(l, 'storybook.mantine.card_badge_new'),
      color: reduced ? 'sale' : 'green',
    });
  }
  if (sold) {
    badges.push({ label: storyT(l, 'storybook.mantine.card_overlay_sold'), color: 'blueLight' });
  }
  if (archived) {
    badges.push({ label: storyT(l, 'storybook.mantine.card_badge_archived'), color: 'gray' });
  }

  // Task 741 — the pattern's colour styling is retired; this story now proves only the
  // `overlay.className` pass-through CONTRACT with a non-Tailwind hook class the scanner cannot
  // resolve to a utility. Production's real sold/rented colours are proven by
  // `ListingCard.stories.tsx` through the real `ListingCard` (the actual producer, Task 741 §3.8).
  const overlay: MantineListingCardOverlay | undefined = sold
    ? { label: storyT(l, 'storybook.mantine.card_overlay_sold'), className: 'consumer-overlay-hook' }
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
      image={<DemoImage src={noImage ? undefined : DEMO_IMAGE_URL} alt={storyT(l, 'storybook.mantine.card_title_1')} />}
      favorite={
        <FavoriteButton
          listingId={id}
          isFavorited={favorited}
          overlay={layout === 'grid'}
          className={layout === 'list' ? 'shrink-0 -mt-0.5 -mr-1' : 'shadow-sm'}
        />
      }
      imageActions={
        withImageActions
          ? <SaveToCollectionButton listingId={id} className="bg-card/80 hover:bg-card shadow-sm rounded-lg" />
          : undefined
      }
      typeLabel={storyT(l, 'storybook.mantine.card_type_label')}
      badges={badges}
      overlay={overlay}
      photoCount={noImage ? 0 : photoCount}
      features={demoFeatures(l)}
      pricePerSqmStr={storyT(l, 'storybook.mantine.card_price_per_sqm_1')}
      footerActions={<DemoFooterActions locale={l} id={id} layout={layout} />}
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
        <Stack gap="xl" p="md">
          <Stack gap="sm">
            <Title order={4}>{storyT(l, 'storybook.mantine.card_section_grid')}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {/* Regular listing — favorite (unfavorited), new badge, photo counter, real SaveToCollectionButton in imageActions (Task 764 Revision 1, R23) */}
              <DemoCard l={l} id="1" photoCount={5} withImageActions />
              {/* Premium — brand ring/stripe + brand-tinted hover elevation, favorite already favorited */}
              <DemoCard l={l} id="2" premium favorited photoCount={8} />
              {/* Reduced-price — old price struck through + new price, reduced badge */}
              <DemoCard l={l} id="3" reduced photoCount={3} />
              {/* Sold — badge + centered rotated overlay, still shows favorite + photo counter */}
              <DemoCard l={l} id="4" sold photoCount={4} />
              {/* No-image fallback — Maximize2 placeholder, no photo counter (count=0) */}
              <DemoCard l={l} id="5" noImage />
              {/* Archived — grayscale/dimmed whole card + archived badge */}
              <DemoCard l={l} id="6" archived photoCount={2} />
            </SimpleGrid>
          </Stack>

          <Divider />

          <Stack gap="sm">
            <Title order={4}>{storyT(l, 'storybook.mantine.card_section_list')}</Title>
            <Stack gap="sm">
              {/* Regular — favorite inline (unfavorited), new badge, photo counter bottom-left (Task 656); no overlay (never had one — the badge already conveys sold/rented) */}
              <DemoCard l={l} id="7" layout="list" photoCount={5} />
              {/* Premium — brand ring + brand-tinted hover elevation, favorite already favorited */}
              <DemoCard l={l} id="8" layout="list" premium favorited photoCount={8} />
              {/* Reduced-price — old price struck through + new price, reduced badge */}
              <DemoCard l={l} id="9" layout="list" reduced photoCount={3} />
              {/* Sold — badge conveys status (no centered overlay in list mode) */}
              <DemoCard l={l} id="10" layout="list" sold photoCount={4} />
              {/* No-image fallback */}
              <DemoCard l={l} id="11" layout="list" noImage />
              {/* Archived — grayscale/dimmed whole row + archived badge */}
              <DemoCard l={l} id="12" layout="list" archived photoCount={2} />
            </Stack>
          </Stack>
        </Stack>
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
