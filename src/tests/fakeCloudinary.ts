/**
 * A fetch double of the parts of Cloudinary the cleanup and the account-folder purge talk to (Task 957). Its endpoints and answer shapes are the ones a read-only probe of the live
 * Admin API returned on 2026-11-19: `GET /resources/image` and `GET /resources/by_asset_folder` answer `{ resources: [{ public_id, asset_folder, created_at, ... }], next_cursor? }`,
 * `GET /folders` and `GET /folders/<path>` answer `{ folders: [{ name, path }], next_cursor? }`; `POST /image/destroy` and `DELETE /folders/<path>` are the two writes. A folder
 * that holds an asset or a folder is refused by the delete (as the live API refuses a non-empty folder: UNKNOWN for the exact text, so the double only needs a non-ok answer).
 * Everything in it is synthetic.
 */
export interface FakeAsset { public_id: string; asset_folder: string; created_at: string }

export interface FakeCloudinary {
  assets: FakeAsset[]
  folders: Set<string>
  /** every request, in order: `GET /folders/x`, `DELETE /folders/x`, `POST /image/destroy public_id` */
  calls: string[]
  /** how many requests were made to the Admin API's reads (the budget the cleanup keeps) */
  adminReads: () => number
  destroyed: () => string[]
  removedFolders: () => string[]
  fetch: (url: string | URL, init?: RequestInit) => Promise<Response>
  addFolder: (path: string) => void
  addAsset: (publicId: string, ageDays: number) => void
}

const PAGE = 500

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

export function createFakeCloudinary(cloud = 'demo'): FakeCloudinary {
  const state: Pick<FakeCloudinary, 'assets' | 'folders' | 'calls'> = { assets: [], folders: new Set(), calls: [] }
  const base = `https://api.cloudinary.com/v1_1/${cloud}`

  function addFolder(path: string) {
    const parts = path.split('/')
    for (let i = 1; i <= parts.length; i++) state.folders.add(parts.slice(0, i).join('/'))
  }
  function addAsset(publicId: string, ageDays: number) {
    const folder = publicId.includes('/') ? publicId.slice(0, publicId.lastIndexOf('/')) : ''
    if (folder) addFolder(folder)
    state.assets.push({ public_id: publicId, asset_folder: folder, created_at: new Date(Date.now() - ageDays * 86_400_000).toISOString() })
  }
  const children = (path: string) => [...state.folders].filter((f) => (path === '' ? !f.includes('/') : f.startsWith(`${path}/`) && !f.slice(path.length + 1).includes('/'))).sort()
  const page = <T,>(rows: T[], cursor: string | null, max: number) => {
    const from = cursor ? Number(cursor) : 0
    const slice = rows.slice(from, from + max)
    return { slice, next: from + max < rows.length ? String(from + max) : undefined }
  }

  async function fetchDouble(input: string | URL, init: RequestInit = {}): Promise<Response> {
    const url = new URL(String(input))
    const method = (init.method ?? 'GET').toUpperCase()
    if (!String(input).startsWith(base)) return json({ error: { message: 'unexpected host' } }, 500)
    const path = decodeURIComponent(url.pathname.slice(`/v1_1/${cloud}`.length))
    const max = Math.min(Number(url.searchParams.get('max_results') ?? 10), PAGE)
    const cursor = url.searchParams.get('next_cursor')

    if (method === 'GET' && path === '/resources/image') {
      state.calls.push('GET /resources/image')
      const { slice, next } = page(state.assets, cursor, max)
      return json({ resources: slice, next_cursor: next })
    }
    if (method === 'GET' && path === '/resources/by_asset_folder') {
      const folder = url.searchParams.get('asset_folder') ?? ''
      state.calls.push(`GET /resources/by_asset_folder ${folder}`)
      const { slice, next } = page(state.assets.filter((a) => a.asset_folder === folder), cursor, max)
      return json({ resources: slice, next_cursor: next })
    }
    if (method === 'GET' && (path === '/folders' || path.startsWith('/folders/'))) {
      const folder = path === '/folders' ? '' : path.slice('/folders/'.length)
      state.calls.push(`GET /folders${folder ? `/${folder}` : ''}`)
      if (folder && !state.folders.has(folder)) return json({ error: { message: 'Can\'t find folder' } }, 404)
      const { slice, next } = page(children(folder), cursor, max)
      return json({ folders: slice.map((p) => ({ name: p.slice(p.lastIndexOf('/') + 1), path: p })), next_cursor: next })
    }
    if (method === 'POST' && path === '/image/destroy') {
      const publicId = String((init.body as FormData).get('public_id'))
      state.calls.push(`POST /image/destroy ${publicId}`)
      const at = state.assets.findIndex((a) => a.public_id === publicId)
      if (at === -1) return json({ result: 'not found' })
      state.assets.splice(at, 1)
      return json({ result: 'ok' })
    }
    if (method === 'DELETE' && path.startsWith('/folders/')) {
      const folder = path.slice('/folders/'.length)
      state.calls.push(`DELETE /folders/${folder}`)
      if (!state.folders.has(folder)) return json({ error: { message: 'Can\'t find folder' } }, 404)
      if (children(folder).length > 0 || state.assets.some((a) => a.asset_folder === folder)) return json({ error: { message: 'Folder is not empty' } }, 400)
      state.folders.delete(folder)
      return json({ deleted: [folder] })
    }
    return json({ error: { message: `unexpected ${method} ${path}` } }, 500)
  }

  return {
    ...state,
    adminReads: () => state.calls.filter((c) => c.startsWith('GET ')).length,
    destroyed: () => state.calls.filter((c) => c.startsWith('POST /image/destroy ')).map((c) => c.slice('POST /image/destroy '.length)),
    removedFolders: () => state.calls.filter((c) => c.startsWith('DELETE /folders/')).map((c) => c.slice('DELETE /folders/'.length)),
    fetch: fetchDouble,
    addFolder,
    addAsset,
  }
}
