/**
 * Component Catalog — Lero.al
 *
 * Static analysis tool that scans all UI/component surfaces and produces:
 *   1. Console summary
 *   2. Machine-readable JSON → scripts/governance/reports/component-catalog.latest.json
 *   3. Markdown reports → docs/component-catalog.md, docs/component-coverage-matrix.md,
 *                         docs/component-risk-register.md
 *
 * Usage:
 *   npm run governance:components    → validation check (fast, CI-safe)
 *   npm run catalog:components       → full scan + report generation
 *
 * Flags:
 *   --check     Validate setup only; exit 0 if infrastructure is in place
 *   --write     Write markdown docs in addition to JSON report (default when catalog:components)
 *
 * See docs/component-catalog-governance.md for classification model.
 */

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const WRITE_DOCS = args.includes('--write') || !CHECK_ONLY;

// ── Component type classification by file path ────────────────────────────────

function classifyType(rel) {
  if (rel.startsWith('src/components/ui/') && !rel.endsWith('.stories.tsx')) return 'canonical-primitive';
  if (rel.startsWith('src/components/shared/')) return 'shared-ui';
  if (rel.startsWith('src/components/layout/')) return 'layout';
  if (rel.startsWith('src/components/admin/')) return 'admin-shared';
  if (rel.startsWith('src/modules/auth/')) return 'auth-feature';
  if (rel.startsWith('src/modules/cabinet/')) return 'cabinet-feature';
  if (rel.startsWith('src/modules/listings/') && rel.includes('__tests__')) return 'test';
  if (rel.startsWith('src/modules/listings/')) return 'listings-feature';
  if (rel.startsWith('src/modules/locations/')) return 'locations-feature';
  if (rel.startsWith('src/modules/notifications/')) return 'notifications-feature';
  if (rel.startsWith('src/app/') && (
    rel.endsWith('/page.tsx') || rel.endsWith('/layout.tsx') ||
    rel.endsWith('/loading.tsx') || rel.endsWith('/error.tsx')
  )) return 'page';
  if (rel.endsWith('.stories.tsx')) return 'story';
  return 'unknown';
}

// ── Detect surface area from path ────────────────────────────────────────────

function detectSurface(rel) {
  if (rel.startsWith('src/components/ui/')) return 'UI Primitives';
  if (rel.startsWith('src/components/shared/')) return 'Shared';
  if (rel.startsWith('src/components/layout/')) return 'Layout';
  if (rel.startsWith('src/components/admin/')) return 'Admin Shared';
  if (rel.includes('/admin/')) return 'Admin';
  if (rel.startsWith('src/modules/auth/')) return 'Auth';
  if (rel.startsWith('src/modules/cabinet/')) return 'Cabinet';
  if (rel.startsWith('src/modules/listings/')) return 'Listings';
  if (rel.startsWith('src/modules/locations/')) return 'Locations';
  if (rel.startsWith('src/modules/notifications/')) return 'Notifications';
  if (rel.startsWith('src/app/')) return 'Pages';
  return 'Other';
}

// ── Static analysis: extract metadata from file contents ─────────────────────

