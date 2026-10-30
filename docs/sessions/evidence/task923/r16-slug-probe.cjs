/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 16, R65 (b): "the executor first proves that generateSlug (createListing.ts) only produces such values and reports otherwise". The rule is
//   slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and at most 120 characters (a session INSERT of hardening v7).
// This script reads the REAL text of generateSlug from src/modules/listings/actions/createListing.ts (the function is not exported), removes the two TypeScript annotations and nothing else,
// and runs it on realistic titles and on a seeded pseudo-random sample. No database, no network, no file is written.
//   node docs/sessions/evidence/task923/r16-slug-probe.cjs
const fs = require('fs')
const src = fs.readFileSync('C:/Claude_Code_Projects/lero-al/src/modules/listings/actions/createListing.ts', 'utf8')
const m = /function generateSlug\(title: string\): string \{[\s\S]*?\n\}/.exec(src)
if (!m) throw new Error('generateSlug not found in createListing.ts')
const text = m[0].replace('(title: string): string', '(title)')
const generateSlug = new Function(`${text}\nreturn generateSlug`)()
const RULE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const verdict = (slug) => {
  const why = []
  if (slug.length > 120) why.push('longer than 120')
  if (!RULE.test(slug)) {
    if (/^-/.test(slug)) why.push('starts with a hyphen')
    if (/--/.test(slug)) why.push('two hyphens in a row')
    if (/-$/.test(slug)) why.push('ends with a hyphen')
    if (/[^a-z0-9-]/.test(slug)) why.push('a character outside a-z0-9-')
    if (!why.length) why.push('does not match the rule')
  }
  return why
}
console.log('real text of generateSlug (annotations removed):')
console.log(text.split('\n').map((l) => '  ' + l).join('\n'))

const samples = [
  'Apartament 2+1 në Tiranë', 'Shitet apartament - 2+1', 'Apartment for sale — Tirana', 'Villa me pamje nga deti', 'Продається квартира в центрі', 'Квартира 2+1', '   ', '---', 'A - B', 'ë ç',
  'Apartament 3+1, 120 m2, kati 5/9 (ri)', 'X'.repeat(200), `${'ab '.repeat(30)}-end`, 'Apartment_with_underscores', 'Zyrë me qira - qendër',
]
console.log('\nrealistic titles (the slug of generateSlug, its verdict under the R65 (b) rule):')
let refusedSamples = 0
for (const t of samples) {
  const s = generateSlug(t)
  const why = verdict(s)
  if (why.length) refusedSamples++
  console.log(`  ${why.length ? 'REFUSED' : 'ok     '} title ${JSON.stringify(t.length > 40 ? t.slice(0, 40) + '...' : t)} -> ${JSON.stringify(s.length > 60 ? s.slice(0, 60) + '...' : s)}${why.length ? '  (' + why.join('; ') + ')' : ''}`)
}

// seeded pseudo-random titles: a plain LCG so the run is reproducible
let seed = 20261020
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
const ALPHABET = ['a', 'b', 'e', 'k', 'z', '1', '2', '3', '+', ' ', ' ', ' ', '-', '-', ',', '.', '/', '(', ')', 'ë', 'ç', 'é', 'я', 'ї', 'и', 'ж', '_', '&']
const reasons = new Map()
let refused = 0
const N = 20000
const examples = []
for (let i = 0; i < N; i++) {
  const len = 1 + Math.floor(rnd() * 70)
  let t = ''
  for (let j = 0; j < len; j++) t += ALPHABET[Math.floor(rnd() * ALPHABET.length)]
  const s = generateSlug(t)
  const why = verdict(s)
  if (why.length) {
    refused++
    for (const w of why) reasons.set(w, (reasons.get(w) || 0) + 1)
    if (examples.length < 6) examples.push([t, s, why.join('; ')])
  }
}
console.log(`\nseeded pseudo-random sample: ${N} titles, ${refused} produce a slug the rule refuses (${(100 * refused / N).toFixed(1)}%)`)
for (const [w, n] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(6)}  ${w}`)
for (const [t, s, w] of examples) console.log(`  e.g. title ${JSON.stringify(t)} -> ${JSON.stringify(s)} (${w})`)
console.log(`\nRESULT: generateSlug does ${refusedSamples === 0 && refused === 0 ? '' : 'NOT '}only produce slugs of the R65 (b) rule`)
process.exit(0)
