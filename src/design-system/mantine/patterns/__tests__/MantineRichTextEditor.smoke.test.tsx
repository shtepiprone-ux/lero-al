/**
 * MantineRichTextEditor — RTL smoke test (Task 868, T7 columns, T11 empty value, image dialog, tables).
 *
 * Renders the REAL pattern in jsdom and drives the real Tiptap editor through the toolbar controls. The
 * editor instance is reached through the contenteditable's `editor` property (Tiptap sets it on the view DOM).
 *
 * Task 990 (O990-1, owner 2026-11-19, replaces D868-6/D868-7): the five menus became the WordPress classic toolbar, so each function is now pressed on its
 * own tool ("Add media" for the image, the table menu, the "Paragraph" select); every assertion on what a function does is kept. The columns tool left the
 * toolbar while its extension stays for stored pages, so T7 inserts and removes the block through the editor's own commands; clear formatting is one of the
 * five tools the owner excluded. `MantineRichTextEditor.toolbar.test.tsx` holds the toolbar itself (AC4).
 */
import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../../../../messages/en.json'
import type { Editor } from '@tiptap/react'
import { theme } from '@/design-system/mantine/theme'
import { MantineRichTextEditor, type RichTextEditorLabels } from '../MantineRichTextEditor'
import { sanitizeCmsHtml } from '@/modules/cms/lib/sanitizeCmsHtml'

// Test labels: every key distinct so a control is found by its own name.
const LABELS = Object.fromEntries(
  (
    [
      'toolbar', 'toolbarToggle', 'fullscreen', 'addMedia', 'modeVisual', 'modeText', 'bold', 'italic', 'underline', 'strike', 'h2', 'h3', 'h4', 'h5', 'h6',
      'bulletList', 'orderedList', 'blockquote', 'hr', 'link', 'unlink', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
      'undo', 'redo', 'blockFormat', 'paragraph', 'preformatted', 'textColor', 'colorDefault', 'colorBrand', 'colorGray', 'colorRed', 'colorOrange',
      'colorGreen', 'colorBlueLight', 'tableMenu', 'linkInputLabel', 'linkInputPlaceholder', 'linkExternal', 'linkInternal', 'linkSave',
      'tableInsert', 'tableAddRow', 'tableDeleteRow', 'tableAddColumn',
      'tableDeleteColumn', 'tableToggleHeader', 'tableDelete', 'imageInsert', 'imageDialogTitle',
      'imageFileLabel', 'imageFilePlaceholder', 'imageAltLabel', 'imageHint', 'imageUpload', 'imageCancel',
      'imageErrorType', 'imageErrorSize', 'listItem', 'code', 'closeTags',
    ] as const
  ).map(key => [key, `L:${key}`]),
) as unknown as RichTextEditorLabels

const CLD = 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.jpg'

let latest = ''
function Harness({ initial = '', onUpload }: { initial?: string; onUpload?: (file: File) => Promise<string> }) {
  const [value, setValue] = useState(initial)
  return (
    <MantineRichTextEditor
      label="Body"
      value={value}
      onChange={html => {
        latest = html
        setValue(html)
      }}
      labels={LABELS}
      onUploadImage={onUpload ?? (async () => CLD)}
    />
  )
}

function renderEditor(props: React.ComponentProps<typeof Harness> = {}) {
  return render(
    // Task 859 R29: the image dialog is a structured MantineModal, whose close button is labelled from `common.close`.
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <Harness {...props} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

async function getEditor(): Promise<Editor> {
  const box = await screen.findByRole('textbox', { name: 'Body' })
  return (box as unknown as { editor: Editor }).editor
}

type LabelKey = keyof typeof LABELS

/** Opens one of the toolbar's menus (the desktop path: an anchored Mantine `Menu`). */
async function openMenu(trigger: LabelKey) {
  fireEvent.click(screen.getByRole('button', { name: LABELS[trigger] }))
  return screen.findByRole('menu')
}

/** Opens a menu and presses one of its items. */
async function pick(trigger: LabelKey, item: LabelKey) {
  const menu = await openMenu(trigger)
  fireEvent.click(within(menu).getByRole('menuitem', { name: LABELS[item] }))
}

/** Presses one tool of the toolbar. */
function press(tool: LabelKey) {
  fireEvent.click(within(screen.getByRole('toolbar', { name: LABELS.toolbar })).getByRole('button', { name: LABELS[tool] }))
}

/** Opens the image dialog ("Add media", Task 990; it was an item of the Insert menu). */
async function openImageDialog() {
  fireEvent.click(screen.getByRole('button', { name: LABELS.addMedia }))
  return screen.findByRole('dialog')
}

beforeEach(() => {
  latest = ''
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  )
  // ProseMirror measures client rects when it scrolls the selection into view; jsdom has none.
  const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() {} }
  Range.prototype.getBoundingClientRect = () => rect as DOMRect
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList
})

