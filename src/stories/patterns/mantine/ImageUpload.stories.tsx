import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { ImageUpload, type ListingImage } from '@/modules/listings/components/ImageUpload'
import type { CloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { fixturePhotos } from '@/stories/fixtures/listingPhotos.fixture'

// Task 957 (owner rule 2026-11-19): the listing photo widget on canonical Mantine (`SimpleGrid`, `Card`, `ActionIcon`, `MantineBadge`, `AppImage` `upload`).
// The component is props-only; this Story owns the list in local state so the order, cover and delete controls work. The Cloudinary widget itself opens only from a click and is
// not exercised here (it needs the signature route and the Cloudinary script). The photos are the photographs of the listing card Stories (`fixturePhotos`, Revision 3, Review 3 F20), so
// every tile shows a photo. Viewport and locale come from the Storybook toolbar.
// GR-3d (Revision 3, F17): the component has no gutter of its own (it sits inside a form section card on the page), so every export is wrapped in `StoryPageGutter` on all four sides.

// Labelled fixture: the widget needs an API key (not a secret) and a cloud name when it is built, and a Storybook build has no environment. The Story never opens the widget, so no upload is made;
// Storybook resolves `next-cloudinary` to an inert stub (`.storybook/stubs/next-cloudinary.ts`), so Cloudinary's script does not load and no request is made (it used to ask Cloudinary about the
// fixture cloud name, which answered 400, and its frame took the focus from an open picker in the rendered state census).
const STORY_CLOUDINARY: CloudinaryWidgetConfig = { apiKey: 'story-api-key', cloudName: 'story-cloud' }
/** The upload that cannot be built: the page read no API key and no cloud name (Review 2 F5). */
const NO_CLOUDINARY: CloudinaryWidgetConfig = { apiKey: '', cloudName: '' }

function Demo({ initial, maxImages, disabled, listingId, cloudinary = STORY_CLOUDINARY }: { initial: ListingImage[]; maxImages?: number; disabled?: boolean; listingId?: string; cloudinary?: CloudinaryWidgetConfig }) {
  const [images, setImages] = useState(initial)
  return (
    <StoryPageGutter>
      <ImageUpload images={images} onChange={setImages} maxImages={maxImages} disabled={disabled} listingId={listingId} cloudinary={cloudinary} />
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

/** The upload cannot be built (no API key or cloud name on the server): the error state says so in place of the upload button (Review 2 F5). */
export const UploadUnavailable: Story = {
  render: () => <Demo initial={fixturePhotos(2)} cloudinary={NO_CLOUDINARY} />,
}
