import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdminPagesView } from '@/components/admin/AdminPagesView'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { withAdminShell } from '@/stories/_StoryAdminShell'
import type { Page } from '@/types/database'

// Task 868 — presentational View of `/admin/pages` (Container/Presentational split of
// `AdminPagesManager`). No canonical Story imported this View before (GR-3a: CREATE). Table from `sm`
// (slug from `md`, updated from `lg`), cards below, delete confirmation in `MantineModal` (bottom sheet
// <640px). The create/edit dialog is the separate `PageEditorDialogView`. Callbacks are no-ops or local
// state; `FIXTURE_PAGES` is labelled fixture data. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminPagesView> = {
  title: 'Patterns/Mantine/AdminPagesView',
  component: AdminPagesView,
  decorators: [withAdminShell],
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/admin/pages' } },
    docs: {
      description: {
        component:
          'CMS page list on `MantineDataTableToCards` (table from `sm`, cards below) with the migration-pending `Alert`, icon-only `ActionIcon` row actions with accessible names, and the delete confirmation in `MantineModal`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminPagesView>

const D1 = '2026-09-20T09:00:00.000Z'
const D2 = '2026-09-27T14:30:00.000Z'

// Fixture data (labelled): one published, one draft, one published with a long title. Titles come
// from the `nav` messages, so they follow the toolbar locale; the legacy page keeps its body outside the
// per-locale shape, which raises the migration banner.
function localized(title: string, body: string) {
  return { title, body }
}

function buildFixturePages(t: (key: 'terms' | 'about' | 'privacy') => string): { pages: Page[]; legacy: Page } {
  const terms = t('terms')
  const about = t('about')
  const privacy = `${t('privacy')} · ${t('terms')} · ${t('about')}`
  const pages: Page[] = [
    {
      id: 1,
      title: terms,
      slug: 'terms-of-use',
      content: { sq: localized(terms, '<p>…</p>'), en: localized(terms, '<p>…</p>'), uk: localized(terms, '<p>…</p>'), it: localized(terms, '<p>…</p>') },
      is_published: true,
      updated_by: null,
      updated_at: D2,
    },
    {
      id: 2,
      title: about,
      slug: 'about-us',
      content: { sq: localized(about, ''), en: localized('', ''), uk: localized('', ''), it: localized('', '') },
      is_published: false,
      updated_by: null,
      updated_at: D1,
    },
    {
      id: 3,
      title: privacy,
      slug: 'privacy-policy',
      content: { sq: localized(privacy, '<p>…</p>'), en: localized(privacy, '<p>…</p>'), uk: localized('', ''), it: localized('', '') },
      is_published: true,
      updated_by: null,
      updated_at: D1,
    },
  ]
  const legacy: Page = {
    id: 4,
    title: about,
    slug: 'legacy-page',
    content: { body: '<p>…</p>' },
    is_published: false,
    updated_by: null,
    updated_at: D1,
  }
  return { pages, legacy }
}

type Variant = 'default' | 'empty' | 'migration' | 'deleting' | 'deleteConfirm'

function ViewDemo({ variant = 'default' }: { variant?: Variant }) {
  const t = useTranslations('nav')
  const { pages: fixture, legacy } = buildFixturePages(t)
  const [pages, setPages] = useState<Page[]>(() =>
    variant === 'empty' ? [] : variant === 'migration' ? [...fixture, legacy] : fixture,
  )
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(variant === 'deleteConfirm' ? fixture[0] : null)
  return (
    <AdminPageFrame width="narrow">
      <AdminPagesView
        pages={pages}
        activeLocale="sq"
        migrationPending={variant === 'migration'}
        deletingId={variant === 'deleting' ? fixture[0].id : null}
        deleteTarget={deleteTarget}
        onNew={() => {}}
        onEdit={() => {}}
        onRequestDelete={setDeleteTarget}
        onCancelDelete={() => setDeleteTarget(null)}
        onConfirmDelete={() => {
          setPages(prev => prev.filter(x => x.id !== deleteTarget?.id))
          setDeleteTarget(null)
        }}
      />
    </AdminPageFrame>
  )
}

export const Default: Story = { render: () => <ViewDemo /> }

export const Empty: Story = { render: () => <ViewDemo variant="empty" /> }

export const MigrationPending: Story = { render: () => <ViewDemo variant="migration" /> }

export const Deleting: Story = { render: () => <ViewDemo variant="deleting" /> }

export const DeleteConfirm: Story = { render: () => <ViewDemo variant="deleteConfirm" /> }
