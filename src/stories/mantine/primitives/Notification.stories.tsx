import type { Meta, StoryObj } from '@storybook/react'
import { Notification, Stack } from '@mantine/core'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Notification',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const ICON_SIZE = 24 // §6r-LIVE — captured glyph size

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="md">

          {/* Static/determinate — no notifications.show() call (that's a portal with an auto-close
              timer + enter/leave transition, not byte-stable). Each state renders a <Notification>
              directly, matching §6r-LIVE (Task 550 correction): 6px radius, shadow-theme-sm, a 4px
              BOTTOM-border semantic accent (not a left bar), a 40×40 rounded-lg semantic-50 icon
              badge with a semantic-600 glyph, 16px/400 title, full-width <640 / max-width 340px
              ≥640. */}

          <Notification
            color="green"
            icon={<CircleCheckIcon size={ICON_SIZE} />}
            title={t('notification_success_title')}
            withCloseButton
          >
            {t('notification_success_message')}
          </Notification>

          <Notification
            color="blueLight"
            icon={<InfoIcon size={ICON_SIZE} />}
            title={t('notification_info_title')}
            withCloseButton
          >
            {t('notification_info_message')}
          </Notification>

          <Notification
            color="yellow"
            icon={<TriangleAlertIcon size={ICON_SIZE} />}
            title={t('notification_warning_title')}
            withCloseButton
          >
            {t('notification_warning_message')}
          </Notification>

          <Notification
            color="red"
            icon={<OctagonXIcon size={ICON_SIZE} />}
            title={t('notification_error_title')}
            withCloseButton
          >
            {t('notification_error_message')}
          </Notification>

          {/* Neutral/default — no icon (matches legacy sonner.tsx's icon-less default toast), gray
              accent instead of a semantic color — §6r-LIVE "no semantic accent" (b): the bottom
              border still renders (theme.ts styles.root applies unconditionally) but in a neutral
              gray-500 tone, never a success/info/warning/error color. */}
          <Notification
            color="gray"
            title={t('notification_neutral_title')}
            withCloseButton
          >
            {t('notification_neutral_message')}
          </Notification>

        </Stack>
      </MantineStoryShell>
    )
  },
}
