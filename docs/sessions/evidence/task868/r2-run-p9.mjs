// Task 868 revision 2: build the final tree, then plant P9 (barrel export re-added), rebuild, restore, rebuild.
// usage: node r2-run-p9.mjs   (writes r2-19a/r2-26a, r2-27-plant-p9.txt, r2-19-build.txt, r2-26-tiptap-routes.txt)
// The hash is the blob SHA-1, computed with Node crypto (equal to `git hash-object`).
import fs from 'node:fs'
import cp from 'node:child_process'
import crypto from 'node:crypto'

const ev = 'docs/sessions/evidence/task868'
const FILE = 'src/design-system/mantine/patterns/index.ts'
const blob = (text) => {
  const body = Buffer.from(text, 'utf8')
  return crypto.createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
}
const sh = (cmd) => {
  try {
    return { out: cp.execSync(cmd + ' 2>&1', { maxBuffer: 1e9 }).toString(), code: 0 }
  } catch (e) {
    return { out: (e.stdout || '').toString(), code: e.status }
  }
}
const routes = () => sh(`node ${ev}/r2-routes.mjs`).out

// 1. the final tree
const b1 = sh('npm run build')
fs.writeFileSync(`${ev}/r2-19a-build-first.txt`, b1.out + `EXIT_CODE=${b1.code}\n`)
const r1 = routes()
fs.writeFileSync(`${ev}/r2-26a-tiptap-routes-first.txt`, r1)

// 2. P9
const orig = fs.readFileSync(FILE, 'utf8')
const h0 = blob(orig)
const planted =
  orig.trimEnd() +
  "\nexport { MantineRichTextEditor } from './MantineRichTextEditor'\nexport type { MantineRichTextEditorProps, RichTextEditorLabels } from './MantineRichTextEditor'\n"
fs.writeFileSync(FILE, planted, 'utf8')
const h1 = blob(fs.readFileSync(FILE, 'utf8'))
const b2 = sh('npm run build')
const rp = routes()
fs.writeFileSync(FILE, orig, 'utf8')
const h2 = blob(fs.readFileSync(FILE, 'utf8'))

// 3. restored tree, final
const b3 = sh('npm run build')
fs.writeFileSync(`${ev}/r2-19-build.txt`, b3.out + `EXIT_CODE=${b3.code}\n`)
const rf = routes()
fs.writeFileSync(`${ev}/r2-26-tiptap-routes.txt`, rf)

const lines = [
  'P9 (R22): the MantineRichTextEditor export re-added to the patterns barrel',
  `file: ${FILE}`,
  `hash before=${h0} planted=${h1} restored=${h2} ${h0 === h2 ? 'HASH_EQUAL' : 'HASH_MISMATCH'}`,
  `planted build exit ${b2.code}; routes with Tiptap/ProseMirror:`,
  rp.trim().split('\n').slice(0, 40).join('\n'),
  `restored build exit ${b3.code}; routes with Tiptap/ProseMirror:`,
  rf.trim(),
]
fs.writeFileSync(`${ev}/r2-27-plant-p9.txt`, lines.join('\n') + '\n')
console.log(lines.join('\n'))
