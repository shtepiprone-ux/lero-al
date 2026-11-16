#!/usr/bin/env node
// The hand-written row types of src/types/database.ts against the database catalog (Task 956 AC8; whole-project audit
// L-04: the types are written by hand, so nothing tells the application when a column is added, removed or retyped).
// Every table type is compared column by column with the `columns` query of a catalog snapshot written by
// `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json`: the set of columns, the TypeScript kind each
// database type needs, the labels of an enum written as string literals (a plain `string` is accepted; an enum array is
// checked for its kind only), and NULL on a table (a view's columns are always reported nullable by Postgres, so a view
// is not held to the null rule). No database is touched.
// OWASP: Secure Code Review (configuration drift found by a tool), Database Security (the code knows the schema it runs on).
//
// Usage: node scripts/quality/db-types-drift.mjs [--catalog <snapshot.json>] [--types <database.ts>]
// Defaults: supabase/catalog.json and src/types/database.ts. Exit 0 = no difference, 1 = differences, 2 = an input could
// not be read.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const ts = createRequire(import.meta.url)('typescript');

/** Interface of src/types/database.ts → the public table or view whose row it describes. */
export const TABLE_TYPES = {
  AgentReview: 'agent_reviews',
  Amenity: 'amenities',
  Collection: 'collections',
  CollectionItem: 'collection_items',
  Company: 'companies',
  ContactInquiry: 'contact_inquiries',
  ContactInquiryReply: 'contact_inquiry_replies',
  Conversation: 'conversations',
  CurrencyRate: 'currency_rates',
  DBCurrency: 'currencies',
  DBPropertyType: 'property_types',
  EmailChangeToken: 'email_change_tokens',
  EmailTemplate: 'email_templates',
  Favorite: 'favorites',
  FavoritePriceAlert: 'favorite_price_alerts',
  HistoryClearEvent: 'history_clear_events',
  Language: 'languages',
  Listing: 'listings',
  ListingActivityDaily: 'listing_activity_daily',
  ListingActivityRefresh: 'listing_activity_refresh',
  ListingAmenity: 'listing_amenities',
  ListingContactEvent: 'listing_contact_events',
  ListingContactReveal: 'listing_contact_reveals',
  ListingImage: 'listing_images',
  ListingInquiry: 'listing_inquiries',
  ListingReport: 'listing_reports',
  ListingView: 'listing_views',
  Location: 'locations',
  Message: 'messages',
  Notification: 'notifications',
  NotificationSettings: 'notification_settings',
  Page: 'pages',
  PublicUserProfile: 'public_user_profiles',
  RecentlyViewed: 'recently_viewed',
  ReportAction: 'report_actions',
  RolePermission: 'role_permissions',
  RolePermissionEvent: 'role_permission_events',
  SavedSearch: 'saved_searches',
  SiteFooter: 'site_footer',
  SiteSetting: 'site_settings',
  SupportMessage: 'support_messages',
  SupportTicket: 'support_tickets',
  SupportTicketEvent: 'support_ticket_events',
  User: 'users',
  UserChangeLog: 'user_change_log',
  UserStatusHistory: 'user_status_history',
  VerificationRequest: 'verification_requests',
};

/** Exported interfaces of src/types/database.ts that are not a table row, each with what it is (read from that file). */
export const NOT_TABLE_TYPES = {
  CollectionWithCount: 'Collection plus item_count',
  FooterLink: 'one element of the SiteFooter link arrays',
  LocationRequest: 'the shape of User.location_request',
  PageContent: 'the shape of Page.content',
  PageLocaleContent: 'one locale of PageContent',
};

/** Database type (pg_type.typname) → the TypeScript kind a row value of it has. */
const PG_KIND = {
  bool: 'boolean',
  bpchar: 'string', citext: 'string', date: 'string', inet: 'string', interval: 'string', name: 'string', text: 'string',
  time: 'string', timestamp: 'string', timestamptz: 'string', timetz: 'string', uuid: 'string', varchar: 'string',
  float4: 'number', float8: 'number', int2: 'number', int4: 'number', int8: 'number', numeric: 'number',
  json: 'json', jsonb: 'json',
  tsvector: 'unknown',
};
const NEEDS = { json: 'an object, an array or unknown', unknown: 'unknown' };
const SK = ts.SyntaxKind;
const refName = (n) => (ts.isIdentifier(n.typeName) ? n.typeName.text : null);

