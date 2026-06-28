#!/usr/bin/env node
/**
 * check-mojibake.mjs — Mojibake / double-encoding artifact gate (Task 428).
 *
 * Scans tracked text files for UTF-8-as-CP125x double-encoding artifacts
 * (e.g. "Ô£à" for "✅", "â€“" for "–") and the U+FFFD replacement character,
 * which indicate text was decoded with the wrong code page somewhere in the
 * authoring/paste pipeline before landing in the repo.
 *
 * Scanned roots: docs/, src/, app/, components/, modules/, messages/, tasks/,
 * and root-level *.md files. Binary files are skipped.
 *
 * A file that is not valid UTF-8 is reported as its own failure (distinct
 * from a mojibake-signature hit).
 *
 * Allowlist: scripts/mojibake-allowlist.json — path globs for docs that
 * intentionally quote these artifacts as documentation. Path-scoped, not a
 * blanket disable.
 *
 * Exit 0 = no non-allowlisted hits. Exit 1 = one or more hits / invalid UTF-8.
 *
 * Added: Task 428, 2026-06-15.
 * Rule:  docs/agent-contract.md clause 14, docs/qa-rules.md → "Encoding hygiene"
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Scanned roots ─────────────────────────────────────────────────────────────
const SCAN_DIR_PREFIXES = ['docs/', 'src/', 'app/', 'components/', 'modules/', 'messages/', 'tasks/'];

// ── Binary extensions — never scanned as text ────────────────────────────────
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.gz', '.tar', '.br',
  '.mp4', '.webm', '.ogg', '.mp3',
  '.map', '.lock',
]);

// ── Mojibake signatures (ordered: most specific first) ──────────────────────
// Each pattern is a literal decoded-string sequence produced when UTF-8 bytes
// are re-decoded as CP1252/Latin-1 (or, for U+FFFD, lost entirely).
const SIGNATURES = [
  { pattern: '�', name: 'U+FFFD replacement character', hint: 'Lossy decode — re-save the file as UTF-8 from the original source.' },
  { pattern: 'Ô£à', name: 'CP1252-of-UTF-8 for "✅"', hint: 'Re-encode as UTF-8 (intended: ✅ U+2705).' },
  { pattern: 'ÔåÆ', name: 'CP1252-of-UTF-8 for "→"', hint: 'Re-encode as UTF-8 (intended: → U+2192).' },
  { pattern: 'ÔÇö', name: 'CP1252-of-UTF-8 for "—"', hint: 'Re-encode as UTF-8 (intended: — U+2014 em dash).' },
  { pattern: 'ÔÇô', name: 'CP1252-of-UTF-8 for "–"', hint: 'Re-encode as UTF-8 (intended: – U+2013 en dash).' },
  { pattern: 'ÔÇª', name: 'CP1252-of-UTF-8 for "…"', hint: 'Re-encode as UTF-8 (intended: … U+2026 ellipsis).' },
  { pattern: 'â€"', name: 'CP1252-of-UTF-8 for "—" (em dash)', hint: 'Re-encode as UTF-8 (intended: — U+2014).' },
  { pattern: 'â€“', name: 'CP1252-of-UTF-8 for "–" (en dash)', hint: 'Re-encode as UTF-8 (intended: – U+2013).' },
  { pattern: 'â€™', name: 'CP1252-of-UTF-8 for right single quote', hint: 'Re-encode as UTF-8 (intended: ’ U+2019).' },
  { pattern: 'â€œ', name: 'CP1252-of-UTF-8 for left double quote', hint: 'Re-encode as UTF-8 (intended: “ U+201C).' },
  { pattern: 'â€', name: 'CP1252-of-UTF-8 (generic "â€" prefix)', hint: 'Re-encode as UTF-8 — likely a punctuation/dash/quote artifact.' },
  { pattern: 'Ã©', name: 'CP1252-of-UTF-8 for "é"', hint: 'Re-encode as UTF-8 (intended: é).' },
  { pattern: 'Ã¨', name: 'CP1252-of-UTF-8 for "è"', hint: 'Re-encode as UTF-8 (intended: è).' },
  { pattern: 'Ã¼', name: 'CP1252-of-UTF-8 for "ü"', hint: 'Re-encode as UTF-8 (intended: ü).' },
  { pattern: 'Ã¶', name: 'CP1252-of-UTF-8 for "ö"', hint: 'Re-encode as UTF-8 (intended: ö).' },
  { pattern: 'Ã¤', name: 'CP1252-of-UTF-8 for "ä"', hint: 'Re-encode as UTF-8 (intended: ä).' },

  // Albanian accents (sq locale) — Task 429.
  { pattern: 'Ã«', name: 'CP1252-of-UTF-8 for "ë"', hint: 'Re-encode as UTF-8 (intended: ë U+00EB).' },
  { pattern: 'Ã§', name: 'CP1252-of-UTF-8 for "ç"', hint: 'Re-encode as UTF-8 (intended: ç U+00E7).' },

  // "Â…" family — specific paired sequences only, never bare "Â" — Task 429.
  { pattern: 'Â ', name: 'CP1252-of-UTF-8 for U+00A0 (NBSP)', hint: 'Re-encode as UTF-8 (intended: non-breaking space U+00A0).' },
  { pattern: 'Â«', name: 'CP1252-of-UTF-8 for "«"', hint: 'Re-encode as UTF-8 (intended: « U+00AB).' },
  { pattern: 'Â»', name: 'CP1252-of-UTF-8 for "»"', hint: 'Re-encode as UTF-8 (intended: » U+00BB).' },
  { pattern: 'Â©', name: 'CP1252-of-UTF-8 for "©"', hint: 'Re-encode as UTF-8 (intended: © U+00A9).' },
  { pattern: 'Â®', name: 'CP1252-of-UTF-8 for "®"', hint: 'Re-encode as UTF-8 (intended: ® U+00AE).' },
  { pattern: 'Â°', name: 'CP1252-of-UTF-8 for "°"', hint: 'Re-encode as UTF-8 (intended: ° U+00B0).' },

  // Cyrillic "Ð…/Ñ…" family — paired sequences for common uk letters only, never bare "Ð"/"Ñ" — Task 429.
  { pattern: 'Ð°', name: 'CP1252-of-UTF-8 for Cyrillic "а"', hint: 'Re-encode as UTF-8 (intended: а U+0430).' },
  { pattern: 'Ð¸', name: 'CP1252-of-UTF-8 for Cyrillic "и"', hint: 'Re-encode as UTF-8 (intended: и U+0438).' },
  { pattern: 'Ð½', name: 'CP1252-of-UTF-8 for Cyrillic "н"', hint: 'Re-encode as UTF-8 (intended: н U+043D).' },
  { pattern: 'Ð¾', name: 'CP1252-of-UTF-8 for Cyrillic "о"', hint: 'Re-encode as UTF-8 (intended: о U+043E).' },
  { pattern: 'Ñ€', name: 'CP1252-of-UTF-8 for Cyrillic "р"', hint: 'Re-encode as UTF-8 (intended: р U+0440).' },
  { pattern: 'Ñ‚', name: 'CP1252-of-UTF-8 for Cyrillic "т"', hint: 'Re-encode as UTF-8 (intended: т U+0442).' },
  { pattern: 'Ð¿', name: 'CP1252-of-UTF-8 for Cyrillic "п"', hint: 'Re-encode as UTF-8 (intended: п U+043F).' },
  { pattern: 'Ð²', name: 'CP1252-of-UTF-8 for Cyrillic "в"', hint: 'Re-encode as UTF-8 (intended: в U+0432).' },
  { pattern: 'Ð´', name: 'CP1252-of-UTF-8 for Cyrillic "д"', hint: 'Re-encode as UTF-8 (intended: д U+0434).' },
  { pattern: 'Ð»', name: 'CP1252-of-UTF-8 for Cyrillic "л"', hint: 'Re-encode as UTF-8 (intended: л U+043B).' },
  { pattern: 'Ðµ', name: 'CP1252-of-UTF-8 for Cyrillic "е"', hint: 'Re-encode as UTF-8 (intended: е U+0435).' },
  { pattern: 'Ñ–', name: 'CP1252-of-UTF-8 for Cyrillic "і"', hint: 'Re-encode as UTF-8 (intended: і U+0456).' },
  { pattern: 'Ñ—', name: 'CP1252-of-UTF-8 for Cyrillic "ї"', hint: 'Re-encode as UTF-8 (intended: ї U+0457).' },
  { pattern: 'Ñ”', name: 'CP1252-of-UTF-8 for Cyrillic "є"', hint: 'Re-encode as UTF-8 (intended: є U+0454).' },
];

// ── Allowlist ─────────────────────────────────────────────────────────────────
const ALLOWLIST_PATH = resolve(ROOT, 'scripts/mojibake-allowlist.json');

function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  const raw = readFileSync(ALLOWLIST_PATH, 'utf8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error('mojibake-allowlist.json must be a JSON array of path globs');
  return list;
}

// Minimal glob -> RegExp: "**" = any path segment(s), "*" = any chars except "/".
const GLOB_SPECIAL = new Set(['.', '+', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\']);

function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        out += '.*';
        i++;
      } else {
        out += '[^/]*';
      }
    } else if (GLOB_SPECIAL.has(c)) {
      out += `\\${c}`;
    } else {
      out += c;
    }
  }
  return new RegExp(`^${out}$`);
}

function isAllowlisted(relPath, allowlist) {
  return allowlist.some((glob) => globToRegExp(glob).test(relPath));
}

// ── File collection (git-tracked + untracked-but-not-ignored) ───────────────
function gitTrackedFiles() {
  // Include tracked + staged + untracked-but-not-ignored files, so files added
  // in the same change as this gate (or not yet committed) are also scanned.
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT, encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr}`);
  return [...new Set(r.stdout.split('\n').map((l) => l.trim()).filter(Boolean))];
}

function shouldScan(relPath) {
  const ext = extname(relPath).toLowerCase();
  if (BINARY_EXTS.has(ext)) return false;
  if (SCAN_DIR_PREFIXES.some((p) => relPath.startsWith(p))) return true;
  // root-level *.md (e.g. CLAUDE.md, README.md)
  if (!relPath.includes('/') && ext === '.md') return true;
  return false;
}

// ── Per-file scan ─────────────────────────────────────────────────────────────
function scanFile(absPath) {
  const buf = readFileSync(absPath);
  if (buf.length === 0) return { errors: [], hits: [] };

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return { errors: ['Not valid UTF-8 — file must be re-saved as UTF-8 (no BOM)'], hits: [] };
  }

  const hits = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const claimed = new Array(line.length).fill(false);
    for (const sig of SIGNATURES) {
      let from = 0;
      while (true) {
        const idx = line.indexOf(sig.pattern, from);
        if (idx === -1) break;
        from = idx + sig.pattern.length;
        // skip if this range overlaps an already-claimed (more specific) match
        let overlap = false;
        for (let k = idx; k < idx + sig.pattern.length; k++) {
          if (claimed[k]) { overlap = true; break; }
        }
        if (overlap) continue;
        for (let k = idx; k < idx + sig.pattern.length; k++) claimed[k] = true;
        const snippetStart = Math.max(0, idx - 10);
        const snippetEnd = Math.min(line.length, idx + sig.pattern.length + 10);
        hits.push({
          line: i + 1,
          col: idx + 1,
          name: sig.name,
          hint: sig.hint,
          snippet: line.slice(snippetStart, snippetEnd),
        });
      }
    }
  }

  return { errors: [], hits };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function run() {
  const allowlist = loadAllowlist();
  const files = gitTrackedFiles().filter(shouldScan);

  console.log(`check:mojibake — scanning ${files.length} tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md`);
  console.log('');

  let artifactCount = 0;
  let invalidCount = 0;
  const reports = [];

  for (const rel of files) {
    const abs = resolve(ROOT, rel);
    const { errors, hits } = scanFile(abs);

    if (errors.length > 0) {
      if (isAllowlisted(rel, allowlist)) continue;
      invalidCount++;
      reports.push({ rel, lines: errors.map((e) => `    -> ${e}`) });
      continue;
    }

    if (hits.length === 0) continue;

    if (isAllowlisted(rel, allowlist)) continue;

    artifactCount += hits.length;
    reports.push({
      rel,
      lines: hits.map((h) => `    ${rel}:${h.line}:${h.col}  ${h.name}  "...${h.snippet}..."\n      -> ${h.hint}`),
    });
  }

  const total = artifactCount + invalidCount;

  if (total === 0) {
    console.log(`check:mojibake: 0 artifacts in ${files.length} files`);
    process.exit(0);
  }

  console.error(`check:mojibake FAILED — ${artifactCount} artifact(s), ${invalidCount} invalid-UTF-8 file(s):\n`);
  for (const r of reports) {
    console.error(`  ${r.rel}`);
    for (const l of r.lines) console.error(l);
  }
  console.error('');
  console.error('  Remediation: re-save the offending file as UTF-8 (no BOM). If the artifact is');
  console.error('  intentional documentation, add the path to scripts/mojibake-allowlist.json.');
  console.error('  Rule: docs/agent-contract.md clause 14, docs/qa-rules.md -> "Encoding hygiene"');
  process.exit(1);
}

run();
