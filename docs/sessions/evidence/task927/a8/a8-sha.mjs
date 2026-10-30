// Task 927 Amendment 8: prints the sha256 of the raw bytes of one file (used by the a8-06 sensitivity proof and the report).
// Usage (repository root): node docs/sessions/evidence/task927/a8/a8-sha.mjs <path>
import fs from 'node:fs'
import crypto from 'node:crypto'

const target = process.argv[2]
console.log(`${crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')}  ${target}`)
