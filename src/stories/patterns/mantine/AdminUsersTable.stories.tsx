import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AdminUsersTableView, type AdminUser, type VerifiedAgent } from '@/components/admin/AdminUsersTableView'
import { FIXTURE_USERS } from '@/stories/fixtures/admin.fixtures'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'
import { storyT } from '@/stories/_storyI18n'

/**
 * Task 896 — the Story moved here from `Admin/AdminUsersTable` (Task 483 / MM.1). Viewport and locale come from the
 * Storybook toolbar; component-internal i18n is resolved by the `withLocale` global decorator.
 *
 * Task 859 Revision 7 (R52, owner O78-13 return): the Story renders `AdminUsersTableView`, the presentational view of the
 * route's `AdminUsersTable` container, inside a stateful harness. The container reads the URL and calls the
 * `toggleUserVerified` server action, so as a Story it threw on the shield and did nothing on filters and search. The
 * harness holds the filter state and filters the fixtures with the same rules the page's query applies (tab, search,
 * role, status, location request, page), so every control changes what is shown and nothing reaches a server action.
 *
 * GR-3b/§7.3 (Task 857): every export renders inside the real `AdminShell` and the route's `AdminPageFrame`
 * (`width="shell" gutter="xl"`, `src/app/admin/users/page.tsx`), so the tables have their production card width;
 * GR-3d: the frame is the page gutter.
 */
