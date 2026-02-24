#!/usr/bin/env node
/**
 * buildFromIMDB.mjs
 * -----------------
 * Downloads IMDB public bulk datasets and builds puzzle_pool.json
 * with no API key required.
 *
 * IMDB datasets used (free, updated daily):
 *   title.basics.tsv.gz   - show titles, type, year, genres, runtime
 *   title.episode.tsv.gz  - episode->series mapping + season/ep numbers
 *   title.ratings.tsv.gz  - average rating + vote count
 *
 * Usage:
 *   node scripts/buildFromIMDB.mjs
 *
 * Output:
 *   data/puzzle_pool.json
 */

import { createWriteStream, createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createGunzip } from 'zlib';
import { createInterface } from 'readline';
import { pipeline } from 'stream/promises';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const CACHE_DIR = join(DATA_DIR, 'imdb_cache');
const OUT_PATH = join(DATA_DIR, 'puzzle_pool.json');
const LIST_PATH = join(__dirname, 'show_list.json');

// Create dirs
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

const IMDB_BASE = 'https://datasets.imdbws.com';
const FILES = {
  basics:  'title.basics.tsv.gz',
  episode: 'title.episode.tsv.gz',
  ratings: 'title.ratings.tsv.gz',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      console.log(`  ✓ Already cached: ${dest}`);
      return resolve();
    }
    console.log(`  ↓ Downloading ${url} ...`);
    const file = createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let downloaded = 0;
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        process.stdout.write(`\r    ${(downloaded / 1024 / 1024).toFixed(1)} MB`);
      });
      res.pipe(file);
      file.on('finish', () => { process.stdout.write('\n'); file.close(resolve); });
    }).on('error', reject);
  });
}

