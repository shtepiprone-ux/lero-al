/**
 * The listing photo upload: the contract of the form's photo section (Task 952 AC5, Task 957, Task 1038).
 *
 * Task 1038 replaced the Cloudinary widget with a file input: the browser makes the photos smaller and uploads them straight to R2 through a queue (`uploadQueue.ts`, tested in `uploadQueue.test.ts`;
 * `photoPipeline.ts`, tested in `photoPipeline.test.ts`). Revision 1 (R1-2, Review 1 F2) rewrote this file for the file input. The queue is the one double here (`createUploadQueue`): it records what the
 * component hands it (`add`, `retry`, `remove`) and lets a test emit the list of photos in progress, so these tests prove what the form relies on, not what the pipeline or the network does:
 *  - the file input takes JPEG, PNG and WebP, several at once, and the files chosen go to the queue, never more than the room that is left (the 20-photo limit counts the photos still in progress);
 *  - a photo the queue finished joins the form's list with its address, the first photo is the cover, a session keeps the photos that were already in the form (and the ones added earlier in the same session),
 *    and a photo that is not finished or has no address changes nothing;
 *  - every reason a photo is not uploaded has its own text under the tile, with retry and remove, and the controls are disabled while the form is saved;
 *  - the upload button opens the file input, and while the form is saved it is disabled and opens nothing (Revision 1 R1-3);
 *  - the grid keeps its controls, order, cover, delete and disabled-while-saving behaviour of `main`.
 * What `main` asserted about the widget has its counterpart for the file input in each case above; the `cloudinary` prop is no longer read. Every value is synthetic.
 */
import React, { useState } from 'react'
import { MantineProvider } from '@mantine/core'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('next-intl', () => ({
  useLocale: () => 'uk',
  useTranslations: () => (key: string, values?: Record<string, unknown>) => (values && 'n' in values ? `${key}#${String(values.n)}` : values && 'size' in values ? `${key}:${String(values.size)}:${String(values.allowed)}` : key),
}))
const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast: toastMock }))

type QueueOptions = { listingId?: string; onChange: (items: readonly PendingPhoto[]) => void }
const queue = vi.hoisted(() => ({ created: [] as unknown[], add: vi.fn(), retry: vi.fn(), remove: vi.fn() }))
vi.mock('@/modules/listings/lib/uploadQueue', () => ({
  createUploadQueue: (options: unknown) => {
    queue.created.push(options)
    return { add: queue.add, retry: queue.retry, remove: queue.remove, items: () => [], idle: () => Promise.resolve() }
  },
}))

import { theme } from '@/design-system/mantine/theme'
import { BADGE_COUNT_EMPHASIS, BADGE_STATUS_REGISTRY } from '@/design-system/mantine/badgeTones'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import type { PendingPhoto } from '@/modules/listings/lib/uploadQueue'
import type { UploadFailure } from '@/modules/listings/lib/uploadFailure'
import { ImageUpload, type ListingImage } from '../ImageUpload'

const image = (n: number, over: Partial<ListingImage> = {}): ListingImage => ({ url: `https://res.cloudinary.com/demo/image/upload/p${n}.jpg`, public_id: `folder/p${n}`, is_cover: n === 1, order: n - 1, ...over })
const stored = (id: string) => `https://media.lero.al/user-7/listings/${id}/full.webp`
const storedId = (id: string) => `user-7/listings/${id}/full.webp`

function mount(images: ListingImage[], onChange = vi.fn(), extra: Partial<React.ComponentProps<typeof ImageUpload>> = {}) {
  render(<MantineProvider theme={theme} env="test"><ImageUpload images={images} onChange={onChange} {...extra} /></MantineProvider>)
  return onChange
}

/** the form that owns the list: what `onChange` hands over comes back as `images`, as in the real form */
function Form({ initial, spy }: { initial: ListingImage[]; spy: (images: ListingImage[]) => void }) {
  const [images, setImages] = useState(initial)
  return <MantineProvider theme={theme} env="test"><ImageUpload images={images} onChange={(next) => { spy(next); setImages(next) }} /></MantineProvider>
}

