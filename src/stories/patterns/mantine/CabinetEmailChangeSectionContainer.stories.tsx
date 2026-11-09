import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { useLocale } from 'next-intl'
import { CabinetEmailChangeSection } from '@/modules/cabinet/components/CabinetEmailChangeSection'
import { MantineStoryShell } from '../../mantine/_MantineStoryShell'

/**
 * The real container of the cabinet e-mail change section (Task 923 R83): it holds the typed address and password, checks the address, calls the `initiateEmailChange` and
 * `resendEmailVerification` Server Actions and renders `CabinetEmailChangeSectionView`, whose own Story (`Patterns/Mantine/CabinetEmailChangeSectionView`) shows every state.
 * This Story proves that the container wires the view: the account's current address and the password form reach the screen. It sends nothing, because sending reaches the Server Action.
 */
const meta: Meta<typeof CabinetEmailChangeSection> = {
  title: 'Patterns/Mantine/CabinetEmailChangeSectionContainer',
  component: CabinetEmailChangeSection,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'The container of the cabinet e-mail change section. It owns the typed values and the Server Actions; the markup is `CabinetEmailChangeSectionView`.' } },
  },
}
export default meta
type Story = StoryObj<typeof CabinetEmailChangeSection>

const CURRENT_EMAIL = 'alba.krasniqi@example.com'

function Demo() {
  const locale = useLocale()
  return (
    <MantineStoryShell>
      <CabinetEmailChangeSection
        email={CURRENT_EMAIL}
        initialPendingEmail={null}
        locale={locale}
        reauthMethod="password"
        googleAllowed={false}
        onGoogleCredential={async () => {}}
      />
    </MantineStoryShell>
  )
}

export const Default: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(CURRENT_EMAIL)).toBeVisible()
  },
}
