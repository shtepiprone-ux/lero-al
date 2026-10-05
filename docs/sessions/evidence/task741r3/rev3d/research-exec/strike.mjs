import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage()
for (const u of ['property-grid', 'property-list']) { await p.goto(`https://techzaa.in/lahomes/admin/${u}.html`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
  console.log(u, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && getComputedStyle(e).textDecorationLine.includes('line-through') && e.textContent.trim()).slice(0, 4).map(e => e.textContent.trim().slice(0, 20))))) }
await b.close()
