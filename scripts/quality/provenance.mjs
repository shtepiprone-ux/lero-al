#!/usr/bin/env node
// The source of every result a reply states (owner, 2026-11-10: "why don't you make a tool that records whether it is
// CI or a local run, so we avoid the confusion"). "17 failing tests in 7 files" reads the same for a CI job and for a
// local run; words cannot tell them apart, so the reply says it and the Stop hook checks it against what happened:
//
//   [CI: PR #28]                 the result is CI's: this turn ran `pipeline.mjs ci-status 28` and the reply carries
//                                its line (pipeline.mjs stop)
//   [локально: `npm test`]       the result is a local run: this turn ran a shell command that contains `npm test`
//   [local: `npm test`]          the same in English
//   [pipeline: handoff]          the result is a pipeline phase: its ledger is complete for the files as they are
//
// A line that states a result (a status word about checks or tests, a count such as 21/21 or "5 з 6", an exit code)
// and carries no source, or a source this turn does not back, is a finding. Code blocks are not read.
//
// OWASP basis: Verifying Third Party Agent Execution Evidence (a claim is tied to the evidence that backs it), AI Agent
// Security (an agent's report is checked by code).

const STATUS = /\b(?:green|red|pass(?:ed|es|ing)?|fail(?:ed|s|ing|ures?)?|success(?:ful)?|broken|flaky|clean)\b|зелен|червон|пройш|пройд|провал|впа[вл]|упа[вл]|пада[єю]|падінн|успішн|зламан/iu;
const CONTEXT = /\b(?:checks?|jobs?|runs?|workflows?|pipelines?|builds?|lint|tests?|suites?|gates?|cases?|deploy(?:ment)?s?|typecheck|ESLint|CodeQL|audit)\b|перевірк|джоб|прогін|прогон|гейт|тест|збірк|кейс|набір|лінт/iu;
const COUNT = /(?<![\p{L}\d.])\d+\s*(?:\/|з|із|of|out of)\s*\d+(?![\p{L}\d])|(?<![\p{L}\d])(?:exit(?: code)?|код(?:ом)?)\s*[=:]?\s*\d+(?!\d)|(?<![\p{L}\d])\d+\s+(?:passed|failed|failures?|пройшл\w*|впал\w*|падін\w*|провален\w*)/iu;
const TAG = /\[(CI|локально|local|pipeline)(?::\s*([^\]]+))?\]/giu;

