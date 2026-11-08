/**
 * Task 952 (AC5): the listing photo upload keeps its contract after `next-cloudinary` 6 -> 7.
 *
 * The v7 release removed `onUpload` from `CldUploadWidget`; `onSuccess(results, { widget })` is the only success callback. `next-cloudinary` is replaced here by a
 * double that has the v7 shape (a component that calls its children with `{ open }` and exposes the props it was given), so these tests prove what the form
 * relies on, not what Cloudinary's script does:
 *  - the widget is given `onSuccess` and NOT the removed `onUpload`;
 *  - a successful upload calls the form's change handler with the Cloudinary URL and public id, the first photo is the cover, and an upload session keeps the photos
 *    that were already in the form (and the ones added earlier in the same session);
 *  - events that are not a success, and a result without a file, change nothing.
 * Every value is synthetic.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

type SuccessResults = { event: string; info?: unknown }
interface WidgetProps {
  uploadPreset?: string
  options?: Record<string, unknown>
  onSuccess?: (results: SuccessResults, widget: { widget: { close: () => void } }) => void
  onUpload?: unknown
  children?: (api: { open: () => void }) => React.JSX.Element
}
const widget = vi.hoisted(() => ({ props: null as unknown, opened: 0 }))
vi.mock('next-cloudinary', () => ({
  CldUploadWidget: (props: WidgetProps) => {
    widget.props = props
    return props.children?.({ open: () => { widget.opened++ } }) ?? null
  },
}))

import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { ImageUpload, type ListingImage } from '../ImageUpload'

const props = () => widget.props as WidgetProps
const image = (n: number, over: Partial<ListingImage> = {}): ListingImage => ({ url: `https://res.cloudinary.com/demo/image/upload/p${n}.jpg`, public_id: `folder/p${n}`, is_cover: n === 1, order: n - 1, ...over })
const success = (n: number): SuccessResults => ({ event: 'success', info: { secure_url: `https://res.cloudinary.com/demo/image/upload/new${n}.jpg`, public_id: `folder/new${n}` } })
const closeWidget = { widget: { close: () => undefined } }

function mount(images: ListingImage[], onChange = vi.fn(), extra: Partial<React.ComponentProps<typeof ImageUpload>> = {}) {
  render(<MantineProvider theme={theme} env="test"><ImageUpload images={images} onChange={onChange} uploadPreset="preset" uploadFolder="user/listings" {...extra} /></MantineProvider>)
  return onChange
}

/** the dashed upload button (its text is the key of the empty state or of the add-more state) */
const uploadButton = () => screen.getByText(/^(upload_photos|add_more_photos)$/).closest('button') as HTMLButtonElement

beforeEach(() => { setViewport(1024); widget.props = null; widget.opened = 0 })   // Mantine's provider reads matchMedia, which jsdom lacks

describe('ImageUpload with next-cloudinary 7', () => {
  it('[AC5] gives the widget onSuccess, never the removed onUpload, and the upload options of the form', () => {
    mount([image(1)])
    expect(typeof props().onSuccess).toBe('function')
    expect('onUpload' in (props() as object)).toBe(false)
    expect(props().uploadPreset).toBe('preset')
    expect(props().options).toMatchObject({ folder: 'user/listings', multiple: true, resourceType: 'image', maxFiles: 19, cropping: false, maxFileSize: 10_000_000, clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'] })
  })

  it('[AC5] a successful upload calls the change handler with the Cloudinary URL and public id; the first photo is the cover', () => {
    const onChange = mount([])
    fireEvent.click(uploadButton())
    expect(widget.opened).toBe(1)
    props().onSuccess!(success(1), closeWidget)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith([{ url: 'https://res.cloudinary.com/demo/image/upload/new1.jpg', public_id: 'folder/new1', is_cover: true, order: 0 }])
  })

  it('[AC5] an upload session keeps the photos already in the form and the ones uploaded before it in the same session; none of them takes the cover', () => {
    const onChange = mount([image(1), image(2)])
    fireEvent.click(uploadButton())
    props().onSuccess!(success(1), closeWidget)
    props().onSuccess!(success(2), closeWidget)
    expect(onChange).toHaveBeenCalledTimes(2)
    const last = onChange.mock.calls[1][0] as ListingImage[]
    expect(last.map((i) => i.public_id)).toEqual(['folder/p1', 'folder/p2', 'folder/new1', 'folder/new2'])
    expect(last.map((i) => i.order)).toEqual([0, 1, 2, 3])
    expect(last.filter((i) => i.is_cover).map((i) => i.public_id)).toEqual(['folder/p1'])
  })

  it('[AC5] an event that is not a success, a result without a file and a text result change nothing', () => {
    const onChange = mount([])
    fireEvent.click(uploadButton())
    props().onSuccess!({ event: 'queues-end', info: { secure_url: 'https://res.cloudinary.com/demo/x.jpg', public_id: 'x' } }, closeWidget)
    props().onSuccess!({ event: 'success' }, closeWidget)
    props().onSuccess!({ event: 'success', info: 'text' }, closeWidget)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('[AC5] no widget is offered when the limit is reached or the form is disabled', () => {
    mount(Array.from({ length: 3 }, (_, i) => image(i + 1)), vi.fn(), { maxImages: 3 })
    expect(widget.props).toBeNull()
  })

  it('[AC5] no widget is offered when the form is disabled', () => {
    mount([image(1)], vi.fn(), { disabled: true })
    expect(widget.props).toBeNull()
  })
})
