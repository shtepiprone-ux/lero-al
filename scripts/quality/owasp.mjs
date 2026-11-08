#!/usr/bin/env node
// OWASP Cheat Sheet Series as a gate, not a memory (owner request 2026-11-07: every task design, edit and review is held
// against https://cheatsheetseries.owasp.org/index.html, and the project's protections follow the sheets as they change).
//
// The published site is built from github.com/OWASP/CheatSheetSeries (`cheatsheets/*.md`). This tool keeps three things:
//   docs/security/owasp/sheets.json    the registry: every sheet upstream, its URL and its content hash (git blob sha),
//                                      written by `sync`; CI fails when upstream differs from the committed registry.
//   docs/security/owasp/controls.json  the mapping, written by Opus: per sheet, whether it applies to this project (and why
//                                      not), the version Opus last read (`reviewedSha`), the triggers that make it required
//                                      for a task, and its requirements as VERBATIM quotes, each with the control of this
//                                      project that implements it (a rule, a tool, a test) or the task that will.
//   .cache/owasp/<sheet>.md            the text of each sheet at the registry's commit (not committed), written by `sync`;
//                                      every quote is verified against it, so a sheet cannot be cited without its text.
//
// Commands (exit 0 = clean, 1 = findings, 2 = the tool could not run):
//   sync              read upstream, rewrite sheets.json, refresh the cache, list added / changed / removed sheets
//   sync --verify     read upstream, refresh the cache, and fail when upstream differs from the committed sheets.json (CI)
//   cache             fetch the texts of the committed registry (no judgement of upstream; the task gate's job)
//   check             every sheet mapped; every mapping read at the current version; every quote found in its sheet;
//                     every control path exists; the registry is at most MAX_AGE_DAYS old; every file of the repository
//                     but documentation is covered by an applicable sheet's path trigger (O9), so a task touching it,
//                     today's or any created later, is held to that sheet
//   plan <kickoff>    print a draft "## OWASP" section: each required sheet, what triggered it, its mapped requirements
//   kickoff <file..>  the kickoff's "## OWASP" section names every required sheet, each with a verified quote and the
//                     acceptance criteria that implement it, or "not applicable" with a reason
//   review <kickoff> [--base <ref>]   the task's review record (docs/security/owasp/reviews/Task_<n>.json) gives a
//                     verdict for every sheet the kickoff names AND every sheet the actual diff against <ref> triggers
//   gate [--base <ref>]  CI on every pull request and push to main: a change of anything but documentation carries an
//                     approved task whose review record passes, and the approved reviews together cover every sheet
//                     the diff triggers (a version-only dependency update is held by the dependency gates instead)
// OWASP: Secure Code Review (the reference is part of the review), Threat Modeling (re-done when the reference changes),
// Vulnerable Dependency Management (a reference is a dependency: track its version), Secure Coding with AI (the agent's
// claim of having read a source is checked against the source).
import { createHash } from 'node:crypto';
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REGISTRY = 'docs/security/owasp/sheets.json';
export const CONTROLS = 'docs/security/owasp/controls.json';
// One file per reviewed task: the per-sheet verdicts are evidence for the tools, sized by the diff, so they stay out of the
// kickoff, which people read and which is held to its line limit. checkReview is the schema of a record.
export const REVIEWS = 'docs/security/owasp/reviews';
export const CACHE = '.cache/owasp';
const UPSTREAM = 'OWASP/CheatSheetSeries';
const SITE = 'https://cheatsheetseries.owasp.org/cheatsheets/';
export const MAX_AGE_DAYS = 7;
export const VERIFIED = '.verified.json'; // in CACHE: when upstream was last read (sync or sync --verify)
export const MIN_QUOTE_WORDS = 6;
// Kickoffs reviewed and approved before this gate existed (2026-11-07); every other kickoff from Sprint 93 on is held to
// "## OWASP" and, once reviewed, to its review record (check-files.mjs and the `kickoff` command alike). A number leaves
// this set when its kickoff is archived; no number is ever added.
export const OWASP_GRANDFATHERED = new Set(['947']);
const SUFFIX = /_Cheat_Sheet\.md$|\.md$/;

