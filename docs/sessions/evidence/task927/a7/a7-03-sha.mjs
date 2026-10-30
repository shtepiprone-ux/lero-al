// Task 927 Amendment 7: prints the sha256 of the raw bytes of one file (used by the a7-03 sensitivity proof).
// Usage (repository root): node docs/sessions/evidence/task927/a7/a7-03-sha.mjs <path>
import fs from 'node:fs'
import crypto from 'node:crypto'

const target = process.argv[2]
console.log(`${crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')}  ${target}`)
