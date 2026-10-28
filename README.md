# steel-tide-maps

The public registry of maps for [Steel Tide](https://steelti.de), the browser
RTS. A map is one `.steel-tide-map` file, painted in the game's **Map Editor**
and played exactly as painted, and every file under `maps/` here is listed in
the game under *Community maps…* on the Conquest, Breakthrough and
multiplayer setup screens.

- **Play one:** in the game, on a setup screen's map grid, *Community
  maps…* → pick it. Or download the file from `maps/` and *Upload map…*.
- **Make one:** the game's Map Editor (home menu → *Map Editor*). Give it a
  name and a description, at least two spawn points, and *Export*. Under
  *Translations* you can give the name and description in the game's other
  languages too; a player sees the map in the language their game is in.
- **Publish one:** the editor's **Publish** button copies the file and opens a
  new-file page here with the name filled in; *Propose new file* opens the
  pull request. Or fork, add `maps/<slug>.steel-tide-map`, run the check,
  open a pull request yourself.

## Adding a map

```
maps/<slug>.steel-tide-map    the file the editor exports; <slug> is lower-case
                              letters, digits and single hyphens (two-fords)
```

```sh
node tools/check.mjs maps/<slug>.steel-tide-map   # what the game will say about it
node tools/build-index.mjs                          # what its entry in the index will be
```

The check is the game's own parser plus what the registry asks: a name of its
own (not *Untitled*), a description (a line or two on what kind of fight it
is: it is what players read beside the map), at least two spawn points, a
slug for a filename, under 512 KB, and a name no other map here has. CI runs
the same check on every pull request; once merged, the catalogue is rebuilt
on `main` and the map is in the game.

To update a map, replace the file. Its download count carries over.

When renaming a published map, add its old and new slugs to
`tools/map-renames.mjs`. The release sync renames the existing asset and
transfers its stored count and hash to the new slug, preserving download
history. The index builder also recognizes old slugs in cached counts.

## Download counts

There is no database. Every map is attached as an asset to the rolling
[`registry` release](../../releases/tag/registry), GitHub counts downloads of
release assets, and the game fetches a map's asset URL when a player takes
it. `tools/sync-release.mjs` keeps the release in step with `maps/` (a new
file is uploaded, a changed one replaced with its count carried, a removed one
taken down) and `tools/build-index.mjs` bakes the counts into `catalog.json`
and `index.json`, nightly and on every push. The release is not for people: the game reads the
file from `main`.

## What is here

| Path | What |
| --- | --- |
| `maps/<slug>.steel-tide-map` | one map each |
| `catalog.json` | what the game lists: name, description and their translations, size, seats, author, downloads and the name of its thumbnail per map; generated, never edited by hand |
| `thumbs/<slug>/<hash>.json` | a map's thumbnail (its terrain at up to 64 cells a side, spawns and deposits), named by its content's hash and fetched only when its card is drawn; generated |
| `index.json` | every entry with its thumbnail inline, in one file, for released games that read it; generated |
| `tools/check.mjs` | validate one map or all of them |
| `tools/build-index.mjs` | rebuild `catalog.json`, `thumbs/` and `index.json` (CI does this on `main`) |
| `tools/sync-release.mjs` | the release the maps are counted on (CI) |
| `tools/steel-tide-map.mjs` | the game's own map code: the parser, the check, the index entry and its thumbnail, bundled from the game repository; do not edit here |

## The file

A `.steel-tide-map` is JSON: `format` (`steel-tide-map`), `v` (`1`), `name`,
`description`, `translations` (the same two in other languages, by language
code: `{"en": {"name": …, "description": …}}`; `name` and `description`
are the author's own words and what any reader without a translation of
their own falls back on, after English), `w` and `h` in tiles (16 to 512 a
side), `terrain` (the tile grid run-length coded, base64), `deposits` and
`spawns` (tile coordinates), and `decor` (the props standing on it). The
editor writes it; nothing needs to be written by hand.

## Map source credits

- **Middle East** (`middle-east`), by YYY: the original submission credits
  铁锈盒子 as the base-map source and includes the source label 末忆铁锈.
- **Two Coast Lanes** (2v2, 3v3 and 4v4): inspired by the Rusted Warfare
  maps Across the Shore (隔岸之争) and Coastline (海岸线).

- **Ice Lake** (`ice-lake-by-hxyy`), submitted by YYY: the original title
  credits hxyy.

- **Japanese Archipelago** (`japanese-archipelago`): generated with the
  game's China/Europe geography pipeline from [Natural Earth 1:10m vectors](https://www.naturalearthdata.com/downloads/10m-physical-vectors/)
  (coastlines, islands, rivers, lakes and the continental shelf), its
  [country outlines and populated places](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/),
  and [NASA's GEBCO elevation raster](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png).
  Uses an Albers equal-area projection at about 4.7 km per tile, covering
  Hokkaido through the Ryukyus and the Izu–Ogasawara chain; remote
  Minami-Tori-shima is outside the frame. Roads, clearings, resource deposits
  and narrow straits are adapted for play.

- **Antarctic** (`antarctic`): generated from [Natural Earth 1:10m vectors](https://www.naturalearthdata.com/downloads/10m-physical-vectors/),
  [research-station coordinates](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/),
  and [NASA's GEBCO elevation raster](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png).
  The [ice-shelf layer](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-antarctic-ice-shelves/)
  is based on the 2003–2004 Mosaic of Antarctica; it does not depict current
  or seasonal ice extent. Byrd Surface Camp's coordinates come from the
  [USAP 2019–2020 science plan](https://www.usap.gov/scienceSupport/documents/2019-2020%20Science%20Planning%20Summaries.pdf).
  Uses a South-Pole-centred Lambert azimuthal equal-area projection at about
  11 km per tile. Starting clearings sit near the reference stations;
  resources, snow passes and camp props are adapted for play.

## Licence

The tooling is MIT. Each map is published under CC-BY-4.0 and belongs to its
author. By opening a pull request you confirm the map is yours to publish
under that licence.
