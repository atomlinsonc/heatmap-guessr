#!/usr/bin/env node
/**
 * buildPuzzlePool.js
 * ------------------
 * Transforms raw_shows.json into a curated puzzle_pool.json.
 *
 * Filters shows that have:
 *   - At least 2 seasons
 *   - At least 10 rated episodes
 *   - A known premiere year
 *   - A known network
 *
 * Output:
 *   data/puzzle_pool.json
 *
 * Usage:
 *   node scripts/buildPuzzlePool.js [--min-seasons 2] [--min-episodes 10]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW_PATH = join(ROOT, 'data', 'raw_shows.json');
const OUT_PATH = join(ROOT, 'data', 'puzzle_pool.json');

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? parseInt(args[idx + 1], 10) : def;
};
const MIN_SEASONS = getArg('--min-seasons', 2);
const MIN_EPISODES = getArg('--min-episodes', 10);
const MAX_POOL = getArg('--max-pool', 100);

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeAliases(show) {
  const base = [show.title.toLowerCase()];
  const extras = (show.aliases ?? [])
    .map((a) => a.toLowerCase().trim())
    .filter((a) => a.length > 0 && !base.includes(a));
  return [...new Set([...base, ...extras])];
}

function filterShow(show) {
  if (!show.premiereYear) return false;
  if (!show.network || show.network === 'Unknown') return false;
  if (show.totalSeasons < MIN_SEASONS) return false;
  if (show.totalEpisodes < MIN_EPISODES) return false;
  if (!show.heatmap?.seasons?.length) return false;

  // Ensure at least 2 seasons have rated episodes
  const validSeasons = show.heatmap.seasons.filter((s) => s.episodes.length >= 1);
  if (validSeasons.length < MIN_SEASONS) return false;

  return true;
}

function cleanShow(show) {
  return {
    id: slugify(show.title),
    title: show.title,
    aliases: normalizeAliases(show),
    premiereYear: show.premiereYear,
    runtimeBucket: show.runtimeBucket ?? '60 min',
    network: show.network,
    genre: show.genre ?? 'Drama',
    status: show.status ?? 'Ended',
    totalSeasons: show.totalSeasons,
    totalEpisodes: show.totalEpisodes,
    topEpisodeTitle: show.topEpisodeTitle ?? 'Unknown',
    topEpisodeLead: show.topEpisodeLead ?? 'Unknown',
    heatmap: show.heatmap,
  };
}

function main() {
  if (!existsSync(RAW_PATH)) {
    console.error(`raw_shows.json not found at ${RAW_PATH}`);
    console.error('Run: TMDB_API_KEY=<key> node scripts/fetchShows.js');
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(RAW_PATH, 'utf-8'));
  console.log(`Loaded ${raw.length} raw shows.`);

  const filtered = raw.filter(filterShow);
  console.log(`After filtering: ${filtered.length} shows qualify.`);

  const pool = filtered.slice(0, MAX_POOL).map(cleanShow);

  // Deduplicate by id
  const seen = new Set();
  const deduped = pool.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  writeFileSync(OUT_PATH, JSON.stringify(deduped, null, 2));
  console.log(`Wrote ${deduped.length} shows to ${OUT_PATH}`);
}

main();