const meta: Meta<typeof AdminUsersTableView> = {
  title: 'Patterns/Mantine/AdminUsersTable',
  component: AdminUsersTableView,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/users' } },
    docs: {
      description: {
        component:
          'Admin users surface on Mantine. Cards <40em, table ≥40em. Verify/revoke, filters, search, tabs, pagination, 4-locale. Viewport and locale via toolbar.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminUsersTableView>

interface HarnessProps {
  users: AdminUser[]
  perPage?: number
  initialTab?: string
  initialLocationRequest?: boolean
}

// The verified-agents tab lists the verified users, so verifying and revoking are inverse operations on one list.
const toAgent = (u: AdminUser): VerifiedAgent => ({
  id: u.id,
  name: [u.name, u.last_name].filter(Boolean).join(' '),
  company_name: u.company_name,
  created_at: u.created_at,
})

function UsersHarness({ users: initialUsers, perPage = 25, initialTab = 'all', initialLocationRequest = false }: HarnessProps) {
  const [users, setUsers] = useState(initialUsers)
  const agents = users.filter(u => u.is_verified).map(toAgent)
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [locationRequest, setLocationRequest] = useState(initialLocationRequest)
  const [page, setPage] = useState(1)

  const needle = search.trim().toLowerCase()
  const matching = users.filter(u => {
    if (role && u.role !== role) return false
    if (status && (u.status ?? 'active') !== status) return false
    if (locationRequest && !u.location_request) return false
    if (needle) {
      const haystack = [u.name, u.last_name, u.company_name, u.phone].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
  const shown = matching.slice((page - 1) * perPage, page * perPage)

  function onNavigate(updates: Record<string, string | null>) {
    if ('tab' in updates) setTab(updates.tab ?? 'all')
    if ('role' in updates) setRole(updates.role ?? '')
    if ('status' in updates) setStatus(updates.status ?? '')
    if ('q' in updates) setSearch(updates.q ?? '')
    if ('location_request' in updates) setLocationRequest(updates.location_request !== null)
    if ('page' in updates) setPage(updates.page ? Number(updates.page) : 1)
  }

  return (
    <AdminPageFrame width="shell">
      <AdminUsersTableView
        users={shown}
        total={matching.length}
        page={page}
        perPage={perPage}
        activeRole={role}
        activeStatus={status}
        locationRequestFilter={locationRequest}
        activeTab={tab}
        verifiedAgents={agents}
        searchValue={search}
        loadingId={null}
        onNavigate={onNavigate}
        onSearchChange={value => { setSearch(value); setPage(1) }}
        onToggleVerified={target => {
          setUsers(current => current.map(u => (u.id === target.id ? { ...u, is_verified: !target.is_verified } : u)))
        }}
      />
    </AdminPageFrame>
  )
}

const render: Story['render'] = () => <UsersHarness users={FIXTURE_USERS} />

const localeOf = (globals: Record<string, unknown> | undefined) => (globals?.locale as string) ?? 'en'

/** Click one option of a Mantine `SegmentedControl` (its radio input's label) by the option value. */
async function pickSegment(canvasElement: HTMLElement, testId: string, value: string) {
  const root = within(canvasElement).getByTestId(testId)
  const input = root.querySelector<HTMLInputElement>(`input[value="${value}"]`)
  await expect(input).not.toBeNull()
  await userEvent.click(input?.labels?.[0] ?? (input as HTMLInputElement))
}

const textIn = (canvasElement: HTMLElement, text: RegExp | string) => within(canvasElement).queryAllByText(text)

export const Default: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The shield: verifying an unverified user turns its toggle into a revoke toggle (no server action is reached).
    const revokeBefore = (await canvas.findAllByTestId('revoke-btn')).length
    await userEvent.click((await canvas.findAllByTestId('verify-btn'))[0])
    await waitFor(() => expect(canvas.getAllByTestId('revoke-btn').length).toBeGreaterThan(revokeBefore))
    // Toggling it again undoes it, so the Story ends in the state it opened in.
    await userEvent.click(canvas.getAllByTestId('revoke-btn')[1])
    await waitFor(() => expect(canvas.getAllByTestId('revoke-btn').length).toBe(revokeBefore))

    // Search narrows the rows and clearing it restores them.
    await userEvent.type(canvas.getByTestId('users-search'), 'Marco')
    await waitFor(() => expect(textIn(canvasElement, /Arben/)).toHaveLength(0))
    await expect(textIn(canvasElement, /Marco/).length).toBeGreaterThan(0)
    await userEvent.clear(canvas.getByTestId('users-search'))
    await waitFor(() => expect(textIn(canvasElement, /Arben/).length).toBeGreaterThan(0))

    // Role: agent leaves only the agent; all restores the list.
    await pickSegment(canvasElement, 'role-segmented-control', 'agent')
    await waitFor(() => expect(textIn(canvasElement, /Oksana/)).toHaveLength(0))
    await pickSegment(canvasElement, 'role-segmented-control', '')
    await waitFor(() => expect(textIn(canvasElement, /Oksana/).length).toBeGreaterThan(0))

    // Status: blocked leaves only the blocked user.
    await pickSegment(canvasElement, 'status-segmented-control', 'blocked')
    await waitFor(() => expect(textIn(canvasElement, /Arben/)).toHaveLength(0))
    await expect(textIn(canvasElement, /Gentiana/).length).toBeGreaterThan(0)
    // Back to all statuses: the Story ends in the state it opened in.
    await pickSegment(canvasElement, 'status-segmented-control', '')
    await waitFor(() => expect(textIn(canvasElement, /Arben/).length).toBeGreaterThan(0))
  },
}

export const VerifiedTab: Story = {
  render: () => <UsersHarness users={FIXTURE_USERS} initialTab="verified" />,
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findAllByText(/Arben/)).length).toBeGreaterThan(0)
    // Revoking removes the agent from the verified list.
    await userEvent.click((await canvas.findAllByTestId('revoke-btn'))[0])
    await waitFor(() => expect(textIn(canvasElement, /Arben/)).toHaveLength(0))
    await expect(textIn(canvasElement, storyT(localeOf(globals), 'admin.users.empty_verified')).length).toBeGreaterThan(0)
    // The tabs switch to the full list, where the user can be verified again, and back to the verified tab.
    await userEvent.click(canvas.getAllByRole('tab')[0])
    await waitFor(() => expect(textIn(canvasElement, /Oksana/).length).toBeGreaterThan(0))
    await userEvent.click((await canvas.findAllByTestId('verify-btn'))[0])
    await userEvent.click(canvas.getAllByRole('tab')[1])
    await waitFor(() => expect(textIn(canvasElement, /Arben/).length).toBeGreaterThan(0))
  },
}

export const Empty: Story = {
  render: () => <UsersHarness users={[]} />,
  play: async ({ canvasElement, globals }) => {
    await waitFor(() => expect(textIn(canvasElement, storyT(localeOf(globals), 'admin.users.empty')).length).toBeGreaterThan(0))
    // Searching an empty list stays empty and does not throw.
    const search = within(canvasElement).getByTestId('users-search')
    await userEvent.type(search, 'x')
    await expect(textIn(canvasElement, storyT(localeOf(globals), 'admin.users.empty')).length).toBeGreaterThan(0)
    await userEvent.clear(search)
  },
}

export const LocationFilter: Story = {
  render: () => <UsersHarness users={FIXTURE_USERS} initialLocationRequest />,
  play: async ({ canvasElement }) => {
    // The filter shows only the user who asked for a city, and its chip is on screen.
    await waitFor(() => expect(textIn(canvasElement, /Arben/)).toHaveLength(0))
    await expect(textIn(canvasElement, /Oksana/).length).toBeGreaterThan(0)
    await expect(within(canvasElement).getByTestId('location-request-filter')).toBeTruthy()
  },
}

export const LocationFilterRemoved: Story = {
  render: () => <UsersHarness users={FIXTURE_USERS} initialLocationRequest />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(textIn(canvasElement, /Arben/)).toHaveLength(0))
    // Removing its chip shows everyone.
    await userEvent.click(within(canvas.getByTestId('location-request-filter')).getByRole('button'))
    await waitFor(() => expect(textIn(canvasElement, /Arben/).length).toBeGreaterThan(0))
    await waitFor(() => expect(canvas.queryByTestId('location-request-filter')).toBeNull())
  },
}

export const Paginated: Story = {
  render: () => <UsersHarness users={FIXTURE_USERS} perPage={2} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(textIn(canvasElement, /1 \/ 2/).length).toBeGreaterThan(0)
    await expect(textIn(canvasElement, /Marco/)).toHaveLength(0)
    await userEvent.click(canvas.getByTestId('next-page'))
    await waitFor(() => expect(textIn(canvasElement, /2 \/ 2/).length).toBeGreaterThan(0))
    await expect(textIn(canvasElement, /Marco/).length).toBeGreaterThan(0)
    await userEvent.click(canvas.getByTestId('prev-page'))
    await waitFor(() => expect(textIn(canvasElement, /1 \/ 2/).length).toBeGreaterThan(0))
  },
}