// ── text helpers ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Text reduced to words: markdown marks, links, punctuation variants and case removed, so a quote matches the prose. */
export function normalise(s) {
  return String(s)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/[*_`#>|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([,.;:!?)])/g, '$1')
    .trim()
    .toLowerCase();
}

/** The quotes of a line: "..." with at least MIN_QUOTE_WORDS words. */
export function quotesOf(line) {
  return [...String(line).matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((q) => q.trim().split(/\s+/).length >= MIN_QUOTE_WORDS);
}

/** The lines of a markdown section `## title` (or `### title` inside a parent), up to the next heading of the same level. */
export function section(body, heading) {
  const lines = body.split('\n');
  const level = heading.match(/^#+/)[0].length;
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(#+)\s/.exec(lines[i]);
    if (m && m[1].length <= level) break;
    out.push({ text: lines[i], line: i + 1 });
  }
  return out;
}

/** "- Sheet_Name: rest" items of a section, continuation lines joined. */
export function sheetItems(lines) {
  const items = [];
  for (const { text, line } of lines ?? []) {
    const m = /^- ([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(text);
    if (m) items.push({ sheet: m[1], rest: m[2], line });
    else if (items.length && /^\s+\S/.test(text)) items[items.length - 1].rest += ` ${text.trim()}`;
  }
  return items;
}

// ── data ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function loadJson(rel, root = ROOT) {
  const f = path.join(root, rel);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
}

export function sheetText(name, root = ROOT) {
  const f = path.join(root, CACHE, `${name}.md`);
  return existsSync(f) ? readFileSync(f, 'utf8') : null;
}

/** Whether a quote is in the sheet's text (after normalisation). `null` = the text is not cached. */
export function quoteFound(quote, text) {
  if (text == null) return null;
  return normalise(text).includes(normalise(quote));
}

/** The sheets a text triggers: `paths` match file paths named in it, `words` match the prose; `always` sheets join by mode. */
export function triggered(controls, { text = '', paths = [], surfaceChanged = false }) {
  const out = new Set();
  for (const [name, c] of Object.entries(controls?.sheets ?? {})) {
    if (!c.applies) continue;
    if (c.always === 'every-task' || (c.always === 'surface-changed' && surfaceChanged)) { out.add(name); continue; }
    const t = c.triggers ?? {};
    if ((t.paths ?? []).some((p) => paths.some((f) => new RegExp(p).test(f)))) out.add(name);
    else if ((t.words ?? []).some((w) => new RegExp(w, 'i').test(text))) out.add(name);
  }
  return [...out].sort();
}

/** Documentation: the only files no sheet has to cover (O9). Everything else that is tracked, code, configuration,
 *  locale data, styles and public assets alike, is matched by the path trigger of at least one applicable sheet, so a
 *  task that touches it is held to that sheet; a new kind of file fails until it is mapped. */
export const DOCUMENTATION = /^(docs|tasks)\/|\.md$|^LICENSE$/;

/** O9: the files no applicable sheet's path trigger matches. */
export function uncovered(controls, files) {
  const pats = Object.values(controls?.sheets ?? {}).filter((c) => c.applies).flatMap((c) => (c.triggers?.paths ?? []).map((p) => new RegExp(p)));
  return files.filter((f) => !DOCUMENTATION.test(f) && !pats.some((r) => r.test(f)));
}

/** Every file of the repository: tracked plus untracked and not ignored (a new file counts before its commit). */
export function repositoryFiles(root = ROOT) {
  const list = (args) => {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 28 });
    if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${r.stderr}`);
    return r.stdout.split('\0').filter(Boolean);
  };
  return [...new Set([...list(['ls-files', '-z']), ...list(['ls-files', '-z', '--others', '--exclude-standard'])])].filter((f) => existsSync(path.join(root, f)));
}

/** File paths named in a kickoff: backticked tokens that look like a path. */
export function pathsIn(text) {
  return [...String(text).matchAll(/`([^`\s]+\/[^`\s]+|[^`\s/]+\.(?:ts|tsx|mjs|cjs|js|json|sql|yml|yaml|md))`/g)]
    .map((m) => m[1].replace(/:\d+(?:[-,]\d+)*$/, ''))
    .filter((p) => !/^[a-z][a-z0-9+.-]*:\/\//i.test(p) && !/^@[^/]+\/[^@]+@\d/.test(p)); // not a URL, not a package@version
}

// ── check: the mapping is complete, current and true ───────────────────────────────────────────────────────────────

/** The open kickoff of a task number (tasks/Sprints/*_Task_<n>_*.md), or null. */
export function kickoffOf(task, root = ROOT) {
  const dir = path.join(root, 'tasks', 'Sprints');
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((n) => n.includes(`_Task_${task}_`) && n.endsWith('.md'));
  return f ? path.join(dir, f) : null;
}

/** When upstream was last read: the registry's fetch or the later `sync --verify` marker (NaN when neither parses). */
export function lastRead(registry, root = ROOT) {
  let readOn = Date.parse(registry?.fetchedOn);
  const marker = path.join(root, CACHE, VERIFIED);
  if (existsSync(marker)) {
    try {
      const checked = Date.parse(JSON.parse(readFileSync(marker, 'utf8')).checkedOn);
      if (!Number.isNaN(checked)) readOn = Number.isNaN(readOn) ? checked : Math.max(readOn, checked);
    } catch { /* a broken marker counts as absent */ }
  }
  return readOn;
}

/** The text every Claude Code session starts with (agent-check.mjs start): the state of the reference and the commands
 *  that hold a task design, edit or review against it. Findings come first, so a drifted reference is fixed before work. */
export function sessionBrief(registry, controls, findings, { refresh = null } = {}) {
  const lines = [];
  const applicable = Object.values(controls?.sheets ?? {}).filter((c) => c.applies).length;
  if (refresh) lines.push(`OWASP reference: ${refresh}`);
  if (findings.length) {
    const byRule = {};
    for (const f of findings) byRule[f.id] = (byRule[f.id] ?? 0) + 1;
    lines.push(`OWASP reference: ${findings.length} finding(s) (${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(', ')}). ` +
      'CI fails on every PR until they are fixed. Before designing, editing or reviewing any task: run node scripts/quality/owasp.mjs sync, ' +
      `re-read each listed sheet, update ${CONTROLS} (requirements, controls, tasks, reviewedSha) and the kickoffs it hands requirements to, until node scripts/quality/owasp.mjs check is clean.`);
    for (const f of findings.slice(0, 10)) lines.push(`  ${f.id} ${f.at ?? ''} ${f.message}`);
    if (findings.length > 10) lines.push(`  ... ${findings.length - 10} more: node scripts/quality/owasp.mjs check`);
  } else {
    lines.push(`OWASP reference: ${registry?.sheets?.length ?? 0} sheets mapped (${applicable} apply), every one read at its current version.`);
  }
  lines.push('Every task design, edit and review is held against it: node scripts/quality/owasp.mjs plan <kickoff> before writing "## OWASP" ' +
    '(a missing protection goes into Scope and an AC with its test); node scripts/quality/owasp.mjs review <kickoff> before the verdict ' +
    `(the record ${REVIEWS}/Task_<n>.json; a protection the diff needs and lacks is a finding).`);
  return lines.join('\n');
}

/** `sync --verify` in a child process: reads upstream, refreshes the cache and the marker, never rewrites the registry. */
function syncVerify(root) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'quality', 'owasp.mjs'), 'sync', '--verify'], { cwd: root, encoding: 'utf8', timeout: 30_000, windowsHide: true });
}

