import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Stack } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardHeader } from '@/design-system/mantine/patterns/MantineDashboardHeader';
import { MantineDashboardPeriodControl } from '@/design-system/mantine/patterns/MantineDashboardPeriodControl';
import type { PeriodSelection } from '@/lib/dashboard/period';
import { DASHBOARD_PERIOD_NOW, dashboardPeriodLabels } from '@/stories/fixtures/dashboardPeriod.fixture';

const meta: Meta<typeof MantineDashboardHeader> = {
  title: 'Patterns/Mantine/DashboardHeader',
  component: MantineDashboardHeader,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical dashboard page header (spec v3.3 §16.1, §17.2-§17.3; D78-5). Title and subtitle left; refresh time, a warning badge only when stale, and the period-control slot right. Stacks below `sm`. Task 846. Viewport and locale switched via Storybook toolbar (Task 799 caveat — open iframe.html directly and resize the browser window for owner review).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardHeader>;

/** The real period control, holding its own selection like a consumer's URL state would. */
function PeriodSlot({ locale }: { locale: string }) {
  const [value, setValue] = useState<PeriodSelection>({ kind: '30d' });
  return (
    <MantineDashboardPeriodControl
      value={value}
      onChange={setValue}
      now={DASHBOARD_PERIOD_NOW}
      labels={dashboardPeriodLabels(locale)}
    />
  );
}

// Stale state: warning badge (icon + text) next to the last valid refresh time.
export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack p="md">
        <MantineDashboardHeader
          title={storyT(l, 'storybook.mantine.dashboard_header_title')}
          subtitle={storyT(l, 'storybook.mantine.dashboard_header_subtitle')}
          updatedAtLabel={`${storyT(l, 'dashboard.common.updated_at_prefix')} 14:32`}
          stale={{ label: storyT(l, 'storybook.mantine.dashboard_header_stale_label') }}
          periodControl={<PeriodSlot locale={l} />}
        />
      </Stack>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC2 — the stale state shows the badge with an icon and the label text.
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('[class*="Badge-root"]');
    expect(badge).not.toBeNull();
    expect(badge!.querySelector('svg')).not.toBeNull();
    expect((badge!.textContent ?? '').trim().length).toBeGreaterThan(0);
  },
};

// Fresh state: no `stale` prop, so no badge element exists at all.
export const Fresh: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack p="md">
        <MantineDashboardHeader
          title={storyT(l, 'storybook.mantine.dashboard_header_title')}
          subtitle={storyT(l, 'storybook.mantine.dashboard_header_subtitle')}
          updatedAtLabel={`${storyT(l, 'dashboard.common.updated_at_prefix')} 14:32`}
          periodControl={<PeriodSlot locale={l} />}
        />
      </Stack>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[class*="Badge-root"]')).toBeNull();
  },
};

// Pages without period-based blocks pass no control (spec §17.2 — admin: ADM-10 only).
export const WithoutPeriodControl: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack p="md">
        <MantineDashboardHeader
          title={storyT(l, 'storybook.mantine.dashboard_header_title')}
          subtitle={storyT(l, 'storybook.mantine.dashboard_header_subtitle')}
          updatedAtLabel={`${storyT(l, 'dashboard.common.updated_at_prefix')} 14:32`}
        />
        <MantineDashboardHeader
          title={storyT(l, 'storybook.mantine.dashboard_header_title')}
          subtitle={storyT(l, 'storybook.mantine.dashboard_header_subtitle')}
          updatedAtLabel={`${storyT(l, 'dashboard.common.updated_at_prefix')} 14:32`}
          stale={{ label: storyT(l, 'storybook.mantine.dashboard_header_stale_label') }}
        />
      </Stack>
    );
  },
};
