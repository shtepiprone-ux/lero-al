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
 *
 * Task 971 — the leaks the pending-timer guard of `src/tests/setup.ts` caught in this file, and their measured causes (Revision 1 run with a wait budget of 0):
 *   - Tiptap `scheduleDestroy` (a 1 ms timer) and ProseMirror's DOM observer and focus handler (20 ms timers) start when the editor unmounts, so they were still
 *     pending the instant the test ended (T1, T2, T3, T6 and both T12 tests).
 *   - A Mantine `Transition` frame (`use-transition.mjs:52`/`:56`) and its `setTimeout(duration)`: when `mounted` flips inside the `flushSync` of the previous
 *     frame (a dialog opened and closed within one frame, which a loaded machine makes likely), `handleStateChange` runs inside that frame's callback and the
 *     callback then overwrites `rafRef` with its own second frame, so the frame the re-entrant call scheduled is never cancelled on unmount. Its timer is the one
 *     that crashed CI run 42766290854 with `window is not defined` from `use-transition.mjs:61`.
 *   Fix: none in this file. After Testing Library's cleanup the guard waits on the real clock (it never clears anything, 3 s budget) for these timers and frames to
 *   run while the environment is alive, and fails the test by name for what is still pending. That wait is what settles them.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { Editor } from '@tiptap/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import sqMessages from '../../../../messages/sq.json'
import ukMessages from '../../../../messages/uk.json'
import itMessages from '../../../../messages/it.json'
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

function renderManager(pages: Page[], adminLocale: 'sq' | 'en' | 'uk' | 'it' = 'en') {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminPagesManager pages={pages} adminLocale={adminLocale} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

async function openNewDialog() {
  fireEvent.click(screen.getAllByRole('button', { name: t.btn_new })[0])
  return screen.findByRole('dialog')
}

// The language panel is the dialog's first visible tabpanel (Task 990: the editor's Visual/Text tabs add their own panel inside it).
function activePanel(dialog: HTMLElement) {
  return within(within(dialog).getAllByRole('tabpanel')[0])
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
    // Task 990: a new page opens on the Albanian tab, whatever the admin locale (en here); before, it opened on the admin locale.
    expect(within(dialog).getByRole('tab', { name: t.editor_locale_sq }).getAttribute('aria-selected')).toBe('true')

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

// Task 990 AC1, AC2, AC3 (the page side): owner list item 20 (2026-11-19) — a page the admin creates in any admin language is saved and published.
describe('AdminPagesManager — a page is created from any admin language (Task 990)', () => {
  it('AC1 — with the admin language uk, "New page" opens on the Albanian tab', async () => {
    renderManager([PAGE_A], 'uk')
    const dialog = await openNewDialog()
    expect(within(dialog).getByRole('tab', { name: t.editor_locale_sq }).getAttribute('aria-selected')).toBe('true')
    expect(within(dialog).getByRole('tab', { name: t.editor_locale_uk }).getAttribute('aria-selected')).toBe('false')
  })

  it('AC1 — the other languages\' titles are marked optional, the Albanian one is not (owner policy 2026-06-26, confirmed 2026-11-27)', async () => {
    renderManager([PAGE_A], 'uk')
    const dialog = await openNewDialog()
    expect(activePanel(dialog).getByLabelText(t.field_title_label)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_uk }))
    expect(activePanel(dialog).getByLabelText(t.field_title_optional_label)).toBeTruthy()
    expect(activePanel(dialog).queryByLabelText(t.field_title_label)).toBeNull()
  })

  it('AC1 — Save with only Ukrainian fields shows sq_title_required on the Albanian title and calls no action', async () => {
    renderManager([PAGE_A], 'uk')
    const dialog = await openNewDialog()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_uk }))
    fireEvent.change(activePanel(dialog).getByLabelText(t.field_title_optional_label), { target: { value: 'Тестова' } })

    const save = within(dialog).getByRole('button', { name: tc.save }) as HTMLButtonElement
    expect(save.disabled).toBe(false)
    fireEvent.click(save)

    await waitFor(() => expect(within(dialog).getByRole('tab', { name: new RegExp(t.editor_locale_sq) }).getAttribute('aria-selected')).toBe('true'))
    const title = activePanel(dialog).getByLabelText(t.field_title_label)
    expect(title.getAttribute('aria-invalid')).toBe('true')
    expect(activePanel(dialog).getByText(t.sq_title_required)).toBeTruthy()
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()

    // typing the Albanian title clears the error
    fireEvent.change(title, { target: { value: 'Faqe' } })
    expect(activePanel(dialog).queryByText(t.sq_title_required)).toBeNull()
  })

  it('AC1 — with an Albanian title a new page is created published, with the address from its letters', async () => {
    renderManager([PAGE_A], 'uk')
    const dialog = await openNewDialog()
    expect(within(dialog).getByRole('switch', { name: tLegal.toggle_published })).toBeTruthy()
    fireEvent.change(activePanel(dialog).getByLabelText(t.field_title_label), { target: { value: 'Çmimet e shtëpive' } })
    expect((within(dialog).getByLabelText(t.field_slug_label) as HTMLInputElement).value).toBe('cmimet-e-shtepive')
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ slug: 'cmimet-e-shtepive', is_published: true }))
  })

  it('AC1 — editing a draft keeps it a draft, editing a published page keeps it published', async () => {
    renderManager([PAGE_A, PAGE_B])
    fireEvent.click(screen.getAllByRole('button', { name: tc.edit })[1])
    let dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('switch', { name: tLegal.toggle_draft })).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith(PAGE_B.id, expect.objectContaining({ is_published: false }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getAllByRole('button', { name: tc.edit })[0])
    dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2))
    expect(mockUpdate).toHaveBeenLastCalledWith(PAGE_A.id, expect.objectContaining({ is_published: true }))
  })

  it('AC2 — the button reads "New page" once: no message and no button text starts with "+"', () => {
    for (const locale of [messages, sqMessages, ukMessages, itMessages]) {
      expect(locale.admin.pages.btn_new.trim().startsWith('+')).toBe(false)
    }
    renderManager([PAGE_A])
    for (const button of screen.getAllByRole('button', { name: t.btn_new })) {
      expect(button.textContent?.trim().startsWith('+')).toBe(false)
    }
  })

  it('AC3 — a delete refused with page_in_footer names the footer languages in the toast and keeps the row', async () => {
    mockDelete.mockResolvedValue({ error: 'page_in_footer', locales: ['sq', 'uk'] })
    renderManager([PAGE_A, PAGE_B])
    fireEvent.click(screen.getAllByRole('button', { name: tc.delete })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: tc.delete }))

    const named = t.page_in_footer.replace('{locales}', `${t.editor_locale_sq}, ${t.editor_locale_uk}`)
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(named))
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(screen.queryAllByText('Kushtet').length).toBeGreaterThan(0)
  })

  it('AC3 — a save refused with page_in_footer names the footer languages and keeps the dialog open', async () => {
    mockUpdate.mockResolvedValue({ error: 'page_in_footer', locales: ['en'] })
    renderManager([PAGE_A])
    fireEvent.click(screen.getAllByRole('button', { name: tc.edit })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('switch', { name: tLegal.toggle_published }))
    fireEvent.click(within(dialog).getByRole('button', { name: tc.save }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.page_in_footer.replace('{locales}', t.editor_locale_en)))
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})

