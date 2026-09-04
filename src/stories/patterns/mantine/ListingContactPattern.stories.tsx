import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Text, Button } from '@mantine/core';
import { MessageCircle } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingContactPattern, type MantineListingContactLabels } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineListingContactPattern> = {
  title: 'Patterns/Mantine/ListingContactPattern',
  component: MantineListingContactPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Listing-detail sticky contact card (Task 616 D2) — all Mantine, mirrors ListingContact.tsx content. favorite/inquiry/report are positioned nodes (hook-free split, Task 605 pattern). States: normal / guest-CTA / owner-deleted.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingContactPattern>;

function makeLabels(l: string): MantineListingContactLabels {
  return {
    verified: storyT(l, 'storybook.mantine.listing_detail_verified_label'),
    call: storyT(l, 'storybook.mantine.listing_contact_call'),
    whatsapp: storyT(l, 'storybook.mantine.listing_contact_wa'),
    share: storyT(l, 'storybook.mantine.listing_detail_share'),
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
// ListingInquiryDialog trigger / ListingReportDialog trigger. Favorite is no longer rendered by
// this card (Task 784 D69-25) — it moved to `MantineListingDetailPattern`'s badges row.
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
      </Stack>
    );
  },
};
