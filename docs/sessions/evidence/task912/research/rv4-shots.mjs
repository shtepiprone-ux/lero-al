// GR-7 screenshots for 912 Revision 4: the reference pages that show a listing/product price.
import { chromium } from 'playwright'
const dir = 'docs/sessions/evidence/task912/research'
const pages = [
  ['https://techzaa.in/lahomes/admin/property-grid.html', 'lahomes-property-grid'],
  ['https://techzaa.in/lahomes/admin/property-details.html', 'lahomes-property-details'],
  ['https://demo.tailadmin.com/products-list.html', 'tailadmin-products-list'],
  ['https://demo.tailadmin.com/pricing-tables.html', 'tailadmin-pricing-tables'],
  ['https://kamr-vite.vercel.app/dashboard', 'kamr-dashboard'],
]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
for (const [u, n] of pages) {
  await p.goto(u, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
  await p.waitForTimeout(1500)
  await p.screenshot({ path: `${dir}/${n}.png` })
  console.log(n, 'ok')
}
await b.close()
