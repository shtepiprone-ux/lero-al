// Task 859 review 15b (Opus) - summary of r15-mobile.jsonl per Story file: distinct GR-3j defects found below 640
// (320/390/560/639) and in the card range 640-767, with the widths/locales they occur at.
// usage: node r15-mobile-summary.mjs r15-mobile.jsonl > r15-mobile-summary.txt
import fs from 'node:fs'
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
const ix = JSON.parse(fs.readFileSync('C:/Claude_Code_Projects/lero-al/storybook-static/index.json', 'utf8'))
const fileOf = id => (ix.entries[id]?.importPath ?? id).replace('./src/stories/', '')
const per = new Map(); let jobs = 0, errors = 0, errScreens = 0, pageOverflow = []
const add = (file, kind, item, w, loc, n) => {
  const f = per.get(file) ?? new Map(); per.set(file, f)
  const k = `${kind} :: ${item}`; const e = f.get(k) ?? { n: 0, widths: new Set(), locs: new Set() }; f.set(k, e)
  e.n += n; e.widths.add(w); e.locs.add(loc)
}
for (const r of rows) {
  jobs++; if (r.error) { errors++; continue } if (r.err) errScreens++
  if (r.pageOverflow) pageOverflow.push(`${r.id} ${r.w} ${r.loc}`)
  const file = fileOf(r.id); const story = r.id.split('--')[1]
  for (const [t, n] of Object.entries(r.kvInline)) add(file, 'KV-INLINE', `${t} [${story}]`, r.w, r.loc, n)
  for (const [t, n] of Object.entries(r.cut)) { if (/^latent ellipsisStyle "/.test(t)) continue; add(file, t.startsWith('ACTIVE') ? 'CUT' : 'CLAMP-LATENT', `${t.replace(/^(ACTIVE|latent) /, '')} [${story}]`, r.w, r.loc, n) }
  for (const [t, n] of Object.entries(r.ellipsisText)) add(file, 'TEXT-ELLIPSIS', `${t} [${story}]`, r.w, r.loc, n)
  for (const [t, n] of Object.entries(r.avatarOff)) add(file, 'AVATAR-OFF-CENTRE', `${t.replace(/^\d+px off /, '')} [${story}]`, r.w, r.loc, n)
  for (const [t, n] of Object.entries(r.emptyFirstRow)) add(file, 'EMPTY-FIRST-ROW', `[${story}]`, r.w, r.loc, n)
  for (const [t, n] of Object.entries(r.smallTarget)) { if (/ a "/.test(t) && !/x4[0-3] a/.test(t)) {} add(file, 'TARGET<44', `${t} [${story}]`, r.w, r.loc, n) }
}
console.log(`jobs ${jobs}, crashed ${errors}, error screens ${errScreens}, page-level horizontal overflow ${pageOverflow.length}${pageOverflow.length ? ': ' + pageOverflow.slice(0, 10).join('; ') : ''}`)
const kinds = ['KV-INLINE', 'CUT', 'CLAMP-LATENT', 'TEXT-ELLIPSIS', 'AVATAR-OFF-CENTRE', 'EMPTY-FIRST-ROW', 'TARGET<44']
const totals = Object.fromEntries(kinds.map(k => [k, new Set()]))
for (const [file, f] of [...per.entries()].sort()) {
  const byKind = {}; for (const [k, e] of f) { const kind = k.split(' :: ')[0]; (byKind[kind] ??= []).push([k.split(' :: ')[1], e]); totals[kind].add(file) }
  console.log(`\n## ${file}`)
  for (const kind of kinds) { const list = byKind[kind]; if (!list) continue
    console.log(`  ${kind}: ${list.length} distinct`)
    for (const [item, e] of list.slice(0, 8)) console.log(`    ${item}  — widths ${[...e.widths].sort((a, b) => a - b).join('/')} · ${[...e.locs].join('/')}`)
    if (list.length > 8) console.log(`    … ${list.length - 8} more`) }
}
console.log('\n## Files per defect kind'); for (const k of kinds) console.log(`  ${k}: ${totals[k].size} files — ${[...totals[k]].map(f => f.split('/').pop().replace('.stories.tsx', '')).join(', ')}`)
