// @vitest-environment node
/**
 * Anchor-divergence gate (Task 698, R4/D25).
 *
 * Task 697 froze every story fixture's date VALUES to one literal anchor instant. Task 698 froze
 * the Storybook preview clock to the same instant, but `.storybook/preview-head.html` is raw HTML
 * — it cannot `import` the fixture constant, so the anchor literal exists in two independent
 * places. A silent divergence between them would quietly restore both halves of the pre-698 bug
 * (drifting relative-time strings, flipping "new"/expiry badges) without any other gate noticing.
 *
 * This test fails the build the instant those two literals stop matching.
 *
 * Run: npx vitest run scripts/__tests__/preview-clock-anchor.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

function extractPreviewHeadAnchor(): string {
  const path = join(ROOT, '.storybook', 'preview-head.html')
  const content = readFileSync(path, 'utf8')
  const m = content.match(/FROZEN_ISO\s*=\s*'([^']+)'/)
  if (!m) throw new Error(`${path}: FROZEN_ISO literal not found`)
  return m[1]!
}

function extractFixtureAnchor(): string {
  const path = join(ROOT, 'src', 'stories', 'fixtures', 'cardListingData.fixture.ts')
  const content = readFileSync(path, 'utf8')
  const m = content.match(/FIXTURE_ANCHOR_MS\s*=\s*Date\.parse\('([^']+)'\)/)
  if (!m) throw new Error(`${path}: FIXTURE_ANCHOR_MS literal not found`)
  return m[1]!
}

describe('preview clock anchor matches the frozen fixture anchor (Task 698, R4)', () => {
  it("preview-head.html's FROZEN_ISO equals cardListingData.fixture.ts's FIXTURE_ANCHOR_MS", () => {
    const previewAnchor = extractPreviewHeadAnchor()
    const fixtureAnchor = extractFixtureAnchor()
    expect(
      previewAnchor,
      `preview-head.html FROZEN_ISO='${previewAnchor}' vs ` +
        `cardListingData.fixture.ts FIXTURE_ANCHOR_MS='${fixtureAnchor}' — these two literals ` +
        `must be byte-identical or the Storybook clock and the frozen fixtures fall out of sync.`
    ).toBe(fixtureAnchor)
  })
})
