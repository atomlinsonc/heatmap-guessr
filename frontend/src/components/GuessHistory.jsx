import React from 'react';
import './GuessHistory.css';

export default function GuessHistory({ guesses }) {
  if (!guesses.length) return null;

  return (
    <div className="guess-history">
      <h3 className="guess-history-title">Previous guesses</h3>
      <ul className="guess-history-list">
        {guesses.map((g, i) => (
          <li key={i} className={`guess-history-item ${g.correct ? 'item--correct' : 'item--wrong'}`}>
            <span className="guess-history-icon" aria-hidden="true">
              {g.correct ? '✓' : '✗'}
            </span>
            <span className="guess-history-name">{g.title}</span>
            <span className="guess-history-num">#{i + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
