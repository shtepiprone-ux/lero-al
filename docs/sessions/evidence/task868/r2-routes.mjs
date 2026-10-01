// Task 868 revision 2 (AC22): lists every page in `.next/app-build-manifest.json` whose chunks contain Tiptap/ProseMirror.
// usage: node r2-routes.mjs  → prints the matching routes, one per line, then a COUNT line.
import fs from 'node:fs'
import path from 'node:path'

const next = path.resolve('.next')
const manifest = JSON.parse(fs.readFileSync(path.join(next, 'app-build-manifest.json'), 'utf8'))
const MARK = /prosemirror|@tiptap|tiptap/i
const cache = new Map()
const hit = (file) => {
  if (!cache.has(file)) {
    const full = path.join(next, file)
    cache.set(file, fs.existsSync(full) && file.endsWith('.js') ? MARK.test(fs.readFileSync(full, 'utf8')) : false)
  }
  return cache.get(file)
}
const routes = Object.entries(manifest.pages)
  .filter(([, files]) => files.some(hit))
  .map(([route]) => route)
  .sort()
for (const route of routes) console.log(route)
console.log(`COUNT ${routes.length} of ${Object.keys(manifest.pages).length} pages`)
