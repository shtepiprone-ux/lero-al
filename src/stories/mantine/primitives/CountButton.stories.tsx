import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, useMantineTheme } from '@mantine/core'
import { SlidersHorizontal } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineCountButton } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 554/556/566/567 precedent) — the rendered-assert
 * harness's `--mantine-only` gate only gives standing enforcement to stories under this exact
 * prefix.
 *
 * `MantineCountButton` (Task 567 round-2, Fix 3): count renders inline in the Button's
 * `rightSection` (like a `leftSection` icon), never as an absolute corner badge — the round-1
 * corner-badge approach was genuinely clipped by Mantine `Button`'s own `overflow:hidden` root.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/CountButton',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

/**
 * Task 783 F6 — the default-variant filter-trigger boundary states (0 / 1 / 12) reproduce the
 * exact production composition, including its icon-sizing role: `theme.other.iconSize.compact`,
 * the same token `ListingsFilterBar.tsx`'s Advanced filters control passes to its own
 * `SlidersHorizontal leftSection`. A separate local component (not the top-level story `render`)
 * is required to call `useMantineTheme()` here without disturbing the two pre-existing `h-4 w-4`
 * fixture examples above, which stay on their own fixed sizing.
 */
/**
 * Task 784 — canonical replacement for the two generic `h-4 w-4` (16px) fixture icons below.
 * `theme.other.iconSize.standard` is the named Mantine role whose value (16px) matches the prior
 * literal exactly — these two fixtures are NOT the same call site as `FilterTriggerBoundaryStates`
 * above and do not claim to reproduce `ListingsFilterBar.tsx`'s Advanced filters control (that
 * control's own `SlidersHorizontal` uses `theme.other.iconSize.compact`/14px, per the accurate
 * claim above). A separate local component (same precedent as `FilterTriggerBoundaryStates`) is
 * required to call `useMantineTheme()` without disturbing the inline `render` callback's own hook
 * discipline.
 */
function SlidersIcon() {
  const theme = useMantineTheme()
  return <SlidersHorizontal size={theme.other.iconSize.standard} />
}

function FilterTriggerBoundaryStates({ t }: { t: (key: string) => string }) {
  const theme = useMantineTheme()

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        Task 783 — default-variant filter-trigger boundary states (0 / 1 / 12), the exact
        composition consumed by the real production Advanced filters control
        (`ListingsFilterBar`): `variant=&quot;default&quot;` + sliders icon `leftSection` +
        `count` inline in `rightSection`. 0 renders no badge; 12 proves the two-digit count
        stays content-sized and in-flow, never clipped or overhanging the button edge.
      </Text>
      <Stack gap="xs">
        <MantineCountButton
          variant="default"
          leftSection={<SlidersHorizontal size={theme.other.iconSize.compact} />}
          count={0}
          onClick={() => {}}
        >
          {t('count_button_label')}
        </MantineCountButton>
        <MantineCountButton
          variant="default"
          leftSection={<SlidersHorizontal size={theme.other.iconSize.compact} />}
          count={1}
          onClick={() => {}}
        >
          {t('count_button_label')}
        </MantineCountButton>
        <MantineCountButton
          variant="default"
          leftSection={<SlidersHorizontal size={theme.other.iconSize.compact} />}
          count={12}
          onClick={() => {}}
        >
          {t('count_button_label')}
        </MantineCountButton>
      </Stack>
    </Stack>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              with count — filled brand, count inline in rightSection (white pill, brand text)
            </Text>
            <MantineCountButton count={3} onClick={() => {}}>
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              no count (0 / undefined) — renders exactly like a plain Button, no badge
            </Text>
            <MantineCountButton count={0} onClick={() => {}}>
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              with count — default (bordered) variant, count inline
            </Text>
            <MantineCountButton variant="default" count={7} onClick={() => {}}>
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              icon + label + count, with iconOnlyBelow=860 — narrow the toolbar viewport below
              860px to see the label collapse: leftSection icon and the count badge stay, only
              the label hides, touch target stays ≥44px (Task 571)
            </Text>
            <MantineCountButton
              leftSection={<SlidersIcon />}
              count={3}
              iconOnlyBelow={860}
              aria-label={t('count_button_label')}
              onClick={() => {}}
            >
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              secondary outline filter button — default (bordered/white) variant + filter icon in
              leftSection + count inline in rightSection (the HeroSearch filters trigger)
            </Text>
            <MantineCountButton
              variant="default"
              leftSection={<SlidersIcon />}
              count={2}
              onClick={() => {}}
            >
              {t('count_button_label')}
            </MantineCountButton>
          </Stack>

          <FilterTriggerBoundaryStates t={t} />
        </Stack>
      </MantineStoryShell>
    )
  },
}
