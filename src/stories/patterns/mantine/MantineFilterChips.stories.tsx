import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MantineFilterChips, type MantineFilterChip } from '@/design-system/mantine/patterns/MantineFilterChips'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

/**
 * Task 859 Revision 7 (R53, owner O78-13 return): the one removable filter chip, extracted from the `/listings`
 * `ActiveFilterChips` and shared with the admin users table's location-request filter. Stateful harness: pressing a chip
 * removes it, as the real parents do. Viewport and locale come from the Storybook toolbar.
 */
const meta: Meta<typeof MantineFilterChips> = {
  title: 'Patterns/Mantine/MantineFilterChips',
  component: MantineFilterChips,
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof MantineFilterChips>

function ChipsHarness({ initial }: { initial: MantineFilterChip[] }) {
  const [chips, setChips] = useState(initial)
  return (
    <StoryPageGutter>
      <MantineFilterChips chips={chips} onRemove={key => setChips(current => current.filter(chip => chip.key !== key))} />
    </StoryPageGutter>
  )
}

const chipsFor = (locale: string, keys: string[]): MantineFilterChip[] =>
  keys.map(key => {
    const label = storyT(locale, `storybook.mantine.${key}`)
    return { key, label, ariaLabel: `${label} — ${storyT(locale, 'common.aria_remove_filter')}` }
  })

export const One: Story = {
  render: (_args, context) => <ChipsHarness initial={chipsFor((context?.globals?.locale as string) ?? 'en', ['combobox_option_tirana'])} />,
}

export const Several: Story = {
  render: (_args, context) => (
    <ChipsHarness
      initial={chipsFor((context?.globals?.locale as string) ?? 'en', ['combobox_option_tirana', 'combobox_option_durres', 'badge_info', 'badge_purple'])}
    />
  ),
}

export const LongLabel: Story = {
  render: (_args, context) => (
    <ChipsHarness initial={chipsFor((context?.globals?.locale as string) ?? 'en', ['filter_chip_long_label', 'combobox_option_tirana'])} />
  ),
}

export const Wrapping: Story = {
  render: (_args, context) => (
    <ChipsHarness
      initial={chipsFor((context?.globals?.locale as string) ?? 'en', [
        'combobox_option_tirana', 'combobox_option_durres', 'filter_chip_long_label', 'badge_info', 'badge_purple', 'badge_sale', 'badge_blocked',
      ])}
    />
  ),
}
