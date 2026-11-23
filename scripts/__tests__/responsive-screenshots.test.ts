// @vitest-environment node
/**
 * Task 957 Revision 2 (R2-3, AC20; Review 2 F7) — scripts/responsive-screenshots.mjs: a screenshot target may name a registry row (`open: <row id>`) and the script clicks that row's
 * selector before the shot. The target must name a row that exists and opens by a click; the two status targets of the listing form name the rows of the census registry, so the open
 * status list of `Patterns/Mantine/ListingFormShellView` `Staff` and `OwnerStatusControl` is shot again in uk at 320, 375 and 390 (as `main` did with the legacy Story).
 * The browser part (the click, the wait for a visible portal root, the exit code 1 when nothing opens) is run on the built Storybook (AC20's command); here the pure part is pinned.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { STORY_TARGETS, registryRow } from '../responsive-screenshots.mjs'

const REPO = path.resolve(__dirname, '..', '..')
const registry = JSON.parse(readFileSync(path.join(REPO, 'scripts', 'rendered-interaction-states.json'), 'utf8')) as { states: { id: string; story: string; open: { kind: string; selector?: string } }[] }

function temporaryRegistry(states: unknown[]): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'responsive-shots-')), 'registry.json')
  writeFileSync(file, JSON.stringify({ version: 1, states }))
  return file
}

describe('registryRow', () => {
  it('[AC20] returns the click row it is asked for', () => {
    const file = temporaryRegistry([{ id: 'a~b', story: 'a', open: { kind: 'click', selector: ':scope > div' } }])
    expect(registryRow('a~b', file).open.selector).toBe(':scope > div')
  })

  it('[AC20] a row that does not exist is refused, so a target cannot name a state nobody registered', () => {
    expect(() => registryRow('missing', temporaryRegistry([]))).toThrow(/no row "missing"/)
  })

  it('[AC20] a row that opens on mount (nothing to click) is refused', () => {
    const file = temporaryRegistry([{ id: 'm', story: 'a', open: { kind: 'mount' } }])
    expect(() => registryRow('m', file)).toThrow(/opens by "mount"/)
  })
})

describe('the status targets of the listing form', () => {
  const targets = STORY_TARGETS.filter((t: { open?: string }) => t.open) as { id: string; open: string; locales: string[]; viewports: string[] }[]

  it('[AC20] there are two, `Staff` and `OwnerStatusControl`, in uk at mobile-320, mobile-375 and mobile-390', () => {
    expect(targets.map((t) => t.id).sort()).toEqual(['patterns-mantine-listingformshellview--owner-status-control', 'patterns-mantine-listingformshellview--staff'])
    for (const t of targets) {
      expect(t.locales).toEqual(['uk'])
      expect(t.viewports).toEqual(['mobile-320', 'mobile-375', 'mobile-390'])
    }
  })

  it('[AC20] each names a click row of the registry that belongs to the target\'s own Story', () => {
    for (const t of targets) {
      const row = registry.states.find((s) => s.id === t.open)
      expect(row, t.open).toBeDefined()
      expect(row!.story).toBe(t.id)
      expect(row!.open.kind).toBe('click')
      expect(row!.open.selector).toBeTruthy()
    }
  })
})
