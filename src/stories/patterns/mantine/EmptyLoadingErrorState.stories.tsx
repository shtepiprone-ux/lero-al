import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Link from 'next/link';
import { expect } from 'storybook/test';
import { Stack, Divider, Button } from '@mantine/core';
import { Heart, AlertCircle } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState';
import { theme } from '@/design-system/mantine/theme';

const FULL_BELOW_SM = { base: '100%', sm: 'auto' } as const;

const meta: Meta<typeof MantineEmptyLoadingErrorState> = {
  title: 'Patterns/Mantine/EmptyLoadingErrorState',
  component: MantineEmptyLoadingErrorState,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Three canonical async states: empty, loading, error. Task 809 Revision 3 (owner rejection 2026-09-10) — the pattern no longer assigns a button variant/color/width from its own `state`; every caller supplies a fully-formed `action` element via the `action` slot. This story demonstrates a primary (filled brand), a secondary (outline gray), and a destructive-adjacent-but-actually-neutral retry action, each built by the caller, not the pattern. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineEmptyLoadingErrorState>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack gap="xl" p="md">
        {/* Primary action — filled brand, real <a href>. Matches FavoritesShell's true-empty CTA. */}
        <MantineEmptyLoadingErrorState
          state="empty"
          title={storyT(l, 'storybook.mantine.empty_title')}
          description={storyT(l, 'storybook.mantine.empty_description')}
          icon={<Heart size={theme.other!.iconSize!.decorative} />}
          action={
            <Button component={Link} href="/en/listings" color="brand" w={FULL_BELOW_SM}>
              {storyT(l, 'storybook.mantine.action_search')}
            </Button>
          }
        />

        <MantineEmptyLoadingErrorState
          state="loading"
          title=""
        />

        {/* Neutral retry — outline gray, NOT red/light, because retrying is not a destructive
            action. Matches FavoritesShell's error-state "Try again". */}
        <MantineEmptyLoadingErrorState
          state="error"
          title={storyT(l, 'storybook.mantine.error_title')}
          description={storyT(l, 'storybook.mantine.error_description')}
          icon={<AlertCircle size={theme.other!.iconSize!.standard} />}
          action={
            <Button component={Link} href="/en/favorites" variant="outline" color="gray" w={FULL_BELOW_SM}>
              {storyT(l, 'storybook.mantine.action_submit')}
            </Button>
          }
        />

        <Divider />

        {/* Secondary action — outline gray, same empty `state` as the primary CTA above, provably
            different chrome. Matches FavoritesShell's filtered-empty "All" (a filter-reset, not the
            page's primary CTA — the exact defect the owner's rejection found: this action and the
            primary CTA used to render identically because both used state="empty"). */}
        <MantineEmptyLoadingErrorState
          state="empty"
          title={storyT(l, 'storybook.mantine.empty_title')}
          description={storyT(l, 'storybook.mantine.empty_description')}
          icon={<Heart size={theme.other!.iconSize!.decorative} />}
          action={
            <Button component={Link} href="/en/favorites" variant="outline" color="gray" w={FULL_BELOW_SM}>
              {storyT(l, 'storybook.mantine.action_submit')}
            </Button>
          }
        />

        {/* No action at all — CollectionsSection's real production usage. */}
        <MantineEmptyLoadingErrorState
          state="empty"
          title={storyT(l, 'storybook.mantine.empty_title')}
          description={storyT(l, 'storybook.mantine.empty_description')}
        />
      </Stack>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Task 809 Revision 4 (R35, owner rejection #4) — asserts every rendered action's label is
  // vertically centred in its root's used height, using the exact mantine-Button-root/-label
  // static classes (not a CSS-module hash, which changes per build). This is what caught the
  // theme-level `height:'auto'` + `<a>`-root defect: `getComputedStyle` alone (Revision 3's own
  // evidence) cannot see intra-component label position, only `getBoundingClientRect()` can.
  play: async ({ canvasElement }) => {
    const roots = canvasElement.querySelectorAll('.mantine-Button-root');
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      const label = root.querySelector('.mantine-Button-label');
      expect(label).not.toBeNull();
      const rootRect = root.getBoundingClientRect();
      const labelRect = label!.getBoundingClientRect();
      const rootCentreY = (rootRect.top + rootRect.bottom) / 2;
      const labelCentreY = (labelRect.top + labelRect.bottom) / 2;
      const delta = Math.abs(labelCentreY - rootCentreY);
      if (delta > 1) {
        throw new Error(
          `Button label not vertically centred: root=${JSON.stringify({ top: rootRect.top, bottom: rootRect.bottom })} label=${JSON.stringify({ top: labelRect.top, bottom: labelRect.bottom })} delta=${delta}`
        );
      }
    }
  },
};
