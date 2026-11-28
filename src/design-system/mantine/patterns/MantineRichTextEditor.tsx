'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Bold,
  ChevronDown,
  Expand,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  PanelTopDashed,
  Quote,
  Redo2,
  Rows2,
  Rows3,
  Shrink,
  Strikethrough,
  Table as TableIcon,
  TableProperties,
  Trash2,
  Underline,
  Undo2,
  Unlink,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ActionIcon, Button, ColorSwatch, FileInput, Flex, Group, Input, Modal, Stack, Tabs, Textarea, TextInput, useMantineTheme } from '@mantine/core'
import { RichTextEditor } from '@mantine/tiptap'
import { useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { Image } from '@tiptap/extension-image'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { Columns, Column } from '../richtext/columnsExtension'
import { TEXT_COLORS, type TextColorName } from '../richtext/textColors'
import { MantineModal } from './MantineModal'
import { MantineDialogSections, MantineDialogSection } from './MantineDialogSections'
import { MantineDialogFooter } from './MantineDialogFooter'
import { MantineDropdownMenu, type DropdownMenuItemDef } from './MantineDropdownMenu'

/** Every user-facing string of the editor. There is no English default: the caller supplies all of them. */
export interface RichTextEditorLabels {
  toolbar: string
  toolbarToggle: string
  fullscreen: string
  /** the name of the full-screen dialog's close control */
  fullscreenClose: string
  addMedia: string
  modeVisual: string
  modeText: string
  bold: string
  italic: string
  underline: string
  strike: string
  bulletList: string
  orderedList: string
  blockquote: string
  hr: string
  link: string
  unlink: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  undo: string
  redo: string
  /** the tooltip and sheet title of the "Paragraph" select */
  blockFormat: string
  paragraph: string
  h2: string
  h3: string
  h4: string
  h5: string
  h6: string
  preformatted: string
  textColor: string
  colorDefault: string
  colorBrand: string
  colorGray: string
  colorRed: string
  colorOrange: string
  colorGreen: string
  colorBlueLight: string
  tableMenu: string
  linkInputLabel: string
  linkInputPlaceholder: string
  linkExternal: string
  linkInternal: string
  linkSave: string
  tableInsert: string
  tableAddRow: string
  tableDeleteRow: string
  tableAddColumn: string
  tableDeleteColumn: string
  tableToggleHeader: string
  tableDelete: string
  imageInsert: string
  imageDialogTitle: string
  imageFileLabel: string
  imageFilePlaceholder: string
  imageAltLabel: string
  imageHint: string
  imageUpload: string
  imageCancel: string
  imageErrorType: string
  imageErrorSize: string
  listItem: string
  code: string
  closeTags: string
}

export interface MantineRichTextEditorProps {
  /** The body as HTML. `''` is an empty body. */
  value: string
  /** Called with the new HTML; an empty document is `''`, never `<p></p>`. */
  onChange: (html: string) => void
  label: string
  error?: string
  /** Uploads a validated image and resolves to its URL. The pattern does no networking itself. */
  onUploadImage: (file: File) => Promise<string>
  /** An upload is in flight: the dialog's action is disabled and shows a loader. */
  uploading?: boolean
  labels: RichTextEditorLabels
  /**
   * Called with `true` when full screen or the "Add media" dialog opens and `false` when neither is open (one call per change). Mantine closes every opened
   * modal on one Escape, so a dialog around the editor ignores its own close while this is `true` (Task 990 Review 2 F6).
   */
  onDialogChange?: (open: boolean) => void
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const IMAGE_MAX_BYTES = 5 * 1024 * 1024

// Heading levels stay at the Tiptap default (h1–h6) so a stored body keeps every level; the "Paragraph" select offers h2–h6 (the page title is the h1,
// `CmsPageView.tsx`). Code and rules stay enabled for the same reason. The columns block keeps its extension so a stored page renders (Task 990: the tool left
// the toolbar). Task 990: the text colour is a `textStyle` mark with a `color` from the theme palette (`textColors.ts`).
export const RICH_TEXT_EXTENSIONS = [
  StarterKit.configure({ link: false }),
  Link.configure({ openOnClick: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Image.configure({ allowBase64: false }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
  Columns,
  Column,
  TextStyle,
  Color,
]

/**
 * The serialised body: `''` for an empty document, never `<p></p>`. An image, a table or a columns block
 * is content even while it holds no text yet (the server's own empty-body guard decides what may publish).
 */
function serialise(editor: { isEmpty: boolean; getHTML: () => string }): string {
  const html = editor.getHTML()
  return editor.isEmpty && !/<(img|table|div)\b/i.test(html) ? '' : html
}

/**
 * Task 990: the "Text" mode's `ins` is underline in the editor (the WordPress quicktag; `del` is already a strike of the schema). The HTML is parsed into an
 * inert document (no script runs, nothing loads) and each `ins` element becomes a `u` element with the same children; the editor schema then parses the result.
 */
function insAsUnderline(html: string): string {
  if (!/<ins\b/i.test(html)) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const ins of Array.from(doc.body.querySelectorAll('ins'))) {
    const u = doc.createElement('u')
    u.append(...Array.from(ins.childNodes))
    ins.replaceWith(u)
  }
  return doc.body.innerHTML
}

/** An attribute value written into the "Text" mode's HTML: `&`, `"`, `<` and `>` as entities, so the value stays one attribute. */
function attributeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

type Mode = 'visual' | 'text'
type Quicktag = { id: string; title: string; open: string; close: string }

/**
 * Canonical rich-text editor (Task 868, D868-2): Mantine's own `RichTextEditor` on Tiptap, inside
 * `Input.Wrapper` (label + error), controlled by an HTML string.
 *
 * Task 990 (O990-1, owner 2026-11-19; replaces D868-6/D868-7): the WordPress classic editor at every width. Above the toolbar "Add media" (the image dialog:
 * file + required alt text, handed to `onUploadImage`; the editor itself never touches the network) and the tabs "Visual" and "Text". The toolbar has two
 * rows of icon tools, each named by its tooltip and accessible name and showing its active state; the rows wrap below 640px, where every control is the
 * theme's touch target. Row 1: bold, italic, strikethrough, lists, quote, horizontal line, alignment, link, remove link, the table menu, the row toggle and full
 * screen. Row 2 (the toggle shows or hides it): the "Paragraph" select (paragraph, h2–h6, preformatted), underline, justify, text colour (the theme palette
 * only), undo and redo. The menus are `MantineDropdownMenu` (anchored from 640px, a bottom sheet below). "Text" mode is the body's HTML with the WordPress
 * quicktags; what is typed there is parsed by the editor schema at once, so the value is always the editor's HTML. Full screen shows the same editor in a
 * full-screen `Modal`. The content area is Mantine's Typography, so `typography-chrome.css` gives it the same responsive scale as the public page.
 */
export function MantineRichTextEditor({
  value,
  onChange,
  label,
  error,
  onUploadImage,
  uploading = false,
  labels,
  onDialogChange,
}: MantineRichTextEditorProps) {
  const theme = useMantineTheme()
  const fieldId = useId()
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: RICH_TEXT_EXTENSIONS,
    content: value,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    // The editable area is not a form control, so the label names it through `aria-labelledby`.
    editorProps: { attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': `${fieldId}-label` } },
    onUpdate: ({ editor: current }) => onChangeRef.current(serialise(current)),
  })

  // An outside change of `value` (not the editor's own echo) replaces the document without re-emitting.
  useEffect(() => {
    if (!editor) return
    if (serialise(editor) !== value) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const [imageOpen, setImageOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('visual')
  const [text, setText] = useState('')
  const [openTags, setOpenTags] = useState<string[]>([])
  const [rowTwo, setRowTwo] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const wasFullscreen = useRef(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Leaving full screen puts the editor back in place: the focus returns to its full-screen tool, which the dialog replaced while it was open.
  useEffect(() => {
    if (wasFullscreen.current && !fullscreen) {
      const tools = wrapperRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []
      Array.from(tools).find(button => button.getAttribute('aria-label') === labels.fullscreen)?.focus({ preventScroll: true })
    }
    wasFullscreen.current = fullscreen
  }, [fullscreen, labels.fullscreen])

  // F6: the caller learns when one of the editor's own dialogs opens or closes, once per change.
  const dialogOpen = fullscreen || imageOpen
  const reportedDialogOpen = useRef(false)
  useEffect(() => {
    if (reportedDialogOpen.current === dialogOpen) return
    reportedDialogOpen.current = dialogOpen
    onDialogChange?.(dialogOpen)
  }, [dialogOpen, onDialogChange])

  const pendingCaret = useRef<number | null>(null)

  // After a quicktag the caret stands after the inserted markup.
  useEffect(() => {
    const caret = pendingCaret.current
    if (caret === null || !textRef.current) return
    pendingCaret.current = null
    textRef.current.setSelectionRange(caret, caret)
  }, [text])

  function closeImageDialog() {
    setImageOpen(false)
    setFile(null)
    setAlt('')
    setFileError(null)
  }

  function handleFile(next: File | null) {
    setFile(next)
    if (!next) {
      setFileError(null)
    } else if (!IMAGE_MIME_TYPES.includes(next.type)) {
      setFileError(labels.imageErrorType)
    } else if (next.size > IMAGE_MAX_BYTES) {
      setFileError(labels.imageErrorSize)
    } else {
      setFileError(null)
    }
  }

  /** "Text" mode: the new HTML is kept as typed and parsed by the editor schema, whose HTML is the value */
  function changeText(next: string) {
    setText(next)
    if (!editor) return
    editor.commands.setContent(insAsUnderline(next), { emitUpdate: false })
    onChangeRef.current(serialise(editor))
  }

  /** "Text" mode: replaces the selection of the HTML field with `insert`, the caret after it */
  function insertIntoText(build: (selected: string) => string) {
    const area = textRef.current
    const start = area?.selectionStart ?? text.length
    const end = area?.selectionEnd ?? text.length
    const current = area?.value ?? text
    const insert = build(current.slice(start, end))
    pendingCaret.current = start + insert.length
    changeText(current.slice(0, start) + insert + current.slice(end))
  }

  async function handleUpload() {
    if (!editor || !file || fileError || !alt.trim()) return
    try {
      const src = await onUploadImage(file)
      if (mode === 'text') {
        insertIntoText(() => `<img src="${attributeText(src)}" alt="${attributeText(alt.trim())}">`)
      } else {
        editor.chain().focus().setImage({ src, alt: alt.trim() }).run()
      }
      closeImageDialog()
    } catch {
      // The caller reports the failure (its toast); the dialog stays open and the document is untouched.
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    if (next === 'text') {
      setText(editor ? serialise(editor) : value)
      setOpenTags([])
    }
    setMode(next)
  }

  // 44px below 640px (clause 11), then Mantine's own 26px control size from `sm` through the theme key (D868-5).
  const controlSize = { base: theme.other.touchTarget, sm: theme.other.boxSize.richTextControlSize }
  // The `subtle` variant fixes the control height at 2rem, so `h` carries the size too (`miw`/`mih` alone left 32px).
  const touch = {
    miw: controlSize,
    mih: controlSize,
    h: controlSize,
  }
  const icon = theme.other.iconSize.standard
  const chevron = theme.other.iconSize.badge
  const canEdit = editor !== null

  const chain = () => editor?.chain().focus()
  const on = (name: string, attributes?: Record<string, unknown>) => editor?.isActive(name, attributes) ?? false
  const aligned = (textAlign: string) => editor?.isActive({ textAlign }) ?? false

  /** one icon tool: its name is the tooltip and the accessible name; `active` shows its state */
  const tool = (name: string, Icon: LucideIcon, active: boolean, disabled: boolean, run: () => void) => (
    <RichTextEditor.Control aria-label={name} title={name} active={active} disabled={disabled} onClick={run} {...touch}>
      <Icon size={icon} />
    </RichTextEditor.Control>
  )

  /** a tool that opens a menu (`MantineDropdownMenu`: anchored from 640px, a bottom sheet below) */
  const menuTool = (name: string, trigger: ReactNode, items: DropdownMenuItemDef[], active: boolean, iconOnly = true, tooltip = name) => (
    <MantineDropdownMenu
      title={tooltip}
      items={items}
      disabled={!canEdit}
      iconOnlyTrigger={iconOnly}
      trigger={
        <RichTextEditor.Control aria-label={iconOnly ? name : undefined} title={tooltip} active={active} disabled={!canEdit} px={iconOnly ? undefined : 'xs'} {...touch}>
          {trigger}
          <ChevronDown size={chevron} />
        </RichTextEditor.Control>
      }
    />
  )

  const tableItems: DropdownMenuItemDef[] = [
    { label: labels.tableInsert, icon: <TableIcon size={icon} />, disabled: !canEdit, onClick: () => chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: labels.tableAddRow, icon: <BetweenHorizontalEnd size={icon} />, disabled: !editor?.can().addRowAfter(), onClick: () => chain()?.addRowAfter().run() },
    { label: labels.tableDeleteRow, icon: <Rows3 size={icon} />, disabled: !editor?.can().deleteRow(), onClick: () => chain()?.deleteRow().run() },
    { label: labels.tableAddColumn, icon: <BetweenVerticalEnd size={icon} />, disabled: !editor?.can().addColumnAfter(), onClick: () => chain()?.addColumnAfter().run() },
    { label: labels.tableDeleteColumn, icon: <TableProperties size={icon} />, disabled: !editor?.can().deleteColumn(), onClick: () => chain()?.deleteColumn().run() },
    { label: labels.tableToggleHeader, icon: <PanelTopDashed size={icon} />, disabled: !editor?.can().toggleHeaderRow(), onClick: () => chain()?.toggleHeaderRow().run() },
    { label: labels.tableDelete, icon: <Trash2 size={icon} />, disabled: !editor?.can().deleteTable(), onClick: () => chain()?.deleteTable().run() },
  ]

  const headingLevels = [2, 3, 4, 5, 6] as const
  const headingLabel = { 2: labels.h2, 3: labels.h3, 4: labels.h4, 5: labels.h5, 6: labels.h6 }
  const blocks = [
    { label: labels.paragraph, active: on('paragraph'), run: () => chain()?.setParagraph().run() },
    ...headingLevels.map(level => ({ label: headingLabel[level], active: on('heading', { level }), run: () => chain()?.setHeading({ level }).run() })),
    { label: labels.preformatted, active: on('codeBlock'), run: () => chain()?.setCodeBlock().run() },
  ]
  const currentBlock = blocks.find(block => block.active) ?? blocks[0]
  const blockItems: DropdownMenuItemDef[] = blocks.map(block => ({ label: block.label, active: block.active, disabled: !canEdit, onClick: block.run }))

  const colorLabel: Record<TextColorName, string> = {
    brand: labels.colorBrand,
    gray: labels.colorGray,
    red: labels.colorRed,
    orange: labels.colorOrange,
    green: labels.colorGreen,
    blueLight: labels.colorBlueLight,
  }
  const currentColor = editor?.getAttributes('textStyle').color as string | undefined
  const colorItems: DropdownMenuItemDef[] = [
    { label: labels.colorDefault, icon: <Baseline size={icon} />, active: !currentColor, disabled: !canEdit, onClick: () => chain()?.unsetColor().run() },
    ...TEXT_COLORS.map(({ name, value: color, rgb }) => ({
      label: colorLabel[name],
      icon: <ColorSwatch color={color} size={icon} />,
      // a stored body holds the colour as the editor wrote it (rgb), a colour set now holds the theme's hex
      active: currentColor === color || currentColor === rgb,
      disabled: !canEdit,
      onClick: () => chain()?.setColor(color).run(),
    })),
  ]

  const quicktags: Quicktag[] = [
    { id: 'b', title: labels.bold, open: '<strong>', close: '</strong>' },
    { id: 'i', title: labels.italic, open: '<em>', close: '</em>' },
    { id: 'link', title: labels.link, open: '<a href="https://">', close: '</a>' },
    { id: 'b-quote', title: labels.blockquote, open: '<blockquote>', close: '</blockquote>' },
    { id: 'del', title: labels.strike, open: '<del>', close: '</del>' },
    { id: 'ins', title: labels.underline, open: '<ins>', close: '</ins>' },
    { id: 'img', title: labels.imageInsert, open: '', close: '' },
    { id: 'ul', title: labels.bulletList, open: '<ul>', close: '</ul>' },
    { id: 'ol', title: labels.orderedList, open: '<ol>', close: '</ol>' },
    { id: 'li', title: labels.listItem, open: '<li>', close: '</li>' },
    { id: 'code', title: labels.code, open: '<code>', close: '</code>' },
  ]

  /** a quicktag wraps the selection; without one it opens its tag, and pressed again (it reads "/b") closes it, as WordPress does */
  function applyQuicktag(tag: Quicktag, trigger: HTMLElement) {
    if (tag.id === 'img') {
      // a toolbar control takes no focus on a click; focused, it is where the image dialog returns the focus
      trigger.focus()
      setImageOpen(true)
      return
    }
    const area = textRef.current
    const selected = area ? area.selectionStart !== area.selectionEnd : false
    if (selected) {
      insertIntoText(inner => `${tag.open}${inner}${tag.close}`)
    } else if (openTags.includes(tag.id)) {
      insertIntoText(() => tag.close)
      setOpenTags(prev => prev.filter(id => id !== tag.id))
    } else {
      insertIntoText(() => tag.open)
      setOpenTags(prev => [...prev, tag.id])
    }
  }

  function closeAllTags() {
    const closes = [...openTags].reverse().map(id => quicktags.find(tag => tag.id === id)?.close ?? '').join('')
    if (closes) insertIntoText(() => closes)
    setOpenTags([])
  }

  const rootStyles = error ? { root: { borderColor: 'var(--mantine-color-error)' } } : {}
  const editorLabels = {
    linkControlLabel: labels.link,
    linkEditorInputLabel: labels.linkInputLabel,
    linkEditorInputPlaceholder: labels.linkInputPlaceholder,
    linkEditorExternalLink: labels.linkExternal,
    linkEditorInternalLink: labels.linkInternal,
    linkEditorSave: labels.linkSave,
  }

  const body = (
    <Tabs value={mode} onChange={next => { if (next) switchMode(next as Mode) }}>
      <Group justify="space-between" gap="xs" mb="xs">
        <Button type="button" variant="default" leftSection={<ImagePlus size={icon} />} disabled={!canEdit} onClick={() => setImageOpen(true)}>
          {labels.addMedia}
        </Button>
        <Tabs.List>
          <Tabs.Tab value="visual">{labels.modeVisual}</Tabs.Tab>
          <Tabs.Tab value="text">{labels.modeText}</Tabs.Tab>
        </Tabs.List>
      </Group>

      <Tabs.Panel value="visual">
        <RichTextEditor
          editor={editor}
          variant="subtle"
          labels={editorLabels}
          styles={{
            ...rootStyles,
            // the link editor's external-link toggle is a 44px touch target (Task 923 R33, Story 243)
            linkEditorExternalControl: { minWidth: theme.other.touchTarget, minHeight: theme.other.touchTarget },
            // the field's section is as wide as the toggle (an inherited custom property read by the link editor's TextInput)
            linkEditor: { '--input-right-section-width': theme.other.touchTarget },
          }}
        >
          <RichTextEditor.Toolbar role="toolbar" aria-label={labels.toolbar}>
            <Stack gap={0} w="100%">
              {/* Row 1. The link control never takes focus on press (tiptap keeps the editor selection), so its popover had only `body` to return the focus
                  to: the pressed link control takes it in the capture phase (Task 923 R33, Story 243). On the row, so no element is added around the controls. */}
              <Flex
                wrap="wrap"
                columnGap="sm"
                onClickCapture={(event: React.MouseEvent<HTMLElement>) =>
                  (event.target as HTMLElement).closest<HTMLElement>(`button[aria-label="${labels.link}"]`)?.focus({ preventScroll: true })
                }
              >
                <RichTextEditor.ControlsGroup>
                  {tool(labels.bold, Bold, on('bold'), !canEdit, () => chain()?.toggleBold().run())}
                  {tool(labels.italic, Italic, on('italic'), !canEdit, () => chain()?.toggleItalic().run())}
                  {tool(labels.strike, Strikethrough, on('strike'), !canEdit, () => chain()?.toggleStrike().run())}
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  {tool(labels.bulletList, List, on('bulletList'), !canEdit, () => chain()?.toggleBulletList().run())}
                  {tool(labels.orderedList, ListOrdered, on('orderedList'), !canEdit, () => chain()?.toggleOrderedList().run())}
                  {tool(labels.blockquote, Quote, on('blockquote'), !canEdit, () => chain()?.toggleBlockquote().run())}
                  {tool(labels.hr, Minus, false, !canEdit, () => chain()?.setHorizontalRule().run())}
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  {tool(labels.alignLeft, AlignLeft, aligned('left'), !canEdit, () => chain()?.setTextAlign('left').run())}
                  {tool(labels.alignCenter, AlignCenter, aligned('center'), !canEdit, () => chain()?.setTextAlign('center').run())}
                  {tool(labels.alignRight, AlignRight, aligned('right'), !canEdit, () => chain()?.setTextAlign('right').run())}
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Link
                    {...touch}
                    // the link popover is never wider than the viewport less the page gutter (the editor popover is not `MantinePopover`)
                    popoverProps={{ trapFocus: true, returnFocus: true, styles: { dropdown: { maxWidth: 'calc(100vw - 2 * var(--mantine-spacing-md))' } } }}
                  />
                  {tool(labels.unlink, Unlink, false, !on('link'), () => chain()?.unsetLink().run())}
                  {menuTool(labels.tableMenu, <TableIcon size={icon} />, tableItems, on('table'))}
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  {tool(labels.toolbarToggle, Rows2, rowTwo, false, () => setRowTwo(shown => !shown))}
                  {tool(labels.fullscreen, fullscreen ? Shrink : Expand, fullscreen, false, () => setFullscreen(full => !full))}
                </RichTextEditor.ControlsGroup>
              </Flex>

              {rowTwo && (
                <Flex wrap="wrap" columnGap="sm">
                  <RichTextEditor.ControlsGroup>
                    {menuTool(currentBlock.label, currentBlock.label, blockItems, false, false, labels.blockFormat)}
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    {tool(labels.underline, Underline, on('underline'), !canEdit, () => chain()?.toggleUnderline().run())}
                    {tool(labels.alignJustify, AlignJustify, aligned('justify'), !canEdit, () => chain()?.setTextAlign('justify').run())}
                    {menuTool(labels.textColor, <Baseline size={icon} />, colorItems, !!currentColor)}
                  </RichTextEditor.ControlsGroup>
                  <RichTextEditor.ControlsGroup>
                    {tool(labels.undo, Undo2, false, !editor?.can().undo(), () => chain()?.undo().run())}
                    {tool(labels.redo, Redo2, false, !editor?.can().redo(), () => chain()?.redo().run())}
                  </RichTextEditor.ControlsGroup>
                </Flex>
              )}
            </Stack>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content mih={theme.other.boxSize.richTextContentMinHeight} />
        </RichTextEditor>
      </Tabs.Panel>

      <Tabs.Panel value="text">
        {/* the same box as the Visual mode: the quicktags in its toolbar, the HTML in a monospace field */}
        <RichTextEditor editor={editor} variant="subtle" labels={editorLabels} styles={rootStyles}>
          <RichTextEditor.Toolbar role="toolbar" aria-label={labels.modeText}>
            <Flex wrap="wrap" columnGap="sm">
              {quicktags.map(tag => (
                <RichTextEditor.Control key={tag.id} title={tag.title} active={openTags.includes(tag.id)} disabled={!canEdit} px="xs" onClick={event => applyQuicktag(tag, event.currentTarget)} {...touch}>
                  {openTags.includes(tag.id) ? `/${tag.id}` : tag.id}
                </RichTextEditor.Control>
              ))}
              <RichTextEditor.Control title={labels.closeTags} disabled={!canEdit || openTags.length === 0} px="xs" onClick={closeAllTags} {...touch}>
                {labels.closeTags}
              </RichTextEditor.Control>
            </Flex>
          </RichTextEditor.Toolbar>
          <Textarea
            ref={textRef}
            variant="unstyled"
            px="md"
            py="xs"
            autosize
            minRows={10}
            value={text}
            aria-labelledby={`${fieldId}-label`}
            aria-invalid={!!error || undefined}
            styles={{ input: { fontFamily: theme.fontFamilyMonospace } }}
            onChange={event => changeText(event.currentTarget.value)}
          />
        </RichTextEditor>
      </Tabs.Panel>
    </Tabs>
  )

  return (
    <Input.Wrapper ref={wrapperRef} id={fieldId} labelElement="div" label={label} error={error}>
      {!fullscreen && body}

      {/* Full screen: the same editor (its document stays) in a full-screen dialog above the page; the toolbar tool or the close button returns it.
          The focus goes back to the full-screen tool (the effect above): the element that held it inside the dialog is gone. */}
      <Modal.Root opened={fullscreen} onClose={() => setFullscreen(false)} fullScreen returnFocus={false}>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>{label}</Modal.Title>
            {/* the canonical dialog close (`MantineModal.tsx`): 44px round light gray */}
            <ActionIcon variant="light" color="gray" radius="pill" size="xl" aria-label={labels.fullscreenClose} onClick={() => setFullscreen(false)}>
              <X size={theme.other.iconSize.standard} />
            </ActionIcon>
          </Modal.Header>
          <Modal.Body>{fullscreen && body}</Modal.Body>
        </Modal.Content>
      </Modal.Root>

      <MantineModal
        structured
        opened={imageOpen}
        onClose={closeImageDialog}
        title={labels.imageDialogTitle}
        footer={
          <MantineDialogFooter
            secondary={<Button type="button" variant="default" onClick={closeImageDialog}>{labels.imageCancel}</Button>}
            primary={
              <Button
                type="button"
                loading={uploading}
                disabled={!file || !!fileError || !alt.trim()}
                onClick={handleUpload}
              >
                {labels.imageUpload}
              </Button>
            }
          />
        }
      >
        <MantineDialogSections>
          <MantineDialogSection description={labels.imageHint}>
            <FileInput
              label={labels.imageFileLabel}
              placeholder={labels.imageFilePlaceholder}
              accept={IMAGE_MIME_TYPES.join(',')}
              value={file}
              onChange={handleFile}
              error={fileError ?? undefined}
              clearable
            />
            <TextInput
              label={labels.imageAltLabel}
              value={alt}
              onChange={e => setAlt(e.target.value)}
            />
          </MantineDialogSection>
        </MantineDialogSections>
      </MantineModal>
    </Input.Wrapper>
  )
}
