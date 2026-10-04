// GR-7 for Task 859 Revision 1: support-ticket surfaces and dialog anatomy, operated live (Opus, 2026-10-04).
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const OUT = 'docs/sessions/evidence/task859/research';
const log = [];
const rec = (page, step, d) => { const r = { page, step, ...d }; log.push(r); console.log(JSON.stringify(r).slice(0, 700)); };
const b = await chromium.launch();
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });

async function dialogAnatomy(p) {
  return p.evaluate(() => {
    const d = [...document.querySelectorAll('[role="dialog"], .modal.show .modal-content, [class*="modal" i]')]
      .find(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 200 && r.height > 100 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; });
    if (!d) return null;
    const r = d.getBoundingClientRect(); const cs = getComputedStyle(d);
    const btns = [...d.querySelectorAll('button, a.btn')].filter(x => x.getBoundingClientRect().width > 0).map(x => {
      const bs = getComputedStyle(x); const br = x.getBoundingClientRect();
      return { text: x.textContent.trim().slice(0, 30), w: Math.round(br.width), h: Math.round(br.height), x: Math.round(br.left), y: Math.round(br.top), bg: bs.backgroundColor, border: bs.borderWidth + ' ' + bs.borderColor, radius: bs.borderRadius };
    });
    const title = d.querySelector('h1,h2,h3,h4,h5,.modal-title'); const tcs = title && getComputedStyle(title);
    return { w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, title: title && title.textContent.trim().slice(0, 60), titleSize: tcs && tcs.fontSize, titleWeight: tcs && tcs.fontWeight, buttons: btns.slice(0, 8), text: d.innerText.replace(/\s+/g, ' ').slice(0, 300) };
  });
}

// TailAdmin support tickets (list)
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://demo.tailadmin.com/support-tickets', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await shot(p, `ta-support-tickets-${w}`);
  const info = await p.evaluate(() => {
    const ths = [...document.querySelectorAll('th')].map(t => t.textContent.trim()).filter(Boolean);
    const badges = [...document.querySelectorAll('span, p')].filter(s => /^(open|pending|solved|closed|resolved|in progress)$/i.test(s.textContent.trim())).slice(0, 8).map(s => { const c = getComputedStyle(s); return { text: s.textContent.trim(), bg: c.backgroundColor, color: c.color, radius: c.borderRadius, fs: c.fontSize }; });
    const tabs = [...document.querySelectorAll('button')].map(x => x.textContent.trim().replace(/\s+/g, ' ')).filter(t => t && t.length < 30).slice(0, 20);
    const stat = [...document.querySelectorAll('h3, h4')].map(h => h.textContent.trim()).slice(0, 12);
    const inputs = [...document.querySelectorAll('input')].map(i => i.placeholder || i.type).slice(0, 6);
    return { ths, badges, tabs, stat, inputs, overflowX: document.documentElement.scrollWidth > innerWidth };
  });
  rec('tailadmin-support-tickets', `loaded-${w}`, info);
  if (w === 1440) {
    for (const label of ['Pending', 'Solved', 'All']) {
      const btn = p.locator('button', { hasText: new RegExp(`^\\s*${label}`, 'i') }).first();
      if (await btn.count()) { await btn.click().catch(() => null); await p.waitForTimeout(600); rec('tailadmin-support-tickets', `tab-${label}`, { rows: await p.locator('tbody tr').count(), url: p.url() }); }
      else rec('tailadmin-support-tickets', `tab-${label}`, { found: false });
    }
    await shot(p, 'ta-support-tickets-after-tabs');
    await p.locator('tbody tr').first().click().catch(() => null); await p.waitForTimeout(1200);
    rec('tailadmin-support-tickets', 'row-click', { url: p.url(), dialog: !!(await dialogAnatomy(p)) });
  }
  await ctx.close();
}

// TailAdmin ticket reply (detail)
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://demo.tailadmin.com/support-ticket-reply', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/ta-ticket-reply-${w}-full.png`, fullPage: true });
  rec('tailadmin-ticket-reply', `loaded-${w}`, await p.evaluate(() => ({
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5')].map(h => h.textContent.trim()).filter(Boolean).slice(0, 15),
    buttons: [...document.querySelectorAll('button')].map(x => x.textContent.trim().replace(/\s+/g, ' ')).filter(t => t && t.length < 40).slice(0, 20),
    selects: [...document.querySelectorAll('select')].map(s => [...s.options].map(o => o.textContent.trim()).join('/')),
    textareas: document.querySelectorAll('textarea').length,
    overflowX: document.documentElement.scrollWidth > innerWidth,
  })));
  await ctx.close();
}

// Modals pages
async function modalsPage(name, url, triggerSel, setup) {
  for (const w of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    if (setup) await setup(p);
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    const triggers = await p.locator(triggerSel).count();
    rec(name, `triggers-${w}`, { triggers, labels: (await p.locator(triggerSel).allInnerTexts()).slice(0, 12).map(s => s.trim().slice(0, 30)) });
    const n = Math.min(triggers, w === 1440 ? 5 : 2);
    for (let i = 0; i < n; i++) {
      const t = p.locator(triggerSel).nth(i);
      await t.scrollIntoViewIfNeeded().catch(() => null);
      await t.click({ timeout: 5000 }).catch(() => null); await p.waitForTimeout(900);
      rec(name, `open-${w}-${i}`, { anatomy: await dialogAnatomy(p) });
      await shot(p, `${name}-${w}-${i}`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(700);
      const still = await dialogAnatomy(p);
      rec(name, `escape-${w}-${i}`, { closedByEsc: !still });
      if (still) { await p.locator('.modal.show .btn-close, [role="dialog"] button[aria-label*="lose" i]').first().click({ timeout: 3000 }).catch(() => null); await p.waitForTimeout(500); }
    }
    await ctx.close();
  }
}
await modalsPage('ta-modals', 'https://demo.tailadmin.com/modals', 'button:has-text("Open Modal"), button:has-text("Modal")');
await modalsPage('lahomes-modals', 'https://techzaa.in/lahomes/admin/ui-modal.html', '[data-bs-toggle="modal"]');
await modalsPage('kamr-modals', 'https://kamr-vite.vercel.app/ui-modal', 'button.btn', async (p) => {
  await p.goto('https://kamr-vite.vercel.app/login', { waitUntil: 'networkidle' });
  await p.locator('button', { hasText: /sign me in/i }).click();
  await p.waitForURL(/dashboard/, { timeout: 20000 });
});
writeFileSync(`${OUT}/gr7-log.json`, JSON.stringify(log, null, 2));
await b.close();
