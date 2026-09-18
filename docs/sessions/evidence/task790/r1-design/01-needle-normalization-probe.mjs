import { readFileSync } from 'node:fs'
const t = readFileSync('src/design-system/mantine/__tests__/theme.d69-18.test.tsx', 'utf8')
const block = t.slice(t.indexOf('const CONTRACT_CONSUMERS'), t.indexOf("describe('D69-18 §13 consumers — each"))
const entries = [...block.matchAll(/file: '([^']+)',\s*mustContain: \[([^\]]*)\]/g)].map((m) => ({
  file: m[1],
  needles: [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]),
}))
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const stripNonNull = (s) => s.replace(/(?<=[\w)\]])!(?=\.)/g, '')
let rows = 0
for (const { file, needles } of entries)
  for (const n of needles) {
    rows++
    const src = readFileSync(file, 'utf8')
    const raw = src.includes(n)
    const nn = stripNonNull(src).includes(n)
    const code = stripNonNull(stripComments(src)).includes(n)
    const commentOnly = stripComments(src).includes(n) === false && raw
    if (!raw || !nn || !code || commentOnly) console.log(`${file} :: ${n} :: raw=${raw} nonNullStripped=${nn} codeOnly=${code}`)
  }
console.log('entries', entries.length, 'needle rows', rows)
const f = readFileSync('src/components/layout/FooterView.tsx', 'utf8')
console.log('FooterView !. sites:', (f.match(/(?<=[\w)\]])!(?=\.)/g) || []).length, '| != occurrences:', (f.match(/!=/g) || []).length)
console.log('needles containing "!":', entries.flatMap((e) => e.needles).filter((n) => n.includes('!')).length)
