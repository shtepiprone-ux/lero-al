import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useRef } from 'react'
import { AdminUserAvatarFieldView, type AdminUserAvatarFieldViewProps } from '@/components/admin/AdminUserAvatarFieldView'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { storyT } from '@/stories/_storyI18n'

// Task 893 (R3b) — presentational View of the admin avatar field (Container/Presentational split of the legacy
// `AdminUserAvatar`, whose logic is `useAdminAvatarUpload`). No canonical Story imported this View before
// (GR-3a: CREATE); the legacy `Admin/AdminUserAvatar` Story still renders the legacy component for `/cabinet`.
// Callbacks are no-ops and `/og-default.png` is labelled fixture data. Viewport and locale come from the toolbar.
const meta: Meta<typeof AdminUserAvatarFieldView> = {
  title: 'Patterns/Mantine/AdminUserAvatarFieldView',
  component: AdminUserAvatarFieldView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Mantine `Avatar` with a camera `ActionIcon`, replace / remove `Button`s, two hints and an error line. The crop modal and the upload flow live in the `AdminUserAvatarField` container.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminUserAvatarFieldView>

function ViewDemo(props: Partial<AdminUserAvatarFieldViewProps>) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <StoryPageGutter>
      <AdminUserAvatarFieldView
        imageUrl={null}
        canEdit={false}
        busy={false}
        showRemove
        showOptionalHint={false}
        error={null}
        inputRef={inputRef}
        onPick={() => {}}
        onFileChange={() => {}}
        onRemove={() => {}}
        {...props}
      />
    </StoryPageGutter>
  )
}

const FIXTURE_IMAGE = '/og-default.png'

export const Empty: Story = { render: () => <ViewDemo /> }

export const WithImage: Story = { render: () => <ViewDemo imageUrl={FIXTURE_IMAGE} /> }

export const Editable: Story = { render: () => <ViewDemo imageUrl={FIXTURE_IMAGE} canEdit /> }

export const Uploading: Story = { render: () => <ViewDemo imageUrl={FIXTURE_IMAGE} canEdit busy /> }

export const Error: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <ViewDemo canEdit error={storyT(locale, 'cabinet.avatar_error_type')} />
  },
}

export const CreatePending: Story = { render: () => <ViewDemo canEdit showOptionalHint /> }
