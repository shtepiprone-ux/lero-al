import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { ListingInquiryDialogView } from '@/modules/listings/components/ListingInquiryDialogView'

// Task 923 R41 — presentational View of the listing contact card's message dialog (Container/Presentational split;
// `ListingInquiryDialog` is the container). GR-3a: CREATE — no canonical Story imported this View. Overlay-only Story
// (GR-3d: no gutter wrapper): each export opens the controlled `MantineModal` on mount. The typed values live in local
// state (the View is stateless) and are labelled fixture data. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof ListingInquiryDialogView> = {
  title: 'Patterns/Mantine/ListingInquiryDialogView',
  component: ListingInquiryDialogView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Message dialog of the listing contact card as a structured `MantineModal` (a bottom sheet below 640px): name, e-mail and message in one dialog section and a `MantineDialogFooter` pair, Cancel then Send. Send is disabled until the container reports `canSubmit` and shows its loader while `pending`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ListingInquiryDialogView>

// Fixture data (labelled).
const FIXTURE = {
  name: 'Alba Krasniqi',
  email: 'alba.krasniqi@example.com',
  message: 'Përshëndetje, jam i interesuar për këtë apartament. A mund të organizojmë një vizitë këtë javë?',
}

interface DemoProps {
  name?: string
  email?: string
  message?: string
  canSubmit?: boolean
  pending?: boolean
}

function DialogDemo({ name = '', email = '', message = '', canSubmit = false, pending = false }: DemoProps) {
  const [values, setValues] = useState({ name, email, message })
  return (
    <ListingInquiryDialogView
      opened
      name={values.name}
      email={values.email}
      message={values.message}
      onNameChange={v => setValues(s => ({ ...s, name: v }))}
      onEmailChange={v => setValues(s => ({ ...s, email: v }))}
      onMessageChange={v => setValues(s => ({ ...s, message: v }))}
      canSubmit={canSubmit}
      pending={pending}
      onSubmit={() => {}}
      onClose={() => {}}
    />
  )
}

export const Empty: Story = { render: () => <DialogDemo /> }

export const Filled: Story = { render: () => <DialogDemo {...FIXTURE} canSubmit /> }

export const Pending: Story = { render: () => <DialogDemo {...FIXTURE} canSubmit pending /> }
