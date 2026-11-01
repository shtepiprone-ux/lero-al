import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Stack } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardPeriodControl } from '@/design-system/mantine/patterns/MantineDashboardPeriodControl';
import type { PeriodSelection } from '@/lib/dashboard/period';
import { DASHBOARD_PERIOD_NOW, dashboardPeriodLabels } from '@/stories/fixtures/dashboardPeriod.fixture';

const meta: Meta<typeof MantineDashboardPeriodControl> = {
  title: 'Patterns/Mantine/DashboardPeriodControl',
  component: MantineDashboardPeriodControl,
  args: { onChange: fn() },
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical dashboard period selector (spec v3.3 §4, §16.3, §17.3): 7 days · 30 days · Custom. Custom reveals the existing `RangeDatePicker` with `maxDate` = yesterday in Europe/Tirane; a range longer than 90 days shows a localized `role="alert"` error and never calls `onChange`. Task 846. The story\'s `now` is frozen, so yesterday is 2026-09-17. Viewport and locale switched via Storybook toolbar (Task 799 caveat).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardPeriodControl>;

/** Holds the selection like a consumer's URL state would, and forwards every change to the
 * story's `onChange` action so the Actions panel records exactly what reached the consumer. */
function Controlled({
  initial,
  locale,
  onChange,
}: {
  initial: PeriodSelection;
  locale: string;
  onChange: (next: PeriodSelection) => void;
}) {
  const [value, setValue] = useState<PeriodSelection>(initial);
  return (
    <Stack p="md">
      <MantineDashboardPeriodControl
        value={value}
        now={DASHBOARD_PERIOD_NOW}
        labels={dashboardPeriodLabels(locale)}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </Stack>
  );
}

const localeOf = (context: { globals?: Record<string, unknown> }) => (context?.globals?.locale as string) ?? 'en';

export const Default: Story = {
  render: (args, context) => (
    <Controlled initial={{ kind: '7d' }} locale={localeOf(context)} onChange={args.onChange} />
  ),
};

// The calendar is opened by the play function so the owner sees the disabled-days rule at once:
// yesterday (2026-09-17) is the last selectable day; today (2026-09-18) is not.
export const CustomOpen: Story = {
  render: (args, context) => (
    <Controlled
      initial={{ kind: 'custom', from: '2026-09-01', to: '2026-09-10' }}
      locale={localeOf(context)}
      onChange={args.onChange}
    />
  ),
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement }) => {
    // The picker trigger is the only popup-opening button (Task 861: a semantic <button>, was a read-only input).
    const trigger = canvasElement.querySelector('button[aria-haspopup="dialog"]');
    expect(trigger).not.toBeNull();
    await userEvent.click(trigger!);
    await waitFor(() => expect(document.body.querySelector('[data-date="2026-09-17"]')).not.toBeNull());
    expect(document.body.querySelector<HTMLButtonElement>('[data-date="2026-09-17"]')!.disabled).toBe(false);
    expect(document.body.querySelector<HTMLButtonElement>('[data-date="2026-09-18"]')!.disabled).toBe(true);
  },
};

// AC3 — a 120-day custom range chosen with the keyboard: the localized error shows in a
// `role="alert"` element and `onChange` is NOT called.
export const CustomRangeTooLong: Story = {
  render: (args, context) => (
    <Controlled
      initial={{ kind: 'custom', from: '2026-01-05', to: '2026-01-10' }}
      locale={localeOf(context)}
      onChange={args.onChange}
    />
  ),
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement, args, globals }) => {
    const l = (globals?.locale as string) ?? 'en';
    const body = within(document.body);
    const pressEnterOn = async (el: HTMLElement) => {
      el.focus();
      await userEvent.keyboard('{Enter}');
    };

    await userEvent.click(canvasElement.querySelector('button[aria-haspopup="dialog"]')!);
    await waitFor(() => expect(document.body.querySelector('[data-date="2026-01-05"]')).not.toBeNull());

    await pressEnterOn(document.body.querySelector<HTMLElement>('[data-date="2026-01-05"]')!);
    const next = await body.findByRole('button', { name: storyT(l, 'common.aria_next') });
    for (let i = 0; i < 3; i += 1) await userEvent.click(next);
    await waitFor(() => expect(document.body.querySelector('[data-date="2026-05-05"]')).not.toBeNull());
    await pressEnterOn(document.body.querySelector<HTMLElement>('[data-date="2026-05-05"]')!);
    await pressEnterOn(await body.findByRole('button', { name: storyT(l, 'common.apply') }));

    const alert = await body.findByRole('alert');
    expect(alert.textContent).toBe(storyT(l, 'dashboard.period.error_longer_than_90_days'));
    expect(args.onChange).not.toHaveBeenCalled();
  },
};
