import { PhotoProcessingError, processPhoto, type ProcessedPhoto } from './photoPipeline'
import { classifyPutFailure, classifySignatureRefusal, type UploadFailure } from './uploadFailure'

/**
 * The queue that processes and uploads the photos a person chose (Task 1038). Framework-free: `ImageUpload` owns one and renders its list.
 *
 * Per photo: `processing` (the browser makes the two versions, `photoPipeline.ts`), `uploading` (the route `POST /api/listings/upload-url` issues two presigned addresses and the browser PUTs
 * each version straight to R2), `done` (the address the listing stores is kept) or `failed` (with the reason the person is told, `UploadFailure`). At most two photos are in progress at once.
 * A PUT that fails on the network or with a 5xx is retried twice; an address R2 refuses with 403 (expired) is asked for again ONCE, and a second refusal is the end of that photo.
 */

export const UPLOAD_URL_ROUTE = '/api/listings/upload-url'
/** the photos in progress at once: the pipeline decodes a whole photo, and two is what a phone holds */
const CONCURRENCY = 2
/** the cache policy that was SIGNED into both addresses (`CACHE_CONTROL` of `src/lib/media/r2.ts`, server-only): R2 refuses a PUT that sends another value */
const CACHE_CONTROL = 'public, max-age=3600, s-maxage=31536000'
/** the waits before the first and the second retry of a PUT */
const RETRY_DELAYS_MS = [1_000, 3_000]
/** a PUT that makes no progress for this long is a network failure */
const PUT_TIMEOUT_MS = 120_000

export type PendingPhotoState = 'processing' | 'uploading' | 'done' | 'failed'

export interface PendingPhoto {
  id: string
  state: PendingPhotoState
  /** 0 to 100, from the bytes sent of both versions */
  progress: number
  /** why the photo failed (`state` is `failed`) */
  failure?: UploadFailure
  /** the address a listing stores (`state` is `done`) */
  publicUrl?: string
}

export interface UploadQueueDeps {
  fetch?: typeof fetch
  /** one PUT: resolves with the HTTP status, `0` when there was no answer; `onProgress` gets the bytes sent so far */
  put?: (address: string, blob: Blob, headers: Record<string, string>, onProgress: (loaded: number) => void) => Promise<number>
  newId?: () => string
}

export interface UploadQueue {
  add(files: readonly File[]): void
  /** runs a failed photo again from the start */
  retry(id: string): void
  remove(id: string): void
  items(): readonly PendingPhoto[]
  /** resolves when no photo is waiting or in progress */
  idle(): Promise<void>
}

interface Addresses { fullUrl: string; thumbUrl: string; publicUrl: string }

interface Job {
  item: PendingPhoto
  file: File
  status: 'queued' | 'running' | 'finished'
  removed: boolean
  slotReleased: boolean
}

function xhrPut(address: string, blob: Blob, headers: Record<string, string>, onProgress: (loaded: number) => void): Promise<number> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', address)
    // `Content-Length` is not set: a browser sets it from the blob, and it is the length that was signed
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.timeout = PUT_TIMEOUT_MS
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(event.loaded) }
    xhr.onload = () => resolve(xhr.status)
    xhr.onerror = () => resolve(0)
    xhr.ontimeout = () => resolve(0)
    xhr.onabort = () => resolve(0)
    xhr.send(blob)
  })
}

