/**
 * Live Cloudflare R2 and CDN control for the listing photo upload (Task 1038 AC10 and AC13, owner decisions O1038-1 and O1038-5). Skipped without the R2 and Cloudflare variables; the names
 * are read from the process environment, then from `.env.local`, and no value is printed. The only doubles are the session helpers; the route, the signer, R2, the reference check, the delete,
 * the purge and the CDN are real. It creates ONE photo under a synthetic owner's folder and removes it at the end; it purges only that photo's folder.
 *  - AC10 [SEC-R2LIVE-UPLOAD]: the REAL route `POST /api/listings/upload-url` answers; both versions are PUT to R2 with the signed headers; `verifyListingPhoto` accepts the photo; a PUT with
 *    another content type, another length or no cache policy is refused; a PUT to another key with the signature of this one is refused.
 *  - AC13 [SEC-R2LIVE-CACHE]: `full` and `thumb` answer `Cache-Control: public, max-age=3600, s-maxage=31536000` and `cf-cache-status: HIT` on a repeat, plainly, with `Origin: https://lero.al`
 *    and with `?v=1`; [SEC-R2LIVE-PURGE] after `deleteListingPhoto` (R2 delete, purge `purged`) the same six requests answer 404.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration -- r2SignedUpload
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const NAMES = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL', 'CLOUDFLARE_ZONE_ID', 'CLOUDFLARE_CACHE_PURGE_TOKEN'] as const
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
import { POST } from '@/app/api/listings/upload-url/route'
import { CACHE_CONTROL, deleteObjects, keyFromPublicUrl } from '@/lib/media/r2'
import { deleteListingPhoto, locatePhoto, verifyListingPhoto } from '@/lib/media/listingPhoto'

const live = NAMES.every((name) => Boolean(process.env[name]))
/** a 1x1 lossless WebP: a real image file of 26 bytes */
const WEBP = Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64')
const PUBLIC_CACHE_CONTROL = 'public, max-age=3600, s-maxage=31536000'

let run: Run
let owner: SyntheticUser
let addresses: { fullUrl: string; thumbUrl: string; publicUrl: string } | null = null
let deletedByTest = false

beforeAll(async () => {
  if (!live) return
  run = createRun()
  owner = await run.makeUser('r2-live-owner', { role: 'user' })
  acting.userId = owner.id
})
afterAll(async () => {
  if (!live) return
  // the photo of this run is removed even when a test failed half-way: its own two keys only, and the CDN copies of its own folder only (a prefix of this run's random folder, never everything)
  if (addresses) {
    const key = keyFromPublicUrl(addresses.publicUrl)
    if (key && !deletedByTest) await deleteObjects([key, key.replace('/full.', '/thumb.')]).catch(() => undefined)
    const prefix = locatePhoto(addresses.publicUrl)?.prefix
    if (prefix) {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_CACHE_PURGE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [prefix] }),
      }).catch(() => undefined)
    }
  }
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

async function requestAddresses(body: Record<string, unknown>) {
  const res = await POST(new NextRequest('http://localhost/api/listings/upload-url', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }))
  return { status: res.status, body: (await res.json()) as { fullUrl: string; thumbUrl: string; publicUrl: string } }
}

const put = (address: string, headers: Record<string, string>, body: Uint8Array = WEBP) => fetch(address, { method: 'PUT', headers, body: new Blob([new Uint8Array(body)]) })
const signedHeaders = { 'Content-Type': 'image/webp', 'Cache-Control': CACHE_CONTROL }
const wait = (ms: number) => new Promise((resolveWait) => setTimeout(resolveWait, ms))

/** the six requests of AC13 for one photo: full and thumb, plainly, with an Origin, with a query */
type Probe = { label: string; url: string; headers: Record<string, string> }
function sixRequests(publicUrl: string): Probe[] {
  const objects: [string, string][] = [['full', publicUrl], ['thumb', publicUrl.replace('/full.', '/thumb.')]]
  return objects.flatMap(([name, url]): Probe[] => [
    { label: `${name} plain`, url, headers: {} },
    { label: `${name} with Origin`, url, headers: { Origin: 'https://lero.al' } },
    { label: `${name} with ?v=1`, url: `${url}?v=1`, headers: {} },
  ])
}