/** The SessionStart context (agent-check.mjs start). Upstream is read again when the last read is older than
 *  `refreshMs`; a difference is reported (`sync` plus the mapping update is then the session's first job), a failure to
 *  read is reported and the last read counts. Never throws: the session always starts, and always with this text. */
export function sessionContext({ root = ROOT, now = Date.now(), refreshMs = 86_400_000, sync = syncVerify } = {}) {
  try {
    let refresh = null;
    if (!(now - lastRead(loadJson(REGISTRY, root), root) <= refreshMs)) {
      const r = sync(root);
      const out = `${r.stdout || ''}${r.stderr || ''}`.trim().slice(0, 3000);
      if (r.status === 0) refresh = 'upstream read now, unchanged.';
      else if (r.status === 1) refresh = `UPSTREAM CHANGED since the committed registry. ${out}`;
      else refresh = `upstream could not be read now (${r.error ? r.error.message : `exit ${r.status}`}); the last read counts. ${out.slice(0, 400)}`;
    }
    const registry = loadJson(REGISTRY, root);
    const controls = loadJson(CONTROLS, root);
    let files = null;
    try { files = repositoryFiles(root); } catch { /* not a Git working tree: O9 is checked by owasp.mjs check and CI */ }
    return sessionBrief(registry, controls, checkMapping(registry, controls, { root, now, files }), { refresh });
  } catch (e) {
    return `OWASP reference: the check could not run (${e && e.message ? e.message : e}). Run node scripts/quality/owasp.mjs check before designing or reviewing a task.`;
  }
}

export function checkMapping(registry, controls, { root = ROOT, now = Date.now(), text = sheetText, files = null } = {}) {
  const out = [];
  const add = (id, at, message) => out.push({ id, at, message });
  if (!registry?.sheets?.length) { add('O1', REGISTRY, 'no registry: run node scripts/quality/owasp.mjs sync'); return out; }
  const age = (now - lastRead(registry, root)) / 86_400_000;
  if (!(age <= MAX_AGE_DAYS)) add('O1', REGISTRY, `upstream was last read ${Math.floor(age)} days ago (limit ${MAX_AGE_DAYS}): run node scripts/quality/owasp.mjs sync`);
  const map = controls?.sheets ?? {};
  const names = new Set(registry.sheets.map((s) => s.name));
  const backlogFile = path.join(root, 'docs/backlog.md');
  const backlog = existsSync(backlogFile) ? readFileSync(backlogFile, 'utf8') : null;
  for (const s of registry.sheets) {
    const c = map[s.name];
    if (!c) { add('O2', s.name, `sheet not mapped: read ${s.url} and add it to ${CONTROLS}`); continue; }
    if (c.reviewedSha !== s.sha) add('O3', s.name, `changed upstream since it was read (${String(c.reviewedSha).slice(0, 8)} -> ${s.sha.slice(0, 8)}): re-read ${s.url}, update its requirements and controls, set reviewedSha`);
    if (c.applies === false) {
      if (!c.why || c.why.split(/\s+/).length < 5) add('O4', s.name, 'not applicable without a reason of at least five words');
      continue;
    }
    if (c.applies !== true) { add('O4', s.name, 'applies must be true or false'); continue; }
    if (!c.always && !(c.triggers?.paths?.length || c.triggers?.words?.length)) add('O4', s.name, 'an applicable sheet needs triggers (paths or words) or always');
    if (!c.requirements?.length) add('O5', s.name, 'an applicable sheet needs at least one requirement quote with its control');
    const body = text(s.name, root);
    for (const r of c.requirements ?? []) {
      const found = quoteFound(r.quote ?? '', body);
      if (found === null) add('O6', s.name, `sheet text not cached: run node scripts/quality/owasp.mjs sync`);
      else if (!found) add('O6', s.name, `quote not in the sheet: "${String(r.quote).slice(0, 60)}"`);
      if (String(r.quote ?? '').trim().split(/\s+/).length < MIN_QUOTE_WORDS) add('O6', s.name, `quote shorter than ${MIN_QUOTE_WORDS} words`);
      if (!r.control && !r.task) add('O7', s.name, 'a requirement names no control and no task');
      if (r.control) {
        // A control is a file AND the text in it that implements the quote: a path alone proves nothing.
        const p = String(r.control);
        const file = path.join(root, p);
        if (!existsSync(file)) add('O7', s.name, `control path does not exist: ${p}`);
        else if (!r.evidence || String(r.evidence).trim().length < 8) add('O7', s.name, `control ${p} needs "evidence": the text in it (8+ characters) that implements the quote`);
        else if (!readFileSync(file, 'utf8').includes(r.evidence)) add('O7', s.name, `the evidence is no longer in ${p}: "${String(r.evidence).slice(0, 60)}" (the control changed: re-check it implements the quote)`);
      }
      if (r.task && !/^\d{3,4}$/.test(String(r.task))) add('O7', s.name, `task must be a task number: ${r.task}`);
      else if (r.task && backlog !== null && !backlog.includes(`**${r.task}**`)) add('O7', s.name, `task ${r.task} is not an open number in docs/backlog.md (done: name the control that now implements the quote)`);
      else if (r.task) {
        // A requirement handed to a task is in that task's design: its kickoff's "## OWASP" section cites the quote.
        const kickoff = kickoffOf(r.task, root);
        const owasp = kickoff && section(readFileSync(kickoff, 'utf8'), '## OWASP');
        if (kickoff && !(owasp && normalise(owasp.map((l) => l.text).join(' ')).includes(normalise(r.quote ?? ''))))
          add('O8', s.name, `${path.relative(root, kickoff).split(path.sep).join('/')} "## OWASP" does not cite the requirement handed to Task ${r.task}: "${String(r.quote).slice(0, 60)}"`);
      }
    }
    for (const p of c.triggers?.paths ?? []) { try { new RegExp(p); } catch { add('O4', s.name, `bad path trigger ${p}`); } }
    for (const w of c.triggers?.words ?? []) { try { new RegExp(w, 'i'); } catch { add('O4', s.name, `bad word trigger ${w}`); } }
  }
  for (const n of Object.keys(map)) if (!names.has(n)) add('O2', n, 'mapped sheet no longer exists upstream: remove it or follow its rename');
  if (files) for (const f of uncovered(controls, files)) add('O9', f, `no applicable sheet's path trigger covers this file, so a task that changes it is held to no sheet: add the path to the triggers of the sheets that govern it in ${CONTROLS}`);
  return out;
}

