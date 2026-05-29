/**
 * Governance scan: Primitive violations
 * Detects raw button clones, custom overlays, local tab/dialog clones, icon library violations.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

// Load allowlist
const ALLOWLIST_PATH = join(__dirname, 'primitives.allowlist.json');
const allowlistEntries = existsSync(ALLOWLIST_PATH)
  ? JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf-8')).entries ?? []
  : [];

/** Returns true if this file:line is in the allowlist */
function isAllowlisted(relPath, lineNum) {
  return allowlistEntries.some(e => {
    const normalizedFile = e.file.replace(/\\/g, '/');
    const normalizedRel = relPath.replace(/\\/g, '/');
    return normalizedRel === normalizedFile && e.line === lineNum;
  });
}

/** Walk a directory and yield .tsx / .ts files */
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

// ── Scan all TSX/TS files ─────────────────────────────────────────────────────
for (const file of walkTsx(SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(ROOT, file);

  // Skip shadcn UI primitives themselves
  if (/src[/\\]components[/\\]ui[/\\]/.test(relPath)) continue;

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();

    // ── Rule P1: Raw <button> elements (not shadcn internal) ─────────────────
    if (/<button[\s>]/.test(line) && !/\/\/ eslint-disable/.test(line) && !isAllowlisted(relPath, lineNum)) {
      finding(
        'HIGH',
        file, lineNum,
        'Raw <button> element. Use Button from @/components/ui/button.',
        '<button>'
      );
    }

    // ── Rule P2: h-11 className on Button (should be size="xl") ──────────────
    // Only flag when h-11 is on a Button component (via asChild or direct className)
    // Pattern: <Button ... className="... h-11 ..."
    if (/<Button[^>]*className=.*\bh-11\b/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'h-11 className on Button. Use size="xl" on Button instead.',
        'h-11 on Button'
      );
    }

    // ── Rule P3: Custom div overlay (custom modal / drawer) ───────────────────
    if (/fixed\s+inset-0/.test(line)) {
      // Allow if on lines referring to sheet/dialog or their imports
      if (!/Sheet|Dialog|sheet|dialog/i.test(line)) {
        finding(
          'HIGH',
          file, lineNum,
          'Custom fixed overlay. Use Sheet (drawer) or Dialog (modal) from shadcn instead.',
          'fixed inset-0'
        );
      }
    }

    // ── Rule P4: Local tab clone (role="tab" outside shadcn Tabs) ─────────────
    if (/role=["']tab["']/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'role="tab" detected. Use shadcn Tabs/TabsList/TabsTrigger instead.',
        'role="tab"'
      );
    }

    // ── Rule P5: Non-lucide icon imports ──────────────────────────────────────
    if (/from\s+['"](@heroicons|react-icons|phosphor-react|feather-icons|@radix-ui\/react-icons)/.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'Non-lucide icon library import. Only lucide-react is approved.',
        'non-lucide icons'
      );
    }

    // ── Rule P6: window.location.href for navigation ──────────────────────────
    if (/window\.location\.href\s*=/.test(line) || /window\.location\.replace\(/.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'window.location navigation detected. Use router.push() from next/navigation.',
        'window.location'
      );
    }

    // ── Rule P7: container mx-auto without container-wide on public pages ──────
    if (/container mx-auto px-4/.test(line)) {
      if (/src[/\\]app[/\\]\[locale\]/.test(relPath)) {
        finding(
          'MEDIUM',
          file, lineNum,
          'container mx-auto px-4 on public page. Use .container-wide instead.',
          'container mx-auto on public page'
        );
      }
    }

    // ── Rule P8: xl:grid-cols-3 without 2xl: step (listing grids) ────────────
    if (/xl:grid-cols-3/.test(line) && !/2xl:grid-cols/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'xl:grid-cols-3 without 2xl: step. Add 2xl:grid-cols-4 for huge desktop.',
        'missing 2xl:grid-cols'
      );
    }
  });
}

// ── Report ───────────────────────────────────────────────────────────────────
export { findings };

const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => counts[f.severity]++);

console.log('\n=== PRIMITIVE GOVERNANCE SCAN ===');
console.log(`CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  MEDIUM: ${counts.MEDIUM}  LOW: ${counts.LOW}`);

if (findings.length === 0) {
  console.log('✅ No primitive violations found.');
} else {
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : f.severity === 'MEDIUM' ? '🟡' : '⚪';
    console.log(`${icon} [${f.severity}] ${f.file}:${f.line} — ${f.message}`);
  });
}

export { counts };
