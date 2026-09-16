// Task 797 design measurement: raw dimensions inside Mantine responsive-object props (production .tsx).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const PROPS = 'size|miw|maw|mih|mah|w|h|width|height|minWidth|maxWidth|minHeight|maxHeight|gap|rowGap|columnGap|spacing|verticalSpacing|horizontalSpacing|m|mt|mb|ms|me|mx|my|p|pt|pb|ps|pe|px|py|top|right|bottom|left|inset|insetX|insetY|offset|separatorMargin|triggerWidth|dropdownMinWidth|dropdownMaxHeight|scrollbarSize|thumbSize|radius|lh|fz|letterSpacing';
const re = new RegExp(`\\b(${PROPS})=\\{\\{([^{}]*)\\}\\}`, 'g');
const valRe = /:\s*(-?\d+(?:\.\d+)?)\s*(?=[,}]|$)|:\s*(["'])([^"']*?\d(?:px|rem|em)[^"']*)\2/g;
const hits = [];
function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (!['node_modules', '__tests__', 'stories'].includes(e.name)) walk(p); continue; }
    if (!/\.tsx$/.test(e.name) || /\.(stories|test)\.tsx$/.test(e.name)) continue;
    const t = readFileSync(p, 'utf8');
    let m;
    while ((m = re.exec(t))) {
      const raws = [...m[2].matchAll(valRe)].map((v) => v[1] ?? v[3]).filter((v) => !/^-?0(\.0+)?$/.test(v));
      if (raws.length) hits.push({ file: p.replace(/\\/g, '/'), line: t.slice(0, m.index).split('\n').length, prop: m[1], raws, text: m[0].slice(0, 100) });
    }
  }
}
walk('src');
console.log('HITS', hits.length, 'FILES', new Set(hits.map((h) => h.file)).size);
for (const h of hits) console.log(`${h.file}:${h.line}  ${h.text}  raw=${JSON.stringify(h.raws)}`);