// ── kickoff and review ──────────────────────────────────────────────────────────────────────────────────────────────

/** Whether the kickoff's attack surface is changed ("Unchanged" / "Attack surface: unchanged" is the only unchanged form). */
export function surfaceChanged(body) {
  const s = section(body, '## Attack surface');
  if (!s) return true;
  const t = s.map((l) => l.text).join(' ').trim();
  return !/^"?(attack surface:\s*)?unchanged\b/i.test(t);
}

/** Findings for the "## OWASP" section of a kickoff. */
export function checkKickoff(body, registry, controls, { root = ROOT, text = sheetText } = {}) {
  const out = [];
  const add = (line, message) => out.push({ id: 'owasp', line, message });
  const sec = section(body, '## OWASP');
  if (!sec) { add(undefined, 'missing section "## OWASP" (kickoff-template.md): the required sheets with verified quotes'); return out; }
  const sha = Object.fromEntries((registry?.sheets ?? []).map((s) => [s.name, s]));
  const head = ['## Goal', '## Scope', '## Attack surface'].map((h) => (section(body, h) ?? []).map((l) => l.text).join('\n')).join('\n');
  const required = triggered(controls, { text: head, paths: pathsIn(head), surfaceChanged: surfaceChanged(body) });
  const acs = new Set([...body.matchAll(/^- (AC\d+)\b/gm)].map((m) => m[1]));
  const items = sheetItems(sec);
  const named = new Set(items.map((i) => i.sheet));
  for (const r of required) if (!named.has(r)) add(sec[0]?.line, `required sheet ${r} is missing (triggered by this kickoff): add "- ${r}: \\"<quote>\\" — <how> — AC<n>" or "not applicable — <reason>"`);
  for (const it of items) {
    const reg = sha[it.sheet];
    const c = controls?.sheets?.[it.sheet];
    if (!reg) { add(it.line, `${it.sheet} is not a sheet of the registry`); continue; }
    if (!c || c.reviewedSha !== reg.sha) add(it.line, `${it.sheet}: its mapping was not read at the current version (owasp.mjs check, O3)`);
    if (/^not applicable\b/i.test(it.rest)) {
      if (it.rest.replace(/^not applicable\W*/i, '').split(/\s+/).length < 5) add(it.line, `${it.sheet}: "not applicable" needs a reason of at least five words`);
      continue;
    }
    const qs = quotesOf(it.rest);
    if (!qs.length) add(it.line, `${it.sheet}: no quote of at least ${MIN_QUOTE_WORDS} words from the sheet`);
    const body2 = text(it.sheet, root);
    for (const q of qs) {
      const f = quoteFound(q, body2);
      if (f === null) add(it.line, `${it.sheet}: sheet text not cached — run node scripts/quality/owasp.mjs sync`);
      else if (!f) add(it.line, `${it.sheet}: quote not found in the sheet: "${q.slice(0, 60)}"`);
    }
    const refs = [...it.rest.matchAll(/\bAC\d+\b/g)].map((m) => m[0]);
    if (!refs.length) add(it.line, `${it.sheet}: names no acceptance criterion`);
    for (const a of refs) if (!acs.has(a)) add(it.line, `${it.sheet}: ${a} is not an acceptance criterion of this kickoff`);
  }
  return out;
}

