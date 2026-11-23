/**
 * Task 952 (AC5): the listing photo upload keeps its contract after `next-cloudinary` 6 -> 7.
 *
 * The v7 release removed `onUpload` from `CldUploadWidget`; `onSuccess(results, { widget })` is the only success callback. `next-cloudinary` is replaced here by a
 * double that has the v7 shape (a component that calls its children with `{ open }` and exposes the props it was given), so these tests prove what the form
 * relies on, not what Cloudinary's script does:
 *  - the widget is given `onSuccess` and NOT the removed `onUpload`;
 *  - Task 957 (AC5): the widget is given NO public preset and NO folder; `prepareUploadParams` asks the server route for one signature per photo ({ listingId } or {}) and
 *    hands the answer to the widget, and a refused or failed request cancels that upload;
 *  - Task 957 Revision 1 (AC5): the widget's cloud config is the API key and the cloud name of the prop, and no widget is offered when either is empty (the real library, with every
 *    Cloudinary variable unset, is run in `ImageUpload.widgetOptions.test.tsx`);
 *  - a successful upload calls the form's change handler with the Cloudinary URL and public id, the first photo is the cover, and an upload session keeps the photos
 *    that were already in the form (and the ones added earlier in the same session);
 *  - events that are not a success, and a result without a file, change nothing.
 * Every value is synthetic.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useLocale: () => 'uk',
  useTranslations: () => (key: string, values?: Record<string, unknown>) => (values && 'n' in values ? `${key}#${String(values.n)}` : values && 'size' in values ? `${key}:${String(values.size)}:${String(values.allowed)}` : key),
}))
const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast: toastMock }))

type SuccessResults = { event: string; info?: unknown }
interface WidgetProps {
  uploadPreset?: string
  config?: { cloud?: { apiKey?: string; cloudName?: string } }
  options?: Record<string, unknown>
  onSuccess?: (results: SuccessResults, widget: { widget: { close: () => void } }) => void
  onError?: (error: unknown, widget: unknown) => void
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
import { BADGE_COUNT_EMPHASIS, BADGE_STATUS_REGISTRY } from '@/design-system/mantine/badgeTones'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { ImageUpload, type ListingImage } from '../ImageUpload'

const props = () => widget.props as WidgetProps
const image = (n: number, over: Partial<ListingImage> = {}): ListingImage => ({ url: `https://res.cloudinary.com/demo/image/upload/p${n}.jpg`, public_id: `folder/p${n}`, is_cover: n === 1, order: n - 1, ...over })
const success = (n: number): SuccessResults => ({ event: 'success', info: { secure_url: `https://res.cloudinary.com/demo/image/upload/new${n}.jpg`, public_id: `folder/new${n}` } })
const closeWidget = { widget: { close: () => undefined } }

function mount(images: ListingImage[], onChange = vi.fn(), extra: Partial<React.ComponentProps<typeof ImageUpload>> = {}) {
  render(<MantineProvider theme={theme} env="test"><ImageUpload images={images} onChange={onChange} cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} {...extra} /></MantineProvider>)
  return onChange
}

/** the upload button (its text is the key of the empty state or of the add-more state) */
const uploadButton = () => screen.getByText(/^(upload_photos|add_more_photos( \(\d+\/\d+\))?)$/).closest('button') as HTMLButtonElement

beforeEach(() => { setViewport(1024); widget.props = null; widget.opened = 0; toastMock.error.mockReset() })   // Mantine's provider reads matchMedia, which jsdom lacks
afterEach(() => { vi.unstubAllEnvs() })

