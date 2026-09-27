import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminDashboardView } from '@/modules/admin/dashboard/components/AdminDashboardView'
import {
  adminDashboardAllOk,
  adminDashboardAdm02Error,
  adminDashboardAllQueuesZero,
  adminDashboardAdm09Zero,
  adminDashboardNoLocationRequests,
} from '@/stories/fixtures/adminDashboard.fixtures'

// Task 853 — canonical Mantine story for the `/admin` operations dashboard (16c/GR-3a: no prior
// canonical Story renders this production component; CREATE per the kickoff's GR-3a receipt).
// `AdminDashboardView` calls `useRouter()` for its own `onRetry` (791 boundary — the view owns the
// callback), so the Next.js navigation mock is required here, the same way `AdminShell.stories.tsx`
// needs it. Fixtures are 847's own `AdminDashboardData` shape (`blockOk`/`blockFail`), never a
// hand-rolled object. Viewport and locale are switched via the Storybook toolbar (Task 799 caveat).
const meta: Meta<typeof AdminDashboardView> = {
  title: 'Patterns/Mantine/AdminDashboardView',
  component: AdminDashboardView,
  tags: ['autodocs'],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin' } },
    docs: {
      description: {
        component:
          "Task 853 — the `/admin` operations dashboard. Composes the 843–846 canonical patterns over 847's `AdminDashboardData`; `src/app/admin/page.tsx` fetches the data server-side and passes it here unchanged (the 791 server→client boundary — this component owns every callback itself).",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminDashboardView>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView data={adminDashboardAllOk(locale)} locale={locale} />
  },
}

/** R7 state — the ADM-02 query fails; every other block still renders its own data. */
export const Adm02Error: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView data={adminDashboardAdm02Error(locale)} locale={locale} />
  },
}

/** R7 state — ADM-01/02/06 are all genuinely empty (the positive empty texts, never a bare 0). */
export const AllQueuesZero: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView data={adminDashboardAllQueuesZero(locale)} locale={locale} />
  },
}

/** R7 state — ADM-09's visibility-check breakdown is all zero (the positive zero state). */
export const Adm09Zero: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView data={adminDashboardAdm09Zero(locale)} locale={locale} />
  },
}

/** R7 state — no location requests: row 3's third card does not render at all (as today). */
export const NoLocationRequests: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminDashboardView data={adminDashboardNoLocationRequests(locale)} locale={locale} />
  },
}
