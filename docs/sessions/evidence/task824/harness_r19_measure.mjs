// Retained Playwright measurement harness for Task 824 kickoff §19 (R31/AC37, R35/AC41, R32/AC38).
// Run against a served `storybook-static` build. Not deleted after use (R32 requires retention) —
// every §19+ measurement transcript names this file. Reused, not rewritten, by later sessions.
import { chromium } from 'playwright'

const BASE = process.env.HARNESS_BASE || 'http://localhost:4471'

async function openMultiLightbox(page, width, height) {
  await page.setViewportSize({ width, height })
  await page.goto(`${BASE}/iframe.html?id=mantine-primitives-lightboxview--default&viewMode=story`, { waitUntil: 'networkidle' })
  // The `Default` story's own `play` function clicks the trigger on load.
  await page.locator('button[aria-label="Close gallery"]').waitFor({ state: 'visible', timeout: 10000 })
}

async function mediaRect(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.flex-1.min-h-0')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
  })
}

async function activeImgNatural(page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector('.flex-1.min-h-0')
    const img = wrapper ? wrapper.querySelector('img') : null
    if (!img) return null
    return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete, src: img.currentSrc || img.src }
  })
}

async function run() {
  const browser = await chromium.launch()

  // ── AC37 [R31] — portrait vs landscape media-frame identity, with decoded natural sizes ──
  {
    const context = await browser.newContext()
    const page = await context.newPage()
    for (const width of [1024, 1440]) {
      for (const height of [700, 800, 900]) {
        await openMultiLightbox(page, width, height)
        const natural0 = await activeImgNatural(page)
        const rect0 = await mediaRect(page)
        console.log(`AC37 [w=${width} h=${height}] index0(landscape) natural=${JSON.stringify(natural0)} rect=${JSON.stringify(rect0)}`)
        await page.getByRole('button', { name: 'Next' }).click()
        await page.waitForTimeout(100)
        const natural1 = await activeImgNatural(page)
        const rect1 = await mediaRect(page)
        console.log(`AC37 [w=${width} h=${height}] index1(portrait) natural=${JSON.stringify(natural1)} rect=${JSON.stringify(rect1)}`)
        const identical = JSON.stringify(rect0) === JSON.stringify(rect1)
        console.log(`AC37 [w=${width} h=${height}] rects identical: ${identical}`)
      }
    }
    await context.close()
  }

  // ── AC41 [R35] — thumbnail-strip overflow stranding at 1024, 24 photos ──
  {
    const context = await browser.newContext()
    const page = await context.newPage()
    await openMultiLightbox(page, 1024, 900)
    // The scrollable strip is `.shrink-0.overflow-x-auto`; the actual thumbnail buttons are one
    // level deeper, inside its `.mx-auto` inner row (R35's justify-start/mx-auto fix).
    const stripInfo = await page.evaluate(() => {
      const strip = document.querySelector('.shrink-0.overflow-x-auto')
      const row = strip ? strip.querySelector('.mx-auto') : null
      if (!strip || !row) return null
      const rect = strip.getBoundingClientRect()
      return {
        clientWidth: strip.clientWidth,
        scrollWidth: strip.scrollWidth,
        scrollLeft: strip.scrollLeft,
        rectLeft: rect.left,
        childCount: row.children.length,
      }
    })
    console.log(`AC41 strip info at scrollLeft=0: ${JSON.stringify(stripInfo)}`)

    const firstThumbAtZero = await page.evaluate(() => {
      const strip = document.querySelector('.shrink-0.overflow-x-auto')
      const row = strip ? strip.querySelector('.mx-auto') : null
      const first = row ? row.children[0] : null
      if (!first) return null
      const r = first.getBoundingClientRect()
      const stripRect = strip.getBoundingClientRect()
      return { left: r.left, right: r.right, stripLeft: stripRect.left, strandedBeforeOrigin: r.left < stripRect.left - 1 }
    })
    console.log(`AC41 first thumbnail at scrollLeft=0: ${JSON.stringify(firstThumbAtZero)}`)

    // Try to scroll fully left (scrollLeft = 0 is already the default/initial state) and fully right.
    const scrolledMax = await page.evaluate(() => {
      const strip = document.querySelector('.shrink-0.overflow-x-auto')
      strip.scrollLeft = strip.scrollWidth
      return strip.scrollLeft
    })
    await page.waitForTimeout(50)
    const lastThumbAtMax = await page.evaluate(() => {
      const strip = document.querySelector('.shrink-0.overflow-x-auto')
      const row = strip ? strip.querySelector('.mx-auto') : null
      const last = row ? row.children[row.children.length - 1] : null
      if (!last) return null
      const r = last.getBoundingClientRect()
      const stripRect = strip.getBoundingClientRect()
      return { left: r.left, right: r.right, stripRight: stripRect.right, scrollLeft: strip.scrollLeft, scrollWidth: strip.scrollWidth, clientWidth: strip.clientWidth }
    })
    console.log(`AC41 scrolled to scrollLeft=${scrolledMax}, last thumbnail: ${JSON.stringify(lastThumbAtMax)}`)

    // Explicitly try scrollLeft = 0 again (after having scrolled) and re-check the first thumbnail
    // is fully reachable/visible (not stranded to the left of the visible/scrollable area at all).
    const backToZero = await page.evaluate(() => {
      const strip = document.querySelector('.shrink-0.overflow-x-auto')
      const row = strip.querySelector('.mx-auto')
      strip.scrollLeft = 0
      const first = row.children[0]
      const r = first.getBoundingClientRect()
      const stripRect = strip.getBoundingClientRect()
      return { scrollLeft: strip.scrollLeft, firstLeft: r.left, firstRight: r.right, stripLeft: stripRect.left, stripRight: stripRect.right, firstFullyVisible: r.left >= stripRect.left - 1 && r.right <= stripRect.right + 1 }
    })
    console.log(`AC41 back to scrollLeft=0, first thumbnail fully visible: ${JSON.stringify(backToZero)}`)
    await context.close()
  }

  // ── AC38 [R32] — pointer-capture re-measurement, real page.mouse CDP input attempted first ──
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${BASE}/iframe.html?id=mantine-primitives-lightboxview--swipe-track-mode&viewMode=story`, { waitUntil: 'networkidle' })
    const track = page.locator('[role="group"]').first()
    await track.waitFor({ state: 'visible', timeout: 10000 })
    const box = await track.boundingBox()
    const readTransform = () => page.evaluate(() => document.querySelector('[role="group"] > div')?.style.transform)
    const startX = box.x + box.width / 2
    const y = box.y + box.height / 2
    const outsideX = box.x - 20

    const restTransform = await readTransform()
    console.log(`AC38 real-mouse attempt: resting transform before drag: ${restTransform}`)
    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(startX - 15, y)
    await page.waitForTimeout(80)
    const afterAxisLock = await readTransform()
    console.log(`AC38 real-mouse: transform after axis-lock move (startX-15): ${afterAxisLock}`)
    await page.mouse.move(outsideX, y, { steps: 5 })
    await page.waitForTimeout(80)
    const midOutsideReal = await readTransform()
    console.log(`AC38 real-mouse: transform mid-drag OUTSIDE container: ${midOutsideReal}`)
    await page.mouse.up()
    await page.waitForTimeout(400)
    const afterReleaseReal = await readTransform()
    console.log(`AC38 real-mouse: transform AFTER release: ${afterReleaseReal}`)
    const realMouseMovedIt = afterAxisLock !== restTransform || midOutsideReal !== restTransform
    console.log(`AC38 real-mouse input actually moved dragOffset: ${realMouseMovedIt}`)

    await context.close()
  }

  await browser.close()
  console.log('\n--- DONE ---')
}

run().catch((e) => {
  console.error('HARNESS ERROR', e)
  process.exitCode = 1
})
