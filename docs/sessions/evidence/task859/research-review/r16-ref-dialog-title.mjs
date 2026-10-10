// Task 859 review 16 (Opus) - GR-7 live check: does a standing reference cut a dialog's title or description?
// Opens each modal trigger on the reference's modal page at 390 and 1440 and reads, for every visible heading and
// paragraph inside the opened dialog: line clamp, text-overflow ellipsis with hidden overflow, white-space.
// usage: node r16-ref-dialog-title.mjs <outDir> > r16-ref-dialog-title.json
import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const pages = [
  ['tailadmin', 'https://demo.tailadmin.com/modals'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/ui-modals.html'],
  ['omah', 'https://omah.dexignzone.com/xhtml/ui-modal.html'],
  ['kamr', 'https://kamr-vite.vercel.app/ui-modals'],
]
const b = await chromium.launch(); const ctx = await b.newContext(); const out = []
for (const [ref, url] of pages) for (const w of [390, 1440]) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 900 })
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(3500)
    if ((await p.locator('input[type="password"]').count()) > 0) {
      await p.locator('input[type="email"],input[name="email"],input[type="text"]').first().fill('demo@example.com').catch(() => {})
      await p.locator('input[type="password"]').first().fill('123456').catch(() => {})
      await p.locator('button[type="submit"],button:has-text("Sign")').first().click().catch(() => {})
      await p.waitForTimeout(3500); await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}); await p.waitForTimeout(3500)
    }
    const triggers = p.locator('button:visible, a[data-bs-toggle="modal"]:visible')
    const n = Math.min(await triggers.count(), 12); const dialogs = []
    for (let i = 0; i < n; i++) {
      await triggers.nth(i).click({ timeout: 2500 }).catch(() => null); await p.waitForTimeout(900)
      const d = await p.evaluate(() => {
        const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 }
        const dlg = [...document.querySelectorAll('[role="dialog"], .modal.show .modal-content, [aria-modal="true"]')].filter(vis)[0]
        if (!dlg) return null
        const texts = [...dlg.querySelectorAll('h1,h2,h3,h4,h5,h6,p')].filter(vis).slice(0, 6).map(e => {
          const s = getComputedStyle(e)
          return { tag: e.tagName.toLowerCase(), text: e.textContent.trim().slice(0, 50), clamp: s.webkitLineClamp, textOverflow: s.textOverflow, overflow: s.overflowX + '/' + s.overflowY, whiteSpace: s.whiteSpace, lines: Math.round(e.getBoundingClientRect().height / (parseFloat(s.lineHeight) || 1)) }
        })
        return { texts }
      })
      if (d) { dialogs.push(d); await p.keyboard.press('Escape'); await p.waitForTimeout(600) }
    }
    out.push({ ref, url, w, final: p.url(), triggers: n, dialogsOpened: dialogs.length, cut: dialogs.flatMap(d => d.texts).filter(t => (t.clamp && t.clamp !== 'none') || (t.textOverflow === 'ellipsis' && /hidden/.test(t.overflow))).length, sample: dialogs.slice(0, 3) })
    await p.screenshot({ path: `${process.argv[2]}/gr7-r16-${ref}-modals-${w}.png` })
  } catch (e) { out.push({ ref, url, w, error: String(e).slice(0, 140) }) }
  await p.close()
}
await b.close(); console.log(JSON.stringify(out, null, 1))
