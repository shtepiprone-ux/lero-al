import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Stack, Text, Button, ActionIcon } from '@mantine/core'
import { MoreVertical } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineDropdownMenu } from '@/design-system/mantine/patterns'
import type { DropdownMenuItemDef } from '@/design-system/mantine/patterns'

const meta: Meta = {
  title: 'Mantine/Primitives/DropdownMenu',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const items: DropdownMenuItemDef[] = [
      { label: t('dm_item_view'), onClick: () => {} },
      { label: t('dm_item_edit'), onClick: () => {} },
      { label: t('dm_item_archive'), onClick: () => {} },
      { label: t('dm_item_delete'), onClick: () => {}, color: 'red', separator: true },
    ]

    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">

          {/* 1 — trigger (closed/resting): click trigger to open
              at ≥640 → anchored Mantine Menu; at <640 → full-width bottom sheet
              Use the toolbar viewport switcher to verify both paths on this ONE section. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              trigger (closed/resting) — click trigger to open; ≥640: anchored Mantine Menu; &lt;640: full-width bottom sheet (drag handle · ≥44px rows · long uk wraps · no h-scroll@320)
            </Text>
            <MantineDropdownMenu
              trigger={<Button variant="default">{t('dm_trigger')}</Button>}
              title={t('dm_title')}
              items={items}
            />
          </Stack>

          {/* 2 — disabled: trigger tap is a no-op on both paths */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — trigger tap is a no-op; menu/sheet does NOT open
            </Text>
            <MantineDropdownMenu
              trigger={<Button variant="default" disabled>{t('dm_trigger')}</Button>}
              title={t('dm_title')}
              items={items}
              disabled
            />
          </Stack>

          {/* 3 — icon-only exemption (clause 11): compact at <640, does NOT stretch */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              icon-only trigger (clause-11 exempt) — compact at &lt;640; taps still open the sheet
            </Text>
            <MantineDropdownMenu
              trigger={
                <ActionIcon
                  variant="default"
                  aria-label={t('dm_icononly_aria')}
                  mih="2.75rem"
                  miw="2.75rem"
                >
                  <MoreVertical size={16} />
                </ActionIcon>
              }
              title={t('dm_title')}
              items={items}
              iconOnlyTrigger
            />
          </Stack>

        </Stack>
      </Box>
    )
  },
}
