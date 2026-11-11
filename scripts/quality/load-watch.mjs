#!/usr/bin/env node
// Why a local CI step timed out, and what to do about it (owner, 2026-11-10: "a tool with retries that tracks why the
// timeout happened and acts on the cause: a hang, load, and so on"). The locale-leak shards 3 and 4 of the ci-local run
// of 2026-11-10 each lost one of 720 renders to "page.waitForFunction: Timeout 15000ms exceeded"; the same stories
// passed every rerun, so the cause was the machine at that moment, which nothing had recorded.
//
// While a browser step runs, a sampler (this file as a process) records the CPU use, the free memory and the TCP ports
// in use every SAMPLE_MS. When the step fails with a timeout or a browser network error, `diagnose` reads those samples:
//   load   the CPU or the memory was at its limit           → wait until the machine is calm, then retry
//   ports  the ports in use were at their limit             → wait until they are free, then retry
//   stall  the machine was calm and the step still stalled  → retry at once: a second stall makes it reproducible
// A failure that is not a timeout is never retried; at most MAX_RETRIES retries; every attempt, its cause and its
// samples go into the run's report. CI itself never retries (a fresh machine per job); this is ci-local only.
//
//   node scripts/quality/load-watch.mjs <samples.jsonl> <parent pid>   the sampler; it stops when the parent is gone

import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

export const SAMPLE_MS = 5000;
export const MAX_RETRIES = 2;
export const CPU_HIGH = 90; // % busy over a sample
export const MEM_LOW = 5; // % of memory free
export const PORTS_MAX = 2000; // TCP ports in use (every state but LISTEN)
/** A step's output that says it ran out of time or lost its browser connection. */
export const TIMEOUT = /Timeout \d+ ?ms exceeded|Navigation timeout|net::ERR_[A-Z_]+|ETIMEDOUT|timed out after|job timeout-minutes \d+ exceeded/i;

function netstat() {
  return process.platform === 'win32'
    ? spawnSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 })
    : spawnSync('ss', ['-tanp'], { encoding: 'utf8', maxBuffer: 1 << 26 });
}

/** TCP sockets that hold a local port (every state but LISTEN), or null when they cannot be counted. */
export function portsInUse(out = null) {
  const r = out === null ? netstat() : { status: 0, stdout: out };
  if (r.status !== 0) return null;
  return r.stdout.split(/\r?\n/).filter((l) => /\b(?:ESTABLISHED|TIME_WAIT|TIME-WAIT|CLOSE_WAIT|CLOSE-WAIT|FIN_WAIT_?[12]|FIN-WAIT-[12]|SYN_SENT|SYN-SENT|LAST_ACK|LAST-ACK|CLOSING|ESTAB)\b/.test(l)).length;
}

/** The processes with the most open connections (Windows: PID from netstat, name from tasklist). */
export function connectionHolders(out = null, names = null) {
  const r = out === null ? netstat() : { status: 0, stdout: out };
  if (r.status !== 0) return [];
  const byPid = new Map();
  for (const l of r.stdout.split(/\r?\n/)) {
    const m = /\b(?:ESTABLISHED|CLOSE_WAIT|SYN_SENT)\s+(\d+)\s*$/.exec(l) ?? /users:\(\("([^"]+)",pid=(\d+)/.exec(l);
    if (!m) continue;
    const pid = m[2] ?? m[1];
    byPid.set(pid, (byPid.get(pid) ?? 0) + 1);
  }
  const table = names ?? (process.platform === 'win32' ? spawnSync('tasklist', ['/fo', 'csv', '/nh'], { encoding: 'utf8', windowsHide: true }).stdout ?? '' : '');
  const nameOf = (pid) => new RegExp(`^"([^"]+)","${pid}"`, 'm').exec(table)?.[1] ?? `pid ${pid}`;
  return [...byPid.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([pid, n]) => `${nameOf(pid)} (${pid}): ${n}`);
}

// A check left running by an earlier run holds a browser, ports and CPU while the next run works: a locale-leak shard of
// an agent's ad hoc run of 2026-11-10 hung for 19 hours and was still there when the ci-local run of 2026-11-11 reached
// its own locale-leak jobs (owner: "finish them, you started them; why do you not watch your own processes?").
/**
 * The processes of a local check run: node itself running a browser check of ci.yml or ci-local (never a command that
 * only names the file, such as an editor, a linter or a shell line that will start it).
 */
