import React from 'react';
import './Header.css';

export default function Header({ dateKey, onPastGames }) {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-grid" aria-hidden="true">
          <span style={{ background: '#22c55e' }} />
          <span style={{ background: '#86efac' }} />
          <span style={{ background: '#ef4444' }} />
          <span style={{ background: '#f59e0b' }} />
          <span style={{ background: '#22c55e' }} />
          <span style={{ background: '#6366f1' }} />
        </span>
        <div>
          <h1 className="header-title">Heatmap Guessr</h1>
          <p className="header-sub">TV Edition</p>
        </div>
      </div>

      <div className="header-meta">
        {dateKey && (
          <span className="header-date">{dateKey}</span>
        )}
        {onPastGames && (
          <button className="header-past-btn" onClick={onPastGames} title="Past Games">
            📅
          </button>
        )}
        <a
          className="header-help"
          href="#how-to-play"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('how-to-play-dialog')?.showModal();
          }}
          aria-label="How to play"
        >
          ?
        </a>
      </div>

      <dialog id="how-to-play-dialog" className="dialog" onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}>
        <div className="dialog-inner">
          <h2>How to Play</h2>
          <ul>
            <li>You're shown an episode-rating <strong>heatmap</strong> for a mystery TV series.</li>
            <li>Each row is a season; each cell is an episode. Colour = rating (green = high, red = low).</li>
            <li>Guess the series from the <strong>autocomplete list</strong>. You have <strong>5 guesses</strong>.</li>
            <li>Each wrong guess reveals a new clue.</li>
            <li>A new puzzle drops every day at <strong>midnight Chicago time</strong>.</li>
          </ul>
          <h3>Clue order</h3>
          <ol>
            <li>Premiere year</li>
            <li>Runtime</li>
            <li>Genre</li>
            <li>Lead actor</li>
            <li>Tagline</li>
          </ol>
          <button className="btn-primary" onClick={() => {
            document.getElementById('how-to-play-dialog')?.close();
          }}>Got it</button>
        </div>
      </dialog>
    </header>
  );
}
