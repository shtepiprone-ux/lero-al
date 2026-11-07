#!/usr/bin/env node
// Locale data safety (whole-project audit 2026-11-07, lane `locale-data` of docs/security/audit-2026-11-06/coverage.md).
// `scripts/check-i18n-parity.mjs` proves that the four locale files hold the same KEYS; nothing checked their VALUES. A
// message is output by next-intl as React text, so markup in it is shown, not run; but a value can still carry a
// `javascript:` or `http:` address that a component puts into `href`, a rich-text tag that a later `t.rich` call would turn
// into an element, an ICU syntax error that throws while the page renders, or a placeholder that exists in one language
// only (the sentence then shows a raw `{name}` or drops a value). This tool parses every value with the ICU parser
// next-intl itself uses and checks it, and checks the code paths that can bypass the text output.
// OWASP: XSS Prevention (output encoding, URL contexts), Input Validation (syntactic and semantic, allow-list), Secure
// Code Review (automate what a reader found).
//
// Rules:
//   M1  a value holds a markup tag (`<b>`, `</a>`, `<x/>`) or an ICU rich-text tag
//   M2  a value holds a `javascript:`, `data:` or `vbscript:` address, unless REVIEWED names the key
//   M3  a value holds a plain `http://` address (only `https:`, `mailto:` and `tel:` are allowed)
//   M4  a value is not valid ICU MessageFormat (it would throw at render)
//   M5  the placeholders of a key differ between the primary locale (sq) and another locale
//   M6  product code calls `t.rich`, `t.markup`, `t.raw` or `t.html` outside REVIEWED_CODE (they bypass the text output)
//   M0  a reviewed entry that no longer matches
//
// Usage: node scripts/quality/locale-safety.mjs     exit 0 = clean, 1 = findings, 2 = a locale file could not be read
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOCALES = ['sq', 'en', 'uk', 'it'];
export const PRIMARY = 'sq';

/** Values that may name a dangerous scheme, by key path, with the reason. */
export const REVIEWED = [
  { key: 'admin.footer.error_invalid_url', rule: 'M2', why: 'the footer form error TELLS the administrator that javascript: and data: addresses are refused; it is text, never a link' },
];

/** Product files that may call the bypassing translation methods, with the reason. */
export const REVIEWED_CODE = [
  { file: 'src/design-system/mantine/patterns/RangeDatePicker.tsx', call: 't.raw(', why: 'reads month and weekday name arrays and an order word; each string is rendered by Mantine as React text' },
];

const TAG = /<\/?[a-zA-Z][\w-]*(\s[^<>]*)?\/?>/;
const BAD_SCHEME = /\b(javascript|data|vbscript)\s*:/i;
const PLAIN_HTTP = /\bhttp:\/\//i;
const BYPASS = /\bt\.(rich|markup|raw|html)\(/g;

/** Flattens a messages object to `[keyPath, value]` pairs; arrays keep their index in the path. */
export function flatten(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') flatten(v, p, out);
    else out.push([p, v]);
  }
  return out;
}

/** The placeholder and tag names of a parsed ICU message (the AST of @formatjs/icu-messageformat-parser). */
export function names(ast, acc = { args: new Set(), tags: new Set() }) {
  for (const el of ast ?? []) {
    if ([1, 2, 3, 4, 5, 6].includes(el.type)) acc.args.add(el.value);
    if (el.type === 8) { acc.tags.add(el.value); names(el.children, acc); }
    if (el.options) for (const o of Object.values(el.options)) names(o.value, acc);
  }
  return acc;
}

/**
 * Findings for `{ locale: messagesObject }` and the product code `[{ file, text }]`. `parse` is the ICU parser.
 */
