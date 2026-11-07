#!/usr/bin/env node
// Client sink census (whole-project audit 2026-11-06, lane `client-ui` of docs/security/audit-2026-11-06/coverage.md).
// Every line of product code under src/ is scanned for the places where data reaches the browser's dangerous APIs. A sink
// passes when it carries its control (an origin, `noopener`, a named sanitizer, a URL guard); a sink without it fails,
// unless REVIEWED names it with the reason or the open task that removes it. A REVIEWED entry that no longer matches a
// line fails too, so the list cannot outlive the code. `src/__tests__/security/clientSinks.test.ts` already covers
// `window.open` without noopener, `target="_blank"` without noopener, `dangerouslySetInnerHTML`, `eval`, `new Function`,
// `innerHTML =`, `document.write` and string timers; this tool covers what it does not. OWASP: DOM based XSS Prevention, XSS Prevention (URL contexts),
// HTML5 Security (postMessage, storage), Secure Code Review (automate what a reader found).
//
// Usage: node scripts/quality/client-sinks.mjs        exit 0 = every sink controlled or reviewed, 1 = findings
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Product code: every src/ .ts/.tsx except tests, Stories and test helpers. */
export const PRODUCT = (f) => /^src\/.+\.(ts|tsx)$/.test(f) && !/\.(test|spec|stories)\.(ts|tsx)$|(^|\/)(__tests__|__mocks__)\/|^src\/(stories|tests)\//.test(f);

