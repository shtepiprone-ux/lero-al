// Task 923 Revision 8 - GR-7 live check, moment: execution (Sonnet), copy of design-r8/gr7-r46-926.mjs with only this line added; run before the first Revision 8 write.
// Task 923 R46 and Task 926 design (Opus, 2026-10-18) - GR-7 live check of the reference pages these decisions rely on:
// a destructive confirmation (typed or not), an account-deletion / danger-zone section, the agent sign-up and agent-add forms
// (is a company/agency chosen or created there), and the profile/settings pages where a company could be managed.
// Usage (repository root): node docs/sessions/evidence/task923/design-r8/gr7-r46-926.mjs docs/sessions/evidence/task923/design-r8/gr7
// Read-only on every reference: no form is submitted except Kamr's demo sign-in (the documented demo credentials).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const L = 'https://techzaa.in/lahomes/admin/';
const O = 'https://omah.dexignzone.com/xhtml/';
const T = 'https://demo.tailadmin.com/';
const K = 'https://kamr-vite.vercel.app/';
const TARGETS = [
  { ref: 'lahomes', name: 'sweetalert', url: `${L}extended-sweetalert.html`, alerts: true },
  { ref: 'lahomes', name: 'agents-add', url: `${L}agents-add.html` },
  { ref: 'lahomes', name: 'auth-signup', url: `${L}auth-signup.html` },
  { ref: 'lahomes', name: 'agents-details', url: `${L}agents-details.html` },
  { ref: 'omah', name: 'add-agent', url: `${O}add-agent.html` },
  { ref: 'omah', name: 'add-agent-wizard', url: `${O}add-agent-wizard.html` },
  { ref: 'omah', name: 'account-settings', url: `${O}account/settings.html` },
  { ref: 'omah', name: 'account-security', url: `${O}account/security.html` },
  { ref: 'omah', name: 'register', url: `${O}pages/register.html` },
  { ref: 'tailadmin', name: 'signup', url: `${T}signup` },
  { ref: 'tailadmin', name: 'profile', url: `${T}profile` },
  { ref: 'tailadmin', name: 'modals', url: `${T}modals`, opens: /open modal/i },
  { ref: 'kamr', name: 'sweetalert', url: `${K}uc-sweetalert`, kamr: true, alerts: true },
  { ref: 'kamr', name: 'ui-modal', url: `${K}ui-modal`, kamr: true, opens: /modal|launch|open/i },
];
const KEY = /delete|deactivat|remove|close (my )?account|danger|company|agency|agencies|brokerage|organi[sz]ation|firm/i;

const inspectPage = KEYRE => {
  const re = new RegExp(KEYRE, 'i');
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const labelOf = el => {
    const byFor = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    return (byFor || el.closest('label') || el.closest('div')?.querySelector('label'))?.textContent.trim().replace(/\s+/g, ' ') || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.name || null;
  };
  const fields = [...document.querySelectorAll('input, select, textarea')].filter(visible)
    .filter(el => !['hidden', 'search'].includes(el.type))
    .map(el => ({ tag: el.tagName.toLowerCase(), type: el.type || null, label: labelOf(el), options: el.tagName === 'SELECT' ? [...el.options].map(o => o.textContent.trim()).slice(0, 12) : undefined }))
    .slice(0, 60);
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(h => h.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 40);
  const buttons = [...document.querySelectorAll('button, a.btn, [role="button"]')].filter(visible).map(b => b.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 60);
  const keyed = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,label,button,a,span,li')].filter(visible)
    .map(e => e.textContent.trim().replace(/\s+/g, ' ')).filter(t => t.length < 220 && re.test(t));
  return { title: document.title, headings, fields, buttons, keyed: [...new Set(keyed)].slice(0, 40) };
};
const inspectPopup = () => {
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const pop = [...document.querySelectorAll('.swal2-popup, .swal-modal, .sweet-alert, [role="dialog"], [role="alertdialog"], [aria-modal="true"], .modal.show .modal-dialog, dialog[open]')].find(visible);
  if (!pop) return null;
  const r = pop.getBoundingClientRect();
  return {
    box: { w: Math.round(r.width), h: Math.round(r.height) },
    title: pop.querySelector('.swal2-title, .swal-title, h1,h2,h3,h4,h5,.modal-title')?.textContent.trim() || null,
    text: (pop.querySelector('.swal2-html-container, .swal-text, .modal-body, p')?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 300),
    inputs: [...pop.querySelectorAll('input, textarea, select')].filter(visible).map(i => ({ type: i.type, placeholder: i.placeholder || null })),
    buttons: [...pop.querySelectorAll('button, a.btn')].filter(visible).map(b => b.textContent.trim()).filter(Boolean),
  };
};

const browser = await chromium.launch();
const results = [];
let kamrState = null;
for (const target of TARGETS) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, storageState: target.kamr ? kamrState ?? undefined : undefined });
    const page = await ctx.newPage();
    const row = { ref: target.ref, name: target.name, url: target.url, width };
    try {
      if (target.kamr && !kamrState) {
        await page.goto(`${K}login`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
        kamrState = await ctx.storageState();
        row.kamrLogin = page.url();
      }
      const res = await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });
      row.status = res ? res.status() : null;
      row.finalUrl = page.url();
      await page.waitForTimeout(1500);
      row.page = await page.evaluate(inspectPage, KEY.source);
      await page.screenshot({ path: join(OUT, `${target.ref}-${target.name}-${width}.png`), fullPage: true });
      const trigger = target.alerts ? /delete|warning|confirm|danger|cancel|input|remove|question|ajax|prompt/i : target.opens;
      if (trigger) {
        const handles = await page.$$('button, a.btn');
        const texts = [];
        for (const h of handles) { const t = (await h.textContent())?.trim().replace(/\s+/g, ' '); if (t && trigger.test(t) && (await h.isVisible())) texts.push(t); }
        row.popups = [];
        for (const t of [...new Set(texts)].slice(0, 10)) {
          await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });
          await page.waitForTimeout(800);
          const btn = page.locator('button, a.btn', { hasText: t }).first();
          try { await btn.click({ timeout: 5000 }); } catch { row.popups.push({ trigger: t, error: 'not clickable' }); continue; }
          await page.waitForTimeout(1200);
          const pop = await page.evaluate(inspectPopup);
          row.popups.push({ trigger: t, popup: pop });
          if (pop && width === 1440) await page.screenshot({ path: join(OUT, `${target.ref}-${target.name}-popup-${row.popups.length}-${width}.png`) });
        }
      }
    } catch (e) { row.error = String(e.message || e).slice(0, 300); }
    results.push(row);
    await ctx.close();
  }
}
await browser.close();
writeFileSync(join(OUT, 'gr7-r46-926.json'), JSON.stringify({ takenAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(results.map(r => `${r.ref} ${r.name} ${r.width}: ${r.error ? 'ERROR ' + r.error : `status ${r.status}, fields ${r.page?.fields.length}, keyed ${r.page?.keyed.length}, popups ${r.popups?.length ?? '-'}`}`).join('\n'));
