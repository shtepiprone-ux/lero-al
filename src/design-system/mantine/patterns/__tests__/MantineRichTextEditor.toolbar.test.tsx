/**
 * Task 990 AC4 — the toolbar of the page editor follows O990-1 (owner, 2026-11-19): the WordPress classic editor, every tool a familiar icon in one toolbar of
 * two rows at every width, without the five tools the owner excluded (special character, clear formatting, paste as text, indent and outdent, help), without
 * "more" (a page renders whole) and without the columns tool (its extension stays for stored pages). Above the toolbar: "Add media" and the "Visual" and "Text"
 * tabs; "Text" mode is the body's HTML with the WordPress quicktags. The text colour comes only from the theme palette (`textColors.ts`, owner 2026-11-19: "yes!").
 *
 * Renders the REAL pattern in jsdom and drives the real Tiptap editor. jsdom has no layout: the viewport picks the compact presentation through `matchMedia`
 * (`viewportKit`), and the control sizes are read from the rules Mantine writes for the responsive style props.
 */
import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../../../../messages/en.json'
import type { Editor } from '@tiptap/react'
import { theme } from '@/design-system/mantine/theme'
import { TEXT_COLORS } from '@/design-system/mantine/richtext/textColors'
import { sanitizeCmsHtml } from '@/modules/cms/lib/sanitizeCmsHtml'
import { MantineRichTextEditor, type RichTextEditorLabels } from '../MantineRichTextEditor'
import { setViewport } from './viewportKit'

const KEYS = [
  'toolbar', 'toolbarToggle', 'fullscreen', 'addMedia', 'modeVisual', 'modeText',
  'bold', 'italic', 'underline', 'strike', 'bulletList', 'orderedList', 'blockquote', 'hr',
  'link', 'unlink', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'undo', 'redo',
  'blockFormat', 'paragraph', 'h2', 'h3', 'h4', 'h5', 'h6', 'preformatted',
  'textColor', 'colorDefault', 'colorBrand', 'colorGray', 'colorRed', 'colorOrange', 'colorGreen', 'colorBlueLight',
  'tableMenu', 'tableInsert', 'tableAddRow', 'tableDeleteRow', 'tableAddColumn', 'tableDeleteColumn', 'tableToggleHeader', 'tableDelete',
  'linkInputLabel', 'linkInputPlaceholder', 'linkExternal', 'linkInternal', 'linkSave',
  'imageInsert', 'imageDialogTitle', 'imageFileLabel', 'imageFilePlaceholder', 'imageAltLabel', 'imageHint', 'imageUpload', 'imageCancel', 'imageErrorType', 'imageErrorSize',
  'listItem', 'code', 'closeTags',
] as const

// Test labels: every key distinct so a control is found by its own name.
const LABELS = Object.fromEntries(KEYS.map(key => [key, `L:${key}`])) as unknown as RichTextEditorLabels
const L = LABELS as unknown as Record<(typeof KEYS)[number], string>

const ROW_1 = ['bold', 'italic', 'strike', 'bulletList', 'orderedList', 'blockquote', 'hr', 'alignLeft', 'alignCenter', 'alignRight', 'link', 'unlink', 'tableMenu', 'toolbarToggle', 'fullscreen'] as const
// the "Paragraph" select is named by the format it shows (here: paragraph)
const ROW_2 = ['paragraph', 'underline', 'alignJustify', 'textColor', 'undo', 'redo'] as const
const COLOR_LABEL: Record<string, string> = { brand: L.colorBrand, gray: L.colorGray, red: L.colorRed, orange: L.colorOrange, green: L.colorGreen, blueLight: L.colorBlueLight }

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

const toolbar = () => screen.getByRole('toolbar', { name: L.toolbar })
const names = (root: HTMLElement) => within(root).getAllByRole('button').map(b => b.getAttribute('aria-label') ?? b.textContent?.trim() ?? '')

