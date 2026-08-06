import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'
import { HowItWorksSteps } from '@/components/shared/HowItWorksSteps'

const meta: Meta = {
  title: 'Mantine/Primitives/HowItWorksSteps',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `home.${key}`)

    return (
      <MantineStoryShell>
        <HowItWorksSteps
          heading={t('how_it_works')}
          steps={[
            { title: t('step1_title'), desc: t('step1_desc') },
            { title: t('step2_title'), desc: t('step2_desc') },
            { title: t('step3_title'), desc: t('step3_desc') },
          ]}
        />
      </MantineStoryShell>
    )
  },
}
