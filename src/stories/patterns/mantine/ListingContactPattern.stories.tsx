import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Text, Button } from '@mantine/core';
import { MessageCircle, FolderOpen } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingContactPattern, type MantineListingContactLabels } from '@/design-system/mantine/patterns';
import { ListingContact } from '@/modules/listings/components/ListingContact';

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
  return (
    <Button variant="outline" fullWidth leftSection={<MessageCircle size={18} />}>
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
  return (
    <Button variant="default" fullWidth leftSection={<FolderOpen size={18} />}>
      {storyT(l, 'storybook.mantine.listing_detail_save_to_collection')}
    </Button>
  );
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const labels = makeLabels(l);
    const price = {
      price: storyT(l, 'storybook.mantine.card_price_1'),
      originalPrice: storyT(l, 'storybook.mantine.card_price_old_1'),
      originalPriceLabel: storyT(l, 'storybook.mantine.listing_detail_original_price_label'),
    };

    return (
      <Stack gap="xl" p="md" maw={360}>
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            {storyT(l, 'storybook.mantine.listing_detail_section_normal')}
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
            inquiryTrigger={<DemoInquiryTrigger l={l} />}
            saveTrigger={<DemoSaveTrigger l={l} />}
            reportTrigger={<DemoReportTrigger l={l} />}
          />
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
            price={125000}
            currency="EUR"
            listingStatus="active"
            listingId="story-listing-1"
            canReport={false}
            inquiryListingId="story-listing-1"
            contactListingId="story-listing-1"
            canSendInquiry
          />
        </Stack>
      </Stack>
    );
  },
};
