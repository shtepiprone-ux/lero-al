import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { userEvent, within } from 'storybook/test'
import { UserPickerFieldView } from '@/components/admin/UserPickerFieldView'
import type { PickerUser } from '@/components/admin/AdminSupportManager'
import { FIXTURE_PICKER_USERS } from '@/stories/fixtures/admin.fixtures'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 859 — presentational View of the support/complaint user picker (Container/Presentational split;
// `UserPickerField` is the container that owns the debounced search). Revision 2 (R27): the View renders the
// canonical searchable `MantineCombobox` (Story `Mantine/Primitives/Combobox`), so the open list is the combobox's own
// (an anchored dropdown from 640, the bottom sheet below). GR-3d: the field has no page gutter of its own, so every
// export is wrapped in `StoryPageGutter`. The query is local state and the users are labelled fixture data; no search
// runs. Viewport and locale come from the Storybook toolbar. The open states click the field, as a user does.
const meta: Meta<typeof UserPickerFieldView> = {
  title: 'Patterns/Mantine/UserPickerFieldView',
  component: UserPickerFieldView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'User picker: the canonical searchable `MantineCombobox`. Typing runs the server search of its container, each result row carries the role and status badges, and the selected user is the value with a pinned clear row.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof UserPickerFieldView>

// Fixture data (labelled): active agent, blocked user, inactive moderator.
const [ACTIVE, BLOCKED] = FIXTURE_PICKER_USERS as PickerUser[]
const RESULTS = FIXTURE_PICKER_USERS as PickerUser[]

interface DemoProps {
  query?: string
  results?: PickerUser[]
  open?: boolean
  isSearching?: boolean
  value?: PickerUser | null
}

function PickerDemo({ query: initialQuery = '', results = [], open = false, isSearching = false, value = null }: DemoProps) {
  const t = useTranslations('admin.support')
  const [query, setQuery] = useState(initialQuery)
  const [selected, setSelected] = useState<PickerUser | null>(value)
  return (
    <StoryPageGutter>
      <UserPickerFieldView
        label={t('requester_label')}
        icon="user"
        value={selected}
        onClear={() => setSelected(null)}
        query={query}
        onQueryChange={setQuery}
        results={results}
        open={open}
        isSearching={isSearching}
        onSelect={setSelected}
        placeholder={t('requester_placeholder')}
      />
    </StoryPageGutter>
  )
}

export const Idle: Story = { render: () => <PickerDemo /> }

const openField: Story['play'] = async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole('textbox'))
}

export const Searching: Story = { render: () => <PickerDemo query="ag" isSearching />, play: openField }

export const Results: Story = { render: () => <PickerDemo query="ag" results={RESULTS} open />, play: openField }

export const NoResults: Story = { render: () => <PickerDemo query="zz" open />, play: openField }

export const Selected: Story = { render: () => <PickerDemo value={ACTIVE} /> }

export const SelectedBlocked: Story = { render: () => <PickerDemo value={BLOCKED} /> }
