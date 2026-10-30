/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 Review 42 / Revision 39 design (Opus, 2026-10-23), R78 (c): the facts the orphan test of R134 will assert, measured with the rules R134 states.
//  - Settings: SETTING_KEYS parsed from the source of src/modules/admin/actions/index.ts (a 'use server' module exports only async functions). A key has a reader outside
//    the admin code when a non-admin file contains getSetting('<key>' or key=eq.<key>, or imports from '@/modules/admin/lib/settings' a helper whose source there
//    contains getSetting('<key>'.
//  - Tables: written only from the admin directories (the rules of revision-33/r33d-02-admin-table-inventory.cjs). A table has a reader outside the admin code when a
//    non-admin file selects from it, or imports from '@/modules/admin/lib/settings' a helper whose source there reads it; otherwise its admin readers are listed.
// Read-only. Usage: node rv42-10-orphan-inventory.cjs <repo root>
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const ADMIN = ['src/app/admin/', 'src/components/admin/', 'src/modules/admin/']
const isAdmin = (f) => ADMIN.some((d) => f.startsWith(d))
const skip = (p) => /(__tests__|\.test\.|\.spec\.|\.stories\.|\/stories\/|fixtures?\/|\.d\.ts$)/.test(p)
const files = []
;(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(path.relative(root, p).split(path.sep).join('/'))
  }
})(path.join(root, 'src'))
const src = Object.fromEntries(files.filter((f) => !skip(f)).map((f) => [f, fs.readFileSync(path.join(root, f), 'utf8')]))
const LIB = 'src/modules/admin/lib/settings.ts'

// the exported functions of the settings library and their source text (up to the next export)
const lib = src[LIB]
const helpers = {}
for (const m of lib.matchAll(/export async function (\w+)/g)) {
  const next = lib.indexOf('\nexport ', m.index + 1)
  helpers[m[1]] = lib.slice(m.index, next < 0 ? undefined : next)
}
const importedOutsideAdmin = (name) => Object.entries(src).filter(([f, t]) => !isAdmin(f) && new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*'@/modules/admin/lib/settings'`).test(t)).map(([f]) => f)

const index = src['src/modules/admin/actions/index.ts']
const block = index.slice(index.indexOf('const SETTING_KEYS = ['), index.indexOf('] as const', index.indexOf('const SETTING_KEYS = [')))
const keys = [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
console.log(`SETTING_KEYS parsed: ${keys.length}`)
for (const k of keys) {
  const direct = Object.entries(src).filter(([f, t]) => !isAdmin(f) && (t.includes(`getSetting('${k}'`) || t.includes(`key=eq.${k}`))).map(([f]) => f)
  const via = Object.entries(helpers).filter(([, body]) => body.includes(`getSetting('${k}'`)).flatMap(([name]) => importedOutsideAdmin(name).map((f) => `${f} (via ${name})`))
  const readers = [...direct, ...via]
  console.log(`key ${k} | readers outside admin: ${readers.length ? readers.join(', ') : 'NONE'}`)
}

const re = /\.from\(\s*['"]([a-z_]+)['"]\s*\)\s*\.(insert|update|upsert|delete|select)\(/g
const tables = {}
for (const [f, t] of Object.entries(src)) {
  for (const m of t.matchAll(re)) {
    const x = (tables[m[1]] ??= { adminWrite: new Set(), otherWrite: new Set(), otherRead: new Set(), adminRead: new Set() })
    if (m[2] === 'select') (isAdmin(f) ? x.adminRead : x.otherRead).add(f)
    else (isAdmin(f) ? x.adminWrite : x.otherWrite).add(f)
  }
}
const adminOnly = Object.entries(tables).filter(([, x]) => x.adminWrite.size && !x.otherWrite.size).sort()
console.log(`tables written only from the admin directories: ${adminOnly.length}`)
for (const [name, x] of adminOnly) {
  const via = Object.entries(helpers).filter(([, body]) => new RegExp(`\\.from\\(\\s*['"]${name}['"]`).test(body)).flatMap(([h]) => importedOutsideAdmin(h).map((f) => `${f} (via ${h})`))
  const outside = [...x.otherRead, ...via]
  console.log(`table ${name} | readers outside admin: ${outside.length ? outside.join(', ') : 'NONE'} | admin readers: ${x.adminRead.size ? [...x.adminRead].join(', ') : 'NONE'}`)
}
