'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Alert, Box, Button, Flex, ScrollArea, Stack, Switch, Tabs, TextInput, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
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
    menuFormat: t('menu_format'),
    menuParagraph: t('menu_paragraph'),
    menuInsert: t('menu_insert'),
    menuHistory: t('menu_history'),
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
    clearFormatting: t('clear_formatting'),
    h2: t('h2'),
    h3: t('h3'),
    h4: t('h4'),
    bulletList: t('bullet_list'),
    orderedList: t('ordered_list'),
    blockquote: t('blockquote'),
    link: t('link'),
    unlink: t('unlink'),
    alignLeft: t('align_left'),
    alignCenter: t('align_center'),
    alignRight: t('align_right'),
    alignJustify: t('align_justify'),
    undo: t('undo'),
    redo: t('redo'),
    linkInputLabel: t('link_input_label'),
    linkInputPlaceholder: t('link_input_placeholder'),
    linkExternal: t('link_external'),
    linkInternal: t('link_internal'),
    linkSave: t('link_save'),
    columns2: t('columns_2'),
    columns3: t('columns_3'),
    columnsRemove: t('columns_remove'),
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
  }
}

/**
 * Presentational View of the `/admin/pages` create/edit dialog (Task 868, Container/Presentational
 * split of `PageEditorModal`). No hooks beyond `useTranslations` / `useMantineTheme`, no server
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

  const saveDisabled = saving || !localeData.sq.title.trim() || !!slugError

  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={isEdit ? tLegal('modal_title_edit') : tLegal('modal_title_new')}
      footer={
        <Flex
          direction={{ base: 'column-reverse', sm: 'row' }}
          gap="sm"
          justify={{ base: 'stretch', sm: 'flex-end' }}
        >
          <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} disabled={saving} onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button
            color="brand"
            w={{ base: '100%', sm: 'auto' }}
            loading={saving}
            disabled={saveDisabled}
            onClick={onSubmit}
          >
            {tc('save')}
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
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
                  <TextInput
                    label={t('field_title_label')}
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
                  />
                </Stack>
              </Tabs.Panel>
            )
          })}
        </Tabs>

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
      </Stack>
    </MantineModal>
  )
}
