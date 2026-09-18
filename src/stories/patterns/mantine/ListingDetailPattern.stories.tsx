import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, Paper, Stack, Text } from '@mantine/core';
import { MessageCircle, BedDouble, Bath, Maximize2, Building2 } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import {
  MantineListingDetailPattern,
  type ListingDetailBadge,
  type ListingFeature,
  type ListingAmenity,
} from '@/design-system/mantine/patterns/MantineListingDetailPattern';
import type { MantineListingContactPatternProps } from '@/design-system/mantine/patterns';
// Task 837 R1/R3 — the favorite slot, the share slot and the contact card's saveTrigger now render
// the REAL production components (clause 16c), not demo stand-ins. `FavoriteButton` and
// `SaveToCollectionButton` call `useAuth()` unconditionally — same technique as
// `FavoriteButton.stories.tsx`/`ListingCardPattern.stories.tsx`: the real `AuthContext.Provider` is
// supplied directly with a signed-in fixture, bypassing `AuthProvider`'s live-Supabase-subscribing
// `useEffect` mount (forbidden in stories).
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton';
import { ListingShareButton } from '@/modules/listings/components/ListingShareButton';
import { SaveToCollectionButton } from '@/modules/listings/components/SaveToCollectionButton';
import { AuthContext } from '@/modules/auth/context/AuthContext';
import type { User } from '@/types/database';

