#!/usr/bin/env node
// Watches a long local run stage by stage (owner, 2026-11-11: "monitor every stage and its status"). A watch that only
// reports error lines is silent through a hang, and silence looks like work: a break run of 2026-11-11 hung for 40
// minutes with no event at all. So this watch reports four things, one line each:
//   STAGE  a stage starts or ends (a section of the run, a pipeline step, a ci-local job or restart)
//   FAIL   a failure line, so it is fixed at once instead of at the end of the run
//   STALL  no file of the run has grown for --stall-min minutes, with the last stage and the newest file
//   END    the run printed its last line; the watch exits
// The files it follows: the run's own output file and the newest ci-local run.log, with that run's step logs (a step
// writes its output to its log while it runs; the load samples are not output and do not count as a sign of life).
//
//   node scripts/quality/stage-watch.mjs <output file> [--stall-min 10] [--every-ms 10000]

import { closeSync, fstatSync, openSync, readdirSync, readSync } from 'node:fs';
import path from 'node:path';
import { isEntryPoint } from '../lib/entry-point.mjs';
import { workRoot } from './ci-local.mjs';

const STAGE = /^== |^caught: |^\[(?:design|execute|review|handoff)\] \S+ (?:…|exit \d+)|^(?:PASS|NOT RUN|CI-ONLY)\t|: timed out, cause \w+ .*; restart \d+ of \d+|stopping a check left by an earlier run|^ci-local (?:[0-9a-f]{12}: |: (?:checkout|base) )|^ci-local: (?:checkout|base) /;
const FAIL = /^not ok \d+|^# fail [1-9]|NOT CAUGHT|: HUNG|ANCHOR MISSING|BASELINE NOT GREEN|^(?:FAIL|UNVERIFIED)\t|^\[\w+\] \S+ exit [1-9]\d* |exit=[1-9]|^ci-local: (?!checkout |base )/;
const END = /^handoff exit=\d+|^== a local check failed: no handoff/;

/** What a line of the run is: 'end', 'fail', 'stage' or null (not reported). A run.log time stamp is ignored. */
export function classify(line) {
  const l = String(line).trim().replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z /, '');
  if (END.test(l)) return 'end';
  if (FAIL.test(l)) return 'fail';
  if (STAGE.test(l)) return 'stage';
  return null;
}

/** How far back a run.log counts as the current run's: a re-armed watch found no log written since it started, so a
 * silent step looked like a silent run (2026-11-11). */
export const LOOKBACK_MS = 6 * 60 * 60_000;

/** A STALL is due when nothing grew for stallMs and none was reported since the last growth. */
export function stallDue({ now, lastGrowth, stallMs, lastAlert }) {
  return now - lastGrowth >= stallMs && lastAlert < lastGrowth;
}

/**
 * A file read through one descriptor: { text, size, mtimeMs }, or null when it cannot be opened. Every read, size and
 * time of this watch comes from here: a path is never checked and then opened again (CodeQL js/file-system-race,
 * ci-local run of 2026-11-11 on this file).
 */
export function readOnce(file, { text = true } = {}) {
  let fd;
  try { fd = openSync(file, 'r'); } catch { return null; }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) return null;
    if (!text) return { text: '', size: st.size, mtimeMs: st.mtimeMs };
    const buf = Buffer.alloc(st.size);
    readSync(fd, buf, 0, buf.length, 0);
    return { text: buf.toString('utf8'), size: st.size, mtimeMs: st.mtimeMs };
  } finally {
    closeSync(fd);
  }
}

const listDir = (dir) => { try { return readdirSync(dir); } catch { return []; } };

/** The newest ci-local run.log written after `since`, as { file, mtimeMs }, or null. */
export function newestRunLog(since, root = workRoot()) {
  const logs = listDir(root).map((d) => path.join(root, d, 'run.log')).map((file) => ({ file, mtimeMs: readOnce(file, { text: false })?.mtimeMs ?? -1 }));
  return logs.filter((l) => l.mtimeMs >= since).sort((a, b) => b.mtimeMs - a.mtimeMs)[0] ?? null;
}

/** The files whose growth is a sign of life: the output, the run.log and that run's step logs. */
function liveFiles(out, runLog) {
  const files = [out];
  if (runLog) {
    files.push(runLog);
    const logs = path.join(path.dirname(runLog), 'logs');
    for (const f of listDir(logs)) if (f.endsWith('.log')) files.push(path.join(logs, f));
  }
  return files;
}

/** The time stamp of a run.log line, or null for a line without one. */
const stampOf = (line) => { const m = /^(\d{4}-\d\d-\d\dT[\d:.]+Z) /.exec(line); return m ? Date.parse(m[1]) : null; };

if (isEntryPoint(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? Number(args.splice(i, 2)[1]) : dflt; };
  const stallMs = opt('--stall-min', 10) * 60_000;
  const every = opt('--every-ms', 10_000);
  // a watch re-armed after the last one expired replays the run.log lines from this time on, so a failure written in
  // the gap between two watches is still reported (a CodeQL FAIL was missed that way on 2026-11-11)
  const replayFrom = opt('--replay-from', null);
  const out = args[0];
  if (!out) { console.error('usage: stage-watch.mjs <output file> [--stall-min 10] [--every-ms 10000] [--replay-from <epoch ms>]'); process.exit(2); }
  const started = Date.now();
  const from = replayFrom ?? started;
  const offsets = new Map();
  let runLog = null;
  let lastStage = 'none yet';
  let lastGrowth = started;
  let lastAlert = 0;
  const sizes = new Map();
  const say = (kind, text) => console.log(`${kind} ${text}`);
  const follow = (file) => {
    const r = readOnce(file);
    if (!r) return [];
    const start = offsets.get(file) ?? 0;
    offsets.set(file, r.text.length);
    return r.text.slice(start).split(/\r?\n/).filter(Boolean);
  };
  const tick = () => {
    // the newest run.log of the last LOOKBACK_MS, every tick: a watch started (or re-armed) while a run is going picks
    // its log at once; lines stamped before `from` are not replayed; a newer run's log replaces it
    const newest = newestRunLog(started - LOOKBACK_MS);
    if (newest && newest.file !== runLog) runLog = newest.file;
    for (const file of [out, runLog].filter(Boolean)) {
      for (const line of follow(file)) {
        if (file === runLog && (stampOf(line) ?? from) < from) continue;
        const kind = classify(line);
        if (!kind) continue;
        if (kind === 'stage') lastStage = line.trim().slice(0, 200);
        say(kind.toUpperCase(), line.trim().slice(0, 300));
        if (kind === 'end') process.exit(0);
      }
    }
    for (const f of liveFiles(out, runLog)) {
      const s = readOnce(f, { text: false })?.size;
      if (s !== undefined && sizes.get(f) !== s) { sizes.set(f, s); lastGrowth = Date.now(); }
    }
    const now = Date.now();
    if (stallDue({ now, lastGrowth, stallMs, lastAlert })) {
      lastAlert = now;
      say('STALL', `no output for ${Math.round((now - lastGrowth) / 60_000)} min; last stage: ${lastStage}`);
    }
  };
  tick();
  setInterval(tick, every);
}
