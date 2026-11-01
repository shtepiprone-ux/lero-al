// Task 937 design probe: can docs/sessions/evidence/task927/base/unit-base-failures.txt be repaired exactly? Its
// non-ASCII characters are only CP1252 mojibake of two UTF-8 characters: U+00E2 U+20AC U+201D (bytes E2 80 94, the
// em dash) and U+00E2 U+2020 U+2019 (bytes E2 86 92, the right arrow), plus a leading BOM. The planned repair replaces
// exactly those two sequences and nothing else. Nothing is written.
// Usage (repo root): node docs/sessions/evidence/task937/design/p03-mojibake-repair-probe.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const file = 'docs/sessions/evidence/task927/base/unit-base-failures.txt';
const text = readFileSync(file, 'utf8');
const sha = s => createHash('sha256').update(s).digest('hex');
const census = s => {
  const m = {};
  for (const c of s) { const p = c.codePointAt(0); if (p > 0x7e) { const k = 'U+' + p.toString(16).toUpperCase().padStart(4, '0'); m[k] = (m[k] || 0) + 1; } }
  return JSON.stringify(m);
};
const EM_MOJIBAKE = '\u00E2\u20AC\u201D'; // CP1252 reading of E2 80 94 (escaped so this probe is not itself mojibake)
const ARROW_MOJIBAKE = '\u00E2\u2020\u2019'; // CP1252 reading of E2 86 92
const count = (s, p) => s.split(p).length - 1;
const repaired = text.split(EM_MOJIBAKE).join('—').split(ARROW_MOJIBAKE).join('→');
console.log(`file: ${file}`);
console.log(`non-ASCII census before: ${census(text)}`);
console.log(`non-ASCII census after:  ${census(repaired)}`);
console.log(`em dash mojibake: before ${count(text, EM_MOJIBAKE)}, after ${count(repaired, EM_MOJIBAKE)}`);
console.log(`arrow mojibake:   before ${count(text, ARROW_MOJIBAKE)}, after ${count(repaired, ARROW_MOJIBAKE)}`);
// Every signature of scripts/check-mojibake.mjs that starts with U+00E2, U+00C3, U+00C2, U+00D0, U+00D1, U+00D4 or is U+FFFD.
const leads = ['\u00E2', '\u00C3', '\u00C2', '\u00D0', '\u00D1', '\u00D4', '\uFFFD'];
console.log(`signature lead characters left: ${leads.map(p => count(repaired, p)).reduce((a, b) => a + b, 0)}`);
console.log(`lines before ${text.split('\n').length}, after ${repaired.split('\n').length}`);
console.log(`ASCII text unchanged: ${text.replace(/[^\x00-\x7e]/g, '') === repaired.replace(/[^\x00-\x7e]/g, '') ? 'yes' : 'NO'}`);
console.log(`sha256 before ${sha(text)}`);
console.log(`sha256 after  ${sha(repaired)}`);
const clean = leads.every(p => count(repaired, p) === 0) && count(repaired, '—') === count(text, EM_MOJIBAKE) && count(repaired, '→') === count(text, ARROW_MOJIBAKE);
console.log(clean ? 'MOJIBAKE REPAIR PROBE PASSED' : 'MOJIBAKE REPAIR PROBE FAILED');