export const CHECK_PROCESS = /^(?:"[^"]*?\bnode(?:\.exe)?"|\S*?\bnode(?:\.exe)?)\s+(?:-{1,2}[\w-]+(?:=\S+)?\s+)*"?(?:[^\s"]*[\\/])?scripts[\\/](?:check-locale-leak|check-homepage-grid|check-click-shield|check-card-track-monotonicity|check-hydration-console|quality[\\/]product-gates|quality[\\/]ci-local)\.mjs\b/;
/** A command line as its arguments (a quoted argument is one). */
export function argvOf(cmd) {
  return [...String(cmd).matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]);
}

/**
 * A process that only runs other commands, so it goes with the check it started: a shell running a script file
 * (`bash x.sh`, never `bash -c "..."`), `npm run`, `npx`, or `pipeline.mjs run`. Read from the program and its first
 * arguments, never from text anywhere in the line.
 */
export function isLauncher(cmd) {
  const argv = argvOf(cmd);
  const base = (s) => (s ?? '').split(/[\\/]/).pop().toLowerCase().replace(/\.(?:exe|cmd)$/, '');
  const prog = base(argv[0]);
  let i = 1;
  while (i < argv.length && (/^-/.test(argv[i]) || argv[i] === 'pipefail') && argv[i] !== '-c') i++;
  const first = argv[i] ?? '';
  if (prog === 'bash' || prog === 'sh') return /\.sh$/.test(first) || (base(first) === 'npm' && argv[i + 1] === 'run');
  if (prog === 'npm') return argv[1] === 'run';
  if (prog === 'npx') return true;
  if (prog === 'node') {
    if (base(first) === 'npm-cli.js') return argv[i + 1] === 'run';
    if (base(first) === 'npx-cli.js') return true;
    return /scripts[\\/]quality[\\/]pipeline\.mjs$/.test(first) && argv[i + 1] === 'run';
  }
  return false;
}

/** Every process as { pid, ppid, cmd }; [] when the list cannot be read. */
export function processList() {
  if (process.platform === 'win32') {
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 });
    if (r.status !== 0) return [];
    try { return [JSON.parse(r.stdout)].flat().map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, cmd: p.CommandLine ?? '' })); } catch { return []; }
  }
  const r = spawnSync('ps', ['-eo', 'pid=,ppid=,args='], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) return [];
  return r.stdout.split('\n').map((l) => /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(l)).filter(Boolean).map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), cmd: m[3] }));
}

/**
 * The check processes an earlier run left: a CHECK_PROCESS that is neither `self`, one of its ancestors nor one of its
 * descendants. Each is returned as the root to stop: the topmost LAUNCHER above it (a script that would start the next
 * check once this one is gone), never an ancestor of `self`. One root per tree.
 */
export function strayChecks(procs, self = process.pid) {
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const chain = (p) => { const out = []; const seen = new Set(); for (let q = byPid.get(p.ppid); q && !seen.has(q.pid); q = byPid.get(q.ppid)) { seen.add(q.pid); out.push(q); } return out; };
  const mine = new Set([self, ...chain({ ppid: self }).map((q) => q.pid)]);
  const roots = new Map();
  for (const p of procs) {
    if (!CHECK_PROCESS.test(p.cmd) || mine.has(p.pid) || chain(p).some((q) => q.pid === self)) continue;
    let root = p;
    for (const q of chain(p)) { if (mine.has(q.pid) || !(isLauncher(q.cmd) || CHECK_PROCESS.test(q.cmd))) break; root = q; }
    roots.set(root.pid, root);
  }
  // a root inside another root's tree goes with it
  return [...roots.values()].filter((r) => !chain(r).some((q) => roots.has(q.pid)));
}

/** Stops every stray check tree; returns what it stopped, each as "pid command". */
export function sweepStrays({ list = processList, self = process.pid, kill = killTree, log = () => {} } = {}) {
  const stopped = [];
  for (const r of strayChecks(list(), self)) {
    const what = `${r.pid} ${r.cmd.slice(0, 160)}`;
    log(`    stopping a check left by an earlier run: ${what}`);
    kill(r.pid);
    stopped.push(what);
  }
  return stopped;
}

/** Stops what a stopped process had started (each orphan with its own tree); returns their PIDs. */
export function killOrphans(pid, { list = processList, kill = killTree } = {}) {
  const orphans = list().filter((p) => p.ppid === pid).map((p) => p.pid);
  for (const p of orphans) kill(p);
  return orphans;
}

/** Stops a process and everything it started. */
export function killTree(pid) {
  if (process.platform === 'win32') { spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }); return; }
  const procs = processList();
  const tree = [pid];
  for (let i = 0; i < tree.length; i++) for (const p of procs) if (p.ppid === tree[i]) tree.push(p.pid);
  for (const p of tree.reverse()) { try { process.kill(p, 'SIGKILL'); } catch { /* already gone */ } }
}

