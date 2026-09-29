// Evidence-only measurement script (Task 874 §17.3) — not a repo artifact.
import { chromium } from 'playwright'
import fs from 'node:fs'
const base = 'http://127.0.0.1:6874'
const stories = {
  'patterns-mantine-adminexchangeprovidersview--default': 'AdminExchangeProvidersView/Default',
  'patterns-mantine-adminexchangeprovidersview--empty': 'AdminExchangeProvidersView/Empty',
  'patterns-mantine-adminexchangeprovidersview--pending': 'AdminExchangeProvidersView/Pending',
  'patterns-mantine-adminexchangeprovidersview--delete-confirm': 'AdminExchangeProvidersView/DeleteConfirm',
  'patterns-mantine-providerformdialogview--new': 'ProviderFormDialogView/New',
  'patterns-mantine-providerformdialogview--edit': 'ProviderFormDialogView/Edit',
  'patterns-mantine-providerformdialogview--api-key-revealed': 'ProviderFormDialogView/ApiKeyRevealed',
  'patterns-mantine-providerformdialogview--submitting': 'ProviderFormDialogView/Submitting',
}
const widths = [320, 390, 768, 1024, 1440]
const out = {}
const browser = await chromium.launch()
for (const [id, label] of Object.entries(stories)) {
  out[label] = {}
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } })
    await page.goto(`${base}/iframe.html?id=${id}&globals=locale:en&viewMode=story`)
    await page.waitForSelector('[data-testid="admin-exchange-providers-manager"], [role="dialog"]', { timeout: 20000 })
    await page.waitForTimeout(1200)
    out[label][w] = await page.evaluate(() => {
      const fs = el => parseFloat(getComputedStyle(el).fontSize)
      const rect = el => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width) } }
      const vw = window.innerWidth, vh = window.innerHeight
      const root = document.querySelector('[data-testid="admin-exchange-providers-manager"]') || document.querySelector('#storybook-root')
      const dialog = document.querySelector('[role="dialog"]')
      const res = { vw, vh, docScrollW: document.documentElement.scrollWidth, overflowX: document.documentElement.scrollWidth > vw, root: rect(root) }
      if (dialog) {
        res.dialog = rect(dialog)
        const title = dialog.querySelector('h1,h2,h3,h4,h5,h6,[id*="title"],[class*="title"]')
        res.dialogTitle = title ? { text: title.textContent.trim(), fontSize: fs(title) } : null
        const body = dialog.querySelector('label, p, [class*="Text"]')
        res.dialogBody = body ? { text: body.textContent.trim().slice(0, 30), fontSize: fs(body) } : null
        res.dialogIsSheet = Math.abs(res.dialog.width - vw) <= 1 && res.dialog.left === 0 && Math.abs(res.dialog.bottom - vh) <= 1
        res.dialogInnerOverflow = dialog.scrollWidth > dialog.clientWidth + 1
      }
      const texts = [...document.querySelectorAll('#storybook-root *, [role="dialog"] *')].filter(e => e.children.length === 0 && e.textContent.trim())
      res.maxTextFontSize = Math.max(0, ...texts.map(fs))
      res.hasHeading = !!document.querySelector('h1,h2,h3,h4')
      return res
    })
    await page.close()
  }
}
await browser.close()
fs.writeFileSync(new URL('./gr3-measurements.json', import.meta.url), JSON.stringify(out, null, 2))
console.log('done')
