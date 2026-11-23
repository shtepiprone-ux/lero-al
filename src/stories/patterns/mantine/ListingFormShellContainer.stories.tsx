import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { useLocale } from 'next-intl'
import { ListingFormShell } from '@/modules/listings/components/ListingFormShell'
import type { LocationOption } from '@/components/shared/LocationCombobox'

/**
 * The real container of the listing form (Task 957): it holds the form values and the errors, validates, and calls the `createListing`, `updateListing` and
 * `changeListingStatusAction` Server Actions; the markup is `ListingFormShellView` (its own Story shows every state). This Story proves that the container wires the view in create
 * mode: the empty form reaches the screen. It saves nothing: saving reaches the Server Action.
 */
const meta: Meta<typeof ListingFormShell> = {
  title: 'Patterns/Mantine/ListingFormShellContainer',
  component: ListingFormShell,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'The container of the listing create / edit form. It owns the typed values, the validation and the Server Actions; the markup is `ListingFormShellView`.' } },
  },
}
export default meta
type Story = StoryObj<typeof ListingFormShell>

const LOCATIONS: LocationOption[] = [
  { id: 1, name_al: 'Tiranë', name_en: 'Tirana', type: 'city' },
  { id: 2, name_al: 'Durrës', name_en: 'Durres', type: 'city' },
]

// Labelled fixture: the photo widget is built with an API key and a cloud name (a Storybook build has no environment); Storybook resolves `next-cloudinary` to an inert stub, so no script loads.
const STORY_CLOUDINARY = { apiKey: 'story-api-key', cloudName: 'story-cloud' }

// GR-3d: n/a: own gutter (src/modules/listings/components/ListingFormShellView.tsx:103) — the container renders `ListingFormShellView`, whose root `Container` (`py="2xl"`, Mantine's own
// `padding-inline`) is the page gutter. The Story adds none: the Mantine primitives' Story shell it used wrapped the form in a second gutter and a card the page does not have (a doubled gutter, Revision 3, F17).
function Demo() {
  const locale = useLocale()
  return <ListingFormShell mode="create" locale={locale} locations={LOCATIONS} cloudinary={STORY_CLOUDINARY} />
}

export const Create: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const heading = await within(canvasElement).findByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  },
}
