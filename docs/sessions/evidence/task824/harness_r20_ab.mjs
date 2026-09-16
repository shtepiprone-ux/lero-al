// Retained A/B measurement harness for Task 824 kickoff §20 (R37/AC43, R38/AC44).
// Measures the desktop lightbox media-wrapper rect and thumbnail-strip stranding at a single
// viewport (1024x900) against whichever LightboxView.tsx arm is currently built into
// storybook-static. Run once per arm; the caller passes an ARM_LABEL via env var.
import { chromium } from 'playwright'

const BASE = process.env.HARNESS_BASE || 'http://localhost:4471'
const ARM = process.env.ARM_LABEL || 'unlabeled'

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto(`${BASE}/iframe.html?id=mantine-primitives-lightboxview--default&viewMode=story`, { waitUntil: 'networkidle' })
  await page.locator('button[aria-label="Close gallery"]').waitFor({ state: 'visible', timeout: 10000 })

  const wrapperRect = await page.evaluate(() => {
    // The outer desktop wrapper is the parent of the media flex-1 region.
    const media = document.querySelector('.flex-1.min-h-0')
    const wrapper = media ? media.parentElement : null
    if (!wrapper) return null
    const r = wrapper.getBoundingClientRect()
    return { className: wrapper.className, top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
  })
  console.log(`ARM=${ARM} wrapperRect=${JSON.stringify(wrapperRect)}`)

  const stripInfo = await page.evaluate(() => {
    const strip = document.querySelector('.shrink-0.overflow-x-auto')
    if (!strip) return null
    const stripRect = strip.getBoundingClientRect()
    // First thumbnail may be a direct child (justify-center arm) or nested in a .mx-auto row (justify-start arm).
    const row = strip.querySelector('.mx-auto')
    const first = row ? row.children[0] : strip.children[0]
    const firstRect = first ? first.getBoundingClientRect() : null
    return {
      clientWidth: strip.clientWidth,
      scrollWidth: strip.scrollWidth,
      scrollLeft: strip.scrollLeft,
      stripLeft: stripRect.left,
      firstLeft: firstRect ? firstRect.left : null,
      firstRight: firstRect ? firstRect.right : null,
      strandedBeforeOrigin: firstRect ? firstRect.left < stripRect.left - 1 : null,
    }
  })
  console.log(`ARM=${ARM} stripInfo=${JSON.stringify(stripInfo)}`)

  await browser.close()
}

run().catch((e) => {
  console.error(`ARM=${ARM} HARNESS ERROR`, e)
  process.exitCode = 1
})