/** What a TypeScript type node admits: null or not, its kinds, and its string literals (open = a plain `string` is in it). */
function describe(node, decls, seen = new Set()) {
  const d = { nullable: false, kinds: new Set(), literals: new Set(), open: false };
  const add = (n) => {
    if (ts.isParenthesizedTypeNode(n)) return add(n.type);
    if (ts.isUnionTypeNode(n)) return n.types.forEach(add);
    if (ts.isLiteralTypeNode(n)) {
      const l = n.literal;
      if (l.kind === SK.NullKeyword) d.nullable = true;
      else if (ts.isStringLiteral(l)) { d.kinds.add('string'); d.literals.add(l.text); }
      else if (ts.isNumericLiteral(l)) d.kinds.add('number');
      else if (l.kind === SK.TrueKeyword || l.kind === SK.FalseKeyword) d.kinds.add('boolean');
      else d.kinds.add('unsupported');
      return undefined;
    }
    if (n.kind === SK.NullKeyword) { d.nullable = true; return undefined; }
    if (n.kind === SK.StringKeyword) { d.kinds.add('string'); d.open = true; return undefined; }
    if (n.kind === SK.NumberKeyword) { d.kinds.add('number'); return undefined; }
    if (n.kind === SK.BooleanKeyword) { d.kinds.add('boolean'); return undefined; }
    if (n.kind === SK.UnknownKeyword || n.kind === SK.AnyKeyword) { d.kinds.add('unknown'); return undefined; }
    if (ts.isArrayTypeNode(n)) { d.kinds.add(`array:${[...describe(n.elementType, decls, seen).kinds].sort().join('|')}`); return undefined; }
    if (ts.isTypeLiteralNode(n)) { d.kinds.add('object'); return undefined; }
    if (ts.isTypeReferenceNode(n)) {
      const name = refName(n);
      if (name === 'Array' && n.typeArguments?.length === 1) { d.kinds.add(`array:${[...describe(n.typeArguments[0], decls, seen).kinds].sort().join('|')}`); return undefined; }
      if (name === 'Record' || decls.interfaces.has(name)) { d.kinds.add('object'); return undefined; }
      if (decls.aliases.has(name) && !seen.has(name)) {
        const inner = describe(decls.aliases.get(name), decls, new Set([...seen, name]));
        d.nullable ||= inner.nullable; d.open ||= inner.open;
        for (const k of inner.kinds) d.kinds.add(k);
        for (const l of inner.literals) d.literals.add(l);
        return undefined;
      }
      d.kinds.add(`unresolved ${name ?? 'qualified name'}`);
      return undefined;
    }
    d.kinds.add('unsupported');
    return undefined;
  };
  add(node);
  return d;
}

/** The property signatures of a local interface, its local `extends` bases first; a member it cannot read is a problem. */
function members(name, decls, problems, seen = new Set()) {
  const decl = decls.interfaces.get(name);
  const out = new Map();
  if (!decl || seen.has(name)) return out;
  for (const clause of decl.heritageClauses ?? []) {
    for (const base of clause.types) {
      const baseName = ts.isIdentifier(base.expression) ? base.expression.text : null;
      if (baseName && decls.interfaces.has(baseName)) for (const [k, v] of members(baseName, decls, problems, new Set([...seen, name]))) out.set(k, v);
      else problems.push(`${name}: extends ${baseName ?? 'an expression'}, which is not an interface of the same file`);
    }
  }
  for (const m of decl.members) {
    const key = m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : null;
    if (!ts.isPropertySignature(m) || !key || !m.type) { problems.push(`${name}: a member that is not a typed property`); continue; }
    out.set(key, { type: m.type, optional: Boolean(m.questionToken) });
  }
  return out;
}

/**
 * Compares the table types of `typesSource` with `catalog.columns`. Returns `{ differences, untypedRelations }`: every
 * difference as one sorted line, and the catalog tables and views that no interface describes (reported, not failed:
 * the task compares the tables the types file declares).
 */
