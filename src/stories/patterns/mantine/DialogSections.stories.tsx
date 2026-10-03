import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { Card, Text } from '@mantine/core'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 857 R45 — canonical dialog sections (docs §23.7). GR-3a: CREATE — no Story imports a dialog section primitive
// (searched `src/stories/**` for MantineDialogSections / MantineFormSection: the latter is a bordered page card, not a
// dialog section). The sections normally sit in the body of a structured `MantineModal`; here a `Card` with the dialog
// body's own `md` padding stands in for that body so the full-bleed dividers read as they do in the dialog
// (`Mantine/Primitives/Modal` `Structured` shows the real overlay). GR-3b: fluid, no width or viewport pin. GR-3d:
// the page has no gutter of its own, so every export wraps in `StoryPageGutter`. Text is the existing
// `admin.listings` translations (fixture), so locale follows the Storybook toolbar.
const meta: Meta<typeof MantineDialogSections> = {
  title: 'Patterns/Mantine/DialogSections',
  component: MantineDialogSections,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sections of a dialog on the canonical anatomy (§23.7): an optional 16px/500 title and 14px dimmed description, then the content. A full-bleed divider separates the sections, with none before the first or after the last.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MantineDialogSections>

function SectionsDemo({ count }: { count: 1 | 3 }) {
  const t = useTranslations('admin.listings')
  return (
    <StoryPageGutter>
      <Card withBorder radius="md" padding="md">
        <MantineDialogSections>
          <MantineDialogSection title={t('col_status')} description={t('delete_dialog_body')}>
            <Text fz="sm">{t('premium_dialog_title')}</Text>
          </MantineDialogSection>
          {count === 3 && (
            <MantineDialogSection title={t('preview_section_details')}>
              <Text fz="sm">{t('premium_error_db_schema')}</Text>
            </MantineDialogSection>
          )}
          {count === 3 && (
            <MantineDialogSection>
              <Text fz="sm" c="dimmed">{t('premium_quick_label')}</Text>
            </MantineDialogSection>
          )}
        </MantineDialogSections>
      </Card>
    </StoryPageGutter>
  )
}

// Three sections: titled with a description, titled, untitled — two dividers, none outside.
export const Default: Story = { render: () => <SectionsDemo count={3} /> }

// One section: no divider at all.
export const SingleSection: Story = { render: () => <SectionsDemo count={1} /> }
