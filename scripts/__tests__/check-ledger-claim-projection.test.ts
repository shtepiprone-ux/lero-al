// @vitest-environment node
/**
 * Detector test suite for scripts/check-ledger-claim-projection.mjs (Task 747 Phase 2).
 *
 * Spec: tasks/Sprints/Sprint_61_Task_747_phase1_decision.md (REVISION 5, owner-approved
 * 2026-08-20). Covers: the fence/inline-code-span exemption (AC2a), the Task 691
 * reconstruction fixture (AC3), every enumerated bad-input message, and the D1
 * bidirectional comparator (CLAIM-STALE / LEDGER-MOVED / pass).
 *
 * Run: npx vitest run scripts/__tests__/check-ledger-claim-projection.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  findMarkerCandidates,
  validateMarkerCandidate,
  validateSourcePath,
  deriveClaimText,
  evaluateClaim,
  evaluateParsedMarker,
  scanFileContent,
  summarizeResults,
  listScanFiles,
  createRealGitOps,
} from '../check-ledger-claim-projection.mjs'

const HASH_A = 'a'.repeat(40)
const HASH_B = 'b'.repeat(40)
const REAL_LEDGER = 'docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json'

function fakeGitOps(overrides: Record<string, () => unknown> = {}) {
  return {
    isShallow: () => ({ unavailable: false, shallow: false }),
    hashObject: () => ({ unavailable: false, ok: true, hash: HASH_A }),
    runLedgerValidator: () => ({ unavailable: false, passed: true }),
    ...overrides,
  }
}

/** Parses the first marker candidate on a line straight through to a validated result,
 * for tests that only care about the syntax-level outcome. */
function parseLine(line: string) {
  const candidates = findMarkerCandidates(line)
  expect(candidates).toHaveLength(1)
  expect(candidates[0].ok).toBe(true)
  return validateMarkerCandidate(candidates[0] as { attrString: string; body: string })
}

describe('§A — fence and inline-code-span exemption (AC2a)', () => {
  const markerLine = `Open: <span data-ledger-claim data-source="docs/reviews/example.review-ledger.json" data-field="openP0" data-ledger-hash="${HASH_A}">4 P0</span>`

  it('ignores a marker inside a ``` fenced code block', () => {
    const content = ['prose before', '```', markerLine, '```', 'prose after'].join('\n')
    expect(scanFileContent(content, 'fixture.md', fakeGitOps())).toHaveLength(0)
  })

  it('ignores a marker inside a ~~~ fenced code block', () => {
    const content = ['prose before', '~~~md', markerLine, '~~~', 'prose after'].join('\n')
    expect(scanFileContent(content, 'fixture.md', fakeGitOps())).toHaveLength(0)
  })

  it('ignores a marker wrapped in a single-line inline code span', () => {
    const content = `See the example: \`${markerLine}\` for the syntax.`
    expect(scanFileContent(content, 'fixture.md', fakeGitOps())).toHaveLength(0)
  })

  it('still finds a marker on an un-fenced, un-backticked line', () => {
    expect(findMarkerCandidates(markerLine)).toHaveLength(1)
  })
})

