/**
 * AdminUserProfile — RTL smoke test (Task 893, R11 / T1–T9)
 *
 * Renders the REAL container (which renders `AdminUserProfileView`, `AdminUserProfileDialogsView` and the
 * avatar field) with the fixture users and the real `en` messages, and asserts on observable behavior:
 *   T1  edit a first name and save → `updateUserProfileFull(id, …)` with the new name and the unchanged fields;
 *       the `save_success` toast (and the server-error variant: banner + `save_error` toast).
 *   T2  status blocked with an empty reason → validation message, no action; with a reason and a picked date →
 *       the payload carries `status: 'blocked'`, the reason and `suspendedUntil: 'YYYY-MM-DD'`.
 *   T3  deactivate: confirm is disabled for a blank reason; with a reason → `deactivateUser(id, reason)`.
 *   T4  delete: the dialog opens first; confirm → `hardDeleteUser(id)` → `router.push('/admin/users')`; cancel →
 *       no call.
 *   T5  clear a history row → `clearHistoryRow('user_change_log', id, rowId)`; `{ cleared: 0 }` → `toast.info`.
 *   T6  edit a field, click back → the unsaved dialog; "stay" keeps the page and navigates nowhere.
 *   T7  create with an invalid email → inline email error, no `createAdminUser` call.
 *   T8  a non-admin sees no deactivate/delete actions, and the account-type select is disabled.
 *   T9  every edit control is reachable by its label.
 *   T10 (revision 1, R17 / O84-8) a status-only change enables Save and sends the new status; T10b choosing the
 *       stored status again leaves the form clean (Save disabled).
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task893/):
 *   P1 — drop the blank-reason check on the deactivate confirm → T3 fails.
 *   P2 — call `hardDeleteUser` without opening the dialog → T4 (cancel still deletes) fails.
 *   P5 — remove the label association from the first-name input → T9 fails.
 *   P6 — restore `FIELD_OPTIONS.status` to `{}` → T10 fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { format } from 'date-fns'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import {
  FIXTURE_CHANGE_LOG,
  FIXTURE_CITIES,
  FIXTURE_PROFILE_USER_AGENT,
  FIXTURE_PROFILE_USER_BLOCKED,
  FIXTURE_PROFILE_USER_PRIVATE,
  FIXTURE_REGIONS,
  FIXTURE_STATUS_HISTORY,
} from '@/stories/fixtures/admin.fixtures'
import { AdminUserProfile } from '../AdminUserProfile'
import type { UserWithLocation } from '../AdminUserProfileView'

// ── Server actions, toast and router mocks ────────────────────────────────────

const mockUpdate = vi.fn()
const mockDeactivate = vi.fn()
const mockReactivate = vi.fn()
const mockHardDelete = vi.fn()
const mockCreate = vi.fn()
vi.mock('@/modules/admin/actions', () => ({
  updateUserProfileFull: (...args: unknown[]) => mockUpdate(...args),
  deactivateUser: (...args: unknown[]) => mockDeactivate(...args),
  reactivateUser: (...args: unknown[]) => mockReactivate(...args),
  hardDeleteUser: (...args: unknown[]) => mockHardDelete(...args),
  createAdminUser: (...args: unknown[]) => mockCreate(...args),
  addLocation: vi.fn(),
  approveLocationRequest: vi.fn(),
  rejectLocationRequest: vi.fn(),
  removeUserAvatar: vi.fn(),
}))

const mockClearRow = vi.fn()
const mockClearEntity = vi.fn()
vi.mock('@/modules/admin/actions/clearHistory', () => ({
  clearHistoryRow: (...args: unknown[]) => mockClearRow(...args),
  clearHistoryForEntity: (...args: unknown[]) => mockClearEntity(...args),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastInfo = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  },
}))

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => '/admin/users/usr-001',
  useSearchParams: () => new URLSearchParams(),
}))

const t = messages.admin.user_profile
const USER = FIXTURE_PROFILE_USER_AGENT
const DAY_15 = format(new Date(new Date().getFullYear(), new Date().getMonth(), 15), 'yyyy-MM-dd')

interface RenderOptions {
  user?: UserWithLocation | null
  isAdmin?: boolean
  canClearHistory?: boolean
}

function renderProfile({ user = USER, isAdmin = true, canClearHistory = true }: RenderOptions = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminUserProfile
          user={user}
          email={user ? 'arben@example.com' : ''}
          emailConfirmedAt={user ? '2026-01-15T09:00:00Z' : undefined}
          cities={FIXTURE_CITIES}
          regions={FIXTURE_REGIONS}
          changeLog={user ? FIXTURE_CHANGE_LOG : []}
          statusHistory={user ? FIXTURE_STATUS_HISTORY : []}
          isAdmin={isAdmin}
          canClearHistory={canClearHistory}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

/** A Mantine `Select` is labelled twice (input + listbox); the control under test is the input. */
function getSelectInput(label: string): HTMLInputElement {
  const input = screen.getAllByLabelText(label).find(el => el.tagName === 'INPUT')
  if (!input) throw new Error(`no select input labelled "${label}"`)
  return input as HTMLInputElement
}

