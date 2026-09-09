import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { ListingBackButton } from '@/modules/listings/components/ListingBackButton'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Task 792 — canonical story for the real production `ListingBackButton` (the detail route's
 * "Back to listings" control). Statically imports the real component (clause 16c) — no demo
 * stand-in. `next/navigation`'s `useRouter` is mocked by `@storybook/nextjs-vite`'s Next.js
 * framework integration; the click handler's `router.push` is inert in Storybook, same as every
 * other `next/navigation`-consuming story in this codebase.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/ListingBackButton',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <ListingBackButton locale={locale} label={storyT(locale, 'listing.back_to_listings')} />
      </MantineStoryShell>
    )
  },
}
