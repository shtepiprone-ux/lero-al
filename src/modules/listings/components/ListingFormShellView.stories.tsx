import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ListingFormShellView, type ListingFormShellViewProps } from './ListingFormShellView'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import type { FormValues } from '@/modules/listings/types/form'

// ── Mocked data — local to this story, not shared infrastructure ─────────────
// Task 238: rendered-evidence harness for the shared ListingFormShellView
// side-panel layout (AdminEditLayout main/sidebar split, dirty-state Save,
// Cancel relocation, staff-only Change status block). No Supabase access,
// no server actions — onSubmit/onStatusChange are no-ops for layout proof.

const schema = getSchema('apartment')

const baseData: FormValues = {
  listing_type: 'sale',
  property_type: 'apartment',
  title: 'Shitet apartament 2+1 në Tiranë, zonë e re',
  description: 'Apartament modern i mobiluar plotësisht, kati i 4-t, ndriçim natyror i shkëlqyer.',
  price: 125000,
  currency: 'EUR',
  condition: 'new_build',
  heating: 'central',
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
  images: [
    { url: 'https://example.com/story-cover.jpg', public_id: 'story-cover', is_cover: true, order: 0 },
  ],
}

const locations: LocationOption[] = [
  { id: 1, name_al: 'Tiranë', name_en: 'Tirana', type: 'city' },
  { id: 2, name_al: 'Durrës', name_en: 'Durres', type: 'city' },
]

function noopPatch() {}
function noopPropertyTypeChange() {}
function noopCancelClick() {}
function noopCancelDialogChange() {}
function noopConfirmCancel() {}
async function noopStatusChange() {}

const baseArgs: ListingFormShellViewProps = {
  mode: 'edit',
  data: baseData,
  errors: {},
  schema,
  locations,
  patch: noopPatch,
  onPropertyTypeChange: noopPropertyTypeChange,
  uploadPreset: 'story-preset',
  uploadFolder: 'story/listings/story-listing-1',
  submitting: false,
  submitError: '',
  isDirty: true,
  onSubmit: () => {},
  onCancelClick: noopCancelClick,
  showCancelDialog: false,
  onCancelDialogChange: noopCancelDialogChange,
  onConfirmCancel: noopConfirmCancel,
  statusControl: undefined,
}

const meta: Meta<typeof ListingFormShellView> = {
  title: 'Listings/ListingFormShellView',
  component: ListingFormShellView,
  tags: ['autodocs'],
  args: baseArgs,
}

export default meta
type Story = StoryObj<typeof ListingFormShellView>

// ── Owner mode — sidebar has Save + Cancel only, no status control ────────────
export const Owner: Story = {
  args: {
    statusControl: undefined,
  },
}

// ── Staff mode — sidebar adds the "Change status" block (StatusChangeControl) ─
export const Staff: Story = {
  args: {
    statusControl: {
      currentStatus: 'pending',
      listingId: 'story-listing-1',
      onStatusChange: noopStatusChange,
    },
  },
}
