/**
 * Task 1038 (AC2): the queue that processes and uploads the chosen photos.
 *  - at most two photos are in progress at once (processing and uploading both count), the rest wait;
 *  - each photo has its own state (processing, uploading, done, failed), a progress of 0 to 100 from the bytes sent, and, when it failed, the reason the person is told (`UploadFailure`);
 *  - a PUT that fails on the network or with a 5xx is retried twice; a PUT refused with 403 (an expired address) asks the route for new addresses ONCE, never a second time;
 *  - a refusal of the route (401, 403, 429 with its window, 500 `not_configured`, anything else) and a photo the browser cannot process are failures with their own reason;
 *  - a failed photo can be retried, a photo can be removed (a late answer is ignored); the browser PUT is a real `XMLHttpRequest` with the signed headers.
 * The doubles are the pipeline, `fetch` and the PUT (and, for the default PUT, `XMLHttpRequest`). Every address and byte count is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../photoPipeline', async (importOriginal) => ({ ...(await importOriginal<typeof import('../photoPipeline')>()), processPhoto: vi.fn() }))

import { PhotoProcessingError, processPhoto, type ProcessedPhoto } from '../photoPipeline'
import { createUploadQueue, type PendingPhoto, type UploadQueueDeps } from '../uploadQueue'

const processed = (type: 'image/webp' | 'image/jpeg' = 'image/webp'): ProcessedPhoto => ({ type, full: new Blob([new Uint8Array(300_000)], { type }), thumb: new Blob([new Uint8Array(40_000)], { type }) })
const file = (name = 'a.jpg') => new File([new Uint8Array(10)], name, { type: 'image/jpeg' })

type Answer = { ok: boolean; status: number; headers: { get: (name: string) => string | null }; json: () => Promise<unknown> }
const answer = (status: number, body: unknown = {}, headers: Record<string, string> = {}): Answer => ({ ok: status >= 200 && status < 300, status, headers: { get: (name) => headers[name] ?? null }, json: async () => body })
let routeCalls = 0
const addresses = (n: number) => answer(200, { fullUrl: `https://r2.test/${n}/full`, thumbUrl: `https://r2.test/${n}/thumb`, publicUrl: `https://media.lero.al/u/listings/${n}/full.webp` })

type PutCall = { address: string; blob: Blob; headers: Record<string, string> }
let puts: PutCall[] = []
let putStatus: (call: PutCall, index: number) => number | Promise<number> = () => 200
let routeAnswer: (n: number) => Answer | Promise<Answer> | Error = (n) => addresses(n)
let fetchMock: ReturnType<typeof vi.fn>
let putMock: ReturnType<typeof vi.fn>

function deps(): UploadQueueDeps {
  return { fetch: fetchMock as never, put: putMock as never, newId: (() => { let i = 0; return () => `p${++i}` })() }
}
function make(listingId?: string) {
  const snapshots: PendingPhoto[][] = []
  const queue = createUploadQueue({ listingId, onChange: (items) => snapshots.push(items.map((i) => ({ ...i }))), deps: deps() })
  return { queue, snapshots }
}
/** run every timer (the waits between retries) and wait until the queue has nothing left to do */
async function finish(queue: { idle: () => Promise<void> }) {
  const idle = queue.idle()
  await vi.runAllTimersAsync()
  await idle
}

beforeEach(() => {
  vi.useFakeTimers()
  routeCalls = 0
  puts = []
  putStatus = () => 200
  routeAnswer = (n) => addresses(n)
  fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
    routeCalls += 1
    const next = routeAnswer(routeCalls)
    if (next instanceof Error) throw next
    return next
  })
  putMock = vi.fn(async (address: string, blob: Blob, headers: Record<string, string>, onProgress: (loaded: number) => void) => {
    const call = { address, blob, headers }
    puts.push(call)
    onProgress(Math.floor(blob.size / 2))
    const status = await putStatus(call, puts.length - 1)
    if (status >= 200 && status < 300) onProgress(blob.size)
    return status
  })
  vi.mocked(processPhoto).mockReset().mockImplementation(async () => processed())
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the states of one photo', () => {
  it('[AC2] processing, then uploading, then done; the progress only grows to 100; the public address is kept', async () => {
    const { queue, snapshots } = make()
    queue.add([file()])
    await finish(queue)
    const states = snapshots.map((s) => s[0]?.state)
    expect(states[0]).toBe('processing')
    expect(states).toContain('uploading')
    expect(states.at(-1)).toBe('done')
    expect(states.indexOf('uploading')).toBeGreaterThan(states.indexOf('processing'))
    const progress = snapshots.map((s) => s[0].progress)
    expect([...progress].sort((a, b) => a - b)).toEqual(progress)
    expect(progress.at(-1)).toBe(100)
    expect(snapshots.at(-1)?.[0].publicUrl).toBe('https://media.lero.al/u/listings/1/full.webp')
    expect(snapshots.at(-1)?.[0].failure).toBeUndefined()
  })

  it('[AC2] the progress is the share of all bytes sent, of the large and the small version together', async () => {
    const { queue, snapshots } = make()
    queue.add([file()])
    await finish(queue)
    const seen = snapshots.map((s) => s[0].progress)
    expect(seen.some((p) => p > 0 && p < 100)).toBe(true)
  })

  it('[AC2] the queue lists its photos in the order they were added, each with its own id and state', async () => {
    const { queue } = make()
    queue.add([file('a.jpg'), file('b.jpg'), file('c.jpg')])
    await finish(queue)
    expect(queue.items().map((i) => i.id)).toEqual(['p1', 'p2', 'p3'])
    expect(queue.items().every((i) => i.state === 'done')).toBe(true)
  })
})

