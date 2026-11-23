// cloudinary-config.mjs (whole-project audit 2026-11-06, X-01 and G-01): an unsigned preset is refused, a signed-only
// configuration passes, a widget preset name that does not exist is refused, and the API key and secret never print.
// Task 957 (AC10): U3 — the preset named by CLOUDINARY_LISTING_PRESET exists, is signed, allows only jpg, jpeg, png and
// webp and bounds the stored size with an incoming transformation; U4 — every Cloudinary address the database stores
// names an asset that exists (on 2026-11-18 a console folder deletion left account #3's avatar_url on a deleted file).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPresets, checkReferences, cloudinaryAddresses, publicIdOf, scrub } from './cloudinary-config.mjs';

const LISTING = { name: 'listing-signed', unsigned: false, settings: { allowed_formats: 'jpg,jpeg,png,webp', transformation: 'c_limit,w_2560,h_2560' } };

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

test('U3: the listing preset as the owner created it (signed, four formats, c_limit with a width and a height) passes', () => {
  assert.deepEqual(checkPresets([LISTING], { listingPreset: 'listing-signed' }), []);
  // the Admin API may also answer the transformation as a list of objects
  const objects = { ...LISTING, settings: { ...LISTING.settings, transformation: [{ crop: 'limit', width: 2560, height: 2560 }] } };
  assert.deepEqual(checkPresets([objects], { listingPreset: 'listing-signed' }), []);
});

test('U3: a missing, unsigned, unbounded or wider-format listing preset is each refused', () => {
  const one = (settings, extra = {}) => checkPresets([{ ...LISTING, ...extra, settings: { ...LISTING.settings, ...settings } }], { listingPreset: 'listing-signed' }).filter((f) => f.id === 'U3');
  assert.equal(checkPresets([LISTING], { listingPreset: 'other' }).filter((f) => f.id === 'U3').length, 1, 'no preset of that name');
  assert.equal(checkPresets([], {}).length, 0, 'U3 is not judged when CLOUDINARY_LISTING_PRESET is unset');
  assert.equal(checkPresets([LISTING], { listingPreset: undefined, requireListingPreset: true }).filter((f) => f.id === 'U3').length, 1, 'the variable is required');
  assert.equal(one({}, { unsigned: true }).length, 1, 'unsigned');
  assert.equal(one({ allowed_formats: undefined }).length, 1, 'any format');
  assert.equal(one({ allowed_formats: 'jpg,png,gif' }).length, 1, 'gif allowed');
  assert.equal(one({ allowed_formats: 'jpg,svg' }).length, 1, 'svg allowed');
  assert.equal(one({ transformation: undefined }).length, 1, 'no incoming transformation');
  assert.equal(one({ transformation: 'c_limit,w_2560' }).length, 1, 'a width without a height');
  assert.equal(one({ transformation: 'e_sharpen' }).length, 1, 'a transformation that bounds nothing');
  assert.equal(one({ transformation: 'c_crop,w_2560,h_2560' }).length, 1, 'a crop mode that does not bound the image');
  assert.equal(one({ transformation: [{ crop: 'limit', width: 2560 }] }).length, 1, 'an object without a height');
});

test('U4: the public id of a delivery address, as publicIdFromUrl derives it', () => {
  const cloud = 'demo';
  assert.equal(publicIdOf('https://res.cloudinary.com/demo/image/upload/v1700000000/u-1/listings/abc.jpg', cloud), 'u-1/listings/abc');
  assert.equal(publicIdOf('https://res.cloudinary.com/demo/image/upload/c_fill,w_100/v1/u-1/avatars/a.webp', cloud), 'u-1/avatars/a');
  assert.equal(publicIdOf('https://res.cloudinary.com/demo/image/upload/Lero/logo.png', cloud), 'Lero/logo');
  assert.equal(publicIdOf('https://res.cloudinary.com/other/image/upload/v1/x.jpg', cloud), null, 'another cloud');
  assert.equal(publicIdOf('https://evil.example/demo/image/upload/v1/x.jpg', cloud), null, 'another host');
  assert.equal(publicIdOf('http://res.cloudinary.com/demo/image/upload/v1/x.jpg', cloud), null, 'not https');
  assert.equal(publicIdOf(null, cloud), null);
});

test('U4: every address in a text, a JSON document or a list is found', () => {
  const html = '<p><img src="https://res.cloudinary.com/demo/image/upload/v1/pages/a.png"> and https://res.cloudinary.com/demo/image/upload/v2/pages/b.jpg</p>';
  assert.deepEqual(cloudinaryAddresses(html), ['https://res.cloudinary.com/demo/image/upload/v1/pages/a.png', 'https://res.cloudinary.com/demo/image/upload/v2/pages/b.jpg']);
  assert.deepEqual(cloudinaryAddresses({ blocks: [{ src: 'https://res.cloudinary.com/demo/image/upload/v3/c.webp' }] }), ['https://res.cloudinary.com/demo/image/upload/v3/c.webp']);
  assert.deepEqual(cloudinaryAddresses('no address here'), []);
  assert.deepEqual(cloudinaryAddresses(null), []);
});

test('U4: an address whose asset is gone is a finding naming the column and the row; an existing one and a foreign address are not', () => {
  const refs = [
    { column: 'users.avatar_url', row: '7', url: 'https://res.cloudinary.com/demo/image/upload/v1/u-7/avatars/gone.jpg' },
    { column: 'listing_images.url', row: '9', url: 'https://res.cloudinary.com/demo/image/upload/v1/u-7/listings/kept.jpg' },
    { column: 'companies.logo_url', row: '3', url: 'https://example.com/logo.png' },
  ];
  const f = checkReferences(refs, new Set(['u-7/listings/kept']), 'demo');
  assert.deepEqual(f.map((x) => x.id), ['U4']);
  assert.match(f[0].object, /users\.avatar_url row 7/);
  assert.match(f[0].message, /u-7\/avatars\/gone/);
  assert.deepEqual(checkReferences(refs.slice(1), new Set(['u-7/listings/kept']), 'demo'), []);
});

test('the API key and secret never reach a printed error', () => {
  const shown = scrub('401 for 123456789012345:AbCdEfGhIjKlMnOp', ['123456789012345', 'AbCdEfGhIjKlMnOp']);
  assert.ok(!shown.includes('123456789012345') && !shown.includes('AbCdEfGhIjKlMnOp'));
});