/** The result lines of a reply, outside fenced code: { line, text, tags: [{ kind, value }] }. */
export function resultLines(reply) {
  const out = [];
  let fenced = false;
  String(reply).split(/\r?\n/).forEach((raw, i) => {
    if (/^\s*```/.test(raw)) { fenced = !fenced; return; }
    if (fenced) return;
    const text = raw.trim();
    const isResult = (STATUS.test(text) && CONTEXT.test(text)) || (COUNT.test(text) && (CONTEXT.test(text) || STATUS.test(text)));
    if (!isResult) return;
    const tags = [...text.matchAll(TAG)].map((m) => ({ kind: m[1].toLowerCase() === 'local' ? 'локально' : m[1].toLowerCase() === 'ci' ? 'CI' : m[1].toLowerCase(), value: (m[2] ?? '').trim() }));
    out.push({ line: i + 1, text, tags });
  });
  return out;
}

const squash = (s) => String(s).replace(/`/g, '').replace(/\s+/g, ' ').trim();

// Numbers of a result line that must be observed (OWASP Verifying Third Party Agent Execution Evidence: "Reconcile
// supplier reports with observations you control when possible"). Not counted: code spans and source tags, PR and issue
// references, dates, commit hashes, identifiers such as B38, AC5 or R10, and exit codes (checked on their own).
// \b is ASCII-only even with the u flag, so Cyrillic words are bounded by Unicode letter look-arounds
const EXIT = /(?<![\p{L}\d])(?:exit(?: code)?|код(?:ом)?)\s*[=:]?\s*(\d+)(?!\d)/giu;

/** The numbers a result line states, digit groups joined ("14 776" → 14776); exit codes apart. */
export function numbersOf(text) {
  const exits = [...String(text).matchAll(EXIT)].map((m) => Number(m[1]));
  const body = String(text)
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ' ') // a Markdown list marker ("1." numbers the item, not a result)
    .replace(/`[^`]*`/g, ' ').replace(TAG, ' ').replace(EXIT, ' ')
    .replace(/#\s*\d+/g, ' ').replace(/\b\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?\b/g, ' ')
    .replace(/\b(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/g, ' ').replace(/(?<![\p{L}\d_])[\p{L}_]+-?\d+[\p{L}\d]*/gu, ' ')
    .replace(/(\d{1,3})(?:[ \u00a0\u202f](\d{3}))+(?!\d)/g, (m) => m.replace(/[ \u00a0\u202f]/g, ''));
  const nums = [...body.matchAll(/(?<![\d.])\d+(?:[.,]\d+)?(?![\d])/g)].map((m) => m[0].replace(',', '.'));
  return { nums: [...new Set(nums)], exits };
}

/** True when the observed output holds the number as a number (thousand separators in the output ignored). */
export function observed(num, output) {
  const flat = String(output).replace(/(\d)[,\u00a0\u202f ](?=\d{3}(?!\d))/g, '$1');
  return new RegExp(`(?<![\\d.])${num.replace('.', '[.,]')}(?![\\d])`).test(flat);
}

/**
 * Why the reply's results are not backed, [] when every one is. What is checked, and its limits (the sheet: "Record
 * the trust assumptions and limits alongside each result"): a source tag names a run of this turn, and every number
 * of the line appears in what that run printed, as Claude Code recorded it (tool_result), or in GitHub's answer
 * (ci-status) or in the phase's ledger summaries. This shows the numbers were observed, not that they mean what the
 * sentence says, and the transcript lives on the same machine as the agent; CI and the reviewer's rerun stay the
 * authority.
 * @param {object} s
 * @param {string} s.reply
 * @param {Array<{command:string, output:string, error:boolean}>} s.runs  this turn's shell runs and their recorded output
 * @param {(pr:string|null) => object|null} s.ciStatus  this turn's ci-status record of the PR (or the newest), or null
 * @param {(phase:string) => boolean} s.phaseComplete   a ledger of the phase is complete for the files as they are
 * @param {(phase:string) => string} s.phaseOutput      the step summaries of that ledger
 */
export function provenanceFindings({ reply, runs = [], commands = [], ciStatus = () => null, phaseComplete = () => false, phaseOutput = () => '' }) {
  const out = [];
  const all = [...runs, ...commands.map((c) => ({ command: c, output: null, error: false }))];
  const ran = all.map((r) => ({ ...r, flat: squash(r.command) }));
  const unobserved = (r, source, output, where) => {
    const { nums } = numbersOf(r.text);
    if (output === null) { out.push(`${where}: the output of ${source} is not recorded in this turn, so its numbers cannot be checked (a missing record is no evidence)`); return; }
    const miss = nums.filter((n) => !observed(n, output));
    if (miss.length) out.push(`${where} states ${miss.join(', ')}, which ${source} did not print in this turn`);
  };
  for (const r of resultLines(reply)) {
    const where = `line ${r.line} ("${r.text.slice(0, 80)}")`;
    // the ci-status line itself is its own source when this turn's record holds exactly it
    const own = /\bCI [0-9a-f]{7,40} PR #(\d+):/.exec(r.text);
    const record = own ? ciStatus(own[1]) : null;
    if (record && r.text.includes(record.line)) continue;
    if (!r.tags.length) { out.push(`${where} states a result without its source: add [CI: PR #<n>], [локально: \`<command>\`] or [pipeline: <phase>]`); continue; }
    for (const t of r.tags) {
      if (t.kind === 'CI') {
        const pr = /#?\s*(\d+)/.exec(t.value)?.[1] ?? null;
        const st = ciStatus(pr);
        if (!st) out.push(`${where} says CI${pr ? ` (PR #${pr})` : ''}, but this turn ran no \`node scripts/quality/pipeline.mjs ci-status${pr ? ` ${pr}` : ''}\``);
        else if (!String(reply).includes(st.line)) out.push(`${where} says CI, but the reply does not carry the ci-status line "${st.line}"`);
        else {
          // GitHub's answer as this turn saw it: the ci-status record and the output of the turn's CI commands
          const ciRuns = ran.filter((x) => /\bgh\s+(?:pr|run|api)\b|pipeline\.mjs\s+ci-status/.test(x.command));
          unobserved(r, 'ci-status and the CI commands', [st.line, ...ciRuns.map((x) => x.output ?? '')].join('\n'), where);
        }
      } else if (t.kind === 'локально') {
        const cmd = squash(t.value);
        const matching = ran.filter((x) => x.flat.includes(cmd));
        if (cmd.length < 3) out.push(`${where} says local without the command: [локально: \`<command>\`]`);
        else if (!matching.length) out.push(`${where} says local \`${cmd}\`, but no shell command of this turn contains it`);
        else {
          const recorded = matching.filter((x) => x.output !== null);
          unobserved(r, `\`${cmd}\``, recorded.length ? recorded.map((x) => x.output).join('\n') : null, where);
          for (const code of numbersOf(r.text).exits) {
            const ok = code === 0 ? recorded.some((x) => !x.error) : recorded.some((x) => x.error && new RegExp(`\\b(?:Exit code|exit=?)\\s*${code}\\b`, 'i').test(x.output));
            if (!ok) out.push(`${where} states exit ${code}, which no recorded run of \`${cmd}\` in this turn ended with`);
          }
        }
      } else if (t.kind === 'pipeline') {
        const phase = t.value.split(/\s+/)[0];
        if (!phaseComplete(phase)) out.push(`${where} says pipeline ${phase}, but no complete ${phase} ledger matches the files as they are`);
        else unobserved(r, `the ${phase} ledger`, phaseOutput(phase), where);
      }
    }
  }
  return out;
}