const meta: Meta<typeof MantineListingDetailPattern> = {
  title: 'Patterns/Mantine/ListingDetailPattern',
  component: MantineListingDetailPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Complete listing-detail surface (Task 616 D3, ALL-Mantine rebuild) — composes the D1 gallery pattern (photo -> Mantine lightbox) + a Mantine info block (badges/price/meta/key-features card/description card/amenities card) + the D2 sticky contact card. Fixture cited to presentationEngine.ts getDetailFeatures/getDetailAttributes. Task 791 added gallerySlot/contactSlot/contentFooter/originalPrice/sidebarFrom (E1-E5) — sections below the first (unlabeled, byte-identical to the pre-Task-791 story) demonstrate each extend. Task 793 added the `share` slot immediately right of `favorite` in the badges row, at every breakpoint (owner instruction, 2026-09-06). Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingDetailPattern>;

const DEMO_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80' },
  { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80' },
];

// Task 837 R1 — signed-in fixture for `AuthContext.Provider`, same shape as
// `FavoriteButton.stories.tsx`/`ListingCardPattern.stories.tsx` (both call `useAuth()`
// unconditionally: `FavoriteButton` directly, `SaveToCollectionButton` the same way).
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

// Task 837 R3 — two of the four remaining positioned nodes are still demo stand-ins (no real,
// importable production component exists to render in their place):
//   - `DemoInquiryTrigger` mirrors `ListingContact.tsx:201-206`'s inline `<Button>` exactly (no
//     `variant` set — Mantine's own default variant is `filled`, matching production). There is no
//     standalone `ListingInquiryTrigger` component to import; this is "proven-equal" (R3), not "real".
//   - `DemoReportTrigger` stands in for `ListingReportDialog.tsx:89-98`'s trigger, which is a LEGACY
//     shadcn `Button` (`@/components/ui/button`, `variant="ghost"`, Tailwind classes) — a different
//     design system with no Mantine-equivalent chrome. `ListingReportDialog` itself is one of the
//     three legacy `@/components/ui/dialog` dialogs owned by Task 795 (§3.4/§8 of this task's
//     kickoff); until that migration lands there is no real or proven-equal disposition available,
//     so this stand-in is filed as a numbered follow-up against Task 795 (session log R3 table).
function DemoInquiryTrigger({ l }: { l: string }) {
  return (
    <Button fullWidth leftSection={<MessageCircle size={18} />}>
      {storyT(l, 'storybook.mantine.listing_detail_inquiry')}
    </Button>
  );
}

function DemoReportTrigger({ l }: { l: string }) {
  return (
    <Button variant="subtle" size="xs" color="gray" fullWidth>
      {storyT(l, 'storybook.mantine.listing_detail_report')}
    </Button>
  );
}

// Key features — mirrors getDetailFeatures() (presentationEngine.ts:138) order + icons, cited
// to propertyTypeSchema.ts FIELD_DEFAULTS (rooms iconInCard='bed-double', bathrooms icon='bath',
// area icon='area'/Maximize2, floor iconInCard='building') — same icon set as
// ListingCardPattern.stories.tsx demoFeatures. Short labels + distinct values (never a
// full-phrase-as-label — the v1 defect this rebuild fixes).
function demoFeatures(l: string): ListingFeature[] {
  return [
    { icon: <BedDouble size={14} />, label: storyT(l, 'storybook.mantine.listing_detail_feature_label_rooms'), value: '3' },
    { icon: <Bath size={14} />, label: storyT(l, 'storybook.mantine.listing_detail_feature_label_bathrooms'), value: '2' },
    { icon: <Maximize2 size={14} />, label: storyT(l, 'storybook.mantine.listing_detail_feature_label_area'), value: '85 m²' },
    { icon: <Building2 size={14} />, label: storyT(l, 'storybook.mantine.listing_detail_feature_label_floor'), value: '3/5' },
  ];
}

// Amenities — mirrors getDetailAttributes() (presentationEngine.ts:182): condition / heating /
// wall_type, in schema order (propertyTypeSchema.ts FIELD_DEFAULTS order 1/2/3).
function demoAmenities(l: string): ListingAmenity[] {
  return [
    { label: storyT(l, 'storybook.mantine.listing_detail_amenity_condition_label'), value: storyT(l, 'storybook.mantine.listing_detail_amenity_condition_value') },
    { label: storyT(l, 'storybook.mantine.listing_detail_amenity_heating_label'), value: storyT(l, 'storybook.mantine.listing_detail_amenity_heating_value') },
    { label: storyT(l, 'storybook.mantine.listing_detail_amenity_wall_label'), value: storyT(l, 'storybook.mantine.listing_detail_amenity_wall_value') },
  ];
}

// Badges — new/premium/reduced map to the `--badge-*` tokens (globals.css:373-375, green/gold/
// brand); type badge (listing_type) is neutral/outline. Cited, not invented.
function demoBadges(l: string): ListingDetailBadge[] {
  return [
    { label: storyT(l, 'storybook.mantine.card_badge_new'), tone: 'new' },
    { label: storyT(l, 'storybook.mantine.card_badge_premium'), tone: 'premium' },
    { label: storyT(l, 'storybook.mantine.card_badge_reduced'), tone: 'reduced' },
    { label: storyT(l, 'storybook.mantine.card_type_label'), tone: 'type' },
  ];
}

function demoContact(l: string): MantineListingContactPatternProps {
  return {
    state: 'normal',
    agent: {
      name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
      initials: 'EH',
      isVerified: true,
      subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company'),
    },
    price: {
      price: storyT(l, 'storybook.mantine.card_price_1'),
      originalPrice: storyT(l, 'storybook.mantine.card_price_old_1'),
      originalPriceLabel: storyT(l, 'storybook.mantine.listing_detail_original_price_label'),
    },
    labels: {
      verified: storyT(l, 'storybook.mantine.listing_detail_verified_label'),
      call: storyT(l, 'storybook.mantine.listing_contact_call'),
      whatsapp: storyT(l, 'storybook.mantine.listing_contact_wa'),
      inquiry: storyT(l, 'storybook.mantine.listing_detail_inquiry'),
      report: storyT(l, 'storybook.mantine.listing_detail_report'),
      loginCta: storyT(l, 'storybook.mantine.listing_detail_login_cta'),
      guestTitle: storyT(l, 'storybook.mantine.listing_detail_guest_title'),
      guestDesc: storyT(l, 'storybook.mantine.listing_detail_guest_desc'),
      deletedTitle: storyT(l, 'storybook.mantine.listing_detail_deleted_title'),
      deletedDesc: storyT(l, 'storybook.mantine.listing_detail_deleted_desc'),
      unavailableDesc: storyT(l, 'storybook.mantine.listing_detail_unavailable_desc'),
      closedLabel: storyT(l, 'storybook.mantine.listing_detail_closed_label'),
    },
    hasPhone: true,
    hasWhatsapp: true,
    inquiryTrigger: <DemoInquiryTrigger l={l} />,
    // Task 837 R3 — real production component (`ListingContact.tsx:228`'s exact call shape:
    // `variant="default"`, `size="lg"`, no className/overlay override).
    saveTrigger: <SaveToCollectionButton listingId="story-detail-1" variant="default" size="lg" />,
    reportTrigger: <DemoReportTrigger l={l} />,
  };
}

/** Shared base props for every section — kept in one place so the first (unlabeled) section's
 * rendered output is provably identical to before Task 791 (same values, same call), and every
 * extend section below only overrides the one prop its extend added. */
function buildBaseProps(l: string) {
  return {
    galleryLabels: {
      close: storyT(l, 'storybook.mantine.lightbox_close'),
      prev: storyT(l, 'storybook.mantine.lightbox_prev'),
      next: storyT(l, 'storybook.mantine.lightbox_next'),
      counter: (index: number, total: number) => `${index} / ${total}`,
    },
    data: {
      title: storyT(l, 'storybook.mantine.card_title_1'),
      location: storyT(l, 'storybook.mantine.card_location_tirana'),
      price: storyT(l, 'storybook.mantine.card_price_1'),
      priceOld: storyT(l, 'storybook.mantine.card_price_old_1'),
      originalPriceLabel: storyT(l, 'storybook.mantine.listing_detail_original_price_label'),
      pricePerSqm: storyT(l, 'storybook.mantine.card_price_per_sqm_1'),
      views: 128,
      viewsLabel: storyT(l, 'storybook.mantine.listing_detail_views_label'),
      date: storyT(l, 'storybook.mantine.card_footer_date'),
      publicId: storyT(l, 'storybook.mantine.listing_detail_public_id'),
      description: storyT(l, 'storybook.mantine.listing_detail_description'),
    },
    images: DEMO_IMAGES,
    badges: demoBadges(l),
    features: demoFeatures(l),
    descriptionTitle: storyT(l, 'storybook.mantine.listing_detail_description_title'),
    amenitiesTitle: storyT(l, 'storybook.mantine.listing_detail_amenities_title'),
    amenities: demoAmenities(l),
    contact: demoContact(l),
    // Task 837 R1 — real production component, `ListingDetailView.tsx:248-254`'s exact prop shape
    // (`listingId`, `isFavorited` — no `className`, no `overlay`, no size/radius/variant override,
    // default `shape="icon"`).
    favorite: <FavoriteButton listingId="story-detail-1" isFavorited={false} />,
    // Task 837 R3 — real production component (`ListingDetailView.tsx:257`'s exact call shape).
    share: <ListingShareButton listingTitle={storyT(l, 'storybook.mantine.card_title_1')} listingUrl="https://lero.al/listings/story-detail-1" />,
  };
}

// paddingTop matches the contact card's own `position:'sticky', top:80` offset (the Task 615/
// legacy `top-20` header-clearance value, cited in MantineListingDetailPattern.tsx). On the real
// page this offset never visibly triggers a gap — `Header.tsx` is a normal in-flow bar (not
// sticky/fixed), so the header + breadcrumb bar above the fold already push the grid row well
// past 80px before any scroll happens. This isolated story has no such chrome above it, so
// without this spacer the sticky constraint holds the card at `top:80` from the very first paint
// while the gallery starts at the story's own padding (16px) — a story-only visual artifact, not
// a production defect. Matching the padding to the SAME already-cited 80px keeps the two columns
// visually level, exactly as they render in production.
const SECTION_STYLE: CSSProperties = { padding: 'var(--mantine-spacing-md)', paddingTop: 80 };

function SlotDemoCard({ text }: { text: string }) {
  return (
    <Paper withBorder radius="lg" p="xl" bg="gray.0" style={{ textAlign: 'center' }}>
      <Text fw={600}>{text}</Text>
    </Paper>
  );
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const base = buildBaseProps(l);
    // Task 837 R1 negative flow — closed/archived/expired listings disable the favorite in the
    // badges row (`ListingDetailView.tsx:238-245`'s branch). Applied to the E5 section below only;
    // every other section keeps `base.favorite` (enabled) unchanged.
    const disabledFavorite = (
      <FavoriteButton
        listingId="story-detail-1"
        isFavorited={false}
        disabled
        disabledLabel={storyT(l, 'listing.action_disabled_sold')}
      />
    );

    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <Stack gap={0}>
          {/* Unlabeled — byte-identical to the pre-Task-791 `Default` story (same props, same
              structure). Do not add a label Text above this section. */}
          <div style={SECTION_STYLE}>
            <MantineListingDetailPattern
              data={base.data}
              images={base.images}
              galleryLabels={base.galleryLabels}
              badges={base.badges}
              features={base.features}
              descriptionTitle={base.descriptionTitle}
              amenitiesTitle={base.amenitiesTitle}
              amenities={base.amenities}
              contact={base.contact}
              favorite={base.favorite}
              share={base.share}
            />
          </div>

          {/* ── Task 791 E1 — gallerySlot ── */}
          <div style={SECTION_STYLE}>
            <Stack gap="xs" mb="md">
              <Text size="xs" c="gray.5" fw={500}>
                {storyT(l, 'storybook.mantine.listing_detail_section_gallery_slot')}
              </Text>
            </Stack>
            <MantineListingDetailPattern
              data={base.data}
              images={base.images}
              galleryLabels={base.galleryLabels}
              badges={base.badges}
              features={base.features}
              descriptionTitle={base.descriptionTitle}
              amenitiesTitle={base.amenitiesTitle}
              amenities={base.amenities}
              contact={base.contact}
              favorite={base.favorite}
              share={base.share}
              gallerySlot={<SlotDemoCard text={storyT(l, 'storybook.mantine.listing_detail_gallery_slot_demo')} />}
            />
          </div>

          {/* ── Task 791 E2 — contactSlot (`contact` omitted entirely, proving no empty sidebar) ── */}
          <div style={SECTION_STYLE}>
            <Stack gap="xs" mb="md">
              <Text size="xs" c="gray.5" fw={500}>
                {storyT(l, 'storybook.mantine.listing_detail_section_contact_slot')}
              </Text>
            </Stack>
            <MantineListingDetailPattern
              data={base.data}
              images={base.images}
              galleryLabels={base.galleryLabels}
              badges={base.badges}
              features={base.features}
              descriptionTitle={base.descriptionTitle}
              amenitiesTitle={base.amenitiesTitle}
              amenities={base.amenities}
              favorite={base.favorite}
              share={base.share}
              contactSlot={<SlotDemoCard text={storyT(l, 'storybook.mantine.listing_detail_contact_slot_demo')} />}
            />
          </div>

          {/* ── Task 791 E3 — contentFooter ── */}
          <div style={SECTION_STYLE}>
            <Stack gap="xs" mb="md">
              <Text size="xs" c="gray.5" fw={500}>
                {storyT(l, 'storybook.mantine.listing_detail_section_content_footer')}
              </Text>
            </Stack>
            <MantineListingDetailPattern
              data={base.data}
              images={base.images}
              galleryLabels={base.galleryLabels}
              badges={base.badges}
              features={base.features}
              descriptionTitle={base.descriptionTitle}
              amenitiesTitle={base.amenitiesTitle}
              amenities={base.amenities}
              contact={base.contact}
              favorite={base.favorite}
              share={base.share}
              contentFooter={<SlotDemoCard text={storyT(l, 'storybook.mantine.listing_detail_content_footer_demo')} />}
            />
          </div>

          {/* ── Task 791 E4 — originalPrice, rendered together with originalPriceLabel ── */}
          <div style={SECTION_STYLE}>
            <Stack gap="xs" mb="md">
              <Text size="xs" c="gray.5" fw={500}>
                {storyT(l, 'storybook.mantine.listing_detail_section_original_price')}
              </Text>
            </Stack>
            <MantineListingDetailPattern
              data={{ ...base.data, originalPrice: storyT(l, 'storybook.mantine.card_price_1') }}
              images={base.images}
              galleryLabels={base.galleryLabels}
              badges={base.badges}
              features={base.features}
              descriptionTitle={base.descriptionTitle}
              amenitiesTitle={base.amenitiesTitle}
              amenities={base.amenities}
              contact={base.contact}
              favorite={base.favorite}
              share={base.share}
            />
          </div>

          {/* ── Task 791 E5 — sidebarFrom="lg" (unlabeled first section above keeps the "md" default).
              Task 837 R1 negative flow — this section's favorite is the DISABLED state
              (ListingDetailView.tsx:238-245's closed/archived/expired branch), so at least one
              rendered section proves disabled + disabledLabel. ── */}
          <div style={SECTION_STYLE}>
            <Stack gap="xs" mb="md">
              <Text size="xs" c="gray.5" fw={500}>
                {storyT(l, 'storybook.mantine.listing_detail_section_sidebar_lg')}
              </Text>
            </Stack>
            <MantineListingDetailPattern
              data={base.data}
              images={base.images}
              galleryLabels={base.galleryLabels}
              badges={base.badges}
              features={base.features}
              descriptionTitle={base.descriptionTitle}
              amenitiesTitle={base.amenitiesTitle}
              amenities={base.amenities}
              contact={base.contact}
              favorite={disabledFavorite}
              share={base.share}
              sidebarFrom="lg"
            />
          </div>
        </Stack>
      </AuthContext.Provider>
    );
  },
};
