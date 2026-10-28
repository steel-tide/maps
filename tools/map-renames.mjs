/** Published map slugs renamed to match their titles. Keep their download history. */
export const MAP_RENAMES = {
  'map-013370': 'lakeside-ring',
  'map-0ab7c0': 'sea-and-sky-grasslands',
  'map-1ec30a': 'king-of-the-centre',
  'map-219b73': 'gangland',
  'map-3f7def': 'cloud-veil',
  'map-5254ff': 'eightfold-valley',
  'map-5e35d2': 'middle-east',
  'map-5e53c0': 'four-corners',
  'map-6bbef7': 'grand-city',
  'map-6f0680': 'escape-the-clutches',
  'map-711e46': 'sea-and-sky-sands',
  'map-a2762f': 'strongman',
  'map-a42a09': 'swamp',
  'map-b78054': 'english-channel',
  'map-e190ea': 'straight-line',
};

/** A current key wins over a stale old key; repeated builds do not add counts twice. */
export function remapMapSlugs(values) {
  const renamed = { ...values };
  for (const [oldSlug, newSlug] of Object.entries(MAP_RENAMES)) {
    if (Object.hasOwn(renamed, oldSlug)) {
      if (!Object.hasOwn(renamed, newSlug)) renamed[newSlug] = renamed[oldSlug];
      delete renamed[oldSlug];
    }
  }
  return renamed;
}

/** Rename the existing release asset so GitHub retains its download counter. */
export function renameMapAssets(assets, files, extension, renameAsset) {
  const pending = [];
  for (const [oldSlug, newSlug] of Object.entries(MAP_RENAMES)) {
    const oldName = oldSlug + extension;
    const newName = newSlug + extension;
    const asset = assets.get(oldName);
    if (!asset || !files.includes(newName) || files.includes(oldName)) continue;
    if (assets.has(newName)) throw new Error(`Cannot rename ${oldName}: ${newName} already exists on the release`);
    pending.push({ asset, oldName, newName });
  }
  for (const { asset, oldName, newName } of pending) {
    renameAsset(asset.id, newName);
    assets.delete(oldName);
    assets.set(newName, { ...asset, name: newName });
  }
}
