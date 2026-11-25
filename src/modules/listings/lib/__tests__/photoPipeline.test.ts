/**
 * Task 1038 (AC1): the browser pipeline that turns one chosen photo into the two versions that are uploaded.
 *  - the large version: at most 1920 px on the long side, the small one 640 px (a smaller photo keeps its size: only `maxWidthOrHeight` is given, never a fixed size),
 *    quality 0.85, WebP, JPEG where the browser cannot encode WebP, no metadata (`preserveExif: false`), a Web Worker, the orientation left to the library (no override);
 *  - a result above 819 200 bytes, a type that is not the asked one and a file that is not a JPEG, PNG or WebP are refused, with the reason the person is told.
 * `browser-image-compression` is the only double: it records the options it is given and answers with a blob of a chosen type and size. Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const lib = vi.hoisted(() => ({ calls: [] as { file: File; options: Record<string, unknown> }[], answer: (_file: File, _options: Record<string, unknown>): Promise<Blob> => Promise.resolve(new Blob()) }))
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file: File, options: Record<string, unknown>) => { lib.calls.push({ file, options }); return lib.answer(file, options) }),
}))

import { ACCEPTED_INPUT_TYPES, FULL_MAX_SIDE, MAX_PHOTO_BYTES, PhotoProcessingError, THUMB_MAX_SIDE, processPhoto } from '../photoPipeline'

const blob = (size: number, type: string) => new File([new Uint8Array(size)], 'out', { type })
const input = (type = 'image/jpeg', name = 'IMG_0001.jpg') => new File([new Uint8Array(10)], name, { type })
/** the library answers a blob of the type it was asked for, 300 000 bytes for the large version and 40 000 for the small one */
const faithful = (file: File, options: Record<string, unknown>) => Promise.resolve(blob(options.maxWidthOrHeight === FULL_MAX_SIDE ? 300_000 : 40_000, String(options.fileType)))
const reason = async (promise: Promise<unknown>) => { try { await promise } catch (e) { return e instanceof PhotoProcessingError ? e.reason : `other:${String(e)}` } return 'resolved' }

beforeEach(() => { lib.calls = []; lib.answer = faithful })

describe('the numbers', () => {
  it('[AC1] 1920 px, 640 px, 819 200 bytes, three accepted input types', () => {
    expect(FULL_MAX_SIDE).toBe(1920)
    expect(THUMB_MAX_SIDE).toBe(640)
    expect(MAX_PHOTO_BYTES).toBe(819_200)
    expect([...ACCEPTED_INPUT_TYPES].sort()).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })
})

describe('the options given to the library', () => {
  it('[AC1] the large version: 1920 px, quality 0.85, WebP, at most 0.5 MB, a Web Worker, no metadata', async () => {
    await processPhoto(input())
    const full = lib.calls.find((c) => c.options.maxWidthOrHeight === 1920)
    expect(full).toBeTruthy()
    expect(full?.options).toMatchObject({ maxWidthOrHeight: 1920, initialQuality: 0.85, fileType: 'image/webp', maxSizeMB: 0.5, useWebWorker: true, preserveExif: false })
  })

  it('[AC1] the small version: 640 px, quality 0.85, WebP, a Web Worker, no metadata', async () => {
    await processPhoto(input())
    const thumb = lib.calls.find((c) => c.options.maxWidthOrHeight === 640)
    expect(thumb).toBeTruthy()
    expect(thumb?.options).toMatchObject({ maxWidthOrHeight: 640, initialQuality: 0.85, fileType: 'image/webp', useWebWorker: true, preserveExif: false })
  })

  it('[AC1] a photo is never upscaled: no option asks for a fixed size or keeps a resolution, and no width or height is given besides the long-side limit', async () => {
    await processPhoto(input())
    for (const { options } of lib.calls) {
      expect(options.alwaysKeepResolution).toBeUndefined()
      expect(options.maxWidth).toBeUndefined()
      expect(options.maxHeight).toBeUndefined()
      expect(options.width).toBeUndefined()
      expect(options.height).toBeUndefined()
    }
  })

  it('[AC1] the orientation of the camera is applied by the library: no orientation is passed (the library reads it from the file)', async () => {
    await processPhoto(input())
    for (const { options } of lib.calls) expect('exifOrientation' in options).toBe(false)
  })

  it('[AC1] both versions are made from the chosen file itself, never from an address or a data URL', async () => {
    const file = input()
    await processPhoto(file)
    expect(lib.calls).toHaveLength(2)
    expect(lib.calls.every((c) => c.file === file)).toBe(true)
  })

  it('[AC1] the result is the type, the large and the small blob', async () => {
    const result = await processPhoto(input())
    expect(result.type).toBe('image/webp')
    expect(result.full.size).toBe(300_000)
    expect(result.thumb.size).toBe(40_000)
    expect(result.full.type).toBe('image/webp')
    expect(result.thumb.type).toBe('image/webp')
  })
})

