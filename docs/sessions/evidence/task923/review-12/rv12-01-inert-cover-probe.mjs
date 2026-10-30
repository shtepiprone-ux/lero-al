// Task 923 review 12 (Opus, read-only): runs the census's own runStateJob on the executor's two R52 inert fixtures and on three planted
// variants of `html-text-over-inert-dialog` (copied under ./fixtures). planted-opaque-below = the failing twin plus one opaque card in the
// app root BELOW the portal; planted-inert-self-overlap = two lines overlapping inside the inert dialog, the upper dialog moved off them,
// the same opaque card below; -nocard = the same without the card (control). Prints each root's verdict and text-overlap detail.
//   node docs/sessions/evidence/task923/review-12/rv12-01-inert-cover-probe.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { startStaticServer, newMeasuringPage, fixtureContext, runStateJob } from '../../../../../scripts/rendered-state-census/runner.mjs'
const dir = 'docs/sessions/evidence/task923/review-12/fixtures'
const names = ['html-text-under-inert-dialog', 'html-text-over-inert-dialog', 'planted-opaque-below', 'planted-inert-self-overlap', 'planted-inert-self-overlap-nocard']
const port = 6125
const server = await startStaticServer(dir, port)
const browser = await chromium.launch()
const ctx = fixtureContext(`http://127.0.0.1:${port}`)
for (const name of names) {
  const state = JSON.parse(readFileSync(`${dir}/${name}.html`, 'utf8').match(/id="census-state">(.*?)<\/script>/s)[1])
  const page = await newMeasuringPage(browser)
  const rows = await runStateJob(page, ctx, state, 'en', 390)
  for (const r of rows) console.log(`${name} root=${r.root} pass=${r.pass} text-overlap=${JSON.stringify(r.rules["text-overlap"])}`)
  await page.close()
}
await browser.close()
server.close()
