import React, { useMemo } from 'react';
import './Heatmap.css';

/**
 * Map a rating (0–10) to a vibrant CSS colour using a perceptual multi-stop
 * gradient. The scale is highly sensitive — even 0.1-point differences produce
 * visibly distinct colours, especially in the crowded 7–10 band.
 *
 * Colour stops (rating → hue, saturation, lightness):
 *   ≤ 5.0  →  deep red        hsl(0,  80%, 28%)
 *   6.0    →  orange-red      hsl(15, 85%, 35%)
 *   7.0    →  amber           hsl(35, 90%, 42%)
 *   7.5    →  gold            hsl(48, 92%, 46%)
 *   8.0    →  yellow-green    hsl(72, 88%, 40%)
 *   8.5    →  lime            hsl(90, 85%, 36%)
 *   9.0    →  green           hsl(112,80%, 32%)
 *   9.5    →  vivid green     hsl(128,85%, 28%)
 *  10.0    →  deep emerald    hsl(145,90%, 24%)
 *
 * Between stops we linearly interpolate all three HSL channels so every
 * 0.1-point step shifts colour noticeably.
 */
function ratingToColor(rating) {
  if (!rating || rating === 0) return 'var(--heat-0)';

  // Colour stop table: [minRating, hue, sat%, lit%]
  const stops = [
    [5.0,   0,  80, 28],
    [6.0,  15,  85, 35],
    [7.0,  35,  90, 42],
    [7.5,  48,  92, 46],
    [8.0,  72,  88, 40],
    [8.5,  90,  85, 36],
    [9.0, 112,  80, 32],
    [9.5, 128,  85, 28],
    [10.0,145,  90, 24],
  ];

  // Clamp to realistic IMDB range
  const r = Math.max(5.0, Math.min(10.0, rating));

  // Find bracket
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (r >= stops[i][0] && r <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }

  const span = hi[0] - lo[0];
  const t = span === 0 ? 0 : (r - lo[0]) / span;

  const hue = Math.round(lo[1] + t * (hi[1] - lo[1]));
  const sat = Math.round(lo[2] + t * (hi[2] - lo[2]));
  const lit = Math.round(lo[3] + t * (hi[3] - lo[3]));

  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function ratingLabel(rating) {
  if (!rating) return 'No rating';
  return `${rating.toFixed(1)}/10`;
}

export default function Heatmap({ seasons }) {
  const maxEps = useMemo(
    () => Math.max(1, ...seasons.map((s) => s.episodes.length)),
    [seasons]
  );

  if (!seasons.length) {
    return (
      <div className="heatmap heatmap--empty">
        <p>Loading heatmap…</p>
      </div>
    );
  }

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-legend">
        <span className="legend-label">Episode ratings</span>
        <div className="legend-scale">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Low</span>
          <div className="legend-gradient" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>High</span>
        </div>
      </div>

      <div className="heatmap" role="table" aria-label="Episode rating heatmap">
        {/* Column headers: episode numbers */}
        <div className="heatmap-row heatmap-header" role="row">
          <div className="heatmap-season-label" role="columnheader">S</div>
          {Array.from({ length: maxEps }, (_, i) => (
            <div key={i} className="heatmap-ep-header" role="columnheader">
              {i + 1}
            </div>
          ))}
        </div>

        {seasons.map((season) => (
          <div key={season.season} className="heatmap-row" role="row">
            <div className="heatmap-season-label" role="rowheader">
              {season.season}
            </div>
            {Array.from({ length: maxEps }, (_, i) => {
              const ep = season.episodes[i];
              return (
                <div
                  key={i}
                  className={`heatmap-cell ${ep ? '' : 'heatmap-cell--empty'}`}
                  style={ep ? { background: ratingToColor(ep.rating) } : {}}
                  role="cell"
                  title={ep ? `S${season.season}E${ep.ep} — ${ratingLabel(ep.rating)}` : ''}
                  aria-label={ep ? `Season ${season.season} Episode ${ep.ep}: ${ratingLabel(ep.rating)}` : ''}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
