import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineNavigationMenu } from '@/design-system/mantine/patterns'
import type { NavMenuSection } from '@/design-system/mantine/patterns'

const meta: Meta = {
  title: 'Mantine/Primitives/NavigationMenu',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    const sections: NavMenuSection[] = [
      {
        label: t('nav_sec_products'),
        links: [
          { label: t('nav_link_overview'), href: '#', onClick: () => {} },
          { label: t('nav_link_pricing'), href: '#', onClick: () => {} },
          { label: t('nav_link_integrations'), href: '#', onClick: () => {} },
        ],
      },
      {
        label: t('nav_sec_resources'),
        links: [
          { label: t('nav_link_docs'), href: '#', onClick: () => {} },
          { label: t('nav_link_blog'), href: '#', onClick: () => {} },
          { label: t('nav_link_support'), href: '#', onClick: () => {}, disabled: true },
        ],
      },
    ]

    const disabledSections: NavMenuSection[] = [
      {
        label: t('nav_sec_disabled'),
        links: [
          { label: t('nav_link_overview'), href: '#', onClick: () => {} },
        ],
        disabled: true,
      },
      sections[1],
    ]

    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">

          {/* 1 — resting: click a section trigger to open its links panel
              at ≥640 → horizontal nav bar, anchored Mantine Menu per section
              at <640 → stacked full-width section triggers, ONE shared bottom sheet
              Use the toolbar viewport switcher to verify both paths on this ONE section. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              resting — click a section trigger to open; ≥640: horizontal nav + anchored panel; &lt;640: stacked full-width triggers + shared full-width bottom sheet (drag handle · ≥44px rows · disabled link dimmed · long uk wraps · no h-scroll@320)
            </Text>
            <MantineNavigationMenu ariaLabel={t('nav_aria_label')} sections={sections} />
          </Stack>

          {/* 2 — disabled section: trigger tap is a no-op on both paths */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled section — first trigger tap is a no-op; no panel/sheet opens for it; second section unaffected
            </Text>
            <MantineNavigationMenu ariaLabel={t('nav_aria_label')} sections={disabledSections} />
          </Stack>

        </Stack>
      </Box>
    )
  },
}