/** the min width and height a control gets below 640px and from 640px, from the rules Mantine writes for its responsive style props */
function sizes(el: HTMLElement) {
  const css = Array.from(document.querySelectorAll('style[data-mantine-styles="inline"]')).map(s => s.textContent ?? '').join('')
  const rule = (selector: string): Record<string, string> => {
    const at = css.indexOf(selector)
    if (at < 0) return {}
    const body = css.slice(at + selector.length, css.indexOf('}', at))
    return Object.fromEntries(body.split(';').filter(d => d.includes(':')).map(d => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]))
  }
  const px = (value: string | undefined) => (value && value.includes('rem') ? Number.parseFloat(value.replace('calc(', '')) * 16 : 0)
  const cls = Array.from(el.classList).find(c => c.startsWith('__m__-'))
  const base = cls ? rule(`.${cls}{`) : {}
  const wide = cls ? rule(`@media(min-width: 40em){.${cls}{`) : {}
  return {
    below: { w: px(base['min-width']), h: px(base['height'] ?? base['min-height']) },
    from640: { w: px(wide['min-width'] ?? base['min-width']), h: px(wide['height'] ?? wide['min-height'] ?? base['height']) },
  }
}

async function openMenu(name: string) {
  fireEvent.click(within(toolbar()).getByRole('button', { name }))
  return screen.findByRole('menu')
}

beforeEach(() => {
  latest = ''
  setViewport(1440)
  // ProseMirror measures client rects when it scrolls the selection into view; jsdom has none.
  const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() {} }
  Range.prototype.getBoundingClientRect = () => rect as DOMRect
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList
})

