#!/usr/bin/env node
/**
 * Blocking, diff-scoped kickoff claim-evidence gate.
 *
 * Usage:
 *   npm run check:kickoff-evidence
 *   KICKOFF_EVIDENCE_BASE_SHA=<base> KICKOFF_EVIDENCE_HEAD_SHA=<head> npm run check:kickoff-evidence
 *   node scripts/check-kickoff-evidence.mjs --files tasks/Sprints/Sprint_90_kickoff_prompt_Task_920.md
 *   npm run check:kickoff-evidence:verify
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, isAbsolute, relative, resolve, sep } from 'node:path'

let root = process.cwd()
const argv = process.argv.slice(2)
const verifyGate = argv.includes('--verify-gate')
const filesIndex = argv.indexOf('--files')

function fail(message) {
  return { ok: false, message }
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function changedKickoffs() {
  if (filesIndex !== -1) return argv.slice(filesIndex + 1)
  const base = process.env.KICKOFF_EVIDENCE_BASE_SHA
  const head = process.env.KICKOFF_EVIDENCE_HEAD_SHA
  const args = base && head
    ? ['diff', '--name-only', '--diff-filter=ACMR', base, head, '--']
    : ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD', '--']
  return git(args).split(/\r?\n/).filter(Boolean)
}

function isActiveKickoff(file) {
  const normalized = file.replaceAll('\\', '/')
  return normalized.startsWith('tasks/')
    && !normalized.startsWith('tasks/Archive/')
    && /kickoff.*\.md$/i.test(basename(normalized))
}

function sections(content, headingPattern) {
  const lines = content.split(/\r?\n/)
  const headings = [], fenced = new Set()
  let fence = null
  for (let index = 0; index < lines.length; index += 1) {
    const marker = lines[index].match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      fenced.add(index)
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null
    } else if (marker) {
      fence = marker[1]
      fenced.add(index)
    } else {
      const match = lines[index].match(/^(#+)\s/)
      if (match) headings.push({ index, level: match[1].length })
    }
  }
  return headings.filter(({ index }) => headingPattern.test(lines[index])).map(({ index: start, level }) => {
    const end = headings.find(h => h.index > start && h.level <= level)?.index ?? lines.length
    return { heading: lines[start], lines: lines.slice(start + 1, end).filter((_, i) => !fenced.has(start + 1 + i)) }
  })
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function parseTableRow(line) {
  if (!line.trim().startsWith('|')) return null
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
}

function pathInsideRoot(path) {
  const relativePath = relative(root, path)
  return relativePath !== '' && !relativePath.startsWith(`..${sep}`) && relativePath !== '..' && !isAbsolute(relativePath)
}

function checkSourceEvidence(evidence, file, id) {
  const match = evidence.match(/source:\s*`?([^\s`;`]+):(\d+)(?:-(\d+))?`?;\s*observed:\s*`([^`]+)`/i)
  if (!match) return fail(`${file}: ${id} must use source: \`path:line-line\`; observed: \`literal\`.`)
  const [, sourcePath, startText, endText, observed] = match
  const source = resolve(root, sourcePath)
  if (!pathInsideRoot(source) || !existsSync(source)) return fail(`${file}: ${id} cites missing/out-of-repository source ${sourcePath}.`)
  const lines = readFileSync(source, 'utf8').split(/\r?\n/)
  const start = Number(startText)
  const end = Number(endText ?? startText)
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > lines.length) {
    return fail(`${file}: ${id} cites invalid range ${sourcePath}:${startText}-${endText ?? startText}.`)
  }
  const observedRange = normalize(lines.slice(start - 1, end).join('\n'))
  if (!observedRange.includes(normalize(observed))) {
    return fail(`${file}: ${id} observed literal is not present in ${sourcePath}:${start}-${end}.`)
  }
  return { ok: true }
}

function declaration(line, type) {
  // A list/table entry or an unambiguous cited label is a declaration; prose references are not.
  const match = line.match(new RegExp(`^\\s*(\\|\\s*|(?:[-*+]|\\d+[.)])\\s+)?(?:\\*\\*|__)?(${type}\\d+)\\b(?!['’])(?:\\*\\*|__)?(.*)$`))
  if (!match || (!match[1] && !/^\s*\[/.test(match[3]))) return null
  return { id: match[2], after: match[3] }
}

function claimReferences(sectionLines, type, file, ids, requirementIds = null) {
  const messages = []
  let count = 0
  for (const line of sectionLines) {
    const entry = declaration(line, type)
    const mentions = entry ? [entry.id] : []
    if (mentions.length === 0) continue
    for (const mention of mentions) {
      count += 1
      const afterId = entry.after
      const citation = afterId.match(/^\s*\[([^\]]+)\]/)
      if (!citation) {
        messages.push(`${file}: ${mention} must immediately cite its ${requirementIds ? 'requirement as [R…]' : 'evidence as [C…; D…]'}.`)
        continue
      }
      const referenced = [...citation[1].matchAll(/\b([CD]\d+)\b/g)].map((item) => item[1])
      if (referenced.length === 0 && !requirementIds) {
        messages.push(`${file}: ${mention} has no C#/D# citation.`)
      }
      for (const id of referenced) {
        if (!ids.has(id)) messages.push(`${file}: ${mention} cites unknown ${id}.`)
      }
      if (requirementIds) {
        const requirements = [...citation[1].matchAll(/\b(R\d+)\b/g)].map((item) => item[1])
        if (requirements.length === 0) {
          messages.push(`${file}: ${mention} must cite the requirement it verifies as [R…].`)
        }
        for (const requirement of requirements) {
          if (!requirementIds.has(requirement)) messages.push(`${file}: ${mention} cites unknown ${requirement}.`)
        }
      }
    }
  }
  if (count === 0) messages.push(`${file}: no ${type}# identifier found in its required section.`)
  return messages
}

function validateKickoff(file, content = null) {
  const markdown = content ?? readFileSync(resolve(root, file), 'utf8')
  const ledgers = sections(markdown, /^#{1,6}\s+(?:\d+(?:\.\d+)?[.)]\s*)?Claim ledger\b/i)
  const ledgerCount = ledgers.length
  const ledger = ledgers[0] ?? null
  const requirements = sections(markdown, /^#{1,6}\s+(?:\d+(?:\.\d+)*[.)]?\s+)?Requirements\b/i)
  const acceptance = sections(markdown, /^#{1,6}\s+(?:\d+(?:\.\d+)*[.)]?\s+)?Acceptance criteria\b/i)
  const receipt = /^\s*KICKOFF EVIDENCE PREFLIGHT COMPLETE\s*[—-]\s*claims:\s*C\d+/im.test(markdown)
  const errors = []
  if (!ledger) errors.push(`${file}: missing required ## Claim ledger section.`)
  if (ledgerCount > 1) errors.push(`${file}: exactly one ## Claim ledger section is required; found ${ledgerCount}.`)
  if (!requirements.length) errors.push(`${file}: missing required ## Requirements section.`)
  if (!acceptance.length) errors.push(`${file}: missing required ## Acceptance criteria section.`)
  if (!receipt) errors.push(`${file}: missing KICKOFF EVIDENCE PREFLIGHT COMPLETE receipt.`)
  if (errors.length > 0) return errors

  const rows = ledger.lines.map(parseTableRow).filter(Boolean)
  const header = rows.find((row) => /^(id|claim id)$/i.test(row[0] ?? '') && /^status$/i.test(row[1] ?? '') && /^claim$/i.test(row[2] ?? '') && /^evidence$/i.test(row[3] ?? ''))
  if (!header) return [`${file}: Claim ledger must use | ID | Status | Claim | Evidence |.`]
  const labelledRows = rows.filter((row) => /^[A-Z]\d+$/i.test(row[0] ?? ''))
  const unsupportedIds = labelledRows.filter((row) => !/^[CD]\d+$/i.test(row[0] ?? ''))
  if (unsupportedIds.length > 0) {
    return [`${file}: Claim ledger only permits C# FACT and D# OWNER DECISION rows; found ${unsupportedIds.map((row) => row[0]).join(', ')}.`]
  }
  const claimRows = labelledRows
  if (claimRows.length === 0) return [`${file}: Claim ledger has no C#/D# rows.`]
  const ids = new Set()
  for (const row of claimRows) {
    const [rawId, rawStatus, claim, evidence] = row
    const id = rawId.toUpperCase()
    const status = rawStatus.toUpperCase()
    if (ids.has(id)) errors.push(`${file}: duplicate Claim ledger ID ${id}.`)
    ids.add(id)
    if (!claim || /<[^>]+>/.test(claim)) errors.push(`${file}: ${id} has an empty/placeholder claim.`)
    if (id.startsWith('C')) {
      if (status !== 'FACT') errors.push(`${file}: ${id} must have status FACT; unresolved states block publication.`)
      else {
        const sourceResult = checkSourceEvidence(evidence ?? '', file, id)
        if (!sourceResult.ok) errors.push(sourceResult.message)
      }
    } else {
      if (status !== 'OWNER DECISION') errors.push(`${file}: ${id} must have status OWNER DECISION.`)
      if (!/owner:\s*\d{4}-\d{2}-\d{2};\s*decision:\s*`[^`]+`/i.test(evidence ?? '')) {
        errors.push(`${file}: ${id} must use owner: YYYY-MM-DD; decision: \`owner choice in English\`.`)
      }
    }
  }
  const requirementLines = requirements.flatMap(s => s.lines)
  const acceptanceLines = acceptance.flatMap(s => s.lines)
  const requirementIds = new Set(requirementLines.flatMap(line => {
    const entry = declaration(line, 'R')
    return entry ? [entry.id] : []
  }))
  errors.push(...claimReferences(requirementLines, 'R', file, ids))
  errors.push(...claimReferences(acceptanceLines, 'AC', file, ids, requirementIds))
  return errors
}

function runVerifyGate() {
  const temp = mkdtempSync(resolve(tmpdir(), 'lero-kickoff-evidence-'))
  try {
    const valid = `# Task 1 kickoff\n\n## Claim ledger\n\n| ID | Status | Claim | Evidence |\n|---|---|---|---|\n| C1 | FACT | The source exports a handler. | source: \`fixture.ts:1-2\`; observed: \`export function handler\` |\n| D1 | OWNER DECISION | Preserve the current route. | owner: 2026-10-09; decision: \`Preserve the current route\` |\n\n## Requirements\n\n- R1 [C1; D1] Keep the handler route.\n\n## Acceptance criteria\n\n- AC1 [R1; C1; D1] Given the route, when called, then the handler remains exported.\n\nKICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1; owner decisions: D1; blocked claims: NONE.\n`
    writeFileSync(resolve(temp, 'fixture.ts'), 'export function handler() {}\n', 'utf8')
    const previousRoot = root
    // validateKickoff resolves evidence relative to the checked workspace. Point that workspace at the fixture.
    const originalCwd = process.cwd()
    let validErrors
    let brokenErrors
    try {
      process.chdir(temp)
      root = temp
      validErrors = validateKickoff('kickoff.md', valid)
      brokenErrors = validateKickoff('kickoff.md', valid.replace('observed: `export function handler`', 'observed: `missing literal`'))
      const duplicateLedgerErrors = validateKickoff('kickoff.md', `${valid}\n## Claim ledger\n\n| ID | Status | Claim | Evidence |\n|---|---|---|---|\n`)
      if (duplicateLedgerErrors.length === 0) {
        console.error('FAIL check:kickoff-evidence:verify — duplicate Claim ledger was accepted.')
        return 1
      }
      const revision = `${valid}\n## 52. Revision\n\n### 52.1 Requirements\n\n- R100 [C1; D1] Keep the revised handler.\n\n### 52.2 Acceptance criteria\n\n- AC100 [R100; C1] The revised handler remains exported.\n`
      const probes = [
        ['valid later revision', revision, false],
        ['unsupported later requirement', revision.replace('R100 [C1; D1]', 'R100'), true],
        ['unknown later AC requirement', revision.replace('AC100 [R100; C1]', 'AC100 [R999; C1]'), true],
        ['later AC inherits its requirement evidence', revision.replace('AC100 [R100; C1]', 'AC100 [R100]'), false],
        ['later AC must name its requirement', revision.replace('AC100 [R100; C1]', 'AC100 [C1]'), true],
        ['numbered top-level revision', revision.replace('52.1 Requirements', '52. Requirements').replace('R100 [C1; D1]', 'R100'), true],
        ['cross-reference in prose', valid.replace('Keep the handler route.', 'Keep the handler route; R1 is unchanged.'), false],
        ['possessive AC references are prose, not declarations', `${valid}\n- AC1's existing checks still apply.\n- AC1’s earlier result is retained.\n`, false],
        ['unbulleted AC reference is explanatory prose', `${valid}\nAC1 stands with these checks.\n`, false],
        ['fenced example is not a live section', `${valid}\n\`\`\`markdown\n## Requirements\n- R999 No evidence in an example.\n\`\`\`\n`, false],
        ['fenced ledger example is not a duplicate live ledger', `${valid}\n\`\`\`markdown\n## Claim ledger\n| C999 | FACT | Example only. | source: missing.ts:1; observed: literal |\n\`\`\`\n`, false],
      ]
      for (const [name, content, shouldFail] of probes) {
        const errors = validateKickoff('kickoff.md', content)
        if ((errors.length > 0) !== shouldFail) {
          console.error(`FAIL check:kickoff-evidence:verify — ${name}: ${errors.join('; ') || 'invalid route accepted'}`)
          return 1
        }
      }
    } finally {
      process.chdir(originalCwd)
      root = previousRoot
    }
    if (validErrors.length !== 0 || brokenErrors.length === 0) {
      console.error('FAIL check:kickoff-evidence:verify — valid fixture or planted unsupported claim was classified incorrectly.')
      return 1
    }
    console.log('check:kickoff-evidence self-test PASSED')
    return 0
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
}

if (verifyGate) process.exit(runVerifyGate())

let files
try {
  files = changedKickoffs().filter(isActiveKickoff)
} catch (error) {
  console.error(`FAIL check:kickoff-evidence — could not determine changed files: ${error.message}`)
  process.exit(2)
}

const errors = []
for (const file of files) {
  const absolute = resolve(root, file)
  if (!existsSync(absolute)) {
    errors.push(`${file}: changed kickoff is unavailable in this checkout.`)
    continue
  }
  errors.push(...validateKickoff(file))
}

if (errors.length > 0) {
  console.error(`FAIL check:kickoff-evidence — ${errors.length} violation(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`check:kickoff-evidence PASS — ${files.length} changed active kickoff(s) verified.`)
