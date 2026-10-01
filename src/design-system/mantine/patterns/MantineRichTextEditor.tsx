'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Bold,
  ChevronDown,
  Columns2,
  Columns3,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  PanelTopDashed,
  Pilcrow,
  Plus,
  Quote,
  RemoveFormatting,
  Redo2,
  Rows3,
  SquareX,
  Strikethrough,
  Table as TableIcon,
  TableProperties,
  Trash2,
  Underline,
  Undo2,
  Unlink,
  type LucideIcon,
} from 'lucide-react'
import { Button, FileInput, Flex, Input, Stack, Text, TextInput, useMantineTheme } from '@mantine/core'
import { RichTextEditor } from '@mantine/tiptap'
import { useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { Image } from '@tiptap/extension-image'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Columns, Column } from '../richtext/columnsExtension'
import { MantineModal } from './MantineModal'
import { MantineDropdownMenu, type DropdownMenuItemDef } from './MantineDropdownMenu'

/** Every user-facing string of the editor. There is no English default: the caller supplies all of them. */
export interface RichTextEditorLabels {
  toolbar: string
  menuFormat: string
  menuParagraph: string
  menuInsert: string
  menuHistory: string
  bold: string
  italic: string
  underline: string
  strike: string
  clearFormatting: string
  h2: string
  h3: string
  h4: string
  bulletList: string
  orderedList: string
  blockquote: string
  link: string
  unlink: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  undo: string
  redo: string
  linkInputLabel: string
  linkInputPlaceholder: string
  linkExternal: string
  linkInternal: string
  linkSave: string
  columns2: string
  columns3: string
  columnsRemove: string
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
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const IMAGE_MAX_BYTES = 5 * 1024 * 1024

// Heading levels stay at the Tiptap default so a stored body that holds an h1, h5 or h6 is not flattened
// into a paragraph; the toolbar offers h2–h4 only (the page title is the h1). Code and rules stay enabled
// for the same reason.
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
 * Canonical rich-text editor (Task 868, D868-2): Mantine's own `RichTextEditor` on Tiptap, inside
 * `Input.Wrapper` (label + error), controlled by an HTML string.
 *
 * Toolbar (D868-3, D868-6/7): five controls in one row at every width — format, paragraph and insert menus,
 * the link control and a history menu (`MantineDropdownMenu`: anchored from 640px, a bottom sheet below). They hold text
 * formatting, headings h2–h4, lists, quote, alignment, layout columns (`columnsExtension`), tables, an image item and
 * undo/redo. The image control opens a
 * `MantineModal` (file + required alt text) and hands the file to `onUploadImage`; the editor itself never
 * touches the network. Every control is at least the theme's touch target below 640px. The content area
 * is Mantine's Typography, so `typography-chrome.css` gives it the same responsive scale as the public
 * page.
 */
export function MantineRichTextEditor({
  value,
  onChange,
  label,
  error,
  onUploadImage,
  uploading = false,
  labels,
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

  async function handleUpload() {
    if (!editor || !file || fileError || !alt.trim()) return
    try {
      const src = await onUploadImage(file)
      editor.chain().focus().setImage({ src, alt: alt.trim() }).run()
      closeImageDialog()
    } catch {
      // The caller reports the failure (its toast); the dialog stays open and the document is untouched.
    }
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

  // Task 868 R28 (D868-6, D868-7): the toolbar is five controls in one `ControlsGroup` — three command menus
  // (`MantineDropdownMenu`: anchored from 640px, bottom sheet below), the link control and a history menu.
  // Every item runs the command the one-button-per-function toolbar ran, and keeps its `disabled` condition.
  const chain = () => editor?.chain().focus()
  const on = (name: string, attributes?: Record<string, unknown>) => editor?.isActive(name, attributes) ?? false
  const aligned = (textAlign: string) => editor?.isActive({ textAlign }) ?? false

  const formatItems: DropdownMenuItemDef[] = [
    { label: labels.bold, icon: <Bold size={icon} />, active: on('bold'), disabled: !canEdit, onClick: () => chain()?.toggleBold().run() },
    { label: labels.italic, icon: <Italic size={icon} />, active: on('italic'), disabled: !canEdit, onClick: () => chain()?.toggleItalic().run() },
    { label: labels.underline, icon: <Underline size={icon} />, active: on('underline'), disabled: !canEdit, onClick: () => chain()?.toggleUnderline().run() },
    { label: labels.strike, icon: <Strikethrough size={icon} />, active: on('strike'), disabled: !canEdit, onClick: () => chain()?.toggleStrike().run() },
    { label: labels.clearFormatting, icon: <RemoveFormatting size={icon} />, disabled: !canEdit, onClick: () => chain()?.unsetAllMarks().run() },
    { label: labels.unlink, icon: <Unlink size={icon} />, separator: true, disabled: !on('link'), onClick: () => chain()?.unsetLink().run() },
  ]

  const paragraphItems: DropdownMenuItemDef[] = [
    { label: labels.h2, icon: <Heading2 size={icon} />, active: on('heading', { level: 2 }), disabled: !canEdit, onClick: () => chain()?.toggleHeading({ level: 2 }).run() },
    { label: labels.h3, icon: <Heading3 size={icon} />, active: on('heading', { level: 3 }), disabled: !canEdit, onClick: () => chain()?.toggleHeading({ level: 3 }).run() },
    { label: labels.h4, icon: <Heading4 size={icon} />, active: on('heading', { level: 4 }), disabled: !canEdit, onClick: () => chain()?.toggleHeading({ level: 4 }).run() },
    { label: labels.bulletList, icon: <List size={icon} />, separator: true, active: on('bulletList'), disabled: !canEdit, onClick: () => chain()?.toggleBulletList().run() },
    { label: labels.orderedList, icon: <ListOrdered size={icon} />, active: on('orderedList'), disabled: !canEdit, onClick: () => chain()?.toggleOrderedList().run() },
    { label: labels.blockquote, icon: <Quote size={icon} />, active: on('blockquote'), disabled: !canEdit, onClick: () => chain()?.toggleBlockquote().run() },
    { label: labels.alignLeft, icon: <AlignLeft size={icon} />, separator: true, active: aligned('left'), disabled: !canEdit, onClick: () => chain()?.setTextAlign('left').run() },
    { label: labels.alignCenter, icon: <AlignCenter size={icon} />, active: aligned('center'), disabled: !canEdit, onClick: () => chain()?.setTextAlign('center').run() },
    { label: labels.alignRight, icon: <AlignRight size={icon} />, active: aligned('right'), disabled: !canEdit, onClick: () => chain()?.setTextAlign('right').run() },
    { label: labels.alignJustify, icon: <AlignJustify size={icon} />, active: aligned('justify'), disabled: !canEdit, onClick: () => chain()?.setTextAlign('justify').run() },
  ]

  const insertItems: DropdownMenuItemDef[] = [
    { label: labels.columns2, icon: <Columns2 size={icon} />, disabled: !canEdit, onClick: () => chain()?.insertColumns(2).run() },
    { label: labels.columns3, icon: <Columns3 size={icon} />, disabled: !canEdit, onClick: () => chain()?.insertColumns(3).run() },
    { label: labels.columnsRemove, icon: <SquareX size={icon} />, disabled: !on('columns') && !on('column'), onClick: () => chain()?.removeColumns().run() },
    { label: labels.tableInsert, icon: <TableIcon size={icon} />, separator: true, disabled: !canEdit, onClick: () => chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: labels.tableAddRow, icon: <BetweenHorizontalEnd size={icon} />, disabled: !editor?.can().addRowAfter(), onClick: () => chain()?.addRowAfter().run() },
    { label: labels.tableDeleteRow, icon: <Rows3 size={icon} />, disabled: !editor?.can().deleteRow(), onClick: () => chain()?.deleteRow().run() },
    { label: labels.tableAddColumn, icon: <BetweenVerticalEnd size={icon} />, disabled: !editor?.can().addColumnAfter(), onClick: () => chain()?.addColumnAfter().run() },
    { label: labels.tableDeleteColumn, icon: <TableProperties size={icon} />, disabled: !editor?.can().deleteColumn(), onClick: () => chain()?.deleteColumn().run() },
    { label: labels.tableToggleHeader, icon: <PanelTopDashed size={icon} />, disabled: !editor?.can().toggleHeaderRow(), onClick: () => chain()?.toggleHeaderRow().run() },
    { label: labels.tableDelete, icon: <Trash2 size={icon} />, disabled: !editor?.can().deleteTable(), onClick: () => chain()?.deleteTable().run() },
    { label: labels.imageInsert, icon: <ImagePlus size={icon} />, separator: true, disabled: !canEdit, onClick: () => setImageOpen(true) },
  ]

  const historyItems: DropdownMenuItemDef[] = [
    { label: labels.undo, icon: <Undo2 size={icon} />, disabled: !editor?.can().undo(), onClick: () => chain()?.undo().run() },
    { label: labels.redo, icon: <Redo2 size={icon} />, disabled: !editor?.can().redo(), onClick: () => chain()?.redo().run() },
  ]

  const menu = (menuLabel: string, TriggerIcon: LucideIcon, items: DropdownMenuItemDef[]) => (
    <MantineDropdownMenu
      title={menuLabel}
      items={items}
      disabled={!canEdit}
      iconOnlyTrigger
      trigger={
        <RichTextEditor.Control
          aria-label={menuLabel}
          title={menuLabel}
          active={items.some(item => item.active)}
          disabled={!canEdit}
          {...touch}
        >
          <TriggerIcon size={icon} />
          <ChevronDown size={chevron} />
        </RichTextEditor.Control>
      }
    />
  )

  return (
    <Input.Wrapper id={fieldId} labelElement="div" label={label} error={error}>
      <RichTextEditor
        editor={editor}
        variant="subtle"
        labels={{
          boldControlLabel: labels.bold,
          italicControlLabel: labels.italic,
          underlineControlLabel: labels.underline,
          strikeControlLabel: labels.strike,
          clearFormattingControlLabel: labels.clearFormatting,
          h2ControlLabel: labels.h2,
          h3ControlLabel: labels.h3,
          h4ControlLabel: labels.h4,
          bulletListControlLabel: labels.bulletList,
          orderedListControlLabel: labels.orderedList,
          blockquoteControlLabel: labels.blockquote,
          linkControlLabel: labels.link,
          unlinkControlLabel: labels.unlink,
          alignLeftControlLabel: labels.alignLeft,
          alignCenterControlLabel: labels.alignCenter,
          alignRightControlLabel: labels.alignRight,
          alignJustifyControlLabel: labels.alignJustify,
          undoControlLabel: labels.undo,
          redoControlLabel: labels.redo,
          linkEditorInputLabel: labels.linkInputLabel,
          linkEditorInputPlaceholder: labels.linkInputPlaceholder,
          linkEditorExternalLink: labels.linkExternal,
          linkEditorInternalLink: labels.linkInternal,
          linkEditorSave: labels.linkSave,
        }}
        styles={error ? { root: { borderColor: 'var(--mantine-color-error)' } } : undefined}
      >
        <RichTextEditor.Toolbar aria-label={labels.toolbar}>
          {/* One group: five 44px controls take 220px and fit the 278px inner width at 320 (`subtle` pads the toolbar 4px; D868-7). */}
          <RichTextEditor.ControlsGroup>
            {menu(labels.menuFormat, Bold, formatItems)}
            {menu(labels.menuParagraph, Pilcrow, paragraphItems)}
            {menu(labels.menuInsert, Plus, insertItems)}
            <RichTextEditor.Link {...touch} />
            {menu(labels.menuHistory, Undo2, historyItems)}
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content mih={theme.other.boxSize.richTextContentMinHeight} />
      </RichTextEditor>

      <MantineModal opened={imageOpen} onClose={closeImageDialog} title={labels.imageDialogTitle}>
        <Stack gap="md">
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
          <Text size="xs" c="dimmed">{labels.imageHint}</Text>
          <Flex
            direction={{ base: 'column-reverse', sm: 'row' }}
            gap="sm"
            justify={{ base: 'stretch', sm: 'flex-end' }}
          >
            <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} onClick={closeImageDialog}>
              {labels.imageCancel}
            </Button>
            <Button
              w={{ base: '100%', sm: 'auto' }}
              loading={uploading}
              disabled={!file || !!fileError || !alt.trim()}
              onClick={handleUpload}
            >
              {labels.imageUpload}
            </Button>
          </Flex>
        </Stack>
      </MantineModal>
    </Input.Wrapper>
  )
}
