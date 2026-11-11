#!/usr/bin/env node
// Which replies state a CI result, kept current with the way replies are actually worded (owner, 2026-11-10: "claims
// can change, so a tool that keeps the tests up to date is needed").
//
// 1. The Stop hook (pipeline.mjs stop) asks for this turn's ci-status line when the reply names a PR, CI, a run, a job or
//    any check (`mentionsCi`: the job names are read from .github/workflows/ci.yml, so the vocabulary follows CI), OR
//    when the turn looked at CI through a tool (`CI_TOOL`): the second test does not depend on wording at all.
// 2. The corpus holds real final replies of turns that looked at CI. It stays on this machine, in the Git directory
//    (<git dir>/lero-al-pipeline/claims-corpus.json: transcripts may hold private text, so it is never committed, and the
//    file tools cannot write there). The label comes from that behaviour, not from a person: a reply caught by
//    `mentionsCi` is stored as `ci`; one it misses is stored `unlabeled` until it is judged with `label`: `ci` (then
//    `check` fails until `mentionsCi` catches its wording, so the same words in a turn that did not look at CI are caught
//    too), `none` (the turn looked at CI, the reply states no CI result) or `ambiguous` (a result whose words cannot say
//    CI or local; only the turn rule catches it).
// 3. `check` (a step of the review and handoff phases) harvests new replies from this project's Claude Code transcripts
//    first, so the corpus follows every session; SessionStart (`start`) reports what is new. The committed
//    claims.test.mjs holds synthetic cases written from these patterns, so CI tests the detector too.
//
//   node scripts/quality/claims.mjs check                   harvest, then exit 1 while an entry is unlabeled or a ci entry is missed
//   node scripts/quality/claims.mjs label <id> <ci|none|ambiguous> <reason>
//   node scripts/quality/claims.mjs list [unlabeled|ci|none|ambiguous]
//   node scripts/quality/claims.mjs start                   SessionStart context

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';
import { resultLines } from './provenance.mjs';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MAX_TEXT = 2000;
export const LABELS = ['ci', 'none', 'ambiguous'];
/** Checks a PR carries that ci.yml does not define (GitHub apps and code scanning). */
export const EXTERNAL_CHECKS = ['CI Required', 'Vercel', 'Vercel Preview Comments', 'CodeQL'];
/** First words of job names that are ordinary words, so they alone do not name a check. */
const COMMON = new Set(['every', 'unit', 'change', 'secret', 'workflow', 'dependency', 'authorization', 'homepage', 'locale', 'storybook']);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every name a reply can use for a check: job ids, job names, the tools in parentheses, distinctive first words. */
export function ciVocabulary(doc) {
  const names = new Set(EXTERNAL_CHECKS);
  for (const [id, job] of Object.entries(doc?.jobs ?? {})) {
    if (id.includes('-')) names.add(id); // locale-leak, homepage-grid, click-shield, owasp-gate …
    const name = String(job.name ?? '').replace(/\s*\(\$\{\{[^}]*\}\}\/\d+\)|\$\{\{[^}]*\}\}/g, '').trim();
    if (!name) continue;
    names.add(name);
    for (const m of name.matchAll(/\(([^)]+)\)/g)) for (const t of m[1].split(/,\s*/)) if (/^[\w-]{4,}$/.test(t.trim())) names.add(t.trim());
    const bare = name.replace(/\s*\([^)]*\)/g, '').trim();
    names.add(bare);
    const first = bare.split(/[\s,]+/)[0];
    if (first && first.length >= 4 && !COMMON.has(first.toLowerCase())) names.add(first);
  }
  return [...names].filter(Boolean).sort((a, b) => b.length - a.length);
}

