import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '@/stories/_storyI18n'
import { ListingFormShellView, type ListingFormShellViewProps } from '@/modules/listings/components/ListingFormShellView'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import type { FormValues } from '@/modules/listings/types/form'
import { fixturePhotos } from '@/stories/fixtures/listingPhotos.fixture'
import { ListingFormHarness } from '@/stories/fixtures/ListingFormHarness'

// Task 957 (owner rule 2026-11-19: a task that changes a front-end file migrates that file's legacy parts in the same task): the listing create / edit form on canonical Mantine
// (`MantineFormSection` cards, `TextInput`, `Textarea`, `FilterChoiceGroup`, `Button`, `MantineDeleteConfirmModal`; Revision 2: the fields of `DynamicFieldSection` and the two-column
// `AdminEditLayout` are on Mantine too). It replaces the legacy `Listings/ListingFormShellView` Story.
// Revision 3 (Review 3 F18, F19): every Story renders the view inside the fixture harness (`src/stories/fixtures/ListingFormHarness.tsx`), which holds the form data, so what is typed, chosen or
// removed changes the form, and a Save shows exactly the errors `validateListingForm` gives for the values (the function the container uses). Nothing is saved: the Server Actions belong to the
// container. The data below is labelled fixture data, the texts come from the product `listing` messages, the photos are the photographs of `fixturePhotos` (Review 3 F20). Viewport and locale
// come from the Storybook toolbar.
// GR-3d: n/a: own gutter (src/modules/listings/components/ListingFormShellView.tsx:103) — the view's root is a `Container` with `py="2xl"` (top and bottom) and Mantine's own `padding-inline` of 1rem (left and right), so the Stories add none.

const baseData: FormValues = {
  listing_type: 'sale',
  property_type: 'apartment',
  title: 'Shitet apartament 2+1 në Tiranë, zonë e re',
  description: 'Apartament modern i mobiluar plotësisht, kati i 4-t, ndriçim natyror i shkëlqyer.',
  price: 125000,
  currency: 'EUR',
  condition: 'new_build',
  heating: 'central',
  wall_type: 'brick',
  offer_type: 'owner',
  purchase_conditions: ['mortgage'],   // a selected choice in every group of the form, so the one look of a selected choice is measured on this Story (Review 2 F13)
  rooms: 3,
  bedrooms: 2,
  bathrooms: 1,
  toilets: 1,
  area_gross: 85,
  area_net: 78,
  floor: 4,
  total_floors: 8,
  multi_storey_building: false,
  year_built: 2022,
  location_id: 1,
  address: 'Rruga Myslym Shyri',
  images: fixturePhotos(2),
}

const locations: LocationOption[] = [
  { id: 1, name_al: 'Tiranë', name_en: 'Tirana', type: 'city' },
  { id: 2, name_al: 'Durrës', name_en: 'Durres', type: 'city' },
]

async function noopStatusChange() {}

// The props of the view that a Story sets; the harness owns the form data, the errors, the callbacks and the cancel dialog.
const baseArgs: Partial<ListingFormShellViewProps> = {
  mode: 'edit',
  data: baseData,
  locations,
  listingId: 'story-listing-1',
  cloudinary: { apiKey: 'story-api-key', cloudName: 'story-cloud' },   // labelled fixture: the photo widget is built with it (a Storybook build has no environment); the Story never opens the widget
  submitting: false,
  submitError: '',
  isDirty: true,
  statusControl: undefined,
}

/** The harness for a Story's args: `data` and `isDirty` start the form, everything else passes through to the view. */
function Harness({ args, saveOnMount, initialCancelOpen }: { args: ListingFormShellViewProps; saveOnMount?: boolean; initialCancelOpen?: boolean }) {
  return (
    <ListingFormHarness
      initial={args.data}
      initialDirty={args.isDirty}
      saveOnMount={saveOnMount}
      initialCancelOpen={initialCancelOpen}
      mode={args.mode}
      locations={args.locations}
      listingId={args.listingId}
      cloudinary={args.cloudinary}
      submitting={args.submitting}
      submitError={args.submitError}
      statusControl={args.statusControl}
    />
  )
}

const meta: Meta<typeof ListingFormShellView> = {
  title: 'Patterns/Mantine/ListingFormShellView',
  component: ListingFormShellView,
  tags: ['autodocs'],
  parameters: { skipCanvas: true, layout: 'fullscreen' },
  args: baseArgs,
  render: (args) => <Harness args={args} />,
}

export default meta
type Story = StoryObj<typeof ListingFormShellView>

// ── Owner mode — sidebar has Save + Cancel only, no status control ────────────
export const Owner: Story = {
  args: { statusControl: undefined },
}

// ── Create mode — no listing yet: the photos are signed into the person's own folder ──
export const Create: Story = {
  args: { mode: 'create', listingId: undefined, data: { ...baseData, title: '', price: undefined, images: [] }, isDirty: false },
}

// ── Staff mode — sidebar adds the "Change status" block (canonical StatusChangeSelect, Task 923 R35) ─
export const Staff: Story = {
  args: {
    statusControl: { currentStatus: 'pending', listingId: 'story-listing-1', canPublish: true, onStatusChange: noopStatusChange },
  },
}

// ── Owner of the listing with the status control: the listing is active, and the owner is offered neither `active` as a target (D6, D22) nor `pending` ("Under review", O957-10): only staff send a listing to review ──
export const OwnerStatusControl: Story = {
  args: {
    statusControl: { currentStatus: 'active', listingId: 'story-listing-1', canPublish: false, onStatusChange: noopStatusChange },
  },
}

// ── Validation: the form starts from values that fail (a short title, no price, no photo, floor 9 of a building of 8) and shows the errors a Save gives for them (`validateListingForm`) ──
export const WithErrors: Story = {
  args: { data: { ...baseData, title: 'abc', price: undefined, images: [], floor: 9, total_floors: 8 } },
  // the save error (the alert at the top of the form) is the product's own `listing.error_updating`, in the locale of the toolbar
  render: (args, context) => <Harness args={{ ...args, submitError: storyT((context?.globals?.locale as string) ?? 'en', 'listing.error_updating') }} saveOnMount />,
}

// ── Saving ────────────────────────────────────────────────────────────────────
export const Submitting: Story = {
  args: { submitting: true },
}

// ── The photo limit is reached (20 photos): no upload button, the limit hint instead; removing a photo brings the upload button back ──
export const PhotoLimitReached: Story = {
  args: { data: { ...baseData, images: fixturePhotos(20) } },
}

// ── The upload cannot be built (the page read no API key or cloud name): the photo section shows the error state (Review 2 F5) ──
export const UploadUnavailable: Story = {
  args: { cloudinary: { apiKey: '', cloudName: '' } },
}

// ── The cancel confirmation (a structured MantineModal, a bottom sheet below 640px): opens on render and keeps its open state, as the product does through
// `ListingFormShell.tsx` `setShowCancel`, so Escape, the close control and "stay" close it and the Cancel button opens it again ──
export const CancelConfirmation: Story = {
  render: (args) => <Harness args={args} initialCancelOpen />,
}
