// Task 923 Revision 8 - GR-7 live check, moment: execution (Sonnet), copy of design-r8/gr7-r46-danger.mjs with only this line added; run before the first Revision 8 write.
// Task 923 R46 design (Opus, 2026-10-18) - GR-7: operates the two account-removal sections found by gr7-r46-926.mjs.
// TailAdmin /profile "Danger Zone" -> "Delete account" (what opens, what it asks); Omah account/settings "Deactivate Account"
// (is the button gated by its "Confirm Account Deactivation" checkbox). Nothing is submitted beyond the demo's own client UI.
// Usage (repository root): node docs/sessions/evidence/task923/design-r8/gr7-r46-danger.mjs docs/sessions/evidence/task923/design-r8/gr7
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const popup = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const pop = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal.show .modal-dialog, dialog[open], .fixed.inset-0')].filter(vis).pop();
  if (!pop) return null;
  const r = pop.getBoundingClientRect();
  return {
    box: { w: Math.round(r.width), h: Math.round(r.height) },
    headings: [...pop.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map(h => h.textContent.trim()),
    text: [...pop.querySelectorAll('p, label, li')].filter(vis).map(p => p.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 12),
    inputs: [...pop.querySelectorAll('input, textarea')].filter(vis).map(i => ({ type: i.type, placeholder: i.placeholder || null, label: i.closest('label')?.textContent.trim() || null })),
    buttons: [...pop.querySelectorAll('button')].filter(vis).map(b => ({ text: b.textContent.trim(), disabled: b.disabled })),
  };
};
const browser = await chromium.launch();
const out = [];
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  // TailAdmin
  const t = { ref: 'tailadmin', page: 'profile danger zone', width };
  try {
    await page.goto('https://demo.tailadmin.com/profile', { waitUntil: 'networkidle', timeout: 45000 });
    const zone = page.getByText('Danger Zone').first();
    await zone.scrollIntoViewIfNeeded();
    t.zoneText = (await zone.locator('xpath=ancestor::div[1]/..').innerText()).replace(/\s+/g, ' ').slice(0, 400);
    await page.getByRole('button', { name: /delete account/i }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1200);
    t.opened = await page.evaluate(popup);
    if (width === 1440) await page.screenshot({ path: join(OUT, 'tailadmin-delete-account-1440.png') });
    const field = page.locator('[role="dialog"] input, .fixed input').first();
    if (await field.count()) {
      const confirm = page.locator('[role="dialog"] button, .fixed button').filter({ hasText: /delete/i }).last();
      t.confirmDisabledBeforeTyping = await confirm.isDisabled().catch(() => null);
    }
  } catch (e) { t.error = String(e.message || e).slice(0, 300); }
  out.push(t);
  // Omah
  const o = { ref: 'omah', page: 'account/settings deactivate', width };
  try {
    await page.goto('https://omah.dexignzone.com/xhtml/account/settings.html', { waitUntil: 'networkidle', timeout: 45000 });
    const head = page.getByText('Deactivate Account').first();
    await head.scrollIntoViewIfNeeded();
    const card = head.locator('xpath=ancestor::div[contains(@class,"card")][1]');
    o.cardText = (await card.innerText()).replace(/\s+/g, ' ').slice(0, 500);
    const btn = card.locator('button, a.btn').last();
    o.button = (await btn.textContent())?.trim();
    o.buttonDisabledUnchecked = await btn.isDisabled().catch(() => null);
    const box = card.locator('input[type="checkbox"]').first();
    o.checkbox = await box.count() ? { label: (await card.locator('label').first().textContent())?.trim(), checked: await box.isChecked() } : null;
    if (width === 1440) await card.screenshot({ path: join(OUT, 'omah-deactivate-1440.png') });
  } catch (e) { o.error = String(e.message || e).slice(0, 300); }
  out.push(o);
  await ctx.close();
}
await browser.close();
writeFileSync(join(OUT, 'gr7-r46-danger.json'), JSON.stringify({ takenAt: new Date().toISOString(), out }, null, 2) + '\n');
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
