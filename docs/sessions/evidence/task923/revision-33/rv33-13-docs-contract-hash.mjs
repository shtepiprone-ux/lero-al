// Task 923 Revision 30 (Opus, 2026-10-22): rebind the kickoff's docs contract to the revised kickoff (canonical digest), then validate it.
// Usage: node rv33-13-docs-contract-hash.mjs <repo root> <docs contract path>
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
const [root, file] = process.argv.slice(2)
const { digest, validateContract } = await import(pathToFileURL(join(root, 'scripts/workflow-gates/contract.mjs')).href)
const text = readFileSync(join(root, file), 'utf8'); const eol = text.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(text); const before = c.taskSha256
c.taskSha256 = digest(root, [c.task])
writeFileSync(join(root, file), JSON.stringify(c, null, 2).replace(/\n/g, eol) + eol)
console.log('taskSha256 ' + before + ' -> ' + c.taskSha256 + '; scope ' + JSON.stringify(c.scope))
const errors = validateContract(root, c, { phase: 'plan' }); console.log('validation errors: ' + errors.length); for (const e of errors) console.log('  - ' + e)
