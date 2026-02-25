import React, { useState, useEffect } from 'react';
import './PastGames.css';

const API = import.meta.env.VITE_API_URL ?? '';

async function apiFetch(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatDate(dateKey) {
  const [y, m, d] = dateKey.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function PastGames({ onSelectGame, onClose }) {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/puzzle/archive')
      .then(data => setArchive(data.archive ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="past-games">
        <div className="past-games-header">
          <h2>Past Games</h2>
          <button className="past-games-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="past-games-loading">Loading archive…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="past-games">
        <div className="past-games-header">
          <h2>Past Games</h2>
          <button className="past-games-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="past-games-error">Failed to load archive.</p>
      </div>
    );
  }

  return (
    <div className="past-games">
      <div className="past-games-header">
        <h2>Past Games</h2>
        <button className="past-games-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <p className="past-games-subtitle">
        {archive.length} past puzzle{archive.length !== 1 ? 's' : ''} — click any to replay
      </p>
      <div className="past-games-list">
        {archive.length === 0 && (
          <p className="past-games-empty">No past games yet — check back tomorrow!</p>
        )}
        {archive.map(entry => (
          <button
            key={entry.dateKey}
            className="past-game-row"
            onClick={() => onSelectGame(entry.dateKey)}
          >
            <span className="past-game-date">{formatDate(entry.dateKey)}</span>
            <span className="past-game-title">{entry.title}</span>
            <span className="past-game-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
