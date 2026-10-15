// Review 5 (diagnosis only): which animations keep running on ListingContactPattern default at 1440 / it, before the
// click and 800ms after the registered "write on WhatsApp" click: their element, name and iteration count.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, openAction } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const state = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.find((s) => s.id === 'patterns-mantine-listingcontactpattern--default~write-on-whatsapp');
const server = await startStaticServer('storybook-static', 6054);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6054');
const list = () => document.getAnimations().filter((a) => a.playState === 'running').map((a) => { const t = a.effect?.getTiming?.() ?? {}; const el = a.effect?.target; return `${a.constructor.name}:${a.animationName ?? a.transitionProperty ?? ''} iterations=${t.iterations} on ${el ? el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] : '?'}`; });
const page = await newMeasuringPage(browser);
await loadStory(page, ctx, { story: state.story, locale: 'it', width: 1440 });
await page.waitForTimeout(800);
console.log('before click:', JSON.stringify(await page.evaluate(list)));
await openAction(page, state);
await page.waitForTimeout(800);
console.log('800ms after click:', JSON.stringify(await page.evaluate(list)));
await browser.close();
await new Promise((r) => server.close(r));
