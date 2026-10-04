// Task 859 review 2 — summarises audit-<ref>.json into summary.json + summary.md (page-level evidence rows).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const REFS = ['lahomes', 'kamr', 'omah', 'tailadmin'];
const out = { generatedAt: new Date().toISOString(), refs: {} };
let md = '# GR-7 deep audit — Task 859 review 2 (2026-10-04)\n\n';

for (const ref of REFS) {
  const f = join(DIR, `audit-${ref}.json`);
  if (!existsSync(f)) { md += `## ${ref}\n\nMISSING audit file\n\n`; continue; }
  const j = JSON.parse(readFileSync(f, 'utf8'));
  const rows = j.rows;
  const tables = rows.flatMap(r => (r.tables || []).map(t => ({ ...t, page: r.finalUrl || r.url, id: r.id })));
  const dialogs = rows.flatMap(r => [
    ...(r.popups || []).filter(p => p.result === 'dialog').map(p => ({ ...p, page: r.finalUrl || r.url, id: r.id })),
    ...(r.tables || []).flatMap(t => (t.actionsOperated || []).filter(a => a.result === 'dialog').map(a => ({ ...a, page: r.finalUrl || r.url, id: r.id }))),
  ]);
  const s = {
    loginNote: j.loginNote ?? null,
    pages: rows.length, blocked: rows.filter(r => r.state === 'blocked').map(r => ({ url: r.url, error: r.error })),
    queueLeft: j.remainingQueue.length,
    pagesWithTables: rows.filter(r => r.tables?.length).length, tables: tables.length,
    tablesCheckboxFirst: tables.filter(t => t.headCheckbox && t.firstCellCheckbox).length,
    tablesActionsLast: tables.filter(t => t.lastCellControls?.length).length,
    tablesBoth: tables.filter(t => t.headCheckbox && t.firstCellCheckbox && t.lastCellControls?.length).length,
    selectAllBulkAppeared: tables.filter(t => t.selectAll?.appearedButtons?.length).map(t => ({ page: t.page, buttons: t.selectAll.appearedButtons })),
    rowActionResults: tables.flatMap(t => (t.actionsOperated || []).map(a => `${a.result}${a.menu ? ':' + a.menu.items.join('/') : ''}${a.dialog ? ':' + (a.dialog.title?.text || '') : ''}`))
      .reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}),
    rowActionControls: tables.flatMap(t => (t.lastCellControls || []).map(c => `${c.title || c.text || c.icon || c.tag}|bg ${c.style?.backgroundColor}|${c.style?.w}x${c.style?.h}|r ${c.style?.borderRadius}`))
      .reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}),
    dialogs: dialogs.length,
    dialogFooterOrders: dialogs.map(d => (d.dialog.footerButtons || []).map(b => b.text).join(' | ')).reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}),
    dialogsWithClose: dialogs.filter(d => d.dialog.close).length,
    dialogsEscCloses: dialogs.filter(d => d.escCloses).length,
    dialogWidths: [...new Set(dialogs.map(d => d.dialog.w))].sort((a, b) => a - b),
    overflow390: rows.filter(r => r.overflow390).map(r => r.finalUrl || r.url),
  };
  out.refs[ref] = s;

  md += `## ${ref} — ${j.entry}\n\n`;
  md += `Login: ${s.loginNote ?? 'n/a'} · pages inspected ${s.pages} · blocked ${s.blocked.length} · queue left ${s.queueLeft}\n\n`;
  md += `Tables ${s.tables} on ${s.pagesWithTables} pages · checkbox column first ${s.tablesCheckboxFirst} · actions in the last column ${s.tablesActionsLast} · both ${s.tablesBoth}\n\n`;
  md += `Select-all → a button appeared (bulk action) on: ${s.selectAllBulkAppeared.map(x => `${x.page} [${x.buttons.join(', ')}]`).join('; ') || 'none'}\n\n`;
  md += `Dialogs opened ${s.dialogs} · with a header close ${s.dialogsWithClose} · Esc closes ${s.dialogsEscCloses} · widths ${s.dialogWidths.join(', ')}\n\n`;
  md += `| id | page | tables (cols · checkbox first · last-column controls · select-all) | popups operated → result | screenshots |\n|---|---|---|---|---|\n`;
  for (const r of rows) {
    const tb = (r.tables || []).map(t => `${t.cols}c · ${t.headCheckbox && t.firstCellCheckbox ? 'cb' : 'no-cb'} · [${(t.lastCellControls || []).map(c => c.title || c.text || c.icon || c.tag).join(', ')}] · ${t.selectAll ? `${t.selectAll.checked}/${t.selectAll.total}${t.selectAll.appearedButtons?.length ? ' +' + t.selectAll.appearedButtons.join('/') : ''}` : '–'}${(t.actionsOperated || []).length ? ' → ' + t.actionsOperated.map(a => a.result + (a.menu ? ':' + a.menu.items.join('/') : '') + (a.dialog ? ':' + (a.dialog.title?.text || 'dialog') : '')).join(', ') : ''}`).join('<br>');
    const pp = (r.popups || []).filter(p => p.result !== 'not-clickable' && p.result !== 'no-visible-change')
      .map(p => `${p.label.replace(/\|/g, '/')} → ${p.result}${p.dialog ? ` (${p.dialog.title?.text || ''}; footer: ${(p.dialog.footerButtons || []).map(b => b.text).join(' / ')}; ${p.dialog.w}px)` : ''}${p.menu ? ` (${p.menu.items.join('/')})` : ''}`).join('<br>');
    md += `| ${r.id} | ${(r.finalUrl || r.url).replace(j.scope, '/')} ${r.state === 'blocked' ? '**BLOCKED** ' + (r.error || '') : ''} | ${tb || '–'} | ${pp || '–'} | ${r.shot || ''}${r.shot390 ? ', ' + r.shot390 : ''} |\n`;
  }
  md += '\n';
}
writeFileSync(join(DIR, 'summary.json'), JSON.stringify(out, null, 1));
writeFileSync(join(DIR, 'summary.md'), md);
for (const [ref, s] of Object.entries(out.refs)) console.log(ref, JSON.stringify({ pages: s.pages, blocked: s.blocked.length, queueLeft: s.queueLeft, tables: s.tables, cbFirst: s.tablesCheckboxFirst, actionsLast: s.tablesActionsLast, both: s.tablesBoth, bulk: s.selectAllBulkAppeared.length, dialogs: s.dialogs }));
