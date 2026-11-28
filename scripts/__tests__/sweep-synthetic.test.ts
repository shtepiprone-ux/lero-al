// @vitest-environment node
/**
 * Task 957 — scripts/sweep-synthetic.mjs (AC16, O957-5)
 *
 * The synthetic users and listings (`zz_synth_<8 base-36 time><4 hex>`) a CI run that was cancelled or killed leaves behind are removed by the sweep, and nothing else:
 *  - a prefix the job logged is removed at any age; a prefix found in an e-mail or a listing slug is removed only when its time is more than two hours old;
 *  - `walk_agent@example.com`, `zz_synthx…`, a real e-mail and a slug without the exact shape are never touched, never passed to `removeRun`;
 *  - a failing read deletes nothing and exits 1; a target that is not the development project is refused before any read; `--dry-run` reads and lists only;
 *  - what remains after a removal exits 1; the output carries counts and prefixes only (no e-mail, no id).
 * The workflow case reads `.github/workflows/ci.yml`: every job that receives the service-role secret and runs the integration suites or the signed-in walk sets `SYNTHETIC_RUN_LOG` in the
 * `env` of each step that runs them (never in the job `env`, which cannot read the `runner` context, Review 1 F4) and ends with the sweep step under `if: always()`, which sets it too, the
 * secret on that step only. (Opus adds the steps; until then this case is red.)
 * The Supabase reads and the removal are handed to `runSweep`, so every case runs here without a database.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

import { PREFIX_SHAPE, parseRunLog, runSweep } from '../sweep-synthetic.mjs'

// js-yaml ships no type declarations; it is read through `require` with the one function the test uses typed here
const yaml = createRequire(import.meta.url)('js-yaml') as { load: (text: string) => unknown }
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const NOW = Date.UTC(2026, 10, 19, 12, 0, 0)
const HOUR = 3_600_000

/** the prefix a run started `ageMs` ago would have: 8 base-36 time characters, 4 hex characters */
function prefix(ageMs: number, hex = 'a1b2') { return `zz_synth_${(NOW - ageMs).toString(36)}${hex}` }

type Door = { emails?: string[]; slugs?: string[]; prefixed?: string[]; emailsFail?: boolean; slugsFail?: boolean; prefixedFail?: boolean; logText?: string | null; removeResult?: (p: string) => { verified: boolean; remaining: number; errors: string[] } }
function door({ emails = [], slugs = [], prefixed = [], emailsFail = false, slugsFail = false, prefixedFail = false, logText = null, removeResult }: Door = {}) {
  const out: string[] = []
  const removed: string[] = []
  const reads: string[] = []
  const deps = {
    loadEnv: vi.fn<() => unknown>(() => ({ url: 'https://dev.supabase.co', anonKey: 'a', serviceKey: 's', projectRef: 'dev' })),
    readEmails: vi.fn(async () => { reads.push('emails'); if (emailsFail) throw new Error('auth list failed'); return emails }),
    readSlugs: vi.fn(async () => { reads.push('slugs'); if (slugsFail) throw new Error('listings read failed'); return slugs }),
    readPrefixed: vi.fn(async () => { reads.push('prefixed'); if (prefixedFail) throw new Error('prefixed read failed'); return prefixed }),
    removeRun: vi.fn(async (run: string) => { removed.push(run); return (removeResult ?? (() => ({ verified: true, remaining: 0, errors: [] })))(run) }),
    readLog: vi.fn(() => logText),
    now: () => NOW,
    out: (line: string) => { out.push(line) },
  }
  return { deps, out, removed, reads }
}

