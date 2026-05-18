/**
 * Governance scan: Localization governance violations
 * Detects hardcoded locale-specific widths, missing i18n keys, locale file consistency.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const MESSAGES = join(ROOT, 'messages');

const LOCALES = ['sq', 'en', 'uk', 'it'];

function* walkTsx(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', 'out'].includes(entry.name)) {
      yield* walkTsx(full);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      yield full;
    }
  }
}

const findings = [];

function finding(severity, file, line, message, pattern) {
  findings.push({ severity, file: relative(ROOT, file), line, message, pattern });
}

// ── Check locale file existence and key parity ───────────────────────────────
for (const locale of LOCALES) {
  const path = join(MESSAGES, `${locale}.json`);
  if (!existsSync(path)) {
    finding('CRITICAL', path, 0, `Missing locale file: messages/${locale}.json`, 'missing locale file');
  }
}

// Compare key counts across locale files
const localeCounts = {};
for (const locale of LOCALES) {
  const path = join(MESSAGES, `${locale}.json`);
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      // Count all keys recursively
      function countKeys(obj, depth = 0) {
        let count = 0;
        for (const v of Object.values(obj)) {
          count++;
          if (typeof v === 'object' && v !== null && depth < 5) {
            count += countKeys(v, depth + 1);
          }
        }
        return count;
      }
      localeCounts[locale] = countKeys(data);
    } catch {
      finding('HIGH', path, 0, `Failed to parse messages/${locale}.json`, 'json parse error');
    }
  }
}

const counts_keys = Object.values(localeCounts);
if (counts_keys.length > 1) {
  const max = Math.max(...counts_keys);
  const min = Math.min(...counts_keys);
  if (max !== min) {
    finding(
      'HIGH',
      join(MESSAGES, 'keys-parity'),
      0,
      `Locale key count mismatch: ${JSON.stringify(localeCounts)}. All locale files must have same key count.`,
      'locale key parity'
    );
  }
}

// ── Scan source files for localization violations ────────────────────────────
for (const file of walkTsx(SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(ROOT, file);

  if (/src[/\\]components[/\\]ui[/\\]|\.test\.(ts|tsx)$/.test(relPath)) continue;

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // ── Rule L1: Hardcoded widths in nav/toolbar/modal contexts ──────────────
    // Flags explicit pixel widths that could break with longer locale strings
    if (/w-\[\d+px\]|min-w-\[\d+px\]/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'Hardcoded pixel width detected. May break with longer locale translations. Use min-w-0 or relative widths.',
        'hardcoded px width'
      );
    }

    // ── Rule L2: whitespace-nowrap without truncation safety ──────────────────
    if (/whitespace-nowrap/.test(line) && !/truncate|overflow-hidden/.test(line)) {
      finding(
        'LOW',
        file, lineNum,
        'whitespace-nowrap without overflow-hidden+truncate. May cause horizontal overflow in long locales.',
        'whitespace-nowrap unsafe'
      );
    }

    // ── Rule L3: Hardcoded text strings (basic check) ─────────────────────────
    // Look for JSX text content that is not a translation call
    // Simple heuristic: string literals > 3 chars that look like user-facing text
    if (/>["'][A-Z][a-zA-Z\s]{3,}["']</.test(line) && !/useTranslations|t\(|i18n/.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'Potential hardcoded user-visible text string. Use useTranslations() with i18n keys.',
        'hardcoded text'
      );
    }
  });
}

export { findings };

const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => counts[f.severity]++);

console.log('\n=== LOCALIZATION GOVERNANCE SCAN ===');
console.log(`CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  MEDIUM: ${counts.MEDIUM}  LOW: ${counts.LOW}`);
console.log('Locale key counts:', localeCounts);

if (findings.length === 0) {
  console.log('✅ No localization violations found.');
} else {
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : f.severity === 'MEDIUM' ? '🟡' : '⚪';
    console.log(`${icon} [${f.severity}] ${f.file}:${f.line} — ${f.message}`);
  });
}

export { counts, localeCounts };