/** Enters edit mode through the sidebar action. */
function enterEditMode() {
  fireEvent.click(screen.getByRole('button', { name: t.actions.edit_profile }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
  Element.prototype.scrollIntoView = vi.fn()
  mockUpdate.mockResolvedValue({})
  mockDeactivate.mockResolvedValue({})
  mockReactivate.mockResolvedValue({})
  mockHardDelete.mockResolvedValue({})
  mockCreate.mockResolvedValue({ userId: 'usr-new' })
  mockClearRow.mockResolvedValue({ cleared: 1 })
  mockClearEntity.mockResolvedValue({ cleared: 1 })
})

describe('AdminUserProfile (T1–T9)', { timeout: 15_000 }, () => {
  it('T1 — edit a first name and save: updateUserProfileFull gets the new name and the unchanged fields', async () => {
    renderProfile()
    enterEditMode()

    fireEvent.change(screen.getByLabelText(t.fields.first_name), { target: { value: 'Besnik' } })
    fireEvent.click(screen.getByRole('button', { name: t.actions.save }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith(
      USER.id,
      expect.objectContaining({
        firstName: 'Besnik',
        lastName: USER.last_name,
        profileType: 'agent',
        phone: USER.phone,
        locationId: 1,
        companyName: USER.company_name,
        website: USER.website,
        status: 'active',
        suspendedUntil: null,
      }),
    )
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(t.feedback.save_success))
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('T1 (server error) — the banner shows the server error and the save_error toast fires', async () => {
    mockUpdate.mockResolvedValue({ error: 'db_down' })
    renderProfile()
    enterEditMode()

    fireEvent.change(screen.getByLabelText(t.fields.first_name), { target: { value: 'Besnik' } })
    fireEvent.click(screen.getByRole('button', { name: t.actions.save }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.feedback.save_error))
    expect(screen.getByText('db_down')).toBeTruthy()
  })

  it('T2 — blocked with an empty reason is refused; with a reason and a picked date the payload carries both', async () => {
    renderProfile({ user: FIXTURE_PROFILE_USER_PRIVATE })
    enterEditMode()

    fireEvent.click(getSelectInput(t.sections.account_status))
    fireEvent.click(await screen.findByRole('option', { name: t.statuses.blocked }))

    // The status change alone marks the form dirty (Task 893 R17), so Save is reachable with the reason still empty.
    const reason = screen.getByLabelText(t.fields.block_reason)
    fireEvent.click(screen.getByRole('button', { name: t.actions.save }))

    expect(await screen.findByText(t.validation.block_reason_required)).toBeTruthy()
    expect(mockUpdate).not.toHaveBeenCalled()

    fireEvent.change(reason, { target: { value: 'Spam' } })
    const dateGroup = screen.getByRole('group', { name: t.fields.suspended_until })
    fireEvent.click(dateGroup.querySelector('.mantine-Input-input') as HTMLElement)
    fireEvent.click(document.body.querySelector(`[data-date="${DAY_15}"]`) as HTMLElement)
    fireEvent.click(within(document.body).getByRole('button', { name: 'Apply' }))

    fireEvent.click(screen.getByRole('button', { name: t.actions.save }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith(
      FIXTURE_PROFILE_USER_PRIVATE.id,
      expect.objectContaining({ status: 'blocked', blockReason: 'Spam', suspendedUntil: DAY_15 }),
    )
  })

  it('T10 — a status-only change enables Save and sends the new status (O84-8)', async () => {
    renderProfile({ user: FIXTURE_PROFILE_USER_BLOCKED })
    enterEditMode()
    expect(screen.getByRole('button', { name: t.actions.save })).toBeDisabled()

    fireEvent.click(getSelectInput(t.sections.account_status))
    fireEvent.click(await screen.findByRole('option', { name: t.statuses.active }))

    const save = screen.getByRole('button', { name: t.actions.save })
    expect(save).not.toBeDisabled()
    fireEvent.click(save)

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith(
      FIXTURE_PROFILE_USER_BLOCKED.id,
      expect.objectContaining({
        status: 'active',
        firstName: FIXTURE_PROFILE_USER_BLOCKED.name,
        lastName: FIXTURE_PROFILE_USER_BLOCKED.last_name,
        phone: FIXTURE_PROFILE_USER_BLOCKED.phone,
        locationId: 1,
      }),
    )
  })

  it('T10b — choosing the stored status again makes the form clean, so Save is disabled', async () => {
    renderProfile()
    enterEditMode()
    const save = () => screen.getByRole('button', { name: t.actions.save })
    expect(save()).toBeDisabled()

    fireEvent.click(getSelectInput(t.sections.account_status))
    fireEvent.click(await screen.findByRole('option', { name: t.statuses.inactive }))
    expect(save()).not.toBeDisabled()

    fireEvent.click(getSelectInput(t.sections.account_status))
    fireEvent.click(await screen.findByRole('option', { name: t.statuses.active }))
    await waitFor(() => expect(save()).toBeDisabled())
  })

  it('T3 — deactivate: confirm is disabled for a blank reason; with a reason it calls deactivateUser(id, reason)', async () => {
    renderProfile()

    fireEvent.click(screen.getByRole('button', { name: t.actions.deactivate_profile }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: t.dialogs.deactivate_confirm })
    expect(confirm).toBeDisabled()

    fireEvent.change(within(dialog).getByLabelText(t.dialogs.deactivate_reason_label), { target: { value: 'Duplicate account' } })
    expect(confirm).not.toBeDisabled()
    fireEvent.click(confirm)

    await waitFor(() => expect(mockDeactivate).toHaveBeenCalledWith(USER.id, 'Duplicate account'))
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(t.feedback.deactivate_success))
  })

  it('T4 — delete: the dialog opens first; confirm deletes and redirects; cancel deletes nothing', async () => {
    renderProfile()

    fireEvent.click(screen.getByRole('button', { name: t.actions.delete_permanently }))
    let dialog = await screen.findByRole('dialog')
    expect(mockHardDelete).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: t.dialogs.delete_cancel }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mockHardDelete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: t.actions.delete_permanently }))
    dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: t.dialogs.delete_hard_confirm }))

    await waitFor(() => expect(mockHardDelete).toHaveBeenCalledWith(USER.id))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/users'))
  })

  it('T5 — clear a history row calls clearHistoryRow; a { cleared: 0 } result shows the no-op info toast', async () => {
    mockClearRow.mockResolvedValue({ cleared: 0 })
    renderProfile()

    fireEvent.click(screen.getAllByRole('button', { name: t.actions.clear_history_row_aria })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: t.dialogs.clear_confirm }))

    await waitFor(() => expect(mockClearRow).toHaveBeenCalledWith('user_change_log', USER.id, FIXTURE_CHANGE_LOG[0].id))
    await waitFor(() => expect(mockToastInfo).toHaveBeenCalledWith(t.feedback.clear_history_noop))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('T6 — a dirty edit and the back button open the unsaved dialog; "stay" keeps the page and navigates nowhere', async () => {
    renderProfile()
    enterEditMode()

    fireEvent.change(screen.getByLabelText(t.fields.first_name), { target: { value: 'Besnik' } })
    fireEvent.click(screen.getByRole('button', { name: t.actions.back_to_users }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(t.dialogs.unsaved_title)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: t.dialogs.unsaved_stay }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mockPush).not.toHaveBeenCalled()
    expect((screen.getByLabelText(t.fields.first_name) as HTMLInputElement).value).toBe('Besnik')
  })

  it('T7 — create with an invalid email shows the inline email error and never calls createAdminUser', async () => {
    renderProfile({ user: null })

    fireEvent.change(screen.getByLabelText(t.fields.first_name), { target: { value: 'Besnik' } })
    fireEvent.change(screen.getByLabelText(t.fields.last_name), { target: { value: 'Hoxha' } })
    fireEvent.change(screen.getByLabelText(t.fields.email_create), { target: { value: 'not-an-email' } })

    const cityGroup = screen.getByRole('group', { name: t.fields.city })
    fireEvent.click(within(cityGroup).getByRole('textbox'))
    fireEvent.click(await screen.findByRole('option', { name: /Tirana/ }))

    fireEvent.click(screen.getByRole('button', { name: t.actions.create_user }))

    expect(await screen.findByText(t.validation.email_invalid)).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('T8 — a non-admin sees no deactivate/delete actions, and the account-type select is disabled', () => {
    renderProfile({ isAdmin: false })

    expect(screen.getByRole('button', { name: t.actions.edit_profile })).toBeTruthy()
    expect(screen.queryByRole('button', { name: t.actions.deactivate_profile })).toBeNull()
    expect(screen.queryByRole('button', { name: t.actions.delete_permanently })).toBeNull()

    enterEditMode()
    expect(getSelectInput(t.fields.profile_type.replace(' *', ''))).toBeDisabled()
  })

  it('T9 — every edit control is reachable by its label', () => {
    renderProfile()
    enterEditMode()

    for (const label of [t.fields.first_name, t.fields.last_name, t.fields.phone, t.fields.city, t.fields.company_name]) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
  })
})
