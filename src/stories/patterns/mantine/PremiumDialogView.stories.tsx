import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PremiumDialogView, PREMIUM_CUSTOM_CHOICE } from '@/components/admin/PremiumDialogView'

// Task 857 — presentational View of the premium dialog (Container/Presentational split of
// `AdminListingsTable`). GR-3a: CREATE — the legacy `Admin/AdminListingsTable` Story never rendered this dialog on
// its own. Overlay-only Story (GR-3d: no gutter wrapper): each export opens the controlled `MantineModal` on
// mount. The custom date is local state; the title is labelled fixture data. Viewport and locale come from the
// Storybook toolbar.
// Task 857 Revision 7: the dialog is built on the canonical dialog anatomy (docs §23.7). GR-3a: EXTEND — `PremiumActive`
// is a state of this Story.
const meta: Meta<typeof PremiumDialogView> = {
  title: 'Patterns/Mantine/PremiumDialogView',
  component: PremiumDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Premium dialog on the canonical dialog anatomy (docs §23.7): a structured `MantineModal` with a star tile and the listing title as its description; sections for the current premium state (premium listings only), the duration as `Radio.Card`s whose custom card reveals a single-day `RangeDatePicker` (past days disabled), and the lone destructive text button "Remove premium" (premium listings only); the footer is an equal-width Cancel (secondary) and Save (the one primary, disabled until a choice is made) pair.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PremiumDialogView>

// Frozen fixture day (no wall-clock in fixtures, storybook governance §14.10): a future day, as the picker disables past ones.
const FIXTURE_CUSTOM_DATE = '2027-06-15'

// A frozen end date for a premium listing that has one (labelled fixture).
const FIXTURE_PREMIUM_UNTIL = '2027-03-01T00:00:00Z'

const FIXTURE_TITLE = '3+1 apartament në qendër të Tiranës — kati i 5-të, pamje panoramike'

function DialogDemo({
  isPremium = false,
  premiumUntil = null,
  saving = false,
  initialChoice = '',
  initialDate = '',
}: { isPremium?: boolean; premiumUntil?: string | null; saving?: boolean; initialChoice?: string; initialDate?: string }) {
  const t = useTranslations('admin.listings')
  const [choice, setChoice] = useState(initialChoice)
  const [customDate, setCustomDate] = useState(initialDate)
  return (
    <PremiumDialogView
      listingTitle={FIXTURE_TITLE}
      isPremium={isPremium}
      premiumUntil={premiumUntil}
      presets={[
        { label: t('preset_1m'), days: 30 },
        { label: t('preset_3m'), days: 90 },
        { label: t('preset_6m'), days: 180 },
        { label: t('preset_1y'), days: 365 },
      ]}
      choice={choice}
      customDate={customDate}
      saving={saving}
      onChoiceChange={setChoice}
      onCustomDateChange={setCustomDate}
      onSave={() => {}}
      onRemove={() => {}}
      onClose={() => {}}
    />
  )
}

export const NotPremium: Story = { render: () => <DialogDemo /> }

// A premium listing with no end date on record (a data quirk): the state reads "not premium", Remove is still offered.
export const Premium: Story = { render: () => <DialogDemo isPremium /> }

// A premium listing with an end date: the state row reads "Active until <date>".
export const PremiumActive: Story = { render: () => <DialogDemo isPremium premiumUntil={FIXTURE_PREMIUM_UNTIL} /> }

// The custom option is chosen: the single-day picker is revealed, with a day picked (labelled fixture data).
export const CustomDate: Story = {
  render: () => <DialogDemo initialChoice={PREMIUM_CUSTOM_CHOICE} initialDate={FIXTURE_CUSTOM_DATE} />,
}

export const Saving: Story = { render: () => <DialogDemo isPremium premiumUntil={FIXTURE_PREMIUM_UNTIL} saving initialChoice="30" /> }