const URL_GUARDS = /\b(safeExternalUrl|safeNextPath|sanitizeReturnTo|safeRedirect|isTrustedImageUrl)\(/;
const SECRET_WORD = /token|secret|password|passwd|jwt|access_?key|refresh|session_?id|api_?key/i;

/** The rules. Each `test(line, file, lines, i)` returns a message when the line is an uncontrolled sink. */
export const RULES = [
  { id: 'K1', test: (l) => /\.postMessage\([^)]*,\s*['"]\*['"]/.test(l) && 'postMessage to any origin ("*")' },
  { id: 'K2', test: (l, _f, lines) => /addEventListener\(\s*['"]message['"]/.test(l) && !lines.some((x) => /\.origin\s*!==?|!==?\s*[\w.]*\.origin\b/.test(x)) && 'a message listener in a file that never compares the event origin' },
  { id: 'K3', test: (l) => /\.outerHTML\s*[+]?=|\binsertAdjacentHTML\(|\bdocument\.writeln\(/.test(l) && 'raw HTML written into the DOM' },
  { id: 'K4', test: (l) => /\b(localStorage|sessionStorage)\.setItem\(/.test(l) && SECRET_WORD.test(l) && 'a credential-like value in browser storage' },
  { id: 'K5', test: (l) => { const m = /\bhref=\{([^}]*)\}/.exec(l); return m && /\.(link|url|website|website_url|source_url)\b/.test(m[1]) && !URL_GUARDS.test(m[1]) && 'a stored URL rendered as href without a URL guard'; } },
  // K6-K8 (audit 2026-11-07, the owner's question on the quality of clientSinks.test.ts): the sinks of the DOM based XSS
  // sheet that the test does not see, and every raw-HTML use by occurrence (the test allows a whole FILE, so a second,
  // unsanitised use in an allow-listed file passes it).
  { id: 'K6', test: (l) => /\.innerHTML\s*\+=|(^|[^\w$.])Function\(|\bcreateContextualFragment\(|\.srcdoc\s*=|\bsrcDoc=\{|\.setAttribute\(\s*['"](on\w+|href|src|srcdoc|action|formaction)['"]\s*,\s*[^'"\s]/.test(l) && 'HTML, code or a URL set through a DOM API' },
  { id: 'K7', test: (l) => !URL_GUARDS.test(l) && (/\b(window|document)\.location(\.href)?\s*=(?!=)\s*[^'"\s`]|\blocation\.href\s*=(?!=)\s*[^'"\s`]|\blocation\.(assign|replace)\(\s*[^'"\s`)]|\brouter\.(push|replace)\(\s*[A-Za-z_$][\w$.]*\s*[,)]|\bwindow\.open\(\s*[A-Za-z_$][\w$.]*\s*[,)]/.test(l)) && 'navigation to a computed address: it must be a guarded or internal path' },
  { id: 'K8', test: (l) => /\bdangerouslySetInnerHTML\b/.test(l) && 'raw HTML output: each use is reviewed with its sanitiser' },
];

/**
 * Sinks that are reviewed: `file`, a `line` substring, and why it passes, or the open task that removes it. An entry
 * whose line is gone fails the run (remove the entry with the fix).
 */
export const REVIEWED = [
  { file: 'src/modules/notifications/components/NotificationItem.tsx', line: 'href={notification.link}', rule: 'K5',
    why: 'OPEN finding P-06, Task 959: the stored link is written by the server only today; the render must go through the URL guard' },
  { file: 'src/components/admin/AdminEmailTemplatesManager.tsx', line: 'srcDoc={html}', rule: 'K6',
    why: 'the template preview renders in <iframe sandbox="">: no script, no same-origin access, no form submission' },
  { file: 'src/modules/cms/components/CmsPageView.tsx', line: '__html: sanitizeCmsHtml(', rule: 'K8',
    why: 'the CMS body passes through sanitizeCmsHtml (sanitize-html, allow-listed tags, attributes and schemes) in the same expression' },
  { file: 'src/modules/listings/components/SimilarListings.tsx', line: 'dangerouslySetInnerHTML={{', rule: 'K8',
    why: 'a speculation-rules script whose JSON jsonForScript builds from internal listing paths and escapes for a script element' },
  { file: 'src/components/layout/Header.tsx', line: 'router.push(target)', rule: 'K7', why: 'resolvePostSignOutPath returns only /<locale> or null' },
  { file: 'src/components/layout/Header.tsx', line: 'router.push(path)', rule: 'K7', why: 'HeaderView passes the paths of its own navigation items' },
  { file: 'src/hooks/useUnsavedChangesGuard.ts', line: 'router.push(href)', rule: 'K7', why: 'href is the in-app destination the guard intercepted (callers pass literal internal paths)' },
  { file: 'src/lib/auth/googlePopup.ts', line: 'window.open(attempt.url', rule: 'K7', why: "attempt.url is Google's authorization endpoint built in the same file (Task 927 D27)" },
  { file: 'src/modules/auth/components/AuthRedirect.tsx', line: 'router.replace(loginDestination)', rule: 'K7', why: 'sanitizeReturnTo(next) or /<locale>/cabinet (lines 59-65)' },
  { file: 'src/modules/auth/components/AuthRedirect.tsx', line: 'router.replace(cancelDestination)', rule: 'K7', why: 'always /<locale> (lines 71-74)' },
  { file: 'src/modules/auth/components/AuthSheet.tsx', line: 'router.push(next)', rule: 'K7', why: 'next = sanitizeReturnTo(...) two lines above' },
  { file: 'src/modules/auth/lib/googleSignIn.ts', line: 'router.push(next)', rule: 'K7', why: 'next = sanitizeReturnTo(...) two lines above' },
  { file: 'src/modules/cabinet/components/SavedSearchesTab.tsx', line: 'router.push(url)', rule: 'K7', why: 'url comes from buildUrl: /<locale>/listings with canonical search parameters' },
  { file: 'src/modules/listings/components/FavoritesTypeFilter.tsx', line: 'router.push(url)', rule: 'K7', why: 'url is /<locale>/favorites with an optional type from the property type list' },
  { file: 'src/modules/listings/components/ListingContact.tsx', line: "window.open(href, '_blank', 'noopener,noreferrer')", rule: 'K7', why: 'href is https://wa.me/<digits only>?text=<encoded>, built two lines above' },
  { file: 'src/modules/listings/hooks/useListingsUrlFilters.ts', line: 'router.push(pathname)', rule: 'K7', why: 'the current pathname from usePathname' },
];

/** Findings for a set of `{ file, text }`; `reviewed` defaults to REVIEWED. */
export function scan(files, reviewed = REVIEWED) {
  const findings = [];
  const used = new Set();
  for (const { file, text } of files) {
    const lines = text.split(/\r?\n/);
    lines.forEach((l, i) => {
      for (const r of RULES) {
        const message = r.test(l, file, lines, i);
        if (!message) continue;
        const ok = reviewed.findIndex((e) => e.file === file && e.rule === r.id && l.includes(e.line));
        if (ok >= 0) { used.add(ok); continue; }
        findings.push({ id: r.id, file, line: i + 1, message });
      }
    });
  }
  const scanned = new Set(files.map((f) => f.file));
  reviewed.forEach((e, n) => {
    if (!used.has(n) && scanned.has(e.file)) findings.push({ id: 'K0', file: e.file, line: 0, message: `reviewed entry no longer matches a sink: ${e.line}` });
    if (!used.has(n) && !scanned.has(e.file)) findings.push({ id: 'K0', file: e.file, line: 0, message: 'reviewed entry names a file that is not product code any more' });
  });
  return findings;
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const r = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', 'src'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) { console.error(`client-sinks: git ls-files failed: ${r.stderr}`); return 2; }
  const files = [];
  for (const file of r.stdout.split('\0').filter(PRODUCT)) {
    try { files.push({ file, text: readFileSync(path.join(root, file), 'utf8') }); } catch { /* a tracked file deleted in the working tree is not product code */ }
  }
  const findings = scan(files);
  for (const f of findings) console.log(`${f.id} ${f.file}:${f.line} ${f.message}`);
  console.log(findings.length ? `client-sinks: ${findings.length} finding(s) in ${files.length} files` : `client-sinks: ${files.length} files, every sink controlled or reviewed`);
  return findings.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
