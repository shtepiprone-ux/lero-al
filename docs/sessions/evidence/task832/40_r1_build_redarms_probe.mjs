// Task 832 review 1, §16.7 checkpoint "R1-a red" — proves arms (d)/(e) fail on the working tree
// as it stood at hash a58ce81647b1bc5062cc7bb09bf90662c60a7a48 (before R8), by extracting that
// exact blob's hitTestPage() (git cat-file, read-only) and running it against the NEW arm (d)/(e)
// fixtures. Same method as Opus's own review-1 probe (docs/sessions/evidence/task832/review1/
// r1_build_probe.mjs) — a scratch copy, main() stripped, called directly.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';

const repo = 'C:/Claude_Code_Projects/lero-al';
const blobHash = 'a58ce81647b1bc5062cc7bb09bf90662c60a7a48';
let src = execFileSync('git', ['cat-file', '-p', blobHash], { cwd: repo, encoding: 'utf8' });

const tail = src.lastIndexOf('main().catch(');
if (tail < 0) throw new Error('tail not found');
src = src.slice(0, tail);
src = src.replaceAll("import('playwright')", `import('file:///${repo}/node_modules/playwright/index.mjs')`);

src += `
// EDGE_TARGET_STYLE is already declared in the extracted blob (Task 832 first pass) — reused as-is.
const pagesHtml = {
  '/edge-multiband-clean': '<!DOCTYPE html><html><body style="margin:0;height:1000px;position:relative;"><button id="target" style="' + EDGE_TARGET_STYLE + '">x</button></body></html>',
  '/edge-multiband-intercepted': '<!DOCTYPE html><html><body style="margin:0;height:1000px;position:relative;"><button id="target" style="' + EDGE_TARGET_STYLE + '">x</button><span style="position:absolute;top:290px;left:30px;width:140px;height:20px;z-index:5;"></span></body></html>',
};
const cases = [
  { url: '/edge-multiband-clean', label: 'Task 832 R9 arm (d) — multiband deferral, nothing covering (must be clean AND unexcluded)', expectFail: false, expectExcludedZero: true },
  { url: '/edge-multiband-intercepted', label: 'Task 832 R9 arm (e) — multiband deferral, real interceptor (must FAIL with a real interceptor)', expectFail: true },
];
const server = createServer((req, res) => { res.writeHead(200, {'Content-Type':'text/html'}); res.end(pagesHtml[req.url] ?? ''); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;
const { chromium } = await import('file:///${repo}/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
console.log('== blob ${blobHash} (pre-R8) ==');
console.log('platform=' + process.platform + ' node=' + process.version);
let allOk = true;
for (const c of cases) {
  await page.goto(base + c.url, { waitUntil: 'domcontentloaded' });
  const result = await hitTestPage(page);
  const failed = result.violations.length > 0;
  const excludedOk = c.expectExcludedZero ? result.excluded.length === 0 : true;
  const ok = failed === c.expectFail && excludedOk;
  console.log('   ' + (ok ? 'PASS' : 'FAIL') + ' ' + c.label + ': checked=' + result.checked + ', violations=' + result.violations.length + ', cleared=' + result.cleared.length + ', excluded=' + result.excluded.length + JSON.stringify(result.excluded.map(e => e.reason)));
  if (!ok) allOk = false;
}
await browser.close();
server.close();
console.log(allOk ? 'ALL_ARMS_PASSED' : 'AT_LEAST_ONE_ARM_FAILED');
process.exit(allOk ? 0 : 1);
`;

const outPath = 'C:/Users/Nox/AppData/Local/Temp/claude/scratch_probe_832_r9_redarms.mjs';
writeFileSync(outPath, src);
console.log('written: ' + outPath);
