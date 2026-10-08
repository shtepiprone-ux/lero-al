// Review 9 (Opus): check:ui-contract's own Story scanner (scanChangedCanonicalStory, from r9-ui-contract-lib.mjs = the
// first 359 lines of scripts/check-ui-contract.mjs with only ROOT made absolute; the CLI entry is dropped) applied to the
// WORKING-TREE Stories this revision changed. Changed lines come from `git diff -U0 HEAD` (an untracked Story: every
// line). check:ui-contract itself cannot run until the owner commits (it reads commits only).
// usage: node r9-story-scan.mjs  (run from the repository root)
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { scanChangedCanonicalStory } from './r9-ui-contract-lib.mjs'
// `--all-changed`: every modified or untracked Story in the working tree (what the owner's commit of 859 will carry).
const allChanged = process.argv.includes('--all-changed')
  ? execSync('git status --porcelain --untracked-files=all').toString().split('\n')
    .filter(l => /\.stories\.tsx?$/.test(l) && !l.startsWith(' D') && !l.startsWith('D '))
    .map(l => l.slice(3).trim())
  : null
const files = allChanged ?? [
  'src/stories/mantine/primitives/Badge.stories.tsx',
  'src/stories/mantine/primitives/Table.stories.tsx',
  'src/stories/patterns/mantine/AdminTable.stories.tsx',
  'src/stories/patterns/mantine/AdminUsersTable.stories.tsx',
  'src/stories/patterns/mantine/MantineFilterChips.stories.tsx',
  'src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx',
  'src/stories/patterns/mantine/DetailList.stories.tsx',
  'src/stories/patterns/mantine/ActiveFilterChips.stories.tsx',
  'src/modules/cabinet/components/ListingsTab.stories.tsx',
]
let total = 0
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  let changed = new Set()
  const tracked = execSync(`git ls-files -- "${f}"`).toString().trim()
  if (!tracked) changed = new Set(text.split('\n').map((_, i) => i + 1))
  else {
    const diff = execSync(`git diff -U0 HEAD -- "${f}"`).toString()
    for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Number(m[1]); const n = m[2] === undefined ? 1 : Number(m[2])
      for (let i = 0; i < n; i += 1) changed.add(start + i)
    }
  }
  const hits = scanChangedCanonicalStory(f, text, changed)
  total += hits.length
  console.log(`${hits.length ? 'FAIL' : 'ok  '} ${f} tracked=${!!tracked} changed-lines=${changed.size} hits=${hits.length}`)
  for (const h of hits) console.log('   ', JSON.stringify(h))
}
console.log('total hits', total)
process.exit(total ? 1 : 0)
