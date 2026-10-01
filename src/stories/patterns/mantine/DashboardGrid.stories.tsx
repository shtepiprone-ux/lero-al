import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Eye, Heart, Home, MessageSquare } from 'lucide-react';
import { Text } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import {
  MantineDashboardGrid,
  MantineDashboardGridFull,
  MantineDashboardGridSplit,
  MantineDashboardGridTopRow,
} from '@/design-system/mantine/patterns/MantineDashboardGrid';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineDashboardStatCard } from '@/design-system/mantine/patterns/MantineDashboardStatCard';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardGrid> = {
  title: 'Patterns/Mantine/DashboardGrid',
  component: MantineDashboardGrid,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical dashboard layout (spec v3.3 §17.1): content capped at the theme\'s `dashboardContentMaxWidth`, theme gutters, and three rows — `TopRow` (up to 4 cards, closes over a missing card), `Split` (8 + 4) and `Full`. Columns: 4/3 across from `lg`, 2 at `md`, 1 below. Task 846. Viewport and locale switched via Storybook toolbar (Task 799 caveat — open iframe.html directly and resize the browser window for owner review).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardGrid>;

function statCards(l: string) {
  const icon = (Icon: typeof Home) => <Icon size={theme.other!.iconSize!.decorative} />;
  return [
    { key: 'listings', icon: icon(Home), label: storyT(l, 'storybook.mantine.dashboard_grid_stat_listings'), value: '128' },
    { key: 'views', icon: icon(Eye), label: storyT(l, 'storybook.mantine.dashboard_grid_stat_views'), value: '4 512' },
    { key: 'inquiries', icon: icon(MessageSquare), label: storyT(l, 'storybook.mantine.dashboard_grid_stat_inquiries'), value: '37' },
    { key: 'favorites', icon: icon(Heart), label: storyT(l, 'storybook.mantine.dashboard_grid_stat_favorites'), value: '96' },
  ];
}

// GR-3d (owner 2026-10-01): MantineDashboardGrid carries its own page gutter (MantineDashboardGrid.tsx:56), so no
// export adds a Box, StoryPageGutter or padding around it.
export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const cards = statCards(l);
    // A missing (unrendered) 4th card is passed as `false`, exactly as a consumer's `{cond && <Card />}`.
    const showFourth = false;
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridTopRow>
          {cards.map((c) => (
            <MantineDashboardStatCard key={c.key} icon={c.icon} label={c.label} value={c.value} state="ready" />
          ))}
        </MantineDashboardGridTopRow>

        <MantineDashboardGridTopRow>
          {cards.slice(0, 3).map((c) => (
            <MantineDashboardStatCard key={c.key} icon={c.icon} label={c.label} value={c.value} state="ready" />
          ))}
          {showFourth && (
            <MantineDashboardStatCard
              icon={cards[3].icon}
              label={cards[3].label}
              value={cards[3].value}
              state="ready"
            />
          )}
        </MantineDashboardGridTopRow>

        <MantineDashboardGridSplit
          main={
            <MantineDashboardCard
              title={storyT(l, 'storybook.mantine.dashboard_card_title')}
              scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
              state="ready"
            >
              <Text size="sm" c="gray.7">
                {storyT(l, 'storybook.mantine.dashboard_card_body')}
              </Text>
            </MantineDashboardCard>
          }
          side={
            <MantineDashboardCard
              title={storyT(l, 'storybook.mantine.dashboard_card_title')}
              scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
              state="ready"
            >
              <Text size="sm" c="gray.7">
                {storyT(l, 'storybook.mantine.dashboard_card_body')}
              </Text>
            </MantineDashboardCard>
          }
        />

        <MantineDashboardGridFull>
          <MantineDashboardCard
            title={storyT(l, 'storybook.mantine.dashboard_card_title')}
            scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
            state="ready"
          >
            <Text size="sm" c="gray.7">
              {storyT(l, 'storybook.mantine.dashboard_card_body')}
            </Text>
          </MantineDashboardCard>
        </MantineDashboardGridFull>
      </MantineDashboardGrid>
    );
  },
};

/** Task 890 (F1) — `maxColumns={2}`: four cards stay 2 × 2 at every width from `md`, never 4-up. */
export const MaxColumns: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridTopRow maxColumns={2}>
          {statCards(l).map((c) => (
            <MantineDashboardStatCard key={c.key} icon={c.icon} label={c.label} value={c.value} state="ready" />
          ))}
        </MantineDashboardGridTopRow>
      </MantineDashboardGrid>
    );
  },
};

/** Task 890 (F1) — `wideFrom="xl"`: four cards are 2 × 2 from `md` and 4-up only from `xl` (1280px), so the
 *  `lg` rung (1024–1279px) stays 2-up — the width a page has beside a fixed navbar. */
export const DeferredFourUp: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridTopRow wideFrom="xl">
          {statCards(l).map((c) => (
            <MantineDashboardStatCard key={c.key} icon={c.icon} label={c.label} value={c.value} state="ready" />
          ))}
        </MantineDashboardGridTopRow>
      </MantineDashboardGrid>
    );
  },
};
