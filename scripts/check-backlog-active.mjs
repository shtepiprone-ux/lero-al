#!/usr/bin/env node
/**
 * check-backlog-active.mjs — `docs/backlog.md` holds active state only (GR-5, owner rule 2026-09-27).
 *
 * Why this exists: GR-5's Stop hook only scanned the lines a response *added* to the backlog. A closed
 * sprint or task that was already sitting in the file stayed invisible to it, and so did any response
 * that wrote no file at all. On 2026-09-27 the owner found Sprints 80–82 (closed 2026-09-25) and
 * Sprint 68 (closed 2026-09-18) still listed as backlog state, with approvals from earlier sessions
 * piled into "Last Session". His words: *"Мені тобі кожного разу нагадувати, що ти слідкуєш за
 * беклогом? … Виправ правила, щоб більше не ігнорував!"*. This gate checks the whole file, every time.
 *
 * Checks (each failure names the line):
 *   1. "Last Session" has at most 4 non-empty lines and at most 1200 characters.
 *   2. Outside "Last Session" and outside `>` rule blockquotes, no line carries a closed-state marker:
 *      `✅`, `CLOSED`, `APPROVED`, `ARCHIVED`, `FOLDED`, "archived <date>", "was/and archived",
 *      "is folded", "folded into". Closed and folded
 *      work belongs in `docs/backlog-archive.md` / `docs/backlog-reserved.md`, never here.
 *   3. Every `tasks/Sprints/Sprint_NN_*.md` plan path the backlog names exists there, and its
 *      `Status:` line is not closed. A closed sprint's plan moves to `tasks/Archive/`
 *      (orchestrator-procedures.md → "Physical sprint-plan archive").
 *   4. No number in the Task registry's first column has an archive-ledger row `**Task NNN (… APPROVED`.
 *
 * Scope statement (GR-2): it reads `docs/backlog.md`, the plan files it names, and the archive
 * ledger's single-task rows. It cannot judge whether an open row's *prose* is still accurate, and it
 * does not scan `tasks/Sprints/` for closed plans the backlog does not name — it only counts them
 * (printed as a non-blocking notice).
 *
 * Exit: 0 clean · 1 violations · 2 the script itself could not run.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const BACKLOG = join(ROOT, 'docs', 'backlog.md')
const ARCHIVE = join(ROOT, 'docs', 'backlog-archive.md')
const SPRINTS = join(ROOT, 'tasks', 'Sprints')
const LAST_SESSION_MAX_LINES = 4
const LAST_SESSION_MAX_CHARS = 1200
// `archived` alone is also a listing status (`sold/rented/archived`), so only its closure forms count:
// "archived 2026-…", "was/were/been/and archived", "is folded", "folded into".
const CLOSED_MARKER =
  /✅|\bCLOSED\b|\bAPPROVED\b|\bARCHIVED\b|\bFOLDED\b|\barchived (?:on )?\d{4}-\d{2}-\d{2}|\b(?:was|were|been|and) archived\b|\bis folded\b|\bfolded into\b/
const CLOSED_STATUS = /\bCLOSED\b|✅|🗄️|\bCOMPLETE\b/

function main() {
  let text
  let archive
  try {
    text = readFileSync(BACKLOG, 'utf8')
    archive = readFileSync(ARCHIVE, 'utf8')
  } catch (err) {
    console.error(`check:backlog-active could not read its inputs: ${err.message}`)
    process.exit(2)
  }

  const lines = text.split(/\r?\n/)
  const problems = []
  let section = ''
  const lastSession = []

  lines.forEach((line, i) => {
    const n = i + 1
    if (line.startsWith('## ')) {
      section = line
      return
    }
    if (section.startsWith('## Last Session')) {
      if (line.trim()) lastSession.push(line)
      return
    }
    if (line.startsWith('>') || line.startsWith('#')) return
    const m = line.match(CLOSED_MARKER)
    if (m) {
      problems.push(`line ${n}: closed-state marker "${m[0]}" outside Last Session — move the closed item to docs/backlog-archive.md (or its bookkeeping to docs/backlog-reserved.md) and delete it here.\n      ${line.slice(0, 160)}`)
    }
  })

  // 1. Last Session budget.
  const lsChars = lastSession.join('\n').length
  if (lastSession.length > LAST_SESSION_MAX_LINES) {
    problems.push(`Last Session has ${lastSession.length} non-empty lines (max ${LAST_SESSION_MAX_LINES}). Keep only the newest session.`)
  }
  if (lsChars > LAST_SESSION_MAX_CHARS) {
    problems.push(`Last Session is ${lsChars} characters (max ${LAST_SESSION_MAX_CHARS}). Keep only the newest session; earlier sessions are history.`)
  }

  // 3. Every named sprint plan is present and open.
  const planPaths = new Set(text.match(/tasks\/Sprints\/Sprint_\d+_[^`)\s]*?\.md/g) ?? [])
  for (const rel of planPaths) {
    if (rel.includes('kickoff_prompt')) continue
    const abs = join(ROOT, rel)
    if (!existsSync(abs)) {
      problems.push(`sprint plan ${rel} is named in the backlog but does not exist in tasks/Sprints/ (archived? then the backlog must not list it).`)
      continue
    }
    const status = readFileSync(abs, 'utf8').split(/\r?\n/).find((l) => /Status:/.test(l)) ?? ''
    const statusCell = status.slice(status.indexOf('Status:'), status.indexOf('Status:') + 80)
    if (CLOSED_STATUS.test(statusCell)) {
      problems.push(`sprint plan ${rel} is closed ("${statusCell.trim()}") but still listed in the backlog and still in tasks/Sprints/. Archive row + move the plan to tasks/Archive/ + delete it here.`)
    }
  }

  // 4. Registry subjects that the archive already closed.
  const regStart = text.indexOf('## Task registry')
  const regEnd = text.indexOf('\n## ', regStart + 1)
  if (regStart >= 0) {
    const registry = text.slice(regStart, regEnd < 0 ? undefined : regEnd)
    const approvedRows = archive.split(/\r?\n/).filter((l) => l.startsWith('| 20') && /APPROVED/.test(l.slice(0, 400)))
    for (const row of registry.split(/\r?\n/)) {
      if (!row.startsWith('| ') || row.startsWith('| #') || row.startsWith('|---')) continue
      const firstCell = row.split('|')[1] ?? ''
      for (const num of firstCell.match(/\b\d{3}\b/g) ?? []) {
        const closed = approvedRows.find((l) => new RegExp(`\\*\\*Task ${num} \\(`).test(l.slice(0, 200)))
        if (closed) problems.push(`registry number ${num} is still listed, but the archive ledger closed it: ${closed.slice(0, 120)}`)
      }
    }
  }

  // Non-blocking notice: closed plans the backlog does not name (physical archive owed).
  let closedPlansOnDisk = 0
  try {
    for (const f of readdirSync(SPRINTS)) {
      if (!/^Sprint_.*\.md$/.test(f) || f.includes('kickoff_prompt')) continue
      const status = readFileSync(join(SPRINTS, f), 'utf8').split(/\r?\n/).find((l) => /Status:/.test(l)) ?? ''
      if (CLOSED_STATUS.test(status.slice(status.indexOf('Status:'), status.indexOf('Status:') + 80))) closedPlansOnDisk++
    }
  } catch {
    /* notice only */
  }

  console.log('check:backlog-active — scope: docs/backlog.md, the sprint plans it names, and the archive ledger\'s single-task rows. It cannot judge whether an open row\'s prose is still accurate.')
  if (closedPlansOnDisk > 0) {
    console.log(`notice (non-blocking): ${closedPlansOnDisk} closed sprint plan(s) still sit in tasks/Sprints/ without being named by the backlog — physical archive owed.`)
  }
  if (problems.length > 0) {
    console.error(`\n❌ docs/backlog.md is not active-state only — ${problems.length} issue(s):\n`)
    for (const p of problems) console.error(`  - ${p}`)
    console.error('\nFix: one archive row per closed item in docs/backlog-archive.md, then delete it from docs/backlog.md (GR-5).')
    process.exit(1)
  }
  console.log('✅ check:backlog-active PASSED — docs/backlog.md holds active state only.')
}

main()
