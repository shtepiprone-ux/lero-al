import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text, Button, ActionIcon } from '@mantine/core'
import { MoreVertical } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantinePopover } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Popover',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    // No outer Box — MantinePopover supplies the mobile content gutter (Task 520);
    // desktop Popover.Dropdown carries its own default padding.
    const content = (
      <>
        <Text fw={600} size="sm" c="gray.8" mb={8}>{t('pop_content_heading')}</Text>
        <Text size="sm" c="gray.7" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {t('pop_content_body')}
        </Text>
      </>
    )

    return (
      <MantineStoryShell>
        <Stack gap="xl">

          {/* 1 — trigger (closed/resting): click trigger to open
              at ≥640 → anchored Mantine Popover; at <640 → full-width bottom sheet
              Use the toolbar viewport switcher to verify both paths on this ONE section. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              trigger (closed/resting) — click trigger to open; ≥640: anchored Mantine Popover; &lt;640: full-width bottom sheet (drag handle · ≤90dvh · long uk wraps · no h-scroll@320)
            </Text>
            <MantinePopover
              trigger={<Button variant="default">{t('pop_trigger')}</Button>}
              title={t('pop_title')}
            >
              {content}
            </MantinePopover>
          </Stack>

          {/* 2 — disabled: trigger tap is a no-op on both paths; no sheet/popover opens */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — trigger tap is a no-op; popover/sheet does NOT open; no focus ring
            </Text>
            <MantinePopover
              trigger={<Button variant="default" disabled>{t('pop_trigger')}</Button>}
              title={t('pop_title')}
              disabled
            >
              {content}
            </MantinePopover>
          </Stack>

          {/* 3 — icon-only exemption (clause 11): compact at <640, does NOT stretch */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              icon-only trigger (clause-11 exempt) — compact at &lt;640; taps still open the sheet
            </Text>
            <MantinePopover
              trigger={
                <ActionIcon
                  variant="default"
                  aria-label={t('pop_icononly_aria')}
                  mih="2.75rem"
                  miw="2.75rem"
                >
                  <MoreVertical size={16} />
                </ActionIcon>
              }
              title={t('pop_title')}
              iconOnlyTrigger
            >
              {content}
            </MantinePopover>
          </Stack>

        </Stack>
      </MantineStoryShell>
    )
  },
}
