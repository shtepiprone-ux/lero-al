// Task 888 R5 — two-armed plant for `check:hydration -- --with-admin` on /admin.
// Usage (project root): node.exe docs\sessions\evidence\task888\plant-admin-mismatch.mjs apply | restore
// apply   : creates src/app/admin/__hydrationPlant.tsx (client component whose text differs server vs client)
//           and renders it once inside src/app/admin/page.tsx. Pre-apply bytes are saved beside this script.
// restore : deletes the plant file and writes page.tsx's pre-apply bytes back. Prints git hash-object before/after.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const page = path.join(root, 'src', 'app', 'admin', 'page.tsx')
const plant = path.join(root, 'src', 'app', 'admin', '__hydrationPlant.tsx')
const backup = path.join(path.dirname(fileURLToPath(import.meta.url)), 'page.tsx.pre-apply')
const hash = (f) => execFileSync('git', ['hash-object', f], { encoding: 'utf8' }).trim()

const PLANT_SRC = `'use client'

export function HydrationPlant() {
  return <span>{typeof window === 'undefined' ? 'server' : 'client'}</span>
}
`
const mode = process.argv[2]

if (mode === 'apply') {
  if (fs.existsSync(plant) || fs.existsSync(backup)) throw new Error('plant already applied — run restore first')
  const orig = fs.readFileSync(page)
  console.log('page.tsx hash before apply: ' + hash(page))
  fs.writeFileSync(backup, orig)
  const nl = orig.toString('utf8').includes('\r\n') ? '\r\n' : '\n'
  let s = orig.toString('utf8')
  const imp = "import { AdminDashboardView } from '@/modules/admin/dashboard/components/AdminDashboardView'"
  const ret = 'return <AdminDashboardView data={data} locale={locale} />'
  if (s.split(imp).length !== 2 || s.split(ret).length !== 2) throw new Error('page.tsx no longer matches the expected shape')
  s = s.replace(imp, () => imp + nl + "import { HydrationPlant } from './__hydrationPlant'")
  s = s.replace(ret, () => 'return (<><AdminDashboardView data={data} locale={locale} /><HydrationPlant /></>)')
  fs.writeFileSync(plant, PLANT_SRC)
  fs.writeFileSync(page, s)
  console.log('applied; page.tsx hash now: ' + hash(page))
} else if (mode === 'restore') {
  if (!fs.existsSync(backup)) throw new Error('no backup — nothing to restore')
  fs.writeFileSync(page, fs.readFileSync(backup))
  if (fs.existsSync(plant)) fs.unlinkSync(plant)
  fs.unlinkSync(backup)
  console.log('page.tsx hash after restore: ' + hash(page))
  console.log('plant file present: ' + fs.existsSync(plant))
} else {
  throw new Error('usage: apply | restore')
}
