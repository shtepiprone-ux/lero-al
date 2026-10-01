/**
 * MantineRichTextEditor — RTL smoke test (Task 868, T7 columns, T11 empty value, image dialog, tables).
 *
 * Renders the REAL pattern in jsdom and drives the real Tiptap editor through the toolbar controls. The
 * editor instance is reached through the contenteditable's `editor` property (Tiptap sets it on the view DOM).
 */
import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import type { Editor } from '@tiptap/react'
import { theme } from '@/design-system/mantine/theme'
import { MantineRichTextEditor, type RichTextEditorLabels } from '../MantineRichTextEditor'
import { sanitizeCmsHtml } from '@/modules/cms/lib/sanitizeCmsHtml'

// Test labels: every key distinct so a control is found by its own name.
const LABELS = Object.fromEntries(
  (
    [
      'toolbar', 'menuFormat', 'menuParagraph', 'menuInsert', 'menuHistory', 'bold', 'italic', 'underline', 'strike', 'clearFormatting', 'h2', 'h3', 'h4', 'bulletList',
      'orderedList', 'blockquote', 'link', 'unlink', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
      'undo', 'redo', 'linkInputLabel', 'linkInputPlaceholder', 'linkExternal', 'linkInternal', 'linkSave',
      'columns2', 'columns3', 'columnsRemove', 'tableInsert', 'tableAddRow', 'tableDeleteRow', 'tableAddColumn',
      'tableDeleteColumn', 'tableToggleHeader', 'tableDelete', 'imageInsert', 'imageDialogTitle',
      'imageFileLabel', 'imageFilePlaceholder', 'imageAltLabel', 'imageHint', 'imageUpload', 'imageCancel',
      'imageErrorType', 'imageErrorSize',
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
    <MantineProvider theme={theme} env="test">
      <Harness {...props} />
    </MantineProvider>,
  )
}

async function getEditor(): Promise<Editor> {
  const box = await screen.findByRole('textbox', { name: 'Body' })
  return (box as unknown as { editor: Editor }).editor
}

type LabelKey = keyof typeof LABELS

/** Opens one of the toolbar's command menus (the desktop path: an anchored Mantine `Menu`). */
async function openMenu(trigger: LabelKey) {
  fireEvent.click(screen.getByRole('button', { name: LABELS[trigger] }))
  return screen.findByRole('menu')
}

/** Opens a menu and presses one of its items. */
async function pick(trigger: LabelKey, item: LabelKey) {
  const menu = await openMenu(trigger)
  fireEvent.click(within(menu).getByRole('menuitem', { name: LABELS[item] }))
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
  it('names the editable area by its label and holds five toolbar controls', async () => {
    renderEditor()
    await getEditor()

    const toolbar = screen.getByLabelText(LABELS.toolbar)
    expect(within(toolbar).getAllByRole('button')).toHaveLength(5)
    for (const key of ['menuFormat', 'menuParagraph', 'menuInsert', 'link', 'menuHistory'] as const) {
      expect(within(toolbar).getByRole('button', { name: LABELS[key] }), key).toBeTruthy()
    }
  })

  it.each([
    ['menuFormat', ['bold', 'italic', 'underline', 'strike', 'clearFormatting', 'unlink']],
    ['menuParagraph', ['h2', 'h3', 'h4', 'bulletList', 'orderedList', 'blockquote', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify']],
    ['menuInsert', ['columns2', 'columns3', 'columnsRemove', 'tableInsert', 'tableAddRow', 'tableDeleteRow', 'tableAddColumn', 'tableDeleteColumn', 'tableToggleHeader', 'tableDelete', 'imageInsert']],
    ['menuHistory', ['undo', 'redo']],
  ] as const)('the %s menu lists every D868-3 function by its localized name', async (trigger, items) => {
    renderEditor()
    await getEditor()

    const menu = await openMenu(trigger)
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(items.length)
    for (const key of items) {
      expect(within(menu).getByRole('menuitem', { name: LABELS[key] }), key).toBeTruthy()
    }
  })

  it('T11 — an empty editor emits "" and never <p></p>', async () => {
    renderEditor()
    const editor = await getEditor()

    act(() => { editor.commands.insertContent('x') })
    await waitFor(() => expect(latest).toBe('<p>x</p>'))

    act(() => { editor.commands.clearContent(true) })
    await waitFor(() => expect(latest).toBe(''))
  })

  it('T7 — the 2-column control inserts the block the sanitizer keeps byte-identical', async () => {
    renderEditor()
    await getEditor()

    await pick('menuInsert', 'columns2')
    await waitFor(() => expect(latest).toContain('data-type="columns"'))

    expect(latest).toMatch(/^<div data-type="columns" data-cols="2">/)
    expect((latest.match(/data-type="column"/g) ?? []).length).toBe(2)
    expect(sanitizeCmsHtml(latest)).toBe(latest)
  })

  it('T7 — the 3-column control inserts 3 columns, and remove deletes the block', async () => {
    renderEditor()
    await getEditor()

    await pick('menuInsert', 'columns3')
    await waitFor(() => expect(latest).toContain('data-cols="3"'))
    expect((latest.match(/data-type="column"/g) ?? []).length).toBe(3)
    expect(sanitizeCmsHtml(latest)).toBe(latest)

    await pick('menuInsert', 'columnsRemove')
    await waitFor(() => expect(latest).not.toContain('data-type="columns"'))
  })

  it('inserts a 3×3 table with a header row, and the sanitizer keeps it', async () => {
    renderEditor()
    await getEditor()

    await pick('menuInsert', 'tableInsert')
    await waitFor(() => expect(latest).toContain('<table'))

    expect((latest.match(/<th\b/g) ?? []).length).toBe(3)
    expect((latest.match(/<td\b/g) ?? []).length).toBe(6)
    expect(sanitizeCmsHtml(latest)).toContain('<table')
  })

  it('image dialog: a valid file and alt text upload, then insert <img src alt>', async () => {
    const upload = vi.fn(async () => CLD)
    renderEditor({ onUpload: upload })
    await getEditor()

    await pick('menuInsert', 'imageInsert')
    const dialog = await screen.findByRole('dialog')
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

    await pick('menuInsert', 'imageInsert')
    const dialog = await screen.findByRole('dialog')
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

    await pick('menuInsert', 'imageInsert')
    const dialog = await screen.findByRole('dialog')
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })] } })
    fireEvent.change(within(dialog).getByLabelText(LABELS.imageAltLabel), { target: { value: 'x' } })
    fireEvent.click(within(dialog).getByRole('button', { name: LABELS.imageUpload }))

    await waitFor(() => expect(upload).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(latest).toBe('')
    expect(screen.getByText('keep me')).toBeTruthy()
  })

  it('bold through the Format menu wraps the selected text in <strong>, and the selection survives the menu', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => {
      editor.commands.setContent('<p>hello</p>')
      editor.commands.setTextSelection({ from: 1, to: 6 })
    })

    await pick('menuFormat', 'bold')

    await waitFor(() => expect(latest).toBe('<p><strong>hello</strong></p>'))
    expect(editor.state.selection.from).toBe(1)
    expect(editor.state.selection.to).toBe(6)
  })

  it('H2 through the Paragraph menu turns the block into an <h2>', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => {
      editor.commands.setContent('<p>title</p>')
      editor.commands.setTextSelection(2)
    })

    await pick('menuParagraph', 'h2')

    await waitFor(() => expect(latest).toMatch(/^<h2>title<\/h2>/))
  })

  it('align centre through the Paragraph menu sets text-align: center', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => {
      editor.commands.setContent('<p>mid</p>')
      editor.commands.setTextSelection(2)
    })

    await pick('menuParagraph', 'alignCenter')

    await waitFor(() => expect(latest).toContain('text-align: center'))
  })

  it('remove link is disabled while the selection has no link, and enabled inside one', async () => {
    renderEditor({ initial: '<p>plain <a href="https://example.com/">linked</a></p>' })
    const editor = await getEditor()
    act(() => { editor.commands.setTextSelection(2) })

    const first = await openMenu('menuFormat')
    expect((within(first).getByRole('menuitem', { name: LABELS.unlink }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.keyDown(first, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())

    act(() => { editor.commands.setTextSelection(9) })
    const second = await openMenu('menuFormat')
    expect((within(second).getByRole('menuitem', { name: LABELS.unlink }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('undo through the History menu reverts the last change', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => { editor.commands.insertContent('x') })
    await waitFor(() => expect(latest).toBe('<p>x</p>'))

    await pick('menuHistory', 'undo')

    await waitFor(() => expect(latest).toBe(''))
  })

  it('AC30 — with the cursor in bold text the Format trigger is active and the Bold item shows a check', async () => {
    renderEditor({ initial: '<p><strong>bold</strong> plain</p>' })
    const editor = await getEditor()
    act(() => { editor.commands.setTextSelection(3) })

    const trigger = screen.getByRole('button', { name: LABELS.menuFormat })
    await waitFor(() => expect(trigger.hasAttribute('data-active')).toBe(true))

    const menu = await openMenu('menuFormat')
    const bold = within(menu).getByRole('menuitem', { name: LABELS.bold })
    expect(bold.hasAttribute('data-active')).toBe(true)
    expect(bold.querySelector('.lucide-check')).toBeTruthy()
    expect(within(menu).getByRole('menuitem', { name: LABELS.italic }).querySelector('.lucide-check')).toBeNull()
  })
})
