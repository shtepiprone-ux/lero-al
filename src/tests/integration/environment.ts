/**
 * Real-boundary test environment (workflow-gates / security-test-environment.md).
 *
 * The integration suites talk to REAL Supabase Auth and the REAL database of the owner-approved DEVELOPMENT project, with synthetic rows of one run. They never
 * run by accident and never against another project:
 *  - the target is declared as in shared/workflow-gates.md: `SECURITY_TEST_TARGET=development` and `SECURITY_TEST_PROJECT_REF` = the approved project ref. The project is
 *    identified by the ref in the Supabase URL; the run refuses to start unless both declarations match it (the person who starts the run states which project is
 *    approved; a missing, different or production value FAILS the suite, it does not skip it);
 *  - credentials come from the owner's approved source by NAME only: the three variables below, from the process environment or the project's `.env.local`.
 *    Nothing else in that file is read; nothing is printed; an error text never contains a value.
 */
import 'server-only'

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const NAMES = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const

export interface IntegrationEnv {
  url: string
  anonKey: string
  serviceKey: string
  /** The project ref taken from the URL (an identifier, not a secret). */
  projectRef: string
}

function readNamedValues(file: string): Partial<Record<(typeof NAMES)[number], string>> {
  if (!existsSync(file)) return {}
  const out: Partial<Record<(typeof NAMES)[number], string>> = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line)
    if (match && (NAMES as readonly string[]).includes(match[1])) out[match[1] as (typeof NAMES)[number]] = match[2].replace(/^["']|["']$/g, '')
  }
  return out
}

export function loadIntegrationEnv(): IntegrationEnv {
  const fromFile = readNamedValues(resolve(process.cwd(), '.env.local'))
  const get = (name: (typeof NAMES)[number]) => process.env[name] || fromFile[name]
  const missing = NAMES.filter(name => !get(name))
  if (missing.length) throw new Error(`Integration suite cannot start: missing ${missing.join(', ')} (names only; values are never printed).`)

  const url = get('NEXT_PUBLIC_SUPABASE_URL') as string
  let host: string
  try { host = new URL(url).hostname } catch { throw new Error('Integration suite cannot start: NEXT_PUBLIC_SUPABASE_URL is not a URL.') }
  if (!host.endsWith('.supabase.co')) throw new Error('Integration suite cannot start: the Supabase URL is not a hosted *.supabase.co project, so its identity cannot be confirmed.')
  const projectRef = host.slice(0, -'.supabase.co'.length)

  if (process.env.SECURITY_TEST_TARGET !== 'development') {
    throw new Error('Refusing to run: set SECURITY_TEST_TARGET=development. The suite creates and deletes users and must only ever run against the approved development target.')
  }
  if (process.env.SECURITY_TEST_PROJECT_REF !== projectRef) {
    throw new Error(
      `Refusing to run: set SECURITY_TEST_PROJECT_REF to the ref of the approved DEVELOPMENT project to confirm it. The configured project ref is "${projectRef}"; ` +
      'this check exists so that a suite which creates and deletes users never runs against a project nobody approved.',
    )
  }
  return { url, anonKey: get('NEXT_PUBLIC_SUPABASE_ANON_KEY') as string, serviceKey: get('SUPABASE_SERVICE_ROLE_KEY') as string, projectRef }
}

/** Makes the code under test (createAdminClient reads process.env) see the confirmed project. Only these three variables are set. */
export function applyIntegrationEnv(env: IntegrationEnv): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.url
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.anonKey
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.serviceKey
}