describe('what is sent', () => {
  it('[AC2] the route is asked with the type and both sizes (and the listing when there is one), as JSON, with the session cookie', async () => {
    const { queue } = make('44444444-4444-4444-8444-444444444444')
    queue.add([file()])
    await finish(queue)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/listings/upload-url')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('same-origin')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({ listingId: '44444444-4444-4444-8444-444444444444', type: 'image/webp', fullBytes: 300_000, thumbBytes: 40_000 })
  })

  it('[AC2] without a listing the body has no listingId', async () => {
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)).toEqual({ type: 'image/webp', fullBytes: 300_000, thumbBytes: 40_000 })
  })

  it('[AC2] each version goes to its own signed address with the content type and the cache policy that were signed', async () => {
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(puts.map((p) => p.address).sort()).toEqual(['https://r2.test/1/full', 'https://r2.test/1/thumb'])
    for (const p of puts) {
      expect(p.headers['Content-Type']).toBe('image/webp')
      expect(p.headers['Cache-Control']).toBe('public, max-age=3600, s-maxage=31536000')
    }
    expect(puts.find((p) => p.address.endsWith('/full'))?.blob.size).toBe(300_000)
    expect(puts.find((p) => p.address.endsWith('/thumb'))?.blob.size).toBe(40_000)
  })

  it('[AC2] a JPEG photo is asked for and sent as image/jpeg', async () => {
    vi.mocked(processPhoto).mockResolvedValue(processed('image/jpeg'))
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string).type).toBe('image/jpeg')
    expect(puts.every((p) => p.headers['Content-Type'] === 'image/jpeg')).toBe(true)
  })
})

describe('two at a time', () => {
  it('[AC2] of five photos two are processed at once; the next starts when one is finished', async () => {
    const releases: (() => void)[] = []
    let inFlight = 0
    let peak = 0
    vi.mocked(processPhoto).mockImplementation(() => new Promise((resolve) => {
      inFlight += 1; peak = Math.max(peak, inFlight)
      releases.push(() => { inFlight -= 1; resolve(processed()) })
    }))
    const { queue } = make()
    queue.add([file('1'), file('2'), file('3'), file('4'), file('5')])
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(2)
    releases.shift()?.()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(3)
    // let every photo that starts finish, until all five have been processed
    for (let round = 0; round < 20; round++) { releases.splice(0).forEach((release) => release()); await vi.advanceTimersByTimeAsync(0) }
    await finish(queue)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(5)
    expect(peak).toBe(2)
    expect(queue.items().every((i) => i.state === 'done')).toBe(true)
  })

  it('[AC2] a photo that is uploading keeps its place: two uploading photos hold back the third from processing', async () => {
    const holds: ((status: number) => void)[] = []
    putStatus = () => new Promise<number>((resolve) => { holds.push(resolve) })
    const { queue } = make()
    queue.add([file('1'), file('2'), file('3')])
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(2)
    expect(queue.items().map((i) => i.state)).toEqual(['uploading', 'uploading', 'processing'])
    holds.splice(0).forEach((r) => r(200))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(3)
    putStatus = () => 200
    holds.splice(0).forEach((r) => r(200))
    await finish(queue)
    expect(queue.items().map((i) => i.state)).toEqual(['done', 'done', 'done'])
  })
})

