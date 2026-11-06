// Task 927 Amendment 5 (Opus, 2026-10-25): checks the MobileAdaptation receipt of section 16.4 the way the hooks do, before Sonnet registers it. It extracts the
// receipt from the kickoff, matches it with the helper's own regex (read from .claude/hooks/phase-receipt-contract.ps1) and applies the write gate's registry rules
// (.claude/hooks/phase-write-gate.ps1, Test-MobileAdaptationReceipt) to scripts/mobile-adaptation-patterns.json. Writes a5-10-mobile-receipt.txt.
// Usage: node a5-10-mobile-receipt.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? '.')
const KICKOFF = 'tasks/Archive/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.md'
const out = [`# Task 927 Amendment 5 MobileAdaptation receipt check (Opus), ${new Date().toISOString()}, ${process.platform}, node ${process.version}, cwd ${root}`]
const kickoff = fs.readFileSync(path.join(root, KICKOFF), 'utf8').replace(/\r\n/g, '\n')
const section = kickoff.slice(kickoff.indexOf('### 16.4 Execution preconditions'))
const found = [...section.matchAll(/MobileAdaptation: `(MOBILE ADAPTATION PREFLIGHT COMPLETE[^`]+)`/g)].map((x) => x[1])
if (found.length !== 1) throw new Error(`section 16.4 holds ${found.length} MobileAdaptation receipts`)
const receipt = found[0]
out.push(`receipt: ${receipt}`)
const ps = fs.readFileSync(path.join(root, '.claude/hooks/phase-receipt-contract.ps1'), 'utf8')
const source = ps.match(/function Get-MobileAdaptationReceiptPattern \{[\s\S]*?return '([^']+)'/)[1]
const m = new RegExp(source.replace('(?ims)', ''), 'ims').exec(receipt)
out.push(`helper regex: ${m ? 'match' : 'NO MATCH'}`)
let ok = !!m
if (m) {
  const r = JSON.parse(fs.readFileSync(path.join(root, 'scripts/mobile-adaptation-patterns.json'), 'utf8'))
  const split = (s) => s.split(/\s*,\s*/)
  const [fam, pat, std, mech, owner] = [split(m[1]), split(m[2]), split(m[3]), split(m[4]), m[5]]
  const fo = r.componentFamilies.filter((f) => fam.includes(f.id))
  const checks = {
    familiesKnown: fo.length === fam.length,
    patternsInFamilies: pat.every((p) => fo.flatMap((f) => f.patternIds).includes(p)),
    mechanismInFamilies: mech.every((x) => fo.flatMap((f) => f.mantineMechanismIds).includes(x)),
    ownerIsFamilyMember: fo.flatMap((f) => f.members).includes(owner),
    standardsKnown: std.every((s) => r.standards.some((x) => x.id === s)),
    requiredStandardsPresent: r.patterns.filter((p) => pat.includes(p.id)).flatMap((p) => p.sourceIds).every((s) => std.includes(s)),
  }
  out.push(`registry rules: ${JSON.stringify({ owner, ...checks })}`)
  ok = Object.values(checks).every(Boolean)
}
out.push(`result: ${ok ? 'PASS' : 'FAIL'}`)
fs.writeFileSync(path.join(root, 'docs/sessions/evidence/task927/amendment-5/a5-10-mobile-receipt.txt'), out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = ok ? 0 : 1