describe.skipIf(!live)('a listing photo on R2 and the CDN (live)', () => {
  it('[SEC-R2LIVE-UPLOAD] the route issues two addresses, both versions are PUT with the signed headers, and the server verifies the photo', async () => {
    const answer = await requestAddresses({ type: 'image/webp', fullBytes: WEBP.length, thumbBytes: WEBP.length })
    expect(answer.status).toBe(200)
    addresses = answer.body
    expect(Object.keys(answer.body).sort()).toEqual(['fullUrl', 'publicUrl', 'thumbUrl'])
    expect(answer.body.publicUrl.startsWith(`${process.env.R2_PUBLIC_URL}/${owner.id}/listings/`)).toBe(true)

    expect((await put(answer.body.fullUrl, signedHeaders)).status, 'full').toBe(200)
    expect((await put(answer.body.thumbUrl, signedHeaders)).status, 'thumb').toBe(200)
    expect(await verifyListingPhoto(answer.body.publicUrl, owner.id), 'the server reads both objects back and accepts the photo').toBe(true)
    expect(await verifyListingPhoto(answer.body.publicUrl, run.RUN), 'another owner is refused').toBe(false)
  })

  it('[SEC-R2LIVE-UPLOAD] an upload that is not exactly what was signed is refused by R2', async () => {
    const answer = await requestAddresses({ type: 'image/webp', fullBytes: WEBP.length, thumbBytes: WEBP.length })
    expect(answer.status).toBe(200)
    const other = await requestAddresses({ type: 'image/webp', fullBytes: WEBP.length, thumbBytes: WEBP.length })
    expect((await put(answer.body.fullUrl, { ...signedHeaders, 'Content-Type': 'image/jpeg' })).status, 'another content type').toBe(403)
    expect((await put(answer.body.fullUrl, signedHeaders, Buffer.concat([WEBP, Buffer.from([0])]))).status, 'another length').toBe(403)
    expect((await put(answer.body.fullUrl, { 'Content-Type': 'image/webp' })).status, 'no cache policy').toBe(403)
    expect((await put(answer.body.fullUrl, { ...signedHeaders, 'Cache-Control': 'no-store' })).status, 'another cache policy').toBe(403)
    const stolen = new URL(answer.body.fullUrl)
    stolen.pathname = new URL(other.body.fullUrl).pathname
    expect((await put(stolen.toString(), signedHeaders)).status, 'the signature of one key on another key').toBe(403)
    const missing = await fetch(answer.body.publicUrl, { method: 'GET' })
    expect(missing.status, 'nothing of those refused uploads was stored').toBe(404)
  })

  it('[SEC-R2LIVE-CACHE] full and thumb answer the cache policy and a HIT on a repeat: plainly, with an Origin, with a query', async () => {
    expect(addresses).not.toBeNull()
    for (const request of sixRequests((addresses as NonNullable<typeof addresses>).publicUrl)) {
      const first = await fetch(request.url, { headers: request.headers })
      expect(first.status, `${request.label}: first request`).toBe(200)
      expect(first.headers.get('cache-control'), `${request.label}: Cache-Control`).toBe(PUBLIC_CACHE_CONTROL)
      // the Origin variant is real only when the request really carried the header: the bucket's CORS rule answers it
      if (request.headers.Origin) expect(first.headers.get('access-control-allow-origin'), `${request.label}: the Origin header was sent`).toBe(request.headers.Origin)
      let status = ''
      for (let attempt = 0; attempt < 5 && status !== 'HIT'; attempt++) {
        const again = await fetch(request.url, { headers: request.headers })
        expect(again.status, `${request.label}: repeat`).toBe(200)
        expect(again.headers.get('cache-control'), `${request.label}: Cache-Control on the repeat`).toBe(PUBLIC_CACHE_CONTROL)
        status = (again.headers.get('cf-cache-status') ?? '').toUpperCase()
        if (status !== 'HIT') await wait(700)
      }
      expect(status, `${request.label}: cf-cache-status on a repeat`).toBe('HIT')
    }
  })

  it('[SEC-R2LIVE-PURGE] after deleteListingPhoto (R2 delete, then the folder purge, reported purged) the same six requests answer 404', async () => {
    expect(addresses).not.toBeNull()
    const { publicUrl } = addresses as NonNullable<typeof addresses>
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    const result = await deleteListingPhoto(publicUrl, 'task1038_live_test')
    deletedByTest = true
    expect(result, JSON.stringify({ ...result, purge: typeof result.purge === 'string' ? result.purge : result.purge.outcome })).toMatchObject({ removed: 1, kept: 0, failed: 0, dryRun: false, purge: { outcome: 'purged' } })
    for (const request of sixRequests(publicUrl)) {
      let status = 0
      for (let attempt = 0; attempt < 10 && status !== 404; attempt++) {
        status = (await fetch(request.url, { headers: request.headers })).status
        if (status !== 404) await wait(1000)
      }
      expect(status, `${request.label}: after the purge`).toBe(404)
    }
  })
})
