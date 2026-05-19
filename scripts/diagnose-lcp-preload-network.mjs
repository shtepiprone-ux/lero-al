#!/usr/bin/env node
/**
 * diagnose-lcp-preload-network.mjs
 *
 * Playwright-based network trace for Listing Detail LCP diagnostics (Task 77).
 *
 * Answers:
 *   1. Is the HTTP Link preload header present in the response?
 *   2. Does the Cloudinary image request start early (during TTFB) or late (after HTML parse)?
 *   3. Does the preloaded URL match the URL the <img> element actually requests?
 *   4. What is the LCP element and timing?
 *   5. Are there duplicate Cloudinary image requests (wasted preload)?
 *
 * Usage:
 *   node scripts/diagnose-lcp-preload-network.mjs [BASE_URL] [SLUG]
 *
 * Examples:
 *   node scripts/diagnose-lcp-preload-network.mjs https://lero.al test-7-molyl9c8
 *   node scripts/diagnose-lcp-preload-network.mjs http://localhost:3099 test-7-molyl9c8
 *
 * Requires: playwright (devDependency, already installed)
 *   npx playwright install chromium   (if Chromium not yet downloaded)
 *
 * Output: console + .artifacts/lcp-network-trace/<locale>-<viewport>.json
 *
 * Locales:    sq, en, uk, it
 * Viewports:  375-mobile (working baseline), 1280-desktop (problem case)
 */

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname    = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ARTIFACTS    = path.join(PROJECT_ROOT, '.artifacts', 'lcp-network-trace')

const BASE_URL = process.argv[2] || 'https://lero.al'
const SLUG     = process.argv[3] || 'test-7-molyl9c8'
const LOCALES  = ['sq', 'en', 'uk', 'it']

const VIEWPORTS = [
  { name: '1280-desktop', width: 1280, height: 800,  isMobile: false, dpr: 1 },
  { name: '375-mobile',   width: 375,  height: 667,  isMobile: true,  dpr: 2 },
]

