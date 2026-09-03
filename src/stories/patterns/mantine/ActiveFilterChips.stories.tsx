import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { ActiveFilterChips } from '@/modules/listings/components/ActiveFilterChips';

/**
 * Task 781 Phase 2 — `/listings` active filter chips, migrated off the shadcn `Button` onto a
 * themed Mantine `Button` composition (D69-4: `variant="light"` `color="brand"` `radius="pill"`
 * `size="xs"`, `rightSection` remove icon) — not Mantine `Pill` (`theme.ts` has no `Pill`/`Chip`
 * entry, `src/` has no consumer, no story exists).
 *
 * `className="active-filter-chips"` is preserved verbatim on the root — a semantic selector hook,
 * not a Tailwind utility.
 *
 * The seeded `nextjs.navigation.query` includes a MULTI-value param (`rooms=2,3` → two individual
 * chips sharing `paramKey: 'rooms'`) so both removal branches in `removeChip` are reachable from
 * this story, plus one single-value param (`location_id`) and `premium=true`.
 *
 * Known limitation (Task 679, kickoff §3.8): Storybook has no `/api/property-types`, so
 * `usePropertyTypes()` falls back to the raw lowercase enum label (`apartment`) rather than a
 * localized one. Not fixed here — recorded, not localized or stubbed.
 */
const meta: Meta<typeof ActiveFilterChips> = {
  title: 'Patterns/Mantine/ActiveFilterChips',
  component: ActiveFilterChips,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: {
          type: 'sale',
          property_type: 'apartment',
          location_id: '1',
          rooms: '2,3',
          premium: 'true',
        },
      },
    },
    docs: {
      description: {
        component: 'Task 781 — `/listings` active filter chips migrated onto a themed Mantine `Button` composition (D69-4). Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ActiveFilterChips>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const t = (key: string) => storyT(l, `storybook.mantine.${key}`);

    const locations = [
      { id: 1, name_al: t('combobox_option_tirana') },
      { id: 2, name_al: t('combobox_option_durres') },
    ];

    return (
      <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
        <ActiveFilterChips locations={locations} />
      </Box>
    );
  },
};
