import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Text } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { StoryPageGutter } from '@/stories/_StoryPageGutter';
import { formatPrice } from '@/lib/formatters';
import { convertPrice, type ExchangeRates } from '@/lib/getExchangeRate';
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/ListingContactPattern`).
import { MantineListingPrice } from '@/design-system/mantine/patterns/MantineListingPrice';

const meta: Meta<typeof MantineListingPrice> = {
  title: 'Patterns/Mantine/ListingPrice',
  component: MantineListingPrice,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical listing price block (Task 912 R11). Top to bottom: the struck original price (only when the owner lowered the price), the current price, then the price in the owner\'s currency (plain, only when the viewer\'s currency differs from the listing\'s). Four states below: plain, reduced, converted, reduced + converted. Prices follow production: formatPrice for text, convertPrice with the ListingCard test rates for conversion.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingPrice>;

// Fixture data (labelled): the same numbers as `Patterns/Mantine/ListingDetailView` — 125,000 EUR,
// lowered from 138,000 EUR. `rates` is `ListingCard.smoke.test.tsx`'s fixture (ALL per 1 EUR = 100).
const rates: ExchangeRates = { ALL: 1, EUR: 100 };
const PRICE = 125000;
const PRICE_OLD = 138000;
const OWNER_CURRENCY = 'EUR';
const VIEWER_CURRENCY = 'ALL';

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const ownerLabel = storyT(l, 'listing.price_in_owner_currency');
    const ownerValue = formatPrice(PRICE, OWNER_CURRENCY, l);
    const convert = (n: number) => formatPrice(convertPrice(n, OWNER_CURRENCY, VIEWER_CURRENCY, rates), VIEWER_CURRENCY, l);

    return (
      // GR-3d: the profile wraps the page content (the block has no gutter of its own).
      // GR-3b: fluid — the block fills its container, as in the production contact/detail columns.
      <StoryPageGutter>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {storyT(l, 'storybook.mantine.listing_price_section_plain')}
            </Text>
            <MantineListingPrice price={formatPrice(PRICE, OWNER_CURRENCY, l)} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {storyT(l, 'storybook.mantine.listing_price_section_reduced')}
            </Text>
            <MantineListingPrice
              price={formatPrice(PRICE, OWNER_CURRENCY, l)}
              priceOld={formatPrice(PRICE_OLD, OWNER_CURRENCY, l)}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {storyT(l, 'storybook.mantine.listing_price_section_converted')}
            </Text>
            <MantineListingPrice
              price={convert(PRICE)}
              ownerCurrency={{ label: ownerLabel, value: ownerValue }}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {storyT(l, 'storybook.mantine.listing_price_section_reduced_converted')}
            </Text>
            <MantineListingPrice
              price={convert(PRICE)}
              priceOld={convert(PRICE_OLD)}
              ownerCurrency={{ label: ownerLabel, value: ownerValue }}
            />
          </Stack>
        </Stack>
      </StoryPageGutter>
    );
  },
};
