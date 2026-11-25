/**
 * Task 957, Revision 1 (R1-1, AC5; Review 1 F1) asked that the photo widget works with `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` unset; Task 1038 removed the widget, and Revision 1 (R1-2, Review 1 F2)
 * rewrote this file for the file input that replaced it. Its subject is the same: what the form hands the browser and the server when a person chooses photos, with no Cloudinary variable set at all.
 *
 * `ImageUpload.test.tsx` replaces the upload queue whole, so it cannot see what the queue does with what the component passes. This file runs the REAL `ImageUpload` with the REAL `createUploadQueue`
 * (`uploadQueue.ts`, whose own cases are in `uploadQueue.test.ts`). Besides the translations, only what the browser and the network define is a double: `processPhoto` (the image library cannot run in jsdom;
 * its options are asserted in `photoPipeline.test.ts`), `fetch` (the route `POST /api/listings/upload-url`) and `XMLHttpRequest` (the PUT to R2). Every value is synthetic.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl', () => ({ useLocale: () => 'sq', useTranslations: () => (key: string, values?: Record<string, unknown>) => (values && 'n' in values ? `${key}#${String(values.n)}` : key) }))
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/modules/listings/lib/photoPipeline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/listings/lib/photoPipeline')>()
  return { ...actual, processPhoto: vi.fn(async () => ({ type: 'image/webp', full: new Blob([new Uint8Array(300)], { type: 'image/webp' }), thumb: new Blob([new Uint8Array(40)], { type: 'image/webp' }) })) }
})

import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { ImageUpload, type ListingImage } from '../ImageUpload'

// the variables the old widget could read (`NEXT_PUBLIC_CLOUDINARY_*`): none is set, and nothing here may need one
const ENV = ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_API_KEY', 'CLOUDINARY_API_KEY'] as const
const saved: Record<string, string | undefined> = {}

const ADDRESSES = { fullUrl: 'https://r2.example/user-7/listings/uuid-1/full.webp?sig=a', thumbUrl: 'https://r2.example/user-7/listings/uuid-1/thumb.webp?sig=b', publicUrl: 'https://media.lero.al/user-7/listings/uuid-1/full.webp' }

interface Put { method: string; url: string; headers: Record<string, string>; size: number }
const net = vi.hoisted(() => ({ puts: [] as { method: string; url: string; headers: Record<string, string>; size: number }[], putStatus: 200 }))

class FakeXhr {
  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null }
  status = 0
  timeout = 0
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeout: (() => void) | null = null
  onabort: (() => void) | null = null
  private method = ''
  private url = ''
  private headers: Record<string, string> = {}
  open(method: string, url: string) { this.method = method; this.url = url }
  setRequestHeader(name: string, value: string) { this.headers[name] = value }
  send(body: Blob) {
    net.puts.push({ method: this.method, url: this.url, headers: this.headers, size: body.size })
    this.status = net.putStatus
    queueMicrotask(() => this.onload?.())
  }
}

const reply = (status: number, body: unknown, headers: Record<string, string> = {}) => ({ ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body })
const fetchMock = vi.fn()

beforeEach(() => {
  setViewport(1024)   // Mantine's provider reads matchMedia, which jsdom lacks
  for (const name of ENV) saved[name] = process.env[name]
  for (const name of ENV) delete process.env[name]
  net.puts = []
  net.putStatus = 200
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(reply(200, ADDRESSES))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('XMLHttpRequest', FakeXhr)
})
afterEach(() => {
  cleanup()
  for (const name of ENV) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }
  vi.unstubAllGlobals()
})

const mount = (extra: Partial<React.ComponentProps<typeof ImageUpload>> = {}, onChange: (images: ListingImage[]) => void = vi.fn()) => {
  render(<MantineProvider theme={theme} env="test"><ImageUpload images={[]} onChange={onChange} {...extra} /></MantineProvider>)
  return onChange
}
const fileInput = () => screen.getByTestId('photo-file-input') as HTMLInputElement
const choose = (...files: File[]) => fireEvent.change(fileInput(), { target: { files } })
const photoFile = (name = 'IMG_0001.jpg') => new File([new Uint8Array(8)], name, { type: 'image/jpeg' })
const calls = () => fetchMock.mock.calls as [string, RequestInit][]

describe('ImageUpload with the real upload queue and no Cloudinary variable (Task 957 R1-1, Task 1038)', () => {
  it('[AC5] renders the file input and the button although NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET and every other Cloudinary variable are unset, and loads no widget script', () => {
    for (const name of ENV) expect(process.env[name], name).toBeUndefined()
    mount()
    expect(screen.getByTestId('image-upload')).toBeTruthy()
    expect(fileInput().accept).toBe('image/jpeg,image/png,image/webp')
    expect(fileInput().multiple).toBe(true)
    expect(screen.getByText('upload_photos')).toBeTruthy()
    expect(document.querySelector('script[src*="upload-widget.cloudinary.com"]')).toBeNull()
    expect('cloudinary' in window).toBe(false)
  })

  it('[AC5] the request for the addresses holds the listing, the type and the two sizes and nothing else: no preset, no folder, no name is chosen by the browser', async () => {
    mount({ listingId: 'l-1' })
    choose(photoFile())
    await waitFor(() => expect(calls()).toHaveLength(1))
    const [route, init] = calls()[0]
    expect(route).toBe('/api/listings/upload-url')
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' })
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(body).toEqual({ listingId: 'l-1', type: 'image/webp', fullBytes: 300, thumbBytes: 40 })
    expect(Object.keys(body).sort()).toEqual(['fullBytes', 'listingId', 'thumbBytes', 'type'])
  })

  it('[AC5] without a listing the body has no listingId', async () => {
    mount()
    choose(photoFile())
    await waitFor(() => expect(calls()).toHaveLength(1))
    expect(Object.keys(JSON.parse(calls()[0][1].body as string) as object).sort()).toEqual(['fullBytes', 'thumbBytes', 'type'])
  })

  it('[AC5] the browser never signs: both versions are PUT to the addresses the route gave, carrying only the type and the cache policy that were signed, and no credential', async () => {
    mount()
    choose(photoFile())
    await waitFor(() => expect(net.puts).toHaveLength(2))
    const byUrl = (url: string) => net.puts.find((p: Put) => p.url === url)
    expect(byUrl(ADDRESSES.fullUrl)).toMatchObject({ method: 'PUT', size: 300 })
    expect(byUrl(ADDRESSES.thumbUrl)).toMatchObject({ method: 'PUT', size: 40 })
    for (const put of net.puts) {
      expect(Object.keys(put.headers).sort()).toEqual(['Cache-Control', 'Content-Type'])
      expect(put.headers['Content-Type']).toBe('image/webp')
      expect(put.headers['Cache-Control']).toBe('public, max-age=3600, s-maxage=31536000')
    }
  })

  it('[AC5] a photo that was uploaded joins the form with the address the route gave, as the cover of an empty form, and its tile is gone', async () => {
    const onChange = mount()
    choose(photoFile())
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(onChange).toHaveBeenCalledWith([{ url: ADDRESSES.publicUrl, public_id: 'user-7/listings/uuid-1/full.webp', is_cover: true, order: 0 }])
    await waitFor(() => expect(screen.queryAllByTestId('pending-photo')).toHaveLength(0))
  })

  it('[AC5] the file button opens the file input that the queue reads from', () => {
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
    try {
      mount()
      fireEvent.click(screen.getByText('upload_photos').closest('button') as HTMLButtonElement)
      expect(clicked).toHaveBeenCalledTimes(1)
      expect(clicked.mock.contexts[0]).toBe(fileInput())
    } finally {
      clicked.mockRestore()
    }
  })

  it.each([
    ['an API key', { apiKey: '', cloudName: 'cloud-957' }],
    ['a cloud name', { apiKey: 'key-957', cloudName: '' }],
  ])('[AC5] without %s the form still renders and still uploads (the prop is not read any more)', async (_label, cloudinary) => {
    const onChange = mount({ cloudinary })
    expect(screen.getByTestId('image-upload')).toBeTruthy()
    expect(screen.getByText('upload_photos')).toBeTruthy()
    choose(photoFile())
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
  })
})

describe('a photo that cannot be uploaded, with the real queue (Task 1038)', () => {
  it('[AC22] a refused request shows its reason under the tile and puts nothing on R2; retry asks again and the photo joins; remove drops a failed tile', async () => {
    fetchMock.mockResolvedValueOnce(reply(429, { error: 'rate_limited' }, { 'Retry-After': '600' }))
    const onChange = mount()
    choose(photoFile())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('upload_error_rate_limited')
    expect(net.puts).toHaveLength(0)
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'photo_retry#1' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(calls()).toHaveLength(2)
    expect(net.puts).toHaveLength(2)

    fetchMock.mockResolvedValueOnce(reply(401, { error: 'unauthorized' }))
    choose(photoFile('IMG_0002.jpg'))
    expect((await screen.findByRole('alert')).textContent).toBe('upload_error_session')
    fireEvent.click(screen.getByRole('button', { name: 'remove_photo#1' }))
    await waitFor(() => expect(screen.queryAllByTestId('pending-photo')).toHaveLength(0))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('[AC22] a daily limit and a window limit tell different reasons (the Retry-After decides)', async () => {
    fetchMock.mockResolvedValueOnce(reply(429, { error: 'rate_limited' }, { 'Retry-After': '86400' }))
    mount()
    choose(photoFile())
    expect((await screen.findByRole('alert')).textContent).toBe('upload_error_rate_limited_day')
  })
})
