'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Alert, Box, Button, ScrollArea, Stack, Switch, Tabs, TextInput, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'

// Not through the patterns barrel: Tiptap must reach `/admin/pages` only (Task 868 R22).
import { MantineRichTextEditor, type RichTextEditorLabels } from '@/design-system/mantine/patterns/MantineRichTextEditor'
import { PAGE_LOCALES, type PageLocale } from '@/components/admin/adminPagesContent'

export type PageLocaleFields = Record<PageLocale, { title: string; body: string }>

export interface PageEditorDialogViewProps {
  opened: boolean
  isEdit: boolean
  activeTab: PageLocale
  onTabChange: (locale: PageLocale) => void
  localeData: PageLocaleFields
  onFieldChange: (locale: PageLocale, field: 'title' | 'body', value: string) => void
  slug: string
  /** Already-translated slug error, or `null`. */
  slugError: string | null
  onSlugChange: (raw: string) => void
  /** The server refused to publish with an empty Albanian body (`sq_body_required`). */
  sqBodyError: boolean
  /** Task 990: Save was pressed without the Albanian title (`sq_title_required` on its field). */
  sqTitleError?: boolean
  published: boolean
  onPublishedChange: (published: boolean) => void
  /** Uploads an editor image and resolves to its URL (the container owns the request and its error toast). */
  onUploadImage: (file: File) => Promise<string>
  imageUploading: boolean
  saving: boolean
  onSubmit: () => void
  onClose: () => void
}

/** The editor's localized strings, from `admin.pages.editor.*` (every key exists in all four locales). */
export function useCmsEditorLabels(): RichTextEditorLabels {
  const t = useTranslations('admin.pages.editor')
  return {
    toolbar: t('toolbar'),
    toolbarToggle: t('toolbar_toggle'),
    fullscreen: t('fullscreen'),
    fullscreenClose: t('fullscreen_close'),
    addMedia: t('add_media'),
    modeVisual: t('mode_visual'),
    modeText: t('mode_text'),
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
    bulletList: t('bullet_list'),
    orderedList: t('ordered_list'),
    blockquote: t('blockquote'),
    hr: t('hr'),
    link: t('link'),
    unlink: t('unlink'),
    alignLeft: t('align_left'),
    alignCenter: t('align_center'),
    alignRight: t('align_right'),
    alignJustify: t('align_justify'),
    undo: t('undo'),
    redo: t('redo'),
    blockFormat: t('menu_format'),
    paragraph: t('menu_paragraph'),
    h2: t('h2'),
    h3: t('h3'),
    h4: t('h4'),
    h5: t('h5'),
    h6: t('h6'),
    preformatted: t('preformatted'),
    textColor: t('text_color'),
    colorDefault: t('color_default'),
    colorBrand: t('color_brand'),
    colorGray: t('color_gray'),
    colorRed: t('color_red'),
    colorOrange: t('color_orange'),
    colorGreen: t('color_green'),
    colorBlueLight: t('color_blue_light'),
    tableMenu: t('table_menu'),
    linkInputLabel: t('link_input_label'),
    linkInputPlaceholder: t('link_input_placeholder'),
    linkExternal: t('link_external'),
    linkInternal: t('link_internal'),
    linkSave: t('link_save'),
    tableInsert: t('table_insert'),
    tableAddRow: t('table_add_row'),
    tableDeleteRow: t('table_delete_row'),
    tableAddColumn: t('table_add_column'),
    tableDeleteColumn: t('table_delete_column'),
    tableToggleHeader: t('table_toggle_header'),
    tableDelete: t('table_delete'),
    imageInsert: t('image_insert'),
    imageDialogTitle: t('image_dialog_title'),
    imageFileLabel: t('image_file_label'),
    imageFilePlaceholder: t('image_file_placeholder'),
    imageAltLabel: t('image_alt_label'),
    imageHint: t('image_hint'),
    imageUpload: t('image_upload'),
    imageCancel: t('image_cancel'),
    imageErrorType: t('image_error_type'),
    imageErrorSize: t('image_error_size'),
    listItem: t('list_item'),
    code: t('code'),
    closeTags: t('close_tags'),
  }
}

/**
 * Presentational View of the `/admin/pages` create/edit dialog (Task 868, Container/Presentational
 * split of `PageEditorModal`). No hooks beyond `useTranslations` / `useMantineTheme` and the editor-dialog flag (F6), no server
 * action, no `toast`: every value and transition is decided by the container (`PageEditorDialog`) and
 * handed down as props. Renders inside the canonical `MantineModal` (centred from 640px, bottom sheet
 * below).
 */
