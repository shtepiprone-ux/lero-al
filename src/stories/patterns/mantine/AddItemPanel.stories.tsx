import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, Flex, Text, TextInput } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
// Direct file import (not the `patterns` barrel) — check:story-coverage (scripts/check-story-coverage.mjs)
// resolves import specifiers to concrete file paths and the manifest entry below is the component
// file itself (same rationale as `Patterns/Mantine/FilterSection`'s story header comment).
import { MantineAddItemPanel } from '@/design-system/mantine/patterns/MantineAddItemPanel';

const meta: Meta<typeof MantineAddItemPanel> = {
  title: 'Patterns/Mantine/AddItemPanel',
  component: MantineAddItemPanel,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical "add new X" sub-panel chrome (Task 756) — real production component shared by ' +
          "LocationCombobox's add-location panel and AuthSheet's add-company panel (Task 757), which " +
          'both used the identical Tailwind fragment `"border rounded-xl p-3 flex flex-col gap-2 ' +
          'bg-muted/30"` verbatim. Owns ONLY the outer chrome (border/radius/padding/gap/background); ' +
          'callers own their own field layout as children. Viewport and locale switched via Storybook ' +
          "toolbar. The children below mirror LocationCombobox's real composition, including its " +
          'button row, so this fixture is a faithful reference rather than an arbitrary arrangement.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineAddItemPanel>;

export const Default: Story = {
  // Reuses existing `storybook.mantine.*` keys (action_add_new, form_address, admin_add_label,
  // action_cancel) — no new i18n keys added for this Story.
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <MantineAddItemPanel>
        <Text size="xs" fw={600}>{storyT(l, 'storybook.mantine.action_add_new')}</Text>
        <TextInput placeholder={storyT(l, 'storybook.mantine.form_address')} radius="lg" />
        <Flex direction={{ base: 'column', sm: 'row' }} gap="xs">
          <Button type="button">{storyT(l, 'storybook.mantine.admin_add_label')}</Button>
          <Button type="button" variant="default">{storyT(l, 'storybook.mantine.action_cancel')}</Button>
        </Flex>
      </MantineAddItemPanel>
    );
  },
};
