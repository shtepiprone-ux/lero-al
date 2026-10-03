import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Paper, Text } from '@mantine/core'
import { AdminPageFrame, type AdminPageFrameProps } from '@/components/admin/AdminPageFrame'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { storyT } from '@/stories/_storyI18n'
import { withAdminShell } from '@/stories/_StoryAdminShell'

// Task 857 R23 — the page wrapper every `/admin/*` route renders inside `AdminShell`: the gutter and the width cap
// that ten `page.tsx` files used to hand-write as a `Box` (GR-3a: CREATE — no Story imported `AdminPageFrame`).
// One export per `width`, each with the route's own `gutter` / `centered` props. GR-3b: every export renders inside
// the real `AdminShell`, so the cap and the 240px navbar are the production ones. GR-3d: the frame IS the page
// gutter (`xl`, then `2xl` from `lg`, or a fixed `xl`), so there is no `StoryPageGutter`. The content is a labelled
// placeholder (`AdminPageHeader` + a `Paper`); texts are the real `admin.currency` messages. Viewport and locale
// come from the Storybook toolbar.
const meta: Meta<typeof AdminPageFrame> = {
  title: 'Patterns/Mantine/AdminPageFrame',
  component: AdminPageFrame,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin' } },
    docs: {
      description: {
        component:
          'Page wrapper of every admin route: `width` selects `theme.other.layout.adminPage*MaxWidth`, `gutter` is `responsive` (`xl`, `2xl` from `lg`) or a fixed `xl`, `centered` toggles `mx="auto"`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminPageFrame>

function frameStory(props: Omit<AdminPageFrameProps, 'children'>, route: string): Story {
  return {
    parameters: { nextjs: { navigation: { pathname: route } } },
    render: (_, context) => {
      const l = (context?.globals?.locale as string) ?? 'en'
      return (
        <AdminPageFrame {...props}>
          <AdminPageHeader title={storyT(l, 'admin.currency.title')} subtitle={storyT(l, 'admin.currency.subtitle')} />
          <Paper withBorder radius="lg" p="lg">
            <Text size="sm" c="dimmed">{`<AdminPageFrame width="${props.width}">`}</Text>
          </Paper>
        </AdminPageFrame>
      )
    },
  }
}

/** `/admin/currency`, `/admin/reports`, `/admin/inquiries/*`, `/admin/users/[id]`. */
export const Page: Story = frameStory({ width: 'page' }, '/admin/currency')

/** `/admin/listings` (`responsive` gutter) — the widest list wrapper. */
export const Shell: Story = frameStory({ width: 'shell' }, '/admin/listings')

/** `/admin/users` — the same `shell` cap with the fixed `xl` gutter. */
export const ShellFixedGutter: Story = frameStory({ width: 'shell', gutter: 'xl' }, '/admin/users')

/** `/admin/pages`. */
export const Narrow: Story = frameStory({ width: 'narrow' }, '/admin/pages')

/** `/admin/permissions` — fixed `xl` gutter, left-aligned. */
export const Panel: Story = frameStory({ width: 'panel', gutter: 'xl', centered: false }, '/admin/permissions')

/** `/admin/users/new`. */
export const Form: Story = frameStory({ width: 'form' }, '/admin/users/new')