export function loadVocabulary(root = ROOT) {
  return ciVocabulary(require('js-yaml').load(readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8')));
}

const PR_MENTION = /\b(?:PR|pull request)\s*#?\s*\d+\b|\bPR\s*#|\bpull[- ]requests?\b|пул-?\s?реквест|пулл-?\s?реквест/i;
const CI_WORD = /(?<![\p{L}\d])CI(?![\p{L}\d])/u;
// a GitHub run id (11 digits today), shards of a matrix job, and jobs named as such
const RUN_MENTION = /\bgh\s+(?:run|pr\s+checks|workflow)\b|(?<![\p{L}\d])\d{10,12}(?![\p{L}\d])|\bactions\/runs\/\d+|\bshards?\b|шард|\bjobs?\b|джоб/iu;
/** True for a shell tool call (Bash, PowerShell) whose command looks at CI; file writes that merely contain such text do not count. */
export function looksAtCi(block) {
  return block?.type === 'tool_use' && typeof block.input?.command === 'string' && CI_TOOL.test(block.input.command);
}

/** Commands that look at CI; a turn that ran one is about CI whatever its reply says. */
export const CI_TOOL = /\bgh\s+(?:pr\s+(?:checks|view|merge)|run\s+(?:view|list|watch|rerun)|api\s+\S*actions)|pipeline\.mjs\s+ci-status/;

/** A vocabulary term as a pattern: case-insensitive, a space or a hyphen between words, whole words only. */
const termPattern = (v) => new RegExp(`(?<![\\p{L}\\d])${v.split(/[\s-]+/).map(escape).join('[\\s-]+')}(?![\\p{L}\\d])`, 'iu');

/** True when the text names a PR, CI, a run, a job or a check; such a reply needs this turn's ci-status line. */
export function mentionsCi(text, vocab) {
  const t = String(text);
  if (PR_MENTION.test(t) || CI_WORD.test(t) || RUN_MENTION.test(t)) return true;
  return vocab.some((v) => termPattern(v).test(t));
}

export function normalise(s) {
  return String(s).replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT).toLowerCase();
}

/** The local corpus file, in the repository's Git directory (never committed). */
export function corpusFile(root = ROOT) {
  const r = spawnSync('git', ['rev-parse', '--git-dir'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) throw new Error('claims: not a Git working tree');
  return path.join(path.resolve(root, r.stdout.trim()), 'lero-al-pipeline', 'claims-corpus.json');
}

export const entryId = (text) => createHash('sha256').update(normalise(text)).digest('hex').slice(0, 12);

export function loadCorpus(root = ROOT) {
  try { return JSON.parse(readFileSync(corpusFile(root), 'utf8')).entries ?? []; } catch { return []; }
}

export function saveCorpus(entries, root = ROOT) {
  const file = corpusFile(root);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ entries }, null, 2)}\n`);
}

/** Problems of a corpus: unlabeled entries, unknown labels, a ci entry mentionsCi misses, a judgement without a reason. */
export function corpusProblems(entries, vocab) {
  const out = [];
  for (const e of entries) {
    const id = e.id ?? entryId(e.text);
    if (e.label === 'unlabeled') out.push(`${id} unlabeled: judge it with \`node scripts/quality/claims.mjs label ${id} <ci|none|ambiguous> <reason>\``);
    else if (!LABELS.includes(e.label)) out.push(`${id} has the unknown label ${e.label}`);
    else if (e.label === 'ci' && !mentionsCi(e.text, vocab)) out.push(`${id} is a CI claim that mentionsCi misses: widen claims.mjs (a test case in claims.test.mjs first)`);
    // a result whose words cannot say CI or local must at least be read as a result, so it needs its source tag
    else if (e.label === 'ambiguous' && !resultLines(e.text).length) out.push(`${id} is an ambiguous result that provenance.mjs does not read as a result: widen resultLines (a case in provenance.test.mjs first)`);
    else if (e.label !== 'ci' && String(e.reason ?? '').split(/\s+/).filter(Boolean).length < 5) out.push(`${id} (${e.label}) needs a reason of at least five words`);
  }
  return out;
}

/** This project's Claude Code transcript directories, in every local configuration directory. */
export function transcriptDirs(root = ROOT, home = os.homedir()) {
  const slug = path.resolve(root).replace(/[^A-Za-z0-9]/g, '-');
  const base = path.basename(path.resolve(root)).replace(/[^A-Za-z0-9]/g, '-');
  const out = [];
  for (const cfg of readdirSync(home).filter((d) => /^\.claude/.test(d))) {
    const projects = path.join(home, cfg, 'projects');
    if (!existsSync(projects)) continue;
    for (const d of readdirSync(projects)) if (d === slug || d.endsWith(`-${base}`)) out.push(path.join(projects, d));
  }
  return out;
}

/**
 * True for a transcript entry the owner typed. A Stop hook's feedback, tool results and other injected entries are not:
 * the feedback is stored as a user entry with isMeta (2026-11-10), and counting it as a new turn hid every command
 * the turn had run before the hook refused its reply.
 */
export function isOwnerMessage(e) {
  if (e?.type !== 'user' || e.isMeta) return false;
  const c = e.message?.content;
  return typeof c === 'string' || (Array.isArray(c) && c.some((b) => b.type === 'text'));
}

