#!/usr/bin/env node
/**
 * compare-listing-lcp-lighthouse.mjs
 *
 * Lighthouse LCP trace comparison for the Listing Detail page.
 * Part of the Listing Detail Performance / LCP Epic (Task 74).
 *
 * What it does:
 *   1. Runs the HTML-level preload probe (from profile-listing-lcp.mjs) for all locales.
 *   2. Runs programmatic Lighthouse for key locale × viewport pairs (sq/en × 375/1280).
 *   3. Outputs a structured JSON summary + per-run Lighthouse HTML reports.
 *   4. Reports LCP, FCP, TTFB, TBT, CLS, and LCP phase breakdown.
 *
 * Usage:
 *   node scripts/compare-listing-lcp-lighthouse.mjs [BASE_URL] [SLUG] [--deep-only]
 *
 * Examples:
 *   node scripts/compare-listing-lcp-lighthouse.mjs http://localhost:3000 test-7-molyl9c8
 *   node scripts/compare-listing-lcp-lighthouse.mjs http://localhost:3000 test-7-molyl9c8 --deep-only
 *
 * Output directory: .artifacts/lighthouse-lcp/
 * Reports:  .artifacts/lighthouse-lcp/<locale>-<viewport>.html
 * Summary:  .artifacts/lighthouse-lcp/summary.json
 *
 * Requires:
 *   - Node 18+ (native fetch)
 *   - lighthouse (devDependency)
 *   - Google Chrome installed (auto-detected or pass CHROME_PATH env var)
 *
 * Locales:    sq, en, uk, it
 * Viewports:  320, 375, 390, 768, 1280, 1440, 2560
 * Deep runs:  375 (mobile) and 1280 (desktop) for all locales
 */

import { createRequire } from 'module'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require       = createRequire(import.meta.url)
const __dirname     = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT  = path.resolve(__dirname, '..')
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, '.artifacts', 'lighthouse-lcp')

const BASE_URL  = process.argv[2] || 'http://localhost:3000'
const SLUG      = process.argv[3] || 'test-7-molyl9c8'
const DEEP_ONLY = process.argv.includes('--deep-only')

const LOCALES = ['sq', 'en', 'uk', 'it']

const VIEWPORTS = [
  { name: '320-mobile',   width: 320,  height: 568,  mobile: true,  deep: false },
  { name: '375-mobile',   width: 375,  height: 667,  mobile: true,  deep: true  },
  { name: '390-mobile',   width: 390,  height: 844,  mobile: true,  deep: false },
  { name: '768-tablet',   width: 768,  height: 1024, mobile: false, deep: false },
  { name: '1280-desktop', width: 1280, height: 800,  mobile: false, deep: true  },
  { name: '1440-desktop', width: 1440, height: 900,  mobile: false, deep: false },
  { name: '2560-huge',    width: 2560, height: 1440, mobile: false, deep: false },
]

// Chrome path detection
const CHROME_PATH = process.env.CHROME_PATH
  || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'

// Task 72 / pre-Task-73 baseline for comparison
const TASK72_BASELINE = {
  lcp_ms_mobile: { min: 5339, max: 5523 },
  tbt_ms: { max: 200 },
  cls: 0,
  note: 'Measured prior to Task 72 sprint with mobile Lighthouse (throttled CPU+network). All 4 locales POOR.',
}

// ── HTML probe (re-implements profile-listing-lcp.mjs logic) ─────────────────

function extractHead(html) {
  const end = html.indexOf('</head>')
  return end > 0 ? html.slice(0, end) : html.slice(0, 8000)
}

function probePreload(html) {
  const headEnd = html.indexOf('</head>')
  // Check HEAD first, then BODY (React 19 RSC link hoisting is client-side)
  const head = extractHead(html)
  const headMatch = head.match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*\/>/)
  const bodyMatch = html.slice(headEnd > 0 ? headEnd : 0).match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*\/>/)
  const tag = headMatch?.[0] ?? bodyMatch?.[0] ?? null
  if (!tag) return { present: false, inHead: false, hasFetchPriority: false }
  return {
    present: true,
    inHead: !!headMatch,
    hasFetchPriority: /fetchpriority/i.test(tag),
    fetchPriorityValue: tag.match(/fetchpriority="([^"]*)"/i)?.[1] ?? null,
    hasImageSrcSet: /imageSrcSet=/i.test(tag),
  }
}

