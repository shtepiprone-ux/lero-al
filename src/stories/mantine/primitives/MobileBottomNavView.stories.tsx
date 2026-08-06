import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MobileBottomNavView } from '@/components/layout/MobileBottomNavView'

const meta: Meta = {
  title: 'Mantine/Primitives/MobileBottomNavView',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Neither export passes `hideFromMd` — the production hide would blank the gate's
// desktop-1024 cell (kickoff §3.5); the View defaults to no hide.
const ACTIVE = { home: true, listings: false, add: false, favorites: false, profile: false }

export const Guest: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MobileBottomNavView
        isAuthenticated={false}
        locale={locale}
        active={ACTIVE}
        onRequireAuth={() => {}}
      />
    )
  },
}

export const Authenticated: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MobileBottomNavView
        isAuthenticated={true}
        locale={locale}
        active={ACTIVE}
        onRequireAuth={() => {}}
      />
    )
  },
}
