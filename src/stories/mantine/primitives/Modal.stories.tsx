import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Box, Stack, Text, Button, Flex } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineModal } from '@/design-system/mantine/patterns'

const meta: Meta = {
  title: 'Mantine/Primitives/Modal',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

function ModalStandardSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        standard dialog (closed/resting) — click trigger to open; ≥640: centered Mantine Modal; &lt;640: full-width bottom sheet (drag handle · title · body · full-width footer)
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_trigger_open')}</Button>
      <MantineModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('modal_title')}
        footer={
          <Flex
            direction={{ base: 'column-reverse', sm: 'row' }}
            gap="sm"
            justify={{ base: 'stretch', sm: 'flex-end' }}
          >
            <Button
              variant="outline"
              color="gray"
              w={{ base: '100%', sm: 'auto' }}
              onClick={() => setOpened(false)}
            >
              {t('modal_cancel')}
            </Button>
            <Button
              color="brand"
              w={{ base: '100%', sm: 'auto' }}
              onClick={() => setOpened(false)}
            >
              {t('modal_confirm')}
            </Button>
          </Flex>
        }
      >
        {/* No outer Box — MantineModal supplies the content gutter (Task 520) */}
        <Text size="sm" c="gray.7" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {t('modal_body')}
        </Text>
      </MantineModal>
    </Stack>
  )
}

function ModalLongSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        long-content dialog (closed/resting) — click trigger to open; proves internal scroll ≤90dvh at &lt;640 (title + drag handle stay pinned); no footer provided renders cleanly
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>{t('modal_long_trigger')}</Button>
      <MantineModal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('modal_title')}
      >
        {/* No outer Box — MantineModal supplies the content gutter (Task 520) */}
        {t('modal_long_body').split('\n\n').map((paragraph) => (
          <Text
            key={paragraph.slice(0, 24)}
            size="sm"
            c="gray.7"
            mb="sm"
            style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
          >
            {paragraph}
          </Text>
        ))}
      </MantineModal>
    </Stack>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">
          <ModalStandardSection locale={locale} />
          <ModalLongSection locale={locale} />
        </Stack>
      </Box>
    )
  },
}
