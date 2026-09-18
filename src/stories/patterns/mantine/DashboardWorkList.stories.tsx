import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Box, SimpleGrid } from '@mantine/core';
import { Inbox } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardWorkList, type DashboardWorkListRow } from '@/design-system/mantine/patterns/MantineDashboardWorkList';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { LISTING_STATUS_COLOR } from '@/modules/listings/lib/listingStatusTone';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardWorkList> = {
  title: 'Patterns/Mantine/DashboardWorkList',
  component: MantineDashboardWorkList,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical compact work-list (spec v3.3 §16.2 third row, §17.2 ADM-01/ADM-02/ADM-06). Each row is one link; the footer is a plain Button variant="transparent" (the ViewAllLink primitive without its own full-width-on-mobile override, which centered the footer instead of right-aligning it). Task 844. Viewport and locale switched via Storybook toolbar (Task 799 caveat).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardWorkList>;

// Frozen, named anchor (check:stories §14.10 — the fixture's own construction must not read the
// live clock). The Storybook preview clock is ALSO frozen to this same instant
// (`.storybook/preview-head.html:15`, Task 698, D25: `new Date()` with no arguments resolves to
// `2026-07-30T00:00:00.000Z` inside the preview iframe), so `RelativeTime`'s displayed text is
// fully deterministic in a capture, not drifting — this anchor must equal that frozen instant or
// every offset below renders in the future (review finding K1, 2026-09-18).
const FIXTURE_ANCHOR = new Date('2026-07-30T00:00:00.000Z');

function fiveRows(l: string): DashboardWorkListRow[] {
  const author = storyT(l, 'storybook.mantine.listing_detail_agent_name'); // "Elira Hoxha" — PER_STORY_TOKENS fixture (Task 624), never translated
  const ago = new Date(FIXTURE_ANCHOR.getTime() - 4 * 60 * 60 * 1000).toISOString();
  return [1, 2, 3, 4, 5].map((n) => ({
    id: String(n),
    href: `/admin/listings?status=pending&row=${n}`,
    primary: n === 3 ? storyT(l, 'storybook.listing.apartment_long') : storyT(l, 'storybook.listing.modern_apartment'),
    // Review G2 (2026-09-18) — the fixture rows demonstrate the real 853/854 shape: absoluteLabel
    // set (spec §17.4), and focusable={false} because this RelativeTime sits inside the row's
    // own <a>. Without focusable={false} the row would get a second tab stop, which is exactly
    // the defect G2 found and the WorkList smoke test's planted arm proves.
    meta: [author, <RelativeTime key="t" date={ago} absoluteLabel="29.07.2026 22:00" focusable={false} />],
    status: { label: storyT(l, 'storybook.mantine.admin_status_pending'), color: LISTING_STATUS_COLOR.pending },
    ctaLabel: storyT(l, 'storybook.mantine.dashboard_worklist_cta'),
  }));
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, lg: 2 }} p="md">
        <Box maw={theme.other!.boxSize!.content}>
          <MantineDashboardWorkList
            rows={fiveRows(l)}
            maxRows={5}
            footer={{ label: storyT(l, 'storybook.mantine.dashboard_worklist_footer'), href: '/admin/listings?status=pending' }}
            state="ready"
          />
        </Box>

        <Box maw={theme.other!.boxSize!.content}>
          <MantineDashboardWorkList rows={fiveRows(l).slice(0, 2)} maxRows={5} state="ready" />
        </Box>

        <Box maw={theme.other!.boxSize!.content}>
          <MantineDashboardWorkList
            rows={[]}
            state="loading"
            loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
          />
        </Box>

        <Box maw={theme.other!.boxSize!.content}>
          <MantineDashboardWorkList
            rows={[]}
            state="empty"
            emptyIcon={<Inbox size={theme.other!.iconSize!.decorative} aria-hidden="true" />}
            emptyText={storyT(l, 'storybook.mantine.dashboard_stat_zero_text')}
          />
        </Box>

        <Box maw={theme.other!.boxSize!.content}>
          <MantineDashboardWorkList
            rows={[]}
            state="error"
            errorText={storyT(l, 'storybook.mantine.dashboard_rows_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
          />
        </Box>
      </SimpleGrid>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC1 — the ready list shows at most 5 rows, each one <a> containing the CTA label; AC2 —
  // each row's height is at least theme.other.touchTarget (44px).
  play: async ({ canvasElement }) => {
    const anchors = canvasElement.querySelectorAll('a');
    expect(anchors.length).toBeGreaterThanOrEqual(5); // first group's 5 rows, at minimum
    const minPx = 44;
    for (const a of anchors) {
      const rect = a.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(minPx - 1);
    }
    const buttons = canvasElement.querySelectorAll('button');
    for (const button of buttons) {
      expect(button.closest('a')).toBeNull(); // Retry never nested in a row link
    }
  },
};

export const Loading: Story = {
  render: () => (
    <Box p="md" maw={theme.other!.boxSize!.content}>
      <MantineDashboardWorkList rows={[]} state="loading" />
    </Box>
  ),
};

export const Empty: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardWorkList
          rows={[]}
          state="empty"
          emptyIcon={<Inbox size={theme.other!.iconSize!.decorative} aria-hidden="true" />}
          emptyText={storyT(l, 'storybook.mantine.dashboard_stat_zero_text')}
        />
      </Box>
    );
  },
};

export const Error: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardWorkList
          rows={[]}
          state="error"
          errorText={storyT(l, 'storybook.mantine.dashboard_rows_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />
      </Box>
    );
  },
};
