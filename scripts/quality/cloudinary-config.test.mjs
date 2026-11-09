// cloudinary-config.mjs (whole-project audit 2026-11-06, X-01 and G-01): an unsigned preset is refused, a signed-only
// configuration passes, a widget preset name that does not exist is refused, and the API key and secret never print.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPresets, scrub } from './cloudinary-config.mjs';

test('signed presets only: no finding', () => {
  assert.deepEqual(checkPresets([{ name: 'server', unsigned: false, settings: {} }]), []);
});

test('U1 (X-01): an unsigned preset is refused, and the widget preset is named as such', () => {
  const f = checkPresets([{ name: 'lero-al', unsigned: true, settings: {} }, { name: 'server', unsigned: false }], { widgetPreset: 'lero-al' });
  assert.deepEqual(f.map((x) => x.id), ['U1']);
  assert.match(f[0].object, /NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET/);
});

test('U2: the public preset name points at no preset', () => {
  assert.deepEqual(checkPresets([{ name: 'server', unsigned: false }], { widgetPreset: 'gone' }).map((x) => x.id), ['U2']);
});

test('the API key and secret never reach a printed error', () => {
  const shown = scrub('401 for 123456789012345:AbCdEfGhIjKlMnOp', ['123456789012345', 'AbCdEfGhIjKlMnOp']);
  assert.ok(!shown.includes('123456789012345') && !shown.includes('AbCdEfGhIjKlMnOp'));
});
