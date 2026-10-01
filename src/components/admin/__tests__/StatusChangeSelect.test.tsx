/**
 * StatusChangeSelect — RTL test (Task 894, T6)
 *
 * Real Mantine + intl render of the canonical status select. Only the toast is mocked.
 *   T6 — the note path (`enableNote`) submits `{ toStatus: current, note }` and clears the note on success.
 *        Plant P2 (the component stops catching a rejected `onSubmit`) is exercised through the error-toast case.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { StatusChangeSelect } from '../StatusChangeSelect'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const tc = messages.admin.common.status_control

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom has no scrollIntoView; Mantine's Combobox calls it on the selected option.
  Element.prototype.scrollIntoView = vi.fn()
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
})

type S = 'new' | 'closed'
const STATUSES = [
  { code: 'new' as S, labelKey: 'status_new' },
  { code: 'closed' as S, labelKey: 'status_closed' },
]

function renderSelect(onSubmit: (next: { toStatus: S; note: string | null }) => Promise<void> | void, enableNote = true) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <StatusChangeSelect<S> currentStatus="new" statuses={STATUSES} onSubmit={onSubmit} enableNote={enableNote} aria-label="Status" />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

describe('StatusChangeSelect — Task 894', () => {
  it('T6 — the note path submits { toStatus: current, note } and clears the note on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderSelect(onSubmit)

    const submit = screen.getByRole('button', { name: tc.update_status_btn }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)

    const note = screen.getByPlaceholderText(tc.status_change_note_placeholder) as HTMLTextAreaElement
    await act(async () => { fireEvent.change(note, { target: { value: '  called the sender  ' } }) })
    expect(submit.disabled).toBe(false)

    await act(async () => { fireEvent.click(submit) })

    expect(onSubmit).toHaveBeenCalledWith({ toStatus: 'new', note: 'called the sender' })
    await waitFor(() => expect(note.value).toBe(''))
    expect(mockToastSuccess).toHaveBeenCalledWith(tc.status_change_success)
  })

  it('a rejected onSubmit on the note path fires the error toast and keeps the note', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'))
    renderSelect(onSubmit)

    const note = screen.getByPlaceholderText(tc.status_change_note_placeholder) as HTMLTextAreaElement
    await act(async () => { fireEvent.change(note, { target: { value: 'keep me' } }) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tc.update_status_btn })) })

    expect(mockToastError).toHaveBeenCalledWith(tc.status_change_error)
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(note.value).toBe('keep me')
  })

  it('picking a different status submits it with no note; the current status is a no-op', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderSelect(onSubmit, false)

    const input = screen.getByRole('textbox', { name: 'Status' })
    await act(async () => { fireEvent.click(input) })
    await act(async () => { fireEvent.click(await screen.findByRole('option', { name: tc.status_new })) })
    expect(onSubmit).not.toHaveBeenCalled()

    await act(async () => { fireEvent.click(input) })
    await act(async () => { fireEvent.click(await screen.findByRole('option', { name: tc.status_closed })) })
    expect(onSubmit).toHaveBeenCalledWith({ toStatus: 'closed', note: null })
  })
})
