// Task 868 browser-level plants (P7 badge, P8 columns): plant -> build-storybook -> probe -> restore -> build -> probe.
// usage: node plant-browser.mjs <evidenceFile>
// Hashes are the git blob SHA-1 (same value as `git hash-object`), computed with Node crypto.
import fs from 'node:fs'
import cp from 'node:child_process'
import crypto from 'node:crypto'

const [ev] = process.argv.slice(2)
const blob = (text) => {
  const body = Buffer.from(text, 'utf8')
  return crypto.createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
}
const PLANTS = [
  {
    id: 'P7',
    note: 'state-3 badge row justify="flex-start" -> "flex-end" (the pre-D868-4 behaviour)',
    file: 'src/design-system/mantine/patterns/MantineDataTableToCards.tsx',
    from: '<Group justify="flex-start" wrap="nowrap">\n          {/* marginRight token',
    to: '<Group justify="flex-end" wrap="nowrap">\n          {/* marginRight token',
    probe: 'badge',
  },
  {
    id: 'P8',
    note: 'columns rule removed: the 2- and 3-column grids from 40em collapse back to one column',
    file: 'src/design-system/mantine/typography-chrome.css',
    from: 'grid-template-columns: repeat(2, minmax(0, 1fr));',
    to: 'grid-template-columns: minmax(0, 1fr);',
    probe: 'cms',
    also: [['grid-template-columns: repeat(3, minmax(0, 1fr));', 'grid-template-columns: minmax(0, 1fr);']],
  },
]

const originals = new Map()
const before = {}
for (const p of PLANTS) {
  const text = fs.readFileSync(p.file, 'utf8')
  originals.set(p.file, text)
  before[p.id] = blob(text)
}

function sh(cmd) {
  try {
    return { out: cp.execSync(cmd + ' 2>&1', { maxBuffer: 1e9 }).toString(), code: 0 }
  } catch (e) {
    return { out: (e.stdout || '').toString(), code: e.status }
  }
}

const planted = {}
for (const p of PLANTS) {
  let text = originals.get(p.file)
  for (const [a, b] of [[p.from, p.to], ...(p.also ?? [])]) {
    if (text.split(a).length !== 2) throw new Error(`${p.id}: anchor not unique/found: ${a}`)
    text = text.replace(a, b)
  }
  fs.writeFileSync(p.file, text, 'utf8')
  planted[p.id] = blob(fs.readFileSync(p.file, 'utf8'))
}

const build1 = sh('npm run build-storybook')
const probes1 = {}
for (const p of PLANTS) probes1[p.id] = sh(`node docs/sessions/evidence/task868/probe868-r1.mjs ${p.probe}`).out

for (const p of PLANTS) fs.writeFileSync(p.file, originals.get(p.file), 'utf8')
const restored = {}
for (const p of PLANTS) restored[p.id] = blob(fs.readFileSync(p.file, 'utf8'))

const build2 = sh('npm run build-storybook')
const probes2 = {}
for (const p of PLANTS) probes2[p.id] = sh(`node docs/sessions/evidence/task868/probe868-r1.mjs ${p.probe}`).out

// Reduce each probe to its pass/fail facts.
function badgeFacts(out) {
  const rows = out.split('\n').filter((l) => l.startsWith('STATE3'))
  const offsets = rows.flatMap((l) => [...l.matchAll(/"toContentBox":(-?[\d.]+)/g)].map((m) => Number(m[1])))
  const bad = offsets.filter((o) => Math.abs(o) > 1)
  return `state-3 cards measured: ${offsets.length}; badge.left - cardStart outside [-1,1]: ${bad.length}${bad.length ? ' (e.g. ' + bad.slice(0, 3).join(', ') + ' px)' : ''}`
}
function cmsFacts(out) {
  const rows = out.split('\n').filter((l) => l.startsWith('CMS rich-layout@'))
  const wide = rows.filter((l) => /@(1024|1440)@/.test(l))
  const sideBySide = wide.filter((l) => !l.includes('"sameRow":false'))
  return `1024/1440 rows: ${wide.length}; with every columns block side by side: ${sideBySide.length}`
}
const facts = { badge: badgeFacts, cms: cmsFacts }

const lines = []
for (const p of PLANTS) {
  lines.push(`${p.id}: ${p.note}`)
  lines.push(`  file: ${p.file}`)
  lines.push(`  hash before=${before[p.id]} planted=${planted[p.id]} restored=${restored[p.id]} ${before[p.id] === restored[p.id] ? 'HASH_EQUAL' : 'HASH_MISMATCH'}`)
  lines.push(`  planted tree (build exit ${build1.code}): ${facts[p.probe](probes1[p.id])}`)
  lines.push(`  restored tree (build exit ${build2.code}): ${facts[p.probe](probes2[p.id])}`)
}
fs.writeFileSync(ev, lines.join('\n') + '\n')
console.log(lines.join('\n'))