export function PageEditorDialogView({
  opened,
  isEdit,
  activeTab,
  onTabChange,
  localeData,
  onFieldChange,
  slug,
  slugError,
  onSlugChange,
  sqBodyError,
  sqTitleError = false,
  published,
  onPublishedChange,
  onUploadImage,
  imageUploading,
  saving,
  onSubmit,
  onClose,
}: PageEditorDialogViewProps) {
  const t = useTranslations('admin.pages')
  const tLegal = useTranslations('admin.legal')
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const editorLabels = useCmsEditorLabels()

  const localeLabels: Record<PageLocale, string> = {
    sq: t('editor_locale_sq'),
    en: t('editor_locale_en'),
    uk: t('editor_locale_uk'),
    it: t('editor_locale_it'),
  }

  // Mantine routes style props (`ff`) to the input WRAPPER, while the input reads its own font family,
  // so the monospace face goes through `styles.input` with the theme token.
  const monospaceInput = { input: { fontFamily: theme.fontFamilyMonospace } }

  // Task 990: Save is disabled only while saving or with a slug error; without the Albanian title it answers with the field's error
  const saveDisabled = saving || !!slugError

  // F6: Mantine closes every opened modal on one Escape; while the editor's full screen or "Add media" is open, only that one closes. Cancel still closes.
  const [editorDialogOpen, setEditorDialogOpen] = useState(false)
  const closeUnlessEditorDialog = () => { if (!editorDialogOpen) onClose() }

  return (
    <MantineModal
      opened={opened}
      onClose={closeUnlessEditorDialog}
      structured
      size="xl"
      title={isEdit ? tLegal('modal_title_edit') : tLegal('modal_title_new')}
      footer={
        <MantineDialogFooter
          secondary={<Button type="button" variant="default" disabled={saving} onClick={onClose}>{tc('cancel')}</Button>}
          primary={<Button type="button" loading={saving} disabled={saveDisabled} onClick={onSubmit}>{tc('save')}</Button>}
        />
      }
    >
      <MantineDialogSections>
        <MantineDialogSection>
        <Tabs
          value={activeTab}
          keepMounted={false}
          onChange={value => { if (value) onTabChange(value as PageLocale) }}
        >
          {/* Four locale tabs do not fit a 320px sheet (or `uk` at 390px): the strip swipes sideways, as
              `MantineDashboardPeriodControl` does. */}
          <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
            <Tabs.List grow>
              {PAGE_LOCALES.map(loc => (
                <Tabs.Tab
                  key={loc}
                  value={loc}
                  rightSection={localeData[loc].title.trim() ? (
                    <Box component="span" c="brand" display="inline-flex" aria-hidden>
                      <Check size={theme.other.iconSize.compact} />
                    </Box>
                  ) : null}
                >
                  {localeLabels[loc]}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </ScrollArea>

          {PAGE_LOCALES.map(loc => {
            const d = localeData[loc]
            const isEmpty = loc !== 'sq' && !d.title.trim() && !d.body.trim()
            return (
              <Tabs.Panel key={loc} value={loc} pt="md">
                <Stack gap="md">
                  {isEmpty && (
                    <Alert color="yellow" variant="light">
                      {t('empty_locale_warning')}
                    </Alert>
                  )}
                  {/* Task 990: the Albanian title is required (no mark, owner policy 2026-06-26, confirmed 2026-11-27); the other titles say "(optional)" */}
                  <TextInput
                    label={loc === 'sq' ? t('field_title_label') : t('field_title_optional_label')}
                    error={loc === 'sq' && sqTitleError ? t('sq_title_required') : undefined}
                    value={d.title}
                    placeholder={localeLabels[loc]}
                    onChange={e => onFieldChange(loc, 'title', e.target.value)}
                  />
                  <MantineRichTextEditor
                    label={t('field_body_label')}
                    value={d.body}
                    error={loc === 'sq' && sqBodyError ? t('sq_body_required') : undefined}
                    labels={editorLabels}
                    uploading={imageUploading}
                    onUploadImage={onUploadImage}
                    onChange={html => onFieldChange(loc, 'body', html)}
                    onDialogChange={setEditorDialogOpen}
                  />
                </Stack>
              </Tabs.Panel>
            )
          })}
        </Tabs>
        </MantineDialogSection>

        <MantineDialogSection>
        <TextInput
          label={t('field_slug_label')}
          value={slug}
          placeholder="about-us"
          styles={monospaceInput}
          error={slugError ?? undefined}
          description={isEdit ? t('slug_url_warning') : undefined}
          onChange={e => onSlugChange(e.target.value)}
        />

        <Switch
          label={published ? tLegal('toggle_published') : tLegal('toggle_draft')}
          checked={published}
          onChange={e => onPublishedChange(e.currentTarget.checked)}
        />
        </MantineDialogSection>
      </MantineDialogSections>
    </MantineModal>
  )
}
