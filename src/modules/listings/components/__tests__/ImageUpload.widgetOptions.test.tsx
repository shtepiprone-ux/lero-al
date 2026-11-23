/**
 * Task 957, Revision 1 (R1-1, AC5; Review 1 F1): the photo widget works with `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` unset.
 *
 * `ImageUpload.test.tsx` replaces `next-cloudinary` whole, so it cannot see what the library does with the options the component passes. This file runs the REAL
 * `CldUploadWidget` and the REAL `getUploadWidgetOptions` of `@cloudinary-util/url-loader` (`node_modules/@cloudinary-util/url-loader/dist/index.js:1590-1617`): without a function
 * `uploadSignature` that function throws "A Cloudinary Upload Preset is required for unsigned uploads" when no preset is given (`:1603-1607`); it also throws without a cloud name
 * (`:1593-1597`) and, for a signed upload, without an API key (`:1598-1602`). Besides the translations, only what Cloudinary's script defines is a double: `window.cloudinary`,
 * whose `createUploadWidget` records the options the library built; the script's own `load` event is sent by the test. Every value is synthetic.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl', () => ({ useLocale: () => 'sq', useTranslations: () => (key: string) => key }))

import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { ImageUpload } from '../ImageUpload'

type WidgetOptions = Record<string, unknown> & {
  cloudName?: string
  apiKey?: string
  uploadPreset?: string
  folder?: string
  uploadSignature?: (callback: (signature: unknown, error?: Error) => void, params: unknown) => void
  prepareUploadParams?: (callback: (params: unknown) => void, params: unknown) => Promise<void> | void
}

const created = vi.hoisted(() => ({ options: null as unknown, calls: 0, opened: 0 }))
// the variables the library or the product could read (`next-cloudinary/dist/cloudinary-ef6def0a.esm.js:113,117`: the cloud name and `NEXT_PUBLIC_CLOUDINARY_API_KEY`)
const ENV = ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_API_KEY', 'CLOUDINARY_API_KEY'] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  setViewport(1024)   // Mantine's provider reads matchMedia, which jsdom lacks
  for (const name of ENV) saved[name] = process.env[name]
  // the case of Review 1 F1 and of a Storybook build: no Cloudinary variable is set at all; what the widget is built with comes from the prop
  for (const name of ENV) delete process.env[name]
  created.options = null
  created.calls = 0
  created.opened = 0
  ;(window as unknown as { cloudinary: unknown }).cloudinary = {
    createUploadWidget: (options: unknown) => {
      created.options = options
      created.calls++
      return { open: () => { created.opened++ }, destroy: () => undefined }
    },
  }
})
afterEach(() => {
  cleanup()
  for (const name of ENV) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }
  delete (window as unknown as { cloudinary?: unknown }).cloudinary
  vi.unstubAllGlobals()
})

const mount = (extra: Partial<React.ComponentProps<typeof ImageUpload>> = {}) =>
  render(<MantineProvider theme={theme} env="test"><ImageUpload images={[]} onChange={vi.fn()} cloudinary={{ apiKey: 'key-957', cloudName: 'cloud-957' }} {...extra} /></MantineProvider>)
const options = () => created.options as WidgetOptions
/**
 * The library builds the widget when Cloudinary's script has loaded. The real `next/script` adds that script to the document on the first mount; a later mount of the same address
 * is told of the load through the cached promise of that address (`node_modules/next/dist/client/script.js:70-81, 94-98`). A `load` event on the element is what the browser sends
 * when the script has run, and `window.cloudinary` is the double set in `beforeEach`.
 */
const widgetCreated = () => waitFor(() => {
  const script = document.querySelector('script[src*="upload-widget.cloudinary.com"]')
  if (created.calls === 0 && script) fireEvent.load(script)
  expect(created.calls).toBeGreaterThan(0)
})

describe('ImageUpload with the real next-cloudinary and no public preset (Task 957 R1-1)', () => {
  it('[AC5] renders and creates the widget although NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET and every other Cloudinary variable are unset', async () => {
    for (const name of ENV) expect(process.env[name], name).toBeUndefined()
    mount()
    await widgetCreated()
    expect(options().cloudName).toBe('cloud-957')   // the cloud name and the key come from the prop of the page, not from the environment
    expect(options().apiKey).toBe('key-957')
  })

  it('[AC5] the options the library builds hold no preset and no folder; the upload parameters come from prepareUploadParams alone', async () => {
    mount({ listingId: 'l-1' })
    await widgetCreated()
    const built = options()
    expect(built.uploadPreset).toBeUndefined()
    expect('folder' in built).toBe(false)
    expect(typeof built.prepareUploadParams).toBe('function')
    expect(built).toMatchObject({ multiple: true, resourceType: 'image', maxFiles: 20, cropping: false, maxFileSize: 10_000_000, clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'] })
  })

  it('[AC5] the widget never signs in the browser: its uploadSignature refuses and gives no signature', async () => {
    mount()
    await widgetCreated()
    expect(typeof options().uploadSignature).toBe('function')
    const callback = vi.fn()
    options().uploadSignature!(callback, { timestamp: 1 })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toBeNull()
    expect(callback.mock.calls[0][1]).toBeInstanceOf(Error)
  })

  it('[AC5] prepareUploadParams, as the library hands it to the widget, still asks the route and passes the answer on', async () => {
    const answer = { signature: 's', apiKey: 'key-957', uploadSignatureTimestamp: 1, uploadPreset: 'signed', folder: 'u/listings/l-1', publicId: 'p', overwrite: false, tags: ['user-7'], context: 'user=7' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => answer })
    vi.stubGlobal('fetch', fetchMock)
    mount({ listingId: 'l-1' })
    await widgetCreated()
    const callback = vi.fn()
    await options().prepareUploadParams!(callback, { source: 'uw' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/listings/upload-signature')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ listingId: 'l-1' })
    expect(callback).toHaveBeenCalledWith(answer)
  })

  it('[AC5] the upload button opens the widget that was created', async () => {
    mount()
    await widgetCreated()
    fireEvent.click(screen.getByText('upload_photos').closest('button') as HTMLButtonElement)
    expect(created.opened).toBe(1)
  })

  it.each([
    ['an API key', { apiKey: '', cloudName: 'cloud-957' }],
    ['a cloud name', { apiKey: 'key-957', cloudName: '' }],
  ])('[AC5] without %s no widget is built (the library would throw) and the form still renders', async (_label, cloudinary) => {
    mount({ cloudinary })
    expect(screen.getByTestId('image-upload')).toBeTruthy()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(created.calls).toBe(0)
    expect(screen.queryByText('upload_photos')).toBeNull()
  })
})
