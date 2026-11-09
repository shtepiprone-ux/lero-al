// @vitest-environment node
/**
 * Task 951 AC6 (CodeQL js/weak-cryptographic-algorithm): the Cloudinary API signature is SHA-256, not SHA-1. The signed string is the one SHA-1 signed before:
 * the parameters in alphabetical order, joined with "&", followed directly by the API secret (upload: `folder=<f>&timestamp=<ts>`; destroy:
 * `public_id=<id>&timestamp=<ts>`). The parameter `signature_algorithm=sha256` is sent as its own form field and is NOT part of the signed string (Cloudinary
 * "Generating authentication signatures"; the live 401 of 2026-11-09 named the string without it).
 */
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ limit: async () => ({ data: [], error: null }) }),
        ilike: () => ({ limit: async () => ({ data: [], error: null }) }),
        limit: async () => ({ data: [], error: null }),
      }),
    }),
  }),
}))

import { uploadToCloudinary } from '../cloudinaryUpload'
import { deleteAsset } from '../cloudinaryDelete'

const ENV = { ...process.env }
const fetchMock = vi.fn()
const digest = (algorithm: 'sha256', text: string) => createHash(algorithm).update(text).digest('hex')
const TS = Math.round(new Date('2026-10-17T10:00:00Z').getTime() / 1000)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key-1'
  process.env.CLOUDINARY_API_SECRET = 'TOP-SECRET'
  process.env.CLOUDINARY_DELETE_MODE = 'enabled'
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); process.env = { ...ENV } })

describe('the digest of a known input', () => {
  it('SHA-256 of a known string is the 64-character hex value the signature uses', () => {
    expect(digest('sha256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('upload', () => {
  it('signs folder and timestamp with SHA-256, and sends signature_algorithm=sha256 without signing it', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg', public_id: 'listings/a' }) })
    await uploadToCloudinary(new Uint8Array([1, 2, 3]).buffer, 'image/jpeg', 'listings')
    const form = fetchMock.mock.calls[0][1].body as FormData
    const signed = `folder=listings&timestamp=${TS}`
    expect(form.get('signature_algorithm')).toBe('sha256')
    expect(form.get('signature')).toBe(digest('sha256', `${signed}TOP-SECRET`))
    expect(form.get('signature')).toHaveLength(64)
    expect([...form.values()].some((v) => typeof v === 'string' && v.includes('TOP-SECRET'))).toBe(false)
  })
})

describe('destroy', () => {
  it('signs public_id and timestamp with SHA-256, and sends signature_algorithm=sha256 without signing it', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }) })
    expect(await deleteAsset('avatars/me', { reason: 'avatar_replaced' })).toEqual({ skipped: false, dryRun: false, deleted: true })
    const form = fetchMock.mock.calls[0][1].body as FormData
    const signed = `public_id=avatars/me&timestamp=${TS}`
    expect(form.get('signature_algorithm')).toBe('sha256')
    expect(form.get('signature')).toBe(digest('sha256', `${signed}TOP-SECRET`))
    expect(form.get('signature')).toHaveLength(64)
    expect([...form.values()].some((v) => typeof v === 'string' && v.includes('TOP-SECRET'))).toBe(false)
  })
})
