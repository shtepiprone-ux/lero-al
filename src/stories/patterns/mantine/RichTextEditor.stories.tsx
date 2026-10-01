import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MantineRichTextEditor } from '@/design-system/mantine/patterns/MantineRichTextEditor'
import { useCmsEditorLabels } from '@/components/admin/PageEditorDialogView'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { RICH_LAYOUT_BODIES, richFixtureLocale } from '@/stories/fixtures/richContent.fixtures'

// Task 868 (R12) — the canonical rich-text editor pattern (Mantine `RichTextEditor` on Tiptap, D868-2).
// No canonical Story imported it before (GR-3a: CREATE). It is controlled; `onUploadImage` is a labelled
// fixture that resolves a fixture URL after a short delay, and the pattern does no networking itself.
// The toolbar strings are the real `admin.pages.editor.*` messages, so the locale toolbar switches them.
// Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof MantineRichTextEditor> = {
  title: 'Patterns/Mantine/RichTextEditor',
  component: MantineRichTextEditor,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Controlled HTML editor in `Input.Wrapper` (label + error): formatting, h2–h4, lists, quote, link, alignment, layout columns, tables and an image dialog. Emits `""` for an empty document.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MantineRichTextEditor>

// Fixture: a stand-in for the upload route; resolves a fixture image URL.
const FIXTURE_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'
function fakeUpload(): Promise<string> {
  return new Promise(resolve => setTimeout(() => resolve(FIXTURE_IMAGE_URL), 600))
}

function EditorDemo({
  withContent = false,
  withError = false,
  uploading = false,
}: {
  withContent?: boolean
  withError?: boolean
  uploading?: boolean
}) {
  const locale = richFixtureLocale(useLocale())
  const t = useTranslations('admin.pages')
  const labels = useCmsEditorLabels()
  const [value, setValue] = useState(withContent ? RICH_LAYOUT_BODIES[locale] : '')
  return (
    <StoryPageGutter>
      <MantineRichTextEditor
        label={t('field_body_label')}
        value={value}
        onChange={setValue}
        error={withError ? t('sq_body_required') : undefined}
        labels={labels}
        uploading={uploading}
        onUploadImage={fakeUpload}
      />
    </StoryPageGutter>
  )
}

export const Default: Story = { render: () => <EditorDemo /> }

export const WithContent: Story = { render: () => <EditorDemo withContent /> }

export const WithError: Story = { render: () => <EditorDemo withError /> }

// Opens the image dialog on load, with the upload action in its loading state.
export const ImageUploading: Story = {
  render: () => <EditorDemo uploading />,
  play: async ({ canvasElement }) => {
    // The image function lives in the Insert menu: open it, then press its image item (the menu is in a portal).
    canvasElement.querySelector('.lucide-plus')?.closest('button')?.click()
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const item = canvasElement.ownerDocument.body.querySelector('.lucide-image-plus')?.closest('button')
      if (item) {
        item.click()
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  },
}