export function check(messages, code, parse, reviewed = REVIEWED, reviewedCode = REVIEWED_CODE) {
  const findings = [];
  const used = new Set();
  const usedCode = new Set();
  const isReviewed = (key, rule) => {
    const n = reviewed.findIndex((e) => e.key === key && e.rule === rule);
    if (n >= 0) used.add(n);
    return n >= 0;
  };
  const parsed = {};
  for (const locale of Object.keys(messages)) {
    parsed[locale] = new Map();
    for (const [key, value] of flatten(messages[locale])) {
      if (typeof value !== 'string') continue;
      const at = `messages/${locale}.json ${key}`;
      if (TAG.test(value) && !isReviewed(key, 'M1')) findings.push({ id: 'M1', at, message: 'markup tag in a message' });
      if (BAD_SCHEME.test(value) && !isReviewed(key, 'M2')) findings.push({ id: 'M2', at, message: 'a javascript:, data: or vbscript: address in a message' });
      if (PLAIN_HTTP.test(value) && !isReviewed(key, 'M3')) findings.push({ id: 'M3', at, message: 'a plain http:// address in a message (https only)' });
      try {
        const n = names(parse(value, { ignoreTag: false }));
        if (n.tags.size && !isReviewed(key, 'M1')) findings.push({ id: 'M1', at, message: `ICU rich-text tag <${[...n.tags][0]}>` });
        parsed[locale].set(key, n.args);
      } catch (e) {
        findings.push({ id: 'M4', at, message: `not valid ICU MessageFormat: ${e.message}` });
      }
    }
  }
  const primary = parsed[PRIMARY] ?? new Map();
  for (const locale of Object.keys(parsed)) {
    if (locale === PRIMARY) continue;
    for (const [key, args] of parsed[locale]) {
      const base = primary.get(key);
      if (!base) continue;
      const a = [...args].sort().join(','), b = [...base].sort().join(',');
      if (a !== b) findings.push({ id: 'M5', at: `messages/${locale}.json ${key}`, message: `placeholders {${a}} differ from ${PRIMARY} {${b}}` });
    }
  }
  for (const { file, text } of code) {
    for (const m of text.matchAll(BYPASS)) {
      const n = reviewedCode.findIndex((e) => e.file === file && e.call === m[0]);
      if (n >= 0) { usedCode.add(n); continue; }
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ id: 'M6', at: `${file}:${line}`, message: `${m[0]} bypasses the text output of next-intl; review it and list it in REVIEWED_CODE` });
    }
  }
  reviewed.forEach((e, n) => { if (!used.has(n)) findings.push({ id: 'M0', at: e.key, message: `reviewed ${e.rule} entry matches no message` }); });
  const scanned = new Set(code.map((c) => c.file));
  reviewedCode.forEach((e, n) => { if (!usedCode.has(n) && scanned.has(e.file)) findings.push({ id: 'M0', at: e.file, message: `reviewed ${e.call} call is gone` }); });
  reviewedCode.forEach((e, n) => { if (!usedCode.has(n) && !scanned.has(e.file)) findings.push({ id: 'M0', at: e.file, message: 'reviewed file is not product code any more' }); });
  return findings;
}

export const PRODUCT = (f) => /^src\/.+\.(ts|tsx)$/.test(f) && !/\.(test|spec|stories)\.(ts|tsx)$|(^|\/)(__tests__|__mocks__)\/|^src\/(stories|tests)\//.test(f);

/** The ICU parser of next-intl's own dependency tree. */
export function loadParser(root) {
  const require = createRequire(path.join(root, 'package.json'));
  return require('@formatjs/icu-messageformat-parser').parse;
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const messages = {};
  try {
    for (const l of LOCALES) messages[l] = JSON.parse(readFileSync(path.join(root, 'messages', `${l}.json`), 'utf8'));
  } catch (e) {
    console.error(`locale-safety: a locale file could not be read: ${e.message}`);
    return 2;
  }
  const r = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', 'src'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) { console.error(`locale-safety: git ls-files failed: ${r.stderr}`); return 2; }
  const code = [];
  for (const file of r.stdout.split('\0').filter(PRODUCT)) {
    try { code.push({ file, text: readFileSync(path.join(root, file), 'utf8') }); } catch { /* deleted in the working tree */ }
  }
  const findings = check(messages, code, loadParser(root));
  for (const f of findings) console.log(`${f.id} ${f.at}: ${f.message}`);
  const total = LOCALES.reduce((n, l) => n + flatten(messages[l]).length, 0);
  console.log(findings.length ? `locale-safety: ${findings.length} finding(s)` : `locale-safety: ${total} values in ${LOCALES.length} locales and ${code.length} product files, no finding`);
  return findings.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