async function parseTSVGz(gzPath, onRow) {
  const gunzip = createGunzip();
  const source = createReadStream(gzPath);
  let header = null;
  let count = 0;

  await new Promise((resolve, reject) => {
    const rl = createInterface({ input: source.pipe(gunzip), crlfDelay: Infinity });
    rl.on('line', (line) => {
      if (!header) { header = line.split('\t'); return; }
      const cols = line.split('\t');
      const row = {};
      header.forEach((h, i) => { row[h] = cols[i] === '\\N' ? null : cols[i]; });
      onRow(row);
      count++;
      if (count % 500000 === 0) process.stdout.write(`\r    ${(count / 1e6).toFixed(1)}M rows...`);
    });
    rl.on('close', () => { process.stdout.write('\n'); resolve(); });
    rl.on('error', reject);
    source.on('error', reject);
  });
  return count;
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function runtimeBucket(minutes) {
  const m = parseInt(minutes, 10);
  if (!m || m < 30) return '22 min';
  if (m < 50) return '45 min';
  return '60 min';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load show list (our curated set with TMDB IDs + lead actors)
  const showList = JSON.parse(readFileSync(LIST_PATH, 'utf-8'));

  // Deduplicate by tmdbId — we'll match by title later since IMDB uses tt IDs
  // Build a lookup: normalized title → { leadActor }
  const seen = new Set();
  const uniqueShows = showList.filter(({ tmdbId }) => {
    if (seen.has(tmdbId)) return false;
    seen.add(tmdbId);
    return true;
  });
  console.log(`Loaded ${uniqueShows.length} unique shows from show_list.json`);

  // ── Step 1: Download datasets ──────────────────────────────────────────────
  console.log('\n[1/4] Downloading IMDB datasets...');
  for (const [key, file] of Object.entries(FILES)) {
    await download(`${IMDB_BASE}/${file}`, join(CACHE_DIR, file));
  }

  // ── Step 2: Parse ratings ──────────────────────────────────────────────────
  console.log('\n[2/4] Parsing ratings...');
  const ratings = new Map(); // tconst → { rating, votes }
  await parseTSVGz(join(CACHE_DIR, FILES.ratings), (row) => {
    ratings.set(row.tconst, {
      rating: parseFloat(row.averageRating),
      votes: parseInt(row.numVotes, 10),
    });
  });
  console.log(`  Loaded ${ratings.size.toLocaleString()} ratings`);

  // ── Step 3: Parse basics — find TV series ─────────────────────────────────
  console.log('\n[3/4] Parsing title basics...');
  const seriesById = new Map();   // tconst → series info
  const seriesByTitle = new Map(); // normalized title → tconst (for matching)

  await parseTSVGz(join(CACHE_DIR, FILES.basics), (row) => {
    if (row.titleType !== 'tvSeries' && row.titleType !== 'tvMiniSeries') return;

    // Only keep shows with at least some ratings traction
    const r = ratings.get(row.tconst);
    if (!r || r.votes < 1000) return;

    const info = {
      tconst: row.tconst,
      title: row.primaryTitle,
      originalTitle: row.originalTitle,
      startYear: row.startYear ? parseInt(row.startYear, 10) : null,
      endYear: row.endYear ? parseInt(row.endYear, 10) : null,
      runtime: row.runtimeMinutes,
      genres: row.genres ? row.genres.split(',') : [],
      rating: r.rating,
      votes: r.votes,
      isMini: row.titleType === 'tvMiniSeries',
      seasons: new Map(), // season# → Map(ep# → rating)
    };

    seriesById.set(row.tconst, info);

    // Index by normalized title for matching against our show_list
    const norm = row.primaryTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seriesByTitle.has(norm)) seriesByTitle.set(norm, row.tconst);

    const origNorm = (row.originalTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (origNorm && !seriesByTitle.has(origNorm)) seriesByTitle.set(origNorm, row.tconst);
  });
  console.log(`  Found ${seriesById.size.toLocaleString()} rated TV series`);

  // ── Step 4: Parse episodes ────────────────────────────────────────────────
  console.log('\n[4/4] Parsing episodes...');
  let epCount = 0;
  await parseTSVGz(join(CACHE_DIR, FILES.episode), (row) => {
    const parent = seriesById.get(row.parentTconst);
    if (!parent) return;

    const epRating = ratings.get(row.tconst);
    if (!epRating || epRating.votes < 100) return; // skip unrated eps

    const sNum = parseInt(row.seasonNumber, 10);
    const eNum = parseInt(row.episodeNumber, 10);
    if (!sNum || !eNum || sNum > 30 || eNum > 200) return; // sanity check

    if (!parent.seasons.has(sNum)) parent.seasons.set(sNum, new Map());
    parent.seasons.get(sNum).set(eNum, epRating.rating);
    epCount++;
  });
  console.log(`  Loaded ${epCount.toLocaleString()} rated episodes`);

  // ── Step 5: Match our show list against IMDB data ────────────────────────
  console.log('\n[5/5] Building puzzle pool...');

  // Map of note title keywords → IMDB tconst (for manual overrides)
  const MANUAL_IMDB = {
    'Breaking Bad':                 'tt0903747',
    'The Sopranos':                 'tt0141842',
    'The Wire':                     'tt0306414',
    'Game of Thrones':              'tt0944947',
    'The Office (US)':              'tt0386676',
    'Better Call Saul':             'tt3032476',
    'Chernobyl':                    'tt7366338',
    'Band of Brothers':             'tt0185906',
    'True Detective':               'tt2356777',
    'Fargo':                        'tt2802850',
    'The Boys':                     'tt1190634',
    'The Mandalorian':              'tt8111088',
    'Stranger Things':              'tt4574334',
    'Squid Game':                   'tt10919420',
    'Succession':                   'tt7660850',
    'Fleabag':                      'tt5687612',
    'Sherlock':                     'tt1475582',
    'Black Mirror':                 'tt2085059',
    'Severance':                    'tt11280740',
    'The White Lotus':              'tt13406094',
    'Euphoria':                     'tt8772296',
    'Station Eleven':               'tt10574236',
    'Ozark':                        'tt5071412',
    'Peaky Blinders':               'tt2442560',
    'Westworld':                    'tt0475784',
    'Twin Peaks':                   'tt0098936',
    'The Americans':                'tt2149175',
    'Mad Men':                      'tt0804503',
    'Lost':                         'tt0411008',
    'The Shield':                   'tt0286486',
    'House M.D.':                   'tt0412142',
    'Dexter':                       'tt0773262',
    'The IT Crowd':                 'tt0487831',
    'Arrested Development':         'tt0367279',
    'BoJack Horseman':              'tt3398228',
    'Rick and Morty':               'tt2861424',
    'Atlanta':                      'tt4288182',
    'Silicon Valley':               'tt2575988',
    'Veep':                         'tt1840309',
    'Barry':                        'tt5348176',
    'Ted Lasso':                    'tt10986410',
    'The Last of Us':               'tt3581920',
    'Andor':                        'tt9253284',
    'The Crown':                    'tt4786824',
    'The Bear':                     'tt14452776',
    'Abbott Elementary':            'tt14218830',
    'What We Do in the Shadows':    'tt7908628',
    'Only Murders in the Building': 'tt11691774',
    'Money Heist':                  'tt6468322',
    'Mr. Robot':                    'tt4158110',
    'The X-Files':                  'tt0106179',
    '24':                           'tt0285331',
    'Friends':                      'tt0108778',
    'Shogun':                       'tt2378794',
    'Mindhunter':                   'tt5742374',
    'Narcos':                       'tt4574334',
    'Boardwalk Empire':             'tt0979432',
    'Billions':                     'tt4270492',
    'Doctor Who':                   'tt0436992',
    'Yellowstone':                  'tt4236770',
    'Arcane':                       'tt11126994',
    'Invincible':                   'tt6741278',
    'House of the Dragon':          'tt11198330',
    'Silo':                         'tt14688458',
    'For All Mankind':              'tt7772588',
    'Slow Horses':                  'tt5875444',
    'Bad Sisters':                  'tt13452152',
    'Beef':                         'tt21064584',
    'The Marvelous Mrs. Maisel':    'tt5788792',
    'Hacks':                        'tt11815682',
    'Heroes':                       'tt0813715',
    'Person of Interest':           'tt1839578',
    'Two and a Half Men':           'tt0369179',
    'The Blacklist':                'tt2741602',
    'The Terror':                   'tt1699816',
    'Narcos: Mexico':               'tt8714904',
    'Malcolm in the Middle':        'tt0212671',
    'Bridgerton':                   'tt8740790',
    'The Flash':                    'tt3107288',
    'The Following':                'tt2071645',
    'Skins':                        'tt0840871',
    'The Penguin':                  'tt15441476',
    'The Rings of Power':           'tt7631058',
    'The Diplomat':                 'tt14283626',
    'Say Nothing':                  'tt21064780',
    'The Old Man':                  'tt10334042',
    'Killing Eve':                  'tt7016936',
    'Luther':                       'tt1474684',
    'The Fall':                     'tt2294189',
    'True Blood':                   'tt0844441',
    'Homeland':                     'tt1796960',
    'House of Cards':               'tt1856010',
    'Shameless (US)':               'tt1586680',
    'Watchmen':                     'tt7049682',
    'The Pacific':                  'tt0374463',
    'In Treatment':                 'tt1086765',
    'Nurse Jackie':                 'tt1190082',
    'Damages':                      'tt0914387',
    'Madam Secretary':              'tt3501074',
    'Humans':                       'tt4122068',
    'Dark':                         'tt5753856',
    'Orphan Black':                 'tt2234222',
    'American Horror Story':        'tt1844624',
    'Maniac':                       'tt5580236',
    'The Good Wife':                'tt1442462',
    'Bates Motel':                  'tt2188671',
    '30 Rock':                      'tt0496424',
    "It's Always Sunny in Philadelphia": 'tt0472954',
    'Extras':                       'tt0445114',
    'American Crime Story':         'tt4192812',
    'Big Little Lies':              'tt3920596',
    'Downton Abbey':                'tt1606375',
    'Bloodline':                    'tt2378507',
    'The Leftovers':                'tt2699128',
    'The Newsroom':                 'tt1870479',
    'City on a Hill':               'tt7219536',
    'Halston':                      'tt9392612',
    'Happy Valley':                 'tt3428912',
    'How to Get Away with Murder':  'tt3205802',
    'Empire':                       'tt3766354',
    'Lucifer':                      'tt4052886',
    'The Comeback':                 'tt0397442',
    'The Plot Against America':     'tt9174558',
    'New Amsterdam':                'tt7817340',
    'Revenge':                      'tt1837642',
    'True Detective S2':            'tt2356777',
    'True Detective S3':            'tt2356777',
    'Saving Grace':                 'tt0840009',
    'Show Me a Hero':               'tt3592518',
    'The Umbrella Academy':         'tt1312171',
    'Outer Range':                  'tt13015506',
    'The Undoing':                  'tt8428358',
    'Mare of Easttown':             'tt10016180',
    'Perry Mason':                  'tt7077540',
    'Scenes from a Marriage':       'tt14218748',
    'I Know This Much Is True':     'tt7604414',
    'The Outsider':                 'tt8550800',
    'The Walking Dead':             'tt1520211',
    'Justified':                    'tt1489428',
    'Daredevil':                    'tt3322312',
    'Jessica Jones':                'tt2357547',
    'The Punisher':                 'tt5675620',
    'Luke Cage':                    'tt3322314',
    'The Night Of':                 'tt2401256',
    'Black Bird':                   'tt13276196',
    'Physical':                     'tt9288692',
    'Arrow':                        'tt2193021',
    'Grey\'s Anatomy':              'tt0413573',
    'Law & Order: SVU':             'tt0203259',
    'Law & Order':                  'tt0108202',
    'Castle':                       'tt1219024',
    'Spin City':                    'tt0115308',
    'Terminator: The Sarah Connor Chronicles': 'tt0851851',
    'Narcos (alt)':                 'tt4834206',
  };

  // Build reverse map: IMDB tconst → leadActor from our show list
  const tconstToLead = new Map();
  const noteToLead = new Map();
  for (const show of uniqueShows) {
    if (show.leadActor) noteToLead.set(show.note, show.leadActor);
  }

  // Build final puzzle pool by matching IMDB IDs
  const poolMap = new Map(); // tconst → puzzle entry

  for (const show of uniqueShows) {
    // Find tconst: try manual map first, then title search
    let tconst = MANUAL_IMDB[show.note] || MANUAL_IMDB[show.note?.replace(/ \(.*\)/, '')];

    if (!tconst) {
      // Title-based search
      const norm = (show.note || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      tconst = seriesByTitle.get(norm);
    }

    if (!tconst) continue;
    if (poolMap.has(tconst)) continue; // already added

    const series = seriesById.get(tconst);
    if (!series) continue;
    if (!series.seasons.size) continue;

    // Build heatmap from seasons
    const heatmapSeasons = [];
    let totalEpisodes = 0;
    let topEpRating = -1;
    let topEpTitle = null;

    for (const [sNum, epMap] of [...series.seasons.entries()].sort((a, b) => a[0] - b[0])) {
      const episodes = [...epMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([epNum, rating]) => {
          if (rating > topEpRating) { topEpRating = rating; }
          return { ep: epNum, rating };
        });
      if (episodes.length < 1) continue;
      heatmapSeasons.push({ season: sNum, episodes });
      totalEpisodes += episodes.length;
    }

    if (heatmapSeasons.length < 1 || totalEpisodes < 5) continue;

    const status = series.endYear ? 'Ended' : 'Ongoing';
    const genre = series.genres[0] || 'Drama';
    const leadActor = show.leadActor || 'Unknown';

    // Guess network from show list note (we don't have it from IMDB easily)
    // Will be filled as "Unknown" — acceptable fallback
    poolMap.set(tconst, {
      id: slugify(series.title),
      title: series.title,
      aliases: [series.title.toLowerCase(), series.originalTitle?.toLowerCase()].filter(Boolean),
      premiereYear: series.startYear,
      runtimeBucket: runtimeBucket(series.runtime),
      network: 'Various',  // IMDB doesn't include network in bulk data
      genre,
      status,
      totalSeasons: heatmapSeasons.length,
      totalEpisodes,
      topEpisodeTitle: topEpTitle || 'Unknown',
      topEpisodeLead: leadActor,
      imdbRating: series.rating,
      imdbVotes: series.votes,
      heatmap: { seasons: heatmapSeasons },
    });
  }

  // Also grab top-voted TV series not in our list (bonus shows for pool depth)
  console.log('  Adding bonus high-vote series not in curated list...');
  const bonusShows = [...seriesById.values()]
    .filter(s => s.votes >= 50000 && s.seasons.size >= 1 && !poolMap.has(s.tconst))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 400); // top 400 bonus

  for (const series of bonusShows) {
    if (poolMap.size >= 500) break;
    if (!series.seasons.size) continue;

    const heatmapSeasons = [];
    let totalEpisodes = 0;

    for (const [sNum, epMap] of [...series.seasons.entries()].sort((a, b) => a[0] - b[0])) {
      const episodes = [...epMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([epNum, rating]) => ({ ep: epNum, rating }));
      if (!episodes.length) continue;
      heatmapSeasons.push({ season: sNum, episodes });
      totalEpisodes += episodes.length;
    }

    if (heatmapSeasons.length < 1 || totalEpisodes < 5) continue;

    poolMap.set(series.tconst, {
      id: slugify(series.title),
      title: series.title,
      aliases: [series.title.toLowerCase(), series.originalTitle?.toLowerCase()].filter(Boolean),
      premiereYear: series.startYear,
      runtimeBucket: runtimeBucket(series.runtime),
      network: 'Various',
      genre: series.genres[0] || 'Drama',
      status: series.endYear ? 'Ended' : 'Ongoing',
      totalSeasons: heatmapSeasons.length,
      totalEpisodes,
      topEpisodeTitle: 'Unknown',
      topEpisodeLead: 'Unknown',
      imdbRating: series.rating,
      imdbVotes: series.votes,
      heatmap: { seasons: heatmapSeasons },
    });
  }

  // Deduplicate by slug id
  const slugSeen = new Set();
  const pool = [...poolMap.values()].filter(s => {
    if (slugSeen.has(s.id)) return false;
    slugSeen.add(s.id);
    return true;
  });

  // Sort by vote count descending (most popular first = best puzzle variety)
  pool.sort((a, b) => (b.imdbVotes || 0) - (a.imdbVotes || 0));

  writeFileSync(OUT_PATH, JSON.stringify(pool, null, 2));

  console.log(`\n✅ Done! Wrote ${pool.length} shows to ${OUT_PATH}`);
  console.log(`   Top 5: ${pool.slice(0, 5).map(s => s.title).join(', ')}`);
  console.log(`   This covers ${pool.length} unique daily puzzles.`);
  if (pool.length < 365) {
    console.warn(`   ⚠️  Only ${pool.length} shows — less than 365 days. Consider lowering vote threshold.`);
  } else {
    console.log(`   ✓ More than enough for all of 2026 (${pool.length} > 365)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