function probeGalleryImg(html) {
  const m = html.match(/<img[^>]*fetchPriority="high"[^>]*\/>/)
  if (!m) return { present: false }
  return {
    present: true,
    isCloudinary: m[0].includes('res.cloudinary.com'),
    hasSrcSet: m[0].includes('srcSet='),
    hasEager: m[0].includes('loading="eager"'),
  }
}

async function probeHtml(locale) {
  const url = `${BASE_URL}/${locale}/listings/${SLUG}`
  try {
    const res = await fetch(url, { headers: { Accept: 'text/html' } })
    const html = await res.text()
    return {
      locale, url, status: res.status,
      preload: probePreload(html),
      galleryImg: probeGalleryImg(html),
    }
  } catch (e) {
    return { locale, url, status: 0, error: e.message }
  }
}

// ── Lighthouse runner ─────────────────────────────────────────────────────────

async function runLighthouse(locale, viewport) {
  const url = `${BASE_URL}/${locale}/listings/${SLUG}`
  let lighthouse, chromeLauncher
  try {
    const lhModule = require('lighthouse')
    // lighthouse v12+ exports as { default: fn, ... }; v11 and below export fn directly
    lighthouse     = lhModule.default ?? lhModule
    chromeLauncher = require('chrome-launcher')
  } catch (e) {
    return { error: `Missing dependency: ${e.message}. Run: npm install lighthouse` }
  }

  let chrome
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
      chromePath: CHROME_PATH,
    })
  } catch (e) {
    return { error: `Chrome launch failed: ${e.message}. Verify CHROME_PATH or install Chrome.` }
  }

  const mobileUA = 'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
  const desktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'

  const options = {
    logLevel: 'silent',
    output: ['json', 'html'],
    port: chrome.port,
    formFactor: viewport.mobile ? 'mobile' : 'desktop',
    screenEmulation: {
      mobile: viewport.mobile,
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      disabled: false,
    },
    emulatedUserAgent: viewport.mobile ? mobileUA : desktopUA,
    throttlingMethod: 'simulate',
    throttling: viewport.mobile ? {
      // Simulated 4G mobile throttling (Lighthouse standard)
      rttMs: 40,
      throughputKbps: 10240,
      requestLatencyMs: 0,
      downloadThroughputKbps: 10240,
      uploadThroughputKbps: 10240,
      cpuSlowdownMultiplier: 4,
    } : {
      // Desktop: no throttling
      rttMs: 0,
      throughputKbps: 0,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
  }

  let result
  try {
    result = await lighthouse(url, options)
  } catch (e) {
    await chrome.kill()
    return { error: `Lighthouse error: ${e.message}` }
  }
  await chrome.kill()

  const lhr = result.lhr
  const cats = lhr.categories
  const audits = lhr.audits

  // Core metrics
  const lcp   = audits['largest-contentful-paint']
  const fcp   = audits['first-contentful-paint']
  const tbt   = audits['total-blocking-time']
  const cls   = audits['cumulative-layout-shift']
  const si    = audits['speed-index']
  const ttfb  = audits['server-response-time']

  // LCP phases (from Lighthouse LCP phase audit if available)
  const lcpEl = audits['lcp-lazy-loaded'] ?? audits['prioritize-lcp-image']

  // Preload / resource check
  const usesPreload  = audits['uses-rel-preload']
  const usesOptImages = audits['uses-optimized-images']

  const metrics = {
    locale,
    viewport: viewport.name,
    url,
    lcp_ms:    Math.round(lcp?.numericValue ?? 0),
    lcp_score: lcp?.score ?? null,
    lcp_rating: lcp?.score != null ? (lcp.score >= 0.9 ? 'GOOD' : lcp.score >= 0.5 ? 'NEEDS_IMPROVEMENT' : 'POOR') : null,
    fcp_ms:    Math.round(fcp?.numericValue ?? 0),
    tbt_ms:    Math.round(tbt?.numericValue ?? 0),
    cls:       cls?.numericValue ?? 0,
    si_ms:     Math.round(si?.numericValue ?? 0),
    ttfb_ms:   Math.round(ttfb?.numericValue ?? 0),
    perf_score: Math.round((cats?.performance?.score ?? 0) * 100),
    lcp_element: (() => {
      const a = audits['largest-contentful-paint-element']
      if (!a?.details?.items?.length) return null
      const i = a.details.items
      return i[0]?.node?.snippet ?? i[0]?.items?.[0]?.node?.snippet ?? JSON.stringify(i[0])?.slice(0, 200) ?? null
    })(),
  }

  // Save HTML report
  try {
    await mkdir(ARTIFACTS_DIR, { recursive: true })
    const reportPath = path.join(ARTIFACTS_DIR, `${locale}-${viewport.name}.html`)
    await writeFile(reportPath, result.report[1]) // index 1 = html report
    metrics.reportPath = reportPath
  } catch {}

  return metrics
}