describe('Task 990 AC4 — the O990-1 toolbar', () => {
  it.each([320, 640, 1440])('at %ipx every tool of both rows is a button of the toolbar, in order, with its name; 44px below 640px, 26px from 640px', async (width) => {
    setViewport(width)
    renderEditor()
    await getEditor()

    expect(names(toolbar())).toEqual([...ROW_1, ...ROW_2].map(key => L[key]))
    for (const button of within(toolbar()).getAllByRole('button')) {
      expect(button.hasAttribute('hidden'), button.getAttribute('aria-label') ?? '').toBe(false)
      expect(button.getAttribute('title') ?? button.textContent, 'a visible name or tooltip').toBeTruthy()
      const { below, from640 } = sizes(button)
      expect(below.h, `${button.getAttribute('aria-label')} height below 640px`).toBeGreaterThanOrEqual(44)
      expect(below.w, `${button.getAttribute('aria-label')} width below 640px`).toBeGreaterThanOrEqual(44)
      expect(from640.h, `${button.getAttribute('aria-label')} height from 640px`).toBe(26)
    }
    // each icon tool carries its name as tooltip (title) and accessible name
    for (const key of [...ROW_1, 'underline', 'alignJustify', 'textColor', 'undo', 'redo'] as const) {
      const button = within(toolbar()).getByRole('button', { name: L[key] })
      expect(button.getAttribute('title'), key).toBe(L[key])
    }
    // above the toolbar: "Add media" and the "Visual" and "Text" tabs, "Visual" selected
    expect(screen.getByRole('button', { name: L.addMedia })).toBeTruthy()
    expect(screen.getByRole('tab', { name: L.modeVisual }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: L.modeText }).getAttribute('aria-selected')).toBe('false')
  })

  it('no excluded tool exists: special character, clear formatting, paste as text, indent, outdent, help, more, columns', async () => {
    renderEditor()
    await getEditor()
    const all = screen.getAllByRole('button').map(b => `${b.getAttribute('aria-label') ?? ''} ${b.getAttribute('title') ?? ''} ${b.textContent ?? ''}`.toLowerCase())
    for (const word of ['special', 'character', 'clear', 'formatting', 'paste', 'indent', 'outdent', 'help', 'more', 'column']) {
      expect(all.filter(text => text.includes(word)), word).toEqual([])
    }
    for (const icon of ['omega', 'eraser', 'remove-formatting', 'clipboard-type', 'indent', 'outdent', 'circle-help', 'columns-2', 'columns-3', 'square-x']) {
      expect(document.querySelector(`.lucide-${icon}`), icon).toBeNull()
    }
  })

  it('each tool shows its active state', async () => {
    renderEditor({ initial: '<p><strong><em><s><u>t</u></s></em></strong> <a href="https://example.com/">l</a></p><ul><li><p>li</p></li></ul><p style="text-align: center">c</p>' })
    const editor = await getEditor()
    const active = (key: (typeof KEYS)[number]) => within(toolbar()).getByRole('button', { name: L[key] }).hasAttribute('data-active')

    act(() => { editor.commands.setTextSelection(2) })
    await waitFor(() => expect(active('bold')).toBe(true))
    for (const key of ['italic', 'strike', 'underline'] as const) expect(active(key), key).toBe(true)
    for (const key of ['bulletList', 'alignCenter', 'link'] as const) expect(active(key), key).toBe(false)

    act(() => { editor.commands.setTextSelection({ from: 3, to: 4 }) })
    await waitFor(() => expect(active('link')).toBe(true))
    expect(active('bold')).toBe(false)

    const li = editor.state.doc.textContent.indexOf('li')
    act(() => { editor.commands.setTextSelection(li + 4) })
    await waitFor(() => expect(active('bulletList')).toBe(true))

    act(() => { editor.commands.setTextSelection(editor.state.doc.content.size - 2) })
    await waitFor(() => expect(active('alignCenter')).toBe(true))
    expect(active('alignLeft')).toBe(false)

    // the row toggle is active while row 2 shows
    expect(active('toolbarToggle')).toBe(true)
  })

  it('the row toggle hides and shows row 2; row 2 starts shown', async () => {
    renderEditor()
    await getEditor()
    const toggle = within(toolbar()).getByRole('button', { name: L.toolbarToggle })
    expect(toggle.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(toggle)
    expect(names(toolbar())).toEqual(ROW_1.map(key => L[key]))
    // Mantine's control writes aria-pressed only while it is active
    expect(toggle.getAttribute('aria-pressed')).toBeNull()

    fireEvent.click(toggle)
    expect(names(toolbar())).toEqual([...ROW_1, ...ROW_2].map(key => L[key]))
  })

  it('each tool of row 1 and row 2 runs its command', async () => {
    renderEditor()
    const editor = await getEditor()
    const run = async (key: (typeof KEYS)[number], expected: RegExp) => {
      act(() => {
        editor.commands.setContent('<p>word</p>')
        editor.commands.setTextSelection({ from: 1, to: 5 })
      })
      fireEvent.click(within(toolbar()).getByRole('button', { name: L[key] }))
      await waitFor(() => expect(latest, key).toMatch(expected))
    }
    await run('bold', /<strong>word<\/strong>/)
    await run('italic', /<em>word<\/em>/)
    await run('strike', /<s>word<\/s>/)
    await run('underline', /<u>word<\/u>/)
    await run('bulletList', /<ul><li><p>word<\/p><\/li><\/ul>/)
    await run('orderedList', /<ol><li><p>word<\/p><\/li><\/ol>/)
    await run('blockquote', /<blockquote><p>word<\/p><\/blockquote>/)
    await run('hr', /<hr>/)
    await run('alignCenter', /text-align: center/)
    await run('alignRight', /text-align: right/)
    await run('alignJustify', /text-align: justify/)

    act(() => { editor.commands.setContent('<p><a href="https://example.com/">word</a></p>'); editor.commands.setTextSelection(2) })
    fireEvent.click(within(toolbar()).getByRole('button', { name: L.unlink }))
    await waitFor(() => expect(latest).toBe('<p>word</p>'))

    act(() => { editor.commands.setContent('<p></p>'); editor.commands.insertContent('x') })
    await waitFor(() => expect(latest).toContain('x'))
    fireEvent.click(within(toolbar()).getByRole('button', { name: L.undo }))
    await waitFor(() => expect(latest).not.toContain('x'))
    fireEvent.click(within(toolbar()).getByRole('button', { name: L.redo }))
    await waitFor(() => expect(latest).toContain('x'))
  })

  it('the table menu holds its seven items, and insert adds a table with a header row', async () => {
    renderEditor()
    await getEditor()
    const menu = await openMenu(L.tableMenu)
    expect(within(menu).getAllByRole('menuitem').map(item => item.textContent?.trim())).toEqual(
      ['tableInsert', 'tableAddRow', 'tableDeleteRow', 'tableAddColumn', 'tableDeleteColumn', 'tableToggleHeader', 'tableDelete'].map(key => L[key as (typeof KEYS)[number]]),
    )
    fireEvent.click(within(menu).getByRole('menuitem', { name: L.tableInsert }))
    await waitFor(() => expect(latest).toContain('<table'))
    expect((latest.match(/<th\b/g) ?? []).length).toBe(3)
  })

  it('the "Paragraph" select offers paragraph, heading 2-6 and preformatted, and shows the current format', async () => {
    renderEditor()
    const editor = await getEditor()
    act(() => { editor.commands.setContent('<p>title</p>'); editor.commands.setTextSelection(2) })

    const menu = await openMenu(L.paragraph)
    expect(within(menu).getAllByRole('menuitem').map(item => item.textContent?.trim())).toEqual(['paragraph', 'h2', 'h3', 'h4', 'h5', 'h6', 'preformatted'].map(key => L[key as (typeof KEYS)[number]]))
    // (the editor's trailing-node rule adds an empty paragraph after a last block that is not one)
    fireEvent.click(within(menu).getByRole('menuitem', { name: L.h5 }))
    await waitFor(() => expect(latest).toMatch(/^<h5>title<\/h5>/))
    await waitFor(() => expect(within(toolbar()).getByRole('button', { name: L.h5 })).toBeTruthy())

    fireEvent.click(within(await openMenu(L.h5)).getByRole('menuitem', { name: L.h6 }))
    await waitFor(() => expect(latest).toMatch(/^<h6>title<\/h6>/))

    fireEvent.click(within(await openMenu(L.h6)).getByRole('menuitem', { name: L.preformatted }))
    await waitFor(() => expect(latest).toMatch(/^<pre><code>title<\/code><\/pre>/))

    fireEvent.click(within(await openMenu(L.preformatted)).getByRole('menuitem', { name: L.paragraph }))
    await waitFor(() => expect(latest).toMatch(/^<p>title<\/p>/))
  })

  it('the text colour palette offers exactly the textColors.ts values and "default", and applies each one', async () => {
    renderEditor()
    const editor = await getEditor()
    expect(TEXT_COLORS.map(c => c.name)).toEqual(['brand', 'gray', 'red', 'orange', 'green', 'blueLight'])

    const menu = await openMenu(L.textColor)
    expect(within(menu).getAllByRole('menuitem').map(item => item.textContent?.trim())).toEqual([L.colorDefault, ...TEXT_COLORS.map(c => COLOR_LABEL[c.name])])
    fireEvent.keyDown(menu, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())

    for (const { name, value, rgb } of TEXT_COLORS) {
      act(() => { editor.commands.setContent('<p>word</p>'); editor.commands.setTextSelection({ from: 1, to: 5 }) })
      fireEvent.click(within(await openMenu(L.textColor)).getByRole('menuitem', { name: COLOR_LABEL[name] }))
      // the mark holds the theme's hex; the HTML holds it as the CSSOM writes it (rgb), and the site keeps exactly that colour
      await waitFor(() => expect(latest, name).toBe(`<p><span style="color: ${rgb};">word</span></p>`))
      expect(editor.getAttributes('textStyle').color).toBe(value)
      expect(sanitizeCmsHtml(latest)).toBe(`<p><span style="color:${rgb}">word</span></p>`)
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
      expect(within(toolbar()).getByRole('button', { name: L.textColor }).hasAttribute('data-active')).toBe(true)
    }

    fireEvent.click(within(await openMenu(L.textColor)).getByRole('menuitem', { name: L.colorDefault }))
    await waitFor(() => expect(latest).toBe('<p>word</p>'))
  })

  it('"Text" mode shows the body\'s HTML and inserts each quicktag\'s markup; back in "Visual", del is strike and ins is underline', async () => {
    renderEditor({ initial: '<p>word</p>' })
    await getEditor()
    fireEvent.click(screen.getByRole('tab', { name: L.modeText }))
    const area = screen.getByRole('textbox', { name: 'Body' }) as HTMLTextAreaElement
    expect(area.tagName).toBe('TEXTAREA')
    expect(area.value).toBe('<p>word</p>')

    const quicktags = within(screen.getByRole('toolbar', { name: L.modeText }))
    expect(quicktags.getAllByRole('button').map(b => b.textContent?.trim())).toEqual(['b', 'i', 'link', 'b-quote', 'del', 'ins', 'img', 'ul', 'ol', 'li', 'code', L.closeTags])

    const wrap = (tag: string, expected: string) => {
      fireEvent.change(area, { target: { value: 'word' } })
      area.setSelectionRange(0, 4)
      fireEvent.click(quicktags.getByRole('button', { name: tag }))
      expect(area.value, tag).toBe(expected)
    }
    wrap('b', '<strong>word</strong>')
    wrap('i', '<em>word</em>')
    wrap('link', '<a href="https://">word</a>')
    wrap('b-quote', '<blockquote>word</blockquote>')
    wrap('del', '<del>word</del>')
    wrap('ins', '<ins>word</ins>')
    wrap('ul', '<ul>word</ul>')
    wrap('ol', '<ol>word</ol>')
    wrap('li', '<li>word</li>')
    wrap('code', '<code>word</code>')

    // without a selection a tag opens, the button closes it, and "close tags" closes every open tag in order
    fireEvent.change(area, { target: { value: '' } })
    area.setSelectionRange(0, 0)
    fireEvent.click(quicktags.getByRole('button', { name: 'b' }))
    expect(area.value).toBe('<strong>')
    expect(quicktags.getByRole('button', { name: '/b' })).toBeTruthy()
    fireEvent.click(quicktags.getByRole('button', { name: 'i' }))
    fireEvent.click(quicktags.getByRole('button', { name: L.closeTags }))
    expect(area.value).toBe('<strong><em></em></strong>')
    expect(quicktags.getByRole('button', { name: 'b' })).toBeTruthy()

    fireEvent.change(area, { target: { value: '<p><del>old</del> <ins>new</ins></p>' } })
    await waitFor(() => expect(latest).toBe('<p><s>old</s> <u>new</u></p>'))
    fireEvent.click(screen.getByRole('tab', { name: L.modeVisual }))
    const editor = await getEditor()
    expect(editor.getHTML()).toBe('<p><s>old</s> <u>new</u></p>')
    expect(screen.queryByRole('toolbar', { name: L.modeText })).toBeNull()
  })

  it('"img" in Text mode uploads through the image dialog and inserts the image markup', async () => {
    const upload = vi.fn(async () => CLD)
    renderEditor({ onUpload: upload })
    await getEditor()
    fireEvent.click(screen.getByRole('tab', { name: L.modeText }))
    fireEvent.click(within(screen.getByRole('toolbar', { name: L.modeText })).getByRole('button', { name: 'img' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.change(dialog.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })] } })
    fireEvent.change(within(dialog).getByLabelText(L.imageAltLabel), { target: { value: 'Fasada "e re"' } })
    fireEvent.click(within(dialog).getByRole('button', { name: L.imageUpload }))

    await waitFor(() => expect(upload).toHaveBeenCalled())
    await waitFor(() => expect((screen.getByRole('textbox', { name: 'Body' }) as HTMLTextAreaElement).value).toBe(`<img src="${CLD}" alt="Fasada &quot;e re&quot;">`))
    await waitFor(() => expect(latest).toContain(`<img src="${CLD}"`))
  })

  it('"Add media" opens the image dialog and inserts the image in Visual mode', async () => {
    renderEditor()
    await getEditor()
    fireEvent.click(screen.getByRole('button', { name: L.addMedia }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(dialog.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })] } })
    fireEvent.change(within(dialog).getByLabelText(L.imageAltLabel), { target: { value: 'Fasada' } })
    fireEvent.click(within(dialog).getByRole('button', { name: L.imageUpload }))
    await waitFor(() => expect(latest).toContain(`<img src="${CLD}" alt="Fasada">`))
  })

  it('full screen moves the editor into a full-screen dialog with the same document, and back', async () => {
    renderEditor({ initial: '<p>keep me</p>' })
    await getEditor()
    fireEvent.click(within(toolbar()).getByRole('button', { name: L.fullscreen }))

    const dialog = await screen.findByRole('dialog')
    const dialogToolbar = within(dialog).getByRole('toolbar', { name: L.toolbar })
    await waitFor(() => expect(within(dialog).getByText('keep me')).toBeTruthy())
    const inDialog = within(dialogToolbar).getByRole('button', { name: L.fullscreen })
    expect(inDialog.hasAttribute('data-active')).toBe(true)

    fireEvent.click(inDialog)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('keep me')).toBeTruthy())
    expect(within(toolbar()).getByRole('button', { name: L.fullscreen }).hasAttribute('data-active')).toBe(false)
  })
})