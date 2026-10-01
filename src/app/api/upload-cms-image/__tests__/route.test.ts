// @vitest-environment node
/**
 * upload-cms-image route — Task 868 (R15, T9). Permission first, then validation, then the Cloudinary
 * upload into folder `cms/pages`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockAssertPermission = vi.fn()
vi.mock('@/lib/auth/permissions', () => ({
  assertPermission: (...args: unknown[]) => mockAssertPermission(...args),
}))

const mockUpload = vi.fn()
vi.mock('@/lib/cloudinaryUpload', () => ({
  uploadToCloudinary: (...args: unknown[]) => mockUpload(...args),
}))

import { POST } from '../route'

function request(file?: File) {
  const form = new FormData()
  if (file) form.append('image', file)
  return new NextRequest('http://localhost/api/upload-cms-image', { method: 'POST', body: form })
}

const png = () => new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' })

beforeEach(() => {
  vi.clearAllMocks()
  mockAssertPermission.mockResolvedValue(undefined)
  mockUpload.mockResolvedValue({ url: 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.png', publicId: 'cms/pages/a' })
})

describe('POST /api/upload-cms-image (T9)', () => {
  it('row 1 — without legal.manage: 403 and no Cloudinary call', async () => {
    mockAssertPermission.mockRejectedValue(new Error('forbidden'))
    const res = await POST(request(png()))

    expect(res.status).toBe(403)
    expect(mockAssertPermission).toHaveBeenCalledWith('legal.manage')
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('row 2 — a non-image type: 400 invalid_type', async () => {
    const res = await POST(request(new File(['x'], 'a.gif', { type: 'image/gif' })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_type' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('row 3 — more than 5 MB: 400 file_too_large', async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    const res = await POST(request(big))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'file_too_large' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('row 4 — an empty file: 400 file_empty', async () => {
    const res = await POST(request(new File([], 'a.png', { type: 'image/png' })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'file_empty' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('row 5 — no image field: 400 no_file', async () => {
    const res = await POST(request())

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'no_file' })
  })

  it('row 6 — success: 200 { url }, uploaded to folder cms/pages', async () => {
    const res = await POST(request(png()))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.png' })
    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(mockUpload.mock.calls[0][1]).toBe('image/png')
    expect(mockUpload.mock.calls[0][2]).toBe('cms/pages')
  })

  it('row 7 — Cloudinary throws: 500 upload_failed', async () => {
    mockUpload.mockRejectedValue(new Error('boom'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(request(png()))
    spy.mockRestore()

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'upload_failed' })
  })
})
