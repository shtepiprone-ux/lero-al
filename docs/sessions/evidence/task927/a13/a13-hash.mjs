// Task 927 Amendment 13: prints the sha256 of the raw bytes of the one file R64 changes.
// Usage (repository root): node docs/sessions/evidence/task927/a13/a13-hash.mjs
import crypto from 'node:crypto'
import fs from 'node:fs'

const file = 'src/lib/auth/googleSignIn.integration.test.ts'
console.log(`${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${file}`)