function defaultId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function pickAddresses(body: unknown): Addresses | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const b = body as Record<string, unknown>
  if (typeof b.fullUrl !== 'string' || typeof b.thumbUrl !== 'string' || typeof b.publicUrl !== 'string' || !b.fullUrl || !b.thumbUrl || !b.publicUrl) return null
  return { fullUrl: b.fullUrl, thumbUrl: b.thumbUrl, publicUrl: b.publicUrl }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createUploadQueue({ listingId, onChange, deps = {} }: { listingId?: string; onChange: (items: readonly PendingPhoto[]) => void; deps?: UploadQueueDeps }): UploadQueue {
  const fetchImpl = deps.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const putImpl = deps.put ?? xhrPut
  const newId = deps.newId ?? defaultId
  const jobs: Job[] = []
  let running = 0
  let idleWaiters: (() => void)[] = []

  const items = () => jobs.map((job) => job.item)
  const emit = () => onChange(items())
  const set = (job: Job, patch: Partial<PendingPhoto>) => {
    if (job.removed) return
    job.item = { ...job.item, ...patch }
    emit()
  }

  function releaseSlot(job: Job) {
    if (job.slotReleased) return
    job.slotReleased = true
    running -= 1
  }

  function settle() {
    pump()
    if (running === 0 && !jobs.some((job) => job.status === 'queued')) {
      const waiters = idleWaiters
      idleWaiters = []
      waiters.forEach((resolve) => resolve())
    }
  }

  function pump() {
    while (running < CONCURRENCY) {
      const next = jobs.find((job) => job.status === 'queued')
      if (!next) return
      next.status = 'running'
      next.slotReleased = false
      running += 1
      void run(next).catch(() => set(next, { state: 'failed', failure: 'failed' })).finally(() => {
        next.status = 'finished'
        releaseSlot(next)
        settle()
      })
    }
  }

  /** the two addresses for this photo, or why there are none */
  async function requestAddresses(photo: ProcessedPhoto): Promise<{ addresses: Addresses } | { failure: UploadFailure }> {
    try {
      const res = await fetchImpl(UPLOAD_URL_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(listingId ? { listingId } : {}), type: photo.type, fullBytes: photo.full.size, thumbBytes: photo.thumb.size }),
      })
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null)
        const code = typeof body === 'object' && body !== null && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : undefined
        const retryAfter = Number(res.headers?.get?.('Retry-After'))
        return { failure: classifySignatureRefusal(res.status, code, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined) }
      }
      const addresses = pickAddresses(await res.json())
      return addresses ? { addresses } : { failure: 'unavailable' }
    } catch {
      return { failure: 'network' }   // fetch itself threw (no answer) or the answer was not JSON
    }
  }

  /** one PUT, retried twice when there was no answer or R2 failed (5xx); any other answer ends it */
  async function putWithRetries(address: string, blob: Blob, type: string, onProgress: (loaded: number) => void): Promise<number> {
    let status = 0
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) await delay(RETRY_DELAYS_MS[attempt - 1])
      status = await putImpl(address, blob, { 'Content-Type': type, 'Cache-Control': CACHE_CONTROL }, onProgress)
      if (status >= 200 && status < 300) return status
      if (status !== 0 && status < 500) return status
    }
    return status
  }

  async function run(job: Job): Promise<void> {
    let photo: ProcessedPhoto
    try {
      photo = await processPhoto(job.file)
    } catch (err) {
      set(job, { state: 'failed', failure: err instanceof PhotoProcessingError ? err.reason : 'processing' })
      return
    }
    if (job.removed) return

    let renewed = false
    let asked = await requestAddresses(photo)
    for (;;) {
      if (job.removed) return
      if ('failure' in asked) {
        set(job, { state: 'failed', failure: asked.failure })
        return
      }
      const { addresses } = asked
      set(job, { state: 'uploading', progress: 0 })
      const total = photo.full.size + photo.thumb.size
      const sent = [0, 0]
      let best = 0
      const report = (index: 0 | 1, blob: Blob) => (loaded: number) => {
        sent[index] = Math.min(loaded, blob.size)
        best = Math.max(best, Math.min(99, Math.floor(((sent[0] + sent[1]) / total) * 100)))
        set(job, { progress: best })
      }
      const statuses = await Promise.all([
        putWithRetries(addresses.fullUrl, photo.full, photo.type, report(0, photo.full)),
        putWithRetries(addresses.thumbUrl, photo.thumb, photo.type, report(1, photo.thumb)),
      ])
      if (job.removed) return
      const bad = statuses.find((status) => status < 200 || status >= 300)
      if (bad === undefined) {
        set(job, { state: 'done', progress: 100, publicUrl: addresses.publicUrl })
        return
      }
      if (bad === 403 && !renewed) {
        // the address expired (or was refused): one new pair, never a second
        renewed = true
        asked = await requestAddresses(photo)
        continue
      }
      set(job, { state: 'failed', failure: classifyPutFailure(bad) })
      return
    }
  }

  return {
    add(files) {
      for (const file of files) jobs.push({ item: { id: newId(), state: 'processing', progress: 0 }, file, status: 'queued', removed: false, slotReleased: true })
      emit()
      pump()
    },
    retry(id) {
      const job = jobs.find((candidate) => candidate.item.id === id)
      if (!job || job.item.state !== 'failed' || job.status === 'running') return
      job.item = { id, state: 'processing', progress: 0 }
      job.status = 'queued'
      emit()
      pump()
    },
    remove(id) {
      const at = jobs.findIndex((candidate) => candidate.item.id === id)
      if (at === -1) return
      const [job] = jobs.splice(at, 1)
      job.removed = true
      if (job.status === 'running') releaseSlot(job)   // its place is free at once; what it still holds is dropped when it ends
      emit()
      settle()
    },
    items,
    idle() {
      if (running === 0 && !jobs.some((job) => job.status === 'queued')) return Promise.resolve()
      return new Promise<void>((resolve) => { idleWaiters.push(resolve) })
    },
  }
}
