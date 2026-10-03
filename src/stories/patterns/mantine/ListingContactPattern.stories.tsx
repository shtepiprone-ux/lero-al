import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Grid, Stack, Text, Button, useMantineTheme } from '@mantine/core';
import { MessageCircle, FolderOpen } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { formatPrice } from '@/lib/formatters';
import { convertPrice, type ExchangeRates } from '@/lib/getExchangeRate';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineListingContactPattern, type MantineListingContactLabels } from '@/design-system/mantine/patterns/MantineListingContactPattern';
import { ListingContact } from '@/modules/listings/components/ListingContact';
import { StoryPageGutter } from '@/stories/_StoryPageGutter';

const meta: Meta<typeof MantineListingContactPattern> = {
  title: 'Patterns/Mantine/ListingContactPattern',
  component: MantineListingContactPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Listing-detail sticky contact card (Task 616 D2) — all Mantine, mirrors ListingContact.tsx content. favorite/inquiry/report are positioned nodes (hook-free split, Task 605 pattern). Task 793 removed the card\'s own share button (moved to MantineListingDetailPattern\'s badges row) and added the saveTrigger slot + loading state below. States: normal / guest-CTA / owner-deleted / loading / contactDisabled (archived/expired) / closedListing (sold/rented, F2: Call/WhatsApp/Send-message now disabled here too).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingContactPattern>;

function makeLabels(l: string): MantineListingContactLabels {
  return {
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
  };
}

// Demo positioned nodes — plain Mantine primitives standing in for the real stateful
// ListingInquiryDialog trigger / ListingReportDialog trigger / SaveToCollectionButton. Favorite
// and share are no longer rendered by this card (Task 784 D69-25 + Task 793) — both moved to
// `MantineListingDetailPattern`'s badges row.
function DemoInquiryTrigger({ l }: { l: string }) {
  const theme = useMantineTheme();
  return (
    <Button variant="filled" color="chat" fullWidth leftSection={<MessageCircle size={theme.other.iconSize.standard} />}>
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

// Task 793 E-A demo trigger — stands in for the real `SaveToCollectionButton`.
function DemoSaveTrigger({ l }: { l: string }) {
  const theme = useMantineTheme();
  return (
    <Button variant="default" fullWidth leftSection={<FolderOpen size={theme.other.iconSize.comfortable} />}>
      {storyT(l, 'storybook.mantine.listing_detail_save_to_collection')}
    </Button>
  );
}

const STORY_PRICE = 125000;
const STORY_PRICE_OLD = 138000;
const STORY_CURRENCY = 'EUR';
const STORY_VIEWER_CURRENCY = 'ALL';
// Fixture data (labelled): `rates` is ListingCard.smoke.test.tsx's fixture (ALL per 1 EUR = 100).
const rates: ExchangeRates = { ALL: 1, EUR: 100 };

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const labels = makeLabels(l);
    // Fixture data (labelled): the same numbers as Patterns/Mantine/ListingDetailView — reduced, not converted,
    // used by every section except the four price-state cards below. Prices go through the production formatter.
    const price = {
      price: formatPrice(STORY_PRICE, STORY_CURRENCY, l),
      priceOld: formatPrice(STORY_PRICE_OLD, STORY_CURRENCY, l),
    };

    // The four price states of the "normal" card: neither, reduced, converted (the viewer chose ALL), both.
    const convert = (n: number) => formatPrice(convertPrice(n, STORY_CURRENCY, STORY_VIEWER_CURRENCY, rates), STORY_VIEWER_CURRENCY, l);
    const ownerCurrency = {
      originalPrice: formatPrice(STORY_PRICE, STORY_CURRENCY, l),
      originalPriceLabel: storyT(l, 'listing.price_in_owner_currency'),
    };
    const normalPriceStates = [
      { key: 'plain', info: { price: formatPrice(STORY_PRICE, STORY_CURRENCY, l) } },
      { key: 'reduced', info: price },
      { key: 'converted', info: { price: convert(STORY_PRICE), ...ownerCurrency } },
      { key: 'reduced_converted', info: { price: convert(STORY_PRICE), priceOld: convert(STORY_PRICE_OLD), ...ownerCurrency } },
    ];

    return (
      // GR-3d: the profile wraps the page content. GR-3b: the card sits in the production sidebar
      // column (MantineListingDetailPattern `rightSpan`, sidebarFrom 'md': full width, then 5/12, 4/12 from xl).
      <StoryPageGutter>
      <Grid gutter={0}>
      <Grid.Col span={{ base: 12, md: 5, xl: 4 }}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_normal')}
          </Text>
          {/* One card per price state a listing can be in (reduced / converted / both / neither). */}
          {normalPriceStates.map(({ key, info }) => (
            <Stack key={key} gap="xs">
              <Text size="xs" c="gray.5" fw={500}>
                {storyT(l, `storybook.mantine.listing_price_section_${key}`)}
              </Text>
              <MantineListingContactPattern
                state="normal"
                agent={{
                  name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
                  initials: 'EH',
                  isVerified: true,
                  subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company'),
                }}
                price={info}
                labels={labels}
                hasPhone
                hasWhatsapp
                inquiryTrigger={<DemoInquiryTrigger l={l} />}
                saveTrigger={<DemoSaveTrigger l={l} />}
                reportTrigger={<DemoReportTrigger l={l} />}
              />
            </Stack>
          ))}
        </Stack>

        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_loading')}
          </Text>
          <MantineListingContactPattern
            state="normal"
            agent={{
              name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
              initials: 'EH',
              isVerified: true,
              subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company'),
            }}
            price={price}
            labels={labels}
            hasPhone
            hasWhatsapp
            loading
            inquiryTrigger={<DemoInquiryTrigger l={l} />}
            saveTrigger={<DemoSaveTrigger l={l} />}
            reportTrigger={<DemoReportTrigger l={l} />}
          />
        </Stack>

        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_guest')}
          </Text>
          <MantineListingContactPattern
            state="guestCta"
            agent={{ name: '', isVerified: false }}
            price={price}
            labels={labels}
          />
        </Stack>

        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_deleted')}
          </Text>
          <MantineListingContactPattern
            state="ownerDeleted"
            agent={{ name: storyT(l, 'storybook.mantine.listing_detail_deleted_title'), isVerified: false }}
            price={price}
            labels={labels}
          />
        </Stack>

        {/* Task 793 F1 (review 16.2) — `contactDisabled` for archived/expired: `state="normal"`
            unchanged, Call/WhatsApp/Send-message disabled via `contactDisabled`, no headline
            block (archived/expired don't get one — only `closedListing` does). */}
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_contact_disabled')}
          </Text>
          <MantineListingContactPattern
            state="normal"
            agent={{
              name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
              initials: 'EH',
              isVerified: true,
              subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company'),
            }}
            price={price}
            labels={labels}
            hasPhone
            hasWhatsapp
            contactDisabled
            contactDisabledLabel={storyT(l, 'storybook.mantine.listing_detail_closed_label')}
            inquiryTrigger={<DemoInquiryTrigger l={l} />}
            saveTrigger={<DemoSaveTrigger l={l} />}
          />
        </Stack>

        {/* Task 793 F2 (owner instruction, 2026-09-06) — `closedListing` (sold/rented): the
            headline block AND disabled Call/WhatsApp/Send-message now render together (F2
            superseded the original design's "Call/WhatsApp stay active" split — the owner
            reported those buttons still active on a sold listing). */}
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_closed_listing')}
          </Text>
          <MantineListingContactPattern
            state="closedListing"
            agent={{
              name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
              initials: 'EH',
              isVerified: true,
              subtitle: storyT(l, 'storybook.mantine.listing_detail_agent_company'),
            }}
            price={price}
            labels={labels}
            hasPhone
            hasWhatsapp
            contactDisabled
            contactDisabledLabel={storyT(l, 'storybook.mantine.listing_detail_closed_label')}
            inquiryTrigger={<DemoInquiryTrigger l={l} />}
            saveTrigger={<DemoSaveTrigger l={l} />}
          />
        </Stack>

        {/* Task 793 — real production wiring: the actual `ListingContact` (not the canonical
            pattern in isolation), proving the real component composes the pattern the way the
            sections above demonstrate (story-first composition gate; check:story-coverage). */}
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_production')}
          </Text>
          <ListingContact
            owner={{
              id: 'story-owner-1',
              name: storyT(l, 'storybook.mantine.listing_detail_agent_name'),
              has_phone: true,
              has_whatsapp: true,
              avatar_url: null,
              user_type: 'agent',
              is_verified: true,
              company_name: storyT(l, 'storybook.mantine.listing_detail_agent_company'),
              deleted_at: null,
            }}
            isGuest={false}
            listingTitle={storyT(l, 'storybook.mantine.card_title_1')}
            price={STORY_PRICE}
            priceOld={STORY_PRICE_OLD}
            currency={STORY_CURRENCY}
            listingStatus="active"
            listingId="story-listing-1"
            canReport={false}
            inquiryListingId="story-listing-1"
            contactListingId="story-listing-1"
            canSendInquiry
          />
        </Stack>
      </Stack>
      </Grid.Col>
      </Grid>
      </StoryPageGutter>
    );
  },
};
