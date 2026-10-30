import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import { storyT } from '../../_storyI18n'
import { MantineRadioCardGroup, MantineRadioCardOption } from '@/design-system/mantine/patterns/MantineRadioCardOption'
import { MantineStoryShell, MantineStorySection, MantineStoryStack } from '../_MantineStoryShell'

// Task 859 Revision 9 (R63, GR-12): the one owner of a `Radio.Card` option's content (the radio circle, the 14px / 500
// label and the optional dimmed description). Every choice in a detail dialog (`TicketDetailDialogView`,
// `PremiumDialogView`, `Modal` `Detail`, `Radio` `Card`) renders through it. Options: checked, with a description, with a
// long label, disabled checked and disabled unchecked. The card's own chrome (radius, border, padding, checked tint,
// focus ring) is the theme `RadioCard` entry and `input-chrome.css`; this Story passes data and public props only.
const meta: Meta<typeof MantineRadioCardOption> = {
  title: 'Mantine/Primitives/RadioCardOption',
  component: MantineRadioCardOption,
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof MantineRadioCardOption>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <MantineStoryStack>
          <MantineStorySection label={t('radio_card_caption_options')}>
            <MantineRadioCardGroup defaultValue="a">
              <MantineRadioCardOption value="a" label={t('rb_label')} />
              <MantineRadioCardOption value="b" label={t('rb_label')} description={t('modal_body')} />
              <MantineRadioCardOption value="c" label={t('rb_long_label')} />
            </MantineRadioCardGroup>
          </MantineStorySection>

          <MantineStorySection label={t('radio_card_caption_disabled')}>
            <MantineRadioCardGroup defaultValue="d1">
              <MantineRadioCardOption value="d1" label={t('rb_label')} disabled />
              <MantineRadioCardOption value="d2" label={t('rb_label')} disabled />
            </MantineRadioCardGroup>
          </MantineStorySection>
        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Operates the choice: the first option starts checked; choosing the second checks it and unchecks the first; a
  // disabled option does not change the selection.
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole('radio')
    expect(radios).toHaveLength(5)
    expect(radios[0]).toBeChecked()
    await userEvent.click(radios[1])
    expect(radios[1]).toBeChecked()
    expect(radios[0]).not.toBeChecked()
    await userEvent.click(radios[4])
    expect(radios[3]).toBeChecked()
    expect(radios[4]).not.toBeChecked()
  },
}
