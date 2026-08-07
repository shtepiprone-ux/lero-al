import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack, Title, Text, Button } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage (scripts/check-story-coverage.mjs)
// resolves import specifiers to concrete file paths and the manifest entry below is the component
// file itself, per this task's explicit registration (kickoff §7/R8), not a production consumer.
import { MantineHomeSection } from '@/design-system/mantine/patterns/MantineHomeSection';

const meta: Meta<typeof MantineHomeSection> = {
  title: 'Patterns/Mantine/HomeSection',
  component: MantineHomeSection,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical homepage content-band section (Task 662) — real production component migrated ' +
          "from the homepage's four Tailwind `py-12 md:py-16 2xl:py-20` band wrappers. Owns vertical " +
          'rhythm (48/64/80px) via a Mantine `py` responsive style prop bound to `base`/`md`/`xxl`; the ' +
          'third step was rebound from the legacy Tailwind `2xl` trigger to Mantine\'s own `xxl` ' +
          '(1440px) breakpoint (owner decision 2026-07-28, Task 669). Background (`muted`/`brandFade`) via design ' +
          'tokens; reuses `.container-wide` for the inner content column. Viewport and locale switched ' +
          'via Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineHomeSection>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack gap={0}>
        <MantineHomeSection variant="default">
          <Title order={3} mb="xs">{storyT(l, 'storybook.mantine.home_section_caption_default')}</Title>
          <Text c="dimmed" mb="md">{storyT(l, 'storybook.mantine.home_section_body')}</Text>
          <Button fullWidth styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>
        </MantineHomeSection>

        <MantineHomeSection variant="muted">
          <Title order={3} mb="xs">{storyT(l, 'storybook.mantine.home_section_caption_muted')}</Title>
          <Text c="dimmed" mb="md">{storyT(l, 'storybook.mantine.home_section_body')}</Text>
          <Button fullWidth styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>
        </MantineHomeSection>

        <MantineHomeSection variant="brandFade">
          <Title order={3} mb="xs">{storyT(l, 'storybook.mantine.home_section_caption_brandfade')}</Title>
          <Text c="dimmed" mb="md">{storyT(l, 'storybook.mantine.home_section_body')}</Text>
          <Button fullWidth styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>
        </MantineHomeSection>
      </Stack>
    );
  },
};