/** the upload button (its text is the key of the empty state or of the add-more state) */
const uploadButton = () => screen.getByText(/^(upload_photos|add_more_photos( \(\d+\/\d+\))?)$/).closest('button') as HTMLButtonElement
const fileInput = () => screen.getByTestId('photo-file-input') as HTMLInputElement
const file = (name: string, type = 'image/jpeg') => new File([new Uint8Array(4)], name, { type })
const choose = (...files: File[]) => fireEvent.change(fileInput(), { target: { files } })
const photo = (id: string, state: PendingPhoto['state'], over: Partial<PendingPhoto> = {}): PendingPhoto => ({ id, state, progress: state === 'uploading' ? 60 : state === 'done' ? 100 : 0, ...over })
/** the queue tells the form what is in progress (the list `createUploadQueue`'s `onChange` receives) */
const emit = (items: readonly PendingPhoto[]) => act(() => { (queue.created.at(-1) as QueueOptions).onChange(items) })

beforeEach(() => {
  setViewport(1024)   // Mantine's provider reads matchMedia, which jsdom lacks
  queue.created = []
  queue.add.mockReset()
  queue.retry.mockReset()
  queue.remove.mockReset()
  toastMock.error.mockReset()
})
afterEach(() => { vi.unstubAllEnvs() })