describe('§B — attribute syntax bad input (each a distinct code, exits 2 at the CLI)', () => {
  it('MISSING-ATTRIBUTE — data-source absent', () => {
    const result = parseLine(`<span data-ledger-claim data-field="decision" data-ledger-hash="${HASH_A}">APPROVED</span>`)
    expect(result).toMatchObject({ ok: false, code: 'MISSING-ATTRIBUTE' })
  })

  it('DUPLICATE-ATTRIBUTE — data-field repeated', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="decision" data-field="openP0" data-ledger-hash="${HASH_A}">APPROVED</span>`)
    expect(result).toMatchObject({ ok: false, code: 'DUPLICATE-ATTRIBUTE' })
  })

  it('UNKNOWN-ATTRIBUTE — an attribute outside the known set', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="decision" data-ledger-hash="${HASH_A}" data-extra="x">APPROVED</span>`)
    expect(result).toMatchObject({ ok: false, code: 'UNKNOWN-ATTRIBUTE' })
  })

  it('MALFORMED-ATTRIBUTE — data-ledger-hash is not 40-char lowercase hex', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="decision" data-ledger-hash="not-a-hash">APPROVED</span>`)
    expect(result).toMatchObject({ ok: false, code: 'MALFORMED-ATTRIBUTE' })
  })

  it('MALFORMED-QUOTING — single-quoted attribute value', () => {
    const result = parseLine(`<span data-ledger-claim data-source='docs/reviews/x.review-ledger.json' data-field="decision" data-ledger-hash="${HASH_A}">APPROVED</span>`)
    expect(result).toMatchObject({ ok: false, code: 'MALFORMED-QUOTING' })
  })

  it('MALFORMED-QUOTING — unquoted attribute value', () => {
    const result = parseLine(`<span data-ledger-claim data-source=docs/reviews/x.review-ledger.json data-field="decision" data-ledger-hash="${HASH_A}">APPROVED</span>`)
    expect(result).toMatchObject({ ok: false, code: 'MALFORMED-QUOTING' })
  })

  it('NESTED-MARKUP — body contains another tag', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="openP0" data-ledger-hash="${HASH_A}">4 <em>P0</em></span>`)
    expect(result).toMatchObject({ ok: false, code: 'NESTED-MARKUP' })
  })

  it('MALFORMED-BODY — body contains an HTML entity', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="openP0" data-ledger-hash="${HASH_A}">4&nbsp;P0</span>`)
    expect(result).toMatchObject({ ok: false, code: 'MALFORMED-BODY' })
  })

  it('UNSUPPORTED-FIELD — data-field outside the v1 set', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="total" data-ledger-hash="${HASH_A}">12</span>`)
    expect(result).toMatchObject({ ok: false, code: 'UNSUPPORTED-FIELD' })
  })

  it('a syntactically complete marker parses cleanly (control — proves the arms above are real rejections, not a permissive parser)', () => {
    const result = parseLine(`<span data-ledger-claim data-source="docs/reviews/x.review-ledger.json" data-field="openP0" data-ledger-hash="${HASH_A}">4 P0</span>`)
    expect(result.ok).toBe(true)
  })
})

describe('§C — data-source path policy (illegal source path, exits 2)', () => {
  it('rejects a path containing ".."', () => {
    expect(validateSourcePath('docs/reviews/../secrets.review-ledger.json').ok).toBe(false)
  })

  it('rejects a *.SUPERSEDED.json ledger as a production source', () => {
    expect(validateSourcePath('docs/reviews/2026-08-12-task691-mantinelistingcardpattern-detailwind.review-ledger.SUPERSEDED.json').ok).toBe(false)
  })

  it('rejects a *.DRAFT.json ledger as a production source', () => {
    expect(validateSourcePath('docs/reviews/some-task.review-ledger.DRAFT.json').ok).toBe(false)
  })

  it('rejects a path outside docs/reviews/', () => {
    expect(validateSourcePath('scripts/__tests__/fixtures/task691-reconstruction.review-ledger.json').ok).toBe(false)
  })

  it('accepts a well-formed production source path', () => {
    expect(validateSourcePath(REAL_LEDGER)).toMatchObject({ ok: true, normalized: REAL_LEDGER })
  })
})