/** The review record of a task, by its kickoff's file name: the parsed file, null when there is none, or { unreadable: true }. */
export function readReviewRecord(file, root = ROOT) {
  const task = /_Task_(\d+)_/.exec(file)?.[1];
  if (!task) return null;
  const f = path.join(root, REVIEWS, `Task_${task}.json`);
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return { unreadable: true }; }
}

const RECORD_FIELDS = { met: ['verdict', 'quotes', 'evidence'], finding: ['verdict', 'finding', 'note'], 'not applicable': ['verdict', 'reason'] };

/** Findings for the review record of a kickoff with a written verdict; `extra` = sheets the diff triggers. */
export function checkReview(body, registry, controls, extra = [], { root = ROOT, text = sheetText, record = null } = {}) {
  const out = [];
  const add = (line, message) => out.push({ id: 'owasp-review', line, message });
  const review = section(body, '## Review') ?? [];
  if (!review.some((l) => /\b(APPROVED|NEEDS REVISION)\b/.test(l.text))) return out; // no verdict written yet
  const legacy = section(body, '### OWASP check');
  if (legacy) add(legacy[0]?.line, `"### OWASP check" no longer belongs in the kickoff: the verdicts go to ${REVIEWS}/Task_<n>.json`);
  const task = /^# Task (\d+) —/.exec(body)?.[1];
  if (!record) { add(review[0]?.line, `the review has no record ${REVIEWS}/Task_${task}.json: a verdict per sheet of "## OWASP" and of the diff (owasp.mjs review)`); return out; }
  if (record.unreadable) { add(review[0]?.line, `${REVIEWS}/Task_${task}.json is not valid JSON`); return out; }
  if (String(record.task) !== String(task)) add(review[0]?.line, `the review record is for Task ${record.task}, this kickoff is Task ${task}`);
  const reviewText = review.map((l) => l.text).join('\n');
  const entries = Object.entries(record.sheets ?? {});
  const named = new Set(entries.map(([sheet]) => sheet));
  const kick = sheetItems(section(body, '## OWASP') ?? []).map((i) => i.sheet);
  const sha = Object.fromEntries((registry?.sheets ?? []).map((s) => [s.name, s]));
  const line = review[0]?.line;
  for (const r of new Set([...kick, ...extra])) if (!named.has(r)) add(line, `no verdict for ${r}${extra.includes(r) ? ' (triggered by the diff)' : ''}`);
  for (const [sheet, v] of entries) {
    if (!sha[sheet]) { add(line, `${sheet} is not a sheet of the registry`); continue; }
    if (controls?.sheets?.[sheet]?.reviewedSha !== sha[sheet].sha) add(line, `${sheet}: mapping not read at the current version`);
    const fields = RECORD_FIELDS[v?.verdict];
    if (!fields) { add(line, `${sheet}: verdict must be "met", "finding" or "not applicable"`); continue; }
    for (const k of Object.keys(v)) if (!fields.includes(k)) add(line, `${sheet}: field "${k}" does not belong to a "${v.verdict}" verdict`);
    if (v.verdict === 'met') {
      const qs = (Array.isArray(v.quotes) ? v.quotes : []).filter((q) => String(q).trim().split(/\s+/).length >= MIN_QUOTE_WORDS);
      if (!qs.length) add(line, `${sheet}: "met" needs the quote it was checked against, at least ${MIN_QUOTE_WORDS} words`);
      for (const q of qs) {
        const f = quoteFound(q, text(sheet, root));
        if (f === null) add(line, `${sheet}: sheet text not cached — run node scripts/quality/owasp.mjs sync`);
        else if (!f) add(line, `${sheet}: quote not found in the sheet: "${q.slice(0, 60)}"`);
      }
      if (!/`[^`]+`|\b[\w./-]+\.(ts|tsx|mjs|sql|yml):\d+/.test(v.evidence ?? '')) add(line, `${sheet}: "met" needs its evidence (a test, a command or path:line)`);
    }
    if (v.verdict === 'finding') {
      if (!/^F\d+$/.test(v.finding ?? '')) add(line, `${sheet}: a finding names its number, "F<n>"`);
      else if (!new RegExp(`^${v.finding} —`, 'm').test(reviewText)) add(line, `${sheet}: ${v.finding} is not in the findings of "## Review"`);
    }
    if (v.verdict === 'not applicable' && String(v.reason ?? '').trim().split(/\s+/).filter(Boolean).length < 5) add(line, `${sheet}: "not applicable" needs a reason of at least five words`);
  }
  return out;
}

/** The last verdict written in a kickoff's "## Review" (a later review supersedes an earlier one), or null. */
export function lastVerdict(body) {
  const text = (section(body, '## Review') ?? []).map((l) => l.text).join('\n');
  const all = [...text.matchAll(/\b(APPROVED WITH NOTES|APPROVED|NEEDS REVISION)\b/g)];
  return all.length ? all[all.length - 1][1] : null;
}

/**
 * The task gate on a change (CI, every pull request and every push to main). Owner request 2026-11-07: the reference
 * holds every task, the ones that exist and every one created later, and no change bypasses it. A change of anything
 * but documentation lands only through a task: the change carries at least one kickoff whose last verdict is APPROVED,
 * each approved review passes its record, and together those records give a verdict on every sheet the diff itself
 * triggers. `kickoffs` are the kickoffs the change adds or edits, `{ file, body, record }`. A dependency update that
 * changes versions only (`dependencyOnly`) is held by the dependency gates instead (npm audit, install scripts, SBOM,
 * zizmor) and needs no task.
 */
export function checkGate({ files, added = '', kickoffs = [], registry, controls, dependencyOnly = false, root = ROOT, text = sheetText }) {
  const out = [];
  const add = (id, at, message) => out.push({ id, at, message });
  const changed = files.filter((f) => !DOCUMENTATION.test(f));
  if (!changed.length || dependencyOnly) return out;
  const task = (k) => /_Task_(\d+)_/.exec(k.file)?.[1];
  const approved = kickoffs.filter((k) => /^APPROVED/.test(lastVerdict(k.body) ?? ''));
  if (!approved.length) {
    add('G1', changed[0], `${changed.length} file(s) of code or configuration change without a task approved by review in the same change: design it (create-task), implement it, review it (review-task) and commit the review with the change`);
    return out;
  }
  const covered = new Set();
  let surface = false;
  for (const k of approved) {
    if (OWASP_GRANDFATHERED.has(task(k))) continue;
    surface ||= surfaceChanged(k.body);
    for (const f of checkReview(k.body, registry, controls, [], { root, text, record: k.record ?? null })) add('G2', `${k.file}${f.line ? `:${f.line}` : ''}`, f.message);
    for (const s of Object.keys(k.record?.sheets ?? {})) covered.add(s);
  }
  for (const s of triggered(controls, { text: added, paths: changed, surfaceChanged: surface })) {
    if (!covered.has(s)) add('G3', s, `the diff triggers ${s}, and no approved review record of this change gives it a verdict`);
  }
  return out;
}

const PIN = /^\s*(-\s*)?uses:\s*[\w./-]+@[0-9a-f]{40}(\s+#.*)?$/;
/** A version-only dependency update: the manifests' dependency maps, the lockfile and full-SHA action pins change,
 *  nothing else (a script, a new key, a workflow step all count as code). `show(ref, file)` reads a file at a ref. */
export function isDependencyOnly(files, diffLines, show, base) {
  const allowed = /^(package\.json|package-lock\.json|\.github\/workflows\/[^/]+\.ya?ml)$/;
  if (!files.length || !files.every((f) => allowed.test(f))) return false;
  for (const f of files.filter((x) => x.startsWith('.github/'))) {
    if (!(diffLines[f] ?? []).every((l) => PIN.test(l) || /^\s*(#.*)?$/.test(l))) return false;
  }
  if (files.includes('package.json')) {
    const strip = (s) => { const j = JSON.parse(s); for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides']) delete j[k]; return JSON.stringify(j); };
    try { if (strip(show(base, 'package.json')) !== strip(show('HEAD', 'package.json'))) return false; } catch { return false; }
  }
  return true;
}

// ── upstream ────────────────────────────────────────────────────────────────────────────────────────────────────────

async function getJson(url) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const r = await fetch(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'lero-al-owasp-sync', ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

async function readUpstream() {
  const commit = await getJson(`https://api.github.com/repos/${UPSTREAM}/commits/master`);
  const list = await getJson(`https://api.github.com/repos/${UPSTREAM}/contents/cheatsheets?ref=${commit.sha}`);
  const sheets = list.filter((f) => f.type === 'file' && /\.md$/.test(f.name)).map((f) => {
    const name = f.name.replace(SUFFIX, '');
    return { name, file: f.name, url: `${SITE}${f.name.replace(/\.md$/, '.html')}`, sha: f.sha };
  }).sort((a, b) => a.name.localeCompare(b.name));
  return { source: `https://github.com/${UPSTREAM}`, site: 'https://cheatsheetseries.owasp.org/index.html', commit: commit.sha, fetchedOn: new Date().toISOString(), sheets };
}

/** Git's object id of a file's bytes: the `sha` the GitHub contents API gives for each sheet. SHA-1 here is Git's
 *  content address of the pinned commit's tree, used to prove the download is that blob, not a hash chosen for a secret. */
export function gitBlobSha(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

/** The bytes of a regular file, or null; one descriptor serves the type check and the read (CodeQL js/file-system-race). */
function readRegular(abs) {
  let fd;
  try {
    fd = openSync(abs, 'r');
    return fstatSync(fd).isFile() ? readFileSync(fd) : null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

const GIT_ID = /^[0-9a-f]{40}$/;
const SHEET_NAME = /^[A-Za-z0-9_-]+$/;
const SHEET_FILE = /^[A-Za-z0-9_-]+\.md$/;

/** Task 963 AC10: the cache holds exactly the blobs of the registry's commit. The request URL is built only from a Git
 *  id and a plain file name, checked before any request; a download is written only when its blob id equals the
 *  registry's `sha`; a cached file is kept only while it still is that blob, so a drifted cache is downloaded again. */
export async function refreshCache(reg, root = ROOT, get = fetch) {
  if (!GIT_ID.test(String(reg?.commit ?? ''))) throw new Error('registry commit refused: not a 40-hex Git id');
  for (const s of reg.sheets ?? []) {
    if (!SHEET_NAME.test(String(s.name ?? '')) || !SHEET_FILE.test(String(s.file ?? '')) || !GIT_ID.test(String(s.sha ?? ''))) {
      throw new Error(`registry sheet refused: name, file or blob id of another shape (${JSON.stringify(s.name)})`);
    }
  }
  const dir = path.join(root, CACHE);
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const s of reg.sheets) {
    const target = path.join(dir, `${s.name}.md`);
    const cached = readRegular(target);
    if (cached && gitBlobSha(cached) === s.sha) continue;
    const r = await get(`https://raw.githubusercontent.com/${UPSTREAM}/${reg.commit}/cheatsheets/${s.file}`);
    if (!r.ok) throw new Error(`${s.file}: HTTP ${r.status}`);
    const bytes = Buffer.from(await r.arrayBuffer());
    if (gitBlobSha(bytes) !== s.sha) throw new Error(`${s.file}: the download does not match the registry's blob ${s.sha}; not written`);
    writeFileSync(target, bytes);
    n++;
  }
  for (const s of reg.sheets) if (!s.title) s.title = (/^#\s+(.+)$/m.exec(readRegular(path.join(dir, `${s.name}.md`))?.toString('utf8') ?? '') ?? [])[1]?.trim();
  return n;
}

export function diffRegistry(before, after) {
  const b = Object.fromEntries((before?.sheets ?? []).map((s) => [s.name, s.sha]));
  const a = Object.fromEntries((after?.sheets ?? []).map((s) => [s.name, s.sha]));
  return {
    added: Object.keys(a).filter((n) => !(n in b)),
    removed: Object.keys(b).filter((n) => !(n in a)),
    changed: Object.keys(a).filter((n) => n in b && a[n] !== b[n]),
  };
}

// ── main ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function print(findings) {
  for (const f of findings) console.log(`${f.id} ${f.at ?? ''}${f.line ? `:${f.line}` : ''} ${f.message}`);
}

/** The candidate against <base>: committed and uncommitted changes since the merge base, untracked files included.
 *  The words of the added lines count only outside documentation (a review written into a kickoff triggers nothing). */
function changedFiles(base) {
  const run = (args) => {
    const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 28 });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
    return r.stdout;
  };
  const mb = run(['merge-base', base, 'HEAD']).trim();
  const files = [...new Set([...run(['diff', '--name-only', mb]).split('\n'), ...run(['ls-files', '--others', '--exclude-standard']).split('\n')].filter(Boolean))];
  // Documentation is not the change: its words (the mapping itself holds every trigger) would require every sheet.
  const added = run(['diff', mb, '--unified=0', '--', '.', ':(exclude)*.md', ':(exclude)docs', ':(exclude)tasks', ':(exclude)LICENSE']).split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  return { files, added };
}

/** Why each sheet is required: the first path or word of the text that triggered it. */
export function triggerReasons(controls, { text = '', paths = [], surfaceChanged = false }) {
  const out = {};
  for (const name of triggered(controls, { text, paths, surfaceChanged })) {
    const c = controls.sheets[name];
    if (c.always) { out[name] = c.always === 'every-task' ? 'every task' : 'the attack surface changes'; continue; }
    const p = (c.triggers?.paths ?? []).map((re) => paths.find((f) => new RegExp(re).test(f))).find(Boolean);
    if (p) { out[name] = `path ${p}`; continue; }
    const w = (c.triggers?.words ?? []).map((re) => new RegExp(re, 'i').exec(text)?.[0]).find(Boolean);
    out[name] = `word "${w}"`;
  }
  return out;
}

/** A draft "## OWASP" section for a kickoff: every required sheet, why, and the mapped requirements to choose from. */
export function kickoffPlan(body, controls, task) {
  const head = ['## Goal', '## Scope', '## Attack surface'].map((h) => (section(body, h) ?? []).map((l) => l.text).join('\n')).join('\n');
  const reasons = triggerReasons(controls, { text: head, paths: pathsIn(head), surfaceChanged: surfaceChanged(body) });
  const lines = ['## OWASP', ''];
  for (const [name, why] of Object.entries(reasons)) {
    lines.push(`- ${name}: <"quote" — how — AC<n> | not applicable — reason>   (required by ${why})`);
    for (const r of controls.sheets[name].requirements ?? []) {
      const owner = r.task ? (String(r.task) === String(task) ? 'HANDED TO THIS TASK: cite it' : `Task ${r.task}`) : `${r.control}`;
      lines.push(`    · "${r.quote}" [${owner}]`);
    }
  }
  return lines.join('\n');
}

async function main(argv) {
  const cmd = argv[0];
  const registry = loadJson(REGISTRY);
  const controls = loadJson(CONTROLS);
  if (cmd === 'sync') {
    const fresh = await readUpstream();
    const delta = diffRegistry(registry, fresh);
    const n = await refreshCache(fresh);
    console.log(`owasp sync: ${fresh.sheets.length} sheets at ${fresh.commit.slice(0, 12)}; ${n} downloaded; added ${delta.added.length}, changed ${delta.changed.length}, removed ${delta.removed.length}`);
    for (const k of ['added', 'changed', 'removed']) for (const s of delta[k]) console.log(`  ${k}: ${s}`);
    const differs = !registry || delta.added.length + delta.changed.length + delta.removed.length > 0;
    // Upstream was read now: the age rule (O1) counts from this run, so an unchanged registry needs no commit.
    // Only the local time of this read is kept (lastRead reads checkedOn alone); no upstream data goes into the marker.
    writeFileSync(path.join(ROOT, CACHE, VERIFIED), `${JSON.stringify({ checkedOn: new Date().toISOString() })}\n`);
    if (argv.includes('--verify')) {
      if (differs) console.log(`owasp sync: upstream differs from ${REGISTRY}: run node scripts/quality/owasp.mjs sync, re-read the listed sheets, update ${CONTROLS}`);
      return differs ? 1 : 0;
    }
    // The registry is rewritten only when a sheet is added, changed or removed: no churn from unrelated upstream commits.
    if (differs) writeFileSync(path.join(ROOT, REGISTRY), `${JSON.stringify(fresh, null, 1)}\n`);
    const f = checkMapping(differs ? fresh : registry, controls);
    print(f);
    return f.length ? 1 : 0;
  }
  if (cmd === 'cache') {
    // The texts of the committed registry, for a job that verifies quotes without judging upstream (the task gate).
    const n = await refreshCache(registry);
    console.log(`owasp cache: ${registry.sheets.length} sheets at ${registry.commit.slice(0, 12)}; ${n} downloaded`);
    return 0;
  }
  if (cmd === 'gate') {
    const i = argv.indexOf('--base');
    const base = i >= 0 ? argv[i + 1] : 'main';
    const { files, added } = changedFiles(base);
    const git = (args) => {
      const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 28 });
      if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${r.stderr}`);
      return r.stdout;
    };
    const mb = git(['merge-base', base, 'HEAD']).trim();
    const diffLines = {};
    for (const f of files.filter((x) => x.startsWith('.github/'))) diffLines[f] = git(['diff', mb, '--unified=0', '--', f]).split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)).map((l) => l.slice(1));
    const dependencyOnly = isDependencyOnly(files, diffLines, (ref, f) => (ref === 'HEAD' ? readFileSync(path.join(ROOT, f), 'utf8') : git(['show', `${ref}:${f}`])), mb);
    const kickoffs = files.filter((f) => /^tasks\/Sprints\/Sprint_\d+_kickoff_prompt_Task_\d+_.+\.md$/.test(f) && existsSync(path.join(ROOT, f)))
      .map((file) => ({ file, body: readFileSync(path.join(ROOT, file), 'utf8'), record: readReviewRecord(file) }));
    const f = checkGate({ files, added, kickoffs, registry, controls, dependencyOnly });
    print(f);
    const code = files.filter((x) => !DOCUMENTATION.test(x)).length;
    console.log(f.length ? `owasp gate: ${f.length} finding(s)` : `owasp gate: ${files.length} changed file(s), ${code} of code or configuration; ${dependencyOnly ? 'a version-only dependency update, held by the dependency gates' : code ? `held by the approved review(s) of ${kickoffs.filter((k) => /^APPROVED/.test(lastVerdict(k.body) ?? '')).map((k) => /_Task_(\d+)_/.exec(k.file)[1]).join(', ')}` : 'documentation only'}`);
    return f.length ? 1 : 0;
  }
  if (cmd === 'check') {
    const f = checkMapping(registry, controls, { files: repositoryFiles() });
    print(f);
    const applicable = Object.values(controls?.sheets ?? {}).filter((c) => c.applies).length;
    console.log(f.length ? `owasp check: ${f.length} finding(s)` : `owasp check: ${registry.sheets.length} sheets mapped (${applicable} apply), every one read at its current version, every quote verified`);
    return f.length ? 1 : 0;
  }
  if (cmd === 'plan') {
    const file = argv[1];
    console.log(kickoffPlan(readFileSync(path.join(ROOT, file), 'utf8'), controls, /_Task_(\d+)_/.exec(file)?.[1]));
    return 0;
  }
  if (cmd === 'kickoff') {
    let n = 0;
    for (const file of argv.slice(1)) {
      if (OWASP_GRANDFATHERED.has(/_Task_(\d+)_/.exec(file)?.[1])) { console.log(`${file}: approved before the OWASP gate (OWASP_GRANDFATHERED), not held to it`); continue; }
      const f = checkKickoff(readFileSync(path.join(ROOT, file), 'utf8'), registry, controls).map((x) => ({ ...x, at: file }));
      print(f); n += f.length;
    }
    return n ? 1 : 0;
  }
  if (cmd === 'review') {
    const file = argv[1];
    const i = argv.indexOf('--base');
    const base = i >= 0 ? argv[i + 1] : 'main';
    const { files, added } = changedFiles(base);
    const extra = triggered(controls, { text: added, paths: files, surfaceChanged: false });
    console.log(`owasp review: the diff against ${base} (${files.length} files) triggers: ${extra.join(', ') || 'none'}`);
    const f = checkReview(readFileSync(path.join(ROOT, file), 'utf8'), registry, controls, extra, { record: readReviewRecord(file) }).map((x) => ({ ...x, at: file }));
    print(f);
    return f.length ? 1 : 0;
  }
  console.error('usage: owasp.mjs sync [--verify] | cache | check | plan <kickoff> | kickoff <file..> | review <kickoff> [--base <ref>] | gate [--base <ref>]');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, (e) => { console.error(`owasp: ${e.message}`); process.exitCode = 2; });
}