/** CPU counters summed over every core (os.loadavg is always 0 on Windows, the counters are not). */
export function cpuCounters(cpus = os.cpus()) {
  let idle = 0;
  let total = 0;
  for (const c of cpus) { for (const v of Object.values(c.times)) total += v; idle += c.times.idle; }
  return { idle, total };
}

/** Percent of CPU time busy between two counter readings. */
export function cpuBusy(a, b) {
  const total = b.total - a.total;
  return total > 0 ? Math.round(100 * (1 - (b.idle - a.idle) / total)) : 0;
}

/** One sample: CPU busy since `prev`, free memory, ports in use. */
export function sample(prev, { counters = cpuCounters, free = os.freemem, total = os.totalmem, ports = portsInUse } = {}) {
  const now = counters();
  return { at: Date.now(), cpu: prev ? cpuBusy(prev, now) : null, memFree: Math.round((100 * free()) / total()), ports: ports(), counters: now };
}

/**
 * Why a failed step failed: { timeout, cause: 'load' | 'ports' | 'stall' | null, evidence }.
 * `samples` are the sampler's readings during the step.
 */
export function diagnose(output, samples, { cpuHigh = CPU_HIGH, memLow = MEM_LOW, portsMax = PORTS_MAX } = {}) {
  const m = TIMEOUT.exec(String(output));
  if (!m) return { timeout: false, cause: null, evidence: 'not a timeout: never retried' };
  const cpu = samples.map((s) => s.cpu).filter((v) => typeof v === 'number');
  const mem = samples.map((s) => s.memFree).filter((v) => typeof v === 'number');
  const ports = samples.map((s) => s.ports).filter((v) => typeof v === 'number');
  const peak = (a) => (a.length ? Math.max(...a) : null);
  const low = (a) => (a.length ? Math.min(...a) : null);
  const facts = `"${m[0]}"; CPU peak ${peak(cpu) ?? '?'}%, free memory low ${low(mem) ?? '?'}%, ports peak ${peak(ports) ?? '?'}, ${samples.length} sample(s)`;
  if (!samples.length) return { timeout: true, cause: 'stall', evidence: `${facts}; no sample, so no load was seen` };
  if (/ERR_NO_BUFFER_SPACE|ERR_ADDRESS_IN_USE/.test(m[0]) || (peak(ports) ?? 0) >= portsMax) return { timeout: true, cause: 'ports', evidence: facts };
  if ((peak(cpu) ?? 0) >= cpuHigh || (low(mem) ?? 100) <= memLow) return { timeout: true, cause: 'load', evidence: facts };
  return { timeout: true, cause: 'stall', evidence: facts };
}

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Waits until the machine has been calm (CPU and memory below their limits) for `quietMs`; reports while it waits. */
export function waitForCalm({ read = (p) => sample(p), sleep = pause, step = SAMPLE_MS, quietMs = 30_000, cpuMax = 60, memMin = 10, report = 30_000, log = () => {} } = {}) {
  let prev = read(null).counters;
  let calm = 0;
  let waited = 0;
  while (calm < quietMs) {
    sleep(step);
    waited += step;
    const s = read({ idle: prev.idle, total: prev.total });
    prev = s.counters;
    calm = (s.cpu ?? 100) < cpuMax && s.memFree > memMin ? calm + step : 0;
    if (waited % report === 0) log(`    waiting for a calm machine: CPU ${s.cpu}%, free memory ${s.memFree}%, calm for ${Math.round(calm / 1000)} s of ${Math.round(quietMs / 1000)} s`);
  }
  return { waited };
}

/** Starts the sampler for one step; `stop()` ends it and returns its samples. */
export function startWatch(file) {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), file, String(process.pid)], { stdio: 'ignore', windowsHide: true });
  return {
    stop() {
      child.kill();
      // read, never check and then read (CodeQL js/file-system-race): no sample file is no samples
      let text;
      try { text = readFileSync(file, 'utf8'); } catch { return []; }
      return text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    },
  };
}

if (isEntryPoint(import.meta.url)) {
  const [file, parent] = process.argv.slice(2);
  const ppid = Number(parent);
  if (!file || !Number.isInteger(ppid)) { console.error('usage: load-watch.mjs <samples.jsonl> <parent pid>'); process.exit(2); }
  let prev = cpuCounters();
  const tick = () => {
    try { process.kill(ppid, 0); } catch { process.exit(0); } // the run is gone: stop, never linger
    const s = sample(prev);
    prev = s.counters;
    const { counters, ...row } = s;
    void counters;
    appendFileSync(file, `${JSON.stringify(row)}\n`);
  };
  tick();
  setInterval(tick, Number(process.env.LOAD_WATCH_MS) > 0 ? Number(process.env.LOAD_WATCH_MS) : SAMPLE_MS);
}
