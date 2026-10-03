import type { Decorator } from '@storybook/nextjs-vite'
import { AdminShell } from '@/components/admin/AdminShell'

/**
 * Storybook decorator: renders a Story inside the real `AdminShell`, as `src/app/admin/layout.tsx` does
 * (Task 857 R24; GR-3b "An admin page View renders inside the real `AdminShell`"). From `lg` the shell puts a
 * 240px navbar beside the page, so a View rendered without it would have 240px more room than the real page.
 *
 * Pair it with `parameters: { layout: 'fullscreen', skipCanvas: true, nextjs: { navigation: { pathname } } }`
 * and wrap page exports in the route's `AdminPageFrame`; never add a `StoryPageGutter`.
 */
export function withAdminShell(Story: Parameters<Decorator>[0]) {
  return (
    <AdminShell siteName="Lero.al">
      <Story />
    </AdminShell>
  )
}
