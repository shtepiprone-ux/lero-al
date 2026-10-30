/**
 * MantineDeleteConfirmModal (Task 859 R28): the red primary runs the action, Cancel / the close button / Esc close,
 * and `loading` shows the loader on the primary and disables Cancel.
 */
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '../../theme'
import messages from '../../../../../messages/en.json'
import { MantineDeleteConfirmModal } from '../MantineDeleteConfirmModal'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

function setup(props: Partial<React.ComponentProps<typeof MantineDeleteConfirmModal>> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>
        <MantineDeleteConfirmModal
          opened
          onClose={onClose}
          onConfirm={onConfirm}
          title="Delete EUR?"
          message="The currency is removed."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          {...props}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
  return { onClose, onConfirm }
}

describe('MantineDeleteConfirmModal', () => {
  it('states the object and the consequence', () => {
    setup()
    expect(screen.getByText('Delete EUR?')).toBeTruthy()
    expect(screen.getByText('The currency is removed.')).toBeTruthy()
  })

  it('the primary runs the action, Cancel closes', () => {
    const { onClose, onConfirm } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('the close button and Esc close it', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: messages.common.close }))
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('while loading the primary has data-loading and Cancel is disabled', () => {
    setup({ loading: true })
    expect(screen.getByRole('button', { name: 'Delete' }).hasAttribute('data-loading')).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('confirmDisabled disables the primary', () => {
    setup({ confirmDisabled: true })
    expect((screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

// Task 923 R46 (owner decision D34): the typed confirmation of an account deletion, held once by the owner.
const TYPED = { word: 'DELETE', label: 'Type DELETE to confirm' }
const field = () => screen.getByLabelText(TYPED.label) as HTMLInputElement
const primary = () => screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement

it('[SEC-DEL-FE-OWNER-DENY] The person is warned that every listing and photo is deleted and must type DELETE before the account is deleted', () => {
  const { onConfirm } = setup({ typedConfirm: TYPED })
  expect(field().value).toBe('')
  expect(primary().disabled).toBe(true)
  fireEvent.click(primary())
  for (const typed of ['', 'delet', 'DELETED', 'DELETE X', 'DEL ETE']) {
    fireEvent.change(field(), { target: { value: typed } })
    expect(primary().disabled, `"${typed}"`).toBe(true)
    fireEvent.click(primary())
  }
  expect(onConfirm).not.toHaveBeenCalled()
  // typing the word enables it; closing and reopening empties the field again
  fireEvent.change(field(), { target: { value: 'DELETE' } })
  expect(primary().disabled).toBe(false)
})

it('[SEC-DEL-FE-OWNER-ALLOW] The person is warned that every listing and photo is deleted and must type DELETE before the account is deleted', () => {
  const { onConfirm } = setup({ typedConfirm: TYPED })
  let calls = 0
  for (const typed of ['delete', 'Delete', ' DELETE ', 'DELETE']) {
    fireEvent.change(field(), { target: { value: typed } })
    expect(primary().disabled, `"${typed}"`).toBe(false)
    fireEvent.click(primary())
    calls += 1
    expect(onConfirm).toHaveBeenCalledTimes(calls)
  }
  cleanup()
  // the control: without typedConfirm no field renders and the primary behaves as before
  const plain = setup()
  expect(screen.queryByLabelText(TYPED.label)).toBeNull()
  expect(primary().disabled).toBe(false)
  fireEvent.click(primary())
  expect(plain.onConfirm).toHaveBeenCalledTimes(1)
  // confirmDisabled still wins over a typed word
  cleanup()
  setup({ typedConfirm: TYPED, confirmDisabled: true })
  fireEvent.change(field(), { target: { value: 'DELETE' } })
  expect(primary().disabled).toBe(true)
})

it('the typed word is empty again each time the dialog opens, and the field takes the focus', () => {
  const onConfirm = vi.fn()
  const wrap = (opened: boolean) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>
        <MantineDeleteConfirmModal opened={opened} onClose={() => {}} onConfirm={onConfirm} title="Delete?" message="Gone." confirmLabel="Delete" cancelLabel="Cancel" typedConfirm={TYPED} />
      </MantineProvider>
    </NextIntlClientProvider>
  )
  const { rerender } = render(wrap(true))
  fireEvent.change(field(), { target: { value: 'DELETE' } })
  expect(primary().disabled).toBe(false)
  rerender(wrap(false))
  rerender(wrap(true))
  expect(field().value).toBe('')
  expect(primary().disabled).toBe(true)
})

// Task 923 R80 (owner decision D54): re-authentication by a masked password instead of a typed word, and the Google confirmation for an account with no password.
describe('passwordConfirm and googleConfirm', () => {
  function Harness(extra: Partial<React.ComponentProps<typeof MantineDeleteConfirmModal>> & { error?: string; onGoogle?: () => void; withGoogle?: boolean }) {
    const [value, setValue] = React.useState('')
    return (
      <NextIntlClientProvider locale="en" messages={messages}>
        <MantineProvider theme={theme}>
          <MantineDeleteConfirmModal
            opened
            onClose={() => {}}
            onConfirm={extra.onConfirm ?? (() => {})}
            title="Delete account?"
            message="Everything is deleted."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            passwordConfirm={{ label: 'Current password', value, onChange: setValue, error: extra.error, showLabel: 'Show password', hideLabel: 'Hide password' }}
            googleConfirm={extra.withGoogle ? { message: 'Confirm with Google', control: <button type="button" onClick={extra.onGoogle}>Google control</button> } : undefined}
          />
        </MantineProvider>
      </NextIntlClientProvider>
    )
  }
  const password = () => screen.getByLabelText('Current password') as HTMLInputElement

  it('the primary waits for a password; the field is masked, empty, and can be shown and hidden', () => {
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)
    expect(password().type).toBe('password')
    expect(password().value).toBe('')
    expect(primary().disabled).toBe(true)
    fireEvent.click(primary())
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.change(password(), { target: { value: 'secret-1' } })
    expect(primary().disabled).toBe(false)
    fireEvent.click(primary())
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Show password' }))
    expect(password().type).toBe('text')
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Hide password' }))
    expect(password().type).toBe('password')
  })

  it('the field\'s own error is shown, and no field exists without passwordConfirm', () => {
    render(<Harness error="The current password is incorrect." />)
    expect(screen.getByText('The current password is incorrect.')).toBeTruthy()
    cleanup()
    setup()
    expect(screen.queryByLabelText('Current password')).toBeNull()
  })

  it('the Google section shows its text and renders the control of the consumer under it; the primary is unaffected by it', () => {
    const onGoogle = vi.fn()
    render(<Harness withGoogle onGoogle={onGoogle} />)
    const message = screen.getByText('Confirm with Google')
    const control = screen.getByRole('button', { name: 'Google control' })
    expect(message.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING, 'the control comes under the message').toBeTruthy()
    expect(message.parentElement, 'message and control share one section').toBe(control.parentElement)
    fireEvent.click(control)
    expect(onGoogle).toHaveBeenCalledTimes(1)
    expect(primary().disabled).toBe(true)                    // still waiting for the password: the Google section changes nothing about the primary
    cleanup()
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Google control' })).toBeNull()
  })

  it('the password is cleared by the consumer on every open, and the toggle is hidden again on reopen', () => {
    const wrap = (opened: boolean) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <MantineProvider theme={theme}>
          <MantineDeleteConfirmModal
            opened={opened} onClose={() => {}} onConfirm={() => {}} title="Delete?" message="Gone." confirmLabel="Delete" cancelLabel="Cancel"
            passwordConfirm={{ label: 'Current password', value: 'typed', onChange: () => {}, showLabel: 'Show password', hideLabel: 'Hide password' }}
          />
        </MantineProvider>
      </NextIntlClientProvider>
    )
    const { rerender } = render(wrap(true))
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Show password' }))
    expect(password().type).toBe('text')
    rerender(wrap(false))
    rerender(wrap(true))
    expect(password().type, 'a password is never left visible after a reopen').toBe('password')
  })
})
