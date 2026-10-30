// GR-12 element parity probe of Revision 16 (R80): the same-meaning masked password field and the same-meaning confirmation field of a dialog, measured on the BUILT Storybook
// at the same locale and widths. Prints one JSON row per Story x width: the field's computed look and its label's, and the gap between them and the block above.
//   node docs/sessions/evidence/task923/r17-14-parity-probe.mjs
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { newMeasuringPage, loadStory, startStaticServer, storybookContext, waitStable } from '../../../../scripts/rendered-state-census/runner.mjs';

const STORIES = [
  { id: 'mantine-primitives-modal--delete-confirm-password', open: true, field: '.mantine-PasswordInput-root', note: 'R80 dialog password field' },
  { id: 'mantine-primitives-modal--delete-confirm-typed', open: true, field: '.mantine-TextInput-root', note: 'R46 dialog typed-word field (same dialog, same section)' },
  { id: 'patterns-mantine-cabinetpasswordsectionview--empty', open: false, field: '.mantine-PasswordInput-root', note: 'cabinet password section current-password field (same meaning: a password field)' },
  { id: 'patterns-mantine-resetpasswordview--form-empty', open: false, field: '.mantine-PasswordInput-root', note: 'reset password field' },
];
const WIDTHS = [390, 1440];
const server = await startStaticServer(resolve('storybook-static'), 6063);
const browser = await chromium.launch();
const measure = () => {
  const root = document.querySelector('[role=dialog]') ?? document.querySelector('#storybook-root');
  const wrap = root.querySelector(window.__FIELD__);
  if (!wrap) return { error: 'field not found' };
  const input = wrap.querySelector('.mantine-Input-input');
  const label = wrap.querySelector('label');
  const cs = (el, keys) => { const s = getComputedStyle(el); return Object.fromEntries(keys.map((k) => [k, s[k]])); };
  const rect = (el) => el.getBoundingClientRect();
  const inputBox = input.closest('.mantine-Input-wrapper') ?? input;
  return {
    input: cs(input, ['height', 'fontSize', 'fontFamily', 'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopLeftRadius', 'paddingLeft', 'paddingRight']),
    label: label ? cs(label, ['fontSize', 'fontWeight', 'color', 'lineHeight']) : null,
    labelToInput: label ? Math.round((rect(input).top - rect(label).bottom) * 10) / 10 : null,
    fieldWidth: Math.round(rect(wrap).width),
    type: input.type,
    focused: wrap.contains(document.activeElement),
  };
};
try {
  const ctx = storybookContext('http://127.0.0.1:6063');
  for (const width of WIDTHS) {
    for (const story of STORIES) {
      const page = await newMeasuringPage(browser);
      const loaded = await loadStory(page, ctx, { story: story.id, state: 'closed', locale: 'en', width });
      if (!loaded.ok) { console.log(JSON.stringify({ story: story.id, width, error: loaded.reason })); await page.close(); continue; }
      if (story.open) {
        await page.locator('#storybook-root button').filter({ visible: true }).first().click();
        await waitStable(page, 1, 4000);
      }
      await page.evaluate((f) => { window.__FIELD__ = f; }, story.field);
      const row = await page.evaluate(measure);
      console.log(JSON.stringify({ story: story.id, width, note: story.note, ...row }));
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
