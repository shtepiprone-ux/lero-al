/**
 * AdminPagesManager — RTL smoke test (Task 868, T1–T6)
 *
 * Renders the REAL container (which renders `AdminPagesView` / `PageEditorDialog` /
 * `PageEditorDialogView`) with the real `en` messages and asserts on observable behavior:
 *   T1 — a publish refused with `sq_body_required` activates the `sq` tab, shows the editor's error
 *        and raises no toast; the next change of the `sq` editor clears the error.
 *   T2 — `slug_already_used` shows the inline slug error and raises no toast.
 *   T3 — any other server error raises the `save_error` toast.
 *   T4 — delete opens a confirm; confirm calls `deletePage(id)`, removes the row, toasts; cancel calls nothing.
 *   T5 — a legacy page raises the migration banner and disables "new", edit and delete.
 *   T6 — a new page's slug follows the `sq` title until the slug is edited by hand.
 *   T12 — the editor's image upload posts to `/api/upload-cms-image`; a failure toasts and keeps the dialog.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task868/):
 *   P1 — remove the `sq_body_required` branch in `PageEditorDialog` → T1 fails.
 *   P2 — delete without opening the confirm → T4 (cancel) fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { Editor } from '@tiptap/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import type { Page } from '@/types/database'
import { AdminPagesManager } from '../AdminPagesManager'

// ── Server actions, toast and router mocks ────────────────────────────────────

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
vi.mock('@/modules/admin/actions', () => ({
  createPage: (...args: unknown[]) => mockCreate(...args),
  updatePage: (...args: unknown[]) => mockUpdate(...args),
  deletePage: (...args: unknown[]) => mockDelete(...args),
}))

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const t = messages.admin.pages
const tLegal = messages.admin.legal
const tc = messages.common

// Fixture data (labelled).
const D = '2026-09-27T14:30:00.000Z'
const PAGE_A: Page = {
  id: 1,
  title: 'Terms of use',
  slug: 'terms-of-use',
  content: {
    sq: { title: 'Kushtet', body: '<p>x</p>' },
    en: { title: 'Terms of use', body: '<p>x</p>' },
    uk: { title: '', body: '' },
    it: { title: '', body: '' },
  },
  is_published: true,
  updated_by: null,
  updated_at: D,
}
const PAGE_B: Page = { ...PAGE_A, id: 2, title: 'About us', slug: 'about-us', is_published: false,
  content: { ...(PAGE_A.content as object), sq: { title: 'Rreth nesh', body: '' } } as Page['content'] }
const PAGE_LEGACY: Page = { ...PAGE_A, id: 3, title: 'Legacy page', slug: 'legacy-page', content: { body: '<p>old</p>' } }

function renderManager(pages: Page[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminPagesManager pages={pages} adminLocale="en" />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

async function openNewDialog() {
  fireEvent.click(screen.getAllByRole('button', { name: t.btn_new })[0])
  return screen.findByRole('dialog')
}

function activePanel(dialog: HTMLElement) {
  return within(within(dialog).getByRole('tabpanel'))
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
  // ProseMirror measures client rects when it scrolls the selection into view; jsdom has none.
  const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() {} }
  Range.prototype.getBoundingClientRect = () => rect as DOMRect
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList
  mockCreate.mockResolvedValue({})
  mockUpdate.mockResolvedValue({})
  mockDelete.mockResolvedValue({})
})

describe('AdminPagesManager (T1–T6)', () => {
  it('T1 — sq_body_required: sq tab active, body-field error, no toast; editing the body clears it', async () => {
    mockCreate.mockResolvedValue({ error: 'sq_body_required' })
    renderManager([PAGE_A])

    const dialog = await openNewDialog()
    // The editor opens on the admin locale (en), not on sq.
    expect(within(dialog).getByRole('tab', { name: t.editor_locale_en }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_sq }))
    fireEvent.change(activePanel(dialog).getByLabelText(t.field_title_label), { target: { value: 'Rreth nesh' } })
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_en }))
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(within(dialog).getByRole('tab', { name: new RegExp(t.editor_locale_sq) }).getAttribute('aria-selected')).toBe('true'),
    )
    expect(activePanel(dialog).getByText(t.sq_body_required)).toBeTruthy()
    expect(mockToastError).not.toHaveBeenCalled()

    const editor = (activePanel(dialog).getByRole('textbox', { name: t.field_body_label }) as unknown as { editor: Editor }).editor
    act(() => { editor.commands.insertContent('Përmbajtje') })
    await waitFor(() => expect(within(dialog).queryByText(t.sq_body_required)).toBeNull())
  })

  it('T2 — slug_already_used: inline slug error, no toast', async () => {
    mockCreate.mockResolvedValue({ error: 'slug_already_used' })
    renderManager([PAGE_A])

    const dialog = await openNewDialog()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_sq }))
    fireEvent.change(activePanel(dialog).getByLabelText(t.field_title_label), { target: { value: 'Terms' } })
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))

    await waitFor(() => expect(within(dialog).getByText(t.slug_already_used)).toBeTruthy())
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('T3 — any other server error raises the save_error toast', async () => {
    mockCreate.mockResolvedValue({ error: 'boom' })
    renderManager([PAGE_A])

    const dialog = await openNewDialog()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_sq }))
    fireEvent.change(activePanel(dialog).getByLabelText(t.field_title_label), { target: { value: 'Terms' } })
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(tLegal.save_error))
  })

  it('T4 — delete: confirm opens; confirming deletes and removes the row; cancelling calls nothing', async () => {
    renderManager([PAGE_A, PAGE_B])

    // Cancel path.
    fireEvent.click(screen.getAllByRole('button', { name: tc.delete })[0])
    let dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(t.delete_confirm)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: tc.cancel }))
    expect(mockDelete).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    // Confirm path.
    fireEvent.click(screen.getAllByRole('button', { name: tc.delete })[0])
    dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Kushtet')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: tc.delete }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(PAGE_A.id))
    await waitFor(() => expect(screen.queryByText('Kushtet')).toBeNull())
    expect(mockToastSuccess).toHaveBeenCalledWith(tLegal.delete_success)
  })

  it('T5 — a legacy page raises the banner and disables new, edit and delete', () => {
    renderManager([PAGE_A, PAGE_LEGACY])

    expect(screen.getByText(t.migration_pending_banner)).toBeTruthy()
    for (const button of screen.getAllByRole('button', { name: t.btn_new })) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
    for (const name of [tc.edit, tc.delete]) {
      const buttons = screen.getAllByRole('button', { name })
      expect(buttons.length).toBeGreaterThan(0)
      for (const button of buttons) expect((button as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('T6 — a new page: the slug follows the sq title until the slug is edited by hand', async () => {
    renderManager([PAGE_A])

    const dialog = await openNewDialog()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_sq }))
    const title = () => activePanel(dialog).getByLabelText(t.field_title_label)
    const slug = within(dialog).getByLabelText(t.field_slug_label) as HTMLInputElement

    fireEvent.change(title(), { target: { value: 'Rreth Nesh' } })
    expect(slug.value).toBe('rreth-nesh')

    fireEvent.change(slug, { target: { value: 'custom-slug' } })
    fireEvent.change(title(), { target: { value: 'Tjeter Titull' } })
    expect(slug.value).toBe('custom-slug')
  })
})

describe('AdminPagesManager — editor image upload (T12)', () => {
  const CLD = 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.png'

  async function openImageDialog() {
    const dialog = await openNewDialog()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_sq }))
    // The image function is an item of the toolbar's Insert menu.
    fireEvent.click(within(dialog).getByRole('button', { name: messages.admin.pages.editor.menu_insert }))
    fireEvent.click(await screen.findByRole('menuitem', { name: messages.admin.pages.editor.image_insert }))
    const imageDialog = (await screen.findAllByRole('dialog')).find(d => d !== dialog) as HTMLElement
    const input = imageDialog.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2])], 'a.png', { type: 'image/png' })] } })
    fireEvent.change(within(imageDialog).getByLabelText(messages.admin.pages.editor.image_alt_label), { target: { value: 'Fasada' } })
    return { dialog, imageDialog }
  }

  it('posts the file to /api/upload-cms-image and inserts the returned URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: CLD }) })
    vi.stubGlobal('fetch', fetchMock)
    mockCreate.mockResolvedValue({})
    renderManager([PAGE_A])

    const { dialog, imageDialog } = await openImageDialog()
    fireEvent.click(within(imageDialog).getByRole('button', { name: messages.admin.pages.editor.image_upload }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/upload-cms-image')
    expect((fetchMock.mock.calls[0][1].body as FormData).get('image')).toBeTruthy()
    await waitFor(() => expect(activePanel(dialog).getByRole('textbox', { name: t.field_body_label }).innerHTML).toContain(CLD))
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('a failed upload raises the localized toast and keeps the image dialog open', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'upload_failed' }) }))
    renderManager([PAGE_A])

    const { imageDialog } = await openImageDialog()
    fireEvent.click(within(imageDialog).getByRole('button', { name: messages.admin.pages.editor.image_upload }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(messages.admin.pages.editor.image_upload_error))
    expect(screen.getAllByRole('dialog').length).toBe(2)
  })
})
