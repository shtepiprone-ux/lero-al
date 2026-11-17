// db-types-drift.mjs (Task 956 AC8, whole-project audit L-04): the hand-written row types of src/types/database.ts are
// compared with the columns of a saved catalog snapshot. A removed, an added and a retyped column each fail; so do a
// changed nullability, a changed enum, an unknown database type and an interface nobody classified. No database is
// touched: the comparison runs on fixtures and on the repository's own types file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NOT_TABLE_TYPES, TABLE_TYPES, typesDrift } from './db-types-drift.mjs';

const TYPES = `
export type Status = 'draft' | 'live'
export interface Shape { a: string }
export interface Thing {
  id: string
  count: number | null
  tags: string[]
  meta: Record<string, unknown> | null
  shape: Shape | null
  status: Status
  flag: boolean
  search: unknown | null
}
export interface ThingView { id: string; label: string }
`;
const col = (table, name, udt, nullable, extra = {}) => ({ table, kind: 'r', name, type: udt, udt, typtype: 'b', nullable, is_array: false, enum_values: null, ...extra });
/** A snapshot whose columns match TYPES exactly. */
function catalog() {
  return {
    columns: [
      col('things', 'id', 'uuid', false),
      col('things', 'count', 'int4', true),
      col('things', 'tags', 'text', false, { type: 'text[]', is_array: true }),
      col('things', 'meta', 'jsonb', true),
      col('things', 'shape', 'jsonb', true),
      col('things', 'status', 'thing_status', false, { typtype: 'e', enum_values: ['draft', 'live'] }),
      col('things', 'flag', 'bool', false),
      col('things', 'search', 'tsvector', true),
      col('thing_view', 'id', 'uuid', true, { kind: 'v' }),
      col('thing_view', 'label', 'text', true, { kind: 'v' }),
      col('untyped_log', 'id', 'int8', false),
    ],
  };
}
const OPTS = { tableTypes: { Thing: 'things', ThingView: 'thing_view' }, notTableTypes: { Shape: 'jsonb shape of things.shape' } };
const drift = (cat, source = TYPES, opts = OPTS) => typesDrift({ typesSource: source, catalog: cat, ...opts });

test('types that match the catalog have no difference; a view column is not held to the null rule', () => {
  assert.deepEqual(drift(catalog()).differences, []);
  assert.deepEqual(drift(catalog()).untypedRelations, ['untyped_log']);
});

test('a column removed from the database fails', () => {
  const cat = catalog(); cat.columns = cat.columns.filter((c) => !(c.table === 'things' && c.name === 'flag'));
  assert.deepEqual(drift(cat).differences, ['things.flag: in src/types/database.ts (Thing) but not in the catalog']);
});

test('a column added to the database fails', () => {
  const cat = catalog(); cat.columns.push(col('things', 'archived_at', 'timestamptz', true));
  assert.deepEqual(drift(cat).differences, ['things.archived_at: in the catalog (timestamptz) but not in src/types/database.ts (Thing)']);
});

test('a retyped column fails: integer to text, an array to text, jsonb to text', () => {
  const cat = catalog(); cat.columns.find((c) => c.name === 'count').udt = 'text';
  assert.deepEqual(drift(cat).differences, ['things.count: the catalog type text needs string in TypeScript; Thing.count is number']);
  const arr = catalog(); Object.assign(arr.columns.find((c) => c.name === 'tags'), { is_array: false, type: 'text' });
  assert.deepEqual(drift(arr).differences, ['things.tags: the catalog type text needs string in TypeScript; Thing.tags is array:string']);
  const json = catalog(); json.columns.find((c) => c.name === 'meta').udt = 'text';
  assert.deepEqual(drift(json).differences, ['things.meta: the catalog type text needs string in TypeScript; Thing.meta is object']);
});

test('a changed nullability fails on a table, in both directions', () => {
  const cat = catalog(); cat.columns.find((c) => c.name === 'count').nullable = false;
  assert.deepEqual(drift(cat).differences, ['things.count: NOT NULL in the catalog, but Thing.count admits null']);
  const cat2 = catalog(); cat2.columns.find((c) => c.name === 'flag').nullable = true;
  assert.deepEqual(drift(cat2).differences, ['things.flag: nullable in the catalog, but Thing.flag does not admit null']);
});

test('an enum whose labels differ from the TypeScript literals fails; plain string for an enum is accepted', () => {
  const cat = catalog(); cat.columns.find((c) => c.name === 'status').enum_values = ['draft', 'live', 'gone'];
  assert.deepEqual(drift(cat).differences, ['things.status: enum thing_status is draft, gone, live in the catalog; Thing.status allows draft, live']);
  assert.deepEqual(drift(catalog(), TYPES.replace('status: Status', 'status: string')).differences, []);
});

test('an optional property, an unknown database type, a missing table and an unclassified interface each fail', () => {
  assert.deepEqual(drift(catalog(), TYPES.replace('flag: boolean', 'flag?: boolean')).differences, ['things.flag: Thing.flag is optional; a row always has every column']);
  const cat = catalog(); cat.columns.find((c) => c.name === 'flag').udt = 'circle';
  assert.deepEqual(drift(cat).differences, ['things.flag: the catalog type circle has no TypeScript mapping in db-types-drift.mjs']);
  const gone = catalog(); gone.columns = gone.columns.filter((c) => c.table !== 'thing_view');
  assert.deepEqual(drift(gone).differences, ['thing_view: ThingView maps to it, but the catalog has no such table or view']);
  assert.deepEqual(drift(catalog(), `${TYPES}\nexport interface Other { id: string }\n`).differences, ['Other: an exported interface of src/types/database.ts that is neither a table type nor listed as not a table']);
});

test('a snapshot without the columns query cannot be compared', () => {
  assert.throws(() => drift({ tables: [] }), /no columns/);
});

test('the repository: every mapped and every listed interface exists, and every exported interface is classified', () => {
  const source = readFileSync(new URL('../../src/types/database.ts', import.meta.url), 'utf8');
  const exported = [...source.matchAll(/^export interface (\w+)/gm)].map((m) => m[1]);
  for (const name of [...Object.keys(TABLE_TYPES), ...Object.keys(NOT_TABLE_TYPES)]) assert.ok(exported.includes(name), `${name} is not in database.ts`);
  for (const name of exported) assert.ok(Object.hasOwn(TABLE_TYPES, name) || Object.hasOwn(NOT_TABLE_TYPES, name), `${name} is not classified`);
  assert.equal(new Set(Object.values(TABLE_TYPES)).size, Object.values(TABLE_TYPES).length, 'two interfaces map to one table');
});
