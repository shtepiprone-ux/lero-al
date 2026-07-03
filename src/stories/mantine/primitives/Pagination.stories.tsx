import type { Meta, StoryObj } from '@storybook/react'
import { Box, Stack, Text } from '@mantine/core'
import { MantinePagination } from '@/design-system/mantine/patterns'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/Pagination',
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

    const previousLabel = t('pagination_aria_prev')
    const nextLabel = t('pagination_aria_next')
    const getPageAriaLabel = (page: number) => t('pagination_aria_page').replace('{page}', String(page))

    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">

          {/* ── default cluster — moderate total, inactive + active + prev/next + dots ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              default — total=10, value=5 — transparent inactive / brand active / white prev-next w/ gray-300 border
            </Text>
            <MantinePagination
              total={10}
              value={5}
              onChange={() => {}}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              getPageAriaLabel={getPageAriaLabel}
            />
          </Stack>

          {/* ── mobile-compact cluster — negative flow: single-line, no-wrap, no h-scroll@320 ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              mobile-compact — total=50, value=25, size=sm — single-line shed-to-fit, no h-scroll@320
            </Text>
            <MantinePagination
              total={50}
              value={25}
              onChange={() => {}}
              size="sm"
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              getPageAriaLabel={getPageAriaLabel}
            />
          </Stack>

          {/* ── shed-ladder stress — very long total, mid-range page, exercises the full ladder ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              shed-ladder stress — total=250, value=137, size=sm — asymmetric shed at narrow widths
            </Text>
            <MantinePagination
              total={250}
              value={137}
              onChange={() => {}}
              size="sm"
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              getPageAriaLabel={getPageAriaLabel}
            />
          </Stack>

          {/* ── boundary — page 1, Prev disabled ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              boundary — page 1, Prev disabled
            </Text>
            <MantinePagination
              total={10}
              value={1}
              onChange={() => {}}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              getPageAriaLabel={getPageAriaLabel}
            />
          </Stack>

          {/* ── boundary — last page, Next disabled ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              boundary — last page, Next disabled
            </Text>
            <MantinePagination
              total={10}
              value={10}
              onChange={() => {}}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              getPageAriaLabel={getPageAriaLabel}
            />
          </Stack>

          {/* ── single page — negative flow: no crash, minimal render ── */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              single page — total=1, no crash
            </Text>
            <MantinePagination
              total={1}
              value={1}
              onChange={() => {}}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              getPageAriaLabel={getPageAriaLabel}
            />
          </Stack>

        </Stack>
      </Box>
    )
  },
}
