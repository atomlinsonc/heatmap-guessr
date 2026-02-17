import React, { useMemo } from 'react';
import './Heatmap.css';

/** Map a rating (0–10) to a CSS hsl colour. */
function ratingToColor(rating) {
  if (!rating || rating === 0) return 'var(--heat-0)';
  // clamp to 5–10 range which is the realistic IMDB band
  const t = Math.max(0, Math.min(1, (rating - 5) / 5));
  // 0 → red (0°), 0.5 → amber (45°), 1 → green (120°)
  const hue = Math.round(t * 120);
  const sat = 70 + Math.round(t * 20);
  const lit = 35 + Math.round(t * 20);
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
