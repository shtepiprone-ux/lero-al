#!/usr/bin/env node
/**
 * check-schema-drift.mjs
 *
 * Parses src/types/database.ts and emits scripts/schema-drift-check.sql.
 * The SQL, when run by the owner in the Supabase SQL Editor, reports:
 *   1. Columns the TypeScript types expect but the live DB is missing
 *      (these cause PGRST204 errors at runtime).
 *   2. (Informational) DB columns absent from the TypeScript types.
 *
 * Re-run any time database.ts changes:
 *   npm run check:schema-drift
 *
 * See docs/qa-rules.md §Schema drift check.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Explicit interface→table map ──────────────────────────────────────────────
// Derived by cross-referencing database.ts interfaces with actual
// .from('<table>') calls in src/. Interfaces not confirmed via .from() are
// excluded. Non-table types (union types, JSONB shapes, computed) are excluded.
//
// Excluded — no .from() call found in src/:
//   Amenity, ListingAmenity, ListingView, AgentReview, Language,
//   CurrencyRate, NotificationSettings, SupportMessage, Conversation,
//   Message, VerificationRequest
//
// Excluded — non-table types:
//   UserRole, UserType, UserStatus, PreferredCurrency,
//   LandLegalStatus, LandZoning, LandDevelopmentPotential,
//   ListingType, PropertyType, ListingCondition, WallType, HeatingType,
//   ListingStatus, ListingCurrency, LocationType, TicketStatus,
//   VerificationStatus, ReportReason, ReportStatus, NotificationType,
//   LocationRequest (JSONB shape), CollectionWithCount (computed view type)
//
// DB columns added to types for drift-guard coverage (Task 265):
//   listings.search_vector — tsvector generated column; typed as unknown | null;
//     never SELECT-projected (filter-only via .textSearch()); included so drift
//     guard flags if the column is ever dropped from the DB schema.
const INTERFACE_TABLE_MAP = {
  User:               'users',
  UserChangeLog:      'user_change_log',
  UserStatusHistory:  'user_status_history',
  EmailChangeToken:   'email_change_tokens',
  EmailTemplate:      'email_templates',
  Location:           'locations',
  Listing:            'listings',
  ListingImage:       'listing_images',
  Favorite:           'favorites',
  FavoritePriceAlert: 'favorite_price_alerts',
  SavedSearch:        'saved_searches',
  ListingReport:      'listing_reports',
  ReportAction:       'report_actions',
  SupportTicket:      'support_tickets',
  Notification:       'notifications',
  DBCurrency:         'currencies',
  DBExchangeProvider: 'exchange_providers',
  DBPropertyType:     'property_types',
  Page:               'pages',
  SiteSetting:        'site_settings',
  Company:            'companies',
  Collection:         'collections',
  CollectionItem:     'collection_items',
  RecentlyViewed:         'recently_viewed',
  RolePermission:         'role_permissions',
  RolePermissionEvent:    'role_permission_events',
  ContactInquiry:         'contact_inquiries',
  ContactInquiryReply:    'contact_inquiry_replies',
  PublicUserProfile:      'public_user_profiles',
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseInterfaces(source) {
  const result = {}
  const interfaceRe = /export interface (\w+)[^{]*\{/g
  let match
  while ((match = interfaceRe.exec(source)) !== null) {
    const name = match[1]
    if (!(name in INTERFACE_TABLE_MAP)) continue

    // Walk forward to find the matching closing brace
    let depth = 1
    let pos = match.index + match[0].length
    let body = ''
    while (pos < source.length && depth > 0) {
      const ch = source[pos]
      if (ch === '{') depth++
      if (ch === '}') depth--
      if (depth > 0) body += ch
      pos++
    }

    // Extract field names (identifier before optional '?' and ':')
    const columns = []
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue
      const fieldMatch = trimmed.match(/^(\w+)\??:/)
      if (fieldMatch) columns.push(fieldMatch[1])
    }
    result[name] = columns
  }
  return result
}

// ── SQL emitter ───────────────────────────────────────────────────────────────

function sq(s) {
  return `'${s.replace(/'/g, "''")}'`
}

function buildValuesList(tableColumns) {
  const rows = []
  for (const [iface, cols] of Object.entries(tableColumns)) {
    const table = INTERFACE_TABLE_MAP[iface]
    for (const col of cols) {
      rows.push(`    (${sq(table)}, ${sq(col)})`)
    }
  }
  // All rows joined with commas; last row has no trailing comma
  return rows.join(',\n')
}

function emitSQL(tableColumns) {
  const valuesList = buildValuesList(tableColumns)
  const tableNames = Object.values(INTERFACE_TABLE_MAP).map(sq).join(', ')
  const now = new Date().toISOString()

  const mappingComment = Object.entries(tableColumns)
    .map(([iface, cols]) =>
      `--   ${iface.padEnd(20)} → ${INTERFACE_TABLE_MAP[iface].padEnd(24)} (${cols.length} cols)`,
    )
    .join('\n')

  return `\
-- schema-drift-check.sql
-- Generated ${now} by: npm run check:schema-drift
-- Run in Supabase SQL Editor. Read-only — does not modify any data.
--
-- Interface → table mapping covered:
${mappingComment}
--
-- To regenerate after any change to src/types/database.ts:
--   npm run check:schema-drift

-- ═══════════════════════════════════════════════════════════════════════════
-- RESULT SET 1: columns EXPECTED by TypeScript types but MISSING in live DB
--   → each row here is a potential PGRST204 runtime error on write
-- ═══════════════════════════════════════════════════════════════════════════

WITH expected(table_name, column_name) AS (
  VALUES
${valuesList}
)
SELECT
  e.table_name,
  e.column_name,
  'missing in DB' AS status
FROM expected e
LEFT JOIN information_schema.columns ic
  ON  ic.table_schema = 'public'
  AND ic.table_name   = e.table_name
  AND ic.column_name  = e.column_name
WHERE ic.column_name IS NULL
ORDER BY e.table_name, e.column_name;


-- ═══════════════════════════════════════════════════════════════════════════
-- RESULT SET 2 (informational): DB columns ABSENT from TypeScript types
--   → may be intentional (DB internals, deprecated cols, audit triggers, etc.)
-- ═══════════════════════════════════════════════════════════════════════════

WITH expected(table_name, column_name) AS (
  VALUES
${valuesList}
)
SELECT
  ic.table_name,
  ic.column_name,
  'not in types' AS status
FROM information_schema.columns ic
LEFT JOIN expected e
  ON  e.table_name   = ic.table_name
  AND e.column_name  = ic.column_name
WHERE ic.table_schema = 'public'
  AND ic.table_name IN (${tableNames})
  AND e.column_name IS NULL
ORDER BY ic.table_name, ic.column_name;
`
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const dbTypesPath = resolve(ROOT, 'src/types/database.ts')
  const sqlOutPath  = resolve(ROOT, 'scripts/schema-drift-check.sql')

  const source     = readFileSync(dbTypesPath, 'utf-8')
  const interfaces = parseInterfaces(source)

  const tableColumns = {}
  for (const iface of Object.keys(INTERFACE_TABLE_MAP)) {
    if (interfaces[iface]) {
      tableColumns[iface] = interfaces[iface]
    } else {
      console.warn(`Warning: interface '${iface}' not found in database.ts — skipped`)
    }
  }

  const sql = emitSQL(tableColumns)
  writeFileSync(sqlOutPath, sql, 'utf-8')

  const totalCols = Object.values(tableColumns).reduce((s, c) => s + c.length, 0)
  console.log(`✔ Generated: scripts/schema-drift-check.sql`)
  console.log(`  Tables covered : ${Object.keys(tableColumns).length}`)
  console.log(`  Columns tracked: ${totalCols}`)
  console.log('')
  console.log('  Interface            → Table                      Cols')
  console.log('  ─────────────────────────────────────────────────────')
  for (const [iface, cols] of Object.entries(tableColumns)) {
    console.log(
      `  ${iface.padEnd(20)} → ${INTERFACE_TABLE_MAP[iface].padEnd(24)} ${cols.length}`,
    )
  }
  console.log('')
  console.log('Next: run scripts/schema-drift-check.sql in the Supabase SQL Editor.')
}

main()
