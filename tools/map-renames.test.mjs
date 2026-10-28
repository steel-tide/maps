import assert from 'node:assert/strict';
import test from 'node:test';
import { MAP_RENAMES, remapMapSlugs, renameMapAssets } from './map-renames.mjs';

const extension = '.steel-tide-map';
const renames = Object.entries(MAP_RENAMES);
const files = renames.map(([, slug]) => slug + extension);

function oldAssets() {
  return new Map(renames.map(([slug], i) => [slug + extension, {
    id: i + 1, name: slug + extension, download_count: 10 + i,
  }]));
}

test('renaming preserves asset IDs, live downloads, carried counts and content hashes', () => {
  const assets = oldAssets();
  const carried = remapMapSlugs(Object.fromEntries(renames.map(([slug], i) => [slug, 100 + i])));
  const hashes = remapMapSlugs(Object.fromEntries(renames.map(([slug], i) => [slug, `hash-${i}`])));
  const calls = [];
  renameMapAssets(assets, files, extension, (id, name) => calls.push({ id, name }));
  assert.equal(calls.length, renames.length);
  renames.forEach(([oldSlug, newSlug], i) => {
    const asset = assets.get(newSlug + extension);
    assert.equal(assets.has(oldSlug + extension), false);
    assert.deepEqual(asset, { id: i + 1, name: newSlug + extension, download_count: 10 + i });
    assert.deepEqual(calls[i], { id: i + 1, name: newSlug + extension });
    assert.equal(carried[newSlug] + asset.download_count, 110 + 2 * i);
    assert.equal(hashes[newSlug], `hash-${i}`);
    assert.equal(Object.hasOwn(carried, oldSlug), false);
    assert.equal(Object.hasOwn(hashes, oldSlug), false);
  });
  renameMapAssets(assets, files, extension, () => assert.fail('already renamed'));
  assert.deepEqual(remapMapSlugs(carried), carried);
});

test('current counts win over stale old keys, including a current zero', () => {
  const input = { 'map-6bbef7': 172, 'grand-city': 0, crossroads: 3 };
  assert.deepEqual(remapMapSlugs(input), { 'grand-city': 0, crossroads: 3 });
  assert.equal(input['map-6bbef7'], 172);
});

test('a partially completed release rename can be retried without replacing assets', () => {
  const assets = oldAssets();
  let completed = 0;
  assert.throws(() => renameMapAssets(assets, files, extension, () => {
    if (completed === 1) throw new Error('connection interrupted');
    completed++;
  }), /connection interrupted/);
  assert.ok(assets.has(files[0]));
  renameMapAssets(assets, files, extension, () => completed++);
  assert.equal(completed, renames.length);
  assert.equal(assets.size, renames.length);
});

test('asset name conflicts stop the migration before making any remote changes', () => {
  const assets = oldAssets();
  const name = files.at(-1);
  assets.set(name, { id: 999, name, download_count: 50 });
  const before = new Map(assets);
  assert.throws(() => renameMapAssets(assets, files, extension, () => assert.fail('remote change')), /already exists/);
  assert.deepEqual(assets, before);
});

test('maps absent from the checkout or still using their old filename are left alone', () => {
  const assets = oldAssets();
  const before = new Map(assets);
  const [oldSlug, newSlug] = renames[0];
  renameMapAssets(assets, [oldSlug + extension, newSlug + extension], extension, () => assert.fail('remote change'));
  assert.deepEqual(assets, before);
});