describe('ImageUpload with the file input (Task 1038)', () => {
  it('[AC5] gives the browser a hidden file input for JPEG, PNG and WebP, several files at once, and nothing else: no widget, no preset, no folder', () => {
    mount([image(1)])
    const input = fileInput()
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/jpeg,image/png,image/webp')
    expect(input.multiple).toBe(true)
    expect(input.hidden).toBe(true)
    expect(input.getAttribute('capture')).toBeNull()
    expect(document.querySelector('script[src*="cloudinary"]')).toBeNull()
    expect('cloudinary' in window).toBe(false)
  })

  it('[AC5] the queue is created once, for the listing being edited (its photos go into that listing\'s folder), and for no listing on a new one', () => {
    mount([], vi.fn(), { listingId: 'l1' })
    expect(queue.created).toHaveLength(1)
    expect((queue.created[0] as QueueOptions).listingId).toBe('l1')
    cleanup()
    queue.created = []
    mount([])
    expect(queue.created).toHaveLength(1)
    expect((queue.created[0] as QueueOptions).listingId).toBeUndefined()
  })

  it('[AC5] the files chosen go to the queue as they are, and the input is cleared so the same file can be chosen again', () => {
    mount([image(1)])
    const a = file('a.jpg')
    const b = file('b.webp', 'image/webp')
    choose(a, b)
    expect(queue.add).toHaveBeenCalledTimes(1)
    expect(queue.add).toHaveBeenCalledWith([a, b])
    expect(fileInput().value).toBe('')
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('[AC5] a closed file dialog (no file) adds nothing and says nothing', () => {
    mount([])
    choose()
    expect(queue.add).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('[AC5] more files than the room that is left: the first ones that fit go to the queue and the limit is told once', () => {
    mount(Array.from({ length: 18 }, (_, i) => image(i + 1)))
    const files = [file('a.jpg'), file('b.jpg'), file('c.jpg')]
    choose(...files)
    expect(queue.add).toHaveBeenCalledWith([files[0], files[1]])
    expect(toastMock.error).toHaveBeenCalledTimes(1)
    expect(toastMock.error).toHaveBeenCalledWith('upload_widget_max_files')
  })

  it('[AC5] the 20-photo limit counts the photos still in progress: stored and pending photos together leave the room that is left, and no button when none is', () => {
    mount([image(1)], vi.fn(), { maxImages: 4 })
    emit([photo('p1', 'processing'), photo('p2', 'uploading')])
    expect(uploadButton().textContent).toBe('add_more_photos (3/4)')
    const files = [file('a.jpg'), file('b.jpg')]
    choose(...files)
    expect(queue.add).toHaveBeenLastCalledWith([files[0]])
    expect(toastMock.error).toHaveBeenCalledWith('upload_widget_max_files')
    emit([photo('p1', 'processing'), photo('p2', 'uploading'), photo('p3', 'failed', { failure: 'network' })])
    expect(screen.queryByText(/^add_more_photos/)).toBeNull()
    expect(screen.getByText('photos_hint')).toBeTruthy()
  })

  it('[AC5] the limit defaults to 20 photos', () => {
    mount(Array.from({ length: 19 }, (_, i) => image(i + 1)))
    expect(uploadButton().textContent).toBe('add_more_photos (19/20)')
    emit([photo('p1', 'processing')])
    expect(screen.queryByText(/^add_more_photos/)).toBeNull()
  })

  it('[AC5] the Cloudinary configuration of the page is no longer read: the file input and the button show, and no "unavailable" message, whatever the prop holds', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'from-the-environment')
    mount([image(1)], vi.fn(), { cloudinary: { apiKey: '', cloudName: '' } })
    expect(fileInput()).toBeTruthy()
    expect(uploadButton().disabled).toBe(false)
    expect(screen.getAllByRole('button', { name: 'remove_photo#1' })).toHaveLength(1)
    expect(screen.queryByText('upload_unavailable_title')).toBeNull()
  })

  it('[AC5] when the limit is reached the file input is still rendered but there is no button, and the grid and its controls still show', () => {
    mount(Array.from({ length: 3 }, (_, i) => image(i + 1)), vi.fn(), { maxImages: 3 })
    expect(screen.queryByText(/^add_more_photos/)).toBeNull()
    expect(screen.getAllByRole('button', { name: /^remove_photo#/ })).toHaveLength(3)
  })
})

describe('the upload button opens the file input (Task 1038 R1-3)', () => {
  let clicked: MockInstance<HTMLInputElement['click']>
  // the browser would open its file dialog: the spy records the click and stops it there
  beforeEach(() => { clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined) })
  afterEach(() => { clicked.mockRestore() })

  it('[AC5] the button of the empty state opens the file input once, and starts no upload by itself', () => {
    mount([])
    expect(uploadButton().textContent).toBe('upload_photos')
    fireEvent.click(uploadButton())
    expect(clicked).toHaveBeenCalledTimes(1)
    expect(clicked.mock.contexts[0]).toBe(fileInput())
    expect(queue.add).not.toHaveBeenCalled()
  })

  it('[AC5] the add-more button of a form with photos opens the file input once', () => {
    mount([image(1), image(2)])
    expect(uploadButton().textContent).toBe('add_more_photos (2/20)')
    fireEvent.click(uploadButton())
    expect(clicked).toHaveBeenCalledTimes(1)
    expect(clicked.mock.contexts[0]).toBe(fileInput())
  })

  it('[AC5] while the form is saved the button is shown disabled and opens nothing, for both states of the button', () => {
    mount([], vi.fn(), { disabled: true })
    expect(uploadButton().disabled).toBe(true)
    fireEvent.click(uploadButton())
    cleanup()
    mount([image(1)], vi.fn(), { disabled: true })
    expect(uploadButton().disabled).toBe(true)
    fireEvent.click(uploadButton())
    expect(clicked).not.toHaveBeenCalled()
    expect(queue.add).not.toHaveBeenCalled()
  })

  it('[AC5] the button of a form that is not saved is enabled (the check above is not vacuous)', () => {
    mount([image(1)])
    expect(uploadButton().disabled).toBe(false)
  })
})

describe('a photo the queue finished joins the form (Task 1038)', () => {
  it('[AC5] a finished photo calls the change handler with its address and its stored path as the id; the first photo is the cover; the queue forgets it', () => {
    const onChange = mount([])
    emit([photo('p1', 'done', { publicUrl: stored('u1') })])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith([{ url: stored('u1'), public_id: storedId('u1'), is_cover: true, order: 0 }])
    expect(queue.remove).toHaveBeenCalledWith('p1')
  })

  it('[AC5] a session keeps the photos already in the form and the ones added earlier in the same session; none of them takes the cover', () => {
    const spy = vi.fn()
    render(<Form initial={[image(1), image(2)]} spy={spy} />)
    emit([photo('p1', 'done', { publicUrl: stored('u1') })])
    emit([photo('p2', 'done', { publicUrl: stored('u2') })])
    expect(spy).toHaveBeenCalledTimes(2)
    const last = spy.mock.calls[1][0] as ListingImage[]
    expect(last.map((i) => i.public_id)).toEqual(['folder/p1', 'folder/p2', storedId('u1'), storedId('u2')])
    expect(last.map((i) => i.order)).toEqual([0, 1, 2, 3])
    expect(last.filter((i) => i.is_cover).map((i) => i.public_id)).toEqual(['folder/p1'])
    expect(queue.remove.mock.calls.map((c) => c[0])).toEqual(['p1', 'p2'])
  })

  it('[AC5] two photos finished together join together, in the order the queue lists them', () => {
    const onChange = mount([image(1)])
    emit([photo('p1', 'done', { publicUrl: stored('u1') }), photo('p2', 'done', { publicUrl: stored('u2') })])
    const last = onChange.mock.calls.at(-1)![0] as ListingImage[]
    expect(last.map((i) => i.public_id)).toEqual(['folder/p1', storedId('u1'), storedId('u2')])
    expect(last.map((i) => i.order)).toEqual([0, 1, 2])
  })

  it('[AC5] a photo that is not finished, and a finished one without an address, change nothing', () => {
    const onChange = mount([])
    emit([photo('p1', 'processing'), photo('p2', 'uploading'), photo('p3', 'failed', { failure: 'network' }), photo('p4', 'done')])
    expect(onChange).not.toHaveBeenCalled()
    expect(queue.remove).not.toHaveBeenCalled()
  })

  it('[AC5] a finished photo that is listed again is attached once', () => {
    const onChange = mount([])
    emit([photo('p1', 'done', { publicUrl: stored('u1') })])
    emit([photo('p1', 'done', { publicUrl: stored('u1') })])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('[AC5] while the form is saved a finished photo waits, and joins when the form can be edited again', () => {
    const onChange = vi.fn()
    const tree = (disabled: boolean) => <MantineProvider theme={theme} env="test"><ImageUpload images={[]} onChange={onChange} disabled={disabled} /></MantineProvider>
    const view = render(tree(true))
    emit([photo('p1', 'done', { publicUrl: stored('u1') })])
    expect(onChange).not.toHaveBeenCalled()
    view.rerender(tree(false))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toEqual([{ url: stored('u1'), public_id: storedId('u1'), is_cover: true, order: 0 }])
  })

  // Task 953 (refs): the callback of the latest render receives the result, not the one of the render the photo was started in.
  it('[AC5] a photo that finishes after a re-render reports to the latest change handler only', () => {
    const first = vi.fn()
    const second = vi.fn()
    const tree = (onChange: typeof first) => <MantineProvider theme={theme} env="test"><ImageUpload images={[]} onChange={onChange} /></MantineProvider>
    const view = render(tree(first))
    view.rerender(tree(second))
    emit([photo('p1', 'done', { publicUrl: stored('u1') })])
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})

// Task 957 (AC15): the photo grid's controls on Mantine keep the behaviour of the legacy grid: order, cover and delete
describe('ImageUpload controls', () => {
  const three = () => [image(1), image(2), image(3)]
  const control = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement
  const last = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.calls.at(-1)![0] as ListingImage[]

  it('[AC15] "up" and "down" swap neighbours and renumber; the first cannot go up, the last cannot go down', () => {
    const onChange = mount(three())
    expect(control('reorder_up#1').disabled).toBe(true)
    expect(control('reorder_down#3').disabled).toBe(true)
    fireEvent.click(control('reorder_down#1'))
    expect(last(onChange).map((i) => [i.public_id, i.order])).toEqual([['folder/p2', 0], ['folder/p1', 1], ['folder/p3', 2]])
    fireEvent.click(control('reorder_up#3'))
    expect(last(onChange).map((i) => i.public_id)).toEqual(['folder/p1', 'folder/p3', 'folder/p2'])
  })

  it('[AC15] "set as cover" moves the cover mark to that photo only; the cover itself offers no such control', () => {
    const onChange = mount(three())
    expect(screen.getAllByRole('button', { name: /^set_as_cover#/ })).toHaveLength(2)
    fireEvent.click(control('set_as_cover#3'))
    expect(last(onChange).filter((i) => i.is_cover).map((i) => i.public_id)).toEqual(['folder/p3'])
  })

  it('[AC15] "remove" drops the photo, renumbers, and gives the cover to the first one left when the cover was removed', () => {
    const onChange = mount(three())
    fireEvent.click(control('remove_photo#1'))
    expect(last(onChange).map((i) => [i.public_id, i.order, i.is_cover])).toEqual([['folder/p2', 0, true], ['folder/p3', 1, false]])
    fireEvent.click(control('remove_photo#3'))
    expect(last(onChange).map((i) => i.public_id)).toEqual(['folder/p1', 'folder/p2'])
  })

  it('[AC15] the last photo removed leaves an empty list', () => {
    const onChange = mount([image(1)])
    fireEvent.click(control('remove_photo#1'))
    expect(last(onChange)).toEqual([])
  })

  it('[AC15] a full gallery shows the limit hint and no upload button', () => {
    mount(three(), vi.fn(), { maxImages: 3 })
    expect(screen.getByText('photos_hint')).toBeTruthy()
    expect(screen.queryByText(/^add_more_photos/)).toBeNull()
  })
})

// Task 957 Revision 2 (R2-4, AC21; Review 2 F5), for the file input: the button shows with both texts of its state and without the "unavailable" message, whatever the Cloudinary configuration is
describe('ImageUpload shows its upload button without any Cloudinary configuration', () => {
  it.each([
    ['the API key', { apiKey: '', cloudName: 'c' }],
    ['the cloud name', { apiKey: 'k', cloudName: '' }],
    ['both', { apiKey: '', cloudName: '' }],
  ])('[AC21] without %s the photo section shows the upload button and no error state', (_label, cloudinary) => {
    mount([], vi.fn(), { cloudinary })
    expect(screen.getByText('upload_photos')).toBeTruthy()
    expect(screen.getByText('photos_hint')).toBeTruthy()
    expect(screen.queryByText('upload_unavailable_title')).toBeNull()
    expect(screen.queryByText('upload_unavailable_description')).toBeNull()
  })

  it('[AC21] with both values the button shows and the message does not', () => {
    mount([], vi.fn(), { cloudinary: { apiKey: 'k', cloudName: 'c' } })
    expect(screen.getByText('upload_photos')).toBeTruthy()
    expect(screen.queryByText('upload_unavailable_title')).toBeNull()
    expect(screen.queryByText('upload_unavailable_description')).toBeNull()
  })

  it('[AC21] a form that is disabled or full shows no unavailable message although nothing can be added', () => {
    mount([image(1)], vi.fn(), { cloudinary: { apiKey: '', cloudName: '' }, maxImages: 1 })
    expect(screen.queryByText('upload_unavailable_title')).toBeNull()
    cleanup()
    mount([image(1)], vi.fn(), { disabled: true })
    expect(screen.queryByText('upload_unavailable_title')).toBeNull()
  })

  it('[AC21] the photos already in the form still show with the button (the grid and its controls stay)', () => {
    mount([image(1)], vi.fn(), { cloudinary: { apiKey: '', cloudName: '' } })
    expect(screen.getByRole('button', { name: 'remove_photo#1' })).toBeTruthy()
    expect(screen.getByText('add_more_photos (1/20)')).toBeTruthy()
    expect(screen.queryByText('upload_unavailable_title')).toBeNull()
  })
})

// Task 957 Revision 2 (R2-6, AC22; Review 2 F10; owner decision O997-2, 2026-11-21: every refused photo names its reason), for the tiles of Task 1038: the reason of each failure is told under its tile, not in a toast
describe('ImageUpload tells why a photo was not uploaded', () => {
  const REASONS: Record<UploadFailure, string> = {
    session: 'upload_error_session',
    forbidden: 'upload_error_forbidden',
    rate_limited: 'upload_error_rate_limited',
    rate_limited_day: 'upload_error_rate_limited_day',
    not_configured: 'upload_error_not_configured',
    unavailable: 'upload_error_unavailable',
    network: 'upload_error_network',
    too_large: 'upload_error_too_large',
    format: 'upload_error_format',
    rejected: 'upload_error_rejected',
    provider_busy: 'upload_error_provider_busy',
    failed: 'upload_error_failed',
    processing: 'upload_error_processing',
  }
  const tiles = () => screen.getAllByTestId('pending-photo')

  it.each(Object.entries(REASONS))('[AC22] a photo that failed with "%s" shows its own text %s, the photo number, and a retry and a remove control', (failure, key) => {
    mount([image(1)])
    emit([photo('p1', 'failed', { failure: failure as UploadFailure })])
    const tile = tiles()[0]
    expect(tile.getAttribute('data-state')).toBe('failed')
    expect(within(tile).getByText('photo_state_failed#2')).toBeTruthy()
    expect(within(tile).getByRole('alert').textContent).toBe(key)
    expect(within(tile).getByRole('button', { name: 'photo_retry#2' })).toBeTruthy()
    expect(within(tile).getByRole('button', { name: 'remove_photo#2' })).toBeTruthy()
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('[AC22] a failure without a reason is the general one', () => {
    mount([])
    emit([photo('p1', 'failed')])
    expect(within(tiles()[0]).getByRole('alert').textContent).toBe('upload_error_failed')
  })

  it('[AC22] several photos that failed each show their own reason under their own tile, numbered after the stored photos, and no toast is raised for them', () => {
    mount([image(1), image(2)])
    emit([photo('p1', 'failed', { failure: 'rate_limited' }), photo('p2', 'failed', { failure: 'rate_limited_day' }), photo('p3', 'failed', { failure: 'format' })])
    expect(tiles()).toHaveLength(3)
    expect(tiles().map((t) => within(t).getByText(/^photo_state_failed#/).textContent)).toEqual(['photo_state_failed#3', 'photo_state_failed#4', 'photo_state_failed#5'])
    expect(tiles().map((t) => within(t).getByRole('alert').textContent)).toEqual(['upload_error_rate_limited', 'upload_error_rate_limited_day', 'upload_error_format'])
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('[AC22] retry asks the queue to run that photo again, remove drops it from the queue; neither changes the form\'s list', () => {
    const onChange = mount([image(1)])
    emit([photo('p1', 'failed', { failure: 'network' }), photo('p2', 'failed', { failure: 'format' })])
    fireEvent.click(screen.getByRole('button', { name: 'photo_retry#3' }))
    expect(queue.retry).toHaveBeenCalledTimes(1)
    expect(queue.retry).toHaveBeenCalledWith('p2')
    fireEvent.click(screen.getByRole('button', { name: 'remove_photo#2' }))
    expect(queue.remove).toHaveBeenCalledTimes(1)
    expect(queue.remove).toHaveBeenCalledWith('p1')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('[AC22] a photo being made smaller shows its state text, and a photo being sent shows a progress bar with its percent; neither has a retry or a remove control', () => {
    mount([image(1)])
    emit([photo('p1', 'processing'), photo('p2', 'uploading', { progress: 60 })])
    const [processing, uploading] = tiles()
    expect(processing.getAttribute('data-state')).toBe('processing')
    expect(within(processing).getByText('photo_state_processing#2')).toBeTruthy()
    expect(uploading.getAttribute('data-state')).toBe('uploading')
    expect(within(uploading).getByText('photo_state_uploading#3')).toBeTruthy()
    expect(within(uploading).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('60')
    for (const tile of [processing, uploading]) {
      expect(within(tile).queryByRole('button')).toBeNull()
      expect(within(tile).queryByRole('alert')).toBeNull()
    }
  })

  it('[AC22] the retry and remove controls of a failed photo are disabled while the form is saved, and do nothing', () => {
    mount([image(1)], vi.fn(), { disabled: true })
    emit([photo('p1', 'failed', { failure: 'network' })])
    const retry = screen.getByRole('button', { name: 'photo_retry#2' }) as HTMLButtonElement
    const remove = screen.getByRole('button', { name: 'remove_photo#2' }) as HTMLButtonElement
    expect(retry.disabled).toBe(true)
    expect(remove.disabled).toBe(true)
    fireEvent.click(retry)
    fireEvent.click(remove)
    expect(queue.retry).not.toHaveBeenCalled()
    expect(queue.remove).not.toHaveBeenCalled()
  })

  it('[AC22] the tiles for the Stories (`pendingPreview`) are drawn like the queue\'s, and nothing is uploaded', () => {
    mount([image(1)], vi.fn(), { pendingPreview: [photo('s1', 'failed', { failure: 'too_large' }), photo('s2', 'uploading', { progress: 35 })] })
    expect(tiles()).toHaveLength(2)
    expect(within(tiles()[0]).getByRole('alert').textContent).toBe('upload_error_too_large')
    expect(within(tiles()[1]).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('35')
    expect(queue.add).not.toHaveBeenCalled()
  })
})

// Task 957 Revision 3 (R3-6, AC31, AC32; Review 3 F21, F22, F23; owner decisions O957-7 and O957-8, 2026-11-21)
describe('the photo tile', () => {
  const three = () => [image(1), image(2), image(3)]
  const tileOf = (name: string) => screen.getByRole('button', { name }).closest('.mantine-Card-root') as HTMLElement
  /** the frame of the photo: the element that holds the `img` and everything drawn on it */
  const frameOf = (tile: HTMLElement) => tile.querySelector('img')!.parentElement as HTMLElement
  const follows = (a: HTMLElement, b: HTMLElement) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

  it('[AC31] the set-as-cover and delete controls sit on the photo, top right, cover before delete; the cover tile has no cover control', () => {
    mount(three())
    for (const n of [2, 3]) {
      const tile = tileOf(`remove_photo#${n}`)
      const frame = frameOf(tile)
      const cover = screen.getByRole('button', { name: `set_as_cover#${n}` })
      const remove = screen.getByRole('button', { name: `remove_photo#${n}` })
      expect(frame.contains(cover), `photo ${n}: cover control on the photo`).toBe(true)
      expect(frame.contains(remove), `photo ${n}: delete control on the photo`).toBe(true)
      expect(follows(cover, remove), `photo ${n}: cover before delete`).toBe(true)
      expect(cover.parentElement, `photo ${n}: one group`).toBe(remove.parentElement)
    }
    const coverTile = tileOf('remove_photo#1')
    expect(frameOf(coverTile).contains(screen.getByRole('button', { name: 'remove_photo#1' }))).toBe(true)
    expect(screen.queryByRole('button', { name: 'set_as_cover#1' })).toBeNull()
  })

  it('[AC31] the number and the cover badge stay on the photo, top left, before the controls', () => {
    mount(three())
    const frame = frameOf(tileOf('remove_photo#1'))
    const number = within(frame).getByText('1')
    const mark = within(frame).getByText('cover_photo')
    const remove = screen.getByRole('button', { name: 'remove_photo#1' })
    expect(follows(number, mark)).toBe(true)
    expect(follows(mark, remove)).toBe(true)
  })

  it('[AC31] up and down share one row under the photo, each stretched to half of the tile (a growing group), with no other control in it', () => {
    mount(three())
    for (const n of [1, 2, 3]) {
      const tile = tileOf(`remove_photo#${n}`)
      const up = screen.getByRole('button', { name: `reorder_up#${n}` })
      const down = screen.getByRole('button', { name: `reorder_down#${n}` })
      expect(frameOf(tile).contains(up) || frameOf(tile).contains(down), `photo ${n}: under the photo`).toBe(false)
      expect(up.parentElement, `photo ${n}: one row`).toBe(down.parentElement)
      expect(up.parentElement!.getAttribute('data-grow'), `photo ${n}: stretched`).toBe('true')
      expect(up.parentElement!.querySelectorAll('button')).toHaveLength(2)
    }
  })

  it('[AC31] every tile keeps the same arrangement: the same controls in the same places, whatever the photo', () => {
    mount(three())
    const shape = (n: number) => {
      const tile = tileOf(`remove_photo#${n}`)
      const frame = frameOf(tile)
      return { onPhoto: [...frame.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')!.replace(/#\d+$/, '')), underPhoto: [...tile.querySelectorAll('button')].filter((b) => !frame.contains(b)).map((b) => b.getAttribute('aria-label')!.replace(/#\d+$/, '')) }
    }
    expect(shape(2)).toEqual(shape(3))
    expect(shape(2).underPhoto).toEqual(['reorder_up', 'reorder_down'])
    expect(shape(1).underPhoto).toEqual(['reorder_up', 'reorder_down'])
    expect(shape(2).onPhoto).toEqual(['set_as_cover', 'remove_photo'])
    expect(shape(1).onPhoto).toEqual(['remove_photo'])
  })

  it('[AC31] the cover tile, and only it, carries the canonical selected look (the Card theme variant "selected")', () => {
    mount(three())
    expect(tileOf('remove_photo#1').getAttribute('data-variant')).toBe('selected')
    expect(tileOf('remove_photo#2').getAttribute('data-variant')).toBeNull()
    expect(tileOf('remove_photo#3').getAttribute('data-variant')).toBeNull()
  })

  // The theme applies the look as inline style on the card (a measured defect of the first version: the border was 2px wide but kept the default grey, because Paper's `withBorder` colour is its own)
  it('[AC31] the selected look is a primary border plus a 1px outer ring (the 2px frame of main without a size change); the other tiles carry neither', () => {
    mount(three())
    const style = (n: number) => tileOf(`remove_photo#${n}`).getAttribute('style') ?? ''
    expect(style(1)).toContain('border-color: var(--mantine-primary-color-filled)')
    expect(style(1)).toMatch(/outline: calc\(0\.125rem - 0\.0625rem\) solid var\(--mantine-primary-color-filled\)/)
    for (const n of [2, 3]) {
      expect(style(n)).not.toContain('outline')
      expect(style(n)).not.toContain('border-color')
    }
  })

  it('[AC31] the delete control over the photo is the canonical one with the filled look', () => {
    mount(three())
    expect(screen.getByRole('button', { name: 'remove_photo#2' }).getAttribute('data-variant')).toBe('filled')
  })

  it('[AC31] the controls over a photo and under it are disabled while the form is saved', () => {
    mount(three(), vi.fn(), { disabled: true })
    for (const n of [1, 2, 3]) for (const key of ['reorder_up', 'reorder_down', 'remove_photo']) expect((screen.getByRole('button', { name: `${key}#${n}` }) as HTMLButtonElement).disabled, `${key} ${n}`).toBe(true)
  })

  it('[AC32] the number badge is the canonical count badge and the cover badge the canonical photoMark badge, both the same pill: no circle, so the number has the size of the Cover pill (owner, 2026-11-21)', () => {
    mount(three())
    const frame = frameOf(tileOf('remove_photo#1'))
    const number = within(frame).getByText('1').closest('.mantine-Badge-root') as HTMLElement
    const mark = within(frame).getByText('cover_photo').closest('.mantine-Badge-root') as HTMLElement
    const count = BADGE_COUNT_EMPHASIS.brand
    expect(number.getAttribute('data-circle')).toBeNull()
    // the theme gives a pill (not a circle) its own height and padding: the same inline rules on both, so the same height
    const sizeRules = (el: HTMLElement) => ['min-height: var(--badge-height)', 'padding: 0.125rem 0.5rem', 'line-height: 1.125rem'].map((rule) => (el.getAttribute('style') ?? '').includes(rule))
    expect(sizeRules(number)).toEqual([true, true, true])
    expect(sizeRules(mark)).toEqual([true, true, true])
    expect(number.getAttribute('data-variant')).toBe(count.variant)
    expect(number.getAttribute('style')).toContain(`--badge-bg: var(--mantine-color-${count.color}-filled)`)
    const photoMark = BADGE_STATUS_REGISTRY.photoMark.cover
    expect(mark.getAttribute('data-circle')).toBeNull()
    expect(mark.getAttribute('style')).toContain(`--badge-bg: var(--mantine-color-${photoMark.color}-filled)`)
  })
})

// Task 957 Revision 2 (R2-7, AC23; Review 2 F11, F12): nothing changes while the form is saved, and every photo control names its photo
describe('ImageUpload names and disables its controls', () => {
  const three = () => [image(1), image(2), image(3)]

  it('[AC23] the four controls of photo 2 are found by names that carry "2", and no two controls of the grid share a name', () => {
    mount(three())
    for (const key of ['reorder_up', 'reorder_down', 'set_as_cover', 'remove_photo']) expect(screen.getByRole('button', { name: `${key}#2` })).toBeTruthy()
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent ?? '')
    const photoControls = names.filter((n) => /#\d$/.test(n))
    expect(photoControls.length).toBe(11)
    expect(new Set(photoControls).size).toBe(photoControls.length)
  })

  it('[AC23] disabled: the upload button is shown disabled and opens no file dialog, and every photo control is disabled; the clicks change nothing', () => {
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
    try {
      const onChange = mount(three(), vi.fn(), { disabled: true })
      expect(uploadButton().disabled).toBe(true)
      fireEvent.click(uploadButton())
      expect(clicked).not.toHaveBeenCalled()
      const controls = screen.getAllByRole('button').filter((b) => /#\d$/.test(b.getAttribute('aria-label') ?? '')) as HTMLButtonElement[]
      expect(controls.length).toBe(11)
      expect(controls.filter((b) => !b.disabled).map((b) => b.getAttribute('aria-label'))).toEqual([])
      for (const b of controls) fireEvent.click(b)
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      clicked.mockRestore()
    }
  })

  it('[AC23] not disabled: the same controls are enabled (the check above is not vacuous)', () => {
    mount(three())
    const enabled = (screen.getAllByRole('button') as HTMLButtonElement[]).filter((b) => /#\d$/.test(b.getAttribute('aria-label') ?? '') && !b.disabled)
    expect(enabled.length).toBeGreaterThan(5)
  })
})