describe('§D — source evaluation preflight order (SHALLOW-REPOSITORY → exists → validator → hash)', () => {
  const parsed = { dataSource: REAL_LEDGER, dataField: 'decision', dataLedgerHash: HASH_A, body: 'APPROVED WITH NOTES' }
  const ctx = { fileLabel: 'fixture.md', line: 1 }

  it('SHALLOW-REPOSITORY fires before source existence is even checked', () => {
    const gitOps = fakeGitOps({ isShallow: () => ({ unavailable: false, shallow: true }) })
    const result = evaluateParsedMarker(parsed, ctx, gitOps)
    expect(result).toMatchObject({ kind: 'bad-input', code: 'SHALLOW-REPOSITORY' })
  })

  it('GIT-UNAVAILABLE — git missing at the shallow-repository step', () => {
    const gitOps = fakeGitOps({ isShallow: () => ({ unavailable: true }) })
    const result = evaluateParsedMarker(parsed, ctx, gitOps)
    expect(result).toMatchObject({ kind: 'bad-input', code: 'GIT-UNAVAILABLE' })
  })

  it('MISSING-SOURCE — legal path shape, file does not exist on disk', () => {
    const gitOps = fakeGitOps()
    const result = evaluateParsedMarker({ ...parsed, dataSource: 'docs/reviews/__does-not-exist-task747-fixture__.review-ledger.json' }, ctx, gitOps)
    expect(result).toMatchObject({ kind: 'bad-input', code: 'MISSING-SOURCE' })
  })

  it('SOURCE-VALIDATION-FAILED — check-review-ledger --file exits non-zero, without asserting why', () => {
    const gitOps = fakeGitOps({ runLedgerValidator: () => ({ unavailable: false, passed: false }) })
    const result = evaluateParsedMarker(parsed, ctx, gitOps)
    expect(result).toMatchObject({ kind: 'bad-input', code: 'SOURCE-VALIDATION-FAILED' })
  })

  it('GIT-UNAVAILABLE — git missing at the hash-object step, after the validator already passed', () => {
    const gitOps = fakeGitOps({ hashObject: () => ({ unavailable: true }) })
    const result = evaluateParsedMarker(parsed, ctx, gitOps)
    expect(result).toMatchObject({ kind: 'bad-input', code: 'GIT-UNAVAILABLE' })
  })

  it('a fully legal marker against the real production ledger passes end to end (real git, no fakes)', () => {
    const gitOps = createRealGitOps()
    const hash = gitOps.hashObject(REAL_LEDGER)
    expect(hash.ok).toBe(true)
    const result = evaluateParsedMarker({ ...parsed, dataLedgerHash: hash.hash }, ctx, gitOps)
    expect(result).toMatchObject({ kind: 'pass' })
  })
})

describe('§E — D1 bidirectional comparator', () => {
  it('LEDGER-MOVED — hash differs, regardless of body content', () => {
    const result = evaluateClaim({
      fileLabel: 'x.md', line: 3, dataSource: REAL_LEDGER, dataField: 'decision',
      claimedText: 'APPROVED WITH NOTES', currentHash: HASH_A, declaredHash: HASH_B,
      ledger: { review: { decision: 'APPROVED WITH NOTES' } },
    })
    expect(result).toMatchObject({ kind: 'drift', code: 'LEDGER-MOVED' })
  })

  it('CLAIM-STALE — hash matches, body differs from the derived value', () => {
    const result = evaluateClaim({
      fileLabel: 'x.md', line: 3, dataSource: REAL_LEDGER, dataField: 'decision',
      claimedText: 'APPROVED', currentHash: HASH_A, declaredHash: HASH_A,
      ledger: { review: { decision: 'APPROVED WITH NOTES' } },
    })
    expect(result).toMatchObject({ kind: 'drift', code: 'CLAIM-STALE' })
  })

  it('pass — hash matches and body equals the derived value', () => {
    const result = evaluateClaim({
      fileLabel: 'x.md', line: 3, dataSource: REAL_LEDGER, dataField: 'decision',
      claimedText: 'APPROVED WITH NOTES', currentHash: HASH_A, declaredHash: HASH_A,
      ledger: { review: { decision: 'APPROVED WITH NOTES' } },
    })
    expect(result).toMatchObject({ kind: 'pass' })
  })

  it('deriveClaimText — openP0 counts only findings with priority P0 and status OPEN', () => {
    const ledger = {
      findings: [
        { priority: 'P0', status: 'OPEN' },
        { priority: 'P0', status: 'OPEN' },
        { priority: 'P0', status: 'VERIFIED' }, // closed — must not count
        { priority: 'P1', status: 'OPEN' }, // wrong priority — must not count
      ],
    }
    expect(deriveClaimText(ledger, 'openP0')).toBe('2 P0')
  })
})