describe('sweep-synthetic', () => {
  it('[AC16] a logged prefix is removed at any age', async () => {
    const young = prefix(5 * 60_000)
    const old = prefix(30 * HOUR, 'beef')
    const d = door({ logText: `${young}\n${old}\n` })
    const result = await runSweep({ ...d.deps, argv: [] })
    expect(result.exitCode).toBe(0)
    expect(d.removed.sort()).toEqual([old, young].sort())
  })

  it('[AC16] an unlogged prefix older than two hours is removed and a younger one stays; an e-mail and a slug of the same run name one prefix', async () => {
    const stale = prefix(3 * HOUR)
    const fresh = prefix(HOUR)
    const d = door({
      emails: [`${stale}_admin@example.com`, `${stale}_user@example.com`, `${fresh}_admin@example.com`],
      slugs: [`${stale}-listing-1`, `${fresh}-listing-1`],
    })
    expect((await runSweep({ ...d.deps, argv: [] })).exitCode).toBe(0)
    expect(d.removed).toEqual([stale])
  })

  it('[AC16] exactly two hours old stays; two hours and a second goes (a job lasts at most 30 minutes)', async () => {
    const edge = prefix(2 * HOUR)
    const over = prefix(2 * HOUR + 1000, 'cafe')
    const d = door({ emails: [`${edge}_x@example.com`, `${over}_x@example.com`] })
    await runSweep({ ...d.deps, argv: [] })
    expect(d.removed).toEqual([over])
  })

  it('[AC16] walk_agent@example.com, zz_synthx…, a real e-mail and a slug without the exact shape are never removed', async () => {
    const stale = prefix(5 * HOUR)
    const d = door({
      emails: [
        'walk_agent@example.com', 'person@example.org', 'zz_synthx123456781234_admin@example.com', 'zz_synth_short_admin@example.com',
        `zz_synth_${'A'.repeat(8)}a1b2_admin@example.com`, `${stale}admin@example.com`, `${stale}_x@evil.example`, `Zz_synth_${stale.slice(9)}_x@example.com`,
      ],
      slugs: ['a-real-listing', 'zz-synth-listing', `zz_synthx${stale.slice(9)}-l`, `${stale}extra-l`],
    })
    expect((await runSweep({ ...d.deps, argv: [] })).exitCode).toBe(0)
    expect(d.removed).toEqual([])
  })

  it('[AC16] a line of the log that is not the exact shape is ignored, so the log cannot name a real person', () => {
    expect(parseRunLog(`${prefix(0)}\nwalk_agent@example.com\nzz_synthx12345678\n\n  ${prefix(0, 'beef')}  \nzz_synth_${'a'.repeat(8)}zzzz\n`)).toEqual([prefix(0), prefix(0, 'beef')])
    expect(parseRunLog(null)).toEqual([])
    expect(PREFIX_SHAPE.test(prefix(0))).toBe(true)
  })

  it('[AC16] a failing read deletes nothing and exits 1', async () => {
    for (const fail of [{ emailsFail: true }, { slugsFail: true }]) {
      const d = door({ ...fail, logText: `${prefix(0)}\n`, emails: [`${prefix(9 * HOUR)}_x@example.com`] })
      const result = await runSweep({ ...d.deps, argv: [] })
      expect(result.exitCode, JSON.stringify(fail)).toBe(1)
      expect(d.removed, JSON.stringify(fail)).toEqual([])
      expect(d.out.join('\n')).not.toContain('auth list failed')
    }
  })

  it('[AC16] a target that is not the development project is refused before any read', async () => {
    const d = door({ logText: `${prefix(0)}\n` })
    d.deps.loadEnv.mockImplementation(() => { throw new Error('Refusing to run: set SECURITY_TEST_TARGET=development.') })
    const result = await runSweep({ ...d.deps, argv: [] })
    expect(result.exitCode).toBe(1)
    expect(d.reads).toEqual([])
    expect(d.deps.readLog).not.toHaveBeenCalled()
    expect(d.removed).toEqual([])
  })

  it('[AC16] --dry-run reads and lists, and deletes nothing', async () => {
    const stale = prefix(6 * HOUR)
    const d = door({ emails: [`${stale}_x@example.com`], logText: `${prefix(0)}\n` })
    const result = await runSweep({ ...d.deps, argv: ['--dry-run'] })
    expect(result.exitCode).toBe(0)
    expect(d.removed).toEqual([])
    expect(d.reads).toEqual(['emails', 'slugs', 'prefixed'])
    expect(d.out.join('\n')).toContain(stale)
  })

  it('[AC16] a removal that leaves rows, or an error, exits 1 and still tries the other prefixes', async () => {
    const a = prefix(3 * HOUR, 'a1b2')
    const b = prefix(4 * HOUR, 'c3d4')
    const d = door({ emails: [`${a}_x@example.com`, `${b}_x@example.com`], removeResult: (p) => (p === a ? { verified: false, remaining: 2, errors: [] } : { verified: true, remaining: 0, errors: [] }) })
    const result = await runSweep({ ...d.deps, argv: [] })
    expect(result.exitCode).toBe(1)
    expect(d.removed.sort()).toEqual([a, b].sort())
    const bad = door({ emails: [`${a}_x@example.com`], removeResult: () => ({ verified: false, remaining: 0, errors: ['verify users: boom'] }) })
    expect((await runSweep({ ...bad.deps, argv: [] })).exitCode).toBe(1)
  })

  it('[AC16] nothing to remove is a pass, and the output carries counts and prefixes only', async () => {
    const stale = prefix(3 * HOUR)
    const d = door({ emails: [`${stale}_secret.person@example.com`, 'real.person@example.org'], slugs: [`${stale}-the-listing`] })
    await runSweep({ ...d.deps, argv: [] })
    const text = d.out.join('\n')
    expect(text).toContain(stale)
    expect(text).not.toMatch(/@|secret\.person|real\.person|the-listing/)
    const none = door()
    const result = await runSweep({ ...none.deps, argv: [] })
    expect(result.exitCode).toBe(0)
    expect(none.removed).toEqual([])
  })

  // Task 1080: a run whose accounts and listings are gone, or that wrote none yet, is found by the rows it wrote by its prefix (`fixtures.PREFIXED_COLUMNS`)
  it('[1080-SWEEP-FOUND] a prefix older than two hours found only in a listed column (no account, no listing) is removed; a younger one stays', async () => {
    const stale = prefix(3 * HOUR)
    const fresh = prefix(HOUR, 'beef')
    const d = door({ prefixed: [`${stale} amenity`, `${stale}-page`, `${stale}`, `${fresh} page`] })
    const result = await runSweep({ ...d.deps, argv: [] })
    expect(result.exitCode).toBe(0)
    expect(d.reads).toEqual(['emails', 'slugs', 'prefixed'])
    expect(d.removed).toEqual([stale])
    expect(d.out.join('\n')).not.toMatch(/amenity|page/)
  })

  it('[SEC-1080-SHAPE] about, zz_synthx…, zz_synth_short, a prefix followed by a letter or digit and a value with the prefix inside it are never passed to removeRun', async () => {
    const stale = prefix(5 * HOUR)
    const valid = prefix(6 * HOUR, 'cafe')
    const d = door({
      prefixed: [
        'about', `zz_synthx${stale.slice(9)} x`, 'zz_synth_short', 'zz_synth_short page', `${stale}a`, `${stale}0 page`, `page ${stale}`, `the-${stale}-page`,
        `Zz_synth_${stale.slice(9)} x`, `${valid}:bucket`,
      ],
    })
    expect((await runSweep({ ...d.deps, argv: [] })).exitCode).toBe(0)
    expect(d.removed, 'only the value of the exact shape names a prefix').toEqual([valid])
  })

  it('[1080-SWEEP-READ-FAILS] a failing read of the listed columns removes nothing and exits 1; the target is refused before it', async () => {
    const d = door({ prefixedFail: true, logText: `${prefix(0)}\n`, prefixed: [`${prefix(9 * HOUR)} x`] })
    const result = await runSweep({ ...d.deps, argv: [] })
    expect(result.exitCode).toBe(1)
    expect(d.removed).toEqual([])
    expect(d.out).toContain('sweep-synthetic: the read of the synthetic rows failed; nothing was removed')
    expect(d.out.join('\n')).not.toContain('prefixed read failed')
    const refused = door({ logText: `${prefix(0)}\n`, prefixed: [`${prefix(9 * HOUR)} x`] })
    refused.deps.loadEnv.mockImplementation(() => { throw new Error('Refusing to run: set SECURITY_TEST_TARGET=development.') })
    expect((await runSweep({ ...refused.deps, argv: [] })).exitCode).toBe(1)
    expect(refused.deps.readPrefixed).not.toHaveBeenCalled()
    expect(refused.removed).toEqual([])
  })
})