describe('ImageUpload with next-cloudinary 7', () => {
  it('[AC5] gives the widget onSuccess, never the removed onUpload, no public preset and no folder, and the upload options of the form', () => {
    mount([image(1)])
    expect(typeof props().onSuccess).toBe('function')
    expect('onUpload' in (props() as object)).toBe(false)
    expect('uploadPreset' in (props() as object)).toBe(false)
    expect('signatureEndpoint' in (props() as object)).toBe(false)
    expect(props().options).toMatchObject({ multiple: true, resourceType: 'image', maxFiles: 19, cropping: false, maxFileSize: 10_000_000, clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'] })
    expect(typeof props().options?.prepareUploadParams).toBe('function')
    expect('folder' in (props().options ?? {})).toBe(false)
    expect('uploadPreset' in (props().options ?? {})).toBe(false)
  })

  describe('prepareUploadParams (Task 957)', () => {
    const answer = (n: number) => ({ signature: `sig${n}`, apiKey: 'key', uploadSignatureTimestamp: 1700000000 + n, uploadPreset: 'signed', folder: 'u/listings/l1', publicId: `id${n}`, overwrite: false, tags: ['user-7'], context: 'user=7|listing=l1' })
    const prepare = () => props().options!.prepareUploadParams as (cb: (p: unknown) => void, params: unknown) => Promise<void> | void
    const fetchMock = vi.fn()
    beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => { vi.unstubAllGlobals() })

    it('[AC5] asks the route once per photo with { listingId } and hands each answer to the widget', async () => {
      fetchMock.mockImplementation(async () => { const n = fetchMock.mock.calls.length; return { ok: true, json: async () => answer(n) } })
      mount([], vi.fn(), { listingId: 'l1' })
      const cb = vi.fn()
      await prepare()(cb, [{ source: 'uw' }, { source: 'uw' }])
      expect(fetchMock).toHaveBeenCalledTimes(2)
      for (const call of fetchMock.mock.calls) {
        expect(call[0]).toBe('/api/listings/upload-signature')
        expect(call[1]).toMatchObject({ method: 'POST', credentials: 'same-origin' })
        expect(JSON.parse(call[1].body as string)).toEqual({ listingId: 'l1' })
      }
      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb.mock.calls[0][0]).toEqual([answer(1), answer(2)])
    })

    it('[AC5] a single parameter object gets a single answer; without a listing the body is {}', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => answer(1) })
      mount([])
      const cb = vi.fn()
      await prepare()(cb, { source: 'uw' })
      expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({})
      expect(cb).toHaveBeenCalledWith(answer(1))
    })

    it('[AC5] only the allow-listed keys reach the widget; whatever else the answer carries is dropped', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...answer(1), upload_preset: 'x', secret: 's', timestamp: 1 }) })
      mount([])
      const cb = vi.fn()
      await prepare()(cb, { source: 'uw' })
      expect(cb).toHaveBeenCalledWith(answer(1))
    })

    it.each([
      ['a refused request', async () => ({ ok: false, status: 429, json: async () => ({ error: 'rate_limited' }) })],
      ['an answer that is not JSON', async () => ({ ok: true, json: async () => { throw new Error('bad') } })],
      ['an answer without a signature', async () => ({ ok: true, json: async () => ({ publicId: 'x' }) })],
      ['a network failure', async () => { throw new Error('offline') }],
    ])('[AC5] %s cancels the upload instead of sending it unsigned', async (_label, reply) => {
      fetchMock.mockImplementation(reply)
      mount([])
      const cb = vi.fn()
      await prepare()(cb, { source: 'uw' })
      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith({ cancel: true })
    })
  })

  // Revision 1 (R1-1): the widget is signed, so the library needs the API key and the cloud name at creation (`url-loader/dist/index.js:1590-1602`); both come from the page as a prop
  it('[AC5] the widget gets the API key and the cloud name of the prop as its cloud config, and an uploadSignature that refuses, so no unsigned upload and no public preset is needed', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'from-the-environment')
    mount([image(1)], vi.fn(), { cloudinary: { apiKey: 'key-957', cloudName: 'cloud-957' } })
    expect(props().config).toEqual({ cloud: { apiKey: 'key-957', cloudName: 'cloud-957' } })   // the environment is not read
    expect(typeof props().options?.uploadSignature).toBe('function')
    const callback = vi.fn()
    ;(props().options!.uploadSignature as (cb: (s: unknown, e?: Error) => void, p: unknown) => void)(callback, {})
    expect(callback).toHaveBeenCalledWith(null, expect.any(Error))
  })

  it.each([
    ['the API key', { apiKey: '', cloudName: 'demo-cloud' }],
    ['the cloud name', { apiKey: 'key-957', cloudName: '' }],
    ['both', { apiKey: '', cloudName: '' }],
  ])('[AC5] without %s no widget is offered (it would throw when built); the grid and its controls still show', (_label, cloudinary) => {
    mount([image(1)], vi.fn(), { cloudinary })
    expect(widget.props).toBeNull()
    expect(screen.getAllByRole('button', { name: 'remove_photo#1' })).toHaveLength(1)
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

  it('[AC5] no widget is offered when the limit is reached', () => {
    mount(Array.from({ length: 3 }, (_, i) => image(i + 1)), vi.fn(), { maxImages: 3 })
    expect(widget.props).toBeNull()
  })

  it('[AC5] no widget is offered when the form is disabled', () => {
    mount([image(1)], vi.fn(), { disabled: true })
    expect(widget.props).toBeNull()
  })

  // Task 953 (refs): the callback of the latest render receives the upload result, not the one the widget was opened with.
  it('[AC5] an upload that finishes after a re-render reports to the latest change handler only', () => {
    const first = vi.fn()
    const second = vi.fn()
    const tree = (onChange: typeof first) => <MantineProvider theme={theme} env="test"><ImageUpload images={[]} onChange={onChange} cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} /></MantineProvider>
    const view = render(tree(first))
    fireEvent.click(uploadButton())
    const handler = props().onSuccess!
    view.rerender(tree(second))
    handler(success(1), closeWidget)
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


// Task 957 Revision 2 (R2-4, AC21; Review 2 F5): an upload that cannot be built is explained, not silently missing
describe('ImageUpload when the upload cannot be built', () => {
  it.each([
    ['the API key', { apiKey: '', cloudName: 'c' }],
    ['the cloud name', { apiKey: 'k', cloudName: '' }],
  ])('[AC21] without %s the photo section shows the error state with both texts and no upload button', (_label, cloudinary) => {
    mount([], vi.fn(), { cloudinary })
    expect(widget.props).toBeNull()
    expect(screen.getByText('upload_unavailable_title')).toBeTruthy()
    expect(screen.getByText('upload_unavailable_description')).toBeTruthy()
    expect(screen.queryByText('upload_photos')).toBeNull()
    expect(screen.queryByText(/^add_more_photos/)).toBeNull()
  })

  it('[AC21] with both values the button shows and the message does not', () => {
    mount([])
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

  it('[AC21] the photos already in the form still show with the message (the grid and its controls stay)', () => {
    mount([image(1)], vi.fn(), { cloudinary: { apiKey: '', cloudName: '' } })
    expect(screen.getByRole('button', { name: 'remove_photo#1' })).toBeTruthy()
    expect(screen.getByText('upload_unavailable_title')).toBeTruthy()
  })
})

// Task 957 Revision 2 (R2-6, AC22; Review 2 F10): a refused signature is explained through the canonical toast, one message per case
describe('ImageUpload when the signature is refused', () => {
  const prepare = () => props().options!.prepareUploadParams as (cb: (p: unknown) => void, params: unknown) => Promise<void>
  const fetchMock = vi.fn()
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
  afterEach(() => { vi.unstubAllGlobals() })

  it.each([
    [401, 'upload_error_session'],
    [403, 'upload_error_forbidden'],
    [429, 'upload_error_rate_limited'],
    [503, 'upload_error_unavailable'],
    [500, 'upload_error_unavailable'],
  ])('[AC22] a %s answer cancels the upload and raises toast.error once with %s', async (status, key) => {
    fetchMock.mockResolvedValue({ ok: false, status, json: async () => ({ error: 'x' }) })
    mount([])
    const cb = vi.fn()
    await prepare()(cb, { source: 'uw' })
    expect(cb).toHaveBeenCalledWith({ cancel: true })
    expect(toastMock.error).toHaveBeenCalledTimes(1)
    expect(toastMock.error).toHaveBeenCalledWith(key)
  })

  it('[AC22] a network failure cancels the upload and raises toast.error once with the network message (O997-2: not the general one)', async () => {
    fetchMock.mockImplementation(async () => { throw new Error('offline') })
    mount([])
    const cb = vi.fn()
    await prepare()(cb, { source: 'uw' })
    expect(cb).toHaveBeenCalledWith({ cancel: true })
    expect(toastMock.error).toHaveBeenCalledTimes(1)
    expect(toastMock.error).toHaveBeenCalledWith('upload_error_network')
  })

  // Owner decision O997-2 (2026-11-21): every refused photo names its reason
  it('[AC22] a 429 with a daily Retry-After names the daily limit, one with the 10-minute window the short one', async () => {
    mount([])
    fetchMock.mockResolvedValue({ ok: false, status: 429, headers: new Headers({ 'Retry-After': '86400' }), json: async () => ({ error: 'rate_limited', retryAfterSeconds: 86400 }) })
    await prepare()(vi.fn(), { source: 'uw' })
    expect(toastMock.error).toHaveBeenLastCalledWith('upload_error_rate_limited_day')
    fetchMock.mockResolvedValue({ ok: false, status: 429, headers: new Headers({ 'Retry-After': '600' }), json: async () => ({ error: 'rate_limited', retryAfterSeconds: 600 }) })
    await prepare()(vi.fn(), { source: 'uw' })
    expect(toastMock.error).toHaveBeenLastCalledWith('upload_error_rate_limited')
  })

  it('[AC22] a server that is not set up for uploads says so (500 not_configured), a server error without that code is the general server message', async () => {
    mount([])
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'not_configured' }) })
    await prepare()(vi.fn(), { source: 'uw' })
    expect(toastMock.error).toHaveBeenLastCalledWith('upload_error_not_configured')
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'x' }) })
    await prepare()(vi.fn(), { source: 'uw' })
    expect(toastMock.error).toHaveBeenLastCalledWith('upload_error_unavailable')
  })

  it.each([
    [{ status: 0, statusText: '' }, 'upload_error_network'],
    [{ status: 413, statusText: 'Payload Too Large' }, 'upload_error_too_large'],
    [{ status: 400, statusText: 'Invalid image file' }, 'upload_error_format'],
    [{ status: 403, statusText: 'Forbidden' }, 'upload_error_rejected'],
    [{ status: 420, statusText: 'Rate Limited' }, 'upload_error_provider_busy'],
    [{ status: 502, statusText: 'Bad Gateway' }, 'upload_error_unavailable'],
    ['something unexpected', 'upload_error_failed'],
  ])('[AC22] an upload the photo service refuses (%j) raises toast.error once with %s', (error, key) => {
    mount([])
    props().onError!(error, {})
    expect(toastMock.error).toHaveBeenCalledTimes(1)
    expect(toastMock.error).toHaveBeenCalledWith(key)
  })

  it('[AC22] the validation lines of the widget come in the page language: language and text are set for the locale, with the placeholders of the widget', () => {
    mount([])
    expect(props().options).toMatchObject({ language: 'uk' })
    const text = (props().options as { text: Record<string, { uploader: { errors: Record<string, string> }; notifications: Record<string, string> }> }).text
    expect(Object.keys(text)).toEqual(['uk'])
    expect(text.uk.uploader.errors).toEqual({
      file_too_large: 'upload_widget_file_too_large:{{size}}:{{allowed}}',
      max_file_size: 'upload_widget_max_file_size',
      allowed_formats: 'upload_widget_allowed_formats',
      max_number_of_files: 'upload_widget_max_files',
    })
    expect(text.uk.notifications.general_error).toBe('upload_widget_general_error')
  })

  it('[AC22] several queued photos refused raise one toast, not one per photo', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    mount([])
    const cb = vi.fn()
    await prepare()(cb, [{ source: 'uw' }, { source: 'uw' }, { source: 'uw' }])
    expect(cb).toHaveBeenCalledWith({ cancel: true })
    expect(toastMock.error).toHaveBeenCalledTimes(1)
  })

  it('[AC22] an answer without a valid signature cancels with the unavailable message', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ publicId: 'x' }) })
    mount([])
    const cb = vi.fn()
    await prepare()(cb, { source: 'uw' })
    expect(cb).toHaveBeenCalledWith({ cancel: true })
    expect(toastMock.error).toHaveBeenCalledWith('upload_error_unavailable')
  })

  it('[AC22] a signed answer raises no toast', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ signature: 's', apiKey: 'k', uploadSignatureTimestamp: 1, uploadPreset: 'p', folder: 'f', publicId: 'i', overwrite: false, tags: [], context: 'c' }) })
    mount([])
    await prepare()(vi.fn(), { source: 'uw' })
    expect(toastMock.error).not.toHaveBeenCalled()
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

  it('[AC23] disabled: the upload button is shown disabled and builds no widget, and every photo control is disabled; the clicks change nothing', () => {
    const onChange = mount(three(), vi.fn(), { disabled: true })
    expect(uploadButton().disabled).toBe(true)
    expect(widget.props).toBeNull()
    const controls = screen.getAllByRole('button').filter((b) => /#\d$/.test(b.getAttribute('aria-label') ?? '')) as HTMLButtonElement[]
    expect(controls.length).toBe(11)
    expect(controls.filter((b) => !b.disabled).map((b) => b.getAttribute('aria-label'))).toEqual([])
    for (const b of controls) fireEvent.click(b)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('[AC23] not disabled: the same controls are enabled (the check above is not vacuous)', () => {
    mount(three())
    const enabled = (screen.getAllByRole('button') as HTMLButtonElement[]).filter((b) => /#\d$/.test(b.getAttribute('aria-label') ?? '') && !b.disabled)
    expect(enabled.length).toBeGreaterThan(5)
  })
})