describe('retries of the PUT', () => {
  it('[AC2] a PUT that fails on the network twice and then succeeds is retried: the photo is done', async () => {
    let failures = 0
    putStatus = (call) => (call.address.endsWith('/full') && failures++ < 2 ? 0 : 200)
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0].state).toBe('done')
    expect(puts.filter((p) => p.address.endsWith('/full'))).toHaveLength(3)
    expect(routeCalls).toBe(1)   // the same address is retried; a new one is asked for only after a 403
  })

  it('[AC2] a PUT that fails on the network three times in a row (two retries) fails the photo as a network failure', async () => {
    putStatus = (call) => (call.address.endsWith('/full') ? 0 : 200)
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'network' })
    expect(puts.filter((p) => p.address.endsWith('/full'))).toHaveLength(3)
  })

  it('[AC2] a 503 from R2 is retried twice and then fails the photo as unavailable', async () => {
    putStatus = () => 503
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'unavailable' })
    expect(puts.filter((p) => p.address.endsWith('/thumb'))).toHaveLength(3)
  })

  it.each([[400, 'rejected'], [404, 'rejected'], [413, 'too_large']])('[AC2] a %s from R2 is not retried and fails the photo as %s', async (status, failure) => {
    putStatus = () => status
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure })
    expect(puts.filter((p) => p.address.endsWith('/full'))).toHaveLength(1)
    expect(routeCalls).toBe(1)
  })
})

describe('an address that expired (403 from R2)', () => {
  it('[AC2] asks the route for new addresses once and uploads both versions to them', async () => {
    putStatus = (call) => (call.address.startsWith('https://r2.test/1/') ? 403 : 200)   // the first addresses are refused, the new ones are accepted
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(routeCalls).toBe(2)
    expect(queue.items()[0].state).toBe('done')
    expect(queue.items()[0].publicUrl).toBe('https://media.lero.al/u/listings/2/full.webp')
    expect(puts.filter((p) => p.address.startsWith('https://r2.test/2/')).map((p) => p.address).sort()).toEqual(['https://r2.test/2/full', 'https://r2.test/2/thumb'])
  })

  it('[AC2] a second 403 does not ask a third time: the photo fails as rejected', async () => {
    putStatus = () => 403
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(routeCalls).toBe(2)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'rejected' })
  })

  it('[AC2] when the route refuses the new addresses the photo fails with the reason of the refusal', async () => {
    putStatus = () => 403
    routeAnswer = (n) => (n === 1 ? addresses(1) : answer(429, { error: 'rate_limited' }, { 'Retry-After': '600' }))
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'rate_limited' })
  })
})

describe('the refusals of the route', () => {
  it.each([
    [401, {}, {}, 'session'],
    [403, {}, {}, 'forbidden'],
    [429, { error: 'rate_limited' }, { 'Retry-After': '600' }, 'rate_limited'],
    [429, { error: 'rate_limited' }, { 'Retry-After': '86400' }, 'rate_limited_day'],
    [500, { error: 'not_configured' }, {}, 'not_configured'],
    [503, { error: 'unavailable' }, {}, 'unavailable'],
    [400, { error: 'invalid_body' }, {}, 'unavailable'],
  ])('[AC2] %s answers the failure %s', async (status, body, headers, failure) => {
    routeAnswer = () => answer(status, body, headers)
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure })
    expect(puts).toHaveLength(0)
  })

  it('[AC2] no answer at all (fetch throws) is a network failure', async () => {
    routeAnswer = () => new TypeError('Failed to fetch')
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'network' })
  })

  it.each([
    ['no address', {}],
    ['an address that is not text', { fullUrl: 1, thumbUrl: 2, publicUrl: 3 }],
    ['one address missing', { fullUrl: 'https://r2.test/x', publicUrl: 'https://media.lero.al/x' }],
    ['a list', []],
  ])('[AC2] an answer with %s is an unavailable failure and nothing is sent', async (_label, body) => {
    routeAnswer = () => answer(200, body)
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'unavailable' })
    expect(puts).toHaveLength(0)
  })

  it('[AC2] one failed photo does not stop the others', async () => {
    routeAnswer = (n) => (n === 2 ? answer(500, { error: 'not_configured' }) : addresses(n))
    const { queue } = make()
    queue.add([file('1'), file('2'), file('3')])
    await finish(queue)
    expect(queue.items().map((i) => i.state)).toEqual(['done', 'failed', 'done'])
  })
})

describe('a photo the browser cannot process', () => {
  it.each([
    [new PhotoProcessingError('format'), 'format'],
    [new PhotoProcessingError('too_large'), 'too_large'],
    [new PhotoProcessingError('processing'), 'processing'],
    [new Error('anything else'), 'processing'],
  ])('[AC2] %s is the failure %s and the route is not asked', async (error, failure) => {
    vi.mocked(processPhoto).mockRejectedValue(error)
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure })
    expect(routeCalls).toBe(0)
    expect(puts).toHaveLength(0)
  })
})

