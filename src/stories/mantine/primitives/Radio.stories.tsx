import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Radio } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineRadioCardGroup, MantineRadioCardOption } from '@/design-system/mantine/patterns/MantineRadioCardOption'
import { MantineStoryShell, MantineStorySection, MantineStoryStack } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Radio',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <MantineStoryStack>

          {/* 1 — unchecked: gray-3 border / 20px circle / label gray-7 / ≥44px tap row */}
          <MantineStorySection label={t('radio_caption_unchecked')}>
            <Radio value="a" label={t('rb_label')} />
          </MantineStorySection>

          {/* 2 — checked: brand-7 fill + white 10px center dot */}
          <MantineStorySection label={t('radio_caption_checked')}>
            <Radio value="b" label={t('rb_label')} defaultChecked />
          </MantineStorySection>

          {/* 3 — focus: keyboard focus ring (brand) — Tab to the radio to see */}
          <MantineStorySection label={t('radio_caption_focus')}>
            <Radio value="c" label={t('rb_label')} />
          </MantineStorySection>

          {/* 4 — error: red-6 border + ring; checked+error → brand border wins */}
          <MantineStorySection label={t('radio_caption_error')}>
            <Radio value="d1" label={t('rb_label')} error={t('rb_error')} />
            <Radio value="d2" label={t('rb_label')} error={t('rb_error')} defaultChecked />
          </MantineStorySection>

          {/* 5 — disabled: whole control faded — circle + label → opacity 0.5 (§6g) */}
          <MantineStorySection label={t('radio_caption_disabled')}>
            <Radio value="e1" label={t('rb_label')} disabled />
            <Radio value="e2" label={t('rb_label')} disabled defaultChecked />
          </MantineStorySection>

          {/* 6 — long label: wraps ≥2 lines at 320; no clip / no h-scroll */}
          <MantineStorySection label={t('radio_caption_long_label')}>
            <Radio value="f" label={t('rb_long_label')} />
          </MantineStorySection>

        </MantineStoryStack>
      </MantineStoryShell>
    )
  },
}

// Task 857 R49 — `Radio.Card` + `Radio.Indicator` (docs §23.7 "A choice"): a bordered card per option. Radius, border and
// padding come from the theme `RadioCard` entry; the checked tint (brand-7 border, brand-0 background), the keyboard
// focus ring and the disabled fade come from `input-chrome.css`. The indicator is the canonical radio circle: 20px with a
// 10px dot (GR-3f) from the theme `RadioIndicator` entry — no size, colour or border override here.
export const Card: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <MantineStoryStack>
          {/* Tab to a card to see the focus ring; the option content is the one owner `MantineRadioCardOption` (Task 859 R63). */}
          <MantineStorySection label={t('radio_card_caption_options')}>
            <MantineRadioCardGroup defaultValue="a">
              <MantineRadioCardOption value="a" label={t('rb_label')} />
              <MantineRadioCardOption value="b" label={t('rb_label')} description={t('modal_body')} />
              <MantineRadioCardOption value="c" label={t('rb_long_label')} />
            </MantineRadioCardGroup>
          </MantineStorySection>

          {/* A disabled card is faded as a whole; a checked one keeps its brand fill and white dot under the fade (§6g). */}
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
}