type Step = { name?: string; if?: string; run?: string; uses?: string; env?: Record<string, string> }
type Job = { env?: Record<string, string>; steps?: Step[] }

describe('ci.yml: every job that creates synthetic data sweeps it (Task 957, O957-5)', () => {
  const workflow = yaml.load(readFileSync(path.join(REPO, '.github', 'workflows', 'ci.yml'), 'utf8')) as { jobs: Record<string, Job> }
  const SECRET = 'SECURITY_CI_SUPABASE_SERVICE_ROLE_KEY'
  const jobs = Object.entries(workflow.jobs).filter(([, job]) => {
    const steps = job.steps ?? []
    const receivesSecret = steps.some((s) => JSON.stringify(s.env ?? {}).includes(SECRET)) || JSON.stringify(job.env ?? {}).includes(SECRET)
    const createsData = steps.some((s) => /test:security-integration|check-signed-in-pages/.test(s.run ?? ''))
    return receivesSecret && createsData
  })

  it('the jobs that create synthetic data are the two the kickoff names', () => {
    expect(jobs.map(([name]) => name).sort()).toEqual(['authz', 'click-shield'])
  })

  // Review 1 F4: GitHub's context table lists `runner` for `jobs.<job_id>.steps.env` and not for `jobs.<job_id>.env`
  // (docs.github.com/en/actions/reference/workflows-and-actions/contexts), so `SYNTHETIC_RUN_LOG` is read from the `env` of each step.
  const stepLog = (step: Step | undefined) => step?.env?.SYNTHETIC_RUN_LOG ?? ''

  it.each(['authz', 'click-shield'])('[AC16] %s sets SYNTHETIC_RUN_LOG in the env of each step that creates data and of the sweep step, never in the job env, and ends with the sweep step under if: always(), the secret on that step only', (name) => {
    const job = workflow.jobs[name]
    const steps = job.steps ?? []
    const creators = steps.filter((s) => /test:security-integration|check-signed-in-pages/.test(s.run ?? ''))
    expect(creators.length, 'a step that creates synthetic data is found (the check is not vacuous)').toBeGreaterThan(0)
    for (const step of creators) {
      expect(stepLog(step), `SYNTHETIC_RUN_LOG of the step "${step.name}"`).toContain('runner.temp')
      expect(stepLog(step), `SYNTHETIC_RUN_LOG of the step "${step.name}"`).toContain('synthetic-runs.txt')
    }
    // the job env cannot read the runner context: a value there makes the workflow invalid
    expect(job.env?.SYNTHETIC_RUN_LOG, 'SYNTHETIC_RUN_LOG in the job env').toBeUndefined()
    const last = steps.at(-1)
    expect(stepLog(last), 'SYNTHETIC_RUN_LOG of the sweep step').toContain('runner.temp')
    expect(stepLog(last), 'SYNTHETIC_RUN_LOG of the sweep step').toContain('synthetic-runs.txt')
    expect(last?.name).toBe('Synthetic test data of this job is removed')
    expect(String(last?.if).replace(/\s/g, '')).toMatch(/^(always\(\)|\$\{\{always\(\)\}\})$/)
    expect(last?.run).toMatch(/sweep-synthetic\.mjs|sweep:synthetic/)
    expect(JSON.stringify(last?.env ?? {})).toContain(SECRET)
    expect(JSON.stringify(last?.env ?? {})).toContain('SECURITY_CI_SUPABASE_URL')
    // the job-level env holds no secret (GitHub Actions Security: secrets at the step level)
    expect(JSON.stringify(job.env ?? {})).not.toContain('secrets.')
  })
})
