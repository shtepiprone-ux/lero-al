import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { Anchor, Button, Group } from '@mantine/core'
import { ClientLink } from '@/lib/navigation/ClientLink'
import { storyT } from '@/stories/_storyI18n'

/**
 * `ClientLink` is `next/link` re-exported from a `'use client'` module (Task 952, Next 16), so a Server Component can pass it as the `component` prop of a Mantine
 * (client) component. It adds no markup and no style: the Story shows the two ways the app uses it, an `Anchor` and a `Button`, and proves that each one renders a real
 * link to the given address.
 */
const meta: Meta<typeof ClientLink> = {
  title: 'Patterns/Mantine/ClientLink',
  component: ClientLink,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '`next/link` as a Client Component reference. Used only as the `component` prop of a Mantine component inside a Server Component; it adds no markup or style.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ClientLink>

const localeOf = (globals: Record<string, unknown> | undefined) => (globals?.locale as string) ?? 'en'

export const AsAnchorAndButton: Story = {
  render: (_args, { globals }) => (
    <Group>
      <Anchor component={ClientLink} href="/en/listings">{storyT(localeOf(globals), 'nav.listings')}</Anchor>
      <Button component={ClientLink} href="/en/favorites">{storyT(localeOf(globals), 'nav.favorites')}</Button>
    </Group>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const anchor = await canvas.findByRole('link', { name: storyT(localeOf(globals), 'nav.listings') })
    await expect(anchor).toHaveAttribute('href', '/en/listings')
    const button = await canvas.findByRole('link', { name: storyT(localeOf(globals), 'nav.favorites') })
    await expect(button).toHaveAttribute('href', '/en/favorites')
  },
}
