import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Button, Text } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage (scripts/check-story-coverage.mjs)
// resolves import specifiers to concrete file paths and the manifest entry below is the component
// file itself (same rationale as `Patterns/Mantine/HomeSection`'s story header comment).
import { MantineFilterSection } from '@/design-system/mantine/patterns/MantineFilterSection';

const meta: Meta<typeof MantineFilterSection> = {
  title: 'Patterns/Mantine/FilterSection',
  component: MantineFilterSection,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical labelled-section wrapper (Task 671) — real production component migrated from ' +
          "FiltersPanel's repeated `px-5 py-5` + uppercase micro-heading + `divide-y` local composition " +
          '(17 call sites). First section renders no top divider; subsequent sections draw the canonical ' +
          '`gray-3` rule. Viewport and locale switched via Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineFilterSection>;

export const Default: Story = {
  // Reuses existing `storybook.mantine.*` keys (form_section_location/details/contact,
  // home_section_cta, action_add_new, action_filter) — no new i18n keys added for this
  // Story (kickoff R9/AC9: zero new i18n keys for Task 671).
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack gap={0}>
        <MantineFilterSection label={storyT(l, 'storybook.mantine.form_section_location')}>
          <Button variant="default">{storyT(l, 'storybook.mantine.home_section_cta')}</Button>
        </MantineFilterSection>

        <MantineFilterSection
          label={storyT(l, 'storybook.mantine.form_section_details')}
          withDivider
        >
          <Button variant="light">{storyT(l, 'storybook.mantine.action_add_new')}</Button>
        </MantineFilterSection>

        <MantineFilterSection
          label={storyT(l, 'storybook.mantine.form_section_contact')}
          withDivider
          action={<Text size="xs" c="dimmed">{storyT(l, 'storybook.mantine.action_filter')}</Text>}
        >
          <Button variant="default">{storyT(l, 'storybook.mantine.home_section_cta')}</Button>
        </MantineFilterSection>
      </Stack>
    );
  },
};