function analyzeFile(absPath, rel) {
  let src = '';
  try { src = readFileSync(absPath, 'utf8'); } catch { return null; }

  const name = basename(rel, '.tsx').replace('.stories', '');

  // Component detection — permissive: any .tsx file with an uppercase function/const
  const hasDefaultExport = /export default (function|const|class)\s+[A-Z]/.test(src)
    || /^export default [A-Z]/m.test(src);
  const namedExports = [
    // export function Foo / export const Foo
    ...[...src.matchAll(/^export (?:const|function) ([A-Z]\w*)/gm)].map(m => m[1]),
    // function Foo + export { Foo } pattern
    ...[...src.matchAll(/^(?:function|const) ([A-Z]\w*)/gm)].map(m => m[1]),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const isComponent = hasDefaultExport || namedExports.length > 0
    || /^function [A-Z]/m.test(src) || /^const [A-Z]/m.test(src);

  // Client boundary
  const isClient = src.startsWith("'use client'") || src.startsWith('"use client"')
    || /^['"]use client['"]/m.test(src);

  // Localization
  const usesTranslations = /useTranslations\b/.test(src);

  // Canonical primitive usage
  const usesButton      = /from ['"]@\/components\/ui\/button['"]/.test(src) || /Button/.test(src);
  const usesInput       = /from ['"]@\/components\/ui\/input['"]/.test(src);
  const usesDialog      = /from ['"]@\/components\/ui\/dialog['"]/.test(src) || /<Dialog\b/.test(src);
  const usesSheet       = /from ['"]@\/components\/ui\/sheet['"]/.test(src) || /<Sheet\b/.test(src);
  const usesTabs        = /from ['"]@\/components\/ui\/tabs['"]/.test(src) || /<Tabs\b/.test(src);
  const usesLucide      = /from ['"]lucide-react['"]/.test(src);

  // Anti-patterns (exclude canonical ui/ files from their own pattern checks)
  const isUiPrimitive = rel.startsWith('src/components/ui/');
  const hasRawButton    = !isUiPrimitive && /<button[\s>]/.test(src);
  const hasFixedOverlay = !isUiPrimitive && /fixed inset-0/.test(src)
    && !/Sheet|Dialog|sheet|dialog/.test(src);
  const hasViewportJS   = /typeof window|useWindowSize|window\.innerWidth/.test(src);
  const hasSuppressHW   = /suppressHydrationWarning/.test(src);
  const hasWinLocation  = /window\.location\.href/.test(src);

  // Responsive
  const has2xl          = /\b2xl:/.test(src);
  const hasSm           = /\bsm:/.test(src);
  const hasMd           = /\bmd:/.test(src);
  const hasLg           = /\blg:/.test(src);
  const hasXl           = /\bxl:/.test(src);
  const hasArbitraryTw  = /className.*\[[\w.%-]+\]/.test(src) || /\[[\d.]+(?:px|rem|%)\]/.test(src);
  const hasContainerWide= /container-wide/.test(src);
  const hasGrid         = /grid-cols/.test(src);
  const has2xlGrid      = /2xl:grid-cols/.test(src);

  // Storybook
  const storyFile = absPath.replace('.tsx', '.stories.tsx');
  const hasColocatedStory = existsSync(storyFile);

  // Known story targets from responsive screenshot matrix
  const SCREENSHOT_TARGETS = new Set([
    'button', 'input', 'tabs', 'dialog', 'sheet', 'badge', 'skeleton',
    // Task 665 R13.3: ListingGrid.stories.tsx was deleted (fake-card cleanup); the responsive
    // grid screenshot target re-points at the story filename token for the surviving
    // System/FeaturedListings story (the token this generator derives from a story's filename,
    // not the extracted FeaturedListingsView presentational component).
    'FeaturedListings', 'Containers', 'EmptyState', 'AdminLayout', 'checkbox',
  ]);
  const inScreenshotMatrix = SCREENSHOT_TARGETS.has(name);

  // Determine governance flags
  const flags = [];
  const type = classifyType(rel);

  if (hasRawButton) flags.push('RAW_BUTTON');
  if (hasFixedOverlay) flags.push('CUSTOM_OVERLAY');
  if (hasViewportJS) flags.push('VIEWPORT_JS');
  if (hasSuppressHW) flags.push('SUPPRESS_HW');
  if (hasWinLocation) flags.push('WIN_LOCATION');
  if (hasArbitraryTw) flags.push('ARBITRARY_TW');

  // Governance status
  let status = 'APPROVED';
  if (type === 'canonical-primitive') status = 'CANONICAL';
  if (!hasColocatedStory && type === 'canonical-primitive') status = 'NEEDS_STORY';
  if (type === 'canonical-primitive' && hasColocatedStory) status = 'CANONICAL';
  if (usesTranslations && !hasColocatedStory && type !== 'canonical-primitive' && type !== 'page') {
    if (['shared-ui', 'layout', 'admin-shared'].includes(type)) status = 'NEEDS_STORY';
  }
  if (flags.length > 0) status = 'MANUAL_REVIEW';

  // Risk dimensions
  const risks = [];
  if (usesTranslations) risks.push('LOCALIZATION');
  if (isClient && !usesButton && type !== 'canonical-primitive') risks.push('PRIMITIVE_CHECK');
  if (hasArbitraryTw) risks.push('TAILWIND_ENTROPY');
  if (!has2xl && hasGrid && type !== 'canonical-primitive') risks.push('HUGE_DESKTOP');
  if (!hasSm && !hasMd && usesTranslations && ['shared-ui', 'layout'].includes(type)) risks.push('MOBILE');
  if (hasRawButton || hasFixedOverlay || hasViewportJS) risks.push('GOVERNANCE_VIOLATION');

  return {
    name,
    rel,
    type,
    surface: detectSurface(rel),
    isComponent,
    isClient,
    usesTranslations,
    canonicalPrimitives: {
      button: usesButton,
      input: usesInput,
      dialog: usesDialog,
      sheet: usesSheet,
      tabs: usesTabs,
      lucide: usesLucide,
    },
    responsive: { hasSm, hasMd, hasLg, hasXl, has2xl, has2xlGrid, hasContainerWide, hasGrid },
    antiPatterns: { hasRawButton, hasFixedOverlay, hasViewportJS, hasSuppressHW, hasWinLocation },
    tailwind: { hasArbitraryTw },
    storybook: { hasColocatedStory, inScreenshotMatrix },
    status,
    risks,
    flags,
    namedExports,
  };
}

// ── File walker ───────────────────────────────────────────────────────────────

function walkTsx(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry === '__tests__') continue;
      walkTsx(full, results);
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (CHECK_ONLY) {
    // Fast infrastructure check
    const requiredFiles = [
      'src/components/ui/button.tsx',
      'src/components/shared/Combobox.tsx',
      'src/modules/listings/components/ListingCard.tsx',
      'docs/component-catalog-governance.md',
    ];
    let ok = true;
    for (const f of requiredFiles) {
      if (existsSync(join(ROOT, f))) {
        console.log(`✅ ${f}`);
      } else {
        console.error(`❌ ${f} — missing`);
        ok = false;
      }
    }
    if (existsSync(join(ROOT, 'scripts/governance/component-catalog.mjs'))) {
      console.log('✅ component-catalog.mjs script present');
    }
    console.log(ok
      ? '\n✅ Component catalog infrastructure ready. Run: npm run catalog:components'
      : '\n❌ Setup incomplete.'
    );
    process.exit(ok ? 0 : 1);
  }

  // Full catalog generation
  const scanDirs = ['src/app', 'src/components', 'src/modules'];
  const allFiles = scanDirs.flatMap(d => walkTsx(join(ROOT, d)));

  const entries = [];
  for (const abs of allFiles) {
    const rel = relative(ROOT, abs).replace(/\\/g, '/');
    if (rel.endsWith('.stories.tsx')) continue; // separate story tracking
    const entry = analyzeFile(abs, rel);
    if (entry && entry.isComponent) entries.push(entry);
  }

  // Story files — track separately
  const storyFiles = allFiles
    .filter(f => f.endsWith('.stories.tsx'))
    .map(f => relative(ROOT, f).replace(/\\/g, '/'));

  // Stats
  const byType = {};
  const byStatus = {};
  const byRisk = {};
  const violations = [];

  for (const e of entries) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    for (const r of e.risks) byRisk[r] = (byRisk[r] || 0) + 1;
    if (e.flags.length > 0) violations.push(e);
  }

  const total = entries.length;
  const withStory = entries.filter(e => e.storybook.hasColocatedStory).length + storyFiles.filter(s => s.startsWith('src/stories/')).length;
  const withLocale = entries.filter(e => e.usesTranslations).length;
  const withArbitraryTw = entries.filter(e => e.tailwind.hasArbitraryTw).length;
  const withRawButton = entries.filter(e => e.antiPatterns.hasRawButton).length;
  const needs2xl = entries.filter(e => !e.responsive.has2xl && e.responsive.hasGrid).length;

  // Console summary
  console.log('\n📦  Component Catalog — Lero.al\n');
  console.log(`Total components scanned: ${total}`);
  console.log(`  with Storybook stories:   ${withStory}`);
  console.log(`  locale-aware (i18n):      ${withLocale}`);
  console.log(`  with arbitrary Tailwind:  ${withArbitraryTw}`);
  console.log(`  with raw <button>:        ${withRawButton}`);
  console.log(`  grids missing 2xl step:   ${needs2xl}`);
  console.log('\nBy type:');
  for (const [k, v] of Object.entries(byType).sort()) console.log(`  ${k.padEnd(28)} ${v}`);
  console.log('\nBy status:');
  for (const [k, v] of Object.entries(byStatus).sort()) console.log(`  ${k.padEnd(28)} ${v}`);
  if (violations.length > 0) {
    console.log(`\n⚠️  ${violations.length} components with flags:`);
    for (const v of violations.slice(0, 10)) {
      console.log(`  ${v.rel} → ${v.flags.join(', ')}`);
    }
    if (violations.length > 10) console.log(`  ... and ${violations.length - 10} more`);
  }

  // Write JSON
  const reportsDir = join(ROOT, 'scripts', 'governance', 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const catalog = { generatedAt: new Date().toISOString(), total, storyFiles, entries };
  writeFileSync(join(reportsDir, 'component-catalog.latest.json'), JSON.stringify(catalog, null, 2), 'utf8');
  console.log('\n✅ JSON catalog written: scripts/governance/reports/component-catalog.latest.json');

  if (!WRITE_DOCS) {
    console.log('   (Use --write or npm run catalog:components to update markdown docs)');
    return;
  }

  // Write markdown summary to docs/ (human-readable portion)
  const stamp = new Date().toISOString().slice(0, 10);
  generateCatalogSummary(entries, storyFiles, stamp);
  console.log('✅ Docs updated: docs/component-catalog.md, docs/component-coverage-matrix.md, docs/component-risk-register.md');
}

function componentRow(e) {
  const story = e.storybook.hasColocatedStory ? '✅' : e.storybook.inScreenshotMatrix ? '📷' : '—';
  const i18n = e.usesTranslations ? '🌐' : '—';
  const risk = e.risks.length > 0 ? e.risks.slice(0, 2).join(', ') : '—';
  const flags = e.flags.length > 0 ? '⚠️' : '';
  return `| \`${e.name}\` | ${e.status} | ${story} | ${i18n} | ${risk} ${flags} |`;
}

function generateCatalogSummary(entries, storyFiles, stamp) {
  const sections = {
    'canonical-primitive': entries.filter(e => e.type === 'canonical-primitive'),
    'shared-ui': entries.filter(e => e.type === 'shared-ui'),
    'layout': entries.filter(e => e.type === 'layout'),
    'admin-shared': entries.filter(e => e.type === 'admin-shared'),
    'auth-feature': entries.filter(e => e.type === 'auth-feature'),
    'cabinet-feature': entries.filter(e => e.type === 'cabinet-feature'),
    'listings-feature': entries.filter(e => e.type === 'listings-feature'),
    'locations-feature': entries.filter(e => e.type === 'locations-feature'),
    'notifications-feature': entries.filter(e => e.type === 'notifications-feature'),
    'page': entries.filter(e => e.type === 'page'),
    'unknown': entries.filter(e => e.type === 'unknown'),
  };

  // ── Component Catalog ──────────────────────────────────────────────────────
  const catalogLines = [
    `# Component Catalog — Lero.al`,
    `Last generated: ${stamp}`,
    `See \`docs/component-catalog-governance.md\` for classification rules.`,
    `See \`docs/component-coverage-matrix.md\` for coverage mapping.`,
    `See \`docs/component-risk-register.md\` for risk register.`,
    '',
    `## Summary`,
    '',
    `| Metric | Count |`,
    `|---|---|`,
    `| Total cataloged components | ${entries.length} |`,
    `| Storybook stories | ${storyFiles.length} |`,
    `| Locale-aware (useTranslations) | ${entries.filter(e=>e.usesTranslations).length} |`,
    `| Client components ('use client') | ${entries.filter(e=>e.isClient).length} |`,
    `| With arbitrary Tailwind values | ${entries.filter(e=>e.tailwind.hasArbitraryTw).length} |`,
    `| Components with 2xl responsive step | ${entries.filter(e=>e.responsive.has2xl).length} |`,
    `| Components flagged for review | ${entries.filter(e=>e.flags.length>0).length} |`,
    '',
  ];

  const typeLabels = {
    'canonical-primitive': 'Canonical UI Primitives (`src/components/ui/`)',
    'shared-ui': 'Shared UI Components (`src/components/shared/`)',
    'layout': 'Layout Components (`src/components/layout/`)',
    'admin-shared': 'Admin Shared Components (`src/components/admin/`)',
    'auth-feature': 'Auth Feature Components',
    'cabinet-feature': 'Cabinet Feature Components',
    'listings-feature': 'Listings Feature Components',
    'locations-feature': 'Locations Feature Components',
    'notifications-feature': 'Notifications Feature Components',
    'page': 'Page/Layout Routes (`src/app/`)',
    'unknown': 'Unknown / Manual Review',
  };

  for (const [type, items] of Object.entries(sections)) {
    if (items.length === 0) continue;
    catalogLines.push(`## ${typeLabels[type] || type} (${items.length})`);
    catalogLines.push('');
    catalogLines.push('| Component | Status | Story | i18n | Risks |');
    catalogLines.push('|---|---|---|---|---|');
    for (const e of items.sort((a,b) => a.name.localeCompare(b.name))) {
      catalogLines.push(componentRow(e));
    }
    catalogLines.push('');
  }

  catalogLines.push('---');
  catalogLines.push('');
  catalogLines.push('## Legend');
  catalogLines.push('');
  catalogLines.push('| Symbol | Meaning |');
  catalogLines.push('|---|---|');
  catalogLines.push('| ✅ | Has colocated Storybook story |');
  catalogLines.push('| 📷 | In responsive screenshot target list |');
  catalogLines.push('| 🌐 | Uses `useTranslations` (locale-aware) |');
  catalogLines.push('| ⚠️ | Has governance flags — MANUAL_REVIEW |');
  catalogLines.push('| CANONICAL | Canonical primitive, correctly used |');
  catalogLines.push('| APPROVED | Approved component, no critical flags |');
  catalogLines.push('| NEEDS_STORY | Should have Storybook story |');
  catalogLines.push('| MANUAL_REVIEW | Has flags or complex patterns |');

  writeFileSync(join(ROOT, 'docs', 'component-catalog.md'), catalogLines.join('\n'), 'utf8');

  // ── Coverage Matrix ────────────────────────────────────────────────────────
  const matrixLines = [
    `# Component Coverage Matrix — Lero.al`,
    `Last generated: ${stamp}`,
    '',
    `## Storybook Coverage`,
    '',
    `| Component | Story | Story file |`,
    `|---|---|---|`,
  ];

  // Primitive story coverage
  const primitives = sections['canonical-primitive'];
  const storyMap = {};
  for (const sf of storyFiles) {
    const n = basename(sf, '.stories.tsx');
    storyMap[n.toLowerCase()] = sf;
  }

  for (const e of primitives.sort((a,b)=>a.name.localeCompare(b.name))) {
    const hasSt = e.storybook.hasColocatedStory;
    const storyPath = hasSt ? `src/components/ui/${e.name}.stories.tsx` : storyMap[e.name.toLowerCase()] ? storyMap[e.name.toLowerCase()] : '—';
    matrixLines.push(`| \`${e.name}\` | ${hasSt ? '✅' : '❌'} | ${storyPath} |`);
  }

  matrixLines.push('');
  matrixLines.push('## Responsive Screenshot Coverage');
  matrixLines.push('');
  matrixLines.push('Stories in Phase 5 screenshot target list:');
  matrixLines.push('');
  matrixLines.push('| Story ID | Viewport focus | Locale focus |');
  matrixLines.push('|---|---|---|');
  matrixLines.push('| `primitives-button--*` | mobile-320, mobile-375, huge-2560 | all 4 locales |');
  matrixLines.push('| `primitives-input--*` | mobile-375 | all 4 locales |');
  matrixLines.push('| `primitives-tabs--*` | tablet-768 | all 4 locales |');
  matrixLines.push('| `primitives-dialog--*` | mobile-375 | all 4 locales |');
  matrixLines.push('| `primitives-sheet--*` | mobile-375, tablet-768 | all 4 locales |');
  matrixLines.push('| `primitives-badge--*` | desktop-1280 | all 4 locales |');
  matrixLines.push('| `primitives-skeleton--*` | desktop-1280 | all 4 locales |');
  matrixLines.push('| `system-featuredlistings--default` | mobile-375, desktop-1280, huge-2560 | all 4 locales |');
  matrixLines.push('| `system-containers--*` | desktop-1280, huge-2560 | all 4 locales |');
  matrixLines.push('| `system-emptystate--*` | mobile-375, desktop-1280 | all 4 locales |');
  matrixLines.push('| `system-adminlayout--*` | desktop-1280 | all 4 locales |');
  matrixLines.push('');
  matrixLines.push('## Locale Coverage');
  matrixLines.push('');
  matrixLines.push('| Locale | Covered by | Coverage level |');
  matrixLines.push('|---|---|---|');
  matrixLines.push('| `sq` (Albanian) | Storybook global toolbar, story fixtures | Full (all 12 stories) |');
  matrixLines.push('| `en` (English) | Storybook global toolbar, story fixtures | Full (all 12 stories) |');
  matrixLines.push('| `uk` (Ukrainian) | Storybook global toolbar + explicit story variants | Full + stress variants |');
  matrixLines.push('| `it` (Italian) | Storybook global toolbar, story fixtures | Full (all 12 stories) |');
  matrixLines.push('');
  matrixLines.push('## Breakpoint Coverage');
  matrixLines.push('');
  matrixLines.push('| Breakpoint | In fast-check matrix | In full matrix | Story coverage |');
  matrixLines.push('|---|---|---|---|');
  matrixLines.push('| 320px | ✅ | ✅ | button, featuredlistings, emptystate |');
  matrixLines.push('| 360–480px | — | ✅ | (full matrix only) |');
  matrixLines.push('| 640–768px | ✅ (768px) | ✅ | sheet, dialog, tabs |');
  matrixLines.push('| 1024–1440px | ✅ (1280, 1440) | ✅ | featuredlistings, containers, admin |');
  matrixLines.push('| 1720–1920px | — | ✅ | (full matrix only) |');
  matrixLines.push('| 2560px | ✅ | ✅ | featuredlistings-huge, containers-wide |');
  matrixLines.push('| 3440px ultrawide | — | ✅ | (full matrix only) |');
  matrixLines.push('');
  matrixLines.push('## Governance Script Coverage');
  matrixLines.push('');
  matrixLines.push('| Check | Script | Coverage |');
  matrixLines.push('|---|---|---|');
  matrixLines.push('| Raw `<button>` | `governance:primitives` | All src/ |');
  matrixLines.push('| Viewport JS | `governance:ssr` | All src/ |');
  matrixLines.push('| Responsive classes | `governance:responsive` | All src/ |');
  matrixLines.push('| Tailwind entropy | `governance:tailwind` | All src/ |');
  matrixLines.push('| i18n keys | `governance:localization` | messages/*.json |');
  matrixLines.push('| Component catalog | `governance:components` | All src/ |');
  matrixLines.push('| Screenshot infra | `governance:screenshots` | scripts/ + .storybook/ |');
  matrixLines.push('');
  matrixLines.push('## Coverage Gaps');
  matrixLines.push('');
  matrixLines.push('Components without Storybook stories (future coverage targets):');
  matrixLines.push('');
  const needsStory = entries.filter(e => !e.storybook.hasColocatedStory
    && ['shared-ui', 'layout', 'admin-shared'].includes(e.type));
  matrixLines.push('| Component | Type | Risk |');
  matrixLines.push('|---|---|---|');
  for (const e of needsStory.sort((a,b)=>a.name.localeCompare(b.name))) {
    const risk = e.usesTranslations ? 'Locale-sensitive' : e.responsive.hasGrid ? 'Grid layout' : '—';
    matrixLines.push(`| \`${e.name}\` | ${e.type} | ${risk} |`);
  }

  writeFileSync(join(ROOT, 'docs', 'component-coverage-matrix.md'), matrixLines.join('\n'), 'utf8');

  // ── Risk Register ──────────────────────────────────────────────────────────
  const riskLines = [
    `# Component Risk Register — Lero.al`,
    `Last generated: ${stamp}`,
    '',
    '## Governance Violations (require fix)',
    '',
  ];

  const withViolations = entries.filter(e => e.flags.length > 0);
  if (withViolations.length === 0) {
    riskLines.push('No critical governance violations detected by static analysis.');
  } else {
    riskLines.push('| Component | File | Flags |');
    riskLines.push('|---|---|---|');
    for (const e of withViolations) {
      riskLines.push(`| \`${e.name}\` | ${e.rel} | ${e.flags.join(', ')} |`);
    }
  }

  riskLines.push('');
  riskLines.push('## Localization Risk (useTranslations)');
  riskLines.push('');
  riskLines.push('Components using `useTranslations` — require review at all 4 locales (sq, en, uk, it):');
  riskLines.push('');
  riskLines.push('| Component | Type | Ukrainian risk level |');
  riskLines.push('|---|---|---|');
  for (const e of entries.filter(e => e.usesTranslations).sort((a,b)=>a.name.localeCompare(b.name))) {
    const ukRisk = ['layout', 'shared-ui', 'admin-shared'].includes(e.type) ? 'HIGH' : 'MEDIUM';
    riskLines.push(`| \`${e.name}\` | ${e.type} | ${ukRisk} |`);
  }

  riskLines.push('');
  riskLines.push('## Mobile Risk (320px review required)');
  riskLines.push('');
  riskLines.push('| Component | Type | Mobile concern |');
  riskLines.push('|---|---|---|');
  const mobileRisk = entries.filter(e =>
    e.usesTranslations && ['shared-ui','layout','listings-feature','notifications-feature'].includes(e.type)
  );
  for (const e of mobileRisk.sort((a,b)=>a.name.localeCompare(b.name))) {
    riskLines.push(`| \`${e.name}\` | ${e.type} | Translatable text — check 320px wrapping |`);
  }

  riskLines.push('');
  riskLines.push('## Huge Desktop Risk (2560px review required)');
  riskLines.push('');
  riskLines.push('| Component | File | Issue |');
  riskLines.push('|---|---|---|');
  for (const e of entries.filter(e => !e.responsive.has2xl && e.responsive.hasGrid)) {
    riskLines.push(`| \`${e.name}\` | ${e.rel} | Grid without 2xl step — verify column count at 2560px |`);
  }

  riskLines.push('');
  riskLines.push('## Tailwind Entropy Risk');
  riskLines.push('');
  riskLines.push('Components with arbitrary Tailwind values `[value]`:');
  riskLines.push('');
  riskLines.push('| Component | Type | Arbitrary values detected |');
  riskLines.push('|---|---|---|');
  for (const e of entries.filter(e => e.tailwind.hasArbitraryTw).sort((a,b)=>a.name.localeCompare(b.name))) {
    riskLines.push(`| \`${e.name}\` | ${e.type} | Static analysis detected \`[value]\` in className |`);
  }

  riskLines.push('');
  riskLines.push('## Storybook Coverage Gap (high priority)');
  riskLines.push('');
  riskLines.push('Shared/layout/admin components without stories — highest visibility components:');
  riskLines.push('');
  riskLines.push('| Component | Type | Priority |');
  riskLines.push('|---|---|---|');
  const priorityStory = entries.filter(e =>
    !e.storybook.hasColocatedStory
    && ['shared-ui', 'layout', 'admin-shared'].includes(e.type)
    && e.usesTranslations
  );
  for (const e of priorityStory.sort((a,b)=>a.name.localeCompare(b.name))) {
    riskLines.push(`| \`${e.name}\` | ${e.type} | HIGH — locale-aware, no story |`);
  }

  writeFileSync(join(ROOT, 'docs', 'component-risk-register.md'), riskLines.join('\n'), 'utf8');
}

run().catch(err => { console.error(err); process.exit(1); });
