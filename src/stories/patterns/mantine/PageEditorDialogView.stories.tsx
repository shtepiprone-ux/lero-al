import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { PageEditorDialogView, type PageLocaleFields } from '@/components/admin/PageEditorDialogView'
import type { PageLocale } from '@/components/admin/adminPagesContent'
import { RICH_LAYOUT_BODIES, richFixtureLocale } from '@/stories/fixtures/richContent.fixtures'

// Task 868 — presentational View of the `/admin/pages` create/edit dialog (Container/Presentational
// split of `PageEditorModal`). No canonical Story imported this View before (GR-3a: CREATE). The dialog
// opens on mount: centred `MantineModal` from 640px, bottom sheet below. Values come from labelled
// fixture data; callbacks are local state. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof PageEditorDialogView> = {
  title: 'Patterns/Mantine/PageEditorDialogView',
  component: PageEditorDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CMS page editor in `MantineModal`: four locale `Tabs` (a `Check` marks a filled title), `TextInput` title and slug, monospace `Textarea` body, `Switch` for published/draft. Fully controlled — the container owns state and the server actions.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PageEditorDialogView>

const EMPTY_FIELDS: PageLocaleFields = {
  sq: { title: '', body: '' },
  en: { title: '', body: '' },
  uk: { title: '', body: '' },
  it: { title: '', body: '' },
}

// Fixture data (labelled): an existing published page with Albanian and English content; titles come
// from the `nav` messages, so they follow the toolbar locale.
function editFields(terms: string): PageLocaleFields {
  return {
    sq: { title: terms, body: '<h2>…</h2><p>…</p>' },
    en: { title: terms, body: '<h2>…</h2><p>…</p>' },
    uk: { title: '', body: '' },
    it: { title: '', body: '' },
  }
}

// Fixture: a stand-in for the upload route; resolves a fixture image URL.
function fakeUpload(): Promise<string> {
  return Promise.resolve('https://res.cloudinary.com/demo/image/upload/v1/sample.jpg')
}

function EditorDemo({
  isEdit = false,
  fixture = 'empty',
  initialTab = 'sq',
  initialSlug = '',
  reservedSlug = false,
  sqBodyError = false,
  initialPublished = false,
  saving = false,
}: {
  isEdit?: boolean
  fixture?: 'empty' | 'edit' | 'about' | 'rich'
  initialTab?: PageLocale
  initialSlug?: string
  reservedSlug?: boolean
  sqBodyError?: boolean
  initialPublished?: boolean
  saving?: boolean
}) {
  const t = useTranslations('admin.pages')
  const tNav = useTranslations('nav')
  const richLocale = richFixtureLocale(useLocale())
  const [fields, setFields] = useState<PageLocaleFields>(() =>
    fixture === 'rich'
      ? { ...editFields(tNav('terms')), sq: { title: tNav('terms'), body: RICH_LAYOUT_BODIES[richLocale] } }
      : fixture === 'edit'
      ? editFields(tNav('terms'))
      : fixture === 'about'
        ? { ...EMPTY_FIELDS, sq: { title: tNav('about'), body: '' } }
        : EMPTY_FIELDS,
  )
  const [tab, setTab] = useState<PageLocale>(initialTab)
  const [slug, setSlug] = useState(initialSlug)
  const [published, setPublished] = useState(initialPublished)
  return (
    <PageEditorDialogView
      opened
      isEdit={isEdit}
      activeTab={tab}
      onTabChange={setTab}
      localeData={fields}
      onFieldChange={(locale, field, value) =>
        setFields(prev => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }))
      }
      slug={slug}
      slugError={reservedSlug ? t('slug_reserved') : null}
      onSlugChange={setSlug}
      sqBodyError={sqBodyError}
      published={published}
      onPublishedChange={setPublished}
      onUploadImage={fakeUpload}
      imageUploading={false}
      saving={saving}
      onSubmit={() => {}}
      onClose={() => {}}
    />
  )
}

export const New: Story = { render: () => <EditorDemo /> }

export const EditPublished: Story = {
  render: () => <EditorDemo isEdit fixture="edit" initialSlug="terms-of-use" initialPublished />,
}

export const EmptyLocaleWarning: Story = {
  render: () => (
    <EditorDemo isEdit fixture="edit" initialTab="uk" initialSlug="terms-of-use" initialPublished />
  ),
}

export const SlugError: Story = {
  render: () => (
    <EditorDemo
      fixture="about"
      initialSlug="admin"
      reservedSlug
    />
  ),
}

export const PublishBodyRequired: Story = {
  render: () => (
    <EditorDemo
      fixture="about"
      initialSlug="about-us"
      initialPublished
      sqBodyError
    />
  ),
}

export const Saving: Story = {
  render: () => <EditorDemo isEdit fixture="edit" initialSlug="terms-of-use" initialPublished saving />,
}

// Task 868 (R14): a body with 2 columns, a table and an image on the Albanian tab.
export const RichContent: Story = {
  render: () => <EditorDemo isEdit fixture="rich" initialSlug="terms-of-use" initialPublished />,
}
