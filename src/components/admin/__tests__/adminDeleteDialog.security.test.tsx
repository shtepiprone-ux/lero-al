/**
 * Security (Task 923 R143, R144, owner decisions D30, D34): the administrator's delete dialog warns about the whole deletion and asks for the typed word.
 *  - SEC-DEL-FE-ADMIN: the REAL `AdminUserProfileDialogsView` renders the REAL `MantineDeleteConfirmModal` in `sq`, `en`, `uk` and `it`. The first point says that the account, its
 *    listings, their photos and the company it created go (the texts of R43 (e)); there is no archive point; the dialog's own field asks for DELETE and the red primary stays
 *    disabled until it is typed (trimmed, any case), so `onConfirm` cannot run before. The field is empty each time the dialog opens, and no other dialog asks for the word.
 * The expected texts are the saved texts of the task, written here as literals: they are not read back through the messages under test.
 */
import React from 'react'
import { expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import en from '../../../../messages/en.json'
import itMessages from '../../../../messages/it.json'
import sq from '../../../../messages/sq.json'
import uk from '../../../../messages/uk.json'
import { AdminUserProfileDialogsView, type AdminUserProfileDialog } from '../AdminUserProfileDialogsView'

const LOCALES = {
  sq: {
    messages: sq,
    point1: '• Llogaria dhe të gjitha të dhënat e saj, përfshirë njoftimet, fotot e tyre dhe kompaninë që ka krijuar, do të fshihen plotësisht',
    label: 'Shkruani DELETE për të konfirmuar',
    confirm: 'Fshi përgjithmonë',
    archive: /arkiv/i,
  },
  en: {
    messages: en,
    point1: '• The account and all its data, including the listings, their photos and the company it created, will be completely deleted',
    label: 'Type DELETE to confirm',
    confirm: 'Delete permanently',
    archive: /archive/i,
  },
  uk: {
    messages: uk,
    point1: '• Акаунт і всі його дані, разом з оголошеннями, їхніми фото та створеною ним компанією, буде повністю видалено',
    label: 'Введіть DELETE для підтвердження',
    confirm: 'Видалити назавжди',
    archive: /архів|заархів/i,
  },
  it: {
    messages: itMessages,
    point1: "• L'account e tutti i suoi dati, inclusi gli annunci, le loro foto e l'azienda che ha creato, verranno eliminati completamente",
    label: 'Digita DELETE per confermare',
    confirm: 'Elimina definitivamente',
    archive: /archivi/i,
  },
} as const

type Locale = keyof typeof LOCALES

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  Element.prototype.scrollIntoView = vi.fn()
})

function view(locale: Locale, dialog: AdminUserProfileDialog | null, onConfirm: () => void, loading = false) {
  return (
    <NextIntlClientProvider locale={locale} messages={LOCALES[locale].messages}>
      <MantineProvider theme={theme} env="test">
        <AdminUserProfileDialogsView
          dialog={dialog}
          userName="Synthetic Person"
          email="synthetic@example.com"
          reason=""
          onReasonChange={() => undefined}
          loading={loading}
          onConfirm={onConfirm}
          onClose={() => undefined}
        />
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

it('[SEC-DEL-FE-ADMIN] The person is warned that every listing and photo is deleted and must type DELETE before the account is deleted', async () => {
  for (const locale of Object.keys(LOCALES) as Locale[]) {
    const expected = LOCALES[locale]
    const onConfirm = vi.fn()
    const { rerender, unmount } = render(view(locale, 'delete', onConfirm))
    const dialog = await screen.findByRole('dialog')

    // the warning: the account, the listings, their photos and the company go; nothing is archived
    expect(within(dialog).getByText(expected.point1), `${locale}: the first point`).toBeTruthy()
    expect(within(dialog).getAllByText(/^•/).length, `${locale}: two points, the second says there is no recovery`).toBe(2)
    expect(dialog.textContent ?? '', `${locale}: no archive point`).not.toMatch(expected.archive)

    // the typed word: the field, its placeholder and the primary that waits for it
    const found = within(dialog).queryByLabelText(expected.label)
    expect(found, `${locale}: the dialog asks for the typed word`).not.toBeNull()
    const field = found as HTMLInputElement
    expect(field.placeholder, `${locale}: the field shows the word`).toBe('DELETE')
    expect(field.value).toBe('')
    const primary = within(dialog).getByRole('button', { name: expected.confirm })
    expect(primary, `${locale}: disabled before anything is typed`).toBeDisabled()
    fireEvent.click(primary)
    expect(onConfirm, `${locale}: a click on the disabled primary runs nothing`).not.toHaveBeenCalled()

    for (const wrong of ['DELET', 'DELETEX', 'ELETE', 'remove', ' ']) {
      fireEvent.change(field, { target: { value: wrong } })
      expect(primary, `${locale}: "${wrong}" does not enable the primary`).toBeDisabled()
      fireEvent.click(primary)
    }
    expect(onConfirm, `${locale}: no wrong word confirmed`).not.toHaveBeenCalled()

    // the right word, trimmed and in any case, enables it; only then does a click confirm, once
    fireEvent.change(field, { target: { value: '  delete ' } })
    expect(primary, `${locale}: DELETE typed`).not.toBeDisabled()
    fireEvent.click(primary)
    expect(onConfirm, `${locale}: the confirmed deletion`).toHaveBeenCalledTimes(1)

    // the field is empty each time the dialog opens: a word typed before a cancel never carries over
    rerender(view(locale, null, onConfirm))
    rerender(view(locale, 'delete', onConfirm))
    const reopened = await screen.findByRole('dialog')
    expect((within(reopened).getByLabelText(expected.label) as HTMLInputElement).value, `${locale}: reopened empty`).toBe('')
    expect(within(reopened).getByRole('button', { name: expected.confirm }), `${locale}: reopened disabled`).toBeDisabled()
    unmount()
  }

  // no other dialog of the view asks for the word, and while the deletion runs the field is locked
  const spare = vi.fn()
  const deactivate = render(view('en', 'deactivate', spare))
  const other = await screen.findByRole('dialog')
  expect(within(other).queryByPlaceholderText('DELETE'), 'the deactivate dialog has no typed field').toBeNull()
  deactivate.unmount()
  const running = render(view('en', 'delete', spare, true))
  const busy = await screen.findByRole('dialog')
  expect((within(busy).getByLabelText(LOCALES.en.label) as HTMLInputElement).disabled, 'the field is locked while the action runs').toBe(true)
  running.unmount()
})
