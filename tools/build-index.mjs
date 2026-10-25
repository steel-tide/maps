#!/usr/bin/env node
/**
 * Write catalog.json — what the game's community maps list reads: one entry
 * per map under maps/ that passes the check, with its name, description,
 * size, seats, author, last change and download count, and the name of its
 * thumbnail — and thumbs/<slug>/<hash>.json, the thumbnail itself (the
 * terrain at up to 64 cells a side), named by its content's hash, so a page
 * of cards fetches its own thumbnails and no more, and a map is fetched only
 * when it is taken. index.json, every entry with its thumbnail inline, is
 * written too, for the released games that read it. Run by CI on every push
 * to main and nightly (for the counts); run it yourself to see what the
 * entry for your map will look like.
 *
 *   node tools/build-index.mjs [--counts <file>]
 *
 * `--counts` is the file tools/sync-release.mjs writes: the download count
 * per slug, from the release the maps are attached to. Without it, the
 * counts already in catalog.json (or index.json) are kept.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkMapFile, CUSTOM_MAP_EXT, indexEntryFor, MAP_REGISTRY_DIR, MAP_THUMB_DIR, mapSummaryFor, parseMapCatalog, parseMapIndex, thumbFileFor,
} from './steel-tide-map.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const mapsDir = join(root, MAP_REGISTRY_DIR);
const args = process.argv.slice(2);
const countsFile = args.includes('--counts') ? resolve(args[args.indexOf('--counts') + 1]) : null;

function git(...argv) {
  try {
    return execFileSync('git', argv, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// the counts: the sync's file, else what the last catalogue (or index) said
let counts = {};
if (countsFile && existsSync(countsFile)) counts = JSON.parse(readFileSync(countsFile, 'utf8'));
else if (existsSync(join(root, 'catalog.json')) || existsSync(join(root, 'index.json'))) {
  const last = existsSync(join(root, 'catalog.json'))
    ? parseMapCatalog(readFileSync(join(root, 'catalog.json'), 'utf8'))
    : parseMapIndex(readFileSync(join(root, 'index.json'), 'utf8'));
  for (const m of last?.maps ?? []) if (m.downloads !== undefined) counts[m.slug] = m.downloads;
}

const maps = [];
for (const file of readdirSync(mapsDir).filter((f) => f.endsWith(CUSTOM_MAP_EXT)).sort()) {
  const path = `${MAP_REGISTRY_DIR}/${file}`;
  const result = checkMapFile(readFileSync(join(mapsDir, file), 'utf8'), file);
  if (!result.ok) {
    console.warn(`skipping ${path}: ${result.error}`);
    continue;
  }
  // whoever first committed it, and when it last changed
  const author = git('log', '--diff-filter=A', '--format=%an', '--', path).split('\n').filter(Boolean).pop() || undefined;
  const updated = git('log', '-1', '--format=%cI', '--', path) || undefined;
  maps.push(indexEntryFor(result.data, result.slug, { author, updated, downloads: counts[result.slug] ?? 0 }));
}

const generated = new Date().toISOString();
const thumbDir = join(root, MAP_THUMB_DIR);
mkdirSync(thumbDir, { recursive: true });
const summaries = maps.map((entry) => {
  // a thumbnail changes only when the map's ground or marks do; its name is its hash
  const json = JSON.stringify(thumbFileFor(entry)) + '\n';
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 16);
  const folder = join(thumbDir, entry.slug);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, `${hash}.json`), json);
  return mapSummaryFor(entry, hash);
});
// Earlier thumbnails stay while a cached catalogue may still name them;
// a map taken out of the registry takes its thumbnails with it.
const slugs = new Set(maps.map((entry) => entry.slug));
for (const name of readdirSync(thumbDir)) {
  if (!slugs.has(name)) rmSync(join(thumbDir, name), { recursive: true, force: true });
}
const catalog = { format: 'steel-tide-map-catalog', v: 1, generated, maps: summaries };
writeFileSync(join(root, 'catalog.json'), JSON.stringify(catalog) + '\n');
const index = { format: 'steel-tide-map-index', v: 1, generated, maps };
writeFileSync(join(root, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`catalog.json + ${MAP_THUMB_DIR}/ + index.json: ${maps.length} map${maps.length === 1 ? '' : 's'}`);