describe('§F — AC3: Task 691 test-only reconstruction, run through the real parser/scanner path', () => {
  it('rejects the reconstructed openP0: 4 ledger against a visible carrier marker claiming "2 P0", naming the file, the claim, and the derived value', () => {
    const ledgerRelPath = 'scripts/__tests__/fixtures/task691-reconstruction.review-ledger.json'
    const carrierRelPath = 'scripts/__tests__/fixtures/task691-carrier.md'
    const carrierContent = readFileSync(carrierRelPath, 'utf8')
    const ledger = JSON.parse(readFileSync(ledgerRelPath, 'utf8'))

    // Real parser/scanner path: locate the marker line in the real carrier file, run it
    // through findMarkerCandidates + validateMarkerCandidate exactly as scanFileContent
    // does — not a hand-built {dataSource, dataField, body} object.
    const markerLine = carrierContent.split(/\r?\n/).find((line) => line.includes('data-ledger-claim data-source'))
    expect(markerLine).toBeTruthy()
    const candidates = findMarkerCandidates(markerLine as string)
    expect(candidates).toHaveLength(1)
    const parsed = validateMarkerCandidate(candidates[0] as { attrString: string; body: string })
    expect(parsed).toMatchObject({
      ok: true,
      dataSource: ledgerRelPath,
      dataField: 'openP0',
      body: '2 P0',
    })
    if (!parsed.ok) throw new Error('unreachable — asserted above')

    // Real git hash-object of the real fixture ledger — not a literal. AC3 is test-only
    // specifically at the source-path-policy boundary: task691-reconstruction.review-ledger.json
    // lives under scripts/__tests__/fixtures/, not docs/reviews/, so evaluateParsedMarker's
    // production data-source policy (Q2) would reject it before ever reaching the D1
    // comparator — correctly, since it is not a production source. Calling evaluateClaim
    // directly with the PARSED values exercises every other real step (parsing, hashing,
    // ledger loading, comparison) without asserting a fixture is a legal production path.
    const gitOps = createRealGitOps()
    const hash = gitOps.hashObject(ledgerRelPath)
    expect(hash.ok).toBe(true)
    expect(parsed.dataLedgerHash).toBe(hash.hash) // the carrier fixture's declared hash must be current

    const result = evaluateClaim({
      fileLabel: carrierRelPath,
      line: 1,
      dataSource: parsed.dataSource,
      dataField: parsed.dataField,
      claimedText: parsed.body,
      currentHash: hash.hash,
      declaredHash: parsed.dataLedgerHash,
      ledger,
    })

    expect(result.kind).toBe('drift')
    expect(result.code).toBe('CLAIM-STALE')
    expect(result.message).toContain(ledgerRelPath)
    expect(result.message).toContain('2 P0')
    expect(result.message).toContain('4 P0')
  })
})

describe('§G — mixed bad-input + drift in one run (bad input never hides drift)', () => {
  it('prints every drift finding it found and still exits 2 when any bad input is present', () => {
    const gitOps = fakeGitOps()
    const staleLine = `Decision: <span data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_A}">WRONG</span>`
    const badLine = `Bad: <span data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_A}" data-extra="x">APPROVED WITH NOTES</span>`
    const content = [staleLine, badLine].join('\n')

    const results = scanFileContent(content, 'fixture.md', gitOps)
    const summary = summarizeResults(results)

    expect(summary.exitCode).toBe(2)
    expect(summary.lines.some((l) => l.includes('CLAIM-STALE'))).toBe(true)
    expect(summary.lines.some((l) => l.includes('UNKNOWN-ATTRIBUTE'))).toBe(true)
  })

  it('a clean run with only matching markers exits 0', () => {
    const gitOps = createRealGitOps()
    const hash = gitOps.hashObject(REAL_LEDGER)
    const content = `<span data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${hash.hash}">APPROVED WITH NOTES</span>`
    const summary = summarizeResults(scanFileContent(content, 'fixture.md', gitOps))
    expect(summary.exitCode).toBe(0)
  })
})

describe('§H — scan scope (Q3: archive is never opened)', () => {
  it('never includes docs/backlog-archive.md in the scan list', () => {
    const files = listScanFiles().map((f) => f.replaceAll('\\', '/'))
    expect(files.some((f) => f.endsWith('docs/backlog-archive.md'))).toBe(false)
  })

  it('includes docs/backlog.md', () => {
    const files = listScanFiles().map((f) => f.replaceAll('\\', '/'))
    expect(files.some((f) => f.endsWith('docs/backlog.md'))).toBe(true)
  })
})

