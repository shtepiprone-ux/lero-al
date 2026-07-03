import type { Meta, StoryObj } from '@storybook/react'
import { Alert, Stack, Text } from '@mantine/core'
import { CircleCheck, TriangleAlert, CircleX, Info } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Alert',
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
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* ── four semantic variants — §6l Alerts chrome ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              success / warning / error / info — 12px radius, 1px border semantic-500, bg semantic-50
            </Text>
            <Stack gap="md">
              <Alert color="green" icon={<CircleCheck size={20} />} title={t('alert_success_title')}>
                {t('alert_success_msg')}
              </Alert>
              <Alert color="yellow" icon={<TriangleAlert size={20} />} title={t('alert_warning_title')}>
                {t('alert_warning_msg')}
              </Alert>
              <Alert color="red" icon={<CircleX size={20} />} title={t('alert_error_title')}>
                {t('alert_error_msg')}
              </Alert>
              <Alert color="blueLight" icon={<Info size={20} />} title={t('alert_info_title')}>
                {t('alert_info_msg')}
              </Alert>
            </Stack>
          </Stack>

          {/* ── withCloseButton — dismiss control, ≥44px tappable ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              withCloseButton — dismiss control
            </Text>
            <Alert
              color="green"
              icon={<CircleCheck size={20} />}
              title={t('alert_success_title')}
              withCloseButton
              closeButtonLabel={t('alert_close_aria')}
              onClose={() => {}}
            >
              {t('alert_success_msg')}
            </Alert>
          </Stack>

          {/* ── icon-less — body flush-left, no reserved icon gutter ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              icon-less — body flush-left
            </Text>
            <Alert color="yellow" title={t('alert_iconless_title')}>
              {t('alert_iconless_msg')}
            </Alert>
          </Stack>

          {/* ── long content — negative flow: wrap, no clip, no h-scroll@320 (uk longest) ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              long content — wraps, no clip, no h-scroll@320
            </Text>
            <Alert color="red" icon={<CircleX size={20} />} title={t('alert_long_title')}>
              {t('alert_long_msg')}
            </Alert>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
