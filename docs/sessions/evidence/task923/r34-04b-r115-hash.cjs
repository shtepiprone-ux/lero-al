/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R115 / AC115: the integration file is untracked, so git diff cannot show the change. Put the old line back in memory; the result must hash to the file's
// sha256 in the R110-R114 executor report, which proves the change is that one line only.
const fs = require('node:fs')
const crypto = require('node:crypto')

const file = 'src/modules/listings/actions/contactSession.integration.test.ts'
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex')
const current = fs.readFileSync(file)
const text = current.toString('utf8')
const newLine = "expect(acting.emails[0]).toMatchObject({ replyTo: viewer.email.toLowerCase() })"
const oldLine = "expect(acting.emails[0]).toMatchObject({ replyTo: 'sender@example.com' })"
const baseline = 'df18826908a63c9ac9d4e07e0d5e73bda6a83bbbffc5d13dd54a79d4016a4715'
const occurrences = text.split(newLine).length - 1
const restored = sha(text.replace(newLine, oldLine))
console.log(`file: ${file}`)
console.log(`occurrences of the new line: ${occurrences}`)
console.log(`current sha256:         ${sha(current)}`)
console.log(`old line put back hash: ${restored}`)
console.log(`R110-R114 report hash:  ${baseline}`)
console.log(`equal: ${restored === baseline}`)
process.exit(occurrences === 1 && restored === baseline ? 0 : 1)
