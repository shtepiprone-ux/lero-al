// Task 923 Review 62 (Opus), read-only: print the executor's Edit/Write calls for paths matching a pattern,
// de-duplicated by tool_use id, in transcript order.
// Usage: node rv62-edits.mjs <transcript.jsonl> <path-regex> [--bash <regex>]
import { readFileSync } from 'node:fs'
const [file, pat, flag, bashPat] = process.argv.slice(2)
const re = new RegExp(pat, 'i')
const bre = flag === '--bash' ? new RegExp(bashPat, 'i') : null
const seen = new Set()
for (const l of readFileSync(file, 'utf8').split('\n')) {
  if (!l) continue
  let j
  try { j = JSON.parse(l) } catch { continue }
  const c = j.message?.content
  if (!Array.isArray(c)) continue
  for (const b of c) {
    if (b.type !== 'tool_use' || seen.has(b.id)) continue
    seen.add(b.id)
    if (bre && b.name === 'Bash' || bre && b.name === 'PowerShell') {
      if (bre.test(b.input.command)) console.log(`\n### ${j.timestamp} ${b.name}\n${b.input.command}`)
      continue
    }
    if (!['Edit', 'Write', 'MultiEdit'].includes(b.name) || !re.test(b.input.file_path)) continue
    const p = b.input.file_path.replace(/.*lero-al[\\/]/, '')
    console.log(`\n### ${j.timestamp} ${b.name} ${p}`)
    if (b.name === 'Write') console.log(b.input.content)
    else console.log(`--- old\n${b.input.old_string}\n+++ new\n${b.input.new_string}${b.input.replace_all ? '\n(replace_all)' : ''}`)
  }
}
