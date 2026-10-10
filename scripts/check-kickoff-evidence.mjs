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

function section(content, headingPattern) {
  const lines = content.split(/\r?\n/)
  const start = lines.findIndex((line) => headingPattern.test(line))
  if (start < 0) return null
  const level = (lines[start].match(/^(#+)\s/) ?? [])[1]?.length ?? 1
  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#+)\s/)
    if (match && match[1].length <= level) {
      end = index
      break
    }
  }
  return { heading: lines[start], lines: lines.slice(start + 1, end) }
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

function claimReferences(sectionLines, type, file, ids, requirementIds = null) {
  const expression = new RegExp(`\\b${type}(\\d+)\\b`, 'g')
  const messages = []
  let count = 0
  for (const line of sectionLines) {
    const mentions = [...line.matchAll(expression)]
    if (mentions.length === 0) continue
    for (const mention of mentions) {
      count += 1
      const afterId = line.slice((mention.index ?? 0) + mention[0].length)
      const citation = afterId.match(/^\s*\[([^\]]+)\]/)
      if (!citation) {
        messages.push(`${file}: ${mention[0]} must immediately cite its evidence as [C…; D…].`)
        continue
      }
      const referenced = [...citation[1].matchAll(/\b([CD]\d+)\b/g)].map((item) => item[1])
      if (referenced.length === 0) {
        messages.push(`${file}: ${mention[0]} has no C#/D# citation.`)
      }
      for (const id of referenced) {
        if (!ids.has(id)) messages.push(`${file}: ${mention[0]} cites unknown ${id}.`)
      }
      if (requirementIds) {
        const requirements = [...citation[1].matchAll(/\b(R\d+)\b/g)].map((item) => item[1])
        if (requirements.length === 0) {
          messages.push(`${file}: ${mention[0]} must cite the requirement it verifies as [R…; C…; D…].`)
        }
        for (const requirement of requirements) {
          if (!requirementIds.has(requirement)) messages.push(`${file}: ${mention[0]} cites unknown ${requirement}.`)
        }
      }
    }
  }
  if (count === 0) messages.push(`${file}: no ${type}# identifier found in its required section.`)
  return messages
}

function validateKickoff(file, content = null) {
  const markdown = content ?? readFileSync(resolve(root, file), 'utf8')
  const ledgerCount = markdown.split(/\r?\n/).filter((line) => /^#{1,6}\s+(?:\d+(?:\.\d+)?[.)]\s*)?Claim ledger\b/i.test(line)).length
  const ledger = section(markdown, /^#{1,6}\s+(?:\d+(?:\.\d+)?[.)]\s*)?Claim ledger\b/i)
  const requirements = section(markdown, /^#{1,6}\s+(?:\d+(?:\.\d+)?[.)]\s*)?Requirements\b/i)
  const acceptance = section(markdown, /^#{1,6}\s+(?:\d+(?:\.\d+)?[.)]\s*)?Acceptance criteria\b/i)
  const receipt = /^\s*KICKOFF EVIDENCE PREFLIGHT COMPLETE\s*[—-]\s*claims:\s*C\d+/im.test(markdown)
  const errors = []
  if (!ledger) errors.push(`${file}: missing required ## Claim ledger section.`)
  if (ledgerCount > 1) errors.push(`${file}: exactly one ## Claim ledger section is required; found ${ledgerCount}.`)
  if (!requirements) errors.push(`${file}: missing required ## Requirements section.`)
  if (!acceptance) errors.push(`${file}: missing required ## Acceptance criteria section.`)
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
        errors.push(`${file}: ${id} must use owner: YYYY-MM-DD; decision: \`verbatim owner choice\`.`)
      }
    }
  }
  const requirementIds = new Set(requirements.lines.flatMap((line) => [...line.matchAll(/\b(R\d+)\b/g)].map((item) => item[1])))
  errors.push(...claimReferences(requirements.lines, 'R', file, ids))
  errors.push(...claimReferences(acceptance.lines, 'AC', file, ids, requirementIds))
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
