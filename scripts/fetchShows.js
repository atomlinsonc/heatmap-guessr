#!/usr/bin/env node
/**
 * fetchShows.js
 * -------------
 * Fetches episode ratings for TV shows from the TMDB API.
 *
 * Usage:
 *   TMDB_API_KEY=<key> node scripts/fetchShows.js
 *
 * Output:
 *   data/raw_shows.json
 *
 * The script reads a curated show list from scripts/show_list.json and
 * fetches full season/episode data including IMDB ratings via TMDB.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'data', 'raw_shows.json');
const LIST_PATH = join(__dirname, 'show_list.json');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const DELAY_MS = 250; // polite rate limiting

if (!API_KEY) {
  console.error('ERROR: TMDB_API_KEY environment variable is required.');
  console.error('Get a free key at https://www.themoviedb.org/settings/api');
  process.exit(1);
}

async function tmdb(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function runtimeBucket(minutes) {
  if (!minutes || minutes < 30) return '22 min';
  if (minutes < 50) return '45 min';
  return '60 min';
}

async function fetchShow(tmdbId) {
  const details = await tmdb(`/tv/${tmdbId}`, { append_to_response: 'external_ids,content_ratings' });
  await sleep(DELAY_MS);

  const seasons = [];
  for (const s of details.seasons) {
    if (s.season_number === 0) continue; // skip specials
    const seasonData = await tmdb(`/tv/${tmdbId}/season/${s.season_number}`);
    await sleep(DELAY_MS);

    const episodes = seasonData.episodes
      .filter((e) => e.vote_count > 0)
      .map((e) => ({
        ep: e.episode_number,
        rating: Math.round(e.vote_average * 10) / 10,
        title: e.name,
      }));

    if (episodes.length > 0) {
      seasons.push({ season: s.season_number, episodes });
    }
  }

  // Find top-rated episode
  let topEp = null;
  let topRating = -1;
  for (const s of seasons) {
    for (const e of s.episodes) {
      if (e.rating > topRating) {
        topRating = e.rating;
        topEp = e;
      }
    }
  }

  const network =
    details.networks?.[0]?.name ??
    details.production_companies?.[0]?.name ??
    'Unknown';

  const runtime = details.episode_run_time?.[0] ?? 0;

  const totalEps = seasons.reduce((sum, s) => sum + s.episodes.length, 0);

  return {
    id: details.id.toString(),
    tmdbId: details.id,
    title: details.name,
    aliases: details.alternative_titles?.results?.map((a) => a.title.toLowerCase()) ?? [],
    premiereYear: details.first_air_date ? parseInt(details.first_air_date.slice(0, 4)) : null,
    runtimeBucket: runtimeBucket(runtime),
    network,
    genre: details.genres?.[0]?.name ?? 'Drama',
    status: details.status === 'Ended' || details.status === 'Canceled' ? 'Ended' : 'Ongoing',
    totalSeasons: seasons.length,
    totalEpisodes: totalEps,
    topEpisodeTitle: topEp?.title ?? null,
    topEpisodeLead: null, // enriched manually or via a separate cast fetch
    heatmap: { seasons },
  };
}

async function main() {
  if (!existsSync(LIST_PATH)) {
    console.error(`Show list not found at ${LIST_PATH}`);
    console.error('Create scripts/show_list.json with an array of TMDB IDs.');
    process.exit(1);
  }

  const showList = JSON.parse(readFileSync(LIST_PATH, 'utf-8'));
  console.log(`Fetching ${showList.length} shows from TMDB...`);

  const results = [];
  for (let i = 0; i < showList.length; i++) {
    const { tmdbId, leadActor } = showList[i];
    process.stdout.write(`[${i + 1}/${showList.length}] Fetching TMDB #${tmdbId}... `);
    try {
      const show = await fetchShow(tmdbId);
      if (leadActor) show.topEpisodeLead = leadActor;
      results.push(show);
      console.log(`✓ ${show.title}`);
    } catch (err) {
      console.error(`✗ ${err.message}`);
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} shows to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
