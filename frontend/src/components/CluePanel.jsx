import React from 'react';
import './CluePanel.css';

const TIER_LABELS = {
  tier1: ['Premiere year', 'Runtime'],
  tier2: ['Network / Streamer'],
  tier3: ['Genre', 'Status'],
  tier4: ['Top episode', 'Lead actor'],
};

function ClueItem({ label, value }) {
  return (
    <div className="clue-item">
      <span className="clue-label">{label}</span>
      <span className="clue-value">{value}</span>
    </div>
  );
}

function LockedClue({ labels }) {
  return (
    <div className="clue-locked">
      <span className="clue-lock-icon" aria-hidden="true">🔒</span>
      <span className="clue-locked-text">{labels.join(' & ')} — guess to unlock</span>
    </div>
  );
}

export default function CluePanel({ clues, attemptsUsed }) {
  const { tier1, tier2, tier3, tier4 } = clues;

  return (
    <div className="clue-panel">
      <h2 className="clue-panel-title">
        Clues
        <span className="clue-panel-count">
          {attemptsUsed}/5 guesses
        </span>
      </h2>

      <div className="clue-section">
        {tier1 ? (
          <>
            <ClueItem label="Premiere year" value={tier1.premiereYear} />
            <ClueItem label="Runtime" value={tier1.runtimeBucket} />
          </>
        ) : (
          <LockedClue labels={TIER_LABELS.tier1} />
        )}
      </div>

      <div className="clue-section">
        {tier2 ? (
          <ClueItem label="Network / Streamer" value={tier2.network} />
        ) : (
          <LockedClue labels={TIER_LABELS.tier2} />
        )}
      </div>

      <div className="clue-section">
        {tier3 ? (
          <>
            <ClueItem label="Genre" value={tier3.genre} />
            <ClueItem
              label="Status"
              value={`${tier3.status}`}
            />
          </>
        ) : (
          <LockedClue labels={TIER_LABELS.tier3} />
        )}
      </div>

      <div className="clue-section">
        {tier4 ? (
          <>
            <ClueItem label="Top episode" value={`"${tier4.topEpisodeTitle}"`} />
            <ClueItem label="Lead actor" value={tier4.topEpisodeLead} />
          </>
        ) : (
          <LockedClue labels={TIER_LABELS.tier4} />
        )}
      </div>
    </div>
  );
}