describe('MantineRichTextEditor', () => {
  it('names the editable area by its label and holds the 21 tools of the O990-1 toolbar (Task 990; it held five menus)', async () => {
    renderEditor()
    await getEditor()

    const toolbar = screen.getByRole('toolbar', { name: LABELS.toolbar })
    expect(within(toolbar).getAllByRole('button')).toHaveLength(21)
  })

  // Every D868-3 function that O990-1 keeps is still reachable by its localized name: on its own tool, in the table menu, in the "Paragraph" select, or as
  // "Add media". Clear formatting (owner-excluded) and the three columns items (the tool left the toolbar) are not offered.
  it.each([
    ['tools', ['bold', 'italic', 'underline', 'strike', 'unlink', 'bulletList', 'orderedList', 'blockquote', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'undo', 'redo', 'link']],
    ['tableMenu', ['tableInsert', 'tableAddRow', 'tableDeleteRow', 'tableAddColumn', 'tableDeleteColumn', 'tableToggleHeader', 'tableDelete']],
    ['paragraph', ['h2', 'h3', 'h4']],
  ] as const)('the D868-3 functions of %s are offered by their localized names', async (where, items) => {
    renderEditor()
    await getEditor()

    if (where === 'tools') {
      const toolbar = screen.getByRole('toolbar', { name: LABELS.toolbar })
      for (const key of items) expect(within(toolbar).getByRole('button', { name: LABELS[key] }), key).toBeTruthy()
    } else {
      const menu = await openMenu(where)
      for (const key of items) expect(within(menu).getByRole('menuitem', { name: LABELS[key] }), key).toBeTruthy()
    }
    expect(screen.getByRole('button', { name: LABELS.addMedia })).toBeTruthy()
  })

  it('T11 — an empty editor emits "" and never <p></p>', async () => {
    renderEditor()
    const editor = await getEditor()

    act(() => { editor.commands.insertContent('x') })
    await waitFor(() => expect(latest).toBe('<p>x</p>'))

    act(() => { editor.commands.clearContent(true) })
    await waitFor(() => expect(latest).toBe(''))
  })

  it('T7 — the 2-column block (its extension stays for stored pages) is the block the sanitizer keeps byte-identical', async () => {
    renderEditor()
    const editor = await getEditor()

    act(() => { editor.chain().focus().insertColumns(2).run() })
    await waitFor(() => expect(latest).toContain('data-type="columns"'))

    expect(latest).toMatch(/^<div data-type="columns" data-cols="2">/)
    expect((latest.match(/data-type="column"/g) ?? []).length).toBe(2)
    expect(sanitizeCmsHtml(latest)).toBe(latest)
  })

  it('T7 — the 3-column block holds 3 columns, and remove deletes the block', async () => {
    renderEditor()
    const editor = await getEditor()

    act(() => { editor.chain().focus().insertColumns(3).run() })
    await waitFor(() => expect(latest).toContain('data-cols="3"'))
    expect((latest.match(/data-type="column"/g) ?? []).length).toBe(3)
    expect(sanitizeCmsHtml(latest)).toBe(latest)

    act(() => { editor.chain().focus().removeColumns().run() })
    await waitFor(() => expect(latest).not.toContain('data-type="columns"'))
  })

  it('inserts a 3×3 table with a header row, and the sanitizer keeps it', async () => {
    renderEditor()
    await getEditor()

    await pick('tableMenu', 'tableInsert')
    await waitFor(() => expect(latest).toContain('<table'))

    expect((latest.match(/<th\b/g) ?? []).length).toBe(3)
    expect((latest.match(/<td\b/g) ?? []).length).toBe(6)
    expect(sanitizeCmsHtml(latest)).toContain('<table')
  })

  it('image dialog: a valid file and alt text upload, then insert <img src alt>', async () => {
    const upload = vi.fn(async () => CLD)
    renderEditor({ onUpload: upload })
    await getEditor()

    const dialog = await openImageDialog()
    const send = within(dialog).getByRole('button', { name: LABELS.imageUpload }) as HTMLButtonElement
    expect(send.disabled).toBe(true)

    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' })
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.change(within(dialog).getByLabelText(LABELS.imageAltLabel), { target: { value: 'Fasada' } })
    await waitFor(() => expect(send.disabled).toBe(false))
    fireEvent.click(send)

    await waitFor(() => expect(upload).toHaveBeenCalledWith(file))
    await waitFor(() => expect(latest).toContain(`<img src="${CLD}" alt="Fasada">`))
    expect(sanitizeCmsHtml(latest)).toContain(`src="${CLD}"`)
    expect(latest).not.toBe('')
  })

  it('image dialog: a non-image file shows the type error and cannot be uploaded', async () => {
    const upload = vi.fn(async () => CLD)
    renderEditor({ onUpload: upload })
    await getEditor()

    const dialog = await openImageDialog()
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] } })
    fireEvent.change(within(dialog).getByLabelText(LABELS.imageAltLabel), { target: { value: 'x' } })

    await waitFor(() => expect(within(dialog).getByText(LABELS.imageErrorType)).toBeTruthy())
    expect((within(dialog).getByRole('button', { name: LABELS.imageUpload }) as HTMLButtonElement).disabled).toBe(true)
    expect(upload).not.toHaveBeenCalled()
  })

  it('image dialog: a failed upload keeps the dialog open and the document untouched', async () => {
    const upload = vi.fn(async () => { throw new Error('boom') })
    renderEditor({ onUpload: upload, initial: '<p>keep me</p>' })
    await getEditor()

    const dialog = await openImageDialog()
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })] } })
    fireEvent.change(within(dialog).getByLabelText(LABELS.imageAltLabel), { target: { value: 'x' } })
    fireEvent.click(within(dialog).getByRole('button', { name: LABELS.imageUpload }))

    await waitFor(() => expect(upload).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(latest).toBe('')
    expect(screen.getByText('keep me')).toBeTruthy()
  })

  it('bold through its tool wraps the selected text in <strong>, and the selection survives the press', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => {
      editor.commands.setContent('<p>hello</p>')
      editor.commands.setTextSelection({ from: 1, to: 6 })
    })

    press('bold')

    await waitFor(() => expect(latest).toBe('<p><strong>hello</strong></p>'))
    expect(editor.state.selection.from).toBe(1)
    expect(editor.state.selection.to).toBe(6)
  })

  it('H2 through the Paragraph select turns the block into an <h2>', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => {
      editor.commands.setContent('<p>title</p>')
      editor.commands.setTextSelection(2)
    })

    await pick('paragraph', 'h2')

    await waitFor(() => expect(latest).toMatch(/^<h2>title<\/h2>/))
  })

  it('align centre through its tool sets text-align: center', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => {
      editor.commands.setContent('<p>mid</p>')
      editor.commands.setTextSelection(2)
    })

    press('alignCenter')

    await waitFor(() => expect(latest).toContain('text-align: center'))
  })

  it('remove link is disabled while the selection has no link, and enabled inside one', async () => {
    renderEditor({ initial: '<p>plain <a href="https://example.com/">linked</a></p>' })
    const editor = await getEditor()
    act(() => { editor.commands.setTextSelection(2) })

    const unlink = () => within(screen.getByRole('toolbar', { name: LABELS.toolbar })).getByRole('button', { name: LABELS.unlink }) as HTMLButtonElement
    await waitFor(() => expect(unlink().disabled).toBe(true))

    act(() => { editor.commands.setTextSelection(9) })
    await waitFor(() => expect(unlink().disabled).toBe(false))
  })

  it('undo through its tool reverts the last change', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => { editor.commands.insertContent('x') })
    await waitFor(() => expect(latest).toBe('<p>x</p>'))

    press('undo')

    await waitFor(() => expect(latest).toBe(''))
  })

  it('AC30 — with the cursor in bold text the Bold tool is active and the Italic tool is not', async () => {
    renderEditor({ initial: '<p><strong>bold</strong> plain</p>' })
    const editor = await getEditor()
    act(() => { editor.commands.setTextSelection(3) })

    const tool = (key: LabelKey) => within(screen.getByRole('toolbar', { name: LABELS.toolbar })).getByRole('button', { name: LABELS[key] })
    await waitFor(() => expect(tool('bold').hasAttribute('data-active')).toBe(true))
    expect(tool('italic').hasAttribute('data-active')).toBe(false)
  })
})
