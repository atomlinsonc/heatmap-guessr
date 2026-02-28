import React from 'react';
import './CluePanel.css';

function ClueItem({ label, value }) {
  return (
    <div className="clue-item">
      <span className="clue-label">{label}</span>
      <span className="clue-value">{value}</span>
    </div>
  );
}

function LockedClue({ label }) {
  return (
    <div className="clue-locked">
      <span className="clue-lock-icon" aria-hidden="true">🔒</span>
      <span className="clue-locked-text">{label} — guess to unlock</span>
    </div>
  );
}

export default function CluePanel({ clues, attemptsUsed }) {
  const { tier1, tier2, tier3, tier4, tier5 } = clues;

  return (
    <div className="clue-panel">
      <h2 className="clue-panel-title">
        Clues
        <span className="clue-panel-count">
          {attemptsUsed}/5 guesses
        </span>
      </h2>

      <div className="clue-section">
        {tier1
          ? <ClueItem label="Premiere year" value={tier1.premiereYear} />
          : <LockedClue label="Premiere year" />}
      </div>

      <div className="clue-section">
        {tier2
          ? <ClueItem label="Runtime" value={tier2.runtimeBucket} />
          : <LockedClue label="Runtime" />}
      </div>

      <div className="clue-section">
        {tier3
          ? <ClueItem label="Genre" value={tier3.genre} />
          : <LockedClue label="Genre" />}
      </div>

      <div className="clue-section">
        {tier4
          ? tier4.leadActor
            ? <ClueItem label="Lead actor" value={tier4.leadActor} />
            : null
          : <LockedClue label="Lead actor" />}
      </div>

      <div className="clue-section">
        {tier5
          ? tier5.tagline
            ? <ClueItem label="Tagline" value={`"${tier5.tagline}"`} />
            : null
          : <LockedClue label="Tagline" />}
      </div>
    </div>
  );
}