// Task 990 Review 2 F6: Mantine closes every opened modal on one Escape (its window keydown listener, capture phase), so Escape in the editor's full-screen
// view or "Add media" dialog also closed the page dialog and lost what was typed. Escape now closes only the editor's dialog.
describe('AdminPagesManager — Escape closes only the editor dialog [F6]', () => {
  const tEditor = messages.admin.pages.editor

  async function openWithTitle() {
    renderManager([PAGE_A], 'uk')
    const dialog = await openNewDialog()
    fireEvent.change(activePanel(dialog).getByLabelText(t.field_title_label), { target: { value: 'Faqja e re' } })
    return dialog
  }

  function pressEscape() {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
  }

  it('[F6] (a) Escape in full screen closes full screen only; the page dialog and its title stay', async () => {
    const dialog = await openWithTitle()
    fireEvent.click(activePanel(dialog).getByRole('button', { name: tEditor.fullscreen }))
    await screen.findByRole('button', { name: tEditor.fullscreen_close })

    pressEscape()

    await waitFor(() => expect(screen.queryByRole('button', { name: tEditor.fullscreen_close })).toBeNull())
    expect(screen.getAllByRole('dialog')).toEqual([dialog])
    expect((activePanel(dialog).getByLabelText(t.field_title_label) as HTMLInputElement).value).toBe('Faqja e re')
  })

  it('[F6] (b) Escape in "Add media" closes that dialog only; the page dialog and its title stay', async () => {
    const dialog = await openWithTitle()
    fireEvent.click(activePanel(dialog).getByRole('button', { name: tEditor.add_media }))
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(2))

    pressEscape()

    await waitFor(() => expect(screen.queryByRole('dialog', { name: tEditor.image_dialog_title })).toBeNull())
    expect(screen.getAllByRole('dialog')).toEqual([dialog])
    expect((activePanel(dialog).getByLabelText(t.field_title_label) as HTMLInputElement).value).toBe('Faqja e re')
  })

  it('[F6] (c) with no editor dialog open, Escape closes the page dialog (as on main)', async () => {
    await openWithTitle()

    pressEscape()

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})

describe('AdminPagesManager — editor image upload (T12)', () => {
  const CLD = 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.png'

  async function openImageDialog() {
    const dialog = await openNewDialog()
    fireEvent.click(within(dialog).getByRole('tab', { name: t.editor_locale_sq }))
    // Task 990 (O990-1): the image function is "Add media" above the toolbar (it was an item of the Insert menu).
    fireEvent.click(activePanel(dialog).getByRole('button', { name: messages.admin.pages.editor.add_media }))
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

// Task 953 (set-state-in-effect): the list follows the pages the server sends after a refresh (the editor calls router.refresh()).
describe('AdminPagesManager — local copy follows the server props (Task 953)', () => {
  const tree = (pages: Page[]) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminPagesManager pages={pages} adminLocale="en" />
      </MantineProvider>
    </NextIntlClientProvider>
  )

  it('replaces its rows when new pages arrive', () => {
    const view = renderManager([PAGE_A, PAGE_B])
    expect(screen.queryAllByText('Kushtet').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Rreth nesh').length).toBeGreaterThan(0)
    view.rerender(tree([PAGE_B]))
    expect(screen.queryAllByText('Kushtet')).toHaveLength(0)
    expect(screen.queryAllByText('Rreth nesh').length).toBeGreaterThan(0)
  })

  it('keeps a row removed by a delete while the server list is the same one, and takes the new list when it changes', async () => {
    mockDelete.mockResolvedValue({})
    const pages = [PAGE_A, PAGE_B]
    const view = render(tree(pages))
    fireEvent.click(screen.getAllByRole('button', { name: tc.delete })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: tc.delete }))
    await waitFor(() => expect(screen.queryByText('Kushtet')).toBeNull())
    view.rerender(tree(pages))
    expect(screen.queryByText('Kushtet')).toBeNull()
    view.rerender(tree([...pages]))
    expect(screen.queryAllByText('Kushtet').length).toBeGreaterThan(0)
  })
})