describe('retry and remove', () => {
  it('[AC2] retry runs a failed photo again from the start, and it can be done; retry of a photo that is not failed does nothing', async () => {
    routeAnswer = (n) => (n === 1 ? answer(503) : addresses(n))
    const { queue } = make()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0].state).toBe('failed')
    queue.retry('p1')
    queue.retry('p1')
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'done' })
    expect(queue.items()[0].failure).toBeUndefined()
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(2)
    queue.retry('p1')
    queue.retry('nope')
    await finish(queue)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(2)
  })

  it('[AC2] remove takes a photo out of the list; a photo that was being processed is not uploaded afterwards', async () => {
    let release: () => void = () => undefined
    vi.mocked(processPhoto).mockImplementation(() => new Promise((resolve) => { release = () => resolve(processed()) }))
    const { queue } = make()
    queue.add([file()])
    await vi.advanceTimersByTimeAsync(0)
    queue.remove('p1')
    expect(queue.items()).toEqual([])
    release()
    await finish(queue)
    expect(queue.items()).toEqual([])
    expect(routeCalls).toBe(0)
    expect(puts).toHaveLength(0)
  })

  it('[AC2] remove of a done photo and of an unknown id is harmless', async () => {
    const { queue } = make()
    queue.add([file('a'), file('b')])
    await finish(queue)
    queue.remove('p1')
    queue.remove('nope')
    expect(queue.items().map((i) => i.id)).toEqual(['p2'])
  })

  it('[AC2] a removed photo frees its place for the next one', async () => {
    const releases: (() => void)[] = []
    vi.mocked(processPhoto).mockImplementation(() => new Promise((resolve) => { releases.push(() => resolve(processed())) }))
    const { queue } = make()
    queue.add([file('1'), file('2'), file('3')])
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(2)
    queue.remove('p1')
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(processPhoto)).toHaveBeenCalledTimes(3)
  })
})

describe('the browser PUT', () => {
  type Sent = { method: string; url: string; headers: Record<string, string>; body: unknown }
  let sent: Sent[]
  let nextStatus: number
  let nextEvent: 'load' | 'error' | 'timeout' | 'abort'
  class FakeXhr {
    static instances: FakeXhr[] = []
    status = 0
    upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null }
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    ontimeout: (() => void) | null = null
    onabort: (() => void) | null = null
    timeout = 0
    private record: Sent = { method: '', url: '', headers: {}, body: null }
    constructor() { FakeXhr.instances.push(this) }
    open(method: string, url: string) { this.record.method = method; this.record.url = url }
    setRequestHeader(name: string, value: string) { this.record.headers[name] = value }
    send(body: unknown) {
      this.record.body = body
      sent.push(this.record)
      queueMicrotask(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 })
        if (nextEvent === 'load') { this.status = nextStatus; this.onload?.() } else if (nextEvent === 'error') this.onerror?.()
        else if (nextEvent === 'timeout') this.ontimeout?.()
        else this.onabort?.()
      })
    }
  }

  function makeDefaultPut() {
    const queue = createUploadQueue({ onChange: () => undefined, deps: { fetch: fetchMock as never, newId: () => 'x' } })
    return queue
  }

  beforeEach(() => { sent = []; nextStatus = 200; nextEvent = 'load'; FakeXhr.instances = []; vi.stubGlobal('XMLHttpRequest', FakeXhr) })

  it('[AC2] without a test double the PUT is an XMLHttpRequest of the signed address with the blob as its body and the signed headers (the browser adds the length)', async () => {
    const queue = makeDefaultPut()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0].state).toBe('done')
    expect(sent.map((s) => s.method)).toEqual(['PUT', 'PUT'])
    expect(sent.map((s) => s.url).sort()).toEqual(['https://r2.test/1/full', 'https://r2.test/1/thumb'])
    for (const s of sent) {
      expect(s.body).toBeInstanceOf(Blob)
      expect(s.headers).toEqual({ 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=3600, s-maxage=31536000' })
    }
    expect(sent.some((s) => 'Content-Length' in s.headers)).toBe(false)
  })

  it.each([['error'], ['timeout'], ['abort']] as const)('[AC2] a %s event of the request is a network failure (status 0), retried twice', async (event) => {
    nextEvent = event
    const queue = makeDefaultPut()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'network' })
    expect(sent.filter((s) => s.url.endsWith('/full'))).toHaveLength(3)
  })

  it('[AC2] a status of the request other than 2xx is the status of the failure', async () => {
    nextStatus = 403
    const queue = makeDefaultPut()
    queue.add([file()])
    await finish(queue)
    expect(queue.items()[0]).toMatchObject({ state: 'failed', failure: 'rejected' })
    expect(routeCalls).toBe(2)
  })
})