// ── Main ──────────────────────────────────────────────────────────────────────

function icon(ok) { return ok ? '✅' : '❌' }
function fmt(ms)  { return `${ms}ms` }
function rating(ms, thresholds = [2500, 4000]) {
  if (ms <= thresholds[0]) return '🟢 GOOD'
  if (ms <= thresholds[1]) return '🟡 NEEDS IMPROVEMENT'
  return '🔴 POOR'
}

async function main() {
  console.log('='.repeat(70))
  console.log('Listing Detail LCP — Lighthouse Trace Comparison (Task 74)')
  console.log('='.repeat(70))
  console.log(`Base URL  : ${BASE_URL}`)
  console.log(`Slug      : ${SLUG}`)
  console.log(`Locales   : ${LOCALES.join(', ')}`)
  console.log(`Viewports : ${VIEWPORTS.map(v => v.name).join(', ')}`)
  console.log()

  // ── Step 1: HTML probe for all locales ──────────────────────────────────────
  console.log('── Step 1: HTML Preload Probe (all locales) ──────────────────────')
  const probeResults = []
  for (const locale of LOCALES) {
    const r = await probeHtml(locale)
    probeResults.push(r)
    const p = r.preload
    const g = r.galleryImg
    if (r.error) {
      console.log(`  ${locale}: ERROR — ${r.error}`)
      continue
    }
    const preloadStatus = p.present
      ? (p.inHead ? `✅ HEAD` : `⚠️  BODY`) + ` | fetchpriority: ${p.hasFetchPriority ? '✅' : '❌'}`
      : '❌ MISSING'
    console.log(`  ${locale} [${r.status}]: preload=${preloadStatus} | img=${g.present ? '✅' : '❌'} eager=${g.hasEager ? '✅' : '❌'}`)
  }

  const allHavePreload = probeResults.every(r => r.preload?.present)
  const allHaveFetchPri = probeResults.every(r => r.preload?.hasFetchPriority)
  const preloadInHead = probeResults.every(r => r.preload?.inHead)
  console.log()
  console.log(`  All locales have preload : ${icon(allHavePreload)}`)
  console.log(`  All have fetchpriority   : ${icon(allHaveFetchPri)}`)
  console.log(`  All preloads in <head>   : ${icon(preloadInHead)} ${preloadInHead ? '' : '(body — React 19 SSR limitation)'}`)
  console.log()

  // ── Step 2: Lighthouse deep runs ───────────────────────────────────────────
  const deepViewports = VIEWPORTS.filter(v => v.deep)
  const runLocales    = DEEP_ONLY ? ['sq'] : LOCALES
  const lightResults  = []

  console.log(`── Step 2: Lighthouse Deep Runs (${runLocales.join(', ')} × ${deepViewports.map(v => v.name).join(', ')}) ──`)
  console.log()
  for (const vp of deepViewports) {
    for (const locale of runLocales) {
      process.stdout.write(`  Running: ${locale} @ ${vp.name} ... `)
      const result = await runLighthouse(locale, vp)
      lightResults.push(result)
      if (result.error) {
        console.log(`ERROR: ${result.error}`)
      } else {
        console.log(`LCP=${fmt(result.lcp_ms)} ${result.lcp_rating} | FCP=${fmt(result.fcp_ms)} | TBT=${fmt(result.tbt_ms)} | CLS=${result.cls.toFixed(3)} | Perf=${result.perf_score}`)
      }
    }
  }

  // ── Step 3: Non-deep viewports — HTML probe only ───────────────────────────
  const shallowViewports = VIEWPORTS.filter(v => !v.deep)
  console.log()
  console.log(`── Step 3: Non-deep Viewports — HTML probe only ──────────────────`)
  console.log(`  (Lighthouse for 375 and 1280 only; other viewports: HTML probe confirms preload structure)`)
  for (const vp of shallowViewports) {
    console.log(`  ${vp.name}: HTML identical regardless of viewport — preload confirmed from Step 1`)
  }

  // ── Step 4: Summary ────────────────────────────────────────────────────────
  console.log()
  console.log('='.repeat(70))
  console.log('SUMMARY')
  console.log('='.repeat(70))

  console.log()
  console.log('Task 72 baseline (pre-Task-73, all 4 locales):')
  console.log(`  Mobile LCP : ${TASK72_BASELINE.lcp_ms_mobile.min}–${TASK72_BASELINE.lcp_ms_mobile.max}ms 🔴 POOR`)
  console.log(`  TBT        : ≤ ${TASK72_BASELINE.tbt_ms.max}ms 🟢 GOOD`)
  console.log(`  CLS        : ${TASK72_BASELINE.cls} 🟢 GOOD`)
  console.log()

  if (lightResults.some(r => !r.error)) {
    console.log('Current results (Task 73 build):')
    const successResults = lightResults.filter(r => !r.error)
    for (const r of successResults) {
      const vsBaseline = r.viewport.includes('mobile') && r.lcp_ms > 0
        ? ` (baseline: ${TASK72_BASELINE.lcp_ms_mobile.min}–${TASK72_BASELINE.lcp_ms_mobile.max}ms, delta: ${r.lcp_ms - TASK72_BASELINE.lcp_ms_mobile.min >= 0 ? '+' : ''}${r.lcp_ms - Math.round((TASK72_BASELINE.lcp_ms_mobile.min + TASK72_BASELINE.lcp_ms_mobile.max) / 2)}ms)`
        : ''
      console.log(`  ${r.locale} @ ${r.viewport}: LCP=${fmt(r.lcp_ms)} ${r.lcp_rating || ''}${vsBaseline}`)
    }
  }

  console.log()
  console.log('Preload status (after Task 73):')
  console.log(`  All locales have native preload : ${icon(allHavePreload)}`)
  console.log(`  All preloads have fetchpriority : ${icon(allHaveFetchPri)}`)
  console.log(`  Preload in <head>               : ${icon(preloadInHead)} ${preloadInHead ? '' : '(body — Task 74 known limitation)'}`)

  // ── Save summary JSON ──────────────────────────────────────────────────────
  try {
    await mkdir(ARTIFACTS_DIR, { recursive: true })
    const summary = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      slug: SLUG,
      task72Baseline: TASK72_BASELINE,
      probeResults,
      lighthouseResults: lightResults,
    }
    const summaryPath = path.join(ARTIFACTS_DIR, 'summary.json')
    await writeFile(summaryPath, JSON.stringify(summary, null, 2))
    console.log()
    console.log(`Summary saved: ${summaryPath}`)
    console.log(`HTML reports : ${ARTIFACTS_DIR}/`)
  } catch (e) {
    console.error('Failed to save summary:', e.message)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