export function typesDrift({ typesSource, catalog, tableTypes = TABLE_TYPES, notTableTypes = NOT_TABLE_TYPES }) {
  if (!Array.isArray(catalog?.columns)) throw new Error('the snapshot has no columns query: save it again with `node scripts/quality/db-catalog-audit.mjs --save <file>`');
  const sf = ts.createSourceFile('database.ts', typesSource, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const decls = { interfaces: new Map(), aliases: new Map() };
  const exported = [];
  for (const st of sf.statements) {
    if (ts.isInterfaceDeclaration(st)) {
      decls.interfaces.set(st.name.text, st);
      if (st.modifiers?.some((m) => m.kind === SK.ExportKeyword)) exported.push(st.name.text);
    } else if (ts.isTypeAliasDeclaration(st)) decls.aliases.set(st.name.text, st.type);
  }
  const out = [];
  for (const name of exported) {
    if (!Object.hasOwn(tableTypes, name) && !Object.hasOwn(notTableTypes, name)) out.push(`${name}: an exported interface of src/types/database.ts that is neither a table type nor listed as not a table`);
  }
  for (const name of Object.keys(notTableTypes)) if (!decls.interfaces.has(name)) out.push(`${name}: listed as not a table in db-types-drift.mjs, but src/types/database.ts has no such interface`);

  const byTable = new Map();
  for (const c of catalog.columns) byTable.set(c.table, [...(byTable.get(c.table) ?? []), c]);
  for (const [iface, table] of Object.entries(tableTypes)) {
    if (!decls.interfaces.has(iface)) { out.push(`${iface}: mapped to ${table} in db-types-drift.mjs, but src/types/database.ts has no such interface`); continue; }
    const cols = byTable.get(table);
    if (!cols) { out.push(`${table}: ${iface} maps to it, but the catalog has no such table or view`); continue; }
    const props = members(iface, decls, out);
    for (const c of cols) {
      const at = `${table}.${c.name}`;
      const prop = props.get(c.name);
      if (!prop) { out.push(`${at}: in the catalog (${c.type}) but not in src/types/database.ts (${iface})`); continue; }
      const p = `${iface}.${c.name}`;
      if (prop.optional) out.push(`${at}: ${p} is optional; a row always has every column`);
      const base = c.typtype === 'e' ? 'string' : PG_KIND[c.udt];
      if (!base) { out.push(`${at}: the catalog type ${c.udt} has no TypeScript mapping in db-types-drift.mjs`); continue; }
      const want = c.is_array ? `array:${base}` : base;
      const d = describe(prop.type, decls);
      const kinds = [...d.kinds].sort();
      const fits = want === 'json'
        ? kinds.length > 0 && kinds.every((k) => k === 'object' || k === 'unknown' || k.startsWith('array:'))
        : kinds.length === 1 && kinds[0] === want;
      if (!fits) out.push(`${at}: the catalog type ${c.is_array ? `${c.udt}[]` : c.udt} needs ${NEEDS[want] ?? want} in TypeScript; ${p} is ${kinds.join(' | ') || 'nothing'}`);
      else if (c.typtype === 'e' && !c.is_array && !d.open) {
        const labels = [...(c.enum_values ?? [])].sort();
        const literals = [...d.literals].sort();
        if (labels.join('\n') !== literals.join('\n')) out.push(`${at}: enum ${c.udt} is ${labels.join(', ')} in the catalog; ${p} allows ${literals.join(', ')}`);
      }
      if (c.kind === 'r' || c.kind === 'p') {
        if (c.nullable && !d.nullable) out.push(`${at}: nullable in the catalog, but ${p} does not admit null`);
        if (!c.nullable && d.nullable) out.push(`${at}: NOT NULL in the catalog, but ${p} admits null`);
      }
    }
    const catalogNames = new Set(cols.map((c) => c.name));
    for (const name of props.keys()) if (!catalogNames.has(name)) out.push(`${table}.${name}: in src/types/database.ts (${iface}) but not in the catalog`);
  }
  const typed = new Set(Object.values(tableTypes));
  return { differences: [...new Set(out)].sort(), untypedRelations: [...byTable.keys()].filter((t) => !typed.has(t)).sort() };
}

function main(argv) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  // A path given on the command line is relative to the working directory; the defaults are in the repository.
  const arg = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? path.resolve(argv[i + 1] ?? '') : path.join(root, fallback); };
  const catalogFile = arg('--catalog', 'supabase/catalog.json');
  const typesFile = arg('--types', 'src/types/database.ts');
  let result;
  try {
    if (!existsSync(catalogFile)) throw new Error(`no snapshot at ${path.relative(root, catalogFile)}: write it with \`node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json\``);
    result = typesDrift({ typesSource: readFileSync(typesFile, 'utf8'), catalog: JSON.parse(readFileSync(catalogFile, 'utf8')) });
  } catch (e) {
    console.error(`db-types-drift: ${e.message}`);
    return 2;
  }
  console.log(`db-types-drift: ${Object.keys(TABLE_TYPES).length} table types compared; catalog relations without a type: ${result.untypedRelations.join(', ') || 'none'}`);
  for (const d of result.differences) console.log(d);
  console.log(result.differences.length ? `db-types-drift: ${result.differences.length} difference(s)` : 'db-types-drift: no difference');
  return result.differences.length ? 1 : 0;
}

if (isEntryPoint(import.meta.url)) process.exitCode = main(process.argv.slice(2));