describe('§I — parser regression arms (found in review of the first Phase 2 build)', () => {
  it('exact body — a body padded with a stray trailing space is NOT normalized to match the derived value', () => {
    // Previously the parser trimmed the body before comparison, so "APPROVED WITH NOTES "
    // (trailing space) silently matched the derived "APPROVED WITH NOTES". Q1 requires the
    // body to "equal exactly" the derived text.
    const line = `<span data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_A}">APPROVED WITH NOTES </span>`
    const candidates = findMarkerCandidates(line)
    expect(candidates).toHaveLength(1)
    const parsed = validateMarkerCandidate(candidates[0] as { attrString: string; body: string })
    expect(parsed).toMatchObject({ ok: true, body: 'APPROVED WITH NOTES ' }) // untrimmed
    if (!parsed.ok) throw new Error('unreachable')

    const result = evaluateClaim({
      fileLabel: 'x.md', line: 1, dataSource: REAL_LEDGER, dataField: 'decision',
      claimedText: parsed.body, currentHash: HASH_A, declaredHash: HASH_A,
      ledger: { review: { decision: 'APPROVED WITH NOTES' } },
    })
    expect(result).toMatchObject({ kind: 'drift', code: 'CLAIM-STALE' })
  })

  it('exact body — the un-padded body still passes (control, proves the arm above is about the padding, not a broken comparator)', () => {
    const result = evaluateClaim({
      fileLabel: 'x.md', line: 1, dataSource: REAL_LEDGER, dataField: 'decision',
      claimedText: 'APPROVED WITH NOTES', currentHash: HASH_A, declaredHash: HASH_A,
      ledger: { review: { decision: 'APPROVED WITH NOTES' } },
    })
    expect(result).toMatchObject({ kind: 'pass' })
  })

  it('an inline-code-wrapped decoy marker sharing a line with a real marker does not leak a second candidate', () => {
    const decoy = `<span data-ledger-claim data-source="docs/reviews/example.review-ledger.json" data-field="openP0" data-ledger-hash="${HASH_A}">4 P0</span>`
    const real = `<span data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_B}">APPROVED WITH NOTES</span>`
    const line = `See \`${decoy}\` for the syntax, then use it live: ${real}`

    const candidates = findMarkerCandidates(line)
    expect(candidates).toHaveLength(1) // not 2 — the backtick-wrapped decoy must not surface
    expect(candidates[0]).toMatchObject({ ok: true })
    const parsed = validateMarkerCandidate(candidates[0] as { attrString: string; body: string })
    expect(parsed).toMatchObject({ ok: true, dataSource: REAL_LEDGER, dataField: 'decision', dataLedgerHash: HASH_B })
  })

  it('an inline-code-wrapped decoy marker BEFORE a real marker, and a real marker before a decoy, both still find exactly the real one', () => {
    const decoy = `<span data-ledger-claim data-source="docs/reviews/example.review-ledger.json" data-field="openP0" data-ledger-hash="${HASH_A}">4 P0</span>`
    const real = `<span data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_B}">APPROVED WITH NOTES</span>`

    expect(findMarkerCandidates(`\`${decoy}\` ${real}`)).toHaveLength(1)
    expect(findMarkerCandidates(`${real} \`${decoy}\``)).toHaveLength(1)
  })

  it('an ordinary span carrying only an unrelated attribute that starts with the marker name (data-ledger-claim-note) is silently ignored, not flagged', () => {
    // Previously a substring check (attrString.includes('data-ledger-claim')) matched
    // "data-ledger-claim-note" too, misreading an ordinary unmarked span as a malformed
    // marker (UNKNOWN-ATTRIBUTE) — a false positive against a document with no marker at all.
    const line = `<span data-ledger-claim-note="reviewer flagged this paragraph">an ordinary, unrelated span</span>`
    expect(findMarkerCandidates(line)).toHaveLength(0)
    expect(scanFileContent(line, 'fixture.md', fakeGitOps())).toHaveLength(0)
  })

  it('a real marker WITH an extra data-ledger-claim-note attribute alongside it is still correctly flagged UNKNOWN-ATTRIBUTE (control — proves the arm above is about absence of the real token, not a blanket exemption for any "-note" suffix)', () => {
    const line = `<span data-ledger-claim data-ledger-claim-note="x" data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_A}">APPROVED WITH NOTES</span>`
    const result = parseLine(line)
    expect(result).toMatchObject({ ok: false, code: 'UNKNOWN-ATTRIBUTE' })
  })

  it('data-ledger-claim appearing only as ANOTHER attribute\'s VALUE, not as a key, is silently ignored — 0 candidates, silent pass', () => {
    // The marker is identified by a tokenized attribute KEY, never by a regex/substring
    // scan over the raw attribute text. `data-note="data-ledger-claim"` never DECLARES the
    // marker attribute — "data-ledger-claim" here is a quoted VALUE belonging to the
    // unrelated attribute `data-note`. A boundary-aware text scan cannot tell this apart
    // from the attribute actually being declared (bounded on both sides by `"`, same as a
    // real bare declaration would be bounded by whitespace); tokenization can, because it
    // only ever inspects `token.key`, never the raw text or any attribute's value.
    const line = `<span data-note="data-ledger-claim">ordinary prose</span>`
    expect(findMarkerCandidates(line)).toHaveLength(0)
    expect(scanFileContent(line, 'fixture.md', fakeGitOps())).toHaveLength(0) // silent pass, not even a bad-input finding
  })

  it('an unparseable token BEFORE a valid data-ledger-claim key is still found as a candidate and rejected MALFORMED-ATTRIBUTE, exit 2 — not silently ignored', () => {
    // tokenizeAttributes previously stopped scanning entirely at the first token it could not
    // parse as either key="value" or a bare key, so a leading garbage token ("@bad") hid every
    // token after it — including a perfectly valid `data-ledger-claim` — from
    // attrStringDeclaresMarkerKey. That turned a malformed marker ATTEMPT into a silent pass
    // (fail-open), the opposite of the fail-closed contract: a marker attempt that cannot be
    // fully validated must surface as bad input, never disappear because something before the
    // key happened to be unparseable.
    const line = `<span @bad data-ledger-claim data-source="${REAL_LEDGER}" data-field="decision" data-ledger-hash="${HASH_A}">APPROVED WITH NOTES</span>`

    const candidates = findMarkerCandidates(line)
    expect(candidates).toHaveLength(1) // found, not silently dropped
    expect(candidates[0].ok).toBe(true)

    const validated = validateMarkerCandidate(candidates[0] as { attrString: string; body: string })
    expect(validated).toMatchObject({ ok: false, code: 'MALFORMED-ATTRIBUTE' })

    // Same result through the full scanner path, including the CLI's exit-code contract.
    const summary = summarizeResults(scanFileContent(line, 'fixture.md', fakeGitOps()))
    expect(summary.exitCode).toBe(2)
    expect(summary.badInputs).toHaveLength(1)
    expect(summary.badInputs[0].code).toBe('MALFORMED-ATTRIBUTE')
  })
})