describe('WebP, then JPEG', () => {
  it('[AC1] a browser that cannot encode WebP answers another type: both versions are made again as JPEG', async () => {
    lib.answer = (_file, options) => Promise.resolve(blob(100_000, options.fileType === 'image/webp' ? 'image/png' : String(options.fileType)))
    const result = await processPhoto(input())
    expect(result.type).toBe('image/jpeg')
    expect(result.full.type).toBe('image/jpeg')
    expect(result.thumb.type).toBe('image/jpeg')
    const jpeg = lib.calls.filter((c) => c.options.fileType === 'image/jpeg')
    expect(jpeg.map((c) => Number(c.options.maxWidthOrHeight)).sort((a, b) => a - b)).toEqual([640, 1920])
    for (const c of jpeg) expect(c.options).toMatchObject({ initialQuality: 0.85, useWebWorker: true, preserveExif: false })
  })

  it('[AC1] when JPEG cannot be made either the photo fails as a processing failure', async () => {
    lib.answer = () => Promise.resolve(blob(100, 'image/png'))
    expect(await reason(processPhoto(input()))).toBe('processing')
  })

  it('[AC1] the small version must be of the same type as the large one', async () => {
    lib.answer = (_file, options) => Promise.resolve(blob(1000, options.maxWidthOrHeight === 1920 ? String(options.fileType) : 'image/jpeg'))
    expect(await reason(processPhoto(input()))).toBe('processing')
  })
})

describe('the size limit', () => {
  it('[AC1] 819 200 bytes is accepted, 819 201 is refused, for the large version', async () => {
    lib.answer = (_f, o) => Promise.resolve(blob(o.maxWidthOrHeight === 1920 ? 819_200 : 1000, String(o.fileType)))
    await expect(processPhoto(input())).resolves.toBeTruthy()
    lib.answer = (_f, o) => Promise.resolve(blob(o.maxWidthOrHeight === 1920 ? 819_201 : 1000, String(o.fileType)))
    expect(await reason(processPhoto(input()))).toBe('too_large')
  })

  it('[AC1] the small version above 819 200 bytes is refused too', async () => {
    lib.answer = (_f, o) => Promise.resolve(blob(o.maxWidthOrHeight === 640 ? 819_201 : 1000, String(o.fileType)))
    expect(await reason(processPhoto(input()))).toBe('too_large')
  })

  it('[AC1] an empty result is a processing failure', async () => {
    lib.answer = (_f, o) => Promise.resolve(blob(0, String(o.fileType)))
    expect(await reason(processPhoto(input()))).toBe('processing')
  })
})

describe('what is accepted', () => {
  it.each([['image/jpeg'], ['image/png'], ['image/webp']])('[AC1] %s is processed', async (type) => {
    await expect(processPhoto(input(type))).resolves.toBeTruthy()
  })

  it.each([['image/gif'], ['image/heic'], ['image/heif'], ['image/svg+xml'], ['image/bmp'], ['application/pdf'], ['text/html'], ['']])('[AC1] %j is refused as a format failure and the library is not called', async (type) => {
    expect(await reason(processPhoto(input(type, 'x.bin')))).toBe('format')
    expect(lib.calls).toHaveLength(0)
  })

  it('[AC1] the type of the file decides, not its name', async () => {
    expect(await reason(processPhoto(input('image/gif', 'photo.jpg')))).toBe('format')
    await expect(processPhoto(input('image/jpeg', 'photo.txt'))).resolves.toBeTruthy()
  })

  it('[AC1] a library failure is a processing failure, and never carries the library message', async () => {
    lib.answer = () => Promise.reject(new Error('Failed to load image /Users/someone/secret.jpg'))
    const error = await processPhoto(input()).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PhotoProcessingError)
    expect((error as PhotoProcessingError).reason).toBe('processing')
    expect((error as PhotoProcessingError).message).not.toContain('secret.jpg')
  })
})
