#!/usr/bin/env node
/**
 * diagnose-lcp-preload-network.mjs
 *
 * Playwright-based network trace for Listing Detail LCP diagnostics.
 * Task 78 rewrite — fixes three bugs from Task 77:
 *
 *   Bug 1 (LCP=N/A): PerformanceObserver injected via addInitScript() BEFORE
 *     navigation so it captures all LCP candidates from document start.
 *
 *   Bug 2 (absolute timestamps): request.timing().startTime is epoch ms.
 *     Normalised by subtracting performance.timeOrigin (epoch ms of nav start).
 *
 *   Bug 3 (NO_PRELOAD_HREF): response.allHeaders() correctly handles multiple
 *     Link header values (unlike fetch().headers.get()), capturing BOTH the
 *     next-intl hreflang entries and our Cloudinary preload.
 *
 * Also fixes: parser now uses both RFC 8288 split and direct regex scan,
 * normalises \\n-joined multi-header values, and correctly extracts the
 * Cloudinary URL regardless of parameter ordering.
 *
 * Usage:
 *   node scripts/diagnose-lcp-preload-network.mjs [BASE_URL] [SLUG]
 *
 * Examples:
 *   node scripts/diagnose-lcp-preload-network.mjs https://lero.al test-7-molyl9c8
 *   node scripts/diagnose-lcp-preload-network.mjs http://localhost:3099 test-7-molyl9c8
 *
 * Requires:
 *   playwright (devDependency). If Chromium not yet downloaded:
 *     npx playwright install chromium
 *
 * Output:
 *   console + .artifacts/lcp-network-trace/summary.json  (gitignored)
 *
 * Viewports:  1280-desktop (primary), 375-mobile (baseline check)
 * Locales:    sq, en, uk, it
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
  { name: '1280-desktop', width: 1280, height: 800,  dpr: 1, isMobile: false },
  { name: '375-mobile',   width: 375,  height: 667,  dpr: 2, isMobile: true  },
]

// ── Link header parser (two-strategy) ────────────────────────────────────────

function splitLinkEntries(raw) {
  const h = (raw || '').replace(/\r?\n/g, ', ')
  const entries = []
  let cur = '', inQ = false
  for (const ch of h) {
    if (ch === '"') { inQ = !inQ; cur += ch }
    else if (ch === ',' && !inQ) { entries.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  if (cur.trim()) entries.push(cur.trim())
  return entries
}

function findCloudinaryPreload(rawHeader) {
  if (!rawHeader) return null
  const h = rawHeader.replace(/\r?\n/g, ', ')

  // Strategy 1: RFC 8288-aware entry split
  for (const e of splitLinkEntries(h)) {
    const lo = e.toLowerCase()
    if (!lo.includes('res.cloudinary.com')) continue
    if (!/\brel\s*=\s*"?preload"?\b/.test(lo)) continue
    if (!/\bas\s*=\s*"?image"?\b/.test(lo)) continue
    const urlM = e.match(/^<([^>]+)>/)
    if (urlM) return { href: urlM[1], raw: e.slice(0, 300), method: 'rfc8288' }
  }

  // Strategy 2: Direct regex scan — locates any Cloudinary URL then checks
  // the following parameters for rel=preload and as=image.
  const cdnRe = /<(https:\/\/res\.cloudinary\.com\/[^>]+)>/gi
  let m
  while ((m = cdnRe.exec(h)) !== null) {
    const after = h.slice(m.index + m[0].length, m.index + m[0].length + 200)
    const lo    = after.toLowerCase()
    if (/\brel\s*=\s*"?preload"?\b/.test(lo) && /\bas\s*=\s*"?image"?\b/.test(lo)) {
      const entry = (m[0] + after.split(/[,<]/)[0]).slice(0, 300)
      return { href: m[1], raw: entry, method: 'direct' }
    }
  }
  return null
}

// ── Per-locale/viewport diagnostic ───────────────────────────────────────────

async function diagnoseLocale(browser, locale, viewport) {
  const url = `${BASE_URL}/${locale}/listings/${SLUG}`

  const context = await browser.newContext({
    viewport:          { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dpr,
    isMobile:          viewport.isMobile,
    userAgent:         viewport.isMobile
      ? 'Mozilla/5.0 (Linux; Android 11; Pixel 5) Chrome/119.0.0.0 Mobile Safari/537.36'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/119.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // ── Bug 1 fix: inject LCP observer BEFORE navigation ─────────────────────
  await page.addInitScript(() => {
    window.__lcpEntries = []
    try {
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          window.__lcpEntries.push({
            t:   e.startTime,
            url: e.url    || null,
            tag: e.element?.tagName ?? null,
            id:  e.element?.id      ?? null,
            cls: String(e.element?.className ?? '').slice(0, 80),
            src: e.element?.currentSrc ?? e.element?.src ?? null,
            size: e.size,
          })
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {}
  })

  // ── Task 79 fix: CDP-based document header capture ───────────────────────
  //
  // Playwright's response event + allHeaders() has two failure modes:
  //   1. Async race: page.goto() resolves before allHeaders() completes.
  //   2. isNavigationRequest() matches the redirect before the final document.
  //
  // CDP Network.responseReceived is synchronous (event-driven, no await) and
  // fires for every response. We track the Document requestId and capture its
  // headers directly from Chrome DevTools Protocol. Multiple Link header values
  // are joined with \n in CDP — the parser normalises this.
  let docLinkHeader = ''
  let docStatus     = 0
  let docFinalUrl   = url

  const cdpSession = await context.newCDPSession(page)
  await cdpSession.send('Network.enable')

  const docRequestIds = new Set()

  cdpSession.on('Network.requestWillBeSent', ({ requestId, type }) => {
    if (type === 'Document') docRequestIds.add(requestId)
  })

  cdpSession.on('Network.responseReceived', ({ requestId, response }) => {
    if (!docRequestIds.has(requestId)) return
    if (response.status >= 300 && response.status < 400) return  // skip redirects
    docStatus   = response.status
    docFinalUrl = response.url
    // CDP: {headerName: value}, multiple values for same key joined by \n
    const linkParts = Object.entries(response.headers ?? {})
      .filter(([k]) => k.toLowerCase() === 'link')
      .map(([, v]) => v)
    if (linkParts.length) docLinkHeader = linkParts.join('\n')
  })

  // ── Track Cloudinary image requests ─────────────────────────────────────
  //
  // Playwright RequestTiming (from Chrome DevTools Protocol):
  //   t.startTime    — epoch ms when the request was initiated (absolute wall clock)
  //   t.responseEnd  — ms elapsed since t.startTime when the last byte arrived
  //                    (i.e. it is ALREADY the duration, NOT an epoch timestamp)
  //
  // Bug in Task 77/78: epochEndMs was set to t.responseEnd then later we
  // computed durationMs = epochEndMs - epochStartMs = (small ms) - (epoch ms)
  // = huge negative number like -1779175102472ms.
  //
  // Fix: store t.responseEnd directly as durationMs.
  const cdnRequests = []
  page.on('requestfinished', req => {
    if (!req.url().includes('res.cloudinary.com')) return
    try {
      const t = req.timing()
      cdnRequests.push({
        url:          req.url(),
        startEpochMs: Math.round(t.startTime),
        durationMs:   t.responseEnd > 0 ? Math.round(t.responseEnd) : null,  // already a duration ✓
        resourceType: req.resourceType(),
      })
    } catch {}
  })

  // ── Navigate ─────────────────────────────────────────────────────────────
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  } catch (e) {
    await context.close()
    return { locale, viewport: viewport.name, url, error: `goto failed: ${e.message}` }
  }

  // ── Bug 2 fix: get navigation start epoch for timing normalisation ────────
  const navStartEpoch = await page.evaluate(() => performance.timeOrigin).catch(() => 0)

  // ── Trigger LCP finalisation (user interaction required by Chrome) ────────
  await page.mouse.move(Math.floor(viewport.width / 2), Math.floor(viewport.height / 2))
  await page.waitForTimeout(600)

  // ── Read LCP from injected observer ──────────────────────────────────────
  const rawLcp = await page.evaluate(() => {
    const entries = window.__lcpEntries ?? []
    return entries[entries.length - 1] ?? null
  }).catch(() => null)

  // ── Gallery img src via DOM ───────────────────────────────────────────────
  const galleryImgSrc = await page.evaluate(() => {
    // GalleryStaticFrame img — highest fetchpriority img in the page
    const img = document.querySelector('img[fetchpriority="high"], img[fetchPriority="high"]')
    return img ? (img.currentSrc || img.src || null) : null
  }).catch(() => null)

  await context.close()

  // ── Normalise CDN request timings ────────────────────────────────────────
  const normalised = cdnRequests
    .filter(r => r.resourceType === 'image' || r.resourceType === 'fetch' || r.resourceType === 'xhr')
    .map(r => ({
      url:        r.url,
      // startMs: navigation-relative ms (epoch start minus navigation epoch start)
      startMs:    navStartEpoch > 0 ? Math.round(r.startEpochMs - navStartEpoch) : null,
      // durationMs: already t.responseEnd (ms from request start) — never negative ✓
      durationMs: r.durationMs,
    }))
    .sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0))

  // ── Identify the 640w preload request ────────────────────────────────────
  const preloadInfo  = findCloudinaryPreload(docLinkHeader ?? '')
  const preloadHref  = preloadInfo?.href ?? null
  const preloadWidth = preloadHref?.match(/[,/]w_(\d+)/)?.[1] ?? null

  const cdn640  = normalised.find(r => r.url.includes('w_640'))
  const earliest = normalised[0] ?? null

  // Does the preloaded URL exactly match the gallery <img> source?
  const lcpImgUrl = rawLcp?.url || rawLcp?.src || null
  const preloadMatchesLcp = preloadHref && lcpImgUrl ? (preloadHref === lcpImgUrl) : false
  const preloadMatchesGallery = preloadHref && galleryImgSrc ? (preloadHref === galleryImgSrc) : false

  // Duplicate requests (same URL fetched more than once)
  const urlCounts = {}
  for (const r of normalised) urlCounts[r.url] = (urlCounts[r.url] ?? 0) + 1
  const duplicates = Object.entries(urlCounts).filter(([, n]) => n > 1).map(([u]) => u)

  // ── Diagnose ─────────────────────────────────────────────────────────────
  let diagnosis
  if (!preloadHref) {
    diagnosis = 'NO_PRELOAD_HREF'
  } else if (!cdn640) {
    diagnosis = 'PRELOAD_NOT_USED'
  } else if (cdn640.startMs !== null && cdn640.startMs < 200) {
    if (cdn640.durationMs !== null && cdn640.durationMs > 3000) {
      diagnosis = 'CLOUDINARY_COLD_VARIANT'
    } else if (preloadMatchesGallery || preloadMatchesLcp) {
      diagnosis = 'PRELOAD_USED'
    } else {
      diagnosis = 'PRELOAD_USED'   // early request regardless of URL match tracking
    }
  } else {
    if (!preloadMatchesGallery && !preloadMatchesLcp) {
      diagnosis = 'URL_MISMATCH'
    } else {
      diagnosis = 'PRELOAD_NOT_USED'
    }
  }

  if (rawLcp && rawLcp.tag !== 'IMG' && !lcpImgUrl?.includes('res.cloudinary.com')) {
    diagnosis = 'LCP_NOT_GALLERY_IMAGE'
  }

  return {
    locale,
    viewport:                     viewport.name,
    url,
    status:                       docStatus,
    finalUrl:                     docFinalUrl,
    documentLinkHeaderRaw:        (docLinkHeader ?? '').slice(0, 600),
    parsedCloudinaryPreloadUrl:   preloadHref,
    parsedCloudinaryPreloadWidth: preloadWidth ? Number(preloadWidth) : null,
    hasValidCloudinaryPreload:    !!preloadHref,
    parserMethod:                 preloadInfo?.method ?? null,
    firstCloudinaryRequestUrl:    earliest?.url ?? null,
    firstCloudinaryRequestStartMs: earliest?.startMs ?? null,
    cloudinary640RequestStartMs:  cdn640?.startMs ?? null,
    cloudinary640ResponseEndMs:   cdn640 ? (cdn640.startMs != null && cdn640.durationMs != null ? cdn640.startMs + cdn640.durationMs : null) : null,
    cloudinary640DurationMs:      cdn640?.durationMs ?? null,
    galleryImgUrl:                galleryImgSrc,
    preloadMatchesGalleryImg:     preloadMatchesGallery,
    duplicateCloudinaryRequests:  duplicates,
    lcpMs:                        rawLcp ? Math.round(rawLcp.t) : null,
    lcpElementTag:                rawLcp?.tag ?? null,
    lcpElementUrl:                lcpImgUrl,
    lcpIsGalleryImage:            !!(rawLcp?.tag === 'IMG' && lcpImgUrl?.includes('res.cloudinary.com')),
    diagnosis,
    cdnRequests:                  normalised.map(r => ({ ...r, url: r.url.slice(0, 180) })),
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function icon(ok) { return ok ? '✅' : '❌' }

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

  console.log('='.repeat(74))
  console.log('Listing Detail LCP Network Trace (Task 78 — diagnose-lcp-preload-network)')
  console.log('='.repeat(74))
  console.log(`Base URL : ${BASE_URL}`)
  console.log(`Slug     : ${SLUG}`)
  console.log(`Locales  : ${LOCALES.join(', ')}`)
  console.log()
  console.log('Three bugs fixed vs Task 77:')
  console.log('  1. LCP captured via addInitScript (not post-load getEntriesByType)')
  console.log('  2. Timings normalised: epoch - performance.timeOrigin = nav-relative ms')
  console.log('  3. Headers captured via allHeaders() (handles multiple Link headers)')
  console.log()

  const allResults = []

  for (const viewport of VIEWPORTS) {
    console.log(`── ${viewport.name} (${viewport.width}×${viewport.height}, DPR=${viewport.dpr}) ──────────────────`)
    const browser = await chromium.launch({ headless: true })

    for (const locale of LOCALES) {
      process.stdout.write(`  ${locale} ... `)
      const result = await diagnoseLocale(browser, locale, viewport)
      allResults.push(result)

      if (result.error) { console.log(`ERROR: ${result.error}`); continue }

      const preloadOk = result.hasValidCloudinaryPreload ? '✅' : '❌'
      const startStr  = result.cloudinary640RequestStartMs != null ? `${result.cloudinary640RequestStartMs}ms` : '—'
      const durStr    = result.cloudinary640DurationMs != null ? `${result.cloudinary640DurationMs}ms` : '—'
      const lcpStr    = result.lcpMs != null ? `${result.lcpMs}ms <${result.lcpElementTag ?? '?'}>` : 'N/A'
      console.log(`LCP=${lcpStr} | 640w start=${startStr} dur=${durStr} | preload=${preloadOk} (${result.parserMethod ?? 'none'}) | ${result.diagnosis}`)
    }

    await browser.close()
    console.log()
  }

  // ── Summary table ─────────────────────────────────────────────────────────
  console.log('='.repeat(74))
  console.log('SUMMARY')
  console.log('='.repeat(74))
  console.log()
  console.log('Locale  Viewport        LCP       640w start  Preload  Diagnosis')
  console.log('------  --------------  --------  ----------  -------  ---------')
  for (const r of allResults) {
    if (r.error) { console.log(`${r.locale.padEnd(6)}  ${r.viewport.padEnd(14)}  ERROR: ${r.error}`); continue }
    const lcpStr   = r.lcpMs != null ? `${r.lcpMs}ms` : 'N/A'
    const startStr = r.cloudinary640RequestStartMs != null ? `${r.cloudinary640RequestStartMs}ms` : '—'
    const preOk    = r.hasValidCloudinaryPreload ? '✅' : '❌'
    console.log(`${r.locale.padEnd(6)}  ${r.viewport.padEnd(14)}  ${lcpStr.padEnd(8)}  ${startStr.padEnd(10)}  ${preOk}       ${r.diagnosis}`)
  }

  console.log()
  console.log('Diagnosis codes:')
  console.log('  PRELOAD_USED         — 640w starts at TTFB, preload working')
  console.log('  CLOUDINARY_COLD_VARIANT — 640w preloaded but CDN cold start (>3s)')
  console.log('  PRELOAD_NOT_USED     — header present but no early 640w request')
  console.log('  URL_MISMATCH         — preloaded URL ≠ gallery img request URL')
  console.log('  NO_PRELOAD_HREF      — Link header missing Cloudinary preload')
  console.log('  LCP_NOT_GALLERY_IMAGE — LCP element is not the Cloudinary gallery img')

  // ── Save artifacts ────────────────────────────────────────────────────────
  try {
    const summaryPath = path.join(ARTIFACTS, 'summary.json')
    await writeFile(summaryPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      slug:    SLUG,
      results: allResults,
    }, null, 2))
    console.log()
    console.log(`Trace saved: ${summaryPath}`)
  } catch (e) {
    console.error('Failed to save trace:', e.message)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
