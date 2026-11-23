/**
 * Live Cloudinary control for the signed listing upload (Task 957 AC8, O957-2). Skipped without `CLOUDINARY_API_SECRET`; written to be run by the reviewer with the credentials of
 * `.env.local` after the owner has created the signed preset and set `CLOUDINARY_LISTING_PRESET` (the four names are read from the process environment, then from `.env.local`;
 * nothing else of that file is read and no value is printed).
 *  - the REAL route `POST /api/listings/upload-signature` answers for a synthetic owner (the session helpers are the only doubles; the limiter and the owner read run on the real
 *    development database, so the SQL of Task 957 must be applied);
 *  - SEC-SIGNEDUPLOAD-LIVE-ALLOW: one 1x1 PNG is uploaded with the route's answer and the exact parameter set the widget sends (`source=uw` included): the asset lands in the owner's
 *    folder with the signed tags and context;
 *  - SEC-SIGNEDUPLOAD-LIVE-REPEAT: the same request sent again stores nothing new: the answer carries the same `asset_id` and `version` (or Cloudinary refuses it), and exactly one asset exists;
 *  - SEC-SIGNEDUPLOAD-LIVE-DENY: a 1x1 GIF signed the same way is refused by the preset (allowed formats); a changed `public_id` or `folder` with the old signature is refused;
 *  - the asset is deleted through `deleteAsset` at the end.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration -- cloudinarySignedUpload
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const NAMES = ['CLOUDINARY_API_SECRET', 'CLOUDINARY_API_KEY', 'CLOUDINARY_LISTING_PRESET', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'] as const
function loadNamed(): void {
  const file = resolve(process.cwd(), '.env.local')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line)
    if (match && (NAMES as readonly string[]).includes(match[1]) && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}
loadNamed()

const acting = vi.hoisted(() => ({ userId: '' }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: acting.userId, role: 'user' }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: acting.userId }) }))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/listings/upload-signature/route'
import { deleteAsset } from '@/lib/cloudinaryDelete'

const live = Boolean(process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_LISTING_PRESET && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

let run: Run
let owner: SyntheticUser
let publicIdToDelete: string | null = null

beforeAll(async () => {
  if (!live) return
  run = createRun()
  owner = await run.makeUser('signed-upload-owner', { role: 'user' })
  acting.userId = owner.id
})
afterAll(async () => {
  if (!live) return
  if (publicIdToDelete) {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    await deleteAsset(publicIdToDelete, { reason: 'task957_live_test', dryRun: false })
  }
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

async function signature() {
  const res = await POST(new NextRequest('http://localhost/api/listings/upload-signature', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }))
  expect(res.status).toBe(200)
  return (await res.json()) as {
    signature: string; apiKey: string; uploadSignatureTimestamp: number; uploadPreset: string; folder: string; publicId: string; overwrite: boolean; tags: string[]; context: string
  }
}

/** the request the widget sends: the signed parameters in snake_case, `source=uw` (a hidden parameter the widget adds), the key and the file */
async function upload(file: string, signed: Awaited<ReturnType<typeof signature>>, change: Record<string, string> = {}) {
  const form = new FormData()
  const fields: Record<string, string> = {
    file, api_key: signed.apiKey, timestamp: String(signed.uploadSignatureTimestamp), signature: signed.signature, upload_preset: signed.uploadPreset,
    folder: signed.folder, public_id: signed.publicId, overwrite: String(signed.overwrite), tags: signed.tags.join(','), context: signed.context, source: 'uw', ...change,
  }
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form })
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

describe.skipIf(!live)('a signed listing upload (live Cloudinary)', () => {
  it('[SEC-SIGNEDUPLOAD-LIVE-ALLOW] [SEC-SIGNEDUPLOAD-LIVE-REPEAT] one PNG is stored in the owner folder; the same request again stores nothing new', async () => {
    const signed = await signature()
    expect(signed.folder).toBe(`${owner.id}/listings`)
    const first = await upload(PNG, signed)
    expect(first.status, JSON.stringify(first.body).slice(0, 300)).toBe(200)
    const publicId = String(first.body.public_id)
    publicIdToDelete = publicId
    expect(publicId, 'stored as <folder>/<uuid>').toBe(`${signed.folder}/${signed.publicId}`)
    expect(first.body.asset_folder).toBe(signed.folder)
    expect(first.body.tags).toEqual(signed.tags)

    const again = await upload(PNG, signed)
    if (again.status === 200) {
      expect(again.body.asset_id, 'the same asset').toBe(first.body.asset_id)
      expect(again.body.version, 'the same version: nothing was replaced').toBe(first.body.version)
    } else {
      expect(again.status, 'or Cloudinary refuses the repeat').toBeGreaterThanOrEqual(400)
    }
    const listed = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/resources/by_asset_folder?asset_folder=${encodeURIComponent(signed.folder)}&max_results=10`, {
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}` },
    })
    const body = (await listed.json()) as { resources: { public_id: string }[] }
    expect(body.resources.filter((r) => r.public_id === publicId)).toHaveLength(1)
  })

  it('[SEC-SIGNEDUPLOAD-LIVE-DENY] a GIF signed the same way is refused by the preset, and a changed public_id or folder breaks the signature', async () => {
    const signed = await signature()
    const gif = await upload(GIF, signed)
    expect(gif.status, 'the signed preset allows jpg, jpeg, png and webp only').toBeGreaterThanOrEqual(400)
    const other = await signature()
    const moved = await upload(PNG, other, { folder: `${'00000000-0000-4000-8000-000000000000'}/listings` })
    expect(moved.status, 'another folder with the old signature').toBeGreaterThanOrEqual(400)
    const renamed = await upload(PNG, other, { public_id: 'chosen-by-the-browser' })
    expect(renamed.status, 'another public_id with the old signature').toBeGreaterThanOrEqual(400)
    const overwritten = await upload(PNG, other, { overwrite: 'true' })
    expect(overwritten.status, 'overwrite flipped after signing').toBeGreaterThanOrEqual(400)
  })
})
