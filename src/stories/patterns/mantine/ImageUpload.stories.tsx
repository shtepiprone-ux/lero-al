import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { ImageUpload, type ListingImage } from '@/modules/listings/components/ImageUpload'
import type { PendingPhoto } from '@/modules/listings/lib/uploadQueue'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { fixturePhotos } from '@/stories/fixtures/listingPhotos.fixture'

// Task 957 (owner rule 2026-11-19): the listing photo section on canonical Mantine (`SimpleGrid`, `Card`, `ActionIcon`, `MantineBadge`, `AppImage` `upload`, `MantineProgress`).
// The component is props-only; this Story owns the list in local state so the order, cover and delete controls work. Task 1038: the photos the person chooses are made smaller in the browser and
// uploaded straight to R2 by a queue that opens only from a click on the file picker, so it is not exercised here; the states of the tiles that are still being made, being uploaded or that
// failed are drawn from `pendingPreview` (the component's Stories-only prop), with nothing uploaded. The photos are the photographs of the listing card Stories (`fixturePhotos`, Revision 3,
// Review 3 F20), so every stored tile shows a photo. Viewport and locale come from the Storybook toolbar.
// GR-3d (Revision 3, F17): the component has no gutter of its own (it sits inside a form section card on the page), so every export is wrapped in `StoryPageGutter` on all four sides.

function Demo({ initial, maxImages, disabled, listingId, pendingPreview }: { initial: ListingImage[]; maxImages?: number; disabled?: boolean; listingId?: string; pendingPreview?: readonly PendingPhoto[] }) {
  const [images, setImages] = useState(initial)
  return (
    <StoryPageGutter>
      <ImageUpload images={images} onChange={setImages} maxImages={maxImages} disabled={disabled} listingId={listingId} pendingPreview={pendingPreview} />
    </StoryPageGutter>
  )
}

const meta: Meta<typeof ImageUpload> = {
  title: 'Patterns/Mantine/ImageUpload',
  component: ImageUpload,
  tags: ['autodocs'],
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof ImageUpload>

/** No photo yet: the upload button with its hint under it. */
export const Empty: Story = {
  render: () => <Demo initial={[]} />,
}

/** Four photos: the number on each, the cover mark and a primary border on the cover tile, the set-as-cover and delete controls on the photo top right, the order controls under it. */
export const WithPhotos: Story = {
  render: () => <Demo initial={fixturePhotos(4)} listingId="story-listing-1" />,
}

/** One photo: the up and down controls are disabled, the cover cannot be set again. */
export const SinglePhoto: Story = {
  render: () => <Demo initial={fixturePhotos(1)} />,
}

/** The photo limit is reached: no upload button, the limit hint instead. */
export const LimitReached: Story = {
  render: () => <Demo initial={fixturePhotos(3)} maxImages={3} />,
}

/** The form is being saved (the `disabled` prop, which the form sets while it saves, `submitting`): the photos are shown, the upload button and every photo control are disabled, so nothing can change after the form data was read. */
export const Saving: Story = {
  render: () => <Demo initial={fixturePhotos(2)} disabled />,
}

/** Task 1038: a photo just chosen is being made smaller in the browser (the number on the empty frame, the state text under it). */
export const Processing: Story = {
  render: () => <Demo initial={fixturePhotos(2)} pendingPreview={[{ id: 'p1', state: 'processing', progress: 0 }]} />,
}

/** Task 1038: a photo is being sent to R2 (the state text with the percent, the progress bar under the frame). */
export const Uploading: Story = {
  render: () => <Demo initial={fixturePhotos(2)} pendingPreview={[{ id: 'p1', state: 'uploading', progress: 60 }]} />,
}

/** Task 1038: a photo failed (the reason, a retry button and a remove control on the frame). */
export const Failed: Story = {
  render: () => <Demo initial={fixturePhotos(2)} pendingPreview={[{ id: 'p1', state: 'failed', progress: 0, failure: 'processing' }]} />,
}

/** Task 1038: a batch where one photo is stored, one is processing, one is uploading and two failed for different reasons (a network failure and a photo the browser cannot read). */
export const Partial: Story = {
  render: () => (
    <Demo
      initial={fixturePhotos(1)}
      pendingPreview={[
        { id: 'p1', state: 'processing', progress: 0 },
        { id: 'p2', state: 'uploading', progress: 35 },
        { id: 'p3', state: 'failed', progress: 0, failure: 'network' },
        { id: 'p4', state: 'failed', progress: 0, failure: 'format' },
      ]}
    />
  ),
}

/** Task 1038: the limit counts the photos still in progress: three slots, one stored and two in progress leave none, so there is no upload button. */
export const LimitWithPending: Story = {
  render: () => <Demo initial={fixturePhotos(1)} maxImages={3} pendingPreview={[{ id: 'p1', state: 'uploading', progress: 20 }, { id: 'p2', state: 'failed', progress: 0, failure: 'too_large' }]} />,
}