// RFC 8288-aware Link header entry splitter
function splitLinkEntries(raw) {
  if (!raw) return []
  const entries = []
  let cur = '', inQ = false
  for (const ch of raw) {
    if (ch === '"') { inQ = !inQ; cur += ch }
    else if (ch === ',' && !inQ) { entries.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  if (cur.trim()) entries.push(cur.trim())
  return entries
}

function findImagePreloadEntry(linkHeader) {
  const entries = splitLinkEntries(linkHeader)
  return entries.find(e => {
    const lo = e.toLowerCase()
    return lo.includes('res.cloudinary.com') &&
           /rel\s*=\s*"?preload"?/.test(lo) &&
           /as\s*=\s*"?image"?/.test(lo)
  }) ?? null
}

function extractHref(entry) {
  return entry?.match(/^<([^>]+)>/)?.[1] ?? null
}

async function diagnoseLocaleViewport(page, locale, viewport) {
  const url = `${BASE_URL}/${locale}/listings/${SLUG}`
  const cdnRequests = []
  let pageResponseLinkHeader = null
  let navigationStartMs = 0

  // Track Cloudinary requests and their timing
  page.on('request', req => {
    if (req.url().includes('res.cloudinary.com')) {
      const relativeMs = Date.now() - navigationStartMs
      cdnRequests.push({
        url: req.url(),
        relativeStartMs: relativeMs,
        resourceType: req.resourceType(),
        headers: { initiator: req.headers()['sec-fetch-dest'] ?? null },
      })
    }
  })

  page.on('requestfinished', req => {
    if (req.url().includes('res.cloudinary.com')) {
      try {
        const timing = req.timing()
        const entry = cdnRequests.find(r => r.url === req.url())
        if (entry) {
          entry.startMs   = Math.round(timing.startTime)
          entry.responseEndMs = Math.round(timing.responseEnd)
          entry.durationMs = Math.round(timing.responseEnd - timing.startTime)
        }
      } catch {}
    }
  })

  // Capture HTTP response headers for the page itself
  page.on('response', async res => {
    try {
      if (res.url() === url || res.url().startsWith(url)) {
        const headers = await res.allHeaders()
        pageResponseLinkHeader = headers['link'] ?? headers['Link'] ?? null
      }
    } catch {}
  })

  navigationStartMs = Date.now()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  } catch (e) {
    return { locale, viewport: viewport.name, url, error: `Navigation failed: ${e.message}` }
  }

  // Collect LCP via Performance API (after networkidle)
  const lcp = await page.evaluate(() => {
    const entries = performance.getEntriesByType('largest-contentful-paint')
    const last = entries[entries.length - 1]
    if (!last) return null
    return {
      lcp_ms:       Math.round(last.startTime),
      url:          last.url || null,
      element:      last.element?.tagName ?? null,
      elementId:    last.element?.id ?? null,
      elementClass: (last.element?.className ?? '').slice(0, 80) || null,
      size:         last.size,
    }
  }).catch(() => null)

  // Collect navigation timing
  const navTiming = await page.evaluate(() => {
    const e = performance.getEntriesByType('navigation')[0]
    if (!e) return null
    return {
      ttfb:          Math.round(e.responseStart - e.requestStart),
      htmlStreamEnd: Math.round(e.responseEnd - e.requestStart),
      domComplete:   Math.round(e.domComplete),
    }
  }).catch(() => null)

  // Parse the Link header from the HTTP response
  const preloadEntry = findImagePreloadEntry(pageResponseLinkHeader ?? '')
  const preloadHref  = extractHref(preloadEntry)

  // Analyse Cloudinary requests
  const imgRequests = cdnRequests.filter(r => r.resourceType === 'image' || r.resourceType === 'fetch')
  const earliestCdn = imgRequests.length
    ? imgRequests.reduce((a, b) => (a.startMs ?? a.relativeStartMs) < (b.startMs ?? b.relativeStartMs) ? a : b)
    : null

  // Check URL match: does the preloaded href appear in the actual image requests?
  const preloadUsed = preloadHref
    ? imgRequests.some(r => r.url === preloadHref || r.url.startsWith(preloadHref))
    : false

  // Detect duplicate downloads (same Cloudinary URL requested >1 time)
  const urlCounts = {}
  for (const r of imgRequests) {
    urlCounts[r.url] = (urlCounts[r.url] ?? 0) + 1
  }
  const duplicates = Object.entries(urlCounts).filter(([, n]) => n > 1).map(([u]) => u)

  return {
    locale,
    viewport:      viewport.name,
    url,
    linkHeader: {
      raw:         (pageResponseLinkHeader ?? '').slice(0, 600),
      entryCount:  splitLinkEntries(pageResponseLinkHeader ?? '').length,
      preloadEntry: preloadEntry?.slice(0, 200) ?? null,
      preloadHref,
    },
    lcp,
    navTiming,
    cdnRequests: imgRequests.map(r => ({
      url:         r.url.slice(0, 200),
      startMs:     r.startMs ?? r.relativeStartMs,
      durationMs:  r.durationMs ?? null,
    })),
    earliestCdnStartMs: earliestCdn ? (earliestCdn.startMs ?? earliestCdn.relativeStartMs) : null,
    preloadUsed,
    duplicates,
    diagnosis: (() => {
      if (!preloadHref) return 'NO_PRELOAD_HREF — header missing or not a href-only entry'
      if (!preloadUsed) return `PRELOAD_URL_MISMATCH — preloaded ${preloadHref.slice(-60)} not in img requests`
      return 'PRELOAD_USED — preloaded URL matched an img request'
    })(),
  }
}

async function main() {
  let chromium
  try {
    const pw = await import('playwright')
    chromium = pw.chromium
  } catch {
    console.error('ERROR: playwright not found. Run: npx playwright install chromium')
    process.exit(1)
  }

  await mkdir(ARTIFACTS, { recursive: true })

  console.log('='.repeat(72))
  console.log('Listing Detail LCP Network Trace (Task 77 — diagnose-lcp-preload-network)')
  console.log('='.repeat(72))
  console.log(`Base URL : ${BASE_URL}`)
  console.log(`Slug     : ${SLUG}`)
  console.log(`Locales  : ${LOCALES.join(', ')}`)
  console.log()

  const allResults = []

  for (const viewport of VIEWPORTS) {
    console.log(`── Viewport: ${viewport.name} (${viewport.width}×${viewport.height}, DPR=${viewport.dpr}) ───`)
    const browser = await chromium.launch({ headless: true })

    for (const locale of LOCALES) {
      const context = await browser.newContext({
        viewport:    { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.dpr,
        isMobile:    viewport.isMobile,
        userAgent:   viewport.isMobile
          ? 'Mozilla/5.0 (Linux; Android 11; Pixel 5) Chrome/119.0.0.0 Mobile Safari/537.36'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/119.0.0.0 Safari/537.36',
      })
      const page = await context.newPage()

      process.stdout.write(`  ${locale} @ ${viewport.name} ... `)
      const result = await diagnoseLocaleViewport(page, locale, viewport)
      allResults.push(result)

      await context.close()

      if (result.error) {
        console.log(`ERROR: ${result.error}`)
        continue
      }

      const preloadStatus = result.linkHeader.preloadHref
        ? (result.preloadUsed ? '✅ USED' : '❌ NOT USED (URL mismatch)')
        : '❌ NO PRELOAD HREF'
      const lcpStr = result.lcp ? `${result.lcp.lcp_ms}ms <${result.lcp.element ?? '?'}>` : 'N/A'
      const cdnStr = result.earliestCdnStartMs != null ? `first cdn request @ ${result.earliestCdnStartMs}ms` : 'no cdn'
      console.log(`LCP=${lcpStr} | preload=${preloadStatus} | ${cdnStr}`)

      if (result.diagnosis) {
        console.log(`  diagnosis: ${result.diagnosis}`)
      }
      if (result.duplicates?.length) {
        console.log(`  DUPLICATE requests: ${result.duplicates.length}`)
      }
    }

    await browser.close()
    console.log()
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('='.repeat(72))
  console.log('SUMMARY')
  console.log('='.repeat(72))
  console.log()

  for (const r of allResults) {
    if (r.error) continue
    const ph = r.linkHeader.preloadHref
    const lcpEl = r.lcp?.element ?? '?'
    const lcpMs = r.lcp?.lcp_ms ?? '?'
    const cdnStart = r.earliestCdnStartMs != null ? `${r.earliestCdnStartMs}ms` : '—'
    const preloadIcon = r.preloadUsed ? '✅' : (ph ? '❌' : '⚠️ ')
    console.log(`${r.locale} @ ${r.viewport}: LCP=${lcpMs}ms <${lcpEl}> | cdn_start=${cdnStart} | preload=${preloadIcon}`)
  }

  console.log()
  console.log('Preload diagnosis per locale×viewport:')
  for (const r of allResults) {
    if (r.error) continue
    console.log(`  ${r.locale} @ ${r.viewport}: ${r.diagnosis ?? 'N/A'}`)
  }

  // Save artifacts
  try {
    const summaryPath = path.join(ARTIFACTS, 'summary.json')
    await writeFile(summaryPath, JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, slug: SLUG, results: allResults }, null, 2))
    console.log()
    console.log(`Trace saved: ${summaryPath}`)
  } catch (e) {
    console.error('Failed to save trace:', e.message)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