describe('§J — isolated lifecycle proof (Q3: marker stripped before a carrier closes/archives)', () => {
  // scripts/__tests__/fixtures/task747-lifecycle-carrier.md is a dedicated, isolated fixture
  // — never docs/backlog-archive.md or a real docs/sessions/**/*.md log. The "close-state"
  // half is an in-memory transformation of the same content, not a second committed file
  // pretending to be a real closed document.
  const carrierRelPath = 'scripts/__tests__/fixtures/task747-lifecycle-carrier.md'

  it('live state — the carrier marker is found and evaluates cleanly against its ledger, through the real end-to-end pipeline (real git, real production data-source policy, no fakes)', () => {
    const liveContent = readFileSync(carrierRelPath, 'utf8')
    const results = scanFileContent(liveContent, carrierRelPath, createRealGitOps())

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ kind: 'pass' })
  })

  it('close-state — after the marker is stripped (as required before the carrier closes), the checker finds nothing and silently passes', () => {
    const liveContent = readFileSync(carrierRelPath, 'utf8')
    const lines = liveContent.split(/\r?\n/)
    const markerLineIndex = lines.findIndex((line) => line.includes('data-ledger-claim data-source'))
    expect(markerLineIndex).toBeGreaterThanOrEqual(0)

    // Strip exactly the marker line — the lifecycle rule's required action before a carrier
    // closes or archives — leaving the rest of the document (title, comment) untouched.
    const closedContent = [...lines.slice(0, markerLineIndex), ...lines.slice(markerLineIndex + 1)].join('\n')
    expect(closedContent).not.toContain('data-ledger-claim')

    const results = scanFileContent(closedContent, carrierRelPath, fakeGitOps())
    expect(results).toHaveLength(0) // silent pass — a carrier with no marker is never flagged (Q3)
  })

  it('the real fixture/carrier file on disk is untouched by this proof — the strip happens only in memory', () => {
    const onDisk = readFileSync(carrierRelPath, 'utf8')
    expect(onDisk).toContain('data-ledger-claim')
  })
})
