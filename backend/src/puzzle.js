/**
 * Core puzzle selection logic.
 * Deterministic: same date_key + salt → same puzzle for all users.
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../data/puzzle_pool.json');
const SALT = 'heatmap-guessr-v1-salt-2024';

let _pool = null;

function loadPool() {
  if (_pool) return _pool;
  try {
    const raw = readFileSync(DATA_PATH, 'utf-8');
    _pool = JSON.parse(raw);
    return _pool;
  } catch {
    // Fallback to demo data when pool not yet generated
    _pool = getDemoPool();
    return _pool;
  }
}

export function getDateKey() {
  // Returns YYYY-MM-DD in America/Chicago timezone
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
}

export function selectPuzzle(dateKey) {
  const pool = loadPool();
  const hash = createHash('sha256')
    .update(dateKey + SALT)
    .digest('hex');
  const index = parseInt(hash.slice(0, 8), 16) % pool.length;
  return pool[index];
}

export function getTodaysPuzzle() {
  const dateKey = getDateKey();
  return selectPuzzle(dateKey);
}

/** Returns fallback if value is null/undefined/empty/'Unknown'/'Various'. */
function sanitize(val, fallback) {
  if (!val || val === 'Unknown' || val === 'Various') return fallback;
  return val;
}

/**
 * Strips the answer (title) from the public payload.
 * Returns only what the client needs per clue tier.
 */
export function buildPublicPayload(puzzle, attemptsUsed) {
  const payload = {
    id: puzzle.id,
    heatmap: puzzle.heatmap,
    totalSeasons: puzzle.totalSeasons,
    totalEpisodes: puzzle.totalEpisodes,
    clues: {},
  };

  // 5 individual clues, one unlocked per wrong guess
  if (attemptsUsed >= 1) {
    payload.clues.tier1 = { premiereYear: puzzle.premiereYear };
  }
  if (attemptsUsed >= 2) {
    payload.clues.tier2 = { runtimeBucket: puzzle.runtimeBucket };
  }
  if (attemptsUsed >= 3) {
    payload.clues.tier3 = { genre: sanitize(puzzle.genre, 'Drama') };
  }
  if (attemptsUsed >= 4) {
    payload.clues.tier4 = { leadActor: sanitize(puzzle.topEpisodeLead, null) };
  }
  if (attemptsUsed >= 5) {
    payload.clues.tier5 = { tagline: sanitize(puzzle.tagline, null) };
  }

  return payload;
}

// ── Demo pool (used when puzzle_pool.json hasn't been generated yet) ─────────