/** The turns of a transcript (JSONL text): the final reply of each and whether a tool call of the turn looked at CI. */
export function turnsOf(jsonl) {
  const out = [];
  let ci = false;
  let reply = '';
  const flush = () => { if (reply) out.push({ reply, ci }); ci = false; reply = ''; };
  for (const line of String(jsonl).split('\n')) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const c = e.message?.content;
    if (isOwnerMessage(e)) { flush(); continue; }
    if (e.type !== 'assistant' || !Array.isArray(c)) continue;
    for (const b of c) {
      if (looksAtCi(b)) ci = true;
      if (b.type === 'text' && b.text) reply = b.text;
    }
  }
  flush();
  return out;
}

/** New corpus entries from transcripts: every final reply of a turn that looked at CI and is not yet in the corpus. */
export function harvest({ root = ROOT, home = os.homedir(), since = 0, corpus = loadCorpus(root), vocab = loadVocabulary(root) } = {}) {
  const known = new Set(corpus.map((e) => normalise(e.text)));
  const out = [];
  for (const dir of transcriptDirs(root, home)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.jsonl')).sort()) {
      // one descriptor for the age check and the read (CodeQL js/file-system-race)
      let text = null;
      let fd;
      try {
        fd = openSync(path.join(dir, f), 'r');
        const st = fstatSync(fd);
        if (st.isFile() && st.mtimeMs >= since) text = readFileSync(fd, 'utf8');
      } catch { text = null; } finally { if (fd !== undefined) closeSync(fd); }
      if (text === null) continue;
      for (const t of turnsOf(text).filter((x) => x.ci)) {
        const reply = t.reply.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
        if (known.has(normalise(reply))) continue;
        known.add(normalise(reply));
        out.push({ id: entryId(reply), text: reply, label: mentionsCi(reply, vocab) ? 'ci' : 'unlabeled', source: `transcript ${f.slice(0, 8)}` });
      }
    }
  }
  return out;
}

if (isEntryPoint(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2);
  const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || ROOT);
  try {
    const vocab = loadVocabulary(root);
    if (mode === 'check') {
      // the corpus follows every session: new replies are added first, then the whole corpus is judged
      const corpus = loadCorpus(root);
      const found = harvest({ root, corpus, vocab });
      const entries = [...corpus, ...found];
      if (found.length) saveCorpus(entries, root);
      const problems = corpusProblems(entries, vocab);
      for (const p of problems) console.log(p);
      const count = (l) => entries.filter((e) => e.label === l).length;
      console.log(`claims: corpus ${entries.length} (${found.length} new): ci ${count('ci')}, none ${count('none')}, ambiguous ${count('ambiguous')}, unlabeled ${count('unlabeled')}; ${problems.length} problem(s)`);
      process.exit(problems.length ? 1 : 0);
    }
    if (mode === 'label') {
      const [id, label, ...why] = rest;
      if (!/^[0-9a-f]{12}$/.test(id ?? '') || !LABELS.includes(label)) throw new Error('usage: label <12-hex id> <ci|none|ambiguous> <reason>');
      const entries = loadCorpus(root);
      const e = entries.find((x) => (x.id ?? entryId(x.text)) === id);
      if (!e) throw new Error(`no corpus entry ${id}`);
      e.label = label;
      e.reason = why.join(' ');
      e.labelledAt = new Date().toISOString();
      saveCorpus(entries, root);
      const p = corpusProblems([e], vocab);
      console.log(p.length ? p.join('\n') : `claims: ${id} labelled ${label}`);
      process.exit(p.length ? 1 : 0);
    }
    if (mode === 'list') {
      for (const e of loadCorpus(root).filter((x) => !rest[0] || x.label === rest[0])) console.log(`${e.id ?? entryId(e.text)} ${e.label} [${e.source}] ${e.text.slice(0, 200)}`);
      process.exit(0);
    }
    if (mode === 'start') {
      const corpus = loadCorpus(root);
      const found = harvest({ root, since: Date.now() - 7 * 86_400_000, corpus, vocab });
      const problems = corpusProblems([...corpus, ...found], vocab);
      const msg = found.length || problems.length
        ? `Claims corpus: recent sessions have ${found.length} reply(ies) of turns that looked at CI not yet in the local corpus (${found.filter((x) => x.label === 'unlabeled').length} the CI-claim check misses); ${problems.length} problem(s). Run \`node scripts/quality/claims.mjs check\`, judge each unlabeled reply with \`claims.mjs label\`, and widen mentionsCi (a case in claims.test.mjs first) for every ci reply it misses; the review and handoff phases fail until then.`
        : 'Claims corpus: every reply of recent turns that looked at CI is in the local corpus, judged and caught.';
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: msg } }));
      process.exit(0);
    }
    console.error('usage: claims.mjs check | label <id> <ci|none|ambiguous> <reason> | list [label] | start');
    process.exit(2);
  } catch (e) {
    console.error(`claims: ${e.message}`);
    process.exit(2);
  }
}
