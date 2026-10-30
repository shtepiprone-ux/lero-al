/**
 * Real-boundary control for findings S1 and S28 (Task 923 Revision 7, R38): the Server Action manifest of the PRODUCTION BUILD is the list of functions an HTTP client
 * can call by posting an action id. Next writes it at `.next/server/server-reference-manifest.json` with the keys `node`, `edge` and `encryptionKey`. This suite reads
 * ONLY the `node` and `edge` maps (each entry names its source file and exported function); the `encryptionKey` is never read into a variable, printed or written.
 * The manifest must come from a build made after the source files it is checked against, so a stale `.next` cannot make the check pass.
 * Run after `npm run build`: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const MANIFEST = join(process.cwd(), '.next', 'server', 'server-reference-manifest.json')

interface PublicAction { file: string; exportedName: string }

/** The public actions of the build, from the `node` and `edge` maps only. */
function publicActions(): PublicAction[] {
  expect(existsSync(MANIFEST), 'the production build has not been made: run npm run build first').toBe(true)
  const { node, edge } = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { node?: Record<string, { filename?: string; exportedName?: string }>; edge?: Record<string, { filename?: string; exportedName?: string }> }
  const entries = [...Object.values(node ?? {}), ...Object.values(edge ?? {})]
  return entries.map((entry) => ({ file: String(entry.filename ?? '').split('\\').join('/'), exportedName: String(entry.exportedName ?? '') }))
}

/** The manifest is newer than the source file it is checked against (a build made before an edit proves nothing about the edit). */
function builtAfter(sourceFile: string) {
  expect(statSync(MANIFEST).mtimeMs, `.next is older than ${sourceFile}: run npm run build again`).toBeGreaterThanOrEqual(statSync(join(process.cwd(), sourceFile)).mtimeMs)
}

it('[SEC-S01-INT-DENY] createNotification is not reachable as a public Server Action', () => {
  builtAfter('src/modules/notifications/lib/createNotification.ts')
  const reachable = publicActions().filter((action) => action.exportedName === 'createNotification' || action.file.endsWith('/notifications/lib/createNotification.ts'))
  expect(reachable, 'no entry of the manifest maps to createNotification').toEqual([])
})

it('[SEC-S01-INT-ALLOW] createNotification is not reachable as a public Server Action', () => {
  const actions = publicActions()
  expect(actions.length, 'the manifest is not empty').toBeGreaterThan(0)
  const inquiry = actions.filter((action) => action.exportedName === 'submitListingInquiry' && action.file.endsWith('/listings/actions/submitListingInquiry.ts'))
  expect(inquiry.length, 'the public submitListingInquiry action is in the manifest, so the check reads a real manifest').toBeGreaterThanOrEqual(1)
})

it('[SEC-S28-INT-DENY] applyListingTransitionByStatus is not reachable as a public Server Action and no public action accepts an actor', () => {
  builtAfter('src/modules/listings/actions/applyListingTransition.ts')
  const reachable = publicActions().filter((action) => action.exportedName === 'applyListingTransitionByStatus' || action.file.endsWith('/listings/actions/applyListingTransition.ts'))
  expect(reachable, 'no entry of the manifest maps to applyListingTransitionByStatus').toEqual([])
})

it('[SEC-S28-INT-ALLOW] applyListingTransitionByStatus is not reachable as a public Server Action and no public action accepts an actor', () => {
  const actions = publicActions()
  expect(actions.length, 'the manifest is not empty').toBeGreaterThan(0)
  const bridge = actions.filter((action) => action.exportedName === 'changeListingStatusAction' && action.file.endsWith('/listings/actions/changeListingStatus.ts'))
  expect(bridge.length, 'changeListingStatusAction (the use server bridge that calls the gateway) is in the manifest').toBeGreaterThanOrEqual(1)
})