function getDemoPool() {
  return [
    {
      id: 'breaking-bad',
      title: 'Breaking Bad',
      aliases: ['breaking bad', 'bb'],
      premiereYear: 2008,
      runtimeBucket: '45 min',
      network: 'AMC',
      genre: 'Crime Drama',
      status: 'Ended',
      totalSeasons: 5,
      totalEpisodes: 62,
      topEpisodeTitle: 'Ozymandias',
      topEpisodeLead: 'Bryan Cranston',
      heatmap: {
        seasons: [
          { season: 1, episodes: [
            { ep: 1, rating: 9.0 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.5 },
            { ep: 4, rating: 8.4 }, { ep: 5, rating: 8.6 }, { ep: 6, rating: 8.7 },
            { ep: 7, rating: 9.3 }
          ]},
          { season: 2, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.3 }, { ep: 3, rating: 8.2 },
            { ep: 4, rating: 8.4 }, { ep: 5, rating: 8.5 }, { ep: 6, rating: 8.5 },
            { ep: 7, rating: 8.6 }, { ep: 8, rating: 8.7 }, { ep: 9, rating: 8.8 },
            { ep: 10, rating: 8.8 }, { ep: 11, rating: 9.0 }, { ep: 12, rating: 9.0 },
            { ep: 13, rating: 9.5 }
          ]},
          { season: 3, episodes: [
            { ep: 1, rating: 8.9 }, { ep: 2, rating: 8.5 }, { ep: 3, rating: 8.4 },
            { ep: 4, rating: 8.6 }, { ep: 5, rating: 9.0 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 8.8 }, { ep: 8, rating: 8.8 }, { ep: 9, rating: 8.9 },
            { ep: 10, rating: 9.3 }, { ep: 11, rating: 9.0 }, { ep: 12, rating: 9.2 },
            { ep: 13, rating: 9.5 }
          ]},
          { season: 4, episodes: [
            { ep: 1, rating: 8.9 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.7 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.9 }, { ep: 6, rating: 8.9 },
            { ep: 7, rating: 9.0 }, { ep: 8, rating: 9.1 }, { ep: 9, rating: 9.3 },
            { ep: 10, rating: 9.3 }, { ep: 11, rating: 9.6 }, { ep: 12, rating: 9.7 },
            { ep: 13, rating: 9.9 }
          ]},
          { season: 5, episodes: [
            { ep: 1, rating: 9.0 }, { ep: 2, rating: 9.0 }, { ep: 3, rating: 9.1 },
            { ep: 4, rating: 9.2 }, { ep: 5, rating: 9.3 }, { ep: 6, rating: 9.2 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.9 }, { ep: 9, rating: 9.6 },
            { ep: 10, rating: 9.4 }, { ep: 11, rating: 9.5 }, { ep: 12, rating: 9.7 },
            { ep: 13, rating: 9.5 }, { ep: 14, rating: 9.6 }, { ep: 15, rating: 9.7 },
            { ep: 16, rating: 9.9 }
          ]}
        ]
      }
    },
    {
      id: 'the-wire',
      title: 'The Wire',
      aliases: ['the wire', 'wire'],
      premiereYear: 2002,
      runtimeBucket: '60 min',
      network: 'HBO',
      genre: 'Crime Drama',
      status: 'Ended',
      totalSeasons: 5,
      totalEpisodes: 60,
      topEpisodeTitle: '-30-',
      topEpisodeLead: 'Dominic West',
      heatmap: {
        seasons: [
          { season: 1, episodes: [
            { ep: 1, rating: 8.5 }, { ep: 2, rating: 8.4 }, { ep: 3, rating: 8.5 },
            { ep: 4, rating: 8.6 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.8 },
            { ep: 7, rating: 8.8 }, { ep: 8, rating: 8.9 }, { ep: 9, rating: 8.9 },
            { ep: 10, rating: 9.0 }, { ep: 11, rating: 9.1 }, { ep: 12, rating: 9.5 },
            { ep: 13, rating: 9.6 }
          ]},
          { season: 2, episodes: [
            { ep: 1, rating: 8.5 }, { ep: 2, rating: 8.4 }, { ep: 3, rating: 8.5 },
            { ep: 4, rating: 8.6 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.8 },
            { ep: 7, rating: 8.8 }, { ep: 8, rating: 8.9 }, { ep: 9, rating: 8.9 },
            { ep: 10, rating: 9.0 }, { ep: 11, rating: 9.1 }, { ep: 12, rating: 9.3 }
          ]},
          { season: 3, episodes: [
            { ep: 1, rating: 8.7 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.9 },
            { ep: 4, rating: 9.0 }, { ep: 5, rating: 9.0 }, { ep: 6, rating: 9.1 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.2 }, { ep: 9, rating: 9.2 },
            { ep: 10, rating: 9.3 }, { ep: 11, rating: 9.4 }, { ep: 12, rating: 9.6 }
          ]},
          { season: 4, episodes: [
            { ep: 1, rating: 9.0 }, { ep: 2, rating: 9.1 }, { ep: 3, rating: 9.1 },
            { ep: 4, rating: 9.2 }, { ep: 5, rating: 9.3 }, { ep: 6, rating: 9.3 },
            { ep: 7, rating: 9.4 }, { ep: 8, rating: 9.4 }, { ep: 9, rating: 9.5 },
            { ep: 10, rating: 9.5 }, { ep: 11, rating: 9.6 }, { ep: 12, rating: 9.7 },
            { ep: 13, rating: 9.8 }
          ]},
          { season: 5, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.9 },
            { ep: 4, rating: 9.0 }, { ep: 5, rating: 9.0 }, { ep: 6, rating: 9.1 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.2 }, { ep: 9, rating: 9.2 },
            { ep: 10, rating: 9.6 }
          ]}
        ]
      }
    },
    {
      id: 'the-sopranos',
      title: 'The Sopranos',
      aliases: ['the sopranos', 'sopranos'],
      premiereYear: 1999,
      runtimeBucket: '60 min',
      network: 'HBO',
      genre: 'Crime Drama',
      status: 'Ended',
      totalSeasons: 6,
      totalEpisodes: 86,
      topEpisodeTitle: 'Pine Barrens',
      topEpisodeLead: 'James Gandolfini',
      heatmap: {
        seasons: [
          { season: 1, episodes: [
            { ep: 1, rating: 9.1 }, { ep: 2, rating: 8.5 }, { ep: 3, rating: 8.5 },
            { ep: 4, rating: 8.5 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.7 },
            { ep: 7, rating: 8.8 }, { ep: 8, rating: 8.8 }, { ep: 9, rating: 8.9 },
            { ep: 10, rating: 9.0 }, { ep: 11, rating: 9.0 }, { ep: 12, rating: 9.1 },
            { ep: 13, rating: 9.4 }
          ]},
          { season: 2, episodes: [
            { ep: 1, rating: 8.7 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.8 },
            { ep: 4, rating: 8.9 }, { ep: 5, rating: 8.9 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.1 }, { ep: 9, rating: 9.2 },
            { ep: 10, rating: 9.2 }, { ep: 11, rating: 9.3 }, { ep: 12, rating: 9.3 },
            { ep: 13, rating: 9.5 }
          ]},
          { season: 3, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.9 }, { ep: 3, rating: 9.0 },
            { ep: 4, rating: 9.2 }, { ep: 5, rating: 9.3 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 9.5 }, { ep: 8, rating: 9.0 }, { ep: 9, rating: 9.0 },
            { ep: 10, rating: 9.0 }, { ep: 11, rating: 9.1 }, { ep: 12, rating: 9.2 },
            { ep: 13, rating: 9.3 }
          ]},
          { season: 4, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.9 }, { ep: 3, rating: 9.0 },
            { ep: 4, rating: 9.1 }, { ep: 5, rating: 9.0 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.1 }, { ep: 9, rating: 9.2 },
            { ep: 10, rating: 9.3 }, { ep: 11, rating: 9.3 }, { ep: 12, rating: 9.3 },
            { ep: 13, rating: 9.5 }
          ]},
          { season: 5, episodes: [
            { ep: 1, rating: 9.0 }, { ep: 2, rating: 9.1 }, { ep: 3, rating: 9.1 },
            { ep: 4, rating: 9.2 }, { ep: 5, rating: 9.2 }, { ep: 6, rating: 9.3 },
            { ep: 7, rating: 9.4 }, { ep: 8, rating: 9.4 }, { ep: 9, rating: 9.5 },
            { ep: 10, rating: 9.5 }, { ep: 11, rating: 9.6 }, { ep: 12, rating: 9.7 },
            { ep: 13, rating: 9.8 }
          ]},
          { season: 6, episodes: [
            { ep: 1, rating: 9.0 }, { ep: 2, rating: 9.0 }, { ep: 3, rating: 9.1 },
            { ep: 4, rating: 9.1 }, { ep: 5, rating: 9.2 }, { ep: 6, rating: 9.2 },
            { ep: 7, rating: 9.3 }, { ep: 8, rating: 9.3 }, { ep: 9, rating: 9.3 },
            { ep: 10, rating: 9.4 }, { ep: 11, rating: 9.4 }, { ep: 12, rating: 9.5 },
            { ep: 13, rating: 9.5 }, { ep: 14, rating: 9.5 }, { ep: 15, rating: 9.6 },
            { ep: 16, rating: 9.6 }, { ep: 17, rating: 9.7 }, { ep: 18, rating: 9.2 },
            { ep: 19, rating: 9.5 }, { ep: 20, rating: 9.5 }, { ep: 21, rating: 9.7 }
          ]}
        ]
      }
    },
    {
      id: 'game-of-thrones',
      title: 'Game of Thrones',
      aliases: ['game of thrones', 'got', 'game of thrones hbo'],
      premiereYear: 2011,
      runtimeBucket: '60 min',
      network: 'HBO',
      genre: 'Fantasy Drama',
      status: 'Ended',
      totalSeasons: 8,
      totalEpisodes: 73,
      topEpisodeTitle: 'The Rains of Castamere',
      topEpisodeLead: 'Peter Dinklage',
      heatmap: {
        seasons: [
          { season: 1, episodes: [
            { ep: 1, rating: 9.1 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.7 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.8 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.0 }, { ep: 9, rating: 9.6 },
            { ep: 10, rating: 9.5 }
          ]},
          { season: 2, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.8 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.9 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 9.0 }, { ep: 8, rating: 9.0 }, { ep: 9, rating: 9.6 },
            { ep: 10, rating: 9.5 }
          ]},
          { season: 3, episodes: [
            { ep: 1, rating: 8.9 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 8.8 },
            { ep: 4, rating: 8.9 }, { ep: 5, rating: 8.9 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 9.0 }, { ep: 8, rating: 9.0 }, { ep: 9, rating: 9.9 },
            { ep: 10, rating: 9.5 }
          ]},
          { season: 4, episodes: [
            { ep: 1, rating: 9.0 }, { ep: 2, rating: 9.1 }, { ep: 3, rating: 8.8 },
            { ep: 4, rating: 9.0 }, { ep: 5, rating: 8.9 }, { ep: 6, rating: 9.2 },
            { ep: 7, rating: 9.1 }, { ep: 8, rating: 9.7 }, { ep: 9, rating: 9.9 },
            { ep: 10, rating: 9.7 }
          ]},
          { season: 5, episodes: [
            { ep: 1, rating: 8.6 }, { ep: 2, rating: 8.7 }, { ep: 3, rating: 8.7 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.9 },
            { ep: 7, rating: 9.0 }, { ep: 8, rating: 9.9 }, { ep: 9, rating: 9.1 },
            { ep: 10, rating: 9.1 }
          ]},
          { season: 6, episodes: [
            { ep: 1, rating: 8.9 }, { ep: 2, rating: 9.3 }, { ep: 3, rating: 8.7 },
            { ep: 4, rating: 8.7 }, { ep: 5, rating: 9.6 }, { ep: 6, rating: 8.9 },
            { ep: 7, rating: 8.8 }, { ep: 8, rating: 8.9 }, { ep: 9, rating: 9.9 },
            { ep: 10, rating: 9.9 }
          ]},
          { season: 7, episodes: [
            { ep: 1, rating: 8.7 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 9.0 },
            { ep: 4, rating: 9.4 }, { ep: 5, rating: 8.9 }, { ep: 6, rating: 9.5 },
            { ep: 7, rating: 9.4 }
          ]},
          { season: 8, episodes: [
            { ep: 1, rating: 7.6 }, { ep: 2, rating: 7.8 }, { ep: 3, rating: 7.7 },
            { ep: 4, rating: 5.5 }, { ep: 5, rating: 6.0 }, { ep: 6, rating: 4.1 }
          ]}
        ]
      }
    },
    {
      id: 'the-office-us',
      title: 'The Office',
      aliases: ['the office', 'the office us', 'office'],
      premiereYear: 2005,
      runtimeBucket: '22 min',
      network: 'NBC',
      genre: 'Comedy',
      status: 'Ended',
      totalSeasons: 9,
      totalEpisodes: 201,
      topEpisodeTitle: 'Goodbye, Michael',
      topEpisodeLead: 'Steve Carell',
      heatmap: {
        seasons: [
          { season: 1, episodes: [
            { ep: 1, rating: 7.5 }, { ep: 2, rating: 7.7 }, { ep: 3, rating: 7.8 },
            { ep: 4, rating: 8.0 }, { ep: 5, rating: 8.0 }, { ep: 6, rating: 8.2 }
          ]},
          { season: 2, episodes: [
            { ep: 1, rating: 8.3 }, { ep: 2, rating: 8.4 }, { ep: 3, rating: 8.5 },
            { ep: 4, rating: 8.7 }, { ep: 5, rating: 8.8 }, { ep: 6, rating: 9.1 },
            { ep: 7, rating: 8.5 }, { ep: 8, rating: 8.7 }, { ep: 9, rating: 9.0 },
            { ep: 10, rating: 8.8 }, { ep: 11, rating: 9.1 }, { ep: 12, rating: 8.7 },
            { ep: 13, rating: 8.5 }, { ep: 14, rating: 8.7 }, { ep: 15, rating: 8.7 },
            { ep: 16, rating: 8.5 }, { ep: 17, rating: 8.6 }, { ep: 18, rating: 8.7 },
            { ep: 19, rating: 8.8 }, { ep: 20, rating: 8.7 }, { ep: 21, rating: 8.6 },
            { ep: 22, rating: 9.3 }
          ]},
          { season: 3, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.7 }, { ep: 3, rating: 8.6 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.8 }, { ep: 6, rating: 9.0 },
            { ep: 7, rating: 8.7 }, { ep: 8, rating: 8.9 }, { ep: 9, rating: 8.7 },
            { ep: 10, rating: 8.8 }, { ep: 11, rating: 8.7 }, { ep: 12, rating: 8.6 },
            { ep: 13, rating: 8.6 }, { ep: 14, rating: 8.7 }, { ep: 15, rating: 8.5 },
            { ep: 16, rating: 8.6 }, { ep: 17, rating: 8.7 }, { ep: 18, rating: 8.8 },
            { ep: 19, rating: 8.8 }, { ep: 20, rating: 8.9 }, { ep: 21, rating: 9.0 },
            { ep: 22, rating: 9.1 }, { ep: 23, rating: 9.1 }
          ]},
          { season: 4, episodes: [
            { ep: 1, rating: 8.8 }, { ep: 2, rating: 8.8 }, { ep: 3, rating: 9.0 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.8 },
            { ep: 7, rating: 8.9 }, { ep: 8, rating: 8.8 }, { ep: 9, rating: 8.8 },
            { ep: 10, rating: 8.9 }, { ep: 11, rating: 9.0 }, { ep: 12, rating: 9.1 },
            { ep: 13, rating: 8.8 }, { ep: 14, rating: 9.4 }
          ]},
          { season: 5, episodes: [
            { ep: 1, rating: 8.5 }, { ep: 2, rating: 8.7 }, { ep: 3, rating: 8.8 },
            { ep: 4, rating: 8.8 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.9 },
            { ep: 7, rating: 8.9 }, { ep: 8, rating: 8.9 }, { ep: 9, rating: 8.8 },
            { ep: 10, rating: 8.6 }, { ep: 11, rating: 8.7 }, { ep: 12, rating: 8.6 },
            { ep: 13, rating: 8.6 }, { ep: 14, rating: 8.5 }, { ep: 15, rating: 8.7 },
            { ep: 16, rating: 8.8 }, { ep: 17, rating: 8.8 }, { ep: 18, rating: 8.5 },
            { ep: 19, rating: 8.8 }, { ep: 20, rating: 8.6 }, { ep: 21, rating: 8.7 },
            { ep: 22, rating: 9.7 }, { ep: 23, rating: 9.7 }, { ep: 24, rating: 9.5 },
            { ep: 25, rating: 9.5 }, { ep: 26, rating: 9.1 }, { ep: 27, rating: 9.0 },
            { ep: 28, rating: 9.6 }
          ]},
          { season: 6, episodes: [
            { ep: 1, rating: 8.6 }, { ep: 2, rating: 8.6 }, { ep: 3, rating: 8.5 },
            { ep: 4, rating: 8.5 }, { ep: 5, rating: 8.7 }, { ep: 6, rating: 8.7 },
            { ep: 7, rating: 8.5 }, { ep: 8, rating: 8.4 }, { ep: 9, rating: 8.4 },
            { ep: 10, rating: 8.5 }, { ep: 11, rating: 8.3 }, { ep: 12, rating: 8.5 },
            { ep: 13, rating: 8.7 }, { ep: 14, rating: 8.5 }, { ep: 15, rating: 8.5 },
            { ep: 16, rating: 8.5 }, { ep: 17, rating: 8.5 }, { ep: 18, rating: 8.6 },
            { ep: 19, rating: 8.6 }, { ep: 20, rating: 8.7 }, { ep: 21, rating: 8.7 },
            { ep: 22, rating: 8.7 }
          ]},
          { season: 7, episodes: [
            { ep: 1, rating: 8.3 }, { ep: 2, rating: 8.2 }, { ep: 3, rating: 8.3 },
            { ep: 4, rating: 8.5 }, { ep: 5, rating: 8.4 }, { ep: 6, rating: 8.6 },
            { ep: 7, rating: 8.6 }, { ep: 8, rating: 8.6 }, { ep: 9, rating: 8.5 },
            { ep: 10, rating: 8.5 }, { ep: 11, rating: 8.7 }, { ep: 12, rating: 8.7 },
            { ep: 13, rating: 8.8 }, { ep: 14, rating: 8.8 }, { ep: 15, rating: 8.8 },
            { ep: 16, rating: 9.8 }, { ep: 17, rating: 8.3 }, { ep: 18, rating: 8.2 },
            { ep: 19, rating: 8.2 }, { ep: 20, rating: 8.3 }, { ep: 21, rating: 8.4 },
            { ep: 22, rating: 8.4 }, { ep: 23, rating: 8.4 }, { ep: 24, rating: 8.5 },
            { ep: 25, rating: 8.5 }, { ep: 26, rating: 8.7 }
          ]},
          { season: 8, episodes: [
            { ep: 1, rating: 7.8 }, { ep: 2, rating: 7.6 }, { ep: 3, rating: 7.7 },
            { ep: 4, rating: 7.6 }, { ep: 5, rating: 7.7 }, { ep: 6, rating: 7.7 },
            { ep: 7, rating: 7.9 }, { ep: 8, rating: 7.9 }, { ep: 9, rating: 7.9 },
            { ep: 10, rating: 7.9 }, { ep: 11, rating: 7.8 }, { ep: 12, rating: 8.0 },
            { ep: 13, rating: 8.2 }, { ep: 14, rating: 7.9 }, { ep: 15, rating: 7.9 },
            { ep: 16, rating: 7.9 }, { ep: 17, rating: 8.1 }, { ep: 18, rating: 8.0 },
            { ep: 19, rating: 8.0 }, { ep: 20, rating: 8.0 }, { ep: 21, rating: 8.0 },
            { ep: 22, rating: 8.0 }, { ep: 23, rating: 8.1 }, { ep: 24, rating: 8.1 }
          ]},
          { season: 9, episodes: [
            { ep: 1, rating: 8.0 }, { ep: 2, rating: 7.9 }, { ep: 3, rating: 7.8 },
            { ep: 4, rating: 8.0 }, { ep: 5, rating: 8.0 }, { ep: 6, rating: 8.2 },
            { ep: 7, rating: 8.0 }, { ep: 8, rating: 8.0 }, { ep: 9, rating: 8.1 },
            { ep: 10, rating: 8.0 }, { ep: 11, rating: 8.0 }, { ep: 12, rating: 7.9 },
            { ep: 13, rating: 8.1 }, { ep: 14, rating: 8.2 }, { ep: 15, rating: 8.3 },
            { ep: 16, rating: 8.4 }, { ep: 17, rating: 8.4 }, { ep: 18, rating: 8.4 },
            { ep: 19, rating: 8.6 }, { ep: 20, rating: 8.7 }, { ep: 21, rating: 8.7 },
            { ep: 22, rating: 9.8 }, { ep: 23, rating: 9.8 }
          ]}
        ]
      }
    }
  ];
}
