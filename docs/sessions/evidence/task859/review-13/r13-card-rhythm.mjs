import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const ids = ['patterns-mantine-adminsupportview--default','patterns-mantine-adminlistingsview--default','patterns-mantine-adminuserstable--default','patterns-mantine-adminreportsview--default','mantine-primitives-table--cards-below-md']
const b = await chromium.launch()
for (const id of ids) for (const w of [320, 390, 767]) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 } })
  await p.goto(`http://localhost:6111/iframe.html?id=${id}&viewMode=story&globals=locale:uk`, { waitUntil: 'load' })
  await p.waitForTimeout(1500)
  const r = await p.evaluate(() => {
    const card = document.querySelector('.mantine-Card-root'); if (!card) return null
    const stack = card.querySelector(':scope > .mantine-Stack-root'); if (!stack) return null
    const kids = [...stack.children].filter(k => k.getBoundingClientRect().height > 0)
    const gaps = []
    for (let i = 1; i < kids.length; i++) gaps.push(Math.round(kids[i].getBoundingClientRect().top - kids[i-1].getBoundingClientRect().bottom))
    const primary = kids.find(k => !k.classList.contains('mantine-Divider-root') && k.querySelector('.mantine-Badge-root'))
    let titleToBadge = null
    if (primary) { const bd = primary.querySelector('.mantine-Badge-root').getBoundingClientRect(); const t = [...primary.querySelectorAll('p,span,div')].filter(e=>e.children.length===0&&e.textContent.trim()&&!e.closest('.mantine-Badge-root')&&e.getBoundingClientRect().bottom<=bd.top+1).map(e=>e.getBoundingClientRect().bottom); if (t.length) titleToBadge = Math.round(bd.top - Math.max(...t)) }
    return { stackGap: getComputedStyle(stack).rowGap, sectionGaps: gaps, kinds: kids.map(k => k.classList.contains('mantine-Divider-root') ? 'divider' : 'block'), titleToBadge }
  })
  console.log(id.replace('patterns-mantine-','').replace('mantine-primitives-',''), w, JSON.stringify(r))
  await p.close()
}
await b.close()
