# Heatmap Guessr: TV Edition

A daily web game in the spirit of Wordle and NYT Connections. Players identify a mystery TV series from its **episode-rating heatmap**, unlocking clues with each wrong guess.

![Game screenshot placeholder](docs/screenshot.png)

## Gameplay

1. You see a grid: rows = seasons, columns = episodes, color = IMDB rating (green = high, red = low).
2. Guess the series from the autocomplete list. You have **5 guesses**.
3. Each wrong guess unlocks one clue tier:
   - Guess 1 wrong → premiere year + runtime
   - Guess 2 wrong → network / streamer
   - Guess 3 wrong → genre + show status
   - Guess 4 wrong → highest-rated episode title + lead actor
   - Guess 5 wrong → answer revealed
4. Correct guess at any point = instant win.
5. A new puzzle drops every day at **midnight Chicago time**.

---

## Architecture

```
heatmap-guessr/
├── backend/          # Express API
│   └── src/
│       ├── index.js          # Server entry point
│       ├── puzzle.js         # Deterministic puzzle selection + payload builder
│       ├── normalize.js      # Title normalization for matching
│       ├── titles.js         # Autocomplete list loader
│       └── routes/
│           ├── puzzle.js     # GET /api/puzzle/today, GET /api/puzzle/titles
│           └── guess.js      # POST /api/guess
├── frontend/         # React + Vite
│   └── src/
│       ├── App.jsx
│       ├── hooks/useGame.js  # All game state, API calls, persistence
│       ├── components/       # Heatmap, CluePanel, GuessInput, GameOver, …
│       └── utils/            # normalize, storage (localStorage), share
├── scripts/          # Data pipeline
│   ├── fetchShows.js         # TMDB API → data/raw_shows.json
│   ├── buildPuzzlePool.js    # raw_shows.json → data/puzzle_pool.json
│   └── show_list.json        # Curated list of ~100 TMDB show IDs
├── data/
│   ├── raw_shows.json        # (generated, git-ignored)
│   └── puzzle_pool.json      # (generated, git-ignored — or committed)
└── tests/
    ├── backend/              # Jest tests for puzzle logic, normalize, API routes
    └── frontend/             # Vitest tests for utils
```

### Daily puzzle determinism

```
date_key  = YYYY-MM-DD in America/Chicago timezone
index     = parseInt(sha256(date_key + SALT)[0:8], 16) % pool_size
```

Same result for every user on the same calendar day, regardless of their local timezone.

---

## Quick start (demo mode)

The app ships with **5 built-in demo shows** (Breaking Bad, The Wire, The Sopranos, Game of Thrones, The Office) so you can run it immediately without a TMDB API key.

```bash
# 1. Clone and install
git clone https://github.com/atomlinsonc/heatmap-guessr.git
cd heatmap-guessr
npm install

# 2. Start both backend + frontend (hot-reload)
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

---

## Full setup with real data (100-show pool)

### Prerequisites
- Node.js 20+
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### Steps

```bash
# 1. Install deps
npm install

# 2. Fetch show data from TMDB (~5 min, ~100 API calls)
TMDB_API_KEY=your_key_here npm run fetch-data

# 3. Build the puzzle pool
npm run build-pool

# 4. Start
npm run dev
```

### Customize the show list

Edit `scripts/show_list.json` to add/remove shows. Each entry needs:
```json
{ "tmdbId": 1396, "leadActor": "Bryan Cranston", "note": "Breaking Bad" }
```

Find TMDB IDs at `https://www.themoviedb.org/tv/<id>`.

---

## Environment variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | API server port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `` (empty = same origin) | Backend URL for production |

---

## API reference

### `GET /api/puzzle/today?attempts=N`
Returns today's safe puzzle payload. `attempts` (0–5) controls which clue tiers are included.

**Response:**
```json
{
  "dateKey": "2024-01-15",
  "puzzle": {
    "id": "breaking-bad",
    "heatmap": { "seasons": [...] },
    "totalSeasons": 5,
    "totalEpisodes": 62,
    "clues": {
      "tier1": { "premiereYear": 2008, "runtimeBucket": "45 min" },
      "tier2": { "network": "AMC" }
    }
  }
}
```

### `GET /api/puzzle/titles`
Returns the frozen autocomplete list.

### `POST /api/guess`
**Body:** `{ "guess": "Breaking Bad", "attemptsUsed": 0 }`

**Response:** `{ "correct": true, "attemptsUsed": 1, "puzzle": {...}, "answer"?: "..." }`

`answer` is only present when `correct === true` or the game is over (attemptsUsed === 5).

---

## Running tests

```bash
# All tests
npm test

# Backend only
npm test --workspace=backend

# Frontend only
npm test --workspace=frontend
```

---

## Deployment

### Backend (Railway / Fly.io / Render)
```bash
cd backend
npm start
```
Set `FRONTEND_URL` env var to your production frontend URL.

### Frontend (Vercel / Netlify / Cloudflare Pages)
```bash
cd frontend
npm run build   # outputs to frontend/dist/
```
Set `VITE_API_URL` to your production backend URL (e.g. `https://api.heatmapguessr.com`).

---

## Adding shows to the pool

1. Find the TMDB ID for the show.
2. Add it to `scripts/show_list.json`.
3. Re-run `npm run fetch-data && npm run build-pool`.
4. Deploy the updated `data/puzzle_pool.json`.

The puzzle selector will automatically incorporate the new shows the next time it cycles.

---

## License

MIT
